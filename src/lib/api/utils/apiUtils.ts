// API utility functions

import { toast } from "@/hooks/use-toast";
import { ALPHA_VANTAGE_API_KEY } from "../constants";

// Helper function to remove duplicate tickers
const removeDuplicates = (tickers: string[]): string[] => {
  return [...new Set(tickers)];
};

// Exportar listas completas de tickers para índices principales
export const STOXX50_TICKERS: string[] = removeDuplicates([
  'ABI.BR', 'AD.AS', 'ADY.PA', 'AI.PA', 'AIR.PA', 
  'ALV.DE', 'ASML.AS', 'BNP.PA', 'BAYN.DE', 'BBVA.MC',
  'BMW.DE', 'BN.PA', 'CRH.PA', 'CS.PA', 'DAI.DE',
  'DB1.DE', 'DG.PA', 'DPW.DE', 'DTE.DE', 'ENEL.MI',
  'ENI.MI', 'EL.PA', 'FP.PA', 'FRE.DE', 'IBE.MC',
  'INGA.AS', 'ISP.MI', 'KER.PA', 'LIN.DE', 'MC.PA',
  'MUV2.DE', 'NOKIA.HE', 'OR.PA', 'ORA.PA', 'PHIA.AS',
  'PRX.AS', 'RMS.PA', 'RWE.DE', 'SAN.MC', 'SAN.PA',
  'SAP.DE', 'SIE.DE', 'SU.PA', 'TEF.MC', 'UCG.MI',
  'VOW3.DE', 'VIV.PA', 'VNA.DE', 'BAS.DE'
]);

// S&P 500 tickers from Wikipedia
export const SP500_TICKERS: string[] = removeDuplicates([
  'MMM', 'AOS', 'ABT', 'ABBV', 'ACN', 'ADBE', 'ADM', 'ABNB', 'ADSK', 'ADP', 'AES', 'AFL', 'A', 'APD', 'AKAM', 
  'ALB', 'ARE', 'ALGN', 'ALLE', 'LNT', 'ALL', 'GOOGL', 'GOOG', 'MO', 'AMZN', 'AMCR', 'AMD', 'AEE', 'AAL', 'AEP', 
  'AXP', 'AIG', 'AMT', 'AWK', 'AMP', 'AME', 'AMGN', 'APH', 'ADI', 'ANSS', 'AON', 'APA', 'AAPL', 'AMAT', 'APTV', 
  'ACGL', 'ANET', 'AJG', 'AIZ', 'T', 'ATO', 'ADSK', 'AZO', 'AVB', 'AVY', 'AXON', 'BKR', 'BALL', 'BAC', 'BBWI', 
  'BAX', 'BDX', 'WRB', 'BRK-B', 'BBY', 'BIO', 'TECH', 'BIIB', 'BLK', 'BK', 'BA', 'BKNG', 'BWA', 'BXP', 'BSX', 
  'BMY', 'AVGO', 'BR', 'BRO', 'BF-B', 'BG', 'BLDR', 'CDNS', 'CZR', 'CPT', 'CPB', 'COF', 'CAH', 'KMX', 'CCL', 
  'CARR', 'CTLT', 'CAT', 'CBOE', 'CBRE', 'CDW', 'CE', 'COR', 'CNC', 'CNP', 'CDAY', 'CF', 'CRL', 'SCHW', 'CHTR', 
  'CVX', 'CMG', 'CB', 'CHD', 'CI', 'CINF', 'CTAS', 'CSCO', 'C', 'CFG', 'CLX', 'CME', 'CMS', 'KO', 'CTSH', 'CL', 
  'CMCSA', 'CMA', 'CAG', 'COP', 'ED', 'STZ', 'CEG', 'COO', 'CPRT', 'GLW', 'CTVA', 'CSGP', 'COST', 'CTRA', 'CCI', 
  'CSX', 'CMI', 'CVS', 'DHI', 'DHR', 'DRI', 'DVA', 'DE', 'DAL', 'XRAY', 'DVN', 'DXCM', 'FANG', 'DLR', 'DFS', 'DIS', 
  'DG', 'DLTR', 'D', 'DPZ', 'DOV', 'DOW', 'DTE', 'DUK', 'DD', 'EMN', 'ETN', 'EBAY', 'ECL', 'EIX', 'EW', 'EA', 'ELV', 
  'LLY', 'EMR', 'ENPH', 'ETR', 'EOG', 'EPAM', 'EQT', 'EFX', 'EQIX', 'EQR', 'ESS', 'EL', 'ETSY', 'EG', 'EVRG', 'ES', 
  'EXC', 'EXPE', 'EXPD', 'EXR', 'XOM', 'FFIV', 'FDS', 'FICO', 'FAST', 'FRT', 'FDX', 'FITB', 'FSLR', 'FE', 'FIS', 
  'FI', 'FLT', 'FMC', 'F', 'FTNT', 'FTV', 'FOXA', 'FOX', 'BEN', 'FCX', 'GRMN', 'IT', 'GEHC', 'GEN', 'GNRC', 'GD', 
  'GE', 'GIS', 'GM', 'GPC', 'GILD', 'GL', 'GPN', 'GS', 'HAL', 'HIG', 'HAS', 'HCA', 'PEAK', 'HSIC', 'HSY', 'HES', 
  'HPE', 'HLT', 'HOLX', 'HD', 'HON', 'HRL', 'HST', 'HWM', 'HPQ', 'HUM', 'HBAN', 'HII', 'IBM', 'IEX', 'IDXX', 'ITW', 
  'ILMN', 'INCY', 'IR', 'PODD', 'INTC', 'ICE', 'IFF', 'IP', 'IPG', 'INTU', 'ISRG', 'IVZ', 'INVH', 'IQV', 'IRM', 
  'JBHT', 'JKHY', 'J', 'JNJ', 'JCI', 'JPM', 'JNPR', 'K', 'KDP', 'KEY', 'KEYS', 'KMB', 'KIM', 'KMI', 'KLAC', 'KHC', 
  'KR', 'LHX', 'LH', 'LRCX', 'LW', 'LVS', 'LDOS', 'LEN', 'LIN', 'LYV', 'LKQ', 'LMT', 'L', 'LOW', 'LUMN', 'LYB', 'MTB', 
  'MRO', 'MPC', 'MKTX', 'MAR', 'MMC', 'MLM', 'MAS', 'MA', 'MTCH', 'MKC', 'MCD', 'MCK', 'MDT', 'MRK', 'META', 'MET', 
  'MTD', 'MGM', 'MCHP', 'MU', 'MSFT', 'MAA', 'MRNA', 'MHK', 'MOH', 'TAP', 'MDLZ', 'MPWR', 'MNST', 'MCO', 'MS', 'MOS', 
  'MSI', 'MSCI', 'NDAQ', 'NTAP', 'NFLX', 'NWL', 'NEM', 'NWSA', 'NWS', 'NEE', 'NKE', 'NI', 'NDSN', 'NSC', 'NTRS', 
  'NOC', 'NLOK', 'NCLH', 'NRG', 'NUE', 'NVDA', 'NVR', 'NXPI', 'ORLY', 'OXY', 'ODFL', 'OMC', 'ON', 'OKE', 'ORCL', 
  'OGN', 'OTIS', 'PCAR', 'PKG', 'PARA', 'PH', 'PAYX', 'PAYC', 'PYPL', 'PNR', 'PEP', 'PKI', 'PFE', 'PCG', 'PM', 
  'PSX', 'PNW', 'PXD', 'PNC', 'POOL', 'PPG', 'PPL', 'PFG', 'PG', 'PGR', 'PLD', 'PRU', 'PEG', 'PTC', 'PSA', 'PHM', 
  'QRVO', 'PWR', 'QCOM', 'DGX', 'RL', 'RJF', 'RTX', 'O', 'REG', 'REGN', 'RF', 'RSG', 'RMD', 'RHI', 'ROK', 'ROL', 
  'ROP', 'ROST', 'RCL', 'SPGI', 'CRM', 'SBAC', 'SLB', 'STX', 'SEE', 'SRE', 'NOW', 'SHW', 'SPG', 'SWKS', 'SJM', 'SNA', 
  'SEDG', 'SO', 'LUV', 'SWK', 'SBUX', 'STT', 'STLD', 'STE', 'SYK', 'SYF', 'SNPS', 'SYY', 'TMUS', 'TROW', 'TTWO', 'TPR', 
  'TRGP', 'TGT', 'TEL', 'TDY', 'TFX', 'TER', 'TSLA', 'TXN', 'TXT', 'TMO', 'TJX', 'TSCO', 'TT', 'TDG', 'TRV', 'TRMB', 
  'TFC', 'TYL', 'TSN', 'USB', 'UDR', 'ULTA', 'UNP', 'UAL', 'UPS', 'URI', 'UNH', 'UHS', 'VLO', 'VTR', 'VRSN', 'VRSK', 
  'VZ', 'VRTX', 'VFC', 'VTRS', 'VICI', 'V', 'VMC', 'WAB', 'WBA', 'WMT', 'WBD', 'WM', 'WAT', 'WEC', 'WFC', 'WELL', 
  'WST', 'WDC', 'WRK', 'WY', 'WHR', 'WMB', 'WTW', 'GWW', 'WYNN', 'XEL', 'XYL', 'YUM', 'ZBRA', 'ZBH', 'ZION', 'ZTS'
]);

// NASDAQ 100 tickers from Wikipedia
export const NASDAQ100_TICKERS: string[] = removeDuplicates([
  'AAPL', 'MSFT', 'AMZN', 'NVDA', 'GOOGL', 'GOOG', 'META', 'AVGO', 'TSLA', 'COST', 
  'PEP', 'ADBE', 'NFLX', 'AMD', 'CSCO', 'CMCSA', 'TMUS', 'INTU', 'INTC', 'QCOM', 
  'TXN', 'AMGN', 'AMAT', 'HON', 'ISRG', 'SBUX', 'VRTX', 'GILD', 'ADP', 'MDLZ', 
  'ADI', 'REGN', 'BKNG', 'MRNA', 'LRCX', 'PYPL', 'PANW', 'MU', 'CSX', 'KLAC', 
  'ASML', 'CTAS', 'SNPS', 'CDNS', 'MCHP', 'ORLY', 'MNST', 'ADSK', 'ABNB', 'NXPI', 
  'CRWD', 'PCAR', 'PAYX', 'MRVL', 'ODFL', 'KDP', 'KHC', 'EXC', 'FTNT', 'MAR', 
  'FAST', 'CTSH', 'DXCM', 'LULU', 'AEP', 'CPRT', 'ROST', 'XEL', 'FANG', 'CSGP', 
  'VRSK', 'EA', 'DLTR', 'CHTR', 'BKR', 'WBD', 'IDXX', 'CEG', 'BIIB', 'ANSS', 
  'ENPH', 'WDAY', 'ILMN', 'DDOG', 'ALGN', 'ON', 'ZS', 'SIRI', 'LCID', 'SPLK', 
  'TEAM', 'MTCH', 'ZM', 'ATVI', 'WBA', 'PDD', 'JD', 'EBAY', 'MELI', 'OKTA',
  'DASH', 'RIVN', 'COIN', 'RBLX', 'DKNG', 'TTD'
]);

// Función genérica para realizar llamadas a la API
export const fetchFinancialData = async (url: string, params: any = {}) => {
  try {
    // Construir la URL con los parámetros
    const urlWithParams = new URL(url);
    Object.keys(params).forEach(key => urlWithParams.searchParams.append(key, params[key]));
    
    console.log(`Fetching data from: ${urlWithParams.toString()}`);
    
    const response = await fetch(urlWithParams.toString());
    
    if (!response.ok) {
      // Si la respuesta no es exitosa, lanzar un error
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Verificar si la API devuelve un mensaje de error
    if (data.error) {
      throw new Error(`API error: ${data.error}`);
    }
    
    // Determinar la fuente de datos
    let dataSource = 'Financial Modeling Prep';
    if (url.includes('financialmodelingprep.com')) {
      dataSource = 'Financial Modeling Prep';
    } else if (url.includes('alphavantage.co')) {
      dataSource = 'Alpha Vantage';
    }
    
    // Agregar la fuente de datos a la respuesta
    return { ...data, dataSource };
    
  } catch (error: any) {
    console.error("Error fetching data:", error);
    
    // Lanzar una alerta si falla la llamada a la API
    toast({
      title: "Error fetching data",
      description: `Failed to fetch data from ${url}: ${error.message}`,
      variant: "destructive",
    });
    
    // Devolver un objeto con un mensaje de error y la fuente de datos simulada
    return { error: error.message, dataSource: 'Simulated Data' };
  }
};

// Función para descargar datos desde Alpha Vantage
export const fetchAlphaVantageData = async (ticker: string, from: string, to: string) => {
  try {
    // Construir la URL para la API de Alpha Vantage
    const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY_ADJUSTED&symbol=${ticker}&outputsize=full&apikey=${ALPHA_VANTAGE_API_KEY}`;
    
    console.log(`Fetching Alpha Vantage data from: ${url}`);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Verificar si la API devuelve un mensaje de error
    if (data['Error Message']) {
      throw new Error(`Alpha Vantage API error: ${data['Error Message']}`);
    }
    
    // Procesar los datos para que coincidan con el formato esperado
    const timeSeries = data['Time Series (Daily)'];
    const historical = [];
    
    for (const date in timeSeries) {
      if (timeSeries.hasOwnProperty(date)) {
        historical.push({
          date: date,
          [ticker]: parseFloat(timeSeries[date]['4. close'])
        });
      }
    }
    
    // Devolver los datos históricos y la fuente de datos
    return { historical, dataSource: 'Alpha Vantage' };
    
  } catch (error: any) {
    console.error("Error fetching Alpha Vantage data:", error);
    
    // Lanzar una alerta si falla la llamada a la API
    toast({
      title: "Error fetching Alpha Vantage data",
      description: `Failed to fetch data for ${ticker} from Alpha Vantage: ${error.message}`,
      variant: "destructive",
    });
    
    // Devolver un objeto con un mensaje de error y la fuente de datos simulada
    return { error: error.message, dataSource: 'Simulated Data' };
  }
};

// Función para descargar datos directamente desde Yahoo Finance
export const fetchYahooFinanceData = async (ticker: string, from: string, to: string) => {
  console.log(`Attempting to fetch Yahoo Finance data directly for ${ticker} from ${from} to ${to}`);
  
  try {
    const fromDate = new Date(from);
    const toDate = new Date(to);
    
    // Convertir fechas a timestamps de UNIX (segundos desde 1970)
    const period1 = Math.floor(fromDate.getTime() / 1000);
    const period2 = Math.floor(toDate.getTime() / 1000);
    
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?period1=${period1}&period2=${period2}&interval=1d`;
    console.log(`Yahoo Finance URL: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
    });
    
    if (!response.ok) {
      throw new Error(`Yahoo Finance API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.chart || !data.chart.result || data.chart.result.length === 0 || !data.chart.result[0].indicators) {
      throw new Error('No data found in Yahoo Finance response');
    }
    
    const result = data.chart.result[0];
    const quotes = result.indicators.quote[0];
    const timestamps = result.timestamp;
    const historical = [];
    
    // Transformar los datos al formato esperado por la aplicación
    for (let i = 0; i < timestamps.length; i++) {
      if (quotes.close[i] !== null && !isNaN(quotes.close[i])) {
        const date = new Date(timestamps[i] * 1000);
        const dateStr = date.toISOString().split('T')[0];
        
        const dataPoint: any = {
          date: dateStr,
          [ticker]: quotes.close[i]
        };
        
        historical.push(dataPoint);
      }
    }
    
    return {
      historical,
      dataSource: 'Yahoo Finance'
    };
  } catch (error) {
    console.error(`Error fetching Yahoo Finance data for ${ticker}:`, error);
    throw error;
  }
};

// Función para obtener recomendaciones de acciones basadas en métricas
export const fetchStockRecommendations = async (tickers: string[], metric: 'sharpe' | 'volatility' | 'correlation', topN: number = 5) => {
  try {
    // Simular la obtención de datos de una API o fuente de datos
    const allStocks = [...STOXX50_TICKERS, ...SP500_TICKERS, ...NASDAQ100_TICKERS];
    
    // Filtrar las acciones que no están en la lista de tickers
    const availableStocks = allStocks.filter(stock => !tickers.includes(stock));
    
    // Simular métricas para cada acción (reemplazar con datos reales)
    const stockMetrics = availableStocks.map(stock => ({
      ticker: stock,
      sharpe: Math.random() * 2 - 0.5, // Valores aleatorios para Sharpe Ratio
      volatility: Math.random() * 0.3, // Valores aleatorios para Volatilidad
      correlation: Math.random() * 0.8 - 0.4 // Valores aleatorios para Correlación
    }));
    
    // Ordenar las acciones según la métrica seleccionada
    const sortedStocks = stockMetrics.sort((a, b) => {
      if (metric === 'sharpe') {
        return b.sharpe - a.sharpe;
      } else if (metric === 'volatility') {
        return a.volatility - b.volatility;
      } else {
        return Math.abs(a.correlation) - Math.abs(b.correlation);
      }
    });
    
    // Tomar las topN acciones
    const topStocks = sortedStocks.slice(0, topN);
    
    // Devolver las recomendaciones con una razón simulada
    return topStocks.map(stock => ({
      ticker: stock.ticker,
      reason: `Top ${metric} recommendation`,
      metricValue: stock[metric]
    }));
  } catch (error) {
    console.error("Error fetching stock recommendations:", error);
    
    // Lanzar una alerta si falla la llamada a la API
    toast({
      title: "Error fetching stock recommendations",
      description: `Failed to fetch stock recommendations: ${error}`,
      variant: "destructive",
    });
    
    return [];
  }
};
