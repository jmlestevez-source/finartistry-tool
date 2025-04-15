
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
import { AlertTriangle } from "lucide-react";

const PortfolioAnalysisForm = () => {
  const [tickers, setTickers] = useState("");
  const [weights, setWeights] = useState("");
  const [benchmark, setBenchmark] = useState("SPY");
  const [period, setPeriod] = useState("5y");
  const [isLoading, setIsLoading] = useState(false);
  const [portfolioData, setPortfolioData] = useState<any>(null);
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
    
    setIsLoading(true);
    
    try {
      toast({
        title: "Conectando con API financiera",
        description: `Obteniendo datos para ${tickersList.join(', ')} en período ${period}...`,
      });
      
      const data = await fetchPortfolioData(tickersList, weightsList, benchmark, period);
      setPortfolioData(data);
      
      toast({
        title: "¡Datos obtenidos!",
        description: `Se han cargado los datos de la cartera.`,
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
            <select
              id="period"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
            >
              <option value="1y">1 año</option>
              <option value="3y">3 años</option>
              <option value="5y">5 años</option>
              <option value="10y">10 años</option>
              <option value="max">Máximo</option>
            </select>
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
