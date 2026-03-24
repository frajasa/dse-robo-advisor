"""Sync service — scrapes DSE data and writes into the robo-advisor PostgreSQL database.

Uses the official DSE API (api.dse.co.tz) for:
  - Full OHLCV price data + bid/ask + market cap + volume
  - Stock metadata (total shares, cap size, descriptions)

Uses the DSE corporate actions page for:
  - Dividend announcements and payment dates
"""

import logging
from datetime import date, datetime, timezone
from decimal import Decimal

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.scrapers.dse_price_scraper import DSEPriceScraper
from app.scrapers.dse_dividend_scraper import DSEDividendScraper

logger = logging.getLogger("dse.sync")


def _now() -> datetime:
    return datetime.now(timezone.utc)


# ---------------------------------------------------------------------------
# Price sync — full OHLCV + market data from official DSE API
# ---------------------------------------------------------------------------

def sync_prices(db: Session, triggered_by: str = "scheduler") -> dict:
    """Scrape full market data from the official DSE API and upsert into stock_prices + stocks."""
    result = {"status": "started", "triggered_by": triggered_by, "started_at": _now().isoformat()}

    try:
        scraper = DSEPriceScraper()
        raw_records = scraper.scrape_market_prices()
        result["records_found"] = len(raw_records)

        # Get known symbols
        rows = db.execute(text("SELECT symbol FROM stocks WHERE is_active = TRUE")).fetchall()
        known_symbols = {row[0] for row in rows}

        created = updated = skipped = stocks_updated = 0

        for rec in raw_records:
            if rec.symbol not in known_symbols:
                skipped += 1
                continue

            today = rec.date or date.today()

            # --- Upsert into stock_prices ---
            existing = db.execute(
                text("SELECT id, close_price FROM stock_prices WHERE symbol = :sym AND price_date = :d"),
                {"sym": rec.symbol, "d": today},
            ).fetchone()

            price_params = {
                "sym": rec.symbol,
                "open": float(rec.open_price),
                "close": float(rec.close_price),
                "high": float(rec.high_price),
                "low": float(rec.low_price),
                "vol": rec.volume,
                "bid": float(rec.best_bid_price) if rec.best_bid_price else None,
                "bid_qty": rec.best_bid_qty,
                "ask": float(rec.best_ask_price) if rec.best_ask_price else None,
                "ask_qty": rec.best_ask_qty,
                "mcap": float(rec.market_cap) if rec.market_cap else None,
                "chg_pct": float(rec.change_pct) if rec.change_pct else None,
                "d": today,
            }

            if existing:
                price_params["id"] = existing[0]
                db.execute(text("""
                    UPDATE stock_prices SET
                        open_price = :open, close_price = :close,
                        high_price = :high, low_price = :low,
                        volume = :vol,
                        best_bid_price = :bid, best_bid_qty = :bid_qty,
                        best_ask_price = :ask, best_ask_qty = :ask_qty,
                        market_cap = :mcap, change_pct = :chg_pct
                    WHERE id = :id
                """), price_params)
                updated += 1
            else:
                db.execute(text("""
                    INSERT INTO stock_prices (
                        id, symbol, open_price, close_price, high_price, low_price,
                        volume, best_bid_price, best_bid_qty, best_ask_price, best_ask_qty,
                        market_cap, change_pct, price_date
                    ) VALUES (
                        gen_random_uuid(), :sym, :open, :close, :high, :low,
                        :vol, :bid, :bid_qty, :ask, :ask_qty,
                        :mcap, :chg_pct, :d
                    )
                """), price_params)
                created += 1

            # --- Update stocks table with metadata from API ---
            stock_updates = {}
            if rec.market_cap:
                stock_updates["mcap"] = float(rec.market_cap)
            if rec.total_shares_issued:
                stock_updates["shares"] = rec.total_shares_issued
            if rec.dse_company_id:
                stock_updates["dse_id"] = rec.dse_company_id
            if rec.security_desc:
                stock_updates["sec_desc"] = rec.security_desc
            if rec.cap_size:
                stock_updates["cap_sz"] = float(rec.cap_size)

            if stock_updates:
                # Build dynamic SET clause
                sets = []
                if "mcap" in stock_updates:
                    sets.append("market_cap = :mcap")
                if "shares" in stock_updates:
                    sets.append("total_shares_issued = :shares")
                if "dse_id" in stock_updates:
                    sets.append("dse_company_id = :dse_id")
                if "sec_desc" in stock_updates:
                    sets.append("security_desc = :sec_desc")
                if "cap_sz" in stock_updates:
                    sets.append("cap_size = :cap_sz")

                stock_updates["sym"] = rec.symbol
                db.execute(
                    text(f"UPDATE stocks SET {', '.join(sets)} WHERE symbol = :sym"),
                    stock_updates,
                )
                stocks_updated += 1

        db.commit()

        result.update(
            status="completed",
            records_created=created,
            records_updated=updated,
            records_skipped=skipped,
            stocks_metadata_updated=stocks_updated,
            completed_at=_now().isoformat(),
        )
        logger.info(
            "Price sync complete: found=%d created=%d updated=%d skipped=%d stocks_updated=%d",
            len(raw_records), created, updated, skipped, stocks_updated,
        )

    except Exception as e:
        db.rollback()
        logger.exception("Price sync failed")
        result.update(status="failed", error=str(e)[:500])

    return result


# ---------------------------------------------------------------------------
# Dividend sync — from DSE corporate actions page
# ---------------------------------------------------------------------------

def sync_dividends(db: Session, triggered_by: str = "scheduler") -> dict:
    """Scrape dividends from DSE corporate actions and upsert into dividend_history."""
    result = {"status": "started", "triggered_by": triggered_by, "started_at": _now().isoformat()}

    try:
        scraper = DSEDividendScraper()
        raw_records = scraper.scrape_corporate_actions()
        result["records_found"] = len(raw_records)

        rows = db.execute(text("SELECT symbol FROM stocks WHERE is_active = TRUE")).fetchall()
        known_symbols = {row[0] for row in rows}

        created = skipped = 0

        for rec in raw_records:
            if rec.symbol not in known_symbols:
                skipped += 1
                continue

            ex_date = rec.books_closure_date or rec.announcement_date
            if not ex_date:
                skipped += 1
                continue

            existing = db.execute(
                text("SELECT id FROM dividend_history WHERE symbol = :sym AND ex_date = :ex AND dividend_amount = :amt"),
                {"sym": rec.symbol, "ex": ex_date, "amt": float(rec.dividend_per_share)},
            ).fetchone()

            if existing:
                skipped += 1
                continue

            db.execute(
                text("""
                    INSERT INTO dividend_history (id, symbol, dividend_amount, ex_date, pay_date, dividend_type)
                    VALUES (gen_random_uuid(), :sym, :amt, :ex, :pay, :dtype)
                """),
                {
                    "sym": rec.symbol,
                    "amt": float(rec.dividend_per_share),
                    "ex": ex_date,
                    "pay": rec.payment_date,
                    "dtype": rec.dividend_type.upper(),
                },
            )
            created += 1

        db.commit()

        result.update(status="completed", records_created=created, records_skipped=skipped, completed_at=_now().isoformat())
        logger.info("Dividend sync complete: found=%d created=%d skipped=%d", len(raw_records), created, skipped)

    except Exception as e:
        db.rollback()
        logger.exception("Dividend sync failed")
        result.update(status="failed", error=str(e)[:500])

    return result
