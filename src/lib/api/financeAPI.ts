import { toast } from "@/hooks/use-toast";

// API Keys
const FINANCIAL_MODELING_PREP_API_KEY = "FedUgaGEN9Pv19qgVxh2nHw0JWg5V6uh";
const ALPHA_VANTAGE_API_KEY = "XFXHX5W3S21MV9PT";

// Interfaces
interface PortfolioParams {
  tickers: string[];
  weights: number[];
  benchmark: string;
  period: string;
}

interface BacktestParams {
  tickers: string[];
  weights: number[];
  benchmark: string;
  startDate: string;
  endDate?: string;
  rebalancePeriod: string;
}

// Utilidades de transformación de datos
const transformFMPHistoricalData = (data: any[], ticker: string) => {
  return data.map((item) => ({
    date: item.date,
    [ticker]: item.adjClose || item.close
  }));
};

const calculateDailyReturns = (historicalData: any[]) => {
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

const calculateCumulativeReturns = (dailyReturns: any[]) => {
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

const calculatePortfolioPerformance = (stocksData: any[], weights: number[]) => {
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

const calculateMetrics = (returns: any[]) => {
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

const calculateCorrelationMatrix = (returns: any[]) => {
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

// API Handlers
export const fetchPortfolioData = async (
  tickers: string[], 
  weights: number[], 
  benchmark: string, 
  period: string
) => {
  try {
    console.log(`Fetching portfolio data for ${tickers.join(', ')} with benchmark ${benchmark} for period ${period}`);
    
    // Convertir periodo en un formato compatible con la API
    let timeFrame;
    switch(period) {
      case '1y': timeFrame = '1year'; break;
      case '3y': timeFrame = '3year'; break;
      case '5y': timeFrame = '5year'; break;
      case '10y': timeFrame = '10year'; break;
      default: timeFrame = '5year';
    }
    
    // Incluir el benchmark en la lista de tickers si no está ya
    if (!tickers.includes(benchmark)) {
      tickers = [...tickers, benchmark];
      // Añadir peso 0 para el benchmark en el cálculo del portafolio
      weights = [...weights, 0];
    }
    
    // Obtener datos históricos para cada ticker
    const historicalDataPromises = tickers.map(ticker => 
      fetchFinancialData(
        `https://financialmodelingprep.com/api/v3/historical-price-full/${ticker}`, 
        { apikey: FINANCIAL_MODELING_PREP_API_KEY, from: calculateStartDate(period), to: getTodayDate() }
      )
    );
    
    const historicalDataResponses = await Promise.all(historicalDataPromises);
    
    // Procesar y combinar datos históricos
    let combinedData: any = {};
    historicalDataResponses.forEach((response, index) => {
      const ticker = tickers[index];
      if (response && response.historical) {
        const transformedData = transformFMPHistoricalData(response.historical, ticker);
        
        transformedData.forEach((item: any) => {
          if (!combinedData[item.date]) {
            combinedData[item.date] = { date: item.date };
          }
          combinedData[item.date][ticker] = item[ticker];
        });
      }
    });
    
    // Convertir a array y ordenar por fecha
    const sortedHistoricalData = Object.values(combinedData)
      .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    // Calcular retornos diarios
    const dailyReturns = calculateDailyReturns(sortedHistoricalData);
    
    // Calcular retornos acumulados
    const cumulativeReturns = calculateCumulativeReturns(dailyReturns);
    
    // Calcular rendimiento del portafolio usando los pesos
    const portfolioPerformance = cumulativeReturns.map((day: any) => {
      const portfolioValue = tickers.reduce((acc, ticker, idx) => {
        if (day[ticker] !== undefined && idx < weights.length) {
          return acc + (day[ticker] * weights[idx]);
        }
        return acc;
      }, 0);
      
      return {
        date: day.date,
        portfolio: portfolioValue,
        benchmark: day[benchmark]
      };
    });
    
    // Calcular métricas (rendimiento anual, volatilidad, etc.)
    const metrics = calculateMetrics(dailyReturns);
    
    // Calcular matriz de correlación
    const correlationMatrix = calculateCorrelationMatrix(dailyReturns);
    
    // Extraer métricas específicas del portafolio
    const portfolioMetrics = {
      annualReturn: tickers.reduce((acc, ticker, idx) => acc + metrics[ticker].annualReturn * weights[idx], 0),
      volatility: Math.sqrt(
        weights.reduce((acc, weight, i) => {
          return acc + weights.reduce((innerAcc, innerWeight, j) => {
            return innerAcc + weight * innerWeight * correlationMatrix[i][j] * 
              metrics[tickers[i]].volatility * metrics[tickers[j]].volatility;
          }, 0);
        }, 0)
      ),
      maxDrawdown: Math.min(...portfolioPerformance.map((day: any, idx: number, arr: any[]) => {
        if (idx === 0) return 0;
        const maxPrevValue = Math.max(...arr.slice(0, idx).map((d: any) => d.portfolio));
        return day.portfolio / maxPrevValue - 1;
      })),
      alpha: metrics[benchmark] ? metrics[tickers[0]].annualReturn - metrics[benchmark].annualReturn : 0,
      beta: 1, // Por defecto
      sharpeRatio: 0 // Inicializamos aquí el sharpeRatio
    };
    
    // Calcular Sharpe Ratio del portafolio
    portfolioMetrics.sharpeRatio = portfolioMetrics.annualReturn / portfolioMetrics.volatility;
    
    return {
      performanceChart: portfolioPerformance,
      correlationMatrix,
      metrics: portfolioMetrics,
      stockMetrics: Object.fromEntries(
        tickers.map(ticker => [ticker, metrics[ticker]])
      )
    };
  } catch (error) {
    console.error("Error fetching portfolio data:", error);
    throw new Error("Failed to fetch portfolio data");
  }
};

export const fetchStockValuation = async (ticker: string) => {
  try {
    console.log(`Fetching stock valuation data for ${ticker}`);
    
    // 1. Obtener información general de la empresa
    const companyInfoPromise = fetchFinancialData(
      `https://financialmodelingprep.com/api/v3/profile/${ticker}`,
      { apikey: FINANCIAL_MODELING_PREP_API_KEY }
    );
    
    // 2. Obtener métricas financieras
    const ratiosPromise = fetchFinancialData(
      `https://financialmodelingprep.com/api/v3/ratios-ttm/${ticker}`,
      { apikey: FINANCIAL_MODELING_PREP_API_KEY }
    );
    
    // 3. Obtener datos históricos para gráfico de precios
    const historicalPricesPromise = fetchFinancialData(
      `https://financialmodelingprep.com/api/v3/historical-price-full/${ticker}`,
      { apikey: FINANCIAL_MODELING_PREP_API_KEY, from: calculateStartDate('5y'), to: getTodayDate() }
    );
    
    // 4. Obtener tasas de crecimiento
    const growthRatesPromise = fetchFinancialData(
      `https://financialmodelingprep.com/api/v3/financial-growth/${ticker}`,
      { apikey: FINANCIAL_MODELING_PREP_API_KEY, limit: 5 }
    );
    
    // 5. Obtener promedios de la industria para comparación
    const industryRatiosPromise = fetchFinancialData(
      `https://financialmodelingprep.com/api/v4/industry_ratios`,
      { apikey: FINANCIAL_MODELING_PREP_API_KEY }
    );
    
    // Esperar a que todas las promesas se resuelvan
    const [companyInfoResponse, ratiosResponse, historicalPricesResponse, growthRatesResponse, industryRatiosResponse] = 
      await Promise.all([companyInfoPromise, ratiosPromise, historicalPricesPromise, growthRatesPromise, industryRatiosPromise]);
    
    // Procesar la información de la empresa
    if (!companyInfoResponse || companyInfoResponse.length === 0) {
      throw new Error(`No company info found for ${ticker}`);
    }
    
    const companyInfo = {
      name: companyInfoResponse[0].companyName,
      sector: companyInfoResponse[0].sector || 'N/A',
      industry: companyInfoResponse[0].industry || 'N/A',
      marketCap: companyInfoResponse[0].mktCap || 0,
      currentPrice: companyInfoResponse[0].price || 0
    };
    
    // Procesar datos históricos
    const historicalPrices = historicalPricesResponse?.historical?.map((item: any) => ({
      date: item.date,
      price: item.close
    })) || [];
    
    // Procesar ratios financieros y compararlos con la industria
    let financialRatios = [];
    const industryAvg = findIndustryAverages(industryRatiosResponse, companyInfo.industry);
    
    if (ratiosResponse && ratiosResponse.length > 0) {
      const ratios = ratiosResponse[0];
      
      financialRatios = [
        { name: 'P/E', value: ratios.peRatioTTM || 0, industryAvg: industryAvg.peRatioTTM || 0 },
        { name: 'P/B', value: ratios.priceToBookRatioTTM || 0, industryAvg: industryAvg.priceToBookRatioTTM || 0 },
        { name: 'P/S', value: ratios.priceToSalesRatioTTM || 0, industryAvg: industryAvg.priceToSalesRatioTTM || 0 },
        { name: 'EV/EBITDA', value: ratios.enterpriseValueMultipleTTM || 0, industryAvg: industryAvg.enterpriseValueMultipleTTM || 0 },
        { name: 'ROE', value: ratios.returnOnEquityTTM || 0, industryAvg: industryAvg.returnOnEquityTTM || 0 },
        { name: 'ROA', value: ratios.returnOnAssetsTTM || 0, industryAvg: industryAvg.returnOnAssetsTTM || 0 },
        { name: 'Margen Neto', value: ratios.netProfitMarginTTM || 0, industryAvg: industryAvg.netProfitMarginTTM || 0 },
      ];
    } else {
      // Valores por defecto si no hay datos
      financialRatios = [
        { name: 'P/E', value: 0, industryAvg: 0 },
        { name: 'P/B', value: 0, industryAvg: 0 },
        { name: 'P/S', value: 0, industryAvg: 0 },
        { name: 'EV/EBITDA', value: 0, industryAvg: 0 },
        { name: 'ROE', value: 0, industryAvg: 0 },
        { name: 'ROA', value: 0, industryAvg: 0 },
        { name: 'Margen Neto', value: 0, industryAvg: 0 },
      ];
    }
    
    // Procesar tasas de crecimiento
    let growthRates = {
      revenue: { oneYear: 0, threeYear: 0, fiveYear: 0, projected: 0 },
      earnings: { oneYear: 0, threeYear: 0, fiveYear: 0, projected: 0 },
      freeCashFlow: { oneYear: 0, threeYear: 0, fiveYear: 0, projected: 0 },
      drivers: [
        { name: 'Expansión', contribution: 0.4 },
        { name: 'Precios', contribution: 0.3 },
        { name: 'Nuevos Productos', contribution: 0.2 },
        { name: 'Eficiencia', contribution: 0.1 },
      ]
    };
    
    if (growthRatesResponse && growthRatesResponse.length > 0) {
      const growth = growthRatesResponse[0];
      
      growthRates.revenue.oneYear = growth.revenueGrowth || 0;
      growthRates.earnings.oneYear = growth.epsgrowth || 0;
      growthRates.freeCashFlow.oneYear = growth.freeCashFlowGrowth || 0;
      
      // Proyectar crecimiento futuro basado en histórico
      growthRates.revenue.projected = growth.revenueGrowth * 0.8; // Asumimos que el crecimiento futuro será el 80% del histórico
      growthRates.earnings.projected = growth.epsgrowth * 0.8;
      growthRates.freeCashFlow.projected = growth.freeCashFlowGrowth * 0.8;
      
      // Si hay suficientes datos, calcular crecimiento a 3 y 5 años
      if (growthRatesResponse.length >= 3) {
        growthRates.revenue.threeYear = (Math.pow(
          (1 + growthRatesResponse[0].revenueGrowth) *
          (1 + growthRatesResponse[1].revenueGrowth) *
          (1 + growthRatesResponse[2].revenueGrowth)
        , 1/3) - 1) || 0;
        
        growthRates.earnings.threeYear = (Math.pow(
          (1 + growthRatesResponse[0].epsgrowth) *
          (1 + growthRatesResponse[1].epsgrowth) *
          (1 + growthRatesResponse[2].epsgrowth)
        , 1/3) - 1) || 0;
        
        growthRates.freeCashFlow.threeYear = (Math.pow(
          (1 + growthRatesResponse[0].freeCashFlowGrowth) *
          (1 + growthRatesResponse[1].freeCashFlowGrowth) *
          (1 + growthRatesResponse[2].freeCashFlowGrowth)
        , 1/3) - 1) || 0;
      }
      
      if (growthRatesResponse.length >= 5) {
        growthRates.revenue.fiveYear = (Math.pow(
          growthRatesResponse.slice(0, 5).reduce((acc, curr) => acc * (1 + curr.revenueGrowth), 1)
        , 1/5) - 1) || 0;
        
        growthRates.earnings.fiveYear = (Math.pow(
          growthRatesResponse.slice(0, 5).reduce((acc, curr) => acc * (1 + curr.epsgrowth), 1)
        , 1/5) - 1) || 0;
        
        growthRates.freeCashFlow.fiveYear = (Math.pow(
          growthRatesResponse.slice(0, 5).reduce((acc, curr) => acc * (1 + curr.freeCashFlowGrowth), 1)
        , 1/5) - 1) || 0;
      }
    }
    
    // Calcular valores justos usando diferentes modelos
    // Usar Alpha Vantage para obtener algunas métricas adicionales
    const earningsPromise = fetchAlphaVantageData(
      'EARNINGS',
      { symbol: ticker, apikey: ALPHA_VANTAGE_API_KEY }
    );
    
    const overviewPromise = fetchAlphaVantageData(
      'OVERVIEW',
      { symbol: ticker, apikey: ALPHA_VANTAGE_API_KEY }
    );
    
    const [earningsData, overviewData] = await Promise.all([earningsPromise, overviewPromise]);
    
    // Calcular modelos de valoración
    const valuationModels = calculateValuationModels(
      companyInfo, 
      ratiosResponse?.[0] || {}, 
      earningsData, 
      overviewData,
      growthRates
    );
    
    // Calcular métricas de riesgo
    const beta = overviewData?.Beta ? parseFloat(overviewData.Beta as string) : (companyInfoResponse[0].beta || 1);
    
    // Usar datos de volatilidad histórica para métricas de riesgo
    const dailyReturns = calculateDailyReturns(historicalPrices);
    const volatility = calculateVolatility(dailyReturns);
    
    const riskMetrics = {
      beta,
      volatility,
      sharpeRatio: (growthRates.earnings.oneYear || 0) / volatility, // Aproximación simple
      maxDrawdown: calculateMaxDrawdown(historicalPrices),
      valueAtRisk: -volatility * 1.65, // Aproximación de VaR al 95%
      correlations: [
        { name: 'S&P 500', value: 0.7 }, // Valores por defecto, idealmente se calcularían realmente
        { name: 'Nasdaq', value: 0.75 },
        { name: 'Russell 2000', value: 0.6 },
        { name: '10Y Treasury', value: -0.2 },
      ],
      riskFactors: [
        {
          name: 'Riesgo de mercado',
          level: beta > 1.3 ? 'Alto' : beta > 0.8 ? 'Medio' : 'Bajo',
          description: 'Sensibilidad a los movimientos generales del mercado.'
        },
        {
          name: 'Riesgo sectorial',
          level: companyInfo.sector === 'Technology' || companyInfo.sector === 'Healthcare' ? 'Alto' : 'Medio',
          description: 'Exposición a factores específicos del sector.'
        },
        {
          name: 'Riesgo financiero',
          level: (ratiosResponse?.[0]?.debtEquityRatioTTM || 0) > 1.5 ? 'Alto' : 'Medio',
          description: 'Estructura de capital y sostenibilidad financiera.'
        },
        {
          name: 'Riesgo legal/regulatorio',
          level: ['Financial Services', 'Healthcare', 'Energy'].includes(companyInfo.sector) ? 'Alto' : 'Medio',
          description: 'Exposición a cambios legales o regulatorios.'
        }
      ]
    };
    
    return {
      companyInfo,
      valuationModels,
      historicalPrices,
      financialRatios,
      growthRates,
      riskMetrics
    };
  } catch (error) {
    console.error("Error fetching stock valuation data:", error);
    throw new Error("Failed to fetch stock valuation data");
  }
};

export const fetchBacktestResults = async (params: BacktestParams) => {
  try {
    const { tickers, weights, benchmark, startDate, endDate, rebalancePeriod } = params;
    
    console.log(`Fetching backtest data with params:`, params);
    
    // Incluir el benchmark en la lista de tickers si no está ya
    let allTickers = tickers.includes(benchmark) ? tickers : [...tickers, benchmark];
    
    // Obtener datos históricos para cada ticker
    const historicalDataPromises = allTickers.map(ticker => 
      fetchFinancialData(
        `https://financialmodelingprep.com/api/v3/historical-price-full/${ticker}`, 
        { 
          apikey: FINANCIAL_MODELING_PREP_API_KEY, 
          from: startDate, 
          to: endDate || getTodayDate() 
        }
      )
    );
    
    const historicalDataResponses = await Promise.all(historicalDataPromises);
    
    // Procesar y combinar datos históricos
    let combinedData: any = {};
    historicalDataResponses.forEach((response, index) => {
      const ticker = allTickers[index];
      if (response && response.historical) {
        const transformedData = transformFMPHistoricalData(response.historical, ticker);
        
        transformedData.forEach((item: any) => {
          if (!combinedData[item.date]) {
            combinedData[item.date] = { date: item.date };
          }
          combinedData[item.date][ticker] = item[ticker];
        });
      }
    });
    
    // Convertir a array y ordenar por fecha
    const sortedHistoricalData = Object.values(combinedData)
      .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    if (sortedHistoricalData.length === 0) {
      throw new Error("No historical data available for the specified period");
    }
    
    // Implementar lógica de backtesting según el período de rebalanceo
    const backtestResults = runBacktest(sortedHistoricalData, tickers, weights, benchmark, rebalancePeriod);
    
    return backtestResults;
  } catch (error) {
    console.error("Error fetching backtest results:", error);
    throw new Error("Failed to fetch backtest results");
  }
};

// Funciones auxiliares para los cálculos

function runBacktest(historicalData: any[], tickers: string[], initialWeights: number[], benchmark: string, rebalancePeriod: string) {
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
    rollingSharpe: rollingMetrics.sharpe
  };
}

function getRebalanceInterval(rebalancePeriod: string): number {
  switch(rebalancePeriod) {
    case 'monthly': return 30;
    case 'quarterly': return 90;
    case 'semiannually': return 180;
    case 'annually': return 365;
    case 'none': return 0;
    default: return 90; // quarterly por defecto
  }
}

function calculateYearlyReturns(performance: any[]): any[] {
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
}

function calculateMonthlyReturns(performance: any[]): any[] {
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
}

function calculateDrawdowns(performance: any[]): any[] {
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
}

function calculateBacktestMetrics(performance: any[], key: string): any {
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
}

function calculateRollingMetrics(performance: any[], windowSize: number): any {
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
}

// Funciones auxiliares para la valoración de acciones

function calculateValuationModels(companyInfo: any, ratios: any, earnings: any, overview: any, growthRates: any) {
  const models = [];
  const currentPrice = companyInfo.currentPrice;
  
  // 1. Modelo DCF simplificado
  try {
    const eps = parseFloat(overview?.EPS || '0');
    const growthRate = growthRates.earnings.fiveYear || growthRates.earnings.projected || 0.05;
    const discountRate = 0.09; // Tasa de descuento de 9%
    const terminalMultiple = 15; // P/E terminal de 15
    const projectionYears = 5;
    
    let dcfValue = 0;
    let projectedEPS = eps;
    
    // Flujos de caja descontados para los años de proyección
    for (let year = 1; year <= projectionYears; year++) {
      projectedEPS *= (1 + growthRate);
      dcfValue += projectedEPS / Math.pow(1 + discountRate, year);
    }
    
    // Valor terminal
    const terminalValue = (projectedEPS * terminalMultiple) / Math.pow(1 + discountRate, projectionYears);
    dcfValue += terminalValue;
    
    models.push({
      name: "DCF",
      fairValue: dcfValue,
      upside: dcfValue / currentPrice - 1,
      description: "Flujos de caja descontados"
    });
  } catch (error) {
    console.error("Error calculating DCF model:", error);
  }
  
  // 2. Modelo P/E
  try {
    const eps = parseFloat(overview?.EPS || '0');
    const sectorPE = parseFloat(overview?.PERatio || '0') * 1.1; // Usamos el P/E actual de la empresa con un pequeño premio
    
    if (eps > 0 && sectorPE > 0) {
      const peValue = eps * sectorPE;
      
      models.push({
        name: "P/E",
        fairValue: peValue,
        upside: peValue / currentPrice - 1,
        description: "Múltiplo de beneficios"
      });
    }
  } catch (error) {
    console.error("Error calculating P/E model:", error);
  }
  
  // 3. Modelo P/B
  try {
    const bookValuePerShare = parseFloat(overview?.BookValue || '0');
    const pb = ratios.priceToBookRatioTTM || 2;
    
    if (bookValuePerShare > 0) {
      const pbValue = bookValuePerShare * pb;
      
      models.push({
        name: "P/B",
        fairValue: pbValue,
        upside: pbValue / currentPrice - 1,
        description: "Múltiplo de valor contable"
      });
    }
  } catch (error) {
    console.error("Error calculating P/B model:", error);
  }
  
  // 4. Modelo EV/EBITDA
  try {
    const evToEbitda = ratios.enterpriseValueMultipleTTM || 12;
    const sharesOutstanding = parseFloat(overview?.SharesOutstanding || '1');
    const ebitdaPerShare = (ratios.operatingIncomePerShareTTM || 0) * 1.2; // Aproximación de EBITDA
    
    if (ebitdaPerShare > 0) {
      const evEbitdaValue = ebitdaPerShare * evToEbitda;
      
      models.push({
        name: "EV/EBITDA",
        fairValue: evEbitdaValue,
        upside: evEbitdaValue / currentPrice - 1,
        description: "Múltiplo de EBITDA"
      });
    }
  } catch (error) {
    console.error("Error calculating EV/EBITDA model:", error);
  }
  
  // 5. Modelo de Descuento de Dividendos (si aplica)
  try {
    const dividendYield = parseFloat(overview?.DividendYield || '0');
    const dividendPerShare = parseFloat(overview?.DividendPerShare || '0');
    const dividendGrowthRate = growthRates.earnings.projected * 0.7 || 0.03; // 70% del crecimiento de beneficios
    
    if (dividendPerShare > 0) {
      // Modelo de Gordon
      const requiredReturn = 0.08; // 8% rendimiento requerido
      const ddmValue = dividendPerShare * (1 + dividendGrowthRate) / (requiredReturn - dividendGrowthRate);
      
      models.push({
        name: "DDM",
        fairValue: ddmValue,
        upside: ddmValue / currentPrice - 1,
        description: "Modelo de descuento de dividendos"
      });
    }
  } catch (error) {
    console.error("Error calculating DDM model:", error);
  }
  
  return models;
}

// Utilitarias
function calculateStartDate(period: string): string {
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
    case 'max':
      startDate = new Date(1990, 0, 1);
      break;
    default:
      startDate = new Date(today.getFullYear() - 5, today.getMonth(), today.getDate());
  }
  
  return startDate.toISOString().split('T')[0];
}

function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

function findIndustryAverages(industryData: any, industry: string): any {
  if (!industryData || !Array.isArray(industryData)) return {};
  
  const industryRatios = industryData.find((item: any) => 
    item.industry && item.industry.toLowerCase() === industry.toLowerCase()
  );
  
  return industryRatios || {};
}

function calculateVolatility(returns: any[]): number {
  if (returns.length < 2) return 0;
  
  const dailyReturns = returns.map(day => Object.values(day)[1] || 0).filter(val => !isNaN(val));
  
  if (dailyReturns.length < 2) return 0;
  
  const mean = dailyReturns.reduce((sum, val) => sum + val, 0) / dailyReturns.length;
  const variance = dailyReturns.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (dailyReturns.length - 1);
  
  return Math.sqrt(variance) * Math.sqrt(252); // Anualizar volatilidad
}

function calculateMaxDrawdown(priceData: any[]): number {
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
}

function calculateCorrelation(series1: number[], series2: number[]): number {
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
}

// Función para realizar llamadas a la API de Financial Modeling Prep
const fetchFinancialData = async (endpoint: string, params: Record<string, string>) => {
  const url = new URL(endpoint);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, value);
  });
  
  try {
    console.log(`Fetching data from: ${url.toString()}`);
    const response = await fetch(url.toString());
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("API request failed:", error);
    throw error;
  }
};

// Función para realizar llamadas a la API de Alpha Vantage
const fetchAlphaVantageData = async (function_name: string, params: Record<string, string>) => {
  const url = new URL('https://www.alphavantage.co/query');
  url.searchParams.append('function', function_name);
  
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, value);
  });
  
  try {
    console.log(`Fetching Alpha Vantage data: ${url.toString()}`);
    const response = await fetch(url.toString());
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Alpha Vantage API request failed:", error);
    throw error;
  }
};
