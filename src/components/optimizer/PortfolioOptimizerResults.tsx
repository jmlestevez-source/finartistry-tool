
import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ChartContainer, 
  ChartTooltip,
  ChartTooltipContent
} from "@/components/ui/chart";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  Cell,
  PieChart,
  Pie
} from "recharts";
import { OptimizerModel } from "@/lib/api/optimizer/optimizerService";
import { TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface PortfolioOptimizerResultsProps {
  data: {
    currentPortfolio: {
      expectedReturn: number;
      volatility: number;
      sharpeRatio: number;
    };
    optimizedPortfolio: {
      expectedReturn: number;
      volatility: number;
      sharpeRatio: number;
    };
    recommendations: Array<{
      ticker: string;
      currentWeight: number;
      recommendedWeight: number;
      change: number;
      reason: string;
    }>;
    newSuggestions: Array<{
      ticker: string;
      weight: number;
      reason: string;
    }>;
    riskAnalysis: string;
    optimizationModel: OptimizerModel;
  };
}

// Function to get model name in Spanish
const getModelName = (model: OptimizerModel): string => {
  switch (model) {
    case OptimizerModel.MEAN_VARIANCE:
      return "Media-Varianza (Markowitz)";
    case OptimizerModel.MINIMUM_VOLATILITY:
      return "Mínima Volatilidad";
    case OptimizerModel.MAXIMUM_SHARPE:
      return "Máximo Sharpe";
    case OptimizerModel.RISK_PARITY:
      return "Paridad de Riesgo";
    case OptimizerModel.EQUAL_WEIGHT:
      return "Pesos Iguales";
    default:
      return "Desconocido";
  }
};

// Format percentage for display
const formatPercent = (value: number): string => {
  return `${(value * 100).toFixed(2)}%`;
};

// Colors for the charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export const PortfolioOptimizerResults: React.FC<PortfolioOptimizerResultsProps> = ({ data }) => {
  const { 
    currentPortfolio, 
    optimizedPortfolio, 
    recommendations, 
    newSuggestions,
    riskAnalysis,
    optimizationModel 
  } = data;
  
  // Calculate performance differences
  const returnDiff = optimizedPortfolio.expectedReturn - currentPortfolio.expectedReturn;
  const volatilityDiff = optimizedPortfolio.volatility - currentPortfolio.volatility;
  const sharpeDiff = optimizedPortfolio.sharpeRatio - currentPortfolio.sharpeRatio;
  
  // Prepare data for comparison chart
  const comparisonData = [
    {
      name: "Rendimiento esperado",
      current: currentPortfolio.expectedReturn,
      optimized: optimizedPortfolio.expectedReturn
    },
    {
      name: "Volatilidad",
      current: currentPortfolio.volatility,
      optimized: optimizedPortfolio.volatility
    },
    {
      name: "Ratio Sharpe",
      current: currentPortfolio.sharpeRatio,
      optimized: optimizedPortfolio.sharpeRatio
    }
  ];
  
  // Prepare weight comparison data
  const weightComparisonData = recommendations.map(rec => ({
    ticker: rec.ticker,
    current: rec.currentWeight,
    optimized: rec.recommendedWeight
  }));
  
  // Prepare data for weight changes chart (as percentage changes)
  const weightChangesData = recommendations
    .map(rec => ({
      ticker: rec.ticker,
      change: rec.change,
      absChange: Math.abs(rec.change)
    }))
    .sort((a, b) => b.absChange - a.absChange); // Sort by absolute change
  
  return (
    <div className="space-y-6 mt-8">
      {/* Summary card */}
      <Card className="overflow-hidden">
        <CardHeader className="bg-primary/10">
          <CardTitle>Optimización de Cartera: {getModelName(optimizationModel)}</CardTitle>
          <CardDescription>
            Recomendaciones basadas en datos históricos para optimizar su cartera
          </CardDescription>
        </CardHeader>
        
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className={`p-4 rounded-lg ${returnDiff >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
              <div className="flex items-center mb-2">
                <span className="text-sm font-medium">Rendimiento esperado</span>
                {returnDiff >= 0 ? (
                  <TrendingUp className="ml-auto h-4 w-4 text-green-500" />
                ) : (
                  <TrendingDown className="ml-auto h-4 w-4 text-red-500" />
                )}
              </div>
              <div className="flex items-baseline">
                <span className="text-2xl font-bold">{formatPercent(optimizedPortfolio.expectedReturn)}</span>
                <span className={`ml-2 text-sm ${returnDiff >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {returnDiff >= 0 ? '+' : ''}{formatPercent(returnDiff)}
                </span>
              </div>
            </div>
            
            <div className={`p-4 rounded-lg ${volatilityDiff <= 0 ? 'bg-green-50' : 'bg-amber-50'}`}>
              <div className="flex items-center mb-2">
                <span className="text-sm font-medium">Volatilidad</span>
                {volatilityDiff <= 0 ? (
                  <TrendingDown className="ml-auto h-4 w-4 text-green-500" />
                ) : (
                  <TrendingUp className="ml-auto h-4 w-4 text-amber-500" />
                )}
              </div>
              <div className="flex items-baseline">
                <span className="text-2xl font-bold">{formatPercent(optimizedPortfolio.volatility)}</span>
                <span className={`ml-2 text-sm ${volatilityDiff <= 0 ? 'text-green-600' : 'text-amber-600'}`}>
                  {volatilityDiff <= 0 ? '' : '+'}{formatPercent(volatilityDiff)}
                </span>
              </div>
            </div>
            
            <div className={`p-4 rounded-lg ${sharpeDiff >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
              <div className="flex items-center mb-2">
                <span className="text-sm font-medium">Ratio Sharpe</span>
                {sharpeDiff >= 0 ? (
                  <TrendingUp className="ml-auto h-4 w-4 text-green-500" />
                ) : (
                  <TrendingDown className="ml-auto h-4 w-4 text-red-500" />
                )}
              </div>
              <div className="flex items-baseline">
                <span className="text-2xl font-bold">{optimizedPortfolio.sharpeRatio.toFixed(2)}</span>
                <span className={`ml-2 text-sm ${sharpeDiff >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {sharpeDiff >= 0 ? '+' : ''}{sharpeDiff.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
          
          {/* Risk analysis alert */}
          <Alert className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{riskAnalysis}</AlertDescription>
          </Alert>
          
          <Tabs defaultValue="recommendations">
            <TabsList className="grid grid-cols-3 mb-4">
              <TabsTrigger value="recommendations">Recomendaciones</TabsTrigger>
              <TabsTrigger value="weights">Comparativa</TabsTrigger>
              <TabsTrigger value="metrics">Métricas</TabsTrigger>
            </TabsList>
            
            {/* Recommendations Tab */}
            <TabsContent value="recommendations" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Ajustes Recomendados</CardTitle>
                  <CardDescription>Cambios sugeridos en los pesos de la cartera</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recommendations.map((rec, index) => (
                      <div key={index} className="border-b pb-3">
                        <div className="flex justify-between mb-1">
                          <span className="font-medium">{rec.ticker}</span>
                          <div className="flex items-center">
                            <span className={`text-sm ${rec.change > 0.001 
                              ? 'text-green-600' 
                              : rec.change < -0.001 
                                ? 'text-red-600' 
                                : 'text-gray-600'}`}>
                              {rec.change > 0 ? '+' : ''}{formatPercent(rec.change)}
                            </span>
                            {rec.change > 0.001 ? (
                              <TrendingUp className="ml-1 h-4 w-4 text-green-500" />
                            ) : rec.change < -0.001 ? (
                              <TrendingDown className="ml-1 h-4 w-4 text-red-500" />
                            ) : null}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 text-sm text-muted-foreground">
                          <div>Actual: {formatPercent(rec.currentWeight)}</div>
                          <div>Recomendado: {formatPercent(rec.recommendedWeight)}</div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                          <div className="flex h-2 rounded-full">
                            <div 
                              className="bg-blue-500 h-2 rounded-l-full" 
                              style={{ width: `${Math.min(rec.currentWeight, rec.recommendedWeight) * 100}%` }}
                            ></div>
                            {rec.change > 0 && (
                              <div 
                                className="bg-green-500 h-2" 
                                style={{ width: `${rec.change * 100}%` }}
                              ></div>
                            )}
                            {rec.change < 0 && (
                              <div 
                                className="bg-red-500 h-2" 
                                style={{ width: `${-rec.change * 100}%` }}
                              ></div>
                            )}
                          </div>
                        </div>
                        <p className="text-sm mt-2">{rec.reason}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              
              {/* New suggestions card */}
              {newSuggestions && newSuggestions.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Nuevas sugerencias</CardTitle>
                    <CardDescription>Activos para considerar añadir a su cartera</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {newSuggestions.map((suggestion, index) => (
                        <div key={index} className="border-b pb-3">
                          <div className="flex justify-between mb-1">
                            <span className="font-medium">{suggestion.ticker}</span>
                            <span className="text-sm text-green-600">
                              Peso sugerido: {formatPercent(suggestion.weight)}
                            </span>
                          </div>
                          <p className="text-sm">{suggestion.reason}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
            
            {/* Weights Comparison Tab */}
            <TabsContent value="weights" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Comparación de Pesos</CardTitle>
                    <CardDescription>Cartera actual vs. optimizada</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ChartContainer 
                        config={{ 
                          current: { color: "#3b82f6" },
                          optimized: { color: "#22c55e" }
                        }}
                      >
                        <BarChart
                          data={weightComparisonData}
                          layout="vertical"
                          margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" tickFormatter={(value) => `${(value * 100).toFixed(0)}%`} />
                          <YAxis type="category" dataKey="ticker" width={50} />
                          <ChartTooltip 
                            content={<ChartTooltipContent />}
                            formatter={(value: any) => `${(value * 100).toFixed(2)}%`}
                          />
                          <Legend />
                          <Bar dataKey="current" name="Actual" fill="#3b82f6" />
                          <Bar dataKey="optimized" name="Optimizado" fill="#22c55e" />
                        </BarChart>
                      </ChartContainer>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Cambios Recomendados</CardTitle>
                    <CardDescription>Aumentar/reducir posiciones</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ChartContainer 
                        config={{ 
                          change: { color: "#3b82f6" }
                        }}
                      >
                        <BarChart
                          data={weightChangesData}
                          margin={{ top: 5, right: 30, left: 40, bottom: 20 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="ticker" />
                          <YAxis tickFormatter={(value) => `${(value * 100).toFixed(0)}%`} />
                          <ChartTooltip 
                            content={<ChartTooltipContent />}
                            formatter={(value: any) => `${(value * 100).toFixed(2)}%`}
                          />
                          <Bar dataKey="change" name="Cambio">
                            {weightChangesData.map((entry, index) => (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={entry.change >= 0 ? '#22c55e' : '#ef4444'} 
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ChartContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            {/* Metrics Comparison Tab */}
            <TabsContent value="metrics" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Comparación de Métricas</CardTitle>
                    <CardDescription>Cartera actual vs. optimizada</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ChartContainer 
                        config={{ 
                          current: { color: "#3b82f6" },
                          optimized: { color: "#22c55e" }
                        }}
                      >
                        <BarChart
                          data={comparisonData}
                          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis tickFormatter={(value) => 
                            value < 0.01 ? value.toFixed(3) : 
                            value < 0.1 ? value.toFixed(2) : 
                            value.toFixed(2)
                          } />
                          <ChartTooltip 
                            content={<ChartTooltipContent />} 
                            formatter={(value: any, name: string) => [
                              name === "current" || name === "optimized" 
                                ? (name === "name" ? value : value < 1 ? `${(value * 100).toFixed(2)}%` : value.toFixed(2))
                                : value,
                              name === "current" ? "Actual" : "Optimizado"
                            ]}
                          />
                          <Legend />
                          <Bar dataKey="current" name="Actual" fill="#3b82f6" />
                          <Bar dataKey="optimized" name="Optimizado" fill="#22c55e" />
                        </BarChart>
                      </ChartContainer>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Distribución Optimizada</CardTitle>
                    <CardDescription>Pesos recomendados por activo</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ChartContainer config={{}}>
                        <PieChart>
                          <Pie
                            data={recommendations.map((rec) => ({
                              name: rec.ticker,
                              value: rec.recommendedWeight
                            }))}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            nameKey="name"
                            label={({ name, percent }: { name: string, percent: number }) => 
                              `${name}: ${(percent * 100).toFixed(0)}%`
                            }
                          >
                            {recommendations.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <ChartTooltip formatter={(value: any) => `${(value * 100).toFixed(2)}%`} />
                        </PieChart>
                      </ChartContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
