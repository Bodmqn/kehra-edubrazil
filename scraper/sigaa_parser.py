"""
SIGAA Parser — Handles ~70 Brazilian universities using the SIGAA JSF framework.

URL pattern: sigaa.*.edu.br/sigaa/public/processo_seletivo/lista.jsf
Extracts: program name, level (Mestrado/Doutorado), deadline, status, edital PDF link
"""

import os
import re
import logging
from datetime import datetime
from typing import Optional

import requests
from bs4 import BeautifulSoup
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

SIGAA_BASE_PATHS = [
    "/sigaa/public/processo_seletivo/lista.jsf?aba=p-stricto&nivel=S",
    "/sigaa/public/processo_seletivo/lista.jsf?nivel=S&aba=p-stricto",
    "/sigaa/public/processo_seletivo/lista.jsf?aba=p-processo&nivel=S",
]


class SIGAAParser:
    def __init__(self, supabase: Client):
        self.supabase = supabase
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

    def fetch_universities(self) -> list[dict]:
        """Fetch all universities from Supabase that have SIGAA URLs."""
        response = self._execute(self.supabase.table("universities").select("*"))
        return response.data

    def is_sigaa_url(self, url: str) -> bool:
        """Check if a URL follows the SIGAA pattern."""
        return "sigaa" in url.lower() and "lista.jsf" in url.lower()

    def parse_listing_page(self, url: str) -> list[dict]:
        """Fetch and parse a SIGAA listing page for programs."""
        programs = []

        try:
            resp = self.session.get(url, timeout=30)
            resp.raise_for_status()
        except Exception as e:
            logger.error(f"Failed to fetch {url}: {e}")
            return programs

        soup = BeautifulSoup(resp.text, "lxml")

        # SIGAA typically uses HTML tables with class "listagem"
        table = soup.find("table", class_=re.compile(r"listagem"))
        if not table:
            # Try finding any table with program-related content
            table = soup.find("table")
            if not table:
                logger.warning(f"No table found at {url}")
                return programs

        rows = table.find_all("tr")[1:]  # Skip header row

        for row in rows:
            cells = row.find_all("td")
            if len(cells) < 3:
                continue

            program = self._parse_row(cells, url)
            if program:
                programs.append(program)

        # Handle pagination (JSF view state)
        next_page = self._get_next_page(soup, url)
        if next_page:
            programs.extend(self.parse_listing_page(next_page))

        return programs

    def _parse_row(self, cells: list, base_url: str) -> Optional[dict]:
        """Extract program data from a table row."""
        try:
            name_cell = cells[0]
            name = name_cell.get_text(strip=True)

            # Determine level
            level = "Ambos"
            if "MESTRADO" in name.upper():
                level = "Mestrado"
            elif "DOUTORADO" in name.upper():
                level = "Doutorado"

            # Extract status
            status = "Aberto"
            for cell in cells:
                text = cell.get_text(strip=True).upper()
                if "FECHADO" in text or "ENCERRADO" in text:
                    status = "Fechado"
                elif "EM BREVE" in text or "PROXIMAMENTE" in text:
                    status = "Em Breve"

            # Extract deadline date
            deadline = None
            for cell in cells:
                text = cell.get_text(strip=True)
                date_match = re.search(
                    r"(\d{2})/(\d{2})/(\d{4})", text
                )
                if date_match:
                    day, month, year = date_match.groups()
                    deadline = f"{year}-{month}-{day}"

            # Extract edital PDF link
            edital_url = None
            for cell in cells:
                link = cell.find("a", href=re.compile(r"\.pdf", re.I))
                if link:
                    href = link.get("href", "")
                    edital_url = href if href.startswith("http") else base_url + href

            return {
                "name": name,
                "level": level,
                "field": None,
                "deadline": deadline,
                "status": status,
                "edital_url": edital_url,
            }

        except Exception as e:
            logger.warning(f"Error parsing row: {e}")
            return None

    def _get_next_page(self, soup: BeautifulSoup, current_url: str) -> Optional[str]:
        """Find the next page link in JSF pagination."""
        next_link = soup.find("a", string=re.compile(r"Próximo|Next|>"))
        if next_link:
            href = next_link.get("href", "")
            if href:
                return href if href.startswith("http") else current_url.rsplit("/", 1)[0] + "/" + href
        return None

    def run(self):
        """Run the parser for all SIGAA universities."""
        universities = self.fetch_universities()
        total_programs = 0

        for uni in universities:
            if not self.is_sigaa_url(uni.get("sigaa_url", "")):
                continue

            logger.info(f"Scraping {uni['name']} ({uni['acronym']})...")

            try:
                programs = self.parse_listing_page(uni["sigaa_url"])
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
                    self._execute(self.supabase.table("programs").upsert(rows))

                # Log success
                self._execute(self.supabase.table("scrape_logs").insert({
                    "university_id": uni["id"],
                    "status": "success" if programs else "partial",
                    "programs_found": len(programs),
                    "scraped_at": datetime.utcnow().isoformat(),
                }))

                total_programs += len(programs)

            except Exception as e:
                logger.error(f"  Error scraping {uni['name']}: {e}")
                try:
                    self._execute(self.supabase.table("scrape_logs").insert({
                        "university_id": uni["id"],
                        "status": "error",
                        "programs_found": 0,
                        "errors": str(e),
                        "scraped_at": datetime.utcnow().isoformat(),
                    }))
                except Exception as log_e:
                    logger.error(f"  Failed to log scrape error: {log_e}")

        logger.info(f"Done. Total programs scraped: {total_programs}")


if __name__ == "__main__":
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_KEY")

    if not supabase_url or not supabase_key:
        logger.error("SUPABASE_URL and SUPABASE_SERVICE_KEY must be set")
        exit(1)

    supabase: Client = create_client(supabase_url, supabase_key)
    parser = SIGAAParser(supabase)
    parser.run()
