
// Backtesting service

import { BacktestParams } from '../constants';
import { FINANCIAL_MODELING_PREP_API_KEY } from '../constants';
import { fetchFinancialData, fetchYahooFinanceData } from '../utils/apiUtils';
import { transformFMPHistoricalData } from '../utils/dataTransformations';
import { getTodayDate } from '../utils/dateUtils';
import { runBacktest } from './backtestingUtils';

export const fetchBacktestResults = async (params: BacktestParams) => {
  try {
    const { tickers, weights, benchmark, startDate, endDate, rebalancePeriod } = params;
    
    console.log(`Fetching backtest data with params:`, params);
    
    // Incluir el benchmark en la lista de tickers si no está ya
    let allTickers = tickers.includes(benchmark) ? tickers : [...tickers, benchmark];
    
    // Generar datos simulados para demostración ya que las llamadas directas a Yahoo Finance
    // están bloqueadas por CORS en el entorno de desarrollo
    console.log("Generando datos históricos simulados para backtesting");
    
    // Fecha inicial basada en el período solicitado
    const fromDate = new Date(startDate);
    const toDate = new Date(endDate || getTodayDate());
    const days = Math.round((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24));
    
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
      const currentDate = new Date(fromDate);
      currentDate.setDate(fromDate.getDate() + i);
      
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
    
    // Implementar lógica de backtesting según el período de rebalanceo
    const backtestResults = runBacktest(sortedHistoricalData, tickers, weights, benchmark, rebalancePeriod);
    backtestResults.dataSource = 'Datos de demostración';
    
    return backtestResults;
  } catch (error) {
    console.error("Error fetching backtest results:", error);
    throw new Error(`Failed to fetch backtest results: ${error instanceof Error ? error.message : String(error)}`);
  }
};
