
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
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer
} from "recharts";

interface CompanyInfo {
  name: string;
  sector: string;
  industry: string;
  marketCap: number;
  currentPrice: number;
}

interface ValuationModel {
  name: string;
  fairValue: number;
  upside: number;
  description: string;
}

interface FinancialRatio {
  name: string;
  value: number;
  industryAvg: number;
}

interface StockValuationResultsProps {
  data: {
    companyInfo: CompanyInfo;
    valuationModels: ValuationModel[];
    historicalPrices: any[];
    financialRatios: FinancialRatio[];
    growthRates: any;
    riskMetrics: any;
  };
}

const StockValuationResults: React.FC<StockValuationResultsProps> = ({ data }) => {
  const { companyInfo, valuationModels, historicalPrices, financialRatios, growthRates, riskMetrics } = data;
  
  // Format currency for display
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };
  
  // Format large numbers (like market cap)
  const formatLargeNumber = (value: number) => {
    if (value >= 1e12) {
      return `${(value / 1e12).toFixed(2)} B`;
    } else if (value >= 1e9) {
      return `${(value / 1e9).toFixed(2)} MM`;
    } else if (value >= 1e6) {
      return `${(value / 1e6).toFixed(2)} M`;
    } else {
      return value.toFixed(2);
    }
  };
  
  // Format percentage for display
  const formatPercent = (value: number) => {
    return `${(value * 100).toFixed(2)}%`;
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];
  
  return (
    <div className="space-y-6 mt-8">
      {/* Información de la empresa */}
      <Card className="overflow-hidden">
        <CardHeader className="bg-primary/10">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl">{companyInfo.name} ({data.companyInfo.sector})</CardTitle>
              <CardDescription>{companyInfo.sector} - {companyInfo.industry}</CardDescription>
            </div>
            <div className="text-right">
              <span className="block text-3xl font-bold">{formatCurrency(companyInfo.currentPrice)}</span>
              <span className="text-sm text-muted-foreground">Cap. de mercado: {formatLargeNumber(companyInfo.marketCap)}</span>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pt-6">
          <Tabs defaultValue="valuation">
            <TabsList className="grid grid-cols-4 mb-4">
              <TabsTrigger value="valuation">Valoración</TabsTrigger>
              <TabsTrigger value="financials">Ratios Financieros</TabsTrigger>
              <TabsTrigger value="growth">Crecimiento</TabsTrigger>
              <TabsTrigger value="risk">Riesgo</TabsTrigger>
            </TabsList>
            
            {/* Tab de Valoración */}
            <TabsContent value="valuation" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Gráfico de modelos de valoración */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Modelos de Valoración</CardTitle>
                    <CardDescription>Comparación de valores justos estimados</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="h-96">
                      <ResponsiveContainer width="100%" height="100%">
                        <ChartContainer 
                          config={{ 
                            bar: { color: "#3b82f6" },
                            price: { color: "#ef4444" }
                          }}
                        >
                          <BarChart
                            data={valuationModels.map(model => ({
                              name: model.name,
                              value: model.fairValue,
                              upside: model.upside
                            }))}
                            margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis 
                              dataKey="name" 
                              angle={-45} 
                              textAnchor="end"
                              height={60}
                              tickMargin={10}
                            />
                            <YAxis />
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <Bar dataKey="value" name="Valor Justo" />
                            <Legend wrapperStyle={{ bottom: 0, paddingTop: 10 }} />
                          </BarChart>
                        </ChartContainer>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Tabla de valores justos */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Detalle de Modelos</CardTitle>
                    <CardDescription>Información detallada por modelo</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-2">Modelo</th>
                            <th className="text-right p-2">Valor Justo</th>
                            <th className="text-right p-2">Potencial</th>
                          </tr>
                        </thead>
                        <tbody>
                          {valuationModels.map((model, index) => (
                            <tr key={index} className="border-b">
                              <td className="p-2 font-medium">{model.name}</td>
                              <td className="text-right p-2">{formatCurrency(model.fairValue)}</td>
                              <td className={`text-right p-2 ${model.upside > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {formatPercent(model.upside)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Gráfico histórico de precios */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Precio Histórico</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <ChartContainer 
                        config={{ 
                          price: { color: "#3b82f6" }
                        }}
                      >
                        <LineChart 
                          data={historicalPrices}
                          margin={{ top: 5, right: 30, left: 20, bottom: 20 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" tickMargin={10} />
                          <YAxis />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Legend wrapperStyle={{ paddingTop: 10 }} />
                          <Line 
                            type="monotone" 
                            dataKey="price" 
                            stroke="#3b82f6" 
                            activeDot={{ r: 8 }} 
                            name="Precio" 
                          />
                        </LineChart>
                      </ChartContainer>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Tab de Ratios Financieros */}
            <TabsContent value="financials" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Ratios Financieros</CardTitle>
                    <CardDescription>Comparado con el promedio del sector</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="h-96">
                      <ResponsiveContainer width="100%" height="100%">
                        <ChartContainer 
                          config={{ 
                            company: { color: "#3b82f6" },
                            industry: { color: "#6b7280" }
                          }}
                        >
                          <BarChart
                            data={financialRatios}
                            layout="vertical"
                            margin={{ top: 5, right: 30, left: 120, bottom: 20 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" />
                            <YAxis 
                              type="category" 
                              dataKey="name" 
                              width={110} 
                              tick={{ fontSize: 12 }}
                              tickMargin={5}
                            />
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <Legend wrapperStyle={{ paddingTop: 10 }} />
                            <Bar 
                              dataKey="value" 
                              name="Empresa" 
                              fill="#3b82f6"
                            />
                            <Bar 
                              dataKey="industryAvg" 
                              name="Industria" 
                              fill="#6b7280"
                            />
                          </BarChart>
                        </ChartContainer>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Análisis de Ratios</CardTitle>
                    <CardDescription>Interpretación de ratios clave</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-4">
                      {financialRatios.slice(0, 5).map((ratio, index) => (
                        <div key={index} className="border-b pb-2">
                          <div className="flex justify-between">
                            <span className="font-medium">{ratio.name}</span>
                            <span className={`${
                              ratio.value > ratio.industryAvg ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {ratio.value.toFixed(2)}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm text-muted-foreground mt-1">
                            <span>Promedio de industria: {ratio.industryAvg.toFixed(2)}</span>
                            <span>{ratio.value > ratio.industryAvg ? 'Mejor' : 'Peor'}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            {/* Tab de Crecimiento */}
            <TabsContent value="growth" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Tasas de Crecimiento</CardTitle>
                    <CardDescription>Histórico y proyectado</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="h-96">
                      <ResponsiveContainer width="100%" height="100%">
                        <ChartContainer 
                          config={{ 
                            revenue: { color: "#3b82f6" },
                            earnings: { color: "#22c55e" },
                            fcf: { color: "#f59e0b" }
                          }}
                        >
                          <BarChart
                            data={[
                              { 
                                name: "1 año", 
                                revenue: growthRates.revenue.oneYear, 
                                earnings: growthRates.earnings.oneYear,
                                fcf: growthRates.freeCashFlow.oneYear
                              },
                              { 
                                name: "3 años", 
                                revenue: growthRates.revenue.threeYear, 
                                earnings: growthRates.earnings.threeYear,
                                fcf: growthRates.freeCashFlow.threeYear
                              },
                              { 
                                name: "5 años", 
                                revenue: growthRates.revenue.fiveYear, 
                                earnings: growthRates.earnings.fiveYear,
                                fcf: growthRates.freeCashFlow.fiveYear
                              },
                              { 
                                name: "Proyectado", 
                                revenue: growthRates.revenue.projected, 
                                earnings: growthRates.earnings.projected,
                                fcf: growthRates.freeCashFlow.projected
                              },
                            ]}
                            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" tickMargin={10} />
                            <YAxis tickFormatter={(value) => `${(value * 100).toFixed(0)}%`} />
                            <ChartTooltip 
                              content={<ChartTooltipContent />}
                              formatter={(value: any) => `${(value * 100).toFixed(2)}%`}
                            />
                            <Legend wrapperStyle={{ paddingTop: 10 }} />
                            <Bar dataKey="revenue" name="Ingresos" fill="#3b82f6" />
                            <Bar dataKey="earnings" name="Beneficios" fill="#22c55e" />
                            <Bar dataKey="fcf" name="Flujo de Caja Libre" fill="#f59e0b" />
                          </BarChart>
                        </ChartContainer>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Factores de Crecimiento</CardTitle>
                    <CardDescription>Descomposición del crecimiento</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="h-96">
                      <ResponsiveContainer width="100%" height="100%">
                        <ChartContainer config={{}}>
                          <PieChart margin={{ top: 5, right: 30, left: 20, bottom: 20 }}>
                            <Pie
                              data={growthRates.drivers.map((driver: any, index: number) => ({
                                name: driver.name,
                                value: driver.contribution
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
                              {growthRates.drivers.map((entry: any, index: number) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Legend wrapperStyle={{ paddingTop: 20 }} />
                            <ChartTooltip formatter={(value: any) => `${(value * 100).toFixed(2)}%`} />
                          </PieChart>
                        </ChartContainer>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            {/* Tab de Riesgo */}
            <TabsContent value="risk" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Métricas de Riesgo</CardTitle>
                    <CardDescription>Volatilidad y correlaciones</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <table className="w-full">
                      <tbody>
                        <tr className="border-b">
                          <td className="py-2 font-medium">Beta:</td>
                          <td className="py-2 text-right">{riskMetrics.beta.toFixed(2)}</td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-2 font-medium">Volatilidad:</td>
                          <td className="py-2 text-right">{formatPercent(riskMetrics.volatility)}</td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-2 font-medium">Ratio de Sharpe:</td>
                          <td className="py-2 text-right">{riskMetrics.sharpeRatio.toFixed(2)}</td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-2 font-medium">Máx. Drawdown:</td>
                          <td className="py-2 text-right">{formatPercent(riskMetrics.maxDrawdown)}</td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-2 font-medium">VaR (95%):</td>
                          <td className="py-2 text-right">{formatPercent(riskMetrics.valueAtRisk)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Correlaciones</CardTitle>
                    <CardDescription>Correlación con índices principales</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <table className="w-full">
                      <tbody>
                        {riskMetrics.correlations.map((corr: any, index: number) => (
                          <tr key={index} className="border-b">
                            <td className="py-2 font-medium">{corr.name}:</td>
                            <td className="py-2 text-right">{corr.value.toFixed(2)}</td>
                            <td className="py-2 px-2">
                              <div className="w-full bg-gray-200 rounded h-2">
                                <div 
                                  className={`h-2 rounded ${
                                    corr.value > 0 ? 'bg-blue-500' : 'bg-red-500'
                                  }`}
                                  style={{ width: `${Math.abs(corr.value) * 100}%` }}
                                ></div>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </CardContent>
                </Card>
                
                {/* Resumen de Riesgos */}
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="text-lg">Evaluación de Riesgos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {riskMetrics.riskFactors.map((factor: any, index: number) => (
                        <div key={index} className="border-b pb-3">
                          <div className="flex justify-between mb-1">
                            <span className="font-medium">{factor.name}</span>
                            <span className={`px-2 py-1 text-xs rounded ${
                              factor.level === 'Alto' 
                                ? 'bg-red-100 text-red-800' 
                                : factor.level === 'Medio'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-green-100 text-green-800'
                            }`}>
                              {factor.level}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">{factor.description}</p>
                        </div>
                      ))}
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

export default StockValuationResults;
