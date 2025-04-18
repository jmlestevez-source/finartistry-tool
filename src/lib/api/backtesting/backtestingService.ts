
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
        } else {
          throw new Error("No hay suficientes datos históricos disponibles para el análisis de backtesting");
        }
      } else {
        throw new Error("No hay suficientes datos disponibles en Yahoo Finance para realizar el backtesting. Intente con otros tickers o un período más reciente.");
      }
    } catch (yahooError) {
      console.error("Error obteniendo datos de Yahoo Finance:", yahooError);
      // Reenviar el error en lugar de intentar con otra fuente
      throw new Error(`Error al obtener datos de Yahoo Finance: ${yahooError instanceof Error ? yahooError.message : String(yahooError)}`);
    }
  } catch (error) {
    console.error("Error fetching backtest results:", error);
    throw new Error(`Failed to fetch backtest results: ${error instanceof Error ? error.message : String(error)}`);
  }
};
