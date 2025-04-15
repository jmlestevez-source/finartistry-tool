
// Fix for allTickers in risk parity function
const optimizeRiskParity = (
  currentTickers: string[],
  currentWeights: number[],
  metrics: any,
  correlationMatrix: number[][],
  universe?: string[]
) => {
  // In risk parity, we want each asset to contribute equally to portfolio risk
  const volatilities = currentTickers.map(ticker => metrics[ticker]?.volatility || 0.3);
  
  // Calculate inverse squared volatility weights (approximation of risk parity)
  const inverseSquaredVol = volatilities.map(vol => vol > 0 ? 1 / (vol * vol) : 0);
  const totalInverseSquaredVol = inverseSquaredVol.reduce((sum, isv) => sum + isv, 0);
  const riskParityWeights = totalInverseSquaredVol > 0 
    ? inverseSquaredVol.map(isv => isv / totalInverseSquaredVol) 
    : currentTickers.map(() => 1 / currentTickers.length);
  
  // Blend with original weights (60% new, 40% original) to avoid extreme changes
  const blendedWeights = currentWeights.map((w, i) => 0.4 * w + 0.6 * riskParityWeights[i]);
  
  // Normalize to ensure weights sum to 1
  const totalWeight = blendedWeights.reduce((sum, w) => sum + w, 0);
  const normalizedWeights = blendedWeights.map(w => w / totalWeight);
  
  // Find new potential diversifying investments
  const newSuggestions = [];
  if (universe && universe.length > 0) {
    // Find tickers in universe not already in portfolio
    const newTickers = universe.filter(t => !currentTickers.includes(t));
    
    // Define allTickers here as the combination of current tickers and universe
    const allTickers = [...currentTickers, ...newTickers];
    
    // Calculate average correlation of each new ticker with current portfolio
    const diversifyingTickers = newTickers
      .map(ticker => {
        // Calculate average absolute correlation with existing portfolio
        let totalCorrelation = 0;
        let correlationCount = 0;
        
        currentTickers.forEach((portfolioTicker, idx) => {
          // Find this ticker's index in the correlation matrix
          const newTickerIdx = allTickers.indexOf(ticker);
          const portfolioTickerIdx = idx;
          
          if (newTickerIdx >= 0 && 
              newTickerIdx < correlationMatrix.length && 
              portfolioTickerIdx < correlationMatrix[newTickerIdx].length) {
            totalCorrelation += Math.abs(correlationMatrix[newTickerIdx][portfolioTickerIdx]);
            correlationCount++;
          }
        });
        
        const avgCorrelation = correlationCount > 0 ? totalCorrelation / correlationCount : 0.5;
        
        return {
          ticker,
          avgCorrelation,
          annualReturn: metrics[ticker]?.annualReturn || 0,
          volatility: metrics[ticker]?.volatility || 0.3
        };
      })
      .filter(item => item.annualReturn > 0) // Only consider positive-return assets
      .sort((a, b) => a.avgCorrelation - b.avgCorrelation); // Sort by lowest correlation
    
    // Suggest up to 2 diversifying tickers
    const suggestionsCount = Math.min(2, diversifyingTickers.length);
    for (let i = 0; i < suggestionsCount; i++) {
      const suggestion = diversifyingTickers[i];
      newSuggestions.push({
        ticker: suggestion.ticker,
        weight: 0.05,
        reason: `Baja correlación (${(suggestion.avgCorrelation).toFixed(2)}) con la cartera actual.`
      });
    }
  }
  
  return {
    weights: normalizedWeights,
    rationale: "Optimización enfocada en que cada activo contribuya equitativamente al riesgo total del portafolio.",
    newSuggestions
  };
};
