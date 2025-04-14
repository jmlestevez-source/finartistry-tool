
import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import PortfolioAnalysisForm from '@/components/portfolio/PortfolioAnalysisForm';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import StockValuationForm from '@/components/valuation/StockValuationForm';
import BacktestingForm from '@/components/backtesting/BacktestingForm';

const Index = () => {
  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold tracking-tight">Análisis Financiero Profesional</h1>
        <p className="text-muted-foreground mt-2">Evaluación de carteras, valoración de acciones y backtesting</p>
      </div>

      <Tabs defaultValue="portfolio" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="portfolio">Análisis de Cartera</TabsTrigger>
          <TabsTrigger value="valuation">Valoración de Acciones</TabsTrigger>
          <TabsTrigger value="backtesting">Backtesting</TabsTrigger>
        </TabsList>
        
        <TabsContent value="portfolio" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Análisis de Cartera</CardTitle>
              <CardDescription>
                Analiza el rendimiento, la volatilidad y la diversificación de tu portafolio.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PortfolioAnalysisForm />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="valuation" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Valoración de Acciones</CardTitle>
              <CardDescription>
                Evalúa acciones individuales utilizando múltiples metodologías.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <StockValuationForm />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="backtesting" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Backtesting</CardTitle>
              <CardDescription>
                Compara el rendimiento histórico de tus estrategias con benchmarks.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BacktestingForm />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Index;
