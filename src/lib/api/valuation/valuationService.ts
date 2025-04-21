
// Stock valuation service

import { FINANCIAL_MODELING_PREP_API_KEY, ALPHA_VANTAGE_API_KEY } from '../constants';
import { fetchFinancialData, fetchAlphaVantageData } from '../utils/apiUtils';
import { calculateStartDate, getTodayDate } from '../utils/dateUtils';
import { calculateDailyReturns } from '../utils/dataTransformations';
import { calculateVolatility } from '../utils/metricsCalculations';
import { calculateMaxDrawdown } from '../utils/metricsCalculations';
import { calculateValuationModels, findIndustryAverages } from './valuationModels';

export const fetchStockValuation = async (ticker: string) => {
  try {
    console.log(`Fetching stock valuation data for ${ticker}`);
    
    // 1. Obtener información general de la empresa
    const companyInfoPromise = fetchFinancialData(
      `https://financialmodelingprep.com/api/v3/profile/${ticker}`,
      { apikey: FINANCIAL_MODELING_PREP_API_KEY }
    );
    
    // 2. Obtener métricas financieras
    const ratiosPromise = fetchFinancialData(
      `https://financialmodelingprep.com/api/v3/ratios-ttm/${ticker}`,
      { apikey: FINANCIAL_MODELING_PREP_API_KEY }
    );
    
    // 3. Obtener datos históricos para gráfico de precios
    const historicalPricesPromise = fetchFinancialData(
      `https://financialmodelingprep.com/api/v3/historical-price-full/${ticker}`,
      { apikey: FINANCIAL_MODELING_PREP_API_KEY, from: calculateStartDate('5y'), to: getTodayDate() }
    );
    
    // 4. Obtener tasas de crecimiento
    const growthRatesPromise = fetchFinancialData(
      `https://financialmodelingprep.com/api/v3/financial-growth/${ticker}`,
      { apikey: FINANCIAL_MODELING_PREP_API_KEY, limit: "5" } // Convertido a string para corregir el error TS2322
    );
    
    // 5. Obtener promedios de la industria para comparación
    const industryRatiosPromise = fetchFinancialData(
      `https://financialmodelingprep.com/api/v4/industry_ratios`,
      { apikey: FINANCIAL_MODELING_PREP_API_KEY }
    );
    
    // Esperar a que todas las promesas se resuelvan
    const [companyInfoResponse, ratiosResponse, historicalPricesResponse, growthRatesResponse, industryRatiosResponse] = 
      await Promise.all([companyInfoPromise, ratiosPromise, historicalPricesPromise, growthRatesPromise, industryRatiosPromise]);
    
    // Procesar la información de la empresa
    if (!companyInfoResponse || companyInfoResponse.length === 0) {
      throw new Error(`No company info found for ${ticker}`);
    }
    
    const companyInfo = {
      name: companyInfoResponse[0].companyName,
      sector: companyInfoResponse[0].sector || 'N/A',
      industry: companyInfoResponse[0].industry || 'N/A',
      marketCap: companyInfoResponse[0].mktCap || 0,
      currentPrice: companyInfoResponse[0].price || 0
    };
    
    // Procesar datos históricos
    const historicalPrices = historicalPricesResponse?.historical?.map((item: any) => ({
      date: item.date,
      price: item.close
    })) || [];
    
    // Procesar ratios financieros y compararlos con la industria
    let financialRatios = [];
    const industryAvg = findIndustryAverages(industryRatiosResponse, companyInfo.industry);
    
    if (ratiosResponse && ratiosResponse.length > 0) {
      const ratios = ratiosResponse[0];
      
      financialRatios = [
        { name: 'P/E', value: ratios.peRatioTTM || 0, industryAvg: industryAvg.peRatioTTM || 0 },
        { name: 'P/B', value: ratios.priceToBookRatioTTM || 0, industryAvg: industryAvg.priceToBookRatioTTM || 0 },
        { name: 'P/S', value: ratios.priceToSalesRatioTTM || 0, industryAvg: industryAvg.priceToSalesRatioTTM || 0 },
        { name: 'EV/EBITDA', value: ratios.enterpriseValueMultipleTTM || 0, industryAvg: industryAvg.enterpriseValueMultipleTTM || 0 },
        { name: 'ROE', value: ratios.returnOnEquityTTM || 0, industryAvg: industryAvg.returnOnEquityTTM || 0 },
        { name: 'ROA', value: ratios.returnOnAssetsTTM || 0, industryAvg: industryAvg.returnOnAssetsTTM || 0 },
        { name: 'Margen Neto', value: ratios.netProfitMarginTTM || 0, industryAvg: industryAvg.netProfitMarginTTM || 0 },
      ];
    } else {
      // Valores por defecto si no hay datos
      financialRatios = [
        { name: 'P/E', value: 0, industryAvg: 0 },
        { name: 'P/B', value: 0, industryAvg: 0 },
        { name: 'P/S', value: 0, industryAvg: 0 },
        { name: 'EV/EBITDA', value: 0, industryAvg: 0 },
        { name: 'ROE', value: 0, industryAvg: 0 },
        { name: 'ROA', value: 0, industryAvg: 0 },
        { name: 'Margen Neto', value: 0, industryAvg: 0 },
      ];
    }
    
    // Procesar tasas de crecimiento
    let growthRates = {
      revenue: { oneYear: 0, threeYear: 0, fiveYear: 0, projected: 0 },
      earnings: { oneYear: 0, threeYear: 0, fiveYear: 0, projected: 0 },
      freeCashFlow: { oneYear: 0, threeYear: 0, fiveYear: 0, projected: 0 },
      drivers: [
        { name: 'Expansión', contribution: 0.4 },
        { name: 'Precios', contribution: 0.3 },
        { name: 'Nuevos Productos', contribution: 0.2 },
        { name: 'Eficiencia', contribution: 0.1 },
      ]
    };
    
    if (growthRatesResponse && growthRatesResponse.length > 0) {
      const growth = growthRatesResponse[0];
      
      growthRates.revenue.oneYear = growth.revenueGrowth || 0;
      growthRates.earnings.oneYear = growth.epsgrowth || 0;
      growthRates.freeCashFlow.oneYear = growth.freeCashFlowGrowth || 0;
      
      // Proyectar crecimiento futuro basado en histórico
      growthRates.revenue.projected = growth.revenueGrowth * 0.8; // Asumimos que el crecimiento futuro será el 80% del histórico
      growthRates.earnings.projected = growth.epsgrowth * 0.8;
      growthRates.freeCashFlow.projected = growth.freeCashFlowGrowth * 0.8;
      
      // Si hay suficientes datos, calcular crecimiento a 3 y 5 años
      if (growthRatesResponse.length >= 3) {
        growthRates.revenue.threeYear = (Math.pow(
          (1 + (growthRatesResponse[0].revenueGrowth || 0)) *
          (1 + (growthRatesResponse[1].revenueGrowth || 0)) *
          (1 + (growthRatesResponse[2].revenueGrowth || 0))
        , 1/3) - 1) || 0;
        
        growthRates.earnings.threeYear = (Math.pow(
          (1 + (growthRatesResponse[0].epsgrowth || 0)) *
          (1 + (growthRatesResponse[1].epsgrowth || 0)) *
          (1 + (growthRatesResponse[2].epsgrowth || 0))
        , 1/3) - 1) || 0;
        
        growthRates.freeCashFlow.threeYear = (Math.pow(
          (1 + (growthRatesResponse[0].freeCashFlowGrowth || 0)) *
          (1 + (growthRatesResponse[1].freeCashFlowGrowth || 0)) *
          (1 + (growthRatesResponse[2].freeCashFlowGrowth || 0))
        , 1/3) - 1) || 0;
      }
      
      if (growthRatesResponse.length >= 5) {
        growthRates.revenue.fiveYear = (Math.pow(
          growthRatesResponse.slice(0, 5).reduce((acc, curr) => acc * (1 + (curr.revenueGrowth || 0)), 1)
        , 1/5) - 1) || 0;
        
        growthRates.earnings.fiveYear = (Math.pow(
          growthRatesResponse.slice(0, 5).reduce((acc, curr) => acc * (1 + (curr.epsgrowth || 0)), 1)
        , 1/5) - 1) || 0;
        
        growthRates.freeCashFlow.fiveYear = (Math.pow(
          growthRatesResponse.slice(0, 5).reduce((acc, curr) => acc * (1 + (curr.freeCashFlowGrowth || 0)), 1)
        , 1/5) - 1) || 0;
      }
    }
    
    // Calcular valores justos usando diferentes modelos
    // Usar Alpha Vantage para obtener algunas métricas adicionales
    const earningsPromise = fetchAlphaVantageData(
      'EARNINGS',
      { symbol: ticker, apikey: ALPHA_VANTAGE_API_KEY }
    );
    
    const overviewPromise = fetchAlphaVantageData(
      'OVERVIEW',
      { symbol: ticker, apikey: ALPHA_VANTAGE_API_KEY }
    );
    
    const [earningsData, overviewData] = await Promise.all([earningsPromise, overviewPromise]);
    
    // Calcular modelos de valoración
    const valuationModels = calculateValuationModels(
      companyInfo, 
      ratiosResponse?.[0] || {}, 
      earningsData, 
      overviewData,
      growthRates
    );
    
    // Calcular métricas de riesgo
    const beta = overviewData?.Beta ? parseFloat(overviewData.Beta as string) : (companyInfoResponse[0].beta || 1);
    
    // Usar datos de volatilidad histórica para métricas de riesgo
    const dailyReturns = calculateDailyReturns(historicalPrices);
    const volatility = calculateVolatility(dailyReturns);
    
    const riskMetrics = {
      beta,
      volatility,
      sharpeRatio: (growthRates.earnings.oneYear || 0) / volatility, // Aproximación simple
      maxDrawdown: calculateMaxDrawdown(historicalPrices),
      valueAtRisk: -volatility * 1.65, // Aproximación de VaR al 95%
      correlations: [
        { name: 'S&P 500', value: 0.7 }, // Valores por defecto, idealmente se calcularían realmente
        { name: 'Nasdaq', value: 0.75 },
        { name: 'Russell 2000', value: 0.6 },
        { name: '10Y Treasury', value: -0.2 },
      ],
      riskFactors: [
        {
          name: 'Riesgo de mercado',
          level: beta > 1.3 ? 'Alto' : beta > 0.8 ? 'Medio' : 'Bajo',
          description: 'Sensibilidad a los movimientos generales del mercado.'
        },
        {
          name: 'Riesgo sectorial',
          level: companyInfo.sector === 'Technology' || companyInfo.sector === 'Healthcare' ? 'Alto' : 'Medio',
          description: 'Exposición a factores específicos del sector.'
        },
        {
          name: 'Riesgo financiero',
          level: (ratiosResponse?.[0]?.debtEquityRatioTTM || 0) > 1.5 ? 'Alto' : 'Medio',
          description: 'Estructura de capital y sostenibilidad financiera.'
        },
        {
          name: 'Riesgo legal/regulatorio',
          level: ['Financial Services', 'Healthcare', 'Energy'].includes(companyInfo.sector) ? 'Alto' : 'Medio',
          description: 'Exposición a cambios legales o regulatorios.'
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
  } catch (error) {
    console.error("Error fetching stock valuation data:", error);
    throw new Error("Failed to fetch stock valuation data");
  }
};
