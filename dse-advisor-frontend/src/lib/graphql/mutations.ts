import { gql } from "@apollo/client";

export const REGISTER_MUTATION = gql`
  mutation Register($input: RegisterInput!) {
    register(input: $input) {
      token
      tokenType
      refreshToken
      userId
      email
      fullName
    }
  }
`;

export const LOGIN_MUTATION = gql`
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      token
      tokenType
      refreshToken
      userId
      email
      fullName
    }
  }
`;

export const CREATE_PROFILE_MUTATION = gql`
  mutation CreateProfile($input: ProfileInput!) {
    createProfile(input: $input) {
      id
      riskTolerance
      investmentHorizon
      primaryGoal
      monthlyIncome
      capitalAvailable
    }
  }
`;

export const UPDATE_PROFILE_MUTATION = gql`
  mutation UpdateProfile($input: ProfileInput!) {
    updateProfile(input: $input) {
      id
      riskTolerance
      investmentHorizon
      primaryGoal
      monthlyIncome
      capitalAvailable
    }
  }
`;

export const GENERATE_PORTFOLIO_MUTATION = gql`
  mutation GeneratePortfolio($input: GeneratePortfolioInput!) {
    generatePortfolio(input: $input) {
      id
      name
      riskProfile
      holdings {
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

export const UPGRADE_SUBSCRIPTION_MUTATION = gql`
  mutation UpgradeSubscription($tier: String!) {
    upgradeSubscription(tier: $tier) {
      id
      tier
      isActive
      validFrom
      validUntil
    }
  }
`;

export const CREATE_REFERRAL_MUTATION = gql`
  mutation CreateReferral($brokerName: String!) {
    createReferral(brokerName: $brokerName) {
      id
      brokerName
      referralCode
      status
      referredAt
    }
  }
`;

export const CREATE_PRICE_ALERT_MUTATION = gql`
  mutation CreatePriceAlert($symbol: String!, $targetPrice: Float!, $direction: String!) {
    createPriceAlert(symbol: $symbol, targetPrice: $targetPrice, direction: $direction) {
      id
      symbol
      companyName
      targetPrice
      direction
      isTriggered
      createdAt
    }
  }
`;

export const DELETE_PRICE_ALERT_MUTATION = gql`
  mutation DeletePriceAlert($id: ID!) {
    deletePriceAlert(id: $id)
  }
`;

export const MARK_NOTIFICATION_READ_MUTATION = gql`
  mutation MarkNotificationRead($id: ID!) {
    markNotificationRead(id: $id)
  }
`;

export const MARK_ALL_NOTIFICATIONS_READ_MUTATION = gql`
  mutation MarkAllNotificationsRead {
    markAllNotificationsRead
  }
`;

export const REFRESH_TOKEN_MUTATION = gql`
  mutation RefreshToken($refreshToken: String!) {
    refreshToken(refreshToken: $refreshToken) {
      token
      tokenType
      refreshToken
      userId
      email
      fullName
    }
  }
`;
