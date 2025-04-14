
import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { fetchStockValuation } from "@/lib/api/financeAPI";
import StockValuationResults from "./StockValuationResults";
import { Loader2 } from "lucide-react";

const StockValuationForm = () => {
  const [ticker, setTicker] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [valuationData, setValuationData] = useState<any>(null);
  
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
    
    setIsLoading(true);
    
    try {
      toast({
        title: "Conectando con API financiera",
        description: "Obteniendo datos de valoración para " + ticker.toUpperCase() + "...",
      });
      
      const data = await fetchStockValuation(ticker.toUpperCase());
      setValuationData(data);
      
      toast({
        title: "¡Datos obtenidos!",
        description: `Se han cargado los datos de valoración para ${ticker.toUpperCase()}.`,
        variant: "default"
      });
    } catch (error) {
      toast({
        title: "Error al obtener datos",
        description: "No pudimos obtener los datos de valoración. Por favor, verifica el ticker e intenta nuevamente.",
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
      
      {valuationData && (
        <StockValuationResults data={valuationData} />
      )}
    </div>
  );
};

export default StockValuationForm;
