import os
import re
import time
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

WIKIPEDIA_API = "https://en.wikipedia.org/w/api.php"


class WikipediaScraper:
    def __init__(self, supabase: Client):
        self.supabase = supabase
        self.session = requests.Session()
        self.session.headers.update({
            "User-Agent": "KehraEduBrazil/1.0 (University scraper; contact@kehra.com.br)"
        })
        self._last_request = 0.0

    def _execute(self, query) -> dict:
        resp = query.execute()
        if resp.error:
            logger.error(f"Supabase error: {resp.error}")
            raise RuntimeError(str(resp.error))
        return resp

    def _rate_limit(self):
        """Ensure at most 1 request per second to Wikipedia API."""
        elapsed = time.time() - self._last_request
        if elapsed < 1.0:
            time.sleep(1.0 - elapsed)
        self._last_request = time.time()

    def search_wikipedia(self, query: str) -> Optional[str]:
        self._rate_limit()
        params = {
            "action": "query",
            "format": "json",
            "list": "search",
            "srsearch": f"{query} university Brazil",
            "srlimit": 3,
            "srprop": "",
        }
        try:
            resp = self.session.get(WIKIPEDIA_API, params=params, timeout=15)
            data = resp.json()
            pages = data.get("query", {}).get("search", [])
            if pages:
                return pages[0]["title"]
        except Exception as e:
            logger.warning(f"Wikipedia search failed for {query}: {e}")
        return None

    def get_extract(self, title: str) -> Optional[dict]:
        self._rate_limit()
        params = {
            "action": "query",
            "format": "json",
            "titles": title,
            "prop": "extracts|info",
            "exintro": True,
            "explaintext": True,
            "inprop": "url",
        }
        try:
            resp = self.session.get(WIKIPEDIA_API, params=params, timeout=15)
            data = resp.json()
            pages = data.get("query", {}).get("pages", {})
            for page_id, page_data in pages.items():
                if page_id == "-1":
                    continue
                return {
                    "title": page_data.get("title", title),
                    "extract": page_data.get("extract", ""),
                    "url": page_data.get("fullurl", f"https://en.wikipedia.org/wiki/{title.replace(' ', '_')}"),
                }
        except Exception as e:
            logger.warning(f"Failed to get extract for {title}: {e}")
        return None

    def clean_extract(self, text: str) -> str:
        text = re.sub(r"\s+", " ", text).strip()
        return text[:5000] if len(text) > 5000 else text

    def run(self):
        resp = self._execute(self.supabase.table("universities").select("id, name, acronym"))
        universities = resp.data
        success = 0
        skipped = 0

        for uni in universities:
            logger.info(f"Fetching description for {uni['name']}...")

            title = self.search_wikipedia(f"{uni['name']} ({uni['acronym']})")
            if not title:
                title = self.search_wikipedia(uni['name'])

            if title:
                result = self.get_extract(title)
                if result and result.get("extract"):
                    cleaned = self.clean_extract(result["extract"])
                    try:
                        self._execute(self.supabase.table("university_details").upsert({
                            "university_id": uni["id"],
                            "about_text": cleaned,
                            "wikipedia_url": result["url"],
                            "scraped_at": datetime.utcnow().isoformat(),
                        }))
                        logger.info(f"  ✓ ({len(cleaned)} chars)")
                        success += 1
                    except Exception as e:
                        logger.error(f"  ✗ Failed to save: {e}")
                else:
                    logger.warning(f"  ✗ No extract for '{title}'")
                    skipped += 1
            else:
                logger.warning(f"  ✗ No Wikipedia page found for {uni['name']}")
                skipped += 1

        logger.info(f"Done. {success} saved, {skipped} skipped")

if __name__ == "__main__":
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_KEY")
    if not supabase_url or not supabase_key:
        logger.error("SUPABASE_URL and SUPABASE_SERVICE_KEY must be set")
        exit(1)
    supabase: Client = create_client(supabase_url, supabase_key)
    scraper = WikipediaScraper(supabase)
    scraper.run()
