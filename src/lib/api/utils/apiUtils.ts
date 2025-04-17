// API utility functions

// Función para realizar llamadas a la API de Financial Modeling Prep
export const fetchFinancialData = async (endpoint: string, params: Record<string, string>) => {
  const url = new URL(endpoint);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, value);
  });
  
  try {
    console.log(`Fetching data from: ${url.toString()}`);
    const response = await fetch(url.toString());
    
    if (!response.ok) {
      console.error(`API error: ${response.status} - ${response.statusText} for ${url.toString()}`);
      
      // Manejo específico para error de límite de peticiones
      if (response.status === 429) {
        console.log("Límite de peticiones alcanzado, usando yfinance como alternativa");
        // Extraer el ticker del endpoint para usarlo con yfinance
        const tickerMatch = endpoint.match(/\/([A-Z0-9.]+)(?:\?|$)/);
        const ticker = tickerMatch ? tickerMatch[1] : null;
        
        if (ticker) {
          return await fetchYahooFinanceData(ticker, params.from, params.to);
        } else {
          throw new Error("No se pudo determinar el ticker para la petición alternativa");
        }
      }
      
      throw new Error(`API error: ${response.status} - ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Algunas APIs devuelven errores en el cuerpo de la respuesta a pesar de un status 200
    if (data.error || data["Error Message"]) {
      const errorMessage = data.error || data["Error Message"] || "Error desconocido en la respuesta";
      console.error(`API error in response body: ${errorMessage}`);
      throw new Error(`API error: ${errorMessage}`);
    }
    
    return data;
  } catch (error) {
    console.error(`API request failed for ${endpoint}:`, error);
    throw error;
  }
};

// Función para realizar llamadas a la API de Yahoo Finance como fallback
export const fetchYahooFinanceData = async (ticker: string, fromDate?: string, toDate?: string) => {
  try {
    console.log(`Fetching Yahoo Finance data for ${ticker}`);
    
    // URL de nuestro proxy para Yahoo Finance (esto es simulado)
    const baseUrl = 'https://query1.finance.yahoo.com/v8/finance/chart';
    const url = new URL(`${baseUrl}/${ticker}`);
    
    // Añadir parámetros para el rango de fechas si están disponibles
    if (fromDate) {
      const fromTimestamp = Math.floor(new Date(fromDate).getTime() / 1000);
      url.searchParams.append('period1', fromTimestamp.toString());
    }
    
    if (toDate) {
      const toTimestamp = Math.floor(new Date(toDate).getTime() / 1000);
      url.searchParams.append('period2', toTimestamp.toString());
    } else {
      // Si no se proporciona fecha de fin, usar la fecha actual
      url.searchParams.append('period2', Math.floor(Date.now() / 1000).toString());
    }
    
    // Intervalo diario
    url.searchParams.append('interval', '1d');
    
    const response = await fetch(url.toString());
    
    if (!response.ok) {
      throw new Error(`Yahoo Finance API error: ${response.status}`);
    }
    
    const yahooData = await response.json();
    
    // Transformar datos de Yahoo Finance al formato de FMP
    return transformYahooToFMPFormat(yahooData, ticker);
  } catch (error) {
    console.error(`Yahoo Finance request failed for ${ticker}:`, error);
    throw error;
  }
};

// Función para transformar los datos de Yahoo Finance al formato de FMP
const transformYahooToFMPFormat = (yahooData: any, ticker: string) => {
  try {
    // Verificar que tenemos datos válidos
    if (!yahooData.chart || !yahooData.chart.result || !yahooData.chart.result[0]) {
      throw new Error("Formato de datos de Yahoo Finance inválido");
    }
    
    const result = yahooData.chart.result[0];
    const timestamps = result.timestamp || [];
    const quotes = result.indicators.quote[0] || {};
    const adjClose = result.indicators.adjclose?.[0]?.adjclose || [];
    
    // Crear un array de datos históricos en el formato de FMP
    const historical = timestamps.map((timestamp: number, index: number) => {
      const date = new Date(timestamp * 1000);
      const dateStr = date.toISOString().split('T')[0];
      
      return {
        date: dateStr,
        open: quotes.open?.[index] || null,
        high: quotes.high?.[index] || null,
        low: quotes.low?.[index] || null,
        close: quotes.close?.[index] || null,
        adjClose: adjClose[index] || quotes.close?.[index] || null,
        volume: quotes.volume?.[index] || null,
        symbol: ticker
      };
    }).filter(item => item.close !== null); // Filtrar datos incompletos
    
    return {
      symbol: ticker,
      historical: historical.reverse() // FMP tiene los datos más recientes primero
    };
  } catch (error) {
    console.error("Error transformando datos de Yahoo Finance:", error);
    throw new Error("No se pudieron procesar los datos de Yahoo Finance");
  }
};

// Función para realizar llamadas a la API de Alpha Vantage
export const fetchAlphaVantageData = async (function_name: string, params: Record<string, string>) => {
  const url = new URL('https://www.alphavantage.co/query');
  url.searchParams.append('function', function_name);
  
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, value);
  });
  
  try {
    console.log(`Fetching Alpha Vantage data: ${url.toString()}`);
    const response = await fetch(url.toString());
    
    if (!response.ok) {
      console.error(`Alpha Vantage API error: ${response.status} - ${response.statusText}`);
      throw new Error(`API error: ${response.status} - ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Alpha Vantage a veces devuelve errores como "Invalid API call"
    if (data['Error Message'] || data['Information']) {
      const errorMessage = data['Error Message'] || data['Information'] || 'Unknown Alpha Vantage error';
      console.error(`Alpha Vantage API error: ${errorMessage}`);
      throw new Error(`Alpha Vantage API error: ${errorMessage}`);
    }
    
    return data;
  } catch (error) {
    console.error(`Alpha Vantage API request failed for ${function_name}:`, error);
    throw error;
  }
};

// Función para obtener recomendaciones de acciones basadas en métricas
export const fetchStockRecommendations = async (
  tickers: string[],
  metric: 'sharpe' | 'volatility' | 'correlation',
  limit: number = 5
) => {
  try {
    console.log(`Buscando recomendaciones basadas en ${metric}`);
    
    // Lista de tickers populares para analizar
    const popularStocks = [
      'AAPL', 'MSFT', 'AMZN', 'GOOGL', 'FB', 'TSLA', 'NVDA', 'JPM', 'V', 'JNJ',
      'WMT', 'BAC', 'PG', 'MA', 'DIS', 'ADBE', 'CRM', 'NFLX', 'XOM', 'KO',
      'INTC', 'PFE', 'CSCO', 'VZ', 'ABT', 'PEP', 'TMO', 'CMCSA', 'ACN', 'COST'
    ].filter(stock => !tickers.includes(stock)); // Excluir los tickers que ya están en la cartera
    
    // Para un escenario real, habría que obtener datos históricos de Yahoo Finance
    // y calcular métricas para cada acción, pero para simplificar, usaremos datos simulados
    
    const mockMetrics: Record<string, { sharpe: number, volatility: number, correlation: number }> = {};
    
    // Generar métricas simuladas para cada acción
    popularStocks.forEach(ticker => {
      const seed = ticker.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) / 1000;
      
      mockMetrics[ticker] = {
        sharpe: 0.5 + (seed % 1.2), // Entre 0.5 y 1.7
        volatility: 0.1 + (seed % 0.3), // Entre 0.1 y 0.4
        correlation: 0.2 + (seed % 0.6) // Entre 0.2 y 0.8
      };
    });
    
    // Ordenar según la métrica solicitada
    let sortedStocks: [string, number][] = [];
    
    if (metric === 'sharpe') {
      // Mayor sharpe es mejor
      sortedStocks = Object.entries(mockMetrics)
        .map(([ticker, metrics]) => [ticker, metrics.sharpe])
        .sort((a, b) => (b[1] as number) - (a[1] as number));
    } else if (metric === 'volatility') {
      // Menor volatilidad es mejor
      sortedStocks = Object.entries(mockMetrics)
        .map(([ticker, metrics]) => [ticker, metrics.volatility])
        .sort((a, b) => (a[1] as number) - (b[1] as number));
    } else {
      // Menor correlación es mejor
      sortedStocks = Object.entries(mockMetrics)
        .map(([ticker, metrics]) => [ticker, metrics.correlation])
        .sort((a, b) => (a[1] as number) - (b[1] as number));
    }
    
    // Retornar solo las mejores recomendaciones
    return sortedStocks.slice(0, limit).map(([ticker, value]) => ({
      ticker,
      value,
      reason: getRecommendationReason(ticker, metric, value)
    }));
  } catch (error) {
    console.error("Error obteniendo recomendaciones:", error);
    return [];
  }
};

// Función auxiliar para generar razones de recomendación
const getRecommendationReason = (ticker: string, metric: string, value: number) => {
  switch (metric) {
    case 'sharpe':
      return `${ticker} tiene un alto ratio de Sharpe (${value.toFixed(2)})`;
    case 'volatility':
      return `${ticker} presenta baja volatilidad (${(value * 100).toFixed(2)}%)`;
    case 'correlation':
      return `${ticker} tiene baja correlación (${value.toFixed(2)}) con su cartera actual`;
    default:
      return `${ticker} es recomendable para su cartera`;
  }
};
