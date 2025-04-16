
// API utility functions

// Función para realizar llamadas a la API de Financial Modeling Prep
export const fetchFinancialData = async (endpoint: string, params: Record<string, string>) => {
  const url = new URL(endpoint);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, value);
  });
  
  try {
    console.log(`Fetching data from: ${url.toString()}`);
    const response = await fetch(url.toString());
    
    if (!response.ok) {
      console.error(`API error: ${response.status} - ${response.statusText} for ${url.toString()}`);
      
      // Manejo específico para error de límite de peticiones
      if (response.status === 429) {
        throw new Error("Se ha alcanzado el límite de peticiones de la API. Por favor, inténtalo más tarde.");
      }
      
      throw new Error(`API error: ${response.status} - ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Algunas APIs devuelven errores en el cuerpo de la respuesta a pesar de un status 200
    if (data.error || data["Error Message"]) {
      const errorMessage = data.error || data["Error Message"] || "Error desconocido en la respuesta";
      console.error(`API error in response body: ${errorMessage}`);
      throw new Error(`API error: ${errorMessage}`);
    }
    
    return data;
  } catch (error) {
    console.error(`API request failed for ${endpoint}:`, error);
    throw error;
  }
};

// Función para realizar llamadas a la API de Alpha Vantage
export const fetchAlphaVantageData = async (function_name: string, params: Record<string, string>) => {
  const url = new URL('https://www.alphavantage.co/query');
  url.searchParams.append('function', function_name);
  
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, value);
  });
  
  try {
    console.log(`Fetching Alpha Vantage data: ${url.toString()}`);
    const response = await fetch(url.toString());
    
    if (!response.ok) {
      console.error(`Alpha Vantage API error: ${response.status} - ${response.statusText}`);
      throw new Error(`API error: ${response.status} - ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Alpha Vantage a veces devuelve errores como "Invalid API call"
    if (data['Error Message'] || data['Information']) {
      const errorMessage = data['Error Message'] || data['Information'] || 'Unknown Alpha Vantage error';
      console.error(`Alpha Vantage API error: ${errorMessage}`);
      throw new Error(`Alpha Vantage API error: ${errorMessage}`);
    }
    
    return data;
  } catch (error) {
    console.error(`Alpha Vantage API request failed for ${function_name}:`, error);
    throw error;
  }
};
