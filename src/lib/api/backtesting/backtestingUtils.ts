// Backtesting utility functions

export const runBacktest = (historicalData: any[], tickers: string[], initialWeights: number[], benchmark: string, rebalancePeriod: string) => {
  // Convertir el período de rebalanceo a número de días (aproximado)
  const rebalanceInterval = getRebalanceInterval(rebalancePeriod);
  
  // Inicializar cartera y métricas
  let portfolio = { value: 1, allocation: [...initialWeights] };
  let benchmarkValue = 1;
  
  const portfolioPerformance: any[] = [];
  const allocationOverTime: any[] = [];
  
  // Simular inversión y rebalanceo
  let lastRebalanceIndex = 0;
  let needsRebalancing = false;
  
  historicalData.forEach((day, dayIndex) => {
    // Calcular rendimientos diarios
    if (dayIndex > 0) {
      // Actualizar valor de cada activo según rendimiento diario
      tickers.forEach((ticker, tickerIndex) => {
        if (day[ticker] && historicalData[dayIndex-1][ticker]) {
          const dailyReturn = day[ticker] / historicalData[dayIndex-1][ticker] - 1;
          
          // Actualizar el valor de la posición
          portfolio.allocation[tickerIndex] *= (1 + dailyReturn);
        }
      });
      
      // Actualizar valor total de la cartera
      portfolio.value = portfolio.allocation.reduce((sum, val) => sum + val, 0);
      
      // Actualizar valor del benchmark
      if (day[benchmark] && historicalData[dayIndex-1][benchmark]) {
        const benchmarkReturn = day[benchmark] / historicalData[dayIndex-1][benchmark] - 1;
        benchmarkValue *= (1 + benchmarkReturn);
      }
      
      // Verificar si es necesario rebalancear
      if (rebalanceInterval > 0 && dayIndex - lastRebalanceIndex >= rebalanceInterval) {
        needsRebalancing = true;
        lastRebalanceIndex = dayIndex;
      }
      
      // Realizar rebalanceo si es necesario
      if (needsRebalancing && rebalanceInterval > 0) {
        const totalValue = portfolio.value;
        portfolio.allocation = initialWeights.map(weight => weight * totalValue);
        needsRebalancing = false;
      }
    }
    
    // Registrar rendimiento y asignación
    portfolioPerformance.push({
      date: day.date,
      portfolio: portfolio.value,
      benchmark: benchmarkValue
    });
    
    // Registrar la asignación actual (como porcentajes)
    const totalValue = portfolio.value;
    const currentAllocation: any = { date: day.date };
    
    tickers.forEach((ticker, index) => {
      currentAllocation[ticker] = portfolio.allocation[index] / totalValue;
    });
    
    allocationOverTime.push(currentAllocation);
  });
  
  // Calcular métricas anuales
  const yearlyReturns = calculateYearlyReturns(portfolioPerformance);
  
  // Calcular métricas mensuales
  const monthlyReturns = calculateMonthlyReturns(portfolioPerformance);
  
  // Calcular drawdowns
  const drawdowns = calculateDrawdowns(portfolioPerformance);
  
  // Calcular métricas de rendimiento
  const portfolioMetrics = calculateBacktestMetrics(portfolioPerformance, 'portfolio');
  const benchmarkMetrics = calculateBacktestMetrics(portfolioPerformance, 'benchmark');
  
  // Calcular métricas móviles
  const windowSize = 30; // 30 días para métricas móviles
  const rollingMetrics = calculateRollingMetrics(portfolioPerformance, windowSize);
  
  return {
    portfolioPerformance,
    yearlyReturns,
    metrics: portfolioMetrics,
    benchmarkMetrics,
    monthlyReturns,
    drawdowns,
    allocationOverTime,
    rollingReturns: rollingMetrics.returns,
    rollingVolatility: rollingMetrics.volatility,
    rollingSharpe: rollingMetrics.sharpe,
    dataSource: undefined // Add this to fix TypeScript error
  };
};

export const getRebalanceInterval = (rebalancePeriod: string): number => {
  switch(rebalancePeriod) {
    case 'monthly': return 30;
    case 'quarterly': return 90;
    case 'semiannually': return 180;
    case 'annually': return 365;
    case 'none': return 0;
    default: return 90; // quarterly por defecto
  }
};

export const calculateYearlyReturns = (performance: any[]): any[] => {
  const yearlyData: any[] = [];
  const years = new Set<string>();
  
  // Extraer todos los años únicos
  performance.forEach(day => {
    const year = day.date.split('-')[0];
    years.add(year);
  });
  
  // Para cada año, calcular el rendimiento
  Array.from(years).sort().forEach(year => {
    // Encontrar el primer y último día del año en los datos
    const daysInYear = performance.filter(day => day.date.startsWith(year));
    
    if (daysInYear.length > 0) {
      const firstDay = daysInYear[0];
      const lastDay = daysInYear[daysInYear.length - 1];
      
      const portfolioReturn = lastDay.portfolio / firstDay.portfolio - 1;
      const benchmarkReturn = lastDay.benchmark / firstDay.benchmark - 1;
      
      yearlyData.push({
        year,
        portfolio: portfolioReturn,
        benchmark: benchmarkReturn
      });
    }
  });
  
  return yearlyData;
};

export const calculateMonthlyReturns = (performance: any[]): any[] => {
  const monthlyData: any[] = [];
  const yearMonths = new Set<string>();
  
  // Extraer todos los meses únicos (formato: YYYY-MM)
  performance.forEach(day => {
    const yearMonth = day.date.substring(0, 7);
    yearMonths.add(yearMonth);
  });
  
  // Agrupar por año
  const yearMonthsMap: Record<string, string[]> = {};
  Array.from(yearMonths).sort().forEach(yearMonth => {
    const year = yearMonth.split('-')[0];
    if (!yearMonthsMap[year]) {
      yearMonthsMap[year] = [];
    }
    yearMonthsMap[year].push(yearMonth);
  });
  
  // Para cada año, calcular los rendimientos mensuales
  Object.keys(yearMonthsMap).sort().forEach(year => {
    const monthsInYear = yearMonthsMap[year];
    const monthlyReturns = [];
    let annualReturn = 1;
    
    for (const month of monthsInYear) {
      // Encontrar el primer y último día del mes en los datos
      const daysInMonth = performance.filter(day => day.date.startsWith(month));
      
      if (daysInMonth.length > 0) {
        const firstDay = daysInMonth[0];
        const lastDay = daysInMonth[daysInMonth.length - 1];
        
        const monthlyReturn = lastDay.portfolio / firstDay.portfolio - 1;
        monthlyReturns.push(monthlyReturn);
        
        // Acumular para el retorno anual
        annualReturn *= (1 + monthlyReturn);
      } else {
        monthlyReturns.push(0);
      }
    }
    
    monthlyData.push({
      year,
      returns: monthlyReturns,
      annualReturn: annualReturn - 1
    });
  });
  
  return monthlyData;
};

export const calculateDrawdowns = (performance: any[]): any[] => {
  const drawdowns = [];
  let portfolioPeak = performance[0].portfolio;
  let benchmarkPeak = performance[0].benchmark;
  
  for (const day of performance) {
    // Actualizar picos si es necesario
    if (day.portfolio > portfolioPeak) portfolioPeak = day.portfolio;
    if (day.benchmark > benchmarkPeak) benchmarkPeak = day.benchmark;
    
    // Calcular drawdowns
    const portfolioDrawdown = day.portfolio / portfolioPeak - 1;
    const benchmarkDrawdown = day.benchmark / benchmarkPeak - 1;
    
    drawdowns.push({
      date: day.date,
      portfolio: portfolioDrawdown,
      benchmark: benchmarkDrawdown
    });
  }
  
  return drawdowns;
};

export const calculateBacktestMetrics = (performance: any[], key: string): any => {
  // Convertir rendimientos diarios
  const dailyReturns = [];
  for (let i = 1; i < performance.length; i++) {
    const dailyReturn = performance[i][key] / performance[i-1][key] - 1;
    dailyReturns.push(dailyReturn);
  }
  
  // Calcular CAGR
  const firstValue = performance[0][key];
  const lastValue = performance[performance.length - 1][key];
  const years = performance.length / 252; // Asumiendo ~252 días de mercado por año
  const cagr = Math.pow(lastValue / firstValue, 1/years) - 1;
  
  // Calcular volatilidad
  const avgReturn = dailyReturns.reduce((sum, ret) => sum + ret, 0) / dailyReturns.length;
  const variance = dailyReturns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) / dailyReturns.length;
  const dailyVol = Math.sqrt(variance);
  const annualizedVol = dailyVol * Math.sqrt(252);
  
  // Calcular máximo drawdown
  const drawdowns = calculateDrawdowns(performance);
  const maxDrawdown = Math.min(...drawdowns.map((day: any) => day[key]));
  
  // Calcular Sharpe y Sortino Ratios
  const riskFreeRate = 0.03; // Asumiendo una tasa libre de riesgo del 3%
  const excessReturn = cagr - riskFreeRate;
  const sharpe = excessReturn / annualizedVol;
  
  // Sortino solo considera volatilidad negativa
  const negativeReturns = dailyReturns.filter(ret => ret < 0);
  const negativeVariance = negativeReturns.length > 0 ? 
    negativeReturns.reduce((sum, ret) => sum + Math.pow(ret, 2), 0) / negativeReturns.length : 0;
  const downside = Math.sqrt(negativeVariance) * Math.sqrt(252);
  const sortino = downside > 0 ? excessReturn / downside : 0;
  
  // Calcular tasa de éxito
  const positiveReturns = dailyReturns.filter(ret => ret > 0).length;
  const winRate = positiveReturns / dailyReturns.length;
  
  // Calcular mejor y peor año
  const yearlyReturns = calculateYearlyReturns(performance);
  const bestYear = Math.max(...yearlyReturns.map((yr: any) => yr[key]));
  const worstYear = Math.min(...yearlyReturns.map((yr: any) => yr[key]));
  
  // Solo para la cartera, calcular alpha y beta
  let alpha = 0;
  let beta = key === 'benchmark' ? 1 : 0;
  
  if (key !== 'benchmark') {
    // Calcular beta (solo para la cartera)
    const benchmarkReturns = [];
    for (let i = 1; i < performance.length; i++) {
      benchmarkReturns.push(performance[i].benchmark / performance[i-1].benchmark - 1);
    }
    
    // Covarianza entre cartera y benchmark
    let covariance = 0;
    for (let i = 0; i < dailyReturns.length; i++) {
      covariance += (dailyReturns[i] - avgReturn) * (benchmarkReturns[i] - benchmarkReturns.reduce((sum, ret) => sum + ret, 0) / benchmarkReturns.length);
    }
    covariance /= dailyReturns.length;
    
    // Varianza del benchmark
    const benchmarkVariance = benchmarkReturns.reduce((sum, ret) => {
      const benchmarkAvg = benchmarkReturns.reduce((s, r) => s + r, 0) / benchmarkReturns.length;
      return sum + Math.pow(ret - benchmarkAvg, 2);
    }, 0) / benchmarkReturns.length;
    
    beta = covariance / benchmarkVariance;
    
    // Calcular alpha
    const benchmarkCagr = Math.pow(
      performance[performance.length - 1].benchmark / performance[0].benchmark, 
      1/years
    ) - 1;
    
    alpha = cagr - (riskFreeRate + beta * (benchmarkCagr - riskFreeRate));
  }
  
  return {
    cagr,
    volatility: annualizedVol,
    sharpeRatio: sharpe,
    sortino,
    maxDrawdown,
    winRate,
    bestYear,
    worstYear,
    alpha,
    beta,
    correlationToBenchmark: key === 'benchmark' ? 1 : calculateCorrelation(dailyReturns, performance.slice(1).map((day, i) => day.benchmark / performance[i].benchmark - 1))
  };
};

export const calculateRollingMetrics = (performance: any[], windowSize: number): any => {
  const rollingReturns = [];
  const rollingVolatility = [];
  const rollingSharpe = [];
  
  // Necesitamos al menos windowSize días para calcular métricas móviles
  for (let i = windowSize; i < performance.length; i++) {
    const windowStart = i - windowSize;
    const window = performance.slice(windowStart, i);
    
    // Calcular rendimientos diarios en la ventana
    const dailyReturns = {
      portfolio: [],
      benchmark: []
    };
    
    for (let j = 1; j < window.length; j++) {
      dailyReturns.portfolio.push(window[j].portfolio / window[j-1].portfolio - 1);
      dailyReturns.benchmark.push(window[j].benchmark / window[j-1].benchmark - 1);
    }
    
    // Calcular rendimiento anualizado
    const portfolioReturn = Math.pow(window[window.length-1].portfolio / window[0].portfolio, 252/windowSize) - 1;
    const benchmarkReturn = Math.pow(window[window.length-1].benchmark / window[0].benchmark, 252/windowSize) - 1;
    
    rollingReturns.push({
      date: performance[i].date,
      portfolio: portfolioReturn,
      benchmark: benchmarkReturn
    });
    
    // Calcular volatilidad anualizada
    const portfolioAvgReturn = dailyReturns.portfolio.reduce((sum, ret) => sum + ret, 0) / dailyReturns.portfolio.length;
    const portfolioVariance = dailyReturns.portfolio.reduce((sum, ret) => sum + Math.pow(ret - portfolioAvgReturn, 2), 0) / dailyReturns.portfolio.length;
    const portfolioVol = Math.sqrt(portfolioVariance) * Math.sqrt(252);
    
    const benchmarkAvgReturn = dailyReturns.benchmark.reduce((sum, ret) => sum + ret, 0) / dailyReturns.benchmark.length;
    const benchmarkVariance = dailyReturns.benchmark.reduce((sum, ret) => sum + Math.pow(ret - benchmarkAvgReturn, 2), 0) / dailyReturns.benchmark.length;
    const benchmarkVol = Math.sqrt(benchmarkVariance) * Math.sqrt(252);
    
    rollingVolatility.push({
      date: performance[i].date,
      portfolio: portfolioVol,
      benchmark: benchmarkVol
    });
    
    // Calcular Sharpe Ratio (asumiendo tasa libre de riesgo = 0 para simplificar)
    const portfolioSharpe = portfolioVol > 0 ? portfolioReturn / portfolioVol : 0;
    const benchmarkSharpe = benchmarkVol > 0 ? benchmarkReturn / benchmarkVol : 0;
    
    rollingSharpe.push({
      date: performance[i].date,
      portfolio: portfolioSharpe,
      benchmark: benchmarkSharpe
    });
  }
  
  return {
    returns: rollingReturns,
    volatility: rollingVolatility,
    sharpe: rollingSharpe
  };
};

// Add missing import for calculateCorrelation function
import { calculateCorrelation } from '../utils/metricsCalculations';
