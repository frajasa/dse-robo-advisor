import { gql } from "@apollo/client";

export const STOCK_PRICE_UPDATED = gql`
  subscription StockPriceUpdated($symbol: String!) {
    stockPriceUpdated(symbol: $symbol) {
      symbol
      currentPrice
      change
      changePct
      volume
    }
  }
`;

export const MARKET_SNAPSHOT_UPDATED = gql`
  subscription MarketSnapshotUpdated {
    marketSnapshotUpdated {
      stocks {
        symbol
        currentPrice
        change
        changePct
      }
      indexValue
      indexChange
      updatedAt
    }
  }
`;
