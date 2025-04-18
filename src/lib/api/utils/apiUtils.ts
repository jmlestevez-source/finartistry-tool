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
export const SP500_TICKERS = [
  'A', 'AAL', 'AAP', 'AAPL', 'ABBV', 'ABC', 'ABMD', 'ABT', 'ACN', 'ADBE', 'ADI', 'ADM', 'ADP', 
  'ADSK', 'AEE', 'AEP', 'AES', 'AFL', 'AIG', 'AIZ', 'AJG', 'AKAM', 'ALB', 'ALGN', 'ALK', 'ALL', 
  'ALLE', 'AMAT', 'AMCR', 'AMD', 'AME', 'AMGN', 'AMP', 'AMT', 'AMZN', 'ANET', 'ANSS', 'ANTM', 
  'AON', 'AOS', 'APA', 'APD', 'APH', 'APTV', 'ARE', 'ATO', 'ATVI', 'AVB', 'AVGO', 'AVY', 'AWK', 
  'AXP', 'AZO', 'BA', 'BAC', 'BAX', 'BBY', 'BDX', 'BEN', 'BF-B', 'BIIB', 'BIO', 'BK', 'BKNG', 
  'BKR', 'BLK', 'BLL', 'BMY', 'BR', 'BRK-B', 'BSX', 'BWA', 'BXP', 'C', 'CAG', 'CAH', 'CARR', 
  'CAT', 'CB', 'CBOE', 'CBRE', 'CCI', 'CCL', 'CDNS', 'CDW', 'CE', 'CERN', 'CF', 'CFG', 'CHD', 
  'CHRW', 'CHTR', 'CI', 'CINF', 'CL', 'CLX', 'CMA', 'CMCSA', 'CME', 'CMG', 'CMI', 'CMS', 'CNC', 
  'CNP', 'COF', 'COG', 'COO', 'COP', 'COST', 'CPB', 'CPRT', 'CRL', 'CRM', 'CSCO', 'CSX', 'CTAS', 
  'CTLT', 'CTSH', 'CTVA', 'CTXS', 'CVS', 'CVX', 'CZR', 'D', 'DAL', 'DD', 'DE', 'DFS', 'DG', 'DGX', 
  'DHI', 'DHR', 'DIS', 'DISH', 'DLR', 'DLTR', 'DOV', 'DOW', 'DPZ', 'DRE', 'DRI', 'DTE', 'DUK', 
  'DVA', 'DVN', 'DXC', 'DXCM', 'EA', 'EBAY', 'ECL', 'ED', 'EFX', 'EIX', 'EL', 'EMN', 'EMR', 'ENPH', 
  'EOG', 'EQIX', 'EQR', 'ES', 'ESS', 'ETN', 'ETR', 'ETSY', 'EVRG', 'EW', 'EXC', 'EXPD', 'EXPE', 
  'EXR', 'F', 'FANG', 'FAST', 'FB', 'FBHS', 'FCX', 'FDX', 'FE', 'FFIV', 'FIS', 'FISV', 'FITB', 
  'FLT', 'FMC', 'FOX', 'FOXA', 'FRC', 'FRT', 'FTNT', 'FTV', 'GD', 'GE', 'GILD', 'GIS', 'GL', 
  'GLW', 'GM', 'GNRC', 'GOOG', 'GOOGL', 'GPC', 'GPN', 'GPS', 'GRMN', 'GS', 'GWW', 'HAL', 'HAS', 
  'HBAN', 'HBI', 'HCA', 'HD', 'HES', 'HIG', 'HII', 'HLT', 'HOLX', 'HON', 'HPE', 'HPQ', 'HRL', 
  'HSIC', 'HST', 'HSY', 'HUM', 'HWM', 'IBM', 'ICE', 'IDXX', 'IEX', 'IFF', 'ILMN', 'INCY', 'INFO', 
  'INTC', 'INTU', 'IP', 'IPG', 'IPGP', 'IQV', 'IR', 'IRM', 'ISRG', 'IT', 'ITW', 'IVZ', 'J', 'JBHT', 
  'JCI', 'JKHY', 'JNJ', 'JNPR', 'JPM', 'K', 'KEY', 'KEYS', 'KHC', 'KIM', 'KLAC', 'KMB', 'KMI', 
  'KMX', 'KO', 'KR', 'KSU', 'L', 'LDOS', 'LEG', 'LEN', 'LH', 'LHX', 'LIN', 'LKQ', 'LLY', 'LMT', 
  'LNC', 'LNT', 'LOW', 'LRCX', 'LUMN', 'LUV', 'LVS', 'LW', 'LYB', 'LYV', 'MA', 'MAA', 'MAR', 
  'MAS', 'MCD', 'MCHP', 'MCK', 'MCO', 'MDLZ', 'MDT', 'MET', 'MGM', 'MHK', 'MKC', 'MKTX', 'MLM', 
  'MMC', 'MMM', 'MNST', 'MO', 'MOS', 'MPC', 'MPWR', 'MRK', 'MRO', 'MS', 'MSCI', 'MSFT', 'MSI', 
  'MTB', 'MTD', 'MU', 'NCLH', 'NDAQ', 'NEE', 'NEM', 'NFLX', 'NI', 'NKE', 'NLOK', 'NLSN', 'NOC', 
  'NOV', 'NOW', 'NRG', 'NSC', 'NTAP', 'NTRS', 'NUE', 'NVDA', 'NVR', 'NXPI', 'ORLY', 'OXY', 'ODFL', 
  'OMC', 'ORCL', 'ORLY', 'OTIS', 'OXY', 'PAYC', 'PAYX', 'PBCT', 'PCAR', 'PEAK', 'PEG', 'PENN', 'PEP', 
  'PFE', 'PFG', 'PG', 'PGR', 'PH', 'PHM', 'PKG', 'PKI', 'PLD', 'PM', 'PNC', 'PNR', 'PNW', 'POOL', 
  'PPG', 'PPL', 'PRGO', 'PRU', 'PSA', 'PSX', 'PTC', 'PVH', 'PWR', 'PXD', 'PYPL', 'QCOM', 'QRVO', 
  'RCL', 'RE', 'REG', 'REGN', 'RF', 'RHI', 'RJF', 'RL', 'RMD', 'ROK', 'ROL', 'ROP', 'ROST', 'RSG', 
  'RTX', 'SBAC', 'SBUX', 'SCHW', 'SEE', 'SHW', 'SIVB', 'SJM', 'SLB', 'SNA', 'SNPS', 'SO', 'SPG', 
  'SPGI', 'SRE', 'STE', 'STT', 'STX', 'STZ', 'SWK', 'SWKS', 'SYF', 'SYK', 'SYY', 'T', 'TAP', 'TDG', 
  'TDY', 'TECH', 'TEL', 'TER', 'TFC', 'TFX', 'TGT', 'TJX', 'TMO', 'TMUS', 'TPR', 'TRMB', 'TROW', 
  'TRV', 'TSCO', 'TSLA', 'TSN', 'TT', 'TTWO', 'TWTR', 'TXN', 'TXT', 'TYL', 'UA', 'UAA', 'UAL', 
  'UDR', 'UHS', 'ULTA', 'UNH', 'UNM', 'UNP', 'UPS', 'URI', 'USB', 'V', 'VAR', 'VFC', 'VIAC', 'VLO', 
  'VMC', 'VNO', 'VNT', 'VRSK', 'VRSN', 'VRTX', 'VTR', 'VTRS', 'VZ', 'WAB', 'WAT', 'WBA', 'WDC', 
  'WEC', 'WELL', 'WFC', 'WHR', 'WLTW', 'WM', 'WMB', 'WMT', 'WRB', 'WRK', 'WST', 'WU', 'WY', 'WYNN', 
  'XEL', 'XLNX', 'XOM', 'XRAY', 'XYL', 'YUM', 'ZBH', 'ZBRA', 'ZION', 'ZTS'
];

// NASDAQ 100 tickers from Wikipedia
export const NASDAQ100_TICKERS = [
  'AAPL', 'ADBE', 'ADI', 'ADP', 'ADSK', 'AEP', 'ALGN', 'AMAT', 'AMD', 'AMGN', 'AMZN', 'ANSS', 
  'ASML', 'ATVI', 'AVGO', 'BIDU', 'BIIB', 'BKNG', 'CDNS', 'CDW', 'CERN', 'CHKP', 'CHRW', 'CHTR', 
  'CMCSA', 'COST', 'CPRT', 'CSCO', 'CSX', 'CTAS', 'CTSH', 'DLTR', 'DOCU', 'DXCM', 'EA', 'EBAY', 
  'EXC', 'FAST', 'FB', 'FISV', 'FOX', 'FOXA', 'GILD', 'GOOG', 'GOOGL', 'HON', 'IDXX', 'ILMN', 
  'INCY', 'INTC', 'INTU', 'ISRG', 'JD', 'KDP', 'KHC', 'KLAC', 'LRCX', 'LULU', 'MAR', 'MCHP', 
  'MDLZ', 'MELI', 'MNST', 'MRNA', 'MRVL', 'MSFT', 'MU', 'NFLX', 'NTES', 'NVDA', 'NXPI', 'OKTA', 
  'ORLY', 'PAYX', 'PCAR', 'PDD', 'PEP', 'PTON', 'PYPL', 'QCOM', 'REGN', 'ROST', 'SBUX', 'SGEN', 
  'SIRI', 'SNPS', 'SPLK', 'SWKS', 'TCOM', 'TEAM', 'TMUS', 'TSLA', 'TXN', 'VRSK', 'VRSN', 'VRTX', 
  'WBA', 'WDAY', 'XEL', 'XLNX', 'ZM'
];

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
