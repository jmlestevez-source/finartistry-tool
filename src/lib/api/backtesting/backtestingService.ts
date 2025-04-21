
// Backtesting service

import { BacktestParams } from '../constants';
import { FINANCIAL_MODELING_PREP_API_KEY } from '../constants';
import { fetchFinancialData } from '../utils/apiUtils';
import { transformFMPHistoricalData } from '../utils/dataTransformations';
import { getTodayDate } from '../utils/dateUtils';
import { runBacktest } from './backtestingUtils';

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
