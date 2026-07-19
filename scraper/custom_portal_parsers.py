import logging
import re
from datetime import datetime
from typing import Optional

import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin

logger = logging.getLogger(__name__)

REGISTRY: dict[str, callable] = {}

SESSION = requests.Session()
SESSION.headers.update({
    "User-Agent": "KehraEduBrazil/1.0 (University scraper; contact@kehra.com.br)"
})


def register(acronym: str):
    def wrapper(fn):
        REGISTRY[acronym] = fn
        return fn
    return wrapper


def _fetch(url: str, timeout: int = 20) -> Optional[str]:
    try:
        resp = SESSION.get(url, timeout=timeout)
        resp.raise_for_status()
        return resp.text
    except Exception as e:
        logger.warning(f"  Custom parser fetch error for {url}: {e}")
        return None


def _extract_deadline(text: str) -> Optional[str]:
    m = re.search(r"(\d{2})/(\d{2})/(\d{4})", text)
    if m:
        return f"{m.group(3)}-{m.group(2)}-{m.group(1)}"

    m = re.search(r"(\d{4})-(\d{2})-(\d{2})", text)
    if m:
        return f"{m.group(1)}-{m.group(2)}-{m.group(3)}"
    return None


def _infer_level(text: str) -> str:
    upper = text.upper()
    has_mestrado = "MESTRADO" in upper
    has_doutorado = "DOUTORADO" in upper
    if has_mestrado and has_doutorado:
        return "Ambos"
    if has_mestrado:
        return "Mestrado"
    if has_doutorado:
        return "Doutorado"
    return "Ambos"


def _infer_status(text: str) -> str:
    upper = text.upper()
    if "FECHADO" in upper or "ENCERRADO" in upper:
        return "Fechado"
    if "EM BREVE" in upper or "PROXIMAMENTE" in upper:
        return "Em Breve"
    return "Aberto"


def _upsert_programs(supabase, uni: dict, programs: list[dict]):
    if not programs:
        return 0
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
    BATCH_SIZE = 50
    for i in range(0, len(rows), BATCH_SIZE):
        chunk = rows[i:i + BATCH_SIZE]
        supabase.table("programs").upsert(chunk).execute()
    return len(programs)


# ── Parser: UERR ──────────────────────────────────────────

@register("UERR")
def parse_uerr(supabase, uni: dict) -> int:
    logger.info(f"UERR: scraping {uni['name']}")
    html = _fetch("https://uerr.edu.br/editais/")
    if not html:
        return 0

    soup = BeautifulSoup(html, "lxml")
    programs = []

    tables = soup.find_all("table")
    for table in tables:
        rows = table.find_all("tr")[1:]
        for row in rows:
            cells = row.find_all("td")
            if len(cells) < 2:
                continue
            text = " ".join(c.get_text(strip=True) for c in cells)
            name = cells[0].get_text(strip=True)
            if not name or len(name) < 5:
                continue
            deadline = None
            edital_url = None
            for cell in cells:
                d = _extract_deadline(cell.get_text(strip=True))
                if d:
                    deadline = d
                link = cell.find("a", href=re.compile(r"\.pdf", re.I))
                if link:
                    href = link.get("href", "")
                    edital_url = href if href.startswith("http") else urljoin("https://uerr.edu.br/editais/", href)

            programs.append({
                "name": name,
                "level": _infer_level(text),
                "field": None,
                "deadline": deadline,
                "status": _infer_status(text),
                "edital_url": edital_url,
            })

    if not programs:
        articles = soup.find_all(["article", "div", "li"], class_=re.compile(r"post|edital|item", re.I))
        for art in articles:
            title_el = art.find(["h2", "h3", "h4", "a"])
            if not title_el:
                continue
            name = title_el.get_text(strip=True)
            if not name or len(name) < 5:
                continue
            text = art.get_text(" ", strip=True)
            deadline = _extract_deadline(text)
            link = art.find("a", href=True)
            edital_url = None
            if link:
                href = link["href"]
                edital_url = href if href.startswith("http") else urljoin("https://uerr.edu.br/editais/", href)
            programs.append({
                "name": name,
                "level": _infer_level(text),
                "field": None,
                "deadline": deadline,
                "status": _infer_status(text),
                "edital_url": edital_url,
            })

    count = _upsert_programs(supabase, uni, programs)
    logger.info(f"  UERR: {count} programs found")
    return count


# ── Generic edital table parser ───────────────────────────

def try_generic_edital_table(supabase, uni: dict) -> int:
    url = uni.get("sigaa_url", "") or uni.get("school_url", "")
    if not url:
        return 0

    logger.info(f"Generic edital parser trying {uni['acronym']} at {url}")
    html = _fetch(url, timeout=15)
    if not html:
        return 0

    soup = BeautifulSoup(html, "lxml")
    programs = []

    tables = soup.find_all("table")
    for table in tables:
        rows = table.find_all("tr")
        header = rows[0] if rows else None
        if header:
            header_text = header.get_text(" ", strip=True).lower()
            if not any(kw in header_text for kw in ["edital", "programa", "curso", "seleção", "inscrição", "processo", "mestrado", "doutorado", "pós"]):
                continue
        for row in rows[1:]:
            cells = row.find_all("td")
            if len(cells) < 2:
                continue
            name = cells[0].get_text(strip=True)
            if not name or len(name) < 5:
                continue
            text = " ".join(c.get_text(strip=True) for c in cells)
            deadline = None
            edital_url = None
            for cell in cells:
                d = _extract_deadline(cell.get_text(strip=True))
                if d:
                    deadline = d
                link = cell.find("a", href=re.compile(r"\.pdf", re.I))
                if link:
                    href = link.get("href", "")
                    edital_url = href if href.startswith("http") else urljoin(url, href)
            programs.append({
                "name": name,
                "level": _infer_level(text),
                "field": None,
                "deadline": deadline,
                "status": _infer_status(text),
                "edital_url": edital_url,
            })

    count = _upsert_programs(supabase, uni, programs) if programs else 0
    if count:
        logger.info(f"  Generic parser for {uni['acronym']}: {count} programs")
    return count


# ── Runner ─────────────────────────────────────────────────

def run_custom_parsers(supabase, universities: list[dict]) -> int:
    total = 0
    for uni in universities:
        parser = REGISTRY.get(uni["acronym"])
        if parser:
            try:
                count = parser(supabase, uni)
                total += count
                logger.info(f"Custom parser for {uni['acronym']}: {count} programs")
            except Exception as e:
                logger.error(f"Custom parser failed for {uni['acronym']}: {e}")
        else:
            try:
                count = try_generic_edital_table(supabase, uni)
                total += count
            except Exception as e:
                logger.error(f"Generic parser failed for {uni['acronym']}: {e}")
    return total
