
import { toast } from "@/hooks/use-toast";

// Re-export all services and types for backwards compatibility
export { fetchPortfolioData } from './portfolio/portfolioService';
export { fetchBacktestResults } from './backtesting/backtestingService';
export type { PortfolioParams, BacktestParams } from './constants';
export { FINANCIAL_MODELING_PREP_API_KEY, ALPHA_VANTAGE_API_KEY } from './constants';

// Export optimizer service
export { 
  fetchOptimizedPortfolio, 
  OptimizerModel 
} from './optimizer/optimizerService';

// Export API utilities
export { 
  fetchFinancialData, 
  fetchAlphaVantageData, 
  fetchYahooFinanceData,
  fetchStockRecommendations
} from './utils/apiUtils';

// Also re-export utility functions that might be useful elsewhere
export { 
  calculateStartDate, 
  getTodayDate,
  calculateAnnualizedReturn,
  getActualDataPeriodYears
} from './utils/dateUtils';

export { 
  calculateDailyReturns, 
  calculateCumulativeReturns, 
  calculatePortfolioPerformance 
} from './utils/dataTransformations';

export {
  calculateMetrics,
  calculateCorrelationMatrix,
  calculateVolatility,
  calculateMaxDrawdown,
  calculateCorrelation
} from './utils/metricsCalculations';
