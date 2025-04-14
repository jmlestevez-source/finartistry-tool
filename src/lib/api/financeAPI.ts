
import { toast } from "@/hooks/use-toast";

// API Keys
const FINANCIAL_MODELING_PREP_API_KEY = "FedUgaGEN9Pv19qgVxh2nHw0JWg5V6uh";
const ALPHA_VANTAGE_API_KEY = "XFXHX5W3S21MV9PT";

// Interfaces
interface PortfolioParams {
  tickers: string[];
  weights: number[];
  benchmark: string;
  period: string;
}

interface BacktestParams {
  tickers: string[];
  weights: number[];
  benchmark: string;
  startDate: string;
  endDate?: string;
  rebalancePeriod: string;
}

// Mock data generators (para desarrollo)
const generateMockPortfolioData = (tickers: string[], weights: number[], benchmark: string, period: string) => {
  console.log(`Generating mock data for ${tickers.join(', ')} with weights ${weights.join(', ')}, benchmark ${benchmark}, period ${period}`);
  
  // Datos de rendimiento simulados
  const performanceChart = Array(60).fill(0).map((_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (60 - i));
    const dateStr = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
    
    // Valores aleatorios pero con tendencia creciente
    const portfolioBase = 1 + (i * 0.02);
    const benchmarkBase = 1 + (i * 0.015);
    
    const portfolioRandom = Math.random() * 0.1 - 0.05;
    const benchmarkRandom = Math.random() * 0.1 - 0.05;
    
    return {
      date: dateStr,
      portfolio: portfolioBase + portfolioRandom,
      benchmark: benchmarkBase + benchmarkRandom
    };
  });
  
  // Matriz de correlación
  const correlationMatrix = Array(tickers.length).fill(0).map(() => 
    Array(tickers.length).fill(0).map(() => 
      Math.random() * 0.8 + 0.2 // Correlaciones entre 0.2 y 1
    )
  );
  
  // Corregir la diagonal para tener 1's
  for (let i = 0; i < correlationMatrix.length; i++) {
    correlationMatrix[i][i] = 1;
  }
  
  // Asegurarse de que la matriz es simétrica
  for (let i = 0; i < correlationMatrix.length; i++) {
    for (let j = i+1; j < correlationMatrix.length; j++) {
      correlationMatrix[j][i] = correlationMatrix[i][j];
    }
  }
  
  // Métricas simuladas del portafolio
  const metrics = {
    annualReturn: Math.random() * 0.25, // 0% - 25%
    volatility: Math.random() * 0.2, // 0% - 20%
    sharpeRatio: Math.random() * 2 + 0.5, // 0.5 - 2.5
    maxDrawdown: -(Math.random() * 0.3 + 0.1), // -10% a -40%
    alpha: Math.random() * 0.1 - 0.03, // -3% a 7%
    beta: Math.random() * 0.5 + 0.7 // 0.7 a 1.2
  };
  
  // Métricas por acción
  const stockMetrics: Record<string, any> = {};
  tickers.forEach(ticker => {
    stockMetrics[ticker] = {
      annualReturn: Math.random() * 0.35 - 0.05, // -5% a 30%
      volatility: Math.random() * 0.3 + 0.1, // 10% a 40%
      sharpeRatio: Math.random() * 2, // 0 a 2
      maxDrawdown: -(Math.random() * 0.5 + 0.1), // -10% a -60%
      alpha: Math.random() * 0.15 - 0.05, // -5% a 10%
      beta: Math.random() * 1 + 0.5 // 0.5 a 1.5
    };
  });
  
  return {
    performanceChart,
    correlationMatrix,
    metrics,
    stockMetrics
  };
};

const generateMockValuationData = (ticker: string) => {
  console.log(`Generating mock valuation data for ${ticker}`);
  
  // Información de la empresa
  const companyInfo = {
    name: `${ticker} Corporation`,
    sector: ["Technology", "Healthcare", "Finance", "Consumer", "Energy"][Math.floor(Math.random() * 5)],
    industry: "Software",
    marketCap: Math.random() * 2000000000000,
    currentPrice: Math.random() * 1000 + 50
  };
  
  // Modelos de valoración
  const valuationModels = [
    {
      name: "DCF",
      fairValue: companyInfo.currentPrice * (Math.random() * 0.5 + 0.8), // 80% - 130% del precio actual
      upside: Math.random() * 0.5 - 0.2, // -20% a 30%
      description: "Flujos de caja descontados"
    },
    {
      name: "P/E",
      fairValue: companyInfo.currentPrice * (Math.random() * 0.5 + 0.8),
      upside: Math.random() * 0.5 - 0.2,
      description: "Múltiplo de beneficios"
    },
    {
      name: "P/B",
      fairValue: companyInfo.currentPrice * (Math.random() * 0.5 + 0.8),
      upside: Math.random() * 0.5 - 0.2,
      description: "Múltiplo de valor contable"
    },
    {
      name: "EV/EBITDA",
      fairValue: companyInfo.currentPrice * (Math.random() * 0.5 + 0.8),
      upside: Math.random() * 0.5 - 0.2,
      description: "Múltiplo de EBITDA"
    },
    {
      name: "DDM",
      fairValue: companyInfo.currentPrice * (Math.random() * 0.5 + 0.8),
      upside: Math.random() * 0.5 - 0.2,
      description: "Modelo de descuento de dividendos"
    }
  ];
  
  // Precios históricos
  const historicalPrices = Array(60).fill(0).map((_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (60 - i));
    const dateStr = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
    
    // Generar un precio con tendencia alcista y algo de volatilidad
    const basePrice = 50 + (i * 2);
    const randomFactor = Math.random() * 20 - 10;
    
    return {
      date: dateStr,
      price: basePrice + randomFactor
    };
  });
  
  // Ratios financieros
  const financialRatios = [
    { name: "P/E", value: Math.random() * 40 + 10, industryAvg: Math.random() * 30 + 15 },
    { name: "P/B", value: Math.random() * 10 + 1, industryAvg: Math.random() * 8 + 2 },
    { name: "P/S", value: Math.random() * 15 + 1, industryAvg: Math.random() * 10 + 2 },
    { name: "EV/EBITDA", value: Math.random() * 20 + 5, industryAvg: Math.random() * 15 + 7 },
    { name: "ROE", value: Math.random() * 0.3 + 0.05, industryAvg: Math.random() * 0.2 + 0.08 },
    { name: "ROA", value: Math.random() * 0.15 + 0.02, industryAvg: Math.random() * 0.1 + 0.03 },
    { name: "Margen Neto", value: Math.random() * 0.2 + 0.05, industryAvg: Math.random() * 0.15 + 0.06 },
  ];
  
  // Tasas de crecimiento
  const growthRates = {
    revenue: {
      oneYear: Math.random() * 0.5 - 0.1, // -10% a 40%
      threeYear: Math.random() * 0.4, // 0% a 40%
      fiveYear: Math.random() * 0.3 + 0.05, // 5% a 35%
      projected: Math.random() * 0.3 // 0% a 30%
    },
    earnings: {
      oneYear: Math.random() * 0.6 - 0.15, // -15% a 45%
      threeYear: Math.random() * 0.5 - 0.1, // -10% a 40%
      fiveYear: Math.random() * 0.4, // 0% a 40%
      projected: Math.random() * 0.35 // 0% a 35%
    },
    freeCashFlow: {
      oneYear: Math.random() * 0.5 - 0.2, // -20% a 30%
      threeYear: Math.random() * 0.4 - 0.1, // -10% a 30%
      fiveYear: Math.random() * 0.3, // 0% a 30%
      projected: Math.random() * 0.25 // 0% a 25%
    },
    drivers: [
      { name: "Expansión", contribution: Math.random() * 0.4 },
      { name: "Precios", contribution: Math.random() * 0.3 },
      { name: "Nuevos Productos", contribution: Math.random() * 0.2 },
      { name: "Eficiencia", contribution: Math.random() * 0.1 },
    ]
  };
  
  // Normalizar los drivers para que sumen 1
  const totalContribution = growthRates.drivers.reduce((acc, driver) => acc + driver.contribution, 0);
  growthRates.drivers.forEach(driver => {
    driver.contribution = driver.contribution / totalContribution;
  });
  
  // Métricas de riesgo
  const riskMetrics = {
    beta: Math.random() * 1.5 + 0.5, // 0.5 a 2
    volatility: Math.random() * 0.3 + 0.1, // 10% a 40%
    sharpeRatio: Math.random() * 2, // 0 a 2
    maxDrawdown: -(Math.random() * 0.5 + 0.1), // -10% a -60%
    valueAtRisk: -(Math.random() * 0.1 + 0.02), // -2% a -12%
    correlations: [
      { name: "S&P 500", value: Math.random() * 0.6 + 0.4 }, // 0.4 a 1
      { name: "Nasdaq", value: Math.random() * 0.6 + 0.4 },
      { name: "Russell 2000", value: Math.random() * 0.6 + 0.3 }, // 0.3 a 0.9
      { name: "10Y Treasury", value: Math.random() * 0.6 - 0.3 }, // -0.3 a 0.3
    ],
    riskFactors: [
      {
        name: "Riesgo de mercado",
        level: Math.random() > 0.6 ? "Alto" : Math.random() > 0.3 ? "Medio" : "Bajo",
        description: "Sensibilidad a los movimientos generales del mercado."
      },
      {
        name: "Riesgo sectorial",
        level: Math.random() > 0.6 ? "Alto" : Math.random() > 0.3 ? "Medio" : "Bajo",
        description: "Exposición a factores específicos del sector."
      },
      {
        name: "Riesgo financiero",
        level: Math.random() > 0.6 ? "Alto" : Math.random() > 0.3 ? "Medio" : "Bajo",
        description: "Estructura de capital y sostenibilidad financiera."
      },
      {
        name: "Riesgo legal/regulatorio",
        level: Math.random() > 0.6 ? "Alto" : Math.random() > 0.3 ? "Medio" : "Bajo",
        description: "Exposición a cambios legales o regulatorios."
      }
    ]
  };
  
  return {
    companyInfo,
    valuationModels,
    historicalPrices,
    financialRatios,
    growthRates,
    riskMetrics
  };
};

const generateMockBacktestData = (params: BacktestParams) => {
  const { tickers, weights, benchmark, startDate, endDate, rebalancePeriod } = params;
  
  console.log(`Generating mock backtest data with params:`, params);
  
  // Generar datos de rendimiento
  const portfolioPerformance = [];
  const startYear = parseInt(startDate.split('-')[0]);
  const endYear = endDate ? parseInt(endDate.split('-')[0]) : new Date().getFullYear();
  
  // Crear datos mensuales desde la fecha de inicio
  for (let year = startYear; year <= endYear; year++) {
    for (let month = 1; month <= 12; month++) {
      if (year === startYear && month < parseInt(startDate.split('-')[1])) continue;
      if (endDate && year === endYear && month > parseInt(endDate.split('-')[1])) continue;
      
      const date = `${year}-${month.toString().padStart(2, '0')}`;
      
      // Generar valores acumulados con algo de aleatoriedad pero con tendencia
      const monthIndex = (year - startYear) * 12 + month;
      const portfolioGrowth = 1 + (monthIndex * 0.01) + (Math.random() * 0.04 - 0.02);
      const benchmarkGrowth = 1 + (monthIndex * 0.008) + (Math.random() * 0.04 - 0.02);
      
      portfolioPerformance.push({
        date,
        portfolio: portfolioGrowth,
        benchmark: benchmarkGrowth
      });
    }
  }
  
  // Métricas del portafolio
  const portfolioAnnualReturn = Math.random() * 0.15 + 0.05; // 5% - 20%
  const benchmarkAnnualReturn = portfolioAnnualReturn - (Math.random() * 0.05); // Ligeramente peor
  
  const portfolioVolatility = Math.random() * 0.15 + 0.08; // 8% - 23%
  const benchmarkVolatility = portfolioVolatility + (Math.random() * 0.03); // Ligeramente más volátil
  
  const metrics = {
    cagr: portfolioAnnualReturn,
    volatility: portfolioVolatility,
    sharpeRatio: portfolioAnnualReturn / portfolioVolatility,
    sortino: (portfolioAnnualReturn / portfolioVolatility) * 1.3, // Aproximación
    maxDrawdown: -(Math.random() * 0.25 + 0.1), // -10% a -35%
    winRate: Math.random() * 0.2 + 0.55, // 55% - 75%
    bestYear: Math.random() * 0.3 + 0.15, // 15% - 45%
    worstYear: -(Math.random() * 0.2 + 0.05), // -5% a -25%
    alpha: Math.random() * 0.05, // 0% - 5%
    beta: Math.random() * 0.4 + 0.7, // 0.7 - 1.1
    correlationToBenchmark: Math.random() * 0.3 + 0.7 // 0.7 - 1.0
  };
  
  // Métricas del benchmark
  const benchmarkMetrics = {
    cagr: benchmarkAnnualReturn,
    volatility: benchmarkVolatility,
    sharpeRatio: benchmarkAnnualReturn / benchmarkVolatility,
    sortino: (benchmarkAnnualReturn / benchmarkVolatility) * 1.2,
    maxDrawdown: -(Math.random() * 0.3 + 0.1), // -10% a -40%
    winRate: Math.random() * 0.2 + 0.5, // 50% - 70%
    bestYear: Math.random() * 0.25 + 0.1, // 10% - 35%
    worstYear: -(Math.random() * 0.25 + 0.08), // -8% a -33%
    alpha: 0,
    beta: 1,
    correlationToBenchmark: 1
  };
  
  // Retornos anuales
  const yearlyReturns = [];
  for (let year = startYear; year <= endYear; year++) {
    yearlyReturns.push({
      year: year.toString(),
      portfolio: Math.random() * 0.5 - 0.15, // -15% a 35%
      benchmark: Math.random() * 0.4 - 0.1 // -10% a 30%
    });
  }
  
  // Retornos mensuales
  const monthlyReturns = [];
  for (let year = startYear; year <= endYear; year++) {
    const returns = Array(12).fill(0).map(() => Math.random() * 0.1 - 0.03); // -3% a 7% mensual
    const annualReturn = returns.reduce((acc, val) => (acc + 1) * (val + 1) - 1, 0);
    
    monthlyReturns.push({
      year: year.toString(),
      returns,
      annualReturn
    });
  }
  
  // Drawdowns
  const drawdowns = portfolioPerformance.map(point => ({
    date: point.date,
    portfolio: Math.random() * -0.2,
    benchmark: Math.random() * -0.25
  }));
  
  // Asignación a lo largo del tiempo
  const allocationOverTime = [];
  for (let i = 0; i < portfolioPerformance.length; i++) {
    const allocation: Record<string, number> = { date: portfolioPerformance[i].date };
    
    // Iniciar con los pesos proporcionados
    let remainingWeight = 1;
    for (let j = 0; j < tickers.length - 1; j++) {
      const variation = Math.random() * 0.1 - 0.05; // -5% a 5% de variación
      const weight = Math.max(0.05, Math.min(0.95, weights[j] + variation * weights[j]));
      allocation[tickers[j]] = weight;
      remainingWeight -= weight;
    }
    
    // El último ticker toma el peso restante
    allocation[tickers[tickers.length - 1]] = Math.max(0.05, remainingWeight);
    
    allocationOverTime.push(allocation);
  }
  
  // Métricas móviles
  const rollingReturns = portfolioPerformance.map((point, index) => {
    if (index < 12) return { date: point.date, portfolio: null, benchmark: null };
    
    return {
      date: point.date,
      portfolio: Math.random() * 0.3 - 0.05, // -5% a 25%
      benchmark: Math.random() * 0.25 - 0.05 // -5% a 20%
    };
  });
  
  const rollingVolatility = portfolioPerformance.map((point, index) => {
    if (index < 12) return { date: point.date, portfolio: null, benchmark: null };
    
    return {
      date: point.date,
      portfolio: Math.random() * 0.15 + 0.05, // 5% a 20%
      benchmark: Math.random() * 0.18 + 0.06 // 6% a 24%
    };
  });
  
  const rollingSharpe = portfolioPerformance.map((point, index) => {
    if (index < 12) return { date: point.date, portfolio: null, benchmark: null };
    
    return {
      date: point.date,
      portfolio: Math.random() * 3 - 0.5, // -0.5 a 2.5
      benchmark: Math.random() * 2 - 0.2 // -0.2 a 1.8
    };
  });
  
  return {
    portfolioPerformance,
    yearlyReturns,
    metrics,
    benchmarkMetrics,
    monthlyReturns,
    drawdowns,
    allocationOverTime,
    rollingReturns,
    rollingVolatility,
    rollingSharpe
  };
};

// API Handlers
export const fetchPortfolioData = async (
  tickers: string[], 
  weights: number[], 
  benchmark: string, 
  period: string
) => {
  try {
    // En un caso real, aquí harías fetch a las APIs financieras
    // Por ahora, usaremos datos simulados
    return generateMockPortfolioData(tickers, weights, benchmark, period);
  } catch (error) {
    console.error("Error fetching portfolio data:", error);
    throw new Error("Failed to fetch portfolio data");
  }
};

export const fetchStockValuation = async (ticker: string) => {
  try {
    // En un caso real, aquí harías fetch a las APIs financieras
    // Por ahora, usaremos datos simulados
    return generateMockValuationData(ticker);
  } catch (error) {
    console.error("Error fetching stock valuation data:", error);
    throw new Error("Failed to fetch stock valuation data");
  }
};

export const fetchBacktestResults = async (params: BacktestParams) => {
  try {
    // En un caso real, aquí harías fetch a las APIs financieras
    // Por ahora, usaremos datos simulados
    return generateMockBacktestData(params);
  } catch (error) {
    console.error("Error fetching backtest results:", error);
    throw new Error("Failed to fetch backtest results");
  }
};

// Placeholder para API real - se implementaría para conectar con las APIs financieras
// Es necesario reemplazar estas funciones para conectarse a las APIs reales
const fetchFinancialData = async (endpoint: string, params: Record<string, string>) => {
  // En una implementación real, este método haría una llamada a la API
  const url = new URL(endpoint);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, value);
  });
  
  try {
    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("API request failed:", error);
    throw error;
  }
};
