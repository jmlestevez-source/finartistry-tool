
// Metrics calculation utility functions

export const calculateMetrics = (returns: any[]) => {
  const tickers = Object.keys(returns[0]).filter(key => key !== 'date');
  const metrics: Record<string, any> = {};
  
  tickers.forEach(ticker => {
    const tickerReturns = returns.map(day => day[ticker]).filter(val => val !== undefined);
    
    // Anualizar rendimiento (asumiendo que son datos diarios)
    const annualReturn = Math.pow(1 + tickerReturns.reduce((acc, val) => acc + val, 0) / tickerReturns.length, 252) - 1;
    
    // Calcular volatilidad anualizada
    const mean = tickerReturns.reduce((acc, val) => acc + val, 0) / tickerReturns.length;
    const variance = tickerReturns.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / (tickerReturns.length - 1);
    const volatility = Math.sqrt(variance) * Math.sqrt(252);
    
    // Calcular Sharpe Ratio (asumiendo tasa libre de riesgo = 0 para simplificar)
    const sharpeRatio = annualReturn / volatility;
    
    // Calcular drawdown máximo
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
    
    // Extraer tasa libre de riesgo y beta del primer ticker como benchmark
    let alpha = 0;
    let beta = ticker === tickers[0] ? 1 : 0;
    
    // Si no es el benchmark, calcular beta y alpha
    if (ticker !== tickers[0]) {
      const benchmarkReturns = returns.map(day => day[tickers[0]]).filter(val => val !== undefined);
      
      // Calcular beta
      const covariance = tickerReturns.reduce((acc, val, idx) => 
        acc + (val - mean) * (benchmarkReturns[idx] - benchmarkReturns.reduce((a, v) => a + v, 0) / benchmarkReturns.length), 0
      ) / (tickerReturns.length - 1);
      
      const benchmarkVariance = benchmarkReturns.reduce((acc, val) => 
        acc + Math.pow(val - benchmarkReturns.reduce((a, v) => a + v, 0) / benchmarkReturns.length, 2), 0
      ) / (benchmarkReturns.length - 1);
      
      beta = covariance / benchmarkVariance;
      
      // Calcular alpha
      const benchmarkAnnualReturn = Math.pow(1 + benchmarkReturns.reduce((acc, val) => acc + val, 0) / benchmarkReturns.length, 252) - 1;
      alpha = annualReturn - (benchmarkAnnualReturn * beta);
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
    tickerReturns[ticker] = returns.map(day => day[ticker]).filter(val => val !== undefined);
  });
  
  // Calcular correlación para cada par de tickers
  for (let i = 0; i < tickers.length; i++) {
    for (let j = i; j < tickers.length; j++) {
      const ticker1 = tickers[i];
      const ticker2 = tickers[j];
      
      // Si es el mismo ticker, correlación = 1
      if (i === j) {
        correlationMatrix[i][j] = 1;
        continue;
      }
      
      const returns1 = tickerReturns[ticker1];
      const returns2 = tickerReturns[ticker2];
      
      // Calcular medias
      const mean1 = returns1.reduce((acc, val) => acc + val, 0) / returns1.length;
      const mean2 = returns2.reduce((acc, val) => acc + val, 0) / returns2.length;
      
      // Calcular desviaciones estándar
      const variance1 = returns1.reduce((acc, val) => acc + Math.pow(val - mean1, 2), 0) / returns1.length;
      const variance2 = returns2.reduce((acc, val) => acc + Math.pow(val - mean2, 2), 0) / returns2.length;
      
      const stdDev1 = Math.sqrt(variance1);
      const stdDev2 = Math.sqrt(variance2);
      
      // Calcular covarianza
      let covariance = 0;
      for (let k = 0; k < returns1.length; k++) {
        covariance += (returns1[k] - mean1) * (returns2[k] - mean2);
      }
      covariance /= returns1.length;
      
      // Calcular correlación
      const correlation = covariance / (stdDev1 * stdDev2);
      
      // Asignar valor a matriz
      correlationMatrix[i][j] = correlation;
      correlationMatrix[j][i] = correlation; // La matriz es simétrica
    }
  }
  
  return correlationMatrix;
};

export const calculateVolatility = (returns: any[]): number => {
  if (returns.length < 2) return 0;
  
  const dailyReturns = returns.map(day => Object.values(day)[1] || 0).filter(val => !isNaN(val));
  
  if (dailyReturns.length < 2) return 0;
  
  const mean = dailyReturns.reduce((sum, val) => sum + val, 0) / dailyReturns.length;
  const variance = dailyReturns.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (dailyReturns.length - 1);
  
  return Math.sqrt(variance) * Math.sqrt(252); // Anualizar volatilidad
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
  // Asegurarse de que ambas series tienen la misma longitud
  const n = Math.min(series1.length, series2.length);
  if (n < 2) return 0;
  
  // Calcular medias
  const mean1 = series1.reduce((sum, val) => sum + val, 0) / n;
  const mean2 = series2.reduce((sum, val) => sum + val, 0) / n;
  
  // Calcular covarianza y varianzas
  let covariance = 0;
  let variance1 = 0;
  let variance2 = 0;
  
  for (let i = 0; i < n; i++) {
    const dev1 = series1[i] - mean1;
    const dev2 = series2[i] - mean2;
    covariance += dev1 * dev2;
    variance1 += dev1 * dev1;
    variance2 += dev2 * dev2;
  }
  
  covariance /= n;
  variance1 /= n;
  variance2 /= n;
  
  const stdDev1 = Math.sqrt(variance1);
  const stdDev2 = Math.sqrt(variance2);
  
  // Evitar división por cero
  if (stdDev1 === 0 || stdDev2 === 0) return 0;
  
  return covariance / (stdDev1 * stdDev2);
};
