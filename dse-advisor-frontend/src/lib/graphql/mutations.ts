import { gql } from "@apollo/client";

export const REGISTER_MUTATION = gql`
  mutation Register($input: RegisterInput!) {
    register(input: $input) {
      token
      tokenType
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
