import logging
import re
from dataclasses import dataclass
from datetime import date, datetime
from decimal import Decimal

from bs4 import BeautifulSoup

from app.scrapers.base import BaseScraper

logger = logging.getLogger("dse.scraper.dividends")

DSE_CORPORATE_ACTIONS_URL = "https://dse.co.tz/listed/corporate/actions"


@dataclass
class RawDividendRecord:
    symbol: str
    financial_year: str
    dividend_per_share: Decimal
    announcement_date: date | None
    books_closure_date: date | None
    payment_date: date | None
    dividend_type: str
    source_url: str


class DSEDividendScraper(BaseScraper):
    """Scrapes dividend / corporate action data from the DSE website."""

    def scrape_corporate_actions(self) -> list[RawDividendRecord]:
        html = self._fetch_page(DSE_CORPORATE_ACTIONS_URL)
        if not html:
            logger.error("Failed to fetch corporate actions page")
            return []
        try:
            return self._parse_corporate_actions(html)
        except Exception:
            logger.exception("Error parsing corporate actions page")
            return []

    def _parse_corporate_actions(self, html: str) -> list[RawDividendRecord]:
        soup = BeautifulSoup(html, "html.parser")
        records: list[RawDividendRecord] = []

        img_tags = soup.find_all("img", src=re.compile(r"/securities/\w+/", re.IGNORECASE))

        for img in img_tags:
            src = img.get("src", "")
            symbol_match = re.search(r"/securities/(\w+)/", src)
            if not symbol_match:
                continue
            symbol = symbol_match.group(1).upper()

            card = img.find_parent("div")
            if not card:
                continue

            for _ in range(5):
                text = card.get_text(" ", strip=True)
                if "dividend" in text.lower() or "books" in text.lower() or "payment" in text.lower():
                    break
                parent = card.find_parent("div")
                if parent:
                    card = parent
                else:
                    break

            record = self._extract_dividend_from_text(symbol, card.get_text(" ", strip=True))
            if record:
                records.append(record)

        if not records:
            records = self._parse_from_full_text(soup)

        records = self._deduplicate(records)
        logger.info("Parsed %d dividend records from corporate actions page", len(records))
        return records

    @staticmethod
    def _deduplicate(records: list[RawDividendRecord]) -> list[RawDividendRecord]:
        seen: set[tuple] = set()
        unique: list[RawDividendRecord] = []
        for rec in records:
            key = (rec.symbol, rec.dividend_per_share, rec.announcement_date)
            if key not in seen:
                seen.add(key)
                unique.append(rec)
        return unique

    def _extract_dividend_from_text(self, symbol: str, text: str) -> RawDividendRecord | None:
        amount = None
        amount_patterns = [
            r"[Dd]ividend\s+of\s+(?:TZS\s+)?([0-9,]+(?:\.\d+)?)",
            r"TZS\s+([0-9,]+(?:\.\d+)?)\s+(?:per\s+share)?",
            r"([0-9,]+(?:\.\d+)?)\s+per\s+share",
        ]
        for pattern in amount_patterns:
            match = re.search(pattern, text)
            if match:
                amount = self._parse_amount(match.group(1))
                if amount:
                    break

        if amount is None:
            return None

        announcement_date = self._extract_date_near_keyword(text, r"[Aa]nnounce\w*")
        books_closure_date = self._extract_date_near_keyword(text, r"[Bb]ooks?\s*[Cc]losure")
        payment_date = self._extract_date_near_keyword(text, r"[Pp]ayment")

        financial_year = ""
        ref_date = announcement_date or books_closure_date
        if ref_date:
            if ref_date.month <= 6:
                financial_year = str(ref_date.year - 1)
            else:
                financial_year = str(ref_date.year)

        return RawDividendRecord(
            symbol=symbol,
            financial_year=financial_year,
            dividend_per_share=amount,
            announcement_date=announcement_date,
            books_closure_date=books_closure_date,
            payment_date=payment_date,
            dividend_type="final",
            source_url=DSE_CORPORATE_ACTIONS_URL,
        )

    def _extract_date_near_keyword(self, text: str, keyword_pattern: str) -> date | None:
        date_patterns = [
            r"([A-Z][a-z]+\s+\d{1,2},?\s+\d{4})",
            r"(\d{1,2}\s+[A-Z][a-z]+\s+\d{4})",
            r"(\d{1,2}/\d{1,2}/\d{4})",
            r"(\d{4}-\d{2}-\d{2})",
        ]

        keyword_match = re.search(keyword_pattern, text)
        if not keyword_match:
            return None

        search_region = text[keyword_match.start():keyword_match.start() + 150]

        for pattern in date_patterns:
            match = re.search(pattern, search_region)
            if match:
                parsed = self._parse_date_flexible(match.group(1))
                if parsed:
                    return parsed
        return None

    @staticmethod
    def _parse_date_flexible(text: str) -> date | None:
        text = text.strip().replace(",", "")
        formats = [
            "%B %d %Y",
            "%d %B %Y",
            "%b %d %Y",
            "%d %b %Y",
            "%d/%m/%Y",
            "%Y-%m-%d",
        ]
        for fmt in formats:
            try:
                return datetime.strptime(text, fmt).date()
            except ValueError:
                continue
        return None

    def _parse_from_full_text(self, soup: BeautifulSoup) -> list[RawDividendRecord]:
        records: list[RawDividendRecord] = []
        full_text = soup.get_text(" ", strip=True)

        blocks = re.split(r"(?=\b[A-Z]{2,10}\b\s.*?[Dd]ividend)", full_text)

        for block in blocks:
            if "dividend" not in block.lower():
                continue
            sym_match = re.match(r"\b([A-Z]{2,10})\b", block)
            if not sym_match:
                continue
            symbol = sym_match.group(1)
            record = self._extract_dividend_from_text(symbol, block)
            if record:
                records.append(record)

        return records
