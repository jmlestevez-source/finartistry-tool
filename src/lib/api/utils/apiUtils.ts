
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

// S&P 500 tickers actualizados desde Wikipedia
export const SP500_TICKERS = [
  'MMM', 'AOS', 'ABT', 'ABBV', 'ACN', 'ADBE', 'AMD', 'AES', 'AFL', 'A', 'APD', 'AKAM', 'ALB', 'ARE', 'ALGN',
  'ALLE', 'LNT', 'ALL', 'GOOGL', 'GOOG', 'MO', 'AMZN', 'AMCR', 'AEE', 'AAL', 'AEP', 'AXP', 'AIG', 'AMT',
  'AWK', 'AMP', 'AME', 'AMGN', 'APH', 'ADI', 'ANSS', 'ANTM', 'AON', 'APA', 'AAPL', 'AMAT', 'APTV', 'ACGL',
  'ANET', 'AJG', 'AIZ', 'T', 'ATO', 'ADSK', 'ADP', 'AZO', 'AVB', 'AVY', 'AXON', 'BKR', 'BALL', 'BAC', 'BK',
  'BBWI', 'BAX', 'BDX', 'WRB', 'BRK-B', 'BBY', 'BIO', 'TECH', 'BIIB', 'BLK', 'BX', 'BA', 'BKNG', 'BWA', 'BXP',
  'BSX', 'BMY', 'AVGO', 'BR', 'BRO', 'BF-B', 'BG', 'CHRW', 'CDNS', 'CZR', 'CPB', 'COF', 'CAH', 'KMX', 'CCL',
  'CARR', 'CTLT', 'CAT', 'CBOE', 'CBRE', 'CDW', 'CE', 'CNC', 'CNP', 'CDAY', 'CF', 'CRL', 'SCHW', 'CHTR', 'CVX',
  'CMG', 'CB', 'CHD', 'CI', 'CINF', 'CTAS', 'CSCO', 'C', 'CFG', 'CLX', 'CME', 'CMS', 'KO', 'CTSH', 'CL',
  'CMCSA', 'CMA', 'CAG', 'COP', 'ED', 'STZ', 'CEG', 'COO', 'CPRT', 'GLW', 'CTVA', 'CSGP', 'COST', 'CTRA',
  'CCI', 'CSX', 'CMI', 'CVS', 'DHI', 'DHR', 'DRI', 'DVA', 'DE', 'DAL', 'XRAY', 'DVN', 'DXCM', 'FANG', 'DLR',
  'DFS', 'DIS', 'DG', 'DLTR', 'D', 'DPZ', 'DOV', 'DOW', 'DTE', 'DUK', 'DD', 'EMN', 'ETN', 'EBAY', 'ECL',
  'EIX', 'EW', 'EA', 'ELV', 'LLY', 'EMR', 'ENPH', 'ETR', 'EOG', 'EPAM', 'EQT', 'EFX', 'EQIX', 'EQR', 'ESS',
  'EL', 'ETSY', 'RE', 'EVRG', 'ES', 'EXC', 'EXPE', 'EXPD', 'EXR', 'XOM', 'FFIV', 'FDS', 'FICO', 'FAST',
  'FRT', 'FDX', 'FIS', 'FITB', 'FRC', 'FE', 'FISV', 'FLT', 'FMC', 'F', 'FTNT', 'FTV', 'FOXA', 'FOX', 'BEN',
  'FCX', 'GRMN', 'IT', 'GEHC', 'GEN', 'GNRC', 'GD', 'GE', 'GIS', 'GM', 'GPC', 'GILD', 'GL', 'GPN', 'GS',
  'HAL', 'HIG', 'HAS', 'HCA', 'HSIC', 'HSY', 'HES', 'HPE', 'HLT', 'HOLX', 'HD', 'HON', 'HRL', 'HST', 'HWM',
  'HPQ', 'HUM', 'HBAN', 'HII', 'IBM', 'IEX', 'IDXX', 'ITW', 'ILMN', 'INCY', 'IR', 'INTC', 'ICE', 'IFF', 'IP',
  'IPG', 'INTU', 'ISRG', 'IVZ', 'IPGP', 'IQV', 'IRM', 'JBHT', 'JKHY', 'J', 'JNJ', 'JCI', 'JPM', 'JNPR', 'K',
  'KDP', 'KEY', 'KEYS', 'KMB', 'KIM', 'KMI', 'KLAC', 'KHC', 'KR', 'LHX', 'LH', 'LRCX', 'LW', 'LVS', 'LDOS',
  'LEN', 'LIN', 'LYV', 'LKQ', 'LMT', 'L', 'LOW', 'LUMN', 'LYB', 'MTB', 'MRO', 'MPC', 'MKTX', 'MAR', 'MMC',
  'MLM', 'MAS', 'MA', 'MTCH', 'MKC', 'MCD', 'MCK', 'MDT', 'MRK', 'META', 'MET', 'MTD', 'MGM', 'MCHP', 'MU',
  'MSFT', 'MAA', 'MRNA', 'MHK', 'MOH', 'TAP', 'MDLZ', 'MPWR', 'MNST', 'MCO', 'MS', 'MSI', 'MSCI', 'NDAQ',
  'NTAP', 'NFLX', 'NWL', 'NEM', 'NWSA', 'NWS', 'NEE', 'NKE', 'NI', 'NDSN', 'NSC', 'NTRS', 'NOC', 'NLOK',
  'NCLH', 'NRG', 'NUE', 'NVDA', 'NVR', 'NXPI', 'ORLY', 'OXY', 'ODFL', 'OMC', 'ON', 'OKE', 'ORCL', 'OTIS',
  'PCAR', 'PKG', 'PARA', 'PH', 'PAYX', 'PAYC', 'PYPL', 'PENN', 'PNR', 'PEP', 'PKI', 'PFE', 'PCG', 'PM', 'PSX',
  'PNW', 'PXD', 'PNC', 'POOL', 'PPG', 'PPL', 'PFG', 'PG', 'PGR', 'PLD', 'PRU', 'PEG', 'PTC', 'PSA', 'PHM',
  'QRVO', 'PWR', 'QCOM', 'DGX', 'RL', 'RJF', 'RTX', 'O', 'REG', 'REGN', 'RF', 'RSG', 'RMD', 'RHI', 'ROK',
  'ROL', 'ROP', 'ROST', 'RCL', 'SPGI', 'CRM', 'SBAC', 'SLB', 'STX', 'SEE', 'SRE', 'NOW', 'SHW', 'SPG', 'SWKS',
  'SJM', 'SNA', 'SEDG', 'SO', 'LUV', 'SWK', 'SBUX', 'STT', 'STE', 'SYK', 'SYF', 'SNPS', 'SYY', 'TMUS', 'TROW',
  'TTWO', 'TPR', 'TRGP', 'TGT', 'TEL', 'TDY', 'TFX', 'TER', 'TSLA', 'TXN', 'TXT', 'TMO', 'TJX', 'TSCO', 'TT',
  'TDG', 'TRV', 'TRMB', 'TFC', 'TYL', 'TSN', 'USB', 'UDR', 'ULTA', 'UNP', 'UAL', 'UPS', 'URI', 'UNH', 'UHS',
  'VLO', 'VTR', 'VRSN', 'VRSK', 'VZ', 'VRTX', 'VFC', 'VTRS', 'VICI', 'V', 'VMC', 'WAB', 'WBA', 'WMT', 'WBD',
  'WM', 'WAT', 'WEC', 'WFC', 'WELL', 'WST', 'WDC', 'WRK', 'WY', 'WHR', 'WMB', 'WTW', 'WYNN', 'XEL', 'XYL',
  'YUM', 'ZBRA', 'ZBH', 'ZION', 'ZTS'
];

// NASDAQ 100 tickers actualizados desde Wikipedia
export const NASDAQ100_TICKERS = [
  'AAPL', 'ABNB', 'ADBE', 'ADI', 'ADP', 'ADSK', 'AEP', 'ALGN', 'AMAT', 'AMD', 
  'AMGN', 'AMZN', 'ANSS', 'ASML', 'ATVI', 'AVGO', 'AZN', 'BIIB', 'BKNG', 'BKR',
  'CDNS', 'CEG', 'CHTR', 'CMCSA', 'COST', 'CPRT', 'CRWD', 'CSCO', 'CSGP', 'CSX', 
  'CTAS', 'CTSH', 'DDOG', 'DLTR', 'DXCM', 'EA', 'EBAY', 'ENPH', 'EXC', 'FANG', 
  'FAST', 'FISV', 'FTNT', 'GFS', 'GILD', 'GOOG', 'GOOGL', 'HON', 'IDXX', 'ILMN', 
  'INTC', 'INTU', 'ISRG', 'JD', 'KDP', 'KHC', 'KLAC', 'LCID', 'LRCX', 'LULU', 
  'MAR', 'MCHP', 'MDLZ', 'MELI', 'META', 'MNST', 'MRNA', 'MRVL', 'MSFT', 'MU', 
  'NFLX', 'NVDA', 'NXPI', 'ODFL', 'ORLY', 'PANW', 'PAYX', 'PCAR', 'PDD', 'PEP', 
  'PYPL', 'QCOM', 'REGN', 'ROST', 'SBUX', 'SGEN', 'SIRI', 'SNPS', 'TEAM', 'TMUS', 
  'TSLA', 'TXN', 'VRSK', 'VRTX', 'WBA', 'WBD', 'WDAY', 'XEL', 'ZM', 'ZS'
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
    
    // Propagar el error para manejarlo en la llamada
    throw error;
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
    
    // Lanzar el error para manejarlo en la llamada
    throw error;
  }
};

// Función para descargar datos directamente desde Yahoo Finance
export const fetchYahooFinanceData = async (ticker: string, from: string, to: string) => {
  console.log(`CORS: Esta función no funcionará en el entorno de desarrollo debido a restricciones CORS`);
  
  // Informar que esta función no es compatible con el entorno actual
  throw new Error('Yahoo Finance API no está disponible debido a restricciones CORS. Use los datos de demostración.');
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
    
    // Propagar el error
    throw error;
  }
};
