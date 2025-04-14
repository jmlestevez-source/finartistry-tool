
// Data transformation utility functions

export const transformFMPHistoricalData = (data: any[], ticker: string) => {
  return data.map((item) => ({
    date: item.date,
    [ticker]: item.adjClose || item.close
  }));
};

export const calculateDailyReturns = (historicalData: any[]) => {
  const returns: any[] = [];
  for (let i = 1; i < historicalData.length; i++) {
    const previousDay = historicalData[i-1];
    const currentDay = historicalData[i];
    
    const returnData: any = { date: currentDay.date };
    
    // Calcular retornos para cada ticker
    Object.keys(currentDay).forEach(key => {
      if (key !== 'date' && previousDay[key] && currentDay[key]) {
        returnData[key] = (currentDay[key] - previousDay[key]) / previousDay[key];
      }
    });
    
    returns.push(returnData);
  }
  
  return returns;
};

export const calculateCumulativeReturns = (dailyReturns: any[]) => {
  const cumulativeReturns = [];
  const tickers = Object.keys(dailyReturns[0]).filter(key => key !== 'date');
  
  let cumulativeValues: Record<string, number> = {};
  tickers.forEach(ticker => {
    cumulativeValues[ticker] = 1; // Comenzar en 1 (100%)
  });
  
  for (const dailyReturn of dailyReturns) {
    const cumulativeData: any = { date: dailyReturn.date };
    
    tickers.forEach(ticker => {
      if (dailyReturn[ticker] !== undefined) {
        cumulativeValues[ticker] *= (1 + dailyReturn[ticker]);
        cumulativeData[ticker] = cumulativeValues[ticker];
      }
    });
    
    cumulativeReturns.push(cumulativeData);
  }
  
  return cumulativeReturns;
};

export const calculatePortfolioPerformance = (stocksData: any[], weights: number[]) => {
  const portfolioData = [];
  const tickers = Object.keys(stocksData[0]).filter(key => key !== 'date');
  
  for (const dailyData of stocksData) {
    let portfolioValue = 0;
    
    tickers.forEach((ticker, index) => {
      if (dailyData[ticker] !== undefined && index < weights.length) {
        portfolioValue += dailyData[ticker] * weights[index];
      }
    });
    
    portfolioData.push({
      date: dailyData.date,
      portfolio: portfolioValue
    });
  }
  
  return portfolioData;
};
