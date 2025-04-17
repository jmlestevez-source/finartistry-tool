// Valuation service for company analysis

import { FINANCIAL_MODELING_PREP_API_KEY } from '../constants';
import { fetchFinancialData, fetchYahooFinanceData } from '../utils/apiUtils';
import { calculateStartDate, getTodayDate } from '../utils/dateUtils';

// Función para calcular el valor intrínseco usando DCF (Discounted Cash Flow)
const calculateIntrinsicValue = (
  freeCashFlows: number[],
  growthRate: number,
  discountRate: number,
  terminalMultiple: number
): number => {
  let intrinsicValue = 0;
  const years = 5; // Proyección a 5 años
  
  // Calcular el valor presente de los flujos de caja proyectados
  for (let i = 0; i < years; i++) {
    const lastKnownFCF = freeCashFlows[freeCashFlows.length - 1];
    const projectedFCF = lastKnownFCF * Math.pow(1 + growthRate, i + 1);
    intrinsicValue += projectedFCF / Math.pow(1 + discountRate, i + 1);
  }
  
  // Calcular el valor terminal
  const terminalValue = 
    (freeCashFlows[freeCashFlows.length - 1] * 
    Math.pow(1 + growthRate, years) * 
    terminalMultiple) / 
    Math.pow(1 + discountRate, years);
  
  intrinsicValue += terminalValue;
  
  return intrinsicValue;
};

// Función para calcular métricas de valoración
const calculateValuationMetrics = (
  price: number,
  eps: number,
  bookValue: number,
  freeCashFlow: number,
  shares: number,
  revenue: number
) => {
  // Calcular métricas básicas
  const pe = eps > 0 ? price / eps : null;
  const pb = bookValue > 0 ? price / bookValue : null;
  const pfcf = freeCashFlow > 0 ? price / (freeCashFlow / shares) : null;
  const ps = revenue > 0 ? (price * shares) / revenue : null;
  
  return {
    pe,
    pb,
    pfcf,
    ps
  };
};

// Función para generar datos de valoración simulados
const generateMockValuationData = (ticker: string) => {
  console.log(`Generando datos de valoración simulados para ${ticker}`);
  
  // Generar datos financieros simulados
  const currentPrice = 100 + Math.random() * 900;
  const eps = (Math.random() * 10) + 0.5;
  const bookValue = (Math.random() * 50) + 5;
  const freeCashFlow = (Math.random() * 5000000000) + 100000000;
  const shares = (Math.random() * 1000000000) + 100000000;
  const revenue = (Math.random() * 50000000000) + 1000000000;
  
  // Generar historial de flujos de caja libre
  const freeCashFlows = [];
  let baseFCF = freeCashFlow * 0.8;
  for (let i = 0; i < 5; i++) {
    freeCashFlows.push(baseFCF);
    baseFCF *= (1 + (Math.random() * 0.2 - 0.05)); // Crecimiento entre -5% y 15%
  }
  
  // Calcular métricas de valoración
  const valuationMetrics = calculateValuationMetrics(
    currentPrice,
    eps,
    bookValue,
    freeCashFlow,
    shares,
    revenue
  );
  
  // Calcular valor intrínseco
  const growthRate = Math.random() * 0.15 + 0.02; // Entre 2% y 17%
  const discountRate = Math.random() * 0.05 + 0.08; // Entre 8% y 13%
  const terminalMultiple = Math.random() * 10 + 10; // Entre 10 y 20
  
  const intrinsicValue = calculateIntrinsicValue(
    freeCashFlows,
    growthRate,
    discountRate,
    terminalMultiple
  ) / shares;
  
  // Calcular margen de seguridad
  const marginOfSafety = ((intrinsicValue - currentPrice) / intrinsicValue) * 100;
  
  return {
    ticker,
    currentPrice,
    intrinsicValue,
    marginOfSafety,
    metrics: {
      pe: valuationMetrics.pe,
      pb: valuationMetrics.pb,
      pfcf: valuationMetrics.pfcf,
      ps: valuationMetrics.ps,
      eps,
      bookValue,
      freeCashFlow: freeCashFlow / 1000000, // En millones
      revenue: revenue / 1000000, // En millones
      shares: shares / 1000000 // En millones
    },
    growthAssumptions: {
      projectedGrowthRate: growthRate,
      discountRate,
      terminalMultiple
    },
    historicalData: {
      freeCashFlows: freeCashFlows.map(fcf => fcf / 1000000) // En millones
    }
  };
};

export const fetchCompanyValuation = async (ticker: string) => {
  try {
    console.log(`Fetching valuation data for ${ticker}`);
    
    // Datos de valoración que vamos a devolver
    const valuationData = {
      ticker,
      currentPrice: 0,
      intrinsicValue: 0,
      marginOfSafety: 0,
      metrics: {
        pe: null,
        pb: null,
        pfcf: null,
        ps: null,
        eps: 0,
        bookValue: 0,
        freeCashFlow: 0,
        revenue: 0,
        shares: 0
      },
      growthAssumptions: {
        projectedGrowthRate: 0,
        discountRate: 0,
        terminalMultiple: 0
      },
      historicalData: {
        freeCashFlows: []
      },
      companyProfile: {
        Beta: 1.0
      }
    };
    
    // Intentar obtener datos reales
    let response;
    
    try {
      // Intentar obtener datos de Financial Modeling Prep
      response = await fetchFinancialData(
        `https://financialmodelingprep.com/api/v3/company/profile/${ticker}`,
        { apikey: FINANCIAL_MODELING_PREP_API_KEY }
      );
      
      if (response && !response.error) {
        console.log(`Successfully fetched company profile for ${ticker}`);
        
        // Obtener datos financieros adicionales
        const financialData = await fetchFinancialData(
          `https://financialmodelingprep.com/api/v3/income-statement/${ticker}`,
          { apikey: FINANCIAL_MODELING_PREP_API_KEY, limit: 5 }
        );
        
        const balanceSheet = await fetchFinancialData(
          `https://financialmodelingprep.com/api/v3/balance-sheet-statement/${ticker}`,
          { apikey: FINANCIAL_MODELING_PREP_API_KEY, limit: 1 }
        );
        
        const cashFlow = await fetchFinancialData(
          `https://financialmodelingprep.com/api/v3/cash-flow-statement/${ticker}`,
          { apikey: FINANCIAL_MODELING_PREP_API_KEY, limit: 5 }
        );
        
        // Extraer datos relevantes
        if (response.profile) {
          valuationData.currentPrice = response.profile.price || 0;
          
          // Calcular métricas básicas
          valuationData.metrics.pe = response.profile.pe || null;
          valuationData.metrics.pb = response.profile.pb || null;
        }
        
        // Extraer datos de ingresos y EPS
        if (financialData && financialData.length > 0) {
          valuationData.metrics.revenue = financialData[0].revenue / 1000000; // En millones
          valuationData.metrics.eps = financialData[0].eps || 0;
        }
        
        // Extraer valor en libros
        if (balanceSheet && balanceSheet.length > 0) {
          const totalEquity = balanceSheet[0].totalEquity || 0;
          const sharesOutstanding = balanceSheet[0].commonStock || 0;
          
          if (sharesOutstanding > 0) {
            valuationData.metrics.bookValue = totalEquity / sharesOutstanding;
            valuationData.metrics.shares = sharesOutstanding / 1000000; // En millones
          }
        }
        
        // Extraer flujos de caja libre históricos
        if (cashFlow && cashFlow.length > 0) {
          const freeCashFlows = cashFlow.map(cf => {
            const fcf = (cf.netIncome + cf.depreciationAndAmortization - cf.capitalExpenditure) / 1000000; // En millones
            return fcf;
          }).reverse(); // Ordenar de más antiguo a más reciente
          
          valuationData.historicalData.freeCashFlows = freeCashFlows;
          valuationData.metrics.freeCashFlow = freeCashFlows[freeCashFlows.length - 1] || 0;
          
          // Calcular tasa de crecimiento proyectada basada en el crecimiento histórico
          if (freeCashFlows.length > 1) {
            const oldestFCF = freeCashFlows[0];
            const newestFCF = freeCashFlows[freeCashFlows.length - 1];
            const years = freeCashFlows.length - 1;
            
            if (oldestFCF > 0 && years > 0) {
              const cagr = Math.pow(newestFCF / oldestFCF, 1 / years) - 1;
              valuationData.growthAssumptions.projectedGrowthRate = Math.min(Math.max(cagr, 0.02), 0.15);
            } else {
              valuationData.growthAssumptions.projectedGrowthRate = 0.05; // Valor por defecto
            }
          } else {
            valuationData.growthAssumptions.projectedGrowthRate = 0.05; // Valor por defecto
          }
          
          // Establecer tasa de descuento y múltiplo terminal
          valuationData.growthAssumptions.discountRate = 0.1; // 10% por defecto
          valuationData.growthAssumptions.terminalMultiple = 15; // 15x por defecto
          
          // Calcular valor intrínseco
          if (valuationData.metrics.shares > 0) {
            const totalIntrinsicValue = calculateIntrinsicValue(
              freeCashFlows.map(fcf => fcf * 1000000), // Convertir de nuevo a valores absolutos
              valuationData.growthAssumptions.projectedGrowthRate,
              valuationData.growthAssumptions.discountRate,
              valuationData.growthAssumptions.terminalMultiple
            );
            
            valuationData.intrinsicValue = totalIntrinsicValue / (valuationData.metrics.shares * 1000000);
            
            // Calcular margen de seguridad
            if (valuationData.intrinsicValue > 0) {
              valuationData.marginOfSafety = ((valuationData.intrinsicValue - valuationData.currentPrice) / valuationData.intrinsicValue) * 100;
            }
          }
        }
      }
    } catch (error) {
      console.error(`Error fetching data from Financial Modeling Prep for ${ticker}:`, error);
    }
    
    // Handle Yahoo Finance data
    try {
      // Try to fetch from Yahoo Finance directly
      const yahooData = await fetchYahooFinanceData(ticker, calculateStartDate("5y"), getTodayDate());
      
      // If we got data from Yahoo, use it
      if (yahooData && yahooData.historical && yahooData.historical.length > 0) {
        response = yahooData;
        console.log(`Successfully fetched Yahoo Finance data for ${ticker}`);
      }
    } catch (yahooError) {
      console.error(`Error fetching from Yahoo Finance: ${yahooError}`);
    }
    
    // Fix the error with Beta property
    if (response && !response.error) {
      const companyProfile = {
        Beta: 1.0,  // Default value
        // Other profile data would be here if available
      };
      
      return { ...valuationData, dataSource: response.dataSource || 'Simulated Data', companyProfile };
    }
    
    // Si no se pudieron obtener datos reales, generar datos simulados
    console.warn(`No se pudieron obtener datos reales para ${ticker}, usando datos simulados`);
    const mockData = generateMockValuationData(ticker);
    return { ...mockData, dataSource: 'Simulated Data' };
    
  } catch (error) {
    console.error("Error fetching company valuation:", error);
    throw new Error(`Failed to fetch company valuation: ${error instanceof Error ? error.message : String(error)}`);
  }
};
