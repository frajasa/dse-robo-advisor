"""Order book proxy — fetches live order book from the DSE API."""

import logging

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.scrapers.dse_price_scraper import DSEPriceScraper

logger = logging.getLogger("dse.api.order_book")
router = APIRouter()


class OrderBookEntryResponse(BaseModel):
    buyPrice: float
    buyQuantity: int
    sellPrice: float
    sellQuantity: int


class OrderBookResponse(BaseModel):
    bestBuyPrice: float | None
    bestSellPrice: float | None
    orders: list[OrderBookEntryResponse]


@router.get("/order-book/{company_id}", response_model=OrderBookResponse)
def get_order_book(company_id: int):
    """Fetch live order book for a DSE company by its DSE company ID."""
    scraper = DSEPriceScraper()
    order_book = scraper.scrape_order_book(company_id)

    if order_book is None:
        raise HTTPException(status_code=502, detail="Failed to fetch order book from DSE")

    return OrderBookResponse(
        bestBuyPrice=float(order_book.best_buy_price) if order_book.best_buy_price else None,
        bestSellPrice=float(order_book.best_sell_price) if order_book.best_sell_price else None,
        orders=[
            OrderBookEntryResponse(
                buyPrice=float(e.buy_price),
                buyQuantity=e.buy_quantity,
                sellPrice=float(e.sell_price),
                sellQuantity=e.sell_quantity,
            )
            for e in order_book.orders
        ],
    )
