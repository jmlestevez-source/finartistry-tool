
// Metrics calculation utility functions

export const calculateMetrics = (returns: any[]) => {
  const tickers = Object.keys(returns[0]).filter(key => key !== 'date');
  const metrics: Record<string, any> = {};
  
  tickers.forEach(ticker => {
    const tickerReturns = returns.map(day => day[ticker]).filter(val => val !== undefined && !isNaN(val));
    
    // Skip calculation if there's not enough data
    if (tickerReturns.length < 2) {
      metrics[ticker] = {
        annualReturn: 0,
        volatility: 0,
        sharpeRatio: 0,
        maxDrawdown: 0,
        alpha: 0,
        beta: ticker === tickers[0] ? 1 : 0
      };
      return;
    }
    
    // Annualize return based on available data
    const avgDailyReturn = tickerReturns.reduce((acc, val) => acc + val, 0) / tickerReturns.length;
    const annualReturn = Math.pow(1 + avgDailyReturn, 252) - 1;
    
    // Calculate annualized volatility from available data
    const mean = tickerReturns.reduce((acc, val) => acc + val, 0) / tickerReturns.length;
    const variance = tickerReturns.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / (tickerReturns.length - 1);
    const volatility = Math.sqrt(variance) * Math.sqrt(252);
    
    // Calculate Sharpe Ratio (assuming risk-free rate = 0 for simplicity)
    const sharpeRatio = volatility > 0 ? annualReturn / volatility : 0;
    
    // Calculate maximum drawdown from available data
    let maxDrawdown = 0;
    let peak = -Infinity;
    let cumulativeReturn = 1;
    
    for (const ret of tickerReturns) {
      cumulativeReturn *= (1 + ret);
      
      if (cumulativeReturn > peak) {
        peak = cumulativeReturn;
      }
      
      const drawdown = (cumulativeReturn - peak) / peak;
      if (drawdown < maxDrawdown) {
        maxDrawdown = drawdown;
      }
    }
    
    // Default values for beta and alpha
    let alpha = 0;
    let beta = ticker === tickers[0] ? 1 : 0;
    
    // Calculate beta and alpha if this isn't the benchmark
    if (ticker !== tickers[0] && tickers[0]) {
      const benchmarkTickerReturns = returns
        .map(day => day[tickers[0]])
        .filter(val => val !== undefined && !isNaN(val));
      
      // Only calculate if there's enough benchmark data
      if (benchmarkTickerReturns.length > 1) {
        // For accurate calculation, we need to align the returns data
        // Find days where both ticker and benchmark have data
        const alignedData = returns.filter(day => 
          day[ticker] !== undefined && !isNaN(day[ticker]) && 
          day[tickers[0]] !== undefined && !isNaN(day[tickers[0]])
        );
        
        if (alignedData.length > 1) {
          const alignedTickerReturns = alignedData.map(day => day[ticker]);
          const alignedBenchmarkReturns = alignedData.map(day => day[tickers[0]]);
          
          const tickerMean = alignedTickerReturns.reduce((sum, val) => sum + val, 0) / alignedTickerReturns.length;
          const benchmarkMean = alignedBenchmarkReturns.reduce((sum, val) => sum + val, 0) / alignedBenchmarkReturns.length;
          
          // Calculate covariance
          let covariance = 0;
          for (let i = 0; i < alignedTickerReturns.length; i++) {
            covariance += (alignedTickerReturns[i] - tickerMean) * (alignedBenchmarkReturns[i] - benchmarkMean);
          }
          covariance /= alignedTickerReturns.length;
          
          // Calculate benchmark variance
          let benchmarkVariance = 0;
          for (let i = 0; i < alignedBenchmarkReturns.length; i++) {
            benchmarkVariance += Math.pow(alignedBenchmarkReturns[i] - benchmarkMean, 2);
          }
          benchmarkVariance /= alignedBenchmarkReturns.length;
          
          // Calculate beta
          beta = benchmarkVariance > 0 ? covariance / benchmarkVariance : 0;
          
          // Annualize benchmark return
          const annualizedBenchmarkReturn = Math.pow(1 + benchmarkMean, 252) - 1;
          
          // Calculate alpha
          alpha = annualReturn - (beta * annualizedBenchmarkReturn);
        }
      }
    }
    
    metrics[ticker] = {
      annualReturn,
      volatility,
      sharpeRatio,
      maxDrawdown,
      alpha,
      beta
    };
  });
  
  return metrics;
};

export const calculateCorrelationMatrix = (returns: any[]) => {
  const tickers = Object.keys(returns[0]).filter(key => key !== 'date');
  const correlationMatrix = Array(tickers.length).fill(0).map(() => Array(tickers.length).fill(0));
  
  const tickerReturns: Record<string, number[]> = {};
  tickers.forEach(ticker => {
    tickerReturns[ticker] = returns
      .map(day => day[ticker])
      .filter(val => val !== undefined && !isNaN(val));
  });
  
  // Calculate correlation for each pair of tickers
  for (let i = 0; i < tickers.length; i++) {
    for (let j = i; j < tickers.length; j++) {
      const ticker1 = tickers[i];
      const ticker2 = tickers[j];
      
      // If it's the same ticker, correlation = 1
      if (i === j) {
        correlationMatrix[i][j] = 1;
        continue;
      }
      
      const returns1 = tickerReturns[ticker1];
      const returns2 = tickerReturns[ticker2];
      
      // Find days where both tickers have data
      const alignedReturns1: number[] = [];
      const alignedReturns2: number[] = [];
      
      for (const day of returns) {
        if (day[ticker1] !== undefined && !isNaN(day[ticker1]) &&
            day[ticker2] !== undefined && !isNaN(day[ticker2])) {
          alignedReturns1.push(day[ticker1]);
          alignedReturns2.push(day[ticker2]);
        }
      }
      
      // If there's not enough aligned data, use 0 correlation
      if (alignedReturns1.length < 2) {
        correlationMatrix[i][j] = 0;
        correlationMatrix[j][i] = 0;
        continue;
      }
      
      // Calculate means
      const mean1 = alignedReturns1.reduce((acc, val) => acc + val, 0) / alignedReturns1.length;
      const mean2 = alignedReturns2.reduce((acc, val) => acc + val, 0) / alignedReturns2.length;
      
      // Calculate variances
      let variance1 = 0;
      let variance2 = 0;
      let covariance = 0;
      
      for (let k = 0; k < alignedReturns1.length; k++) {
        variance1 += Math.pow(alignedReturns1[k] - mean1, 2);
        variance2 += Math.pow(alignedReturns2[k] - mean2, 2);
        covariance += (alignedReturns1[k] - mean1) * (alignedReturns2[k] - mean2);
      }
      
      variance1 /= alignedReturns1.length;
      variance2 /= alignedReturns2.length;
      covariance /= alignedReturns1.length;
      
      // Calculate standard deviations
      const stdDev1 = Math.sqrt(variance1);
      const stdDev2 = Math.sqrt(variance2);
      
      // Calculate correlation
      let correlation = 0;
      if (stdDev1 > 0 && stdDev2 > 0) {
        correlation = covariance / (stdDev1 * stdDev2);
        // Clamp correlation to [-1, 1] to handle floating point errors
        correlation = Math.max(-1, Math.min(1, correlation));
      }
      
      // Assign to correlation matrix (symmetric)
      correlationMatrix[i][j] = correlation;
      correlationMatrix[j][i] = correlation;
    }
  }
  
  return correlationMatrix;
};

export const calculateVolatility = (returns: any[]): number => {
  if (returns.length < 2) return 0;
  
  const dailyReturns = returns.map(day => Object.values(day)[1] || 0)
    .filter(val => !isNaN(Number(val))) as number[];
  
  if (dailyReturns.length < 2) return 0;
  
  const mean = dailyReturns.reduce((sum, val) => sum + val, 0) / dailyReturns.length;
  const variance = dailyReturns.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (dailyReturns.length - 1);
  
  return Math.sqrt(variance) * Math.sqrt(252); // Annualize volatility
};

export const calculateMaxDrawdown = (priceData: any[]): number => {
  if (priceData.length < 2) return 0;
  
  let maxDrawdown = 0;
  let peak = priceData[0].price;
  
  for (const day of priceData) {
    if (day.price > peak) {
      peak = day.price;
    } else {
      const drawdown = (day.price - peak) / peak;
      if (drawdown < maxDrawdown) {
        maxDrawdown = drawdown;
      }
    }
  }
  
  return maxDrawdown;
};

export const calculateCorrelation = (series1: number[], series2: number[]): number => {
  // Make sure both series have the same length and filter out undefined/NaN values
  const validPairs: [number, number][] = [];
  
  for (let i = 0; i < Math.min(series1.length, series2.length); i++) {
    if (!isNaN(series1[i]) && !isNaN(series2[i]) && 
        series1[i] !== undefined && series2[i] !== undefined) {
      validPairs.push([series1[i], series2[i]]);
    }
  }
  
  const n = validPairs.length;
  if (n < 2) return 0;
  
  // Calculate means
  let sum1 = 0;
  let sum2 = 0;
  for (const [val1, val2] of validPairs) {
    sum1 += val1;
    sum2 += val2;
  }
  const mean1 = sum1 / n;
  const mean2 = sum2 / n;
  
  // Calculate covariance and variances
  let covariance = 0;
  let variance1 = 0;
  let variance2 = 0;
  
  for (const [val1, val2] of validPairs) {
    const dev1 = val1 - mean1;
    const dev2 = val2 - mean2;
    covariance += dev1 * dev2;
    variance1 += dev1 * dev1;
    variance2 += dev2 * dev2;
  }
  
  covariance /= n;
  variance1 /= n;
  variance2 /= n;
  
  const stdDev1 = Math.sqrt(variance1);
  const stdDev2 = Math.sqrt(variance2);
  
  // Avoid division by zero
  if (stdDev1 === 0 || stdDev2 === 0) return 0;
  
  // Calculate and clamp correlation to handle floating point errors
  const correlation = covariance / (stdDev1 * stdDev2);
  return Math.max(-1, Math.min(1, correlation));
};
