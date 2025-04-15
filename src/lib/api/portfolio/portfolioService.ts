
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
      case '30y': timeFrame = '30year'; break;
      default: timeFrame = '5year';
    }
    
    // Incluir el benchmark en la lista de tickers si no está ya
    let allTickers = tickers;
    let portfolioWeights = [...weights];
    
    if (!tickers.includes(benchmark)) {
      allTickers = [...tickers, benchmark];
      // Añadir peso 0 para el benchmark en el cálculo del portafolio
      portfolioWeights = [...weights, 0];
    }
    
    // Obtener datos históricos para cada ticker
    const historicalDataPromises = allTickers.map(ticker => 
      fetchFinancialData(
        `https://financialmodelingprep.com/api/v3/historical-price-full/${ticker}`, 
        { apikey: FINANCIAL_MODELING_PREP_API_KEY, from: calculateStartDate(period), to: getTodayDate() }
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
    
    // Calcular retornos diarios
    const dailyReturns = calculateDailyReturns(sortedHistoricalData);
    
    // Verificar que hay datos suficientes para continuar
    if (dailyReturns.length === 0) {
      throw new Error("No se pudieron calcular los retornos diarios. Intente con un período más reciente.");
    }
    
    // Calcular retornos acumulados
    const cumulativeReturns = calculateCumulativeReturns(dailyReturns);
    
    // Verificar que hay datos del benchmark
    const hasBenchmarkData = dailyReturns.some(day => day[benchmark] !== undefined);
    if (!hasBenchmarkData) {
      throw new Error(`No hay datos disponibles para el benchmark ${benchmark} en el período seleccionado`);
    }
    
    // Calcular rendimiento del portafolio usando los pesos
    const portfolioPerformance = cumulativeReturns.map((day: any) => {
      const portfolioValue = allTickers.reduce((acc, ticker, idx) => {
        if (day[ticker] !== undefined && idx < portfolioWeights.length) {
          return acc + (day[ticker] * portfolioWeights[idx]);
        }
        return acc;
      }, 0);
      
      return {
        date: day.date,
        portfolio: portfolioValue,
        benchmark: day[benchmark]
      };
    });
    
    // Inicializar las métricas del portafolio antes de usarlas
    const portfolioMetrics = {
      annualReturn: 0,
      volatility: 0,
      sharpeRatio: 0,
      maxDrawdown: 0,
      alpha: 0,
      beta: 1
    };
    
    // Calcular métricas (rendimiento anual, volatilidad, etc.)
    const metrics = calculateMetrics(dailyReturns);
    
    // Verificar que las métricas se calcularon correctamente para todos los tickers
    allTickers.forEach(ticker => {
      if (!metrics[ticker]) {
        metrics[ticker] = {
          annualReturn: 0,
          volatility: 0,
          sharpeRatio: 0,
          maxDrawdown: 0,
          beta: ticker === benchmark ? 1 : 0,
        };
        console.warn(`No se pudieron calcular métricas para ${ticker}, usando valores por defecto`);
      }
    });
    
    // Calcular matriz de correlación
    const correlationMatrix = calculateCorrelationMatrix(dailyReturns);
    
    // Extraer métricas específicas del portafolio
    portfolioMetrics.annualReturn = allTickers.reduce((acc, ticker, idx) => {
      // Verificar que existe la métrica para este ticker
      if (metrics[ticker] && typeof metrics[ticker].annualReturn === 'number' && idx < portfolioWeights.length) {
        return acc + metrics[ticker].annualReturn * portfolioWeights[idx];
      }
      return acc;
    }, 0);
    
    portfolioMetrics.volatility = Math.sqrt(
      portfolioWeights.reduce((acc, weight, i) => {
        if (i >= allTickers.length || !metrics[allTickers[i]]) return acc;
        
        return acc + portfolioWeights.reduce((innerAcc, innerWeight, j) => {
          if (j >= allTickers.length || !metrics[allTickers[j]]) return innerAcc;
          
          // Usar matriz de correlación solo si ambos índices son válidos
          const correlation = i < correlationMatrix.length && j < correlationMatrix[i].length 
            ? correlationMatrix[i][j] 
            : 0;
          
          return innerAcc + weight * innerWeight * correlation * 
            metrics[allTickers[i]].volatility * metrics[allTickers[j]].volatility;
        }, 0);
      }, 0)
    );
    
    portfolioMetrics.maxDrawdown = Math.min(...portfolioPerformance.map((day: any, idx: number, arr: any[]) => {
      if (idx === 0) return 0;
      const maxPrevValue = Math.max(...arr.slice(0, idx).map((d: any) => d.portfolio));
      return day.portfolio / maxPrevValue - 1;
    }));
    
    portfolioMetrics.alpha = metrics[benchmark] ? 
      portfolioMetrics.annualReturn - metrics[benchmark].annualReturn : 0;
    
    // Calcular Sharpe Ratio del portafolio solo si la volatilidad es > 0
    portfolioMetrics.sharpeRatio = portfolioMetrics.volatility > 0 ? 
      portfolioMetrics.annualReturn / portfolioMetrics.volatility : 0;
    
    return {
      performanceChart: portfolioPerformance,
      correlationMatrix,
      metrics: portfolioMetrics,
      stockMetrics: Object.fromEntries(
        allTickers.map(ticker => [ticker, metrics[ticker] || {
          annualReturn: 0,
          volatility: 0,
          sharpeRatio: 0,
          maxDrawdown: 0,
          beta: ticker === benchmark ? 1 : 0,
        }])
      )
    };
  } catch (error) {
    console.error("Error fetching portfolio data:", error);
    throw new Error("Failed to fetch portfolio data");
  }
};
