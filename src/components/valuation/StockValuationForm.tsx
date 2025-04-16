
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
      // Placeholder for actual API call - this service is no longer available
      const data = { ticker: formattedTicker, price: 0, metrics: {} };
      console.log("Datos recibidos:", data);
      
      setValuationData(data);
      
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
