import os
import logging
from datetime import datetime

from dotenv import load_dotenv
from supabase import create_client, Client

from sigaa_parser import SIGAAParser
from custom_portal_parsers import run_custom_parsers

load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def get_supabase() -> Client:
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_KEY")
    if not url or not key:
        raise RuntimeError("SUPABASE_URL and SUPABASE_SERVICE_KEY must be set")
    return create_client(url, key)


def run():
    supabase = get_supabase()
    start = datetime.utcnow()
    logger.info(f"=== Scrape started at {start.isoformat()} ===")

    universities = supabase.table("universities").select("*").execute().data
    logger.info(f"Loaded {len(universities)} universities")

    sigaa = SIGAAParser(supabase)
    sigaa_programs = 0
    try:
        sigaa_programs = sigaa.run()
    except Exception as e:
        logger.error(f"SIGAA parser failed: {e}")

    custom_count = run_custom_parsers(supabase, universities)
    logger.info(f"Custom parsers: {custom_count} programs")

    end = datetime.utcnow()
    elapsed = (end - start).total_seconds()
    logger.info(
        f"=== Scrape complete at {end.isoformat()} "
        f"({elapsed:.1f}s). "
        f"SIGAA: ~{sigaa_programs}, Custom: {custom_count} ==="
    )


if __name__ == "__main__":
    run()
