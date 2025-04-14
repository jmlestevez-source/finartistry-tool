
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
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar
} from "recharts";

interface BacktestMetrics {
  cagr: number;
  volatility: number;
  sharpeRatio: number;
  sortino: number;
  maxDrawdown: number;
  winRate: number;
  bestYear: number;
  worstYear: number;
  alpha: number;
  beta: number;
  correlationToBenchmark: number;
}

interface BacktestingResultsProps {
  data: {
    portfolioPerformance: any[];
    yearlyReturns: any[];
    metrics: BacktestMetrics;
    benchmarkMetrics: BacktestMetrics;
    monthlyReturns: any[];
    drawdowns: any[];
    allocationOverTime: any[];
    rollingReturns: any[];
    rollingVolatility: any[];
    rollingSharpe: any[];
  };
}

const BacktestingResults: React.FC<BacktestingResultsProps> = ({ data }) => {
  const {
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
  } = data;

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
      <h3 className="text-2xl font-bold">Resultados del Backtesting</h3>

      {/* Métricas principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">CAGR</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between">
              <p className="text-2xl font-bold text-green-600">{formatPercent(metrics.cagr)}</p>
              <p className="text-sm text-muted-foreground self-end">
                Benchmark: {formatPercent(benchmarkMetrics.cagr)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Volatilidad</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between">
              <p className="text-2xl font-bold text-amber-600">{formatPercent(metrics.volatility)}</p>
              <p className="text-sm text-muted-foreground self-end">
                Benchmark: {formatPercent(benchmarkMetrics.volatility)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Ratio Sharpe</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between">
              <p className="text-2xl font-bold text-blue-600">{formatNumber(metrics.sharpeRatio)}</p>
              <p className="text-sm text-muted-foreground self-end">
                Benchmark: {formatNumber(benchmarkMetrics.sharpeRatio)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Máx. Drawdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between">
              <p className="text-2xl font-bold text-red-600">{formatPercent(metrics.maxDrawdown)}</p>
              <p className="text-sm text-muted-foreground self-end">
                Benchmark: {formatPercent(benchmarkMetrics.maxDrawdown)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="performance">
        <TabsList className="grid grid-cols-4">
          <TabsTrigger value="performance">Rendimiento</TabsTrigger>
          <TabsTrigger value="returns">Retornos</TabsTrigger>
          <TabsTrigger value="volatility">Volatilidad</TabsTrigger>
          <TabsTrigger value="allocation">Asignación</TabsTrigger>
        </TabsList>

        {/* Tab de Rendimiento */}
        <TabsContent value="performance" className="space-y-6">
          {/* Gráfico de Rendimiento Acumulado */}
          <Card>
            <CardHeader>
              <CardTitle>Rendimiento Acumulado</CardTitle>
              <CardDescription>Comparación con benchmark</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-96">
                <ChartContainer
                  config={{ 
                    portfolio: { color: "#22c55e" },
                    benchmark: { color: "#3b82f6" }
                  }}
                >
                  <LineChart data={portfolioPerformance}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Legend />
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
              </div>
            </CardContent>
          </Card>
        
          {/* Tabla de Métricas */}
          <Card>
            <CardHeader>
              <CardTitle>Métricas Detalladas</CardTitle>
              <CardDescription>Comparación completa de métricas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Métrica</th>
                      <th className="text-right p-2">Cartera</th>
                      <th className="text-right p-2">Benchmark</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="p-2 font-medium">CAGR</td>
                      <td className="text-right p-2">{formatPercent(metrics.cagr)}</td>
                      <td className="text-right p-2">{formatPercent(benchmarkMetrics.cagr)}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2 font-medium">Volatilidad</td>
                      <td className="text-right p-2">{formatPercent(metrics.volatility)}</td>
                      <td className="text-right p-2">{formatPercent(benchmarkMetrics.volatility)}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2 font-medium">Ratio Sharpe</td>
                      <td className="text-right p-2">{formatNumber(metrics.sharpeRatio)}</td>
                      <td className="text-right p-2">{formatNumber(benchmarkMetrics.sharpeRatio)}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2 font-medium">Ratio Sortino</td>
                      <td className="text-right p-2">{formatNumber(metrics.sortino)}</td>
                      <td className="text-right p-2">{formatNumber(benchmarkMetrics.sortino)}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2 font-medium">Máx. Drawdown</td>
                      <td className="text-right p-2">{formatPercent(metrics.maxDrawdown)}</td>
                      <td className="text-right p-2">{formatPercent(benchmarkMetrics.maxDrawdown)}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2 font-medium">Win Rate</td>
                      <td className="text-right p-2">{formatPercent(metrics.winRate)}</td>
                      <td className="text-right p-2">{formatPercent(benchmarkMetrics.winRate)}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2 font-medium">Mejor Año</td>
                      <td className="text-right p-2">{formatPercent(metrics.bestYear)}</td>
                      <td className="text-right p-2">{formatPercent(benchmarkMetrics.bestYear)}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2 font-medium">Peor Año</td>
                      <td className="text-right p-2">{formatPercent(metrics.worstYear)}</td>
                      <td className="text-right p-2">{formatPercent(benchmarkMetrics.worstYear)}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2 font-medium">Alpha</td>
                      <td className="text-right p-2">{formatPercent(metrics.alpha)}</td>
                      <td className="text-right p-2">N/A</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2 font-medium">Beta</td>
                      <td className="text-right p-2">{formatNumber(metrics.beta)}</td>
                      <td className="text-right p-2">1.00</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2 font-medium">Correlación</td>
                      <td className="text-right p-2">{formatNumber(metrics.correlationToBenchmark)}</td>
                      <td className="text-right p-2">1.00</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab de Retornos */}
        <TabsContent value="returns" className="space-y-6">
          {/* Retornos Anuales */}
          <Card>
            <CardHeader>
              <CardTitle>Retornos Anuales</CardTitle>
              <CardDescription>Comparación año a año</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-96">
                <ChartContainer
                  config={{ 
                    portfolio: { color: "#22c55e" },
                    benchmark: { color: "#3b82f6" }
                  }}
                >
                  <BarChart data={yearlyReturns}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis tickFormatter={(value) => `${(value * 100).toFixed(0)}%`} />
                    <ChartTooltip 
                      content={<ChartTooltipContent />}
                      formatter={(value: any) => `${(value * 100).toFixed(2)}%`}
                    />
                    <Legend />
                    <Bar dataKey="portfolio" name="Cartera" fill="#22c55e" />
                    <Bar dataKey="benchmark" name="Benchmark" fill="#3b82f6" />
                  </BarChart>
                </ChartContainer>
              </div>
            </CardContent>
          </Card>

          {/* Retornos Mensuales */}
          <Card>
            <CardHeader>
              <CardTitle>Retornos Mensuales</CardTitle>
              <CardDescription>Heatmap de retornos mensuales</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Año</th>
                      <th className="text-right p-2">Ene</th>
                      <th className="text-right p-2">Feb</th>
                      <th className="text-right p-2">Mar</th>
                      <th className="text-right p-2">Abr</th>
                      <th className="text-right p-2">May</th>
                      <th className="text-right p-2">Jun</th>
                      <th className="text-right p-2">Jul</th>
                      <th className="text-right p-2">Ago</th>
                      <th className="text-right p-2">Sep</th>
                      <th className="text-right p-2">Oct</th>
                      <th className="text-right p-2">Nov</th>
                      <th className="text-right p-2">Dic</th>
                      <th className="text-right p-2">Anual</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthlyReturns.map((year, index) => (
                      <tr key={index} className="border-b">
                        <td className="p-2 font-medium">{year.year}</td>
                        {year.returns.map((monthReturn: number, monthIndex: number) => (
                          <td 
                            key={monthIndex}
                            className={`text-right p-2 ${
                              monthReturn > 0 
                                ? 'bg-green-100 text-green-800' 
                                : monthReturn < 0 
                                  ? 'bg-red-100 text-red-800' 
                                  : ''
                            }`}
                          >
                            {monthReturn !== null ? formatPercent(monthReturn) : "-"}
                          </td>
                        ))}
                        <td 
                          className={`text-right p-2 font-bold ${
                            year.annualReturn > 0 
                              ? 'bg-green-200 text-green-800' 
                              : year.annualReturn < 0 
                                ? 'bg-red-200 text-red-800' 
                                : ''
                          }`}
                        >
                          {formatPercent(year.annualReturn)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Drawdowns */}
          <Card>
            <CardHeader>
              <CardTitle>Drawdowns</CardTitle>
              <CardDescription>Períodos de pérdidas desde máximos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-72">
                <ChartContainer
                  config={{ 
                    portfolio: { color: "#ef4444" },
                    benchmark: { color: "#f97316" }
                  }}
                >
                  <AreaChart data={drawdowns}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis tickFormatter={(value) => `${(value * 100).toFixed(0)}%`} />
                    <ChartTooltip 
                      content={<ChartTooltipContent />}
                      formatter={(value: any) => `${(value * 100).toFixed(2)}%`}
                    />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="portfolio" 
                      stroke="#ef4444" 
                      fill="#ef4444" 
                      fillOpacity={0.3}
                      name="Cartera" 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="benchmark" 
                      stroke="#f97316" 
                      fill="#f97316" 
                      fillOpacity={0.3}
                      name="Benchmark" 
                    />
                  </AreaChart>
                </ChartContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab de Volatilidad */}
        <TabsContent value="volatility" className="space-y-6">
          {/* Retorno Móvil */}
          <Card>
            <CardHeader>
              <CardTitle>Retorno Móvil (Ventana de 12 Meses)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-72">
                <ChartContainer
                  config={{ 
                    portfolio: { color: "#22c55e" },
                    benchmark: { color: "#3b82f6" }
                  }}
                >
                  <LineChart data={rollingReturns}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis tickFormatter={(value) => `${(value * 100).toFixed(0)}%`} />
                    <ChartTooltip 
                      content={<ChartTooltipContent />}
                      formatter={(value: any) => `${(value * 100).toFixed(2)}%`}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="portfolio" 
                      stroke="#22c55e" 
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
              </div>
            </CardContent>
          </Card>

          {/* Volatilidad Móvil */}
          <Card>
            <CardHeader>
              <CardTitle>Volatilidad Móvil (Ventana de 12 Meses)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-72">
                <ChartContainer
                  config={{ 
                    portfolio: { color: "#f59e0b" },
                    benchmark: { color: "#6b7280" }
                  }}
                >
                  <LineChart data={rollingVolatility}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis tickFormatter={(value) => `${(value * 100).toFixed(0)}%`} />
                    <ChartTooltip 
                      content={<ChartTooltipContent />}
                      formatter={(value: any) => `${(value * 100).toFixed(2)}%`}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="portfolio" 
                      stroke="#f59e0b" 
                      name="Cartera" 
                    />
                    <Line 
                      type="monotone" 
                      dataKey="benchmark" 
                      stroke="#6b7280" 
                      name="Benchmark" 
                    />
                  </LineChart>
                </ChartContainer>
              </div>
            </CardContent>
          </Card>

          {/* Ratio Sharpe Móvil */}
          <Card>
            <CardHeader>
              <CardTitle>Ratio Sharpe Móvil (Ventana de 12 Meses)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-72">
                <ChartContainer
                  config={{ 
                    portfolio: { color: "#8b5cf6" },
                    benchmark: { color: "#6b7280" }
                  }}
                >
                  <LineChart data={rollingSharpe}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="portfolio" 
                      stroke="#8b5cf6" 
                      name="Cartera" 
                    />
                    <Line 
                      type="monotone" 
                      dataKey="benchmark" 
                      stroke="#6b7280" 
                      name="Benchmark" 
                    />
                  </LineChart>
                </ChartContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab de Asignación */}
        <TabsContent value="allocation" className="space-y-6">
          {/* Asignación a lo largo del tiempo */}
          <Card>
            <CardHeader>
              <CardTitle>Asignación a lo largo del Tiempo</CardTitle>
              <CardDescription>Evolución de la composición de la cartera</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-96">
                <ChartContainer config={{}}>
                  <AreaChart data={allocationOverTime}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis tickFormatter={(value) => `${(value * 100).toFixed(0)}%`} />
                    <ChartTooltip 
                      content={<ChartTooltipContent />}
                      formatter={(value: any) => `${(value * 100).toFixed(2)}%`}
                    />
                    <Legend />
                    {Object.keys(allocationOverTime[0] || {})
                      .filter(key => key !== 'date')
                      .map((ticker, index, array) => (
                        <Area
                          key={ticker}
                          type="monotone"
                          dataKey={ticker}
                          stackId="1"
                          stroke={`hsl(${(index * 360) / array.length}, 70%, 50%)`}
                          fill={`hsl(${(index * 360) / array.length}, 70%, 50%)`}
                          name={ticker}
                        />
                      ))}
                  </AreaChart>
                </ChartContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BacktestingResults;
