
import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { 
  Card, 
  CardContent
} from "@/components/ui/card";
import { 
  OptimizerModel, 
  fetchOptimizedPortfolio,
} from "@/lib/api/financeAPI";
import { 
  fetchStockRecommendations,
  STOXX50_TICKERS, 
  SP500_TICKERS, 
  NASDAQ100_TICKERS 
} from "@/lib/api/utils/apiUtils";
import { Loader2, Plus, Info } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const PortfolioOptimizerForm = () => {
  const [tickers, setTickers] = useState("");
  const [weights, setWeights] = useState("");
  const [universe, setUniverse] = useState("");
  const [period, setPeriod] = useState("5y");
  const [optimizerModel, setOptimizerModel] = useState<OptimizerModel>(OptimizerModel.MAX_SHARPE);
  const [isLoading, setIsLoading] = useState(false);
  const [optimizerData, setOptimizerData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [recommendationMetric, setRecommendationMetric] = useState<'sharpe' | 'volatility' | 'correlation'>('sharpe');
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [selectedRecommendations, setSelectedRecommendations] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<string>("custom");
  const [dataSource, setDataSource] = useState<string>("");
  
  const { toast } = useToast();

  const fetchRecommendations = async () => {
    if (!tickers) {
      toast({
        title: "No hay tickers",
        description: "Por favor, ingrese al menos un ticker para obtener recomendaciones.",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoadingRecommendations(true);
    
    try {
      const tickersList = tickers.split(",").map(t => t.trim().toUpperCase());
      const data = await fetchStockRecommendations(tickersList, recommendationMetric, 5);
      setRecommendations(data);
      setShowRecommendations(true);
    } catch (error) {
      toast({
        title: "Error en las recomendaciones",
        description: "No se pudieron obtener recomendaciones.",
        variant: "destructive"
      });
    } finally {
      setIsLoadingRecommendations(false);
    }
  };

  const handleAddRecommendation = (ticker: string) => {
    if (selectedRecommendations.includes(ticker)) {
      setSelectedRecommendations(selectedRecommendations.filter(t => t !== ticker));
    } else {
      setSelectedRecommendations([...selectedRecommendations, ticker]);
    }
  };

  const handleApplyRecommendations = () => {
    if (selectedRecommendations.length === 0) return;
    
    // Añadir las recomendaciones seleccionadas al universo
    const currentUniverse = universe ? universe.split(",").map(t => t.trim()) : [];
    const newUniverseItems = selectedRecommendations.filter(
      ticker => !currentUniverse.includes(ticker)
    );
    
    if (newUniverseItems.length > 0) {
      const newUniverse = [...currentUniverse, ...newUniverseItems];
      setUniverse(newUniverse.join(", "));
      
      toast({
        title: "Recomendaciones añadidas",
        description: `Se añadieron ${newUniverseItems.length} tickers al universo de inversión.`,
      });
    }
    
    setShowRecommendations(false);
    setSelectedRecommendations([]);
  };

  const handleIndexSelection = (index: string) => {
    setSelectedIndex(index);
    let tickersToAdd: string[] = [];
    
    switch (index) {
      case "stoxx50":
        tickersToAdd = STOXX50_TICKERS.slice(0, 5);
        break;
      case "sp500":
        tickersToAdd = SP500_TICKERS.slice(0, 5);
        break;
      case "nasdaq100":
        tickersToAdd = NASDAQ100_TICKERS.slice(0, 5);
        break;
      default:
        return;
    }
    
    // Añadir estos tickers al universo de inversión
    const currentUniverse = universe ? universe.split(",").map(t => t.trim()) : [];
    const combinedUniverse = [...new Set([...currentUniverse, ...tickersToAdd])];
    setUniverse(combinedUniverse.join(", "));
    
    toast({
      title: "Índice seleccionado",
      description: `Se añadieron tickers del índice seleccionado al universo de inversión.`,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setDataSource("");
    
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
      
      // Crear un array vacío para los datos históricos como placeholder
      // El servicio real obtendría estos datos de la API
      const historicalReturns: any[] = [];
      
      const data = await fetchOptimizedPortfolio(
        tickersList, 
        weightsList, 
        optimizerModel, 
        historicalReturns, 
        universeList
      );
      
      setOptimizerData(data);
      
      // Verificar si los datos vienen de Yahoo Finance
      if (data.dataSource === "Yahoo Finance") {
        setDataSource("Yahoo Finance");
      }
      
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
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="universe">
              Universo adicional de tickers a considerar
            </Label>
            <Button 
              type="button" 
              variant="outline" 
              size="sm"
              onClick={fetchRecommendations}
              disabled={isLoadingRecommendations || !tickers}
            >
              {isLoadingRecommendations ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Buscando
                </>
              ) : (
                <>
                  <Info className="mr-2 h-4 w-4" />
                  Obtener recomendaciones
                </>
              )}
            </Button>
          </div>
          
          <Tabs value={selectedIndex} onValueChange={handleIndexSelection} className="w-full">
            <TabsList className="grid grid-cols-4 mb-2">
              <TabsTrigger value="custom">Personalizado</TabsTrigger>
              <TabsTrigger value="stoxx50">STOXX 50</TabsTrigger>
              <TabsTrigger value="sp500">S&P 500</TabsTrigger>
              <TabsTrigger value="nasdaq100">NASDAQ 100</TabsTrigger>
            </TabsList>
            
            <Input
              id="universe"
              placeholder="NVDA, AMZN, TSLA"
              value={universe}
              onChange={(e) => setUniverse(e.target.value)}
            />
          </Tabs>
          
          <p className="text-sm text-muted-foreground">
            Tickers adicionales que podrían ser recomendados para su cartera.
          </p>
        </div>
        
        {showRecommendations && recommendations.length > 0 && (
          <Card className="mt-2">
            <CardContent className="pt-4">
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium mb-2">Recomendaciones según</h4>
                  <RadioGroup 
                    value={recommendationMetric} 
                    onValueChange={(value) => setRecommendationMetric(value as 'sharpe' | 'volatility' | 'correlation')}
                    className="flex space-x-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="sharpe" id="r1" />
                      <Label htmlFor="r1">Ratio Sharpe</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="volatility" id="r2" />
                      <Label htmlFor="r2">Volatilidad</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="correlation" id="r3" />
                      <Label htmlFor="r3">Correlación</Label>
                    </div>
                  </RadioGroup>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium mb-2">Tickers recomendados</h4>
                  <div className="flex flex-wrap gap-2">
                    {recommendations.map((rec) => (
                      <div key={rec.ticker} className="flex items-center">
                        <Checkbox
                          id={`rec-${rec.ticker}`}
                          checked={selectedRecommendations.includes(rec.ticker)}
                          onCheckedChange={() => handleAddRecommendation(rec.ticker)}
                          className="mr-2"
                        />
                        <Label htmlFor={`rec-${rec.ticker}`}>
                          <Badge className="cursor-pointer">
                            {rec.ticker}
                          </Badge>
                        </Label>
                        <span className="text-xs text-muted-foreground ml-2">{rec.reason}</span>
                      </div>
                    ))}
                  </div>
                  
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="mt-2"
                    onClick={handleApplyRecommendations}
                    disabled={selectedRecommendations.length === 0}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Añadir a universo
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="optimizerModel">Modelo de optimización</Label>
            <Select value={optimizerModel} onValueChange={(value) => setOptimizerModel(value as OptimizerModel)}>
              <SelectTrigger id="optimizerModel">
                <SelectValue placeholder="Seleccione un modelo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={OptimizerModel.MEAN_VARIANCE}>Media-Varianza (Markowitz)</SelectItem>
                <SelectItem value={OptimizerModel.MIN_VOLATILITY}>Mínima Volatilidad</SelectItem>
                <SelectItem value={OptimizerModel.MAX_SHARPE}>Máximo Sharpe</SelectItem>
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
      
      {dataSource === "Yahoo Finance" && (
        <Alert variant="default" className="bg-yellow-50 dark:bg-yellow-950 border-yellow-200">
          <Info className="h-4 w-4" />
          <AlertTitle>Fuente de datos</AlertTitle>
          <AlertDescription>
            Datos descargados desde Yahoo Finance debido a limitaciones de la API principal.
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
      
      {optimizerData && (
        <PortfolioOptimizerResults data={optimizerData} model={optimizerModel} />
      )}
    </div>
  );
};

export default PortfolioOptimizerForm;
