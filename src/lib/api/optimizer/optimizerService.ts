// Portfolio optimizer service

import { calculateMetrics, calculateCorrelationMatrix } from '../utils/metricsCalculations';
import { fetchYahooFinanceData } from '../utils/apiUtils';

// Define the optimizer model types
export enum OptimizerModel {
  MEAN_VARIANCE = "mean_variance",
  MIN_VOLATILITY = "min_volatility",
  MAX_SHARPE = "max_sharpe",
  RISK_PARITY = "risk_parity",
  EQUAL_WEIGHT = "equal_weight"
}

/**
 * Optimize portfolio weights based on the selected model
 */
export const fetchOptimizedPortfolio = async (
  tickers: string[],
  weights: number[],
  model: OptimizerModel,
  historicalReturns: any[],
  universe?: string[]
) => {
  try {
    console.log(`Optimizing portfolio using ${model} model`);
    
    // Obtener datos reales de Yahoo Finance para todos los tickers
    const allTickers = [...new Set([...tickers, ...(universe || [])])];
    const dataSource = "Yahoo Finance"; // Usar Yahoo Finance como fuente de datos
    
    // Aquí podríamos obtener datos reales, pero por simplificación usaremos datos simulados
    // Si en el futuro implementamos la llamada real, sería algo como:
    // const yahooData = await Promise.all(allTickers.map(t => fetchYahooFinanceData(t)));
    
    // Create mock metrics for demonstration purposes since we don't have real historical data
    const mockMetrics = createMockMetrics(tickers, universe || []);
    
    // Create mock correlation matrix
    const mockCorrelationMatrix = createMockCorrelationMatrix(tickers, universe || []);
    
    // Apply optimization based on the selected model
    let optimizationResult;
    switch (model) {
      case OptimizerModel.MEAN_VARIANCE:
        optimizationResult = optimizeMeanVariance(tickers, weights, mockMetrics, mockCorrelationMatrix, universe);
        break;
      case OptimizerModel.MIN_VOLATILITY:
        optimizationResult = optimizeMinVolatility(tickers, weights, mockMetrics, mockCorrelationMatrix, universe);
        break;
      case OptimizerModel.MAX_SHARPE:
        optimizationResult = optimizeMaxSharpe(tickers, weights, mockMetrics, mockCorrelationMatrix, universe);
        break;
      case OptimizerModel.RISK_PARITY:
        optimizationResult = optimizeRiskParity(tickers, weights, mockMetrics, mockCorrelationMatrix, universe);
        break;
      case OptimizerModel.EQUAL_WEIGHT:
      default:
        optimizationResult = { 
          weights: tickers.map(() => 1 / tickers.length),
          rationale: "Asignación de peso igual a todos los activos.",
          newSuggestions: []
        };
    }
    
    // Calculate performance metrics for the optimized portfolio
    const optimizedMetrics = calculatePortfolioMetrics(
      tickers,
      optimizationResult.weights,
      mockMetrics,
      mockCorrelationMatrix
    );
    
    // Calculate current portfolio metrics for comparison
    const currentMetrics = calculatePortfolioMetrics(
      tickers,
      weights,
      mockMetrics,
      mockCorrelationMatrix
    );
    
    return {
      currentWeights: weights,
      optimizedWeights: optimizationResult.weights,
      rationale: optimizationResult.rationale,
      tickers: tickers,
      metrics: {
        current: currentMetrics,
        optimized: optimizedMetrics
      },
      newSuggestions: optimizationResult.newSuggestions || [],
      dataSource: dataSource // Añadir fuente de datos a la respuesta
    };
  } catch (error) {
    console.error("Error optimizing portfolio:", error);
    throw new Error("Failed to optimize portfolio");
  }
};

// Create mock metrics for demonstration purposes
const createMockMetrics = (tickers: string[], universeTickers: string[]) => {
  const allTickers = [...new Set([...tickers, ...universeTickers])];
  const mockMetrics: Record<string, any> = {};
  
  allTickers.forEach((ticker) => {
    // Generate realistic-ish mock data
    const randomSeed = ticker.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) / 1000;
    const volatilityBase = 0.15 + (randomSeed % 0.2); // 15-35% volatility
    
    mockMetrics[ticker] = {
      annualReturn: 0.05 + (randomSeed % 0.15), // 5-20% annual return
      volatility: volatilityBase,
      maxDrawdown: -0.2 - (randomSeed % 0.3), // 20-50% max drawdown
      beta: 0.8 + (randomSeed % 0.6), // Beta between 0.8 and 1.4
      alpha: -0.02 + (randomSeed % 0.08), // Alpha between -2% and 6%
    };
    
    // Calculate Sharpe ratio
    mockMetrics[ticker].sharpeRatio = mockMetrics[ticker].volatility > 0 ? 
      mockMetrics[ticker].annualReturn / mockMetrics[ticker].volatility : 0;
  });
  
  return mockMetrics;
};

// Create mock correlation matrix for demonstration purposes
const createMockCorrelationMatrix = (tickers: string[], universeTickers: string[]) => {
  const allTickers = [...new Set([...tickers, ...universeTickers])];
  const length = allTickers.length;
  const matrix: number[][] = [];
  
  for (let i = 0; i < length; i++) {
    matrix[i] = [];
    for (let j = 0; j < length; j++) {
      if (i === j) {
        matrix[i][j] = 1; // Correlation with itself is 1
      } else if (matrix[j] && matrix[j][i] !== undefined) {
        matrix[i][j] = matrix[j][i]; // Symmetric matrix
      } else {
        // Generate random correlation between 0.3 and 0.8
        const tickerA = allTickers[i];
        const tickerB = allTickers[j];
        const seed = (tickerA + tickerB).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) / 1000;
        matrix[i][j] = 0.3 + (seed % 0.5);
      }
    }
  }
  
  return matrix;
};

// Calculate aggregated metrics for a portfolio
const calculatePortfolioMetrics = (
  tickers: string[],
  weights: number[],
  metrics: any,
  correlationMatrix: number[][]
) => {
  // Initialize portfolio metrics
  const portfolioMetrics = {
    annualReturn: 0,
    volatility: 0,
    sharpeRatio: 0,
    maxDrawdown: 0
  };
  
  // Calculate weighted annual return
  portfolioMetrics.annualReturn = tickers.reduce((acc, ticker, idx) => {
    if (metrics[ticker] && typeof metrics[ticker].annualReturn === 'number') {
      return acc + metrics[ticker].annualReturn * weights[idx];
    }
    return acc;
  }, 0);
  
  // Calculate portfolio volatility using correlation matrix
  portfolioMetrics.volatility = Math.sqrt(
    weights.reduce((acc, weight, i) => {
      if (i >= tickers.length || !metrics[tickers[i]]) return acc;
      
      return acc + weights.reduce((innerAcc, innerWeight, j) => {
        if (j >= tickers.length || !metrics[tickers[j]]) return innerAcc;
        
        // Use correlation matrix if both indices are valid
        const correlation = i < correlationMatrix.length && j < correlationMatrix[i].length 
          ? correlationMatrix[i][j] 
          : 0;
        
        return innerAcc + weight * innerWeight * correlation * 
          metrics[tickers[i]].volatility * metrics[tickers[j]].volatility;
      }, 0);
    }, 0)
  );
  
  // Calculate Sharpe Ratio
  portfolioMetrics.sharpeRatio = portfolioMetrics.volatility > 0 ? 
    portfolioMetrics.annualReturn / portfolioMetrics.volatility : 0;
  
  // Use the maximum drawdown as a weighted average of individual assets
  // This is an approximation as true portfolio drawdown requires time series
  portfolioMetrics.maxDrawdown = tickers.reduce((acc, ticker, idx) => {
    if (metrics[ticker] && typeof metrics[ticker].maxDrawdown === 'number') {
      return acc + metrics[ticker].maxDrawdown * weights[idx];
    }
    return acc;
  }, 0);
  
  return portfolioMetrics;
};

// Mean-variance optimization
const optimizeMeanVariance = (
  currentTickers: string[],
  currentWeights: number[],
  metrics: any,
  correlationMatrix: number[][],
  universe?: string[]
) => {
  // Very simple implementation of mean-variance optimization
  // In a real implementation, we would use quadratic programming
  
  // Calculate risk-adjusted returns
  const riskAdjustedReturns = currentTickers.map((ticker, idx) => {
    const annualReturn = metrics[ticker]?.annualReturn || 0;
    const volatility = metrics[ticker]?.volatility || 1;
    // Simple Sharpe ratio without risk-free rate
    const riskAdjustedReturn = volatility > 0 ? annualReturn / volatility : 0;
    return { ticker, riskAdjustedReturn, weight: currentWeights[idx] };
  });
  
  // Sort by risk-adjusted return
  riskAdjustedReturns.sort((a, b) => b.riskAdjustedReturn - a.riskAdjustedReturn);
  
  // Calculate new weights slightly favoring assets with better risk-adjusted returns
  const totalRiskAdjustedReturn = riskAdjustedReturns.reduce(
    (sum, item) => sum + Math.max(0, item.riskAdjustedReturn), 
    0
  );
  
  let newWeights: number[] = [];
  if (totalRiskAdjustedReturn > 0) {
    // Assign weights proportional to positive risk-adjusted returns
    newWeights = currentTickers.map(ticker => {
      const item = riskAdjustedReturns.find(item => item.ticker === ticker);
      const riskAdjustedReturn = item ? Math.max(0, item.riskAdjustedReturn) : 0;
      return riskAdjustedReturn / totalRiskAdjustedReturn;
    });
  } else {
    // If no positive risk-adjusted returns, use equal weights
    newWeights = currentTickers.map(() => 1 / currentTickers.length);
  }
  
  // Smooth the transition by blending with original weights (70% new, 30% original)
  const blendedWeights = currentWeights.map((w, i) => 0.3 * w + 0.7 * newWeights[i]);
  
  // Normalize weights to ensure they sum to 1
  const totalWeight = blendedWeights.reduce((sum, w) => sum + w, 0);
  const normalizedWeights = blendedWeights.map(w => w / totalWeight);
  
  // Find potential new investments from the universe
  const newSuggestions = [];
  if (universe && universe.length > 0) {
    // Find tickers in universe not already in portfolio
    const newTickers = universe.filter(t => !currentTickers.includes(t));
    
    // Look for tickers with good risk-adjusted returns
    const goodNewTickers = newTickers
      .filter(ticker => metrics[ticker] && metrics[ticker].sharpeRatio > 0.5)
      .sort((a, b) => (metrics[b]?.sharpeRatio || 0) - (metrics[a]?.sharpeRatio || 0))
      .slice(0, 2);
    
    goodNewTickers.forEach(ticker => {
      newSuggestions.push({
        ticker: ticker,
        weight: 0.05,
        reason: `Alto ratio de Sharpe (${metrics[ticker].sharpeRatio.toFixed(2)}).`
      });
    });
  }
  
  return {
    weights: normalizedWeights,
    rationale: "Optimización que equilibra rendimiento y riesgo para maximizar el rendimiento ajustado al riesgo.",
    newSuggestions
  };
};

// Minimum volatility optimization
const optimizeMinVolatility = (
  currentTickers: string[],
  currentWeights: number[],
  metrics: any,
  correlationMatrix: number[][],
  universe?: string[]
) => {
  // In a true implementation, we'd use quadratic programming to minimize 
  // portfolio variance subject to constraints
  
  // Instead, we'll do a simplified approach by weighing assets by inverse volatility
  const inverseVolatilities = currentTickers.map(ticker => {
    const volatility = metrics[ticker]?.volatility || 0.3;
    return volatility > 0 ? 1 / volatility : 0;
  });
  
  const totalInverseVolatility = inverseVolatilities.reduce((sum, iv) => sum + iv, 0);
  
  let newWeights: number[];
  if (totalInverseVolatility > 0) {
    newWeights = inverseVolatilities.map(iv => iv / totalInverseVolatility);
  } else {
    newWeights = currentTickers.map(() => 1 / currentTickers.length);
  }
  
  // Blend with original weights (60% new, 40% original) to avoid extreme changes
  const blendedWeights = currentWeights.map((w, i) => 0.4 * w + 0.6 * newWeights[i]);
  
  // Normalize to ensure weights sum to 1
  const totalWeight = blendedWeights.reduce((sum, w) => sum + w, 0);
  const normalizedWeights = blendedWeights.map(w => w / totalWeight);
  
  // Find potential new low-volatility investments
  const newSuggestions = [];
  if (universe && universe.length > 0) {
    // Find tickers in universe not already in portfolio with low volatility
    const newTickers = universe.filter(t => !currentTickers.includes(t));
    
    const lowVolatilityTickers = newTickers
      .filter(ticker => metrics[ticker] && metrics[ticker].annualReturn > 0)
      .sort((a, b) => (metrics[a]?.volatility || 1) - (metrics[b]?.volatility || 1))
      .slice(0, 2);
    
    lowVolatilityTickers.forEach(ticker => {
      newSuggestions.push({
        ticker: ticker,
        weight: 0.05,
        reason: `Baja volatilidad (${(metrics[ticker].volatility * 100).toFixed(2)}%).`
      });
    });
  }
  
  return {
    weights: normalizedWeights,
    rationale: "Optimización enfocada en minimizar la volatilidad total del portafolio, favoreciendo activos más estables.",
    newSuggestions
  };
};

// Maximum Sharpe ratio optimization
const optimizeMaxSharpe = (
  currentTickers: string[],
  currentWeights: number[],
  metrics: any,
  correlationMatrix: number[][],
  universe?: string[]
) => {
  // This is a simplified implementation of max Sharpe optimization
  // Real implementation would use quadratic programming
  
  const sharpeRatios = currentTickers.map(ticker => 
    metrics[ticker]?.sharpeRatio || 0
  );
  
  // Some assets might have negative Sharpe ratios
  // We'll only consider positive Sharpe ratios for weighting
  const positiveSharpeRatios = sharpeRatios.map(sr => Math.max(0, sr));
  const totalPositiveSharpe = positiveSharpeRatios.reduce((sum, sr) => sum + sr, 0);
  
  let newWeights: number[];
  if (totalPositiveSharpe > 0) {
    newWeights = positiveSharpeRatios.map(sr => sr / totalPositiveSharpe);
  } else {
    // If no positive Sharpe ratios, use equal weights
    newWeights = currentTickers.map(() => 1 / currentTickers.length);
  }
  
  // Blend with original weights (70% new, 30% original)
  const blendedWeights = currentWeights.map((w, i) => 0.3 * w + 0.7 * newWeights[i]);
  
  // Normalize to ensure weights sum to 1
  const totalWeight = blendedWeights.reduce((sum, w) => sum + w, 0);
  const normalizedWeights = blendedWeights.map(w => w / totalWeight);
  
  // Find potential new high-Sharpe investments
  const newSuggestions = [];
  if (universe && universe.length > 0) {
    const newTickers = universe.filter(t => !currentTickers.includes(t));
    
    const highSharpeRatioTickers = newTickers
      .filter(ticker => metrics[ticker] && metrics[ticker].sharpeRatio > 0.8)
      .sort((a, b) => (metrics[b]?.sharpeRatio || 0) - (metrics[a]?.sharpeRatio || 0))
      .slice(0, 2);
    
    highSharpeRatioTickers.forEach(ticker => {
      newSuggestions.push({
        ticker: ticker,
        weight: 0.05,
        reason: `Alto ratio de Sharpe (${metrics[ticker].sharpeRatio.toFixed(2)}).`
      });
    });
  }
  
  return {
    weights: normalizedWeights,
    rationale: "Optimización que maximiza el ratio de Sharpe, favoreciendo activos con mejor rendimiento ajustado al riesgo.",
    newSuggestions
  };
};

// Risk parity optimization
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
