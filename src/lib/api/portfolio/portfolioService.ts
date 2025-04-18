
// Portfolio analysis service

import { FINANCIAL_MODELING_PREP_API_KEY } from '../constants';
import { fetchFinancialData, fetchYahooFinanceData } from '../utils/apiUtils';
import { 
  calculateStartDate, 
  getTodayDate, 
  calculateAnnualizedReturn,
  getActualDataPeriodYears
} from '../utils/dateUtils';
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
    
    // Incluir el benchmark en la lista de tickers si no está ya
    let allTickers = tickers;
    let portfolioWeights = [...weights];
    
    if (!tickers.includes(benchmark)) {
      allTickers = [...tickers, benchmark];
      // Añadir peso 0 para el benchmark en el cálculo del portafolio
      portfolioWeights = [...weights, 0];
    }
    
    let dataSource = '';
    
    // Intentar con Yahoo Finance directamente
    console.log("Attempting to fetch data from Yahoo Finance...");
    const yahooPromises = allTickers.map(ticker => 
      fetchYahooFinanceData(ticker, calculateStartDate(period), getTodayDate())
    );
    
    const yahooResponses = await Promise.allSettled(yahooPromises);
    const successfulYahooResponses = yahooResponses.filter(
      response => response.status === 'fulfilled' && response.value && response.value.historical && response.value.historical.length > 0
    );
    
    // Si no tenemos suficientes datos de Yahoo (al menos 80% de los tickers), arrojar error
    if (successfulYahooResponses.length < allTickers.length * 0.8) {
      throw new Error(`No hay suficientes datos disponibles para los tickers seleccionados en el período ${period}. Por favor, intente con otros tickers o un período más reciente.`);
    }
    
    console.log("Using Yahoo Finance data for portfolio analysis");
    dataSource = 'Yahoo Finance';
    
    // Procesar y combinar datos históricos
    let combinedData: any = {};
    
    yahooResponses.forEach((response, index) => {
      if (response.status === 'fulfilled' && response.value && response.value.historical) {
        const ticker = allTickers[index];
        const transformedData = response.value.historical;
        
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
      throw new Error(`No hay datos históricos disponibles para el análisis. Por favor, intente con otros tickers o un período más reciente.`);
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
        benchmark: day[benchmark] || 0
      };
    });
    
    // Calcular métricas (rendimiento anual, volatilidad, etc.)
    const metrics = calculateMetrics(dailyReturns);
    
    // Inicializar las métricas del portafolio
    const portfolioMetrics = {
      annualReturn: 0,
      volatility: 0,
      sharpeRatio: 0,
      maxDrawdown: 0,
      alpha: 0,
      beta: 1
    };
    
    // Para cada ticker que no tiene métricas calculadas, calcular manualmente
    // basado en los datos disponibles
    allTickers.forEach(ticker => {
      if (!metrics[ticker] || metrics[ticker].annualReturn === 0) {
        const annualReturn = calculateAnnualizedReturn(dailyReturns, ticker);
        
        if (!metrics[ticker]) {
          metrics[ticker] = {
            annualReturn: annualReturn,
            volatility: 0,
            sharpeRatio: 0,
            maxDrawdown: 0,
            beta: ticker === benchmark ? 1 : 0,
            alpha: 0
          };
        } else {
          metrics[ticker].annualReturn = annualReturn;
        }
        
        // Si todavía es 0, puede que no haya suficientes datos
        if (metrics[ticker].annualReturn === 0) {
          console.warn(`No se pudieron calcular métricas para ${ticker}, verifique que hay suficientes datos`);
        }
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
            (metrics[allTickers[i]].volatility || 0) * (metrics[allTickers[j]].volatility || 0);
        }, 0);
      }, 0)
    );
    
    portfolioMetrics.maxDrawdown = Math.min(...portfolioPerformance.map((day: any, idx: number, arr: any[]) => {
      if (idx === 0) return 0;
      const maxPrevValue = Math.max(...arr.slice(0, idx).map((d: any) => d.portfolio || 0));
      return maxPrevValue > 0 ? (day.portfolio / maxPrevValue) - 1 : 0;
    }));
    
    portfolioMetrics.alpha = metrics[benchmark] ? 
      portfolioMetrics.annualReturn - (metrics[benchmark].annualReturn || 0) : 0;
    
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
          alpha: 0
        }])
      ),
      dataSource: 'Yahoo Finance'
    };
  } catch (error) {
    console.error("Error fetching portfolio data:", error);
    throw new Error(`Failed to fetch portfolio data: ${error instanceof Error ? error.message : String(error)}`);
  }
};
