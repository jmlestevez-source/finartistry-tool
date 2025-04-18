// Valuation service

import { FINANCIAL_MODELING_PREP_API_KEY } from '../constants';
import { fetchFinancialData, fetchYahooFinanceData } from '../utils/apiUtils';
import { transformFMPHistoricalData } from '../utils/dataTransformations';
import { getTodayDate } from '../utils/dateUtils';

export const fetchStockValuation = async (ticker: string) => {
  try {
    console.log(`Fetching valuation data for ${ticker}`);
    
    // Generar datos simulados para demostración ya que las llamadas directas a Yahoo Finance
    // están bloqueadas por CORS en el entorno de desarrollo
    console.log("Generando datos históricos simulados para valoración");
    
    // Fecha inicial para datos históricos (1 año atrás)
    const startDate = new Date();
    startDate.setFullYear(startDate.getFullYear() - 1);
    const endDate = new Date();
    const days = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Crear datos simulados realistas
    const historicalData: { date: string; price: number }[] = [];
    
    // Precio inicial realista para el ticker
    let basePrice;
    if (ticker === "AAPL") basePrice = 150;
    else if (ticker === "MSFT") basePrice = 300;
    else if (ticker === "GOOGL") basePrice = 2800;
    else if (ticker === "AMZN") basePrice = 3300;
    else if (ticker === "META") basePrice = 300;
    else if (ticker === "TSLA") basePrice = 900;
    else if (ticker === "SPY") basePrice = 420;
    else if (ticker === "QQQ") basePrice = 380;
    else basePrice = 100 + Math.random() * 900; // Para otros tickers
    
    let currentPrice = basePrice;
    
    // Generar serie temporal con volatilidad y tendencias realistas
    for (let i = 0; i <= days; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      
      // No incluir fines de semana
      if (currentDate.getDay() === 0 || currentDate.getDay() === 6) continue;
      
      const dateStr = currentDate.toISOString().split('T')[0];
      
      // Volatilidad personalizada según el activo
      let volatility = 0.01; // Volatilidad base
      
      if (ticker === "TSLA" || ticker === "AMZN") volatility = 0.018; // Mayor volatilidad
      else if (ticker === "SPY" || ticker === "QQQ") volatility = 0.008; // Menor volatilidad
      
      // Simular cambio de precio con componente aleatorio y tendencia
      const trend = 0.0002; // Ligera tendencia alcista
      const change = (Math.random() - 0.5) * volatility * 2 + trend;
      currentPrice = currentPrice * (1 + change);
      
      historicalData.push({
        date: dateStr,
        price: currentPrice
      });
    }
    
    // Ordenar por fecha
    const sortedHistoricalData = historicalData.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    // Simular datos de valoración para demostración
    const mockData = {
      ticker: ticker,
      companyInfo: {
        name: `${ticker} Corporation`,
        sector: "Tecnología",
        industry: "Software",
        marketCap: 500000000000,
        currentPrice: sortedHistoricalData[sortedHistoricalData.length - 1].price
      },
      valuationModels: [
        { name: "DCF", fairValue: sortedHistoricalData[sortedHistoricalData.length - 1].price * 1.13, upside: 0.13, description: "Flujos de caja descontados" },
        { name: "P/E", fairValue: sortedHistoricalData[sortedHistoricalData.length - 1].price * 1.10, upside: 0.10, description: "Múltiplo de beneficios" },
        { name: "P/B", fairValue: sortedHistoricalData[sortedHistoricalData.length - 1].price * 1.03, upside: 0.03, description: "Múltiplo de valor contable" },
        { name: "EV/EBITDA", fairValue: sortedHistoricalData[sortedHistoricalData.length - 1].price * 1.15, upside: 0.15, description: "Múltiplo de EBITDA" },
        { name: "DDM", fairValue: sortedHistoricalData[sortedHistoricalData.length - 1].price * 1.06, upside: 0.06, description: "Modelo de descuento de dividendos" }
      ],
      historicalPrices: sortedHistoricalData,
      financialRatios: [
        { name: "P/E", value: 25.3, industryAvg: 22.1 },
        { name: "P/B", value: 8.7, industryAvg: 6.5 },
        { name: "P/S", value: 12.4, industryAvg: 10.2 },
        { name: "ROE", value: 0.35, industryAvg: 0.28 },
        { name: "ROA", value: 0.18, industryAvg: 0.15 },
        { name: "Margen neto", value: 0.21, industryAvg: 0.18 }
      ],
      growthRates: {
        revenue: {
          oneYear: 0.18,
          threeYear: 0.15,
          fiveYear: 0.13,
          projected: 0.12
        },
        earnings: {
          oneYear: 0.22,
          threeYear: 0.19,
          fiveYear: 0.16,
          projected: 0.14
        },
        freeCashFlow: {
          oneYear: 0.20,
          threeYear: 0.17,
          fiveYear: 0.15,
          projected: 0.13
        },
        drivers: [
          { name: "Innovación", contribution: 0.35 },
          { name: "Expansión mercado", contribution: 0.25 },
          { name: "Adquisiciones", contribution: 0.20 },
          { name: "Eficiencia operativa", contribution: 0.15 },
          { name: "Otros", contribution: 0.05 }
        ]
      },
      riskMetrics: {
        beta: 1.25,
        volatility: 0.22,
        sharpeRatio: 1.3,
        maxDrawdown: 0.28,
        valueAtRisk: 0.04,
        correlations: [
          { name: "S&P 500", value: 0.82 },
          { name: "NASDAQ", value: 0.89 },
          { name: "Sector Tech", value: 0.93 },
          { name: "Bonos 10Y", value: -0.35 }
        ],
        riskFactors: [
          { 
            name: "Competencia", 
            level: "Medio", 
            description: "Competencia creciente en su segmento principal pero con ventajas competitivas sólidas." 
          },
          { 
            name: "Regulación", 
            level: "Alto", 
            description: "Riesgo elevado de cambios regulatorios que podrían afectar su modelo de negocio." 
          },
          { 
            name: "Tecnología", 
            level: "Bajo", 
            description: "Fuerte inversión en I+D y posición de liderazgo en innovación tecnológica." 
          },
          { 
            name: "Financiero", 
            level: "Bajo", 
            description: "Balance sólido con baja deuda y alta generación de caja." 
          }
        ]
      },
      dataSource: 'Datos de demostración'
    };
    
    return mockData;
  } catch (error) {
    console.error("Error fetching stock valuation:", error);
    throw new Error(`Failed to fetch stock valuation: ${error instanceof Error ? error.message : String(error)}`);
  }
};
