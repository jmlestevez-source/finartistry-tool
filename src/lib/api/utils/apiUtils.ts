
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
      throw new Error(`API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("API request failed:", error);
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
      throw new Error(`API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Alpha Vantage API request failed:", error);
    throw error;
  }
};
