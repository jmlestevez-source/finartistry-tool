
// Date utility functions

export const calculateStartDate = (period: string): string => {
  const today = new Date();
  let startDate;
  
  switch(period) {
    case '1y':
      startDate = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());
      break;
    case '3y':
      startDate = new Date(today.getFullYear() - 3, today.getMonth(), today.getDate());
      break;
    case '5y':
      startDate = new Date(today.getFullYear() - 5, today.getMonth(), today.getDate());
      break;
    case '10y':
      startDate = new Date(today.getFullYear() - 10, today.getMonth(), today.getDate());
      break;
    case '30y':
      startDate = new Date(today.getFullYear() - 30, today.getMonth(), today.getDate());
      break;
    default:
      startDate = new Date(today.getFullYear() - 5, today.getMonth(), today.getDate());
  }
  
  return startDate.toISOString().split('T')[0];
};

export const getTodayDate = (): string => {
  return new Date().toISOString().split('T')[0];
};

// Calculate annualized returns based on actual data period
export const calculateAnnualizedReturn = (
  dailyReturns: any[], 
  ticker: string
): number => {
  const tickerReturns = dailyReturns
    .map(day => day[ticker])
    .filter(val => val !== undefined);
  
  if (tickerReturns.length === 0) return 0;
  
  // Average daily return
  const avgDailyReturn = tickerReturns.reduce((acc, val) => acc + val, 0) / tickerReturns.length;
  
  // Annualize (assuming 252 trading days per year)
  return Math.pow(1 + avgDailyReturn, 252) - 1;
};

// Get the actual data period in years based on available data
export const getActualDataPeriodYears = (historicalData: any[]): number => {
  if (historicalData.length < 2) return 0;
  
  const firstDate = new Date(historicalData[0].date);
  const lastDate = new Date(historicalData[historicalData.length - 1].date);
  
  // Calculate difference in years
  const diffTime = Math.abs(lastDate.getTime() - firstDate.getTime());
  const diffYears = diffTime / (1000 * 60 * 60 * 24 * 365.25);
  
  return diffYears;
};
