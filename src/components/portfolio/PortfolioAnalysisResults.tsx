
import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent
} from "@/components/ui/chart";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  BarChart,
  Bar
} from "recharts";

interface PortfolioMetrics {
  annualReturn: number;
  volatility: number;
  sharpeRatio: number;
  maxDrawdown: number;
  alpha: number;
  beta: number;
}

interface PortfolioAnalysisResultsProps {
  data: {
    performanceChart: any[];
    correlationMatrix: any[];
    metrics: PortfolioMetrics;
    stockMetrics: Record<string, PortfolioMetrics>;
  };
}

export const PortfolioAnalysisResults: React.FC<PortfolioAnalysisResultsProps> = ({ data }) => {
  const { performanceChart, correlationMatrix, metrics, stockMetrics } = data;
  
  // Format percentage for display
  const formatPercent = (value: number) => {
    return `${(value * 100).toFixed(2)}%`;
  };
  
  // Format number for display
  const formatNumber = (value: number, decimals = 2) => {
    return value.toFixed(decimals);
  };
  
  return (
    <div className="space-y-6 mt-8">
      <h3 className="text-2xl font-bold">Resultados del Análisis</h3>
      
      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Rendimiento Anual</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">{formatPercent(metrics.annualReturn)}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Volatilidad</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-amber-600">{formatPercent(metrics.volatility)}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Ratio de Sharpe</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-600">{formatNumber(metrics.sharpeRatio)}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Máximo Drawdown</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-red-600">{formatPercent(metrics.maxDrawdown)}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Alpha</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-purple-600">{formatPercent(metrics.alpha)}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Beta</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-indigo-600">{formatNumber(metrics.beta)}</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Gráfico de Rendimiento */}
      <Card>
        <CardHeader>
          <CardTitle>Rendimiento Histórico</CardTitle>
          <CardDescription>Comparación con el benchmark</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <ChartContainer 
                config={{ 
                  portfolio: { color: "#22c55e" },
                  benchmark: { color: "#3b82f6" }
                }}
              >
                <LineChart 
                  data={performanceChart}
                  margin={{ top: 10, right: 30, left: 20, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tickMargin={10} />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Legend wrapperStyle={{ paddingTop: 15 }} />
                  <Line 
                    type="monotone" 
                    dataKey="portfolio" 
                    stroke="#22c55e" 
                    activeDot={{ r: 8 }} 
                    name="Cartera" 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="benchmark" 
                    stroke="#3b82f6" 
                    name="Benchmark" 
                  />
                </LineChart>
              </ChartContainer>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      
      {/* Métricas por acción */}
      <Card>
        <CardHeader>
          <CardTitle>Métricas por Acción</CardTitle>
          <CardDescription>Rendimiento y riesgo de cada componente</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Ticker</th>
                  <th className="text-right p-2">Rend. Anual</th>
                  <th className="text-right p-2">Volatilidad</th>
                  <th className="text-right p-2">Sharpe</th>
                  <th className="text-right p-2">Beta</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(stockMetrics).map(([ticker, metrics]) => (
                  <tr key={ticker} className="border-b">
                    <td className="p-2 font-medium">{ticker}</td>
                    <td className="text-right p-2">{formatPercent(metrics.annualReturn)}</td>
                    <td className="text-right p-2">{formatPercent(metrics.volatility)}</td>
                    <td className="text-right p-2">{formatNumber(metrics.sharpeRatio)}</td>
                    <td className="text-right p-2">{formatNumber(metrics.beta)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      
      {/* Matriz de Correlación */}
      <Card>
        <CardHeader>
          <CardTitle>Matriz de Correlación</CardTitle>
          <CardDescription>Diversificación entre activos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto pb-4">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="p-2"></th>
                  {correlationMatrix.map((_, index) => (
                    <th key={index} className="p-2">{Object.keys(stockMetrics)[index]}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {correlationMatrix.map((row, rowIndex) => (
                  <tr key={rowIndex} className="border-b">
                    <td className="p-2 font-medium">{Object.keys(stockMetrics)[rowIndex]}</td>
                    {row.map((value: number, colIndex: number) => (
                      <td 
                        key={colIndex} 
                        className={`p-2 text-center ${
                          rowIndex === colIndex 
                            ? 'bg-gray-100' 
                            : value > 0.7 
                              ? 'bg-red-100' 
                              : value < 0.3 
                                ? 'bg-green-100' 
                                : ''
                        }`}
                      >
                        {formatNumber(value)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
