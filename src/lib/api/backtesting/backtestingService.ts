
// Backtesting service

import { BacktestParams } from '../constants';
import { FINANCIAL_MODELING_PREP_API_KEY } from '../constants';
import { fetchFinancialData, fetchYahooFinanceData } from '../utils/apiUtils';
import { transformFMPHistoricalData } from '../utils/dataTransformations';
import { getTodayDate } from '../utils/dateUtils';
import { runBacktest } from './backtestingUtils';

// Función para crear datos simulados para backtesting cuando todas las fuentes fallan
const createMockDataForBacktest = (params: BacktestParams) => {
  const { tickers, weights, benchmark, startDate, endDate, rebalancePeriod } = params;
  console.log(`Creando datos simulados para backtesting`);
  
  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : new Date();
  const days = Math.floor((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
  
  // Generar datos históricos simulados
  const allTickers = [...new Set([...tickers, benchmark])];
  let combinedData: any[] = [];
  
  // Crear un punto de datos para cada día
  for (let i = 0; i <= days; i++) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];
    
    const dataPoint: any = { date: dateStr };
    
    // Generar precios para cada ticker
    allTickers.forEach(ticker => {
      const seed = ticker.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) / 1000;
      const baseValue = 100 + (seed % 50);
      const growth = 1 + (0.0002 * i) + (Math.random() * 0.01 - 0.005);
      const value = baseValue * Math.pow(growth, i);
      
      dataPoint[ticker] = value;
    });
    
    combinedData.push(dataPoint);
  }
  
  // Ejecutar backtest utilizando los datos simulados
  const backtestResults = runBacktest(combinedData, tickers, weights, benchmark, rebalancePeriod);
  backtestResults.dataSource = "Simulated Data";
  
  return backtestResults;
};

export const fetchBacktestResults = async (params: BacktestParams) => {
  try {
    const { tickers, weights, benchmark, startDate, endDate, rebalancePeriod } = params;
    
    console.log(`Fetching backtest data with params:`, params);
    
    // Incluir el benchmark en la lista de tickers si no está ya
    let allTickers = tickers.includes(benchmark) ? tickers : [...tickers, benchmark];
    let dataSource = '';
    
    // Intentar primero con Yahoo Finance directamente
    try {
      console.log("Intentando obtener datos de Yahoo Finance para backtesting...");
      const yahooDataPromises = allTickers.map(ticker => 
        fetchYahooFinanceData(ticker, startDate, endDate || getTodayDate())
      );
      
      const yahooDataResponses = await Promise.allSettled(yahooDataPromises);
      
      // Verificar si tenemos suficientes datos de Yahoo Finance
      const successfulYahooResponses = yahooDataResponses.filter(
        response => response.status === 'fulfilled' && response.value && response.value.historical && response.value.historical.length > 0
      );
      
      if (successfulYahooResponses.length >= allTickers.length * 0.8) { // Al menos 80% de tickers con datos
        console.log("Usando datos de Yahoo Finance para backtesting");
        dataSource = 'Yahoo Finance';
        
        // Procesar y combinar datos históricos
        let combinedData: any = {};
        
        yahooDataResponses.forEach((response, index) => {
          if (response.status === 'fulfilled' && response.value && response.value.historical) {
            const ticker = allTickers[index];
            const transformedData = response.value.historical;
            
            transformedData.forEach((item: any) => {
              if (!combinedData[item.date]) {
                combinedData[item.date] = { date: item.date };
              }
              
              // Asegurarse de que el ticker existe en el item
              if (item[ticker] !== undefined) {
                combinedData[item.date][ticker] = item[ticker];
              }
            });
          }
        });
        
        // Convertir a array y ordenar por fecha
        const sortedHistoricalData = Object.values(combinedData)
          .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        if (sortedHistoricalData.length > 0) {
          // Implementar lógica de backtesting según el período de rebalanceo
          const backtestResults = runBacktest(sortedHistoricalData, tickers, weights, benchmark, rebalancePeriod);
          backtestResults.dataSource = 'Yahoo Finance';
          
          return backtestResults;
        }
      }
    } catch (yahooError) {
      console.error("Error obteniendo datos de Yahoo Finance:", yahooError);
    }
    
    // Si Yahoo Finance falla, intentar con Financial Modeling Prep
    try {
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
      
      const historicalDataResponses = await Promise.allSettled(historicalDataPromises);
      
      // Verificar fuentes de datos
      for (const response of historicalDataResponses) {
        if (response.status === 'fulfilled' && response.value && response.value.dataSource) {
          if (response.value.dataSource === 'Yahoo Finance') {
            dataSource = 'Yahoo Finance';
            break;
          } else if (response.value.dataSource === 'Simulated Data' && dataSource !== 'Yahoo Finance') {
            dataSource = 'Simulated Data';
          }
        }
      }
      
      // Procesar y combinar datos históricos
      let combinedData: any = {};
      
      historicalDataResponses.forEach((response, index) => {
        if (response.status === 'fulfilled' && response.value) {
          const ticker = allTickers[index];
          if (response.value.historical && response.value.historical.length > 0) {
            const transformedData = transformFMPHistoricalData(response.value.historical, ticker);
            
            transformedData.forEach((item: any) => {
              if (!combinedData[item.date]) {
                combinedData[item.date] = { date: item.date };
              }
              combinedData[item.date][ticker] = item[ticker];
            });
          } else {
            console.warn(`No historical data available for ${ticker} in backtesting`);
          }
        }
      });
      
      // Convertir a array y ordenar por fecha
      const sortedHistoricalData = Object.values(combinedData)
        .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      if (sortedHistoricalData.length === 0) {
        console.warn("No historical data available for backtesting, using mock data");
        return createMockDataForBacktest(params);
      }
      
      // Implementar lógica de backtesting según el período de rebalanceo
      const backtestResults = runBacktest(sortedHistoricalData, tickers, weights, benchmark, rebalancePeriod);
      
      // Añadir información sobre la fuente de datos
      backtestResults.dataSource = dataSource || 'Financial Modeling Prep';
      
      return backtestResults;
    } catch (error) {
      console.error("Error fetching historical data for backtesting:", error);
      return createMockDataForBacktest(params);
    }
  } catch (error) {
    console.error("Error fetching backtest results:", error);
    throw new Error(`Failed to fetch backtest results: ${error instanceof Error ? error.message : String(error)}`);
  }
};
