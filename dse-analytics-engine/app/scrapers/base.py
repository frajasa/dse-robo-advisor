import logging
import re
import time
from decimal import Decimal, InvalidOperation
from datetime import datetime

import httpx

from app.core.config import settings

logger = logging.getLogger("dse.scraper")


class BaseScraper:
    """Base class for DSE web scrapers with retry logic and parsing helpers."""

    def __init__(self):
        self.timeout = settings.SCRAPER_TIMEOUT
        self.max_retries = settings.SCRAPER_MAX_RETRIES
        self.headers = {"User-Agent": settings.SCRAPER_USER_AGENT}

    def _fetch_page(self, url: str) -> str | None:
        """Fetch an HTML page with retry and backoff."""
        for attempt in range(1, self.max_retries + 1):
            try:
                with httpx.Client(
                    timeout=self.timeout,
                    headers=self.headers,
                    follow_redirects=True,
                    verify=False,
                ) as client:
                    resp = client.get(url)
                    resp.raise_for_status()
                    return resp.text
            except httpx.HTTPError as e:
                logger.warning("Fetch attempt %d/%d failed for %s: %s", attempt, self.max_retries, url, e)
                if attempt < self.max_retries:
                    time.sleep(2 ** attempt)
        logger.error("All %d fetch attempts failed for %s", self.max_retries, url)
        return None

    @staticmethod
    def _parse_date(text: str) -> datetime | None:
        """Parse common DSE date formats into a date object."""
        if not text or not text.strip():
            return None
        text = text.strip()
        formats = [
            "%d %B %Y",
            "%d %b %Y",
            "%d/%m/%Y",
            "%Y-%m-%d",
            "%d-%m-%Y",
            "%d.%m.%Y",
        ]
        for fmt in formats:
            try:
                return datetime.strptime(text, fmt).date()
            except ValueError:
                continue
        logger.warning("Could not parse date: %s", text)
        return None

    @staticmethod
    def _parse_amount(text: str) -> Decimal | None:
        """Parse a monetary amount string into Decimal."""
        if not text or not text.strip():
            return None
        cleaned = re.sub(r"[^\d.]", "", text.strip())
        try:
            return Decimal(cleaned)
        except (InvalidOperation, ValueError):
            logger.warning("Could not parse amount: %s", text)
            return None
