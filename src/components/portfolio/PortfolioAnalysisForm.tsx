import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { PortfolioAnalysisResults } from "./PortfolioAnalysisResults";
import { fetchPortfolioData } from "@/lib/api/financeAPI";
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, Info } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PortfolioData {
  performanceChart: any[];
  correlationMatrix: number[][];
  metrics: {
    annualReturn: number;
    volatility: number;
    sharpeRatio: number;
    maxDrawdown: number;
    alpha: number;
    beta: number;
  };
  stockMetrics: Record<string, any>;
  dataSource?: string;
}

const PortfolioAnalysisForm = () => {
  const [tickers, setTickers] = useState("");
  const [weights, setWeights] = useState("");
  const [benchmark, setBenchmark] = useState("SPY");
  const [period, setPeriod] = useState("5y");
  const [isLoading, setIsLoading] = useState(false);
  const [portfolioData, setPortfolioData] = useState<PortfolioData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<string>("");
  
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setDataSource("");
    setPortfolioData(null);
    
    const tickersList = tickers.split(",").map(t => t.trim().toUpperCase());
    
    if (tickersList.length === 0 || tickersList[0] === "") {
      toast({
        title: "Error en la entrada",
        description: "Por favor, ingrese al menos un ticker.",
        variant: "destructive"
      });
      return;
    }
    
    let weightsList: number[] = [];
    if (weights.trim() === "") {
      weightsList = tickersList.map(() => 1 / tickersList.length);
    } else {
      try {
        weightsList = weights.split(",").map(w => parseFloat(w.trim()));
        const sum = weightsList.reduce((acc, val) => acc + val, 0);
        if (Math.abs(sum - 1) > 0.001 && sum > 0) {
          weightsList = weightsList.map(w => w / sum);
        }
      } catch (error) {
        toast({
          title: "Error en los pesos",
          description: "Por favor, ingrese pesos numéricos válidos.",
          variant: "destructive"
        });
        return;
      }
    }
    
    if (tickersList.length !== weightsList.length) {
      toast({
        title: "Error en la entrada",
        description: "La cantidad de tickers y pesos debe coincidir.",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      toast({
        title: "Cargando datos de ejemplo",
        description: `Se mostrarán datos simulados de demostración para ${tickersList.join(', ')}...`,
      });
      
      const data = await fetchPortfolioData(tickersList, weightsList, benchmark, period);
      
      setPortfolioData(data);
      
      if (data.dataSource) {
        setDataSource(data.dataSource);
        toast({
          title: "Fuente de datos",
          description: `${data.dataSource}`,
          variant: "default"
        });
      }
      
      toast({
        title: "¡Datos cargados!",
        description: `Se han cargado los datos de demostración para su cartera.`,
        variant: "default"
      });
    } catch (error: any) {
      console.error("Error fetching portfolio data:", error);
      const errorMessage = error?.message || "Error desconocido";
      
      setError(`No pudimos obtener los datos de la cartera: ${errorMessage}`);
      
      toast({
        title: "Error al obtener datos",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="tickers">Tickers (separados por comas)</Label>
          <Input
            id="tickers"
            placeholder="AAPL, MSFT, GOOGL"
            value={tickers}
            onChange={(e) => setTickers(e.target.value)}
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="weights">
            Pesos (opcional, separados por comas)
          </Label>
          <Input
            id="weights"
            placeholder="0.4, 0.3, 0.3"
            value={weights}
            onChange={(e) => setWeights(e.target.value)}
          />
          <p className="text-sm text-muted-foreground">
            Si se omiten, se asumirán pesos iguales.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="benchmark">Benchmark</Label>
            <Input
              id="benchmark"
              placeholder="SPY"
              value={benchmark}
              onChange={(e) => setBenchmark(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="period">Período</Label>
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger id="period">
                <SelectValue placeholder="Seleccione un período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1y">1 año</SelectItem>
                <SelectItem value="3y">3 años</SelectItem>
                <SelectItem value="5y">5 años</SelectItem>
                <SelectItem value="10y">10 años</SelectItem>
                <SelectItem value="30y">30 años</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analizando...
            </>
          ) : (
            "Analizar Cartera"
          )}
        </Button>
      </form>
      
      <Alert variant="default" className="bg-yellow-50 dark:bg-yellow-950 border-yellow-200">
        <Info className="h-4 w-4" />
        <AlertTitle>Modo de demostración</AlertTitle>
        <AlertDescription>
          Esta aplicación está mostrando datos simulados debido a restricciones CORS al acceder a Yahoo Finance.
          En un entorno de producción, se utilizarían datos reales de mercado.
        </AlertDescription>
      </Alert>
      
      {dataSource && (
        <Alert variant="default" className="bg-blue-50 dark:bg-blue-950 border-blue-200">
          <Info className="h-4 w-4" />
          <AlertTitle>Fuente de datos</AlertTitle>
          <AlertDescription>
            {dataSource}
          </AlertDescription>
        </Alert>
      )}
      
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
      )}
      
      {portfolioData && (
        <PortfolioAnalysisResults data={portfolioData} />
      )}
    </div>
  );
};

export default PortfolioAnalysisForm;
