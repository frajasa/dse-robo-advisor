import { gql } from "@apollo/client";

export const ME_QUERY = gql`
  query Me {
    me {
      id
      nickname
      subscription {
        tier
        isActive
      }
    }
  }
`;

export const MY_PROFILE_QUERY = gql`
  query MyProfile {
    myProfile {
      id
      monthlyIncome
      capitalAvailable
      riskTolerance
      investmentHorizon
      primaryGoal
    }
  }
`;

export const STOCKS_QUERY = gql`
  query Stocks {
    stocks {
      id
      symbol
      companyName
      sector
      expectedReturn
      volatility
      dividendYield
      marketCap
    }
  }
`;

export const MY_PORTFOLIOS_QUERY = gql`
  query MyPortfolios {
    myPortfolios {
      id
      name
      riskProfile
      createdAt
      metrics {
        expectedReturn
        expectedVolatility
        sharpeRatio
        projectedAnnualDividend
        holdingsCount
      }
    }
  }
`;

export const PORTFOLIO_QUERY = gql`
  query Portfolio($id: ID!) {
    portfolio(id: $id) {
      id
      name
      riskProfile
      holdings {
        id
        symbol
        name
        allocationPct
        dividendYield
        sector
        rationale
      }
      metrics {
        expectedReturn
        expectedVolatility
        sharpeRatio
        projectedAnnualDividend
        holdingsCount
      }
    }
  }
`;

export const PORTFOLIO_ANALYTICS_QUERY = gql`
  query PortfolioAnalytics($portfolioId: ID!) {
    portfolioAnalytics(portfolioId: $portfolioId) {
      performanceHistory {
        date
        value
      }
      sectorAllocation {
        sector
        allocation
      }
      dividendProjections {
        month
        projected
      }
      totalValue
      totalReturn
      totalDividendYield
    }
  }
`;

export const STOCK_DETAIL_QUERY = gql`
  query StockDetail($symbol: String!) {
    stockDetail(symbol: $symbol) {
      symbol
      companyName
      sector
      currentPrice
      previousClose
      change
      changePct
      volume
      high
      low
      bestBidPrice
      bestAskPrice
      marketCap
      dividendYield
      expectedReturn
      volatility
      dseCompanyId
      orderBook {
        buyPrice
        buyQuantity
        sellPrice
        sellQuantity
      }
    }
  }
`;

export const SIMULATE_INVESTMENT_QUERY = gql`
  query SimulateInvestment($input: SimulationInput!) {
    simulateInvestment(input: $input) {
      projections {
        year
        optimistic
        expected
        pessimistic
      }
      finalOptimistic
      finalExpected
      finalPessimistic
      totalInvested
      expectedProfit
      expectedReturnPct
      expectedAnnualReturn
      expectedDividendIncome
      riskTolerance
    }
  }
`;

export const PORTFOLIO_REBALANCING_QUERY = gql`
  query PortfolioRebalancing($portfolioId: ID!) {
    portfolioRebalancing(portfolioId: $portfolioId) {
      needsRebalancing
      alerts {
        symbol
        name
        action
        currentAllocation
        targetAllocation
        drift
        severity
      }
      portfolioId
    }
  }
`;

export const MY_ALERTS_QUERY = gql`
  query MyAlerts {
    myAlerts {
      id
      symbol
      companyName
      targetPrice
      direction
      isTriggered
      createdAt
      triggeredAt
    }
  }
`;

export const MY_NOTIFICATIONS_QUERY = gql`
  query MyNotifications {
    myNotifications {
      id
      type
      title
      message
      isRead
      createdAt
    }
  }
`;

export const ASK_ADVISOR_QUERY = gql`
  query AskAdvisor($question: String!) {
    askAdvisor(question: $question) {
      answer
      source
      relatedPages
    }
  }
`;

export const BROKERS_QUERY = gql`
  query Brokers {
    brokers {
      name
      description
      website
      commission
      logo
      affiliateUrl
    }
  }
`;

export const MY_REFERRALS_QUERY = gql`
  query MyReferrals {
    myReferrals {
      id
      brokerName
      referralCode
      status
      commissionTzs
      referredAt
      convertedAt
    }
  }
`;
