import os
import re
import time
import logging
from datetime import datetime
from typing import Optional
from urllib.parse import urljoin, urlparse

import requests
from bs4 import BeautifulSoup
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

BASE_PATHS = [
    "/sigaa/public/processo_seletivo/lista.jsf?aba=p-stricto&nivel=S",
    "/sigaa/public/processo_seletivo/lista.jsf?nivel=S&aba=p-stricto",
    "/sigaa/public/processo_seletivo/lista.jsf?aba=p-processo&nivel=S",
    "/sigaa/public/processo_seletivo/lista.jsf?nivel=S&aba=p-processo",
]

BATCH_SIZE = 50
MAX_RETRIES = 3

# Prefixes to strip from raw program names (case-insensitive)
NAME_CLEANUP_PREFIXES = [
    r"notice of selection",
    r"edital (n[oº]?\s*)?\d+[\/\-\s]*\d{4}\s*[:\-–—]?\s*",
    r"edital de seleção",
    r"processo seletivo",
    r"aviso de (seleção|abertura)",
    r"chamada (pública|para seleção)",
    r"resultado final",
    r"homologação",
    r"seleção (para|de)?",
    r"inscrições (para|abertas)?",
]

# Suffixes to strip
NAME_CLEANUP_SUFFIXES = [
    r"selection",
    r"processo seletivo",
    r"edital de seleção",
    r"chamada pública",
    r"seleção (para|de)?\s*",
    r"inscrições (abertas|para)?\s*",
    r"(mestrado|doutorado)\s*(profissional)?\s*(acadêmico)?\s*$",
]


class SIGAAParser:
    def __init__(self, supabase: Client, skip_ids: set[str] | None = None):
        self.supabase = supabase
        self.skip_ids = skip_ids or set()
        self.session = requests.Session()
        self.session.headers.update({
            "User-Agent": "KehraEduBrazil/1.0 (University scraper; contact@kehra.com.br)"
        })

    def _execute(self, query) -> dict:
        resp = query.execute()
        if resp.error:
            logger.error(f"Supabase error: {resp.error}")
            raise RuntimeError(str(resp.error))
        return resp

    def _fetch_with_retry(self, url: str, timeout: int = 30) -> Optional[str]:
        for attempt in range(MAX_RETRIES):
            try:
                resp = self.session.get(url, timeout=timeout)
                if resp.status_code == 503:
                    logger.warning(f"  503 Service Unavailable on {url} (attempt {attempt + 1}/{MAX_RETRIES})")
                    if attempt < MAX_RETRIES - 1:
                        time.sleep(2 ** attempt)
                    continue
                resp.raise_for_status()
                return resp.text
            except requests.Timeout:
                logger.warning(f"  Timeout on {url} (attempt {attempt + 1}/{MAX_RETRIES})")
            except requests.ConnectionError:
                logger.warning(f"  Connection error on {url} (attempt {attempt + 1}/{MAX_RETRIES})")
            except Exception as e:
                logger.warning(f"  Error fetching {url}: {e} (attempt {attempt + 1}/{MAX_RETRIES})")
            if attempt < MAX_RETRIES - 1:
                time.sleep(2 ** attempt)
        return None

    def fetch_universities(self) -> list[dict]:
        resp = self._execute(self.supabase.table("universities").select("*"))
        return resp.data

    def is_sigaa_url(self, url: str) -> bool:
        return "sigaa" in url.lower() and "lista.jsf" in url.lower()

    def _normalize_sigaa_url(self, url: str) -> str:
        parsed = urlparse(url)
        path = parsed.path

        path = path.replace("/sigaa/sigaa/", "/sigaa/")

        if "/sigaa/" in path:
            idx = path.index("/sigaa/")
            path = path[:idx]

        scheme = parsed.scheme or "https"
        netloc = parsed.netloc or parsed.hostname or ""
        return f"{scheme}://{netloc}{path}" if path else f"{scheme}://{netloc}"

    def _clean_name(self, raw: str) -> str:
        cleaned = raw.strip()
        for pattern in NAME_CLEANUP_PREFIXES:
            cleaned = re.sub(rf"^(?:{pattern})\s*[:\-–—]?\s*", "", cleaned, flags=re.IGNORECASE).strip()
        for pattern in NAME_CLEANUP_SUFFIXES:
            cleaned = re.sub(rf"\s*[:\-–—]?\s*(?:{pattern})\s*$", "", cleaned, flags=re.IGNORECASE).strip()
        cleaned = re.sub(r"\s{2,}", " ", cleaned).strip()
        cleaned = re.sub(r"\s*[:\-–—]+\s*", " ", cleaned).strip()
        return cleaned or raw

    def resolve_sigaa_url(self, base_url: str) -> Optional[str]:
        normalized = self._normalize_sigaa_url(base_url)
        for path in BASE_PATHS:
            url = urljoin(normalized.rstrip("/") + "/", path.lstrip("/"))
            html = self._fetch_with_retry(url, timeout=15)
            if html and ("listagem" in html.lower() or "processo" in html.lower()):
                return url
        return None

    def parse_listing_page(self, url: str) -> list[dict]:
        programs = []
        html = self._fetch_with_retry(url)
        if not html:
            return programs

        soup = BeautifulSoup(html, "lxml")

        possible_tables = soup.find_all("table")
        table = None
        for t in possible_tables:
            if t.get("class") and any("listagem" in (c or "").lower() for c in t.get("class", [])):
                table = t
                break
        if not table and possible_tables:
            table = possible_tables[0]
        if not table:
            logger.warning(f"  No table found at {url}")
            return programs

        rows = table.find_all("tr")[1:]
        for row in rows:
            cells = row.find_all("td")
            if len(cells) < 3:
                continue
            program = self._parse_row(cells, url)
            if program:
                programs.append(program)

        next_page = self._get_next_page(soup, url)
        if next_page:
            programs.extend(self.parse_listing_page(next_page))

        return programs

    def _parse_row(self, cells: list, base_url: str) -> Optional[dict]:
        try:
            raw_name = cells[0].get_text(strip=True)
            level = "Ambos"
            if "MESTRADO" in raw_name.upper():
                level = "Mestrado"
            elif "DOUTORADO" in raw_name.upper():
                level = "Doutorado"
            name = self._clean_name(raw_name)

            status = "Aberto"
            for cell in cells:
                text = cell.get_text(strip=True).upper()
                if "FECHADO" in text or "ENCERRADO" in text:
                    status = "Fechado"
                elif "EM BREVE" in text or "PROXIMAMENTE" in text:
                    status = "Em Breve"

            deadline = None
            for cell in cells:
                m = re.search(r"(\d{2})/(\d{2})/(\d{4})", cell.get_text(strip=True))
                if m:
                    deadline = f"{m.group(3)}-{m.group(2)}-{m.group(1)}"

            edital_url = None
            for cell in cells:
                link = cell.find("a", href=re.compile(r"\.pdf", re.I))
                if link:
                    href = link.get("href", "")
                    edital_url = href if href.startswith("http") else urljoin(base_url, href)

            return {
                "name": name,
                "level": level,
                "field": None,
                "deadline": deadline,
                "status": status,
                "edital_url": edital_url,
            }
        except Exception as e:
            logger.warning(f"  Error parsing row: {e}")
            return None

    def _get_next_page(self, soup: BeautifulSoup, current_url: str) -> Optional[str]:
        next_link = soup.find("a", string=re.compile(r"Pr[oó]ximo|Next|>"))
        if next_link:
            href = next_link.get("href", "")
            if href:
                return href if href.startswith("http") else urljoin(current_url, href)
        return None

    def _upsert_batch(self, rows: list[dict]):
        for i in range(0, len(rows), BATCH_SIZE):
            chunk = rows[i:i + BATCH_SIZE]
            self._execute(self.supabase.table("programs").upsert(chunk))

    def run(self):
        universities = self.fetch_universities()
        total_programs = 0
        total_success = 0
        total_error = 0

        for uni in universities:
            sigaa = uni.get("sigaa_url", "")
            if not sigaa or not isinstance(sigaa, str) or not sigaa.startswith("http"):
                logger.warning(f"Skipping {uni['name']} ({uni['acronym']}): invalid SIGAA URL")
                continue

            if not self.is_sigaa_url(sigaa):
                logger.info(f"Skipping {uni['name']} ({uni['acronym']}): not a SIGAA URL (needs custom parser)")
                continue

            if str(uni["id"]) in self.skip_ids:
                logger.info(f"Skipping {uni['name']} ({uni['acronym']}): claimed by custom parser")
                continue

            if "lista.jsf" in sigaa:
                actual_url = sigaa
            else:
                actual_url = self.resolve_sigaa_url(sigaa) or sigaa

            logger.info(f"Scraping {uni['name']} ({uni['acronym']})...")

            try:
                programs = self.parse_listing_page(actual_url)
                logger.info(f"  Found {len(programs)} programs")

                if programs:
                    rows = [
                        {
                            "university_id": uni["id"],
                            "name": p["name"],
                            "level": p["level"],
                            "field": p["field"],
                            "deadline": p["deadline"],
                            "status": p["status"],
                            "edital_url": p["edital_url"],
                            "scraped_at": datetime.utcnow().isoformat(),
                        }
                        for p in programs
                    ]
                    self._upsert_batch(rows)

                self._execute(self.supabase.table("scrape_logs").insert({
                    "university_id": uni["id"],
                    "status": "success" if programs else "partial",
                    "programs_found": len(programs),
                    "scraped_at": datetime.utcnow().isoformat(),
                }))

                total_programs += len(programs)
                total_success += 1

            except Exception as e:
                logger.error(f"  Error scraping {uni['name']}: {e}")
                total_error += 1
                try:
                    self._execute(self.supabase.table("scrape_logs").insert({
                        "university_id": uni["id"],
                        "status": "error",
                        "programs_found": 0,
                        "errors": str(e)[:500],
                        "scraped_at": datetime.utcnow().isoformat(),
                    }))
                except Exception as log_e:
                    logger.error(f"  Failed to log scrape error: {log_e}")

        logger.info(
            f"Done. Total programs: {total_programs}, "
            f"success: {total_success}, errors: {total_error}"
        )
        return total_programs


if __name__ == "__main__":
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_KEY")
    if not supabase_url or not supabase_key:
        logger.error("SUPABASE_URL and SUPABASE_SERVICE_KEY must be set")
        exit(1)
    supabase: Client = create_client(supabase_url, supabase_key)
    parser = SIGAAParser(supabase)
    parser.run()
