
// Stock valuation model functions

export const calculateValuationModels = (companyInfo: any, ratios: any, earnings: any, overview: any, growthRates: any) => {
  const models = [];
  const currentPrice = companyInfo.currentPrice;
  
  // 1. Modelo DCF simplificado
  try {
    const eps = parseFloat(overview?.EPS || '0');
    const growthRate = growthRates.earnings.fiveYear || growthRates.earnings.projected || 0.05;
    const discountRate = 0.09; // Tasa de descuento de 9%
    const terminalMultiple = 15; // P/E terminal de 15
    const projectionYears = 5;
    
    let dcfValue = 0;
    let projectedEPS = eps;
    
    // Flujos de caja descontados para los años de proyección
    for (let year = 1; year <= projectionYears; year++) {
      projectedEPS *= (1 + growthRate);
      dcfValue += projectedEPS / Math.pow(1 + discountRate, year);
    }
    
    // Valor terminal
    const terminalValue = (projectedEPS * terminalMultiple) / Math.pow(1 + discountRate, projectionYears);
    dcfValue += terminalValue;
    
    models.push({
      name: "DCF",
      fairValue: dcfValue,
      upside: dcfValue / currentPrice - 1,
      description: "Flujos de caja descontados"
    });
  } catch (error) {
    console.error("Error calculating DCF model:", error);
  }
  
  // 2. Modelo P/E
  try {
    const eps = parseFloat(overview?.EPS || '0');
    const sectorPE = parseFloat(overview?.PERatio || '0') * 1.1; // Usamos el P/E actual de la empresa con un pequeño premio
    
    if (eps > 0 && sectorPE > 0) {
      const peValue = eps * sectorPE;
      
      models.push({
        name: "P/E",
        fairValue: peValue,
        upside: peValue / currentPrice - 1,
        description: "Múltiplo de beneficios"
      });
    }
  } catch (error) {
    console.error("Error calculating P/E model:", error);
  }
  
  // 3. Modelo P/B
  try {
    const bookValuePerShare = parseFloat(overview?.BookValue || '0');
    const pb = ratios.priceToBookRatioTTM || 2;
    
    if (bookValuePerShare > 0) {
      const pbValue = bookValuePerShare * pb;
      
      models.push({
        name: "P/B",
        fairValue: pbValue,
        upside: pbValue / currentPrice - 1,
        description: "Múltiplo de valor contable"
      });
    }
  } catch (error) {
    console.error("Error calculating P/B model:", error);
  }
  
  // 4. Modelo EV/EBITDA
  try {
    const evToEbitda = ratios.enterpriseValueMultipleTTM || 12;
    const sharesOutstanding = parseFloat(overview?.SharesOutstanding || '1');
    const ebitdaPerShare = (ratios.operatingIncomePerShareTTM || 0) * 1.2; // Aproximación de EBITDA
    
    if (ebitdaPerShare > 0) {
      const evEbitdaValue = ebitdaPerShare * evToEbitda;
      
      models.push({
        name: "EV/EBITDA",
        fairValue: evEbitdaValue,
        upside: evEbitdaValue / currentPrice - 1,
        description: "Múltiplo de EBITDA"
      });
    }
  } catch (error) {
    console.error("Error calculating EV/EBITDA model:", error);
  }
  
  // 5. Modelo de Descuento de Dividendos (si aplica)
  try {
    const dividendYield = parseFloat(overview?.DividendYield || '0');
    const dividendPerShare = parseFloat(overview?.DividendPerShare || '0');
    const dividendGrowthRate = growthRates.earnings.projected * 0.7 || 0.03; // 70% del crecimiento de beneficios
    
    if (dividendPerShare > 0) {
      // Modelo de Gordon
      const requiredReturn = 0.08; // 8% rendimiento requerido
      const ddmValue = dividendPerShare * (1 + dividendGrowthRate) / (requiredReturn - dividendGrowthRate);
      
      models.push({
        name: "DDM",
        fairValue: ddmValue,
        upside: ddmValue / currentPrice - 1,
        description: "Modelo de descuento de dividendos"
      });
    }
  } catch (error) {
    console.error("Error calculating DDM model:", error);
  }
  
  return models;
};

export const findIndustryAverages = (industryData: any, industry: string): any => {
  if (!industryData || !Array.isArray(industryData)) return {};
  
  const industryRatios = industryData.find((item: any) => 
    item.industry && item.industry.toLowerCase() === industry.toLowerCase()
  );
  
  return industryRatios || {};
};
