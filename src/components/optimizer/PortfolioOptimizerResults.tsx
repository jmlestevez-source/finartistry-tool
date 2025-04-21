import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  Cell
} from "recharts";
import { OptimizerModel } from "@/lib/api/optimizer/optimizerService";

interface PortfolioOptimizerResultsProps {
  data: {
    tickers: string[];
    currentWeights: number[];
    optimizedWeights: number[];
    rationale: string;
    metrics: {
      current: {
        annualReturn: number;
        volatility: number;
        sharpeRatio: number;
        maxDrawdown: number;
      };
      optimized: {
        annualReturn: number;
        volatility: number;
        sharpeRatio: number;
        maxDrawdown: number;
      };
    };
    newSuggestions: Array<{
      ticker: string;
      weight: number;
      reason: string;
    }>;
  };
  model: OptimizerModel;
}

export const PortfolioOptimizerResults: React.FC<PortfolioOptimizerResultsProps> = ({ 
  data,
  model
}) => {
  const { tickers, currentWeights, optimizedWeights, rationale, metrics, newSuggestions } = data;
  
  // Format percentage for display
  const formatPercent = (value: number) => {
    return `${(value * 100).toFixed(2)}%`;
  };
  
  // Format number for display
  const formatNumber = (value: number, decimals = 2) => {
    return value.toFixed(decimals);
  };
  
  // Prepare data for the weights comparison chart
  const weightsComparisonData = tickers.map((ticker, index) => ({
    name: ticker,
    current: currentWeights[index],
    optimized: optimizedWeights[index],
  }));
  
  // Prepare data for the metrics comparison chart
  const metricsComparisonData = [
    {
      name: "Rendimiento",
      current: metrics.current.annualReturn,
      optimized: metrics.optimized.annualReturn,
    },
    {
      name: "Volatilidad",
      current: metrics.current.volatility,
      optimized: metrics.optimized.volatility,
    },
    {
      name: "Sharpe",
      current: metrics.current.sharpeRatio,
      optimized: metrics.optimized.sharpeRatio,
    },
    {
      name: "Max Drawdown",
      current: Math.abs(metrics.current.maxDrawdown),
      optimized: Math.abs(metrics.optimized.maxDrawdown),
    },
  ];
  
  // Get model name for display
  const getModelName = (model: OptimizerModel) => {
    switch (model) {
      case OptimizerModel.MEAN_VARIANCE:
        return "Media-Varianza";
      case OptimizerModel.MIN_VOLATILITY:
        return "Mínima Volatilidad";
      case OptimizerModel.MAX_SHARPE:
        return "Máximo Sharpe";
      case OptimizerModel.RISK_PARITY:
        return "Paridad de Riesgo";
      case OptimizerModel.EQUAL_WEIGHT:
        return "Pesos Iguales";
      default:
        return "Personalizado";
    }
  };
  
  return (
    <div className="space-y-6 mt-8">
      <h3 className="text-2xl font-bold">Resultados de la Optimización</h3>
      
      {/* Modelo y Explicación */}
      <Card>
        <CardHeader>
          <CardTitle>Modelo: {getModelName(model)}</CardTitle>
          <CardDescription>Estrategia de optimización</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{rationale}</p>
        </CardContent>
      </Card>
      
      {/* Comparación de Métricas */}
      <Card>
        <CardHeader>
          <CardTitle>Comparación de Métricas</CardTitle>
          <CardDescription>Cartera actual vs. optimizada</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Métrica</TableHead>
                    <TableHead>Actual</TableHead>
                    <TableHead>Optimizada</TableHead>
                    <TableHead>Cambio</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>Rendimiento Anual</TableCell>
                    <TableCell>{formatPercent(metrics.current.annualReturn)}</TableCell>
                    <TableCell>{formatPercent(metrics.optimized.annualReturn)}</TableCell>
                    <TableCell className={metrics.optimized.annualReturn > metrics.current.annualReturn ? "text-green-600" : "text-red-600"}>
                      {formatPercent(metrics.optimized.annualReturn - metrics.current.annualReturn)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Volatilidad</TableCell>
                    <TableCell>{formatPercent(metrics.current.volatility)}</TableCell>
                    <TableCell>{formatPercent(metrics.optimized.volatility)}</TableCell>
                    <TableCell className={metrics.optimized.volatility < metrics.current.volatility ? "text-green-600" : "text-red-600"}>
                      {formatPercent(metrics.optimized.volatility - metrics.current.volatility)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Ratio de Sharpe</TableCell>
                    <TableCell>{formatNumber(metrics.current.sharpeRatio)}</TableCell>
                    <TableCell>{formatNumber(metrics.optimized.sharpeRatio)}</TableCell>
                    <TableCell className={metrics.optimized.sharpeRatio > metrics.current.sharpeRatio ? "text-green-600" : "text-red-600"}>
                      {formatNumber(metrics.optimized.sharpeRatio - metrics.current.sharpeRatio)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Máximo Drawdown</TableCell>
                    <TableCell>{formatPercent(metrics.current.maxDrawdown)}</TableCell>
                    <TableCell>{formatPercent(metrics.optimized.maxDrawdown)}</TableCell>
                    <TableCell className={Math.abs(metrics.optimized.maxDrawdown) < Math.abs(metrics.current.maxDrawdown) ? "text-green-600" : "text-red-600"}>
                      {formatPercent(metrics.optimized.maxDrawdown - metrics.current.maxDrawdown)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
            <div className="h-64">
              <ChartContainer 
                config={{ 
                  current: { color: "#3b82f6" },
                  optimized: { color: "#22c55e" }
                }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={metricsComparisonData}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Legend />
                    <Bar dataKey="current" name="Actual" fill="#3b82f6" />
                    <Bar dataKey="optimized" name="Optimizada" fill="#22c55e" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Comparación de Pesos */}
      <Card>
        <CardHeader>
          <CardTitle>Distribución de Activos</CardTitle>
          <CardDescription>Pesos actuales vs. optimizados</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ChartContainer 
              config={{ 
                current: { color: "#3b82f6" },
                optimized: { color: "#22c55e" }
              }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={weightsComparisonData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis tickFormatter={(value) => `${(value * 100).toFixed(0)}%`} />
                  <ChartTooltip 
                    formatter={(value: number) => `${(value * 100).toFixed(2)}%`}
                    content={<ChartTooltipContent />}
                  />
                  <Legend />
                  <Bar dataKey="current" name="Actual" fill="#3b82f6" />
                  <Bar dataKey="optimized" name="Optimizada" fill="#22c55e" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
          
          <div className="mt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ticker</TableHead>
                  <TableHead>Peso Actual</TableHead>
                  <TableHead>Peso Optimizado</TableHead>
                  <TableHead>Cambio</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tickers.map((ticker, index) => (
                  <TableRow key={ticker}>
                    <TableCell>{ticker}</TableCell>
                    <TableCell>{formatPercent(currentWeights[index])}</TableCell>
                    <TableCell>{formatPercent(optimizedWeights[index])}</TableCell>
                    <TableCell 
                      className={
                        Math.abs(optimizedWeights[index] - currentWeights[index]) < 0.01 
                          ? "" 
                          : optimizedWeights[index] > currentWeights[index] 
                            ? "text-green-600" 
                            : "text-red-600"
                      }
                    >
                      {formatPercent(optimizedWeights[index] - currentWeights[index])}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
      {/* Nuevas Sugerencias */}
      {newSuggestions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Activos Recomendados</CardTitle>
            <CardDescription>Nuevas inversiones para mejorar la cartera</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ticker</TableHead>
                  <TableHead>Peso Sugerido</TableHead>
                  <TableHead>Razón</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {newSuggestions.map((suggestion) => (
                  <TableRow key={suggestion.ticker}>
                    <TableCell>{suggestion.ticker}</TableCell>
                    <TableCell>{formatPercent(suggestion.weight)}</TableCell>
                    <TableCell>{suggestion.reason}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
