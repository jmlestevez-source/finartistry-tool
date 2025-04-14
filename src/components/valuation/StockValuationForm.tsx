
import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { fetchStockValuation } from "@/lib/api/financeAPI";
import StockValuationResults from "./StockValuationResults";

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
      const data = await fetchStockValuation(ticker.toUpperCase());
      setValuationData(data);
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
        </div>
        
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Analizando..." : "Valorar Acción"}
        </Button>
      </form>
      
      {valuationData && (
        <StockValuationResults data={valuationData} />
      )}
    </div>
  );
};

export default StockValuationForm;
