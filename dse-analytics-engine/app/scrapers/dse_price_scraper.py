"""Scraper for the official DSE market-data API.

Endpoint: https://api.dse.co.tz/api/market-data?isBond=false

Returns full OHLCV, market cap, bid/ask, total shares, and more.
"""

import json
import logging
from dataclasses import dataclass, field
from datetime import date
from decimal import Decimal

from app.scrapers.base import BaseScraper

logger = logging.getLogger("dse.scraper.prices")

DSE_MARKET_DATA_API = "https://api.dse.co.tz/api/market-data?isBond=false"
DSE_ORDER_BOOK_API = "https://api.dse.co.tz/api/market-orders/companies/{company_id}"


@dataclass
class RawPriceRecord:
    symbol: str
    close_price: Decimal
    open_price: Decimal
    high_price: Decimal
    low_price: Decimal
    volume: int
    change: Decimal | None
    change_pct: Decimal | None
    market_cap: Decimal | None
    best_bid_price: Decimal | None
    best_bid_qty: int | None
    best_ask_price: Decimal | None
    best_ask_qty: int | None
    total_shares_issued: int | None
    company_name: str | None
    security_desc: str | None
    dse_company_id: int | None
    cap_size: Decimal | None
    date: date | None


@dataclass
class OrderBookEntry:
    buy_price: Decimal
    buy_quantity: int
    sell_price: Decimal
    sell_quantity: int


@dataclass
class OrderBook:
    best_sell_price: Decimal | None
    best_buy_price: Decimal | None
    orders: list[OrderBookEntry] = field(default_factory=list)


class DSEPriceScraper(BaseScraper):
    """Scrapes market data from the official DSE API (api.dse.co.tz)."""

    def scrape_market_prices(self) -> list[RawPriceRecord]:
        """Fetch full OHLCV + market data from the official DSE API."""
        response_text = self._fetch_page(DSE_MARKET_DATA_API)
        if not response_text:
            logger.error("Failed to fetch DSE market-data API")
            return []
        try:
            return self._parse_market_data(response_text)
        except Exception:
            logger.exception("Error parsing DSE market-data JSON")
            return []

    def scrape_order_book(self, company_id: int) -> OrderBook | None:
        """Fetch order book (buy/sell orders) for a specific company."""
        url = DSE_ORDER_BOOK_API.format(company_id=company_id)
        response_text = self._fetch_page(url)
        if not response_text:
            return None
        try:
            return self._parse_order_book(response_text)
        except Exception:
            logger.exception("Error parsing order book for company_id=%d", company_id)
            return None

    def _parse_market_data(self, response_text: str) -> list[RawPriceRecord]:
        """Parse the official DSE market-data response.

        Each entry has: company{}, security{}, marketPrice, openingPrice,
        high, low, volume, change, percentageChange, marketCap,
        bestBidPrice, bestBidQuantity, bestOfferPrice, bestOfferQuantity, etc.
        """
        data = json.loads(response_text)

        if not isinstance(data, list):
            logger.warning("DSE market-data API returned unexpected type: %s", type(data))
            return []

        records: list[RawPriceRecord] = []

        for entry in data:
            company = entry.get("company", {})
            security = entry.get("security", {})
            symbol = (company.get("symbol") or "").strip().upper()

            if not symbol:
                continue

            close_price = self._to_decimal(entry.get("marketPrice"))
            if close_price is None or close_price <= 0:
                continue

            open_price = self._to_decimal(entry.get("openingPrice")) or close_price
            high_price = self._to_decimal(entry.get("high")) or close_price
            low_price = self._to_decimal(entry.get("low")) or close_price

            records.append(RawPriceRecord(
                symbol=symbol,
                close_price=close_price,
                open_price=open_price,
                high_price=high_price,
                low_price=low_price,
                volume=int(entry.get("volume") or 0),
                change=self._to_decimal(entry.get("change")),
                change_pct=self._to_decimal(entry.get("percentageChange")),
                market_cap=self._to_decimal(entry.get("marketCap")),
                best_bid_price=self._to_decimal(entry.get("bestBidPrice")),
                best_bid_qty=self._to_int(entry.get("bestBidQuantity")),
                best_ask_price=self._to_decimal(entry.get("bestOfferPrice")),
                best_ask_qty=self._to_int(entry.get("bestOfferQuantity")),
                total_shares_issued=self._to_int(security.get("totalSharesIssued")),
                company_name=company.get("name"),
                security_desc=security.get("securityDesc"),
                dse_company_id=company.get("id"),
                cap_size=self._to_decimal(company.get("capSize")),
                date=date.today(),
            ))

        logger.info("Parsed %d market-data records from official DSE API", len(records))
        return records

    def _parse_order_book(self, response_text: str) -> OrderBook:
        """Parse order book response."""
        data = json.loads(response_text)
        orders = []
        for order in data.get("orders", []):
            orders.append(OrderBookEntry(
                buy_price=self._to_decimal(order.get("buyPrice")) or Decimal(0),
                buy_quantity=int(order.get("buyQuantity") or 0),
                sell_price=self._to_decimal(order.get("sellPrice")) or Decimal(0),
                sell_quantity=int(order.get("sellQuantity") or 0),
            ))
        return OrderBook(
            best_sell_price=self._to_decimal(data.get("bestSellPrice")),
            best_buy_price=self._to_decimal(data.get("bestBuyPrice")),
            orders=orders,
        )

    @staticmethod
    def _to_decimal(val) -> Decimal | None:
        if val is None:
            return None
        try:
            d = Decimal(str(val))
            return d if d != 0 else None
        except Exception:
            return None

    @staticmethod
    def _to_int(val) -> int | None:
        if val is None:
            return None
        try:
            return int(val)
        except Exception:
            return None
