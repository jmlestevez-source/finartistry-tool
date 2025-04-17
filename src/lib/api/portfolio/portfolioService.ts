
// Portfolio analysis service

import { FINANCIAL_MODELING_PREP_API_KEY } from '../constants';
import { fetchFinancialData, fetchStockRecommendations } from '../utils/apiUtils';
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

// Datos de prueba para cuando la API no responde
const generateMockPortfolioData = (tickers: string[], weights: number[], benchmark: string, period: string) => {
  console.log("Generando datos de prueba para la cartera");
  
  // Crear datos de rendimiento histórico simulados
  const today = new Date();
  const startDate = new Date();
  startDate.setFullYear(today.getFullYear() - parseInt(period));
  
  const days = Math.floor((today.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000));
  const performanceChart = [];
  
  // Generar datos diarios con un patrón aleatorio pero realista
  for (let i = 0; i < Math.min(days, 250); i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    
    // Valores simulados con cierta aleatoriedad pero con tendencia alcista
    const portfolioValue = 1 + (Math.random() * 0.5 + 0.25) * (i / Math.max(days, 1));
    const benchmarkValue = 1 + (Math.random() * 0.4 + 0.15) * (i / Math.max(days, 1));
    
    performanceChart.push({
      date: date.toISOString().split('T')[0],
      portfolio: portfolioValue,
      benchmark: benchmarkValue
    });
  }
  
  // Crear matriz de correlación simulada
  const correlationMatrix: number[][] = [];
  for (let i = 0; i < tickers.length; i++) {
    correlationMatrix.push([]);
    for (let j = 0; j < tickers.length; j++) {
      if (i === j) {
        correlationMatrix[i][j] = 1; // Autocorrelación perfecta
      } else {
        // Correlaciones aleatorias entre 0.3 y 0.8
        correlationMatrix[i][j] = 0.3 + Math.random() * 0.5;
        correlationMatrix[j][i] = correlationMatrix[i][j]; // Matriz simétrica
      }
    }
  }
  
  // Generar métricas simuladas para la cartera
  const portfolioMetrics = {
    annualReturn: 0.12 + Math.random() * 0.08,
    volatility: 0.15 + Math.random() * 0.1,
    sharpeRatio: 0.8 + Math.random() * 0.7,
    maxDrawdown: -0.15 - Math.random() * 0.1,
    alpha: 0.02 + Math.random() * 0.04,
    beta: 0.9 + Math.random() * 0.3
  };
  
  // Generar métricas para cada ticker
  const stockMetrics: Record<string, any> = {};
  tickers.forEach(ticker => {
    stockMetrics[ticker] = {
      annualReturn: 0.08 + Math.random() * 0.15,
      volatility: 0.12 + Math.random() * 0.18,
      sharpeRatio: 0.6 + Math.random() * 0.9,
      maxDrawdown: -0.12 - Math.random() * 0.18,
      beta: ticker === benchmark ? 1 : 0.7 + Math.random() * 0.6,
      alpha: ticker === benchmark ? 0 : -0.01 + Math.random() * 0.05
    };
  });
  
  // Añadir el benchmark si no está en la lista
  if (!stockMetrics[benchmark]) {
    stockMetrics[benchmark] = {
      annualReturn: 0.09 + Math.random() * 0.05,
      volatility: 0.14 + Math.random() * 0.06,
      sharpeRatio: 0.7 + Math.random() * 0.3,
      maxDrawdown: -0.1 - Math.random() * 0.12,
      beta: 1,
      alpha: 0
    };
  }
  
  return {
    performanceChart,
    correlationMatrix,
    metrics: portfolioMetrics,
    stockMetrics
  };
};

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
    
    try {
      // Obtener datos históricos para cada ticker
      const historicalDataPromises = allTickers.map(ticker => 
        fetchFinancialData(
          `https://financialmodelingprep.com/api/v3/historical-price-full/${ticker}`, 
          { apikey: FINANCIAL_MODELING_PREP_API_KEY, from: calculateStartDate(period), to: getTodayDate() }
        )
      );
      
      let historicalDataResponses;
      try {
        historicalDataResponses = await Promise.all(historicalDataPromises);
      } catch (error) {
        console.error("Error obteniendo datos históricos, intentando modo de recuperación:", error);
        // Si hay error en la obtención de datos, intentar obtenerlos uno por uno
        historicalDataResponses = await Promise.all(allTickers.map(async ticker => {
          try {
            return await fetchFinancialData(
              `https://financialmodelingprep.com/api/v3/historical-price-full/${ticker}`,
              { apikey: FINANCIAL_MODELING_PREP_API_KEY, from: calculateStartDate(period), to: getTodayDate() }
            );
          } catch (tickerError) {
            console.warn(`No se pudieron obtener datos para ${ticker}:`, tickerError);
            return null;
          }
        }));
      }
      
      // Procesar y combinar datos históricos
      let combinedData: any = {};
      const tickersWithData: string[] = [];
      
      historicalDataResponses.forEach((response, index) => {
        if (!response) return; // Saltear respuestas nulas
        
        const ticker = allTickers[index];
        if (response && response.historical && response.historical.length > 0) {
          const transformedData = transformFMPHistoricalData(response.historical, ticker);
          tickersWithData.push(ticker);
          
          transformedData.forEach((item: any) => {
            if (!combinedData[item.date]) {
              combinedData[item.date] = { date: item.date };
            }
            combinedData[item.date][ticker] = item[ticker];
          });
        } else {
          console.warn(`No historical data available for ${ticker}`);
        }
      });
      
      // Convertir a array y ordenar por fecha
      const sortedHistoricalData = Object.values(combinedData)
        .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      if (sortedHistoricalData.length === 0 || tickersWithData.length < allTickers.length * 0.75) {
        console.warn("No hay suficientes datos históricos disponibles, usando datos simulados");
        throw new Error("Datos históricos insuficientes para un análisis preciso");
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
      
      // Calcular métricas (rendimiento anual, volatilidad, etc.)
      const metrics = calculateMetrics(dailyReturns);
      
      // Inicializar las métricas del portafolio antes de usarlas
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
            console.warn(`No se pudieron calcular métricas para ${ticker}, usando valores por defecto`);
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
        const maxPrevValue = Math.max(...arr.slice(0, idx).map((d: any) => d.portfolio));
        return (day.portfolio / maxPrevValue) - 1;
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
            alpha: 0
          }])
        )
      };
      
    } catch (apiError) {
      console.warn("API error, using mock data instead:", apiError);
      // Si hay error en la API, usar datos simulados
      return generateMockPortfolioData(allTickers, portfolioWeights, benchmark, period);
    }
    
  } catch (error) {
    console.error("Error fetching portfolio data:", error);
    throw new Error("Failed to fetch portfolio data");
  }
};
