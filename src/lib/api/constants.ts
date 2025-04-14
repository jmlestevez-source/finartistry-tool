
// API Keys
export const FINANCIAL_MODELING_PREP_API_KEY = "FedUgaGEN9Pv19qgVxh2nHw0JWg5V6uh";
export const ALPHA_VANTAGE_API_KEY = "XFXHX5W3S21MV9PT";

// Common interfaces
export interface PortfolioParams {
  tickers: string[];
  weights: number[];
  benchmark: string;
  period: string;
}

export interface BacktestParams {
  tickers: string[];
  weights: number[];
  benchmark: string;
  startDate: string;
  endDate?: string;
  rebalancePeriod: string;
}
