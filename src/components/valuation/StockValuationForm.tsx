
import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import StockValuationResults from "./StockValuationResults";

const StockValuationForm = () => {
  const [ticker, setTicker] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [valuationData, setValuationData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!ticker) {
      toast({
        title: "Campo requerido",
        description: "Por favor, ingrese un ticker válido.",
        variant: "destructive"
      });
      return;
    }
    
    // Limpiar espacios y convertir a mayúsculas
    const formattedTicker = ticker.trim().toUpperCase();
    
    setIsLoading(true);
    setError(null);
    
    try {
      toast({
        title: "Conectando con API financiera",
        description: "Obteniendo datos de valoración para " + formattedTicker + "...",
      });
      
      console.log("Iniciando valoración para ticker:", formattedTicker);
      
      // Simulación de datos de valoración para demostración
      const mockData = {
        ticker: formattedTicker,
        companyInfo: {
          name: `${formattedTicker} Corporation`,
          sector: "Tecnología",
          industry: "Software",
          marketCap: 500000000000,
          currentPrice: 150.75
        },
        valuationModels: [
          { name: "DCF", fairValue: 170.25, upside: 0.13, description: "Flujos de caja descontados" },
          { name: "P/E", fairValue: 165.30, upside: 0.10, description: "Múltiplo de beneficios" },
          { name: "P/B", fairValue: 155.50, upside: 0.03, description: "Múltiplo de valor contable" },
          { name: "EV/EBITDA", fairValue: 172.80, upside: 0.15, description: "Múltiplo de EBITDA" },
          { name: "DDM", fairValue: 160.40, upside: 0.06, description: "Modelo de descuento de dividendos" }
        ],
        historicalPrices: Array.from({ length: 12 }, (_, i) => ({
          date: `${2023}-${(i + 1).toString().padStart(2, '0')}`,
          price: 120 + Math.random() * 60
        })),
        financialRatios: [
          { name: "P/E", value: 25.3, industryAvg: 22.1 },
          { name: "P/B", value: 8.7, industryAvg: 6.5 },
          { name: "P/S", value: 12.4, industryAvg: 10.2 },
          { name: "ROE", value: 0.35, industryAvg: 0.28 },
          { name: "ROA", value: 0.18, industryAvg: 0.15 },
          { name: "Margen neto", value: 0.21, industryAvg: 0.18 }
        ],
        growthRates: {
          revenue: {
            oneYear: 0.18,
            threeYear: 0.15,
            fiveYear: 0.13,
            projected: 0.12
          },
          earnings: {
            oneYear: 0.22,
            threeYear: 0.19,
            fiveYear: 0.16,
            projected: 0.14
          },
          freeCashFlow: {
            oneYear: 0.20,
            threeYear: 0.17,
            fiveYear: 0.15,
            projected: 0.13
          },
          drivers: [
            { name: "Innovación", contribution: 0.35 },
            { name: "Expansión mercado", contribution: 0.25 },
            { name: "Adquisiciones", contribution: 0.20 },
            { name: "Eficiencia operativa", contribution: 0.15 },
            { name: "Otros", contribution: 0.05 }
          ]
        },
        riskMetrics: {
          beta: 1.25,
          volatility: 0.22,
          sharpeRatio: 1.3,
          maxDrawdown: 0.28,
          valueAtRisk: 0.04,
          correlations: [
            { name: "S&P 500", value: 0.82 },
            { name: "NASDAQ", value: 0.89 },
            { name: "Sector Tech", value: 0.93 },
            { name: "Bonos 10Y", value: -0.35 }
          ],
          riskFactors: [
            { 
              name: "Competencia", 
              level: "Medio", 
              description: "Competencia creciente en su segmento principal pero con ventajas competitivas sólidas." 
            },
            { 
              name: "Regulación", 
              level: "Alto", 
              description: "Riesgo elevado de cambios regulatorios que podrían afectar su modelo de negocio." 
            },
            { 
              name: "Tecnología", 
              level: "Bajo", 
              description: "Fuerte inversión en I+D y posición de liderazgo en innovación tecnológica." 
            },
            { 
              name: "Financiero", 
              level: "Bajo", 
              description: "Balance sólido con baja deuda y alta generación de caja." 
            }
          ]
        }
      };
      
      setValuationData(mockData);
      
      toast({
        title: "¡Datos obtenidos!",
        description: `Se han cargado los datos de valoración para ${formattedTicker}.`,
        variant: "default"
      });
    } catch (error: any) {
      console.error("Error en valoración de acciones:", error);
      const errorMessage = error?.message || "Error desconocido";
      
      setError(`No pudimos obtener los datos de valoración: ${errorMessage}. Por favor, verifica el ticker e intenta nuevamente.`);
      
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
          <Label htmlFor="ticker">Ticker</Label>
          <Input
            id="ticker"
            placeholder="AAPL"
            value={ticker}
            onChange={(e) => setTicker(e.target.value)}
            required
          />
          <p className="text-sm text-muted-foreground">
            Ingrese el símbolo de una acción pública (por ejemplo: AAPL, MSFT, GOOG).
          </p>
        </div>
        
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analizando...
            </>
          ) : (
            "Valorar Acción"
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
      
      {valuationData && (
        <StockValuationResults data={valuationData} />
      )}
    </div>
  );
};

export default StockValuationForm;
