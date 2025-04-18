
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
    
    // Generar datos simulados para demostración ya que las llamadas directas a Yahoo Finance
    // están bloqueadas por CORS en el entorno de desarrollo
    console.log("Generando datos históricos simulados para demostración");
    
    // Fecha inicial basada en el período solicitado
    const startDate = new Date(calculateStartDate(period));
    const endDate = new Date();
    const days = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Crear datos simulados realistas
    const simulatedHistoricalData: any[] = [];
    const priceMap = new Map();
    
    // Precios iniciales realistas para diferentes activos
    allTickers.forEach(ticker => {
      let basePrice;
      if (ticker === "AAPL") basePrice = 150;
      else if (ticker === "MSFT") basePrice = 300;
      else if (ticker === "GOOGL") basePrice = 2800;
      else if (ticker === "AMZN") basePrice = 3300;
      else if (ticker === "META") basePrice = 300;
      else if (ticker === "TSLA") basePrice = 900;
      else if (ticker === "SPY") basePrice = 420;
      else if (ticker === "QQQ") basePrice = 380;
      else basePrice = 100 + Math.random() * 900; // Para otros tickers
      
      priceMap.set(ticker, basePrice);
    });
    
    // Generar serie temporal con volatilidad y tendencias realistas
    for (let i = 0; i <= days; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      
      // No incluir fines de semana
      if (currentDate.getDay() === 0 || currentDate.getDay() === 6) continue;
      
      const dateStr = currentDate.toISOString().split('T')[0];
      const dataPoint: any = { date: dateStr };
      
      // Actualizar precio para cada ticker
      allTickers.forEach(ticker => {
        const currentPrice = priceMap.get(ticker);
        // Volatilidad personalizada según el activo
        let volatility = 0.01; // Volatilidad base
        
        if (ticker === "TSLA" || ticker === "AMZN") volatility = 0.018; // Mayor volatilidad
        else if (ticker === "SPY" || ticker === "QQQ") volatility = 0.008; // Menor volatilidad
        
        // Simular cambio de precio con componente aleatorio y tendencia
        const trend = 0.0002; // Ligera tendencia alcista
        const change = (Math.random() - 0.5) * volatility * 2 + trend;
        const newPrice = currentPrice * (1 + change);
        
        // Actualizar el mapa de precios y añadir al datapoint
        priceMap.set(ticker, newPrice);
        dataPoint[ticker] = newPrice;
      });
      
      simulatedHistoricalData.push(dataPoint);
    }
    
    // Ordenar por fecha
    const sortedHistoricalData = simulatedHistoricalData.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    // Calcular retornos diarios
    const dailyReturns = calculateDailyReturns(sortedHistoricalData);
    
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
      dataSource: 'Datos de demostración'
    };
  } catch (error) {
    console.error("Error fetching portfolio data:", error);
    throw new Error(`Failed to fetch portfolio data: ${error instanceof Error ? error.message : String(error)}`);
  }
};
