import { gql } from "@apollo/client";

export const ME_QUERY = gql`
  query Me {
    me {
      id
      email
      fullName
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
