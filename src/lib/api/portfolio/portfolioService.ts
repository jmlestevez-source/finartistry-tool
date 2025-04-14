
// Portfolio analysis service

import { FINANCIAL_MODELING_PREP_API_KEY } from '../constants';
import { fetchFinancialData } from '../utils/apiUtils';
import { calculateStartDate, getTodayDate } from '../utils/dateUtils';
import { 
  transformFMPHistoricalData,
  calculateDailyReturns,
  calculateCumulativeReturns
} from '../utils/dataTransformations';
import { 
  calculateMetrics, 
  calculateCorrelationMatrix 
} from '../utils/metricsCalculations';

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
