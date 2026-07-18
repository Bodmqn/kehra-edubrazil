"""
Custom Portal Parsers — For universities whose SIGAA URLs are
unreachable or do not actually serve a SIGAA listing.

Add a parser per university (or per portal pattern) below.
Each parser should implement a `parse(supabase, university) -> int`
function that returns the number of programs found.
"""

import logging

logger = logging.getLogger(__name__)


# ── Registration table ──────────────────────────────────────────────
# Map university_id or acronym -> parser function.
# A parser receives (supabase_client, university_dict) and returns count.
REGISTRY: dict[str, callable] = {}


def register(acronym: str):
    """Decorator to register a parser for a given university acronym."""
    def wrapper(fn):
        REGISTRY[acronym] = fn
        return fn
    return wrapper


# ── Built-in parsers ────────────────────────────────────────────────


@register("UERR")
def parse_uerr(supabase, uni: dict) -> int:
    """
    Universidade Estadual de Roraima — uses a public edital page
    rather than SIGAA. The current sigaa_url is a plain-text note.
    """
    logger.info(f"UERR custom parser: {uni['name']}")
    # TODO: implement edital page scraping at
    # https://uerr.edu.br/editais/
    return 0


@register("UNIFESSPA")
def parse_unifesspa(supabase, uni: dict) -> int:
    """
    Universidade Federal do Sul e Sudeste do Pará
    """
    logger.info(f"UNIFESSPA custom parser: {uni['name']}")
    # TODO: implement
    return 0


@register("UFOB")
def parse_ufob(supabase, uni: dict) -> int:
    """
    Universidade Federal do Oeste da Bahia
    """
    logger.info(f"UFOB custom parser: {uni['name']}")
    # TODO: implement
    return 0


@register("UFSB")
def parse_ufsb(supabase, uni: dict) -> int:
    """
    Universidade Federal do Sul da Bahia
    """
    logger.info(f"UFSB custom parser: {uni['name']}")
    # TODO: implement
    return 0


# ── Runner ──────────────────────────────────────────────────────────

def run_custom_parsers(supabase, universities: list[dict]) -> int:
    """Run all registered custom parsers for matching universities."""
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
    return total
