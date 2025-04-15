
import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { 
  Card, 
  CardContent
} from "@/components/ui/card";
import { OptimizerModel, fetchOptimizedPortfolio } from "@/lib/api/optimizer/optimizerService";
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { PortfolioOptimizerResults } from "./PortfolioOptimizerResults";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const PortfolioOptimizerForm = () => {
  const [tickers, setTickers] = useState("");
  const [weights, setWeights] = useState("");
  const [universe, setUniverse] = useState("");
  const [period, setPeriod] = useState("5y");
  const [optimizerModel, setOptimizerModel] = useState<OptimizerModel>(OptimizerModel.MAXIMUM_SHARPE);
  const [isLoading, setIsLoading] = useState(false);
  const [optimizerData, setOptimizerData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    const tickersList = tickers.split(",").map(t => t.trim().toUpperCase());
    
    // Parse weights if provided, otherwise assume equal weights
    let weightsList: number[] = [];
    if (weights.trim() === "") {
      // Equal weights
      weightsList = tickersList.map(() => 1 / tickersList.length);
    } else {
      try {
        weightsList = weights.split(",").map(w => parseFloat(w.trim()));
        // Normalize weights if they don't sum to 1
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
    
    // Check if tickers and weights have the same length
    if (tickersList.length !== weightsList.length) {
      toast({
        title: "Error en la entrada",
        description: "La cantidad de tickers y pesos debe coincidir.",
        variant: "destructive"
      });
      return;
    }
    
    // Parse universe tickers if provided
    const universeList = universe.trim() !== "" 
      ? universe.split(",").map(t => t.trim().toUpperCase())
      : undefined;
    
    setIsLoading(true);
    
    try {
      toast({
        title: "Optimizando cartera",
        description: `Calculando pesos óptimos para ${tickersList.join(', ')}...`,
      });
      
      const data = await fetchOptimizedPortfolio(
        tickersList, 
        weightsList, 
        optimizerModel, 
        period, 
        universeList
      );
      
      setOptimizerData(data);
      
      toast({
        title: "¡Optimización completada!",
        description: `Se han generado recomendaciones para optimizar su cartera.`,
        variant: "default"
      });
    } catch (error: any) {
      console.error("Error optimizing portfolio:", error);
      const errorMessage = error?.message || "Error desconocido";
      
      setError(`No pudimos optimizar la cartera: ${errorMessage}`);
      
      toast({
        title: "Error en la optimización",
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
          <Label htmlFor="tickers">Tickers de su cartera actual (separados por comas)</Label>
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
            Pesos actuales (opcional, separados por comas)
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
        
        <div className="space-y-2">
          <Label htmlFor="universe">
            Universo adicional de tickers a considerar (opcional)
          </Label>
          <Input
            id="universe"
            placeholder="NVDA, AMZN, TSLA"
            value={universe}
            onChange={(e) => setUniverse(e.target.value)}
          />
          <p className="text-sm text-muted-foreground">
            Tickers adicionales que podrían ser recomendados para su cartera.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="optimizerModel">Modelo de optimización</Label>
            <Select value={optimizerModel} onValueChange={(value) => setOptimizerModel(value as OptimizerModel)}>
              <SelectTrigger id="optimizerModel">
                <SelectValue placeholder="Seleccione un modelo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={OptimizerModel.MEAN_VARIANCE}>Media-Varianza (Markowitz)</SelectItem>
                <SelectItem value={OptimizerModel.MINIMUM_VOLATILITY}>Mínima Volatilidad</SelectItem>
                <SelectItem value={OptimizerModel.MAXIMUM_SHARPE}>Máximo Sharpe</SelectItem>
                <SelectItem value={OptimizerModel.RISK_PARITY}>Paridad de Riesgo</SelectItem>
                <SelectItem value={OptimizerModel.EQUAL_WEIGHT}>Pesos Iguales</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="period">Período de análisis</Label>
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
              Optimizando...
            </>
          ) : (
            "Optimizar Cartera"
          )}
        </Button>
      </form>
      
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
      )}
      
      {optimizerData && (
        <PortfolioOptimizerResults data={optimizerData} />
      )}
    </div>
  );
};

export default PortfolioOptimizerForm;
