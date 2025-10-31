// Utility to fetch USD to BRL exchange rate from Brazilian Central Bank
export const fetchExchangeRate = async (date: Date): Promise<number | null> => {
  try {
    // API do Banco Central requer formato MM-DD-YYYY
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    const formattedDate = `${month}-${day}-${year}`;

    const url = `https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata/CotacaoDolarDia(dataCotacao=@dataCotacao)?@dataCotacao='${formattedDate}'&$top=1&$format=json&$select=cotacaoCompra`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error('Erro na resposta da API:', response.status, response.statusText);
      // Tenta buscar cotação de dias anteriores (útil para fins de semana/feriados)
      return await fetchExchangeRateFallback(date);
    }
    
    const data = await response.json();
    
    if (data.value && data.value.length > 0 && data.value[0].cotacaoCompra) {
      return parseFloat(data.value[0].cotacaoCompra);
    }
    
    // Se não encontrou cotação para a data, tenta dias anteriores
    return await fetchExchangeRateFallback(date);
  } catch (error) {
    console.error('Erro ao buscar cotação:', error);
    // Tenta buscar cotação de dias anteriores
    return await fetchExchangeRateFallback(date);
  }
};

// Busca cotação de dias anteriores (útil para fins de semana/feriados)
const fetchExchangeRateFallback = async (originalDate: Date, daysBack: number = 5): Promise<number | null> => {
  for (let i = 1; i <= daysBack; i++) {
    try {
      const previousDate = new Date(originalDate);
      previousDate.setDate(previousDate.getDate() - i);
      
      const month = String(previousDate.getMonth() + 1).padStart(2, '0');
      const day = String(previousDate.getDate()).padStart(2, '0');
      const year = previousDate.getFullYear();
      const formattedDate = `${month}-${day}-${year}`;

      const url = `https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata/CotacaoDolarDia(dataCotacao=@dataCotacao)?@dataCotacao='${formattedDate}'&$top=1&$format=json&$select=cotacaoCompra`;
      
      const response = await fetch(url);
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.value && data.value.length > 0 && data.value[0].cotacaoCompra) {
          console.log(`Cotação encontrada para ${formattedDate} (${i} dia(s) antes)`);
          return parseFloat(data.value[0].cotacaoCompra);
        }
      }
    } catch (error) {
      // Continua tentando outras datas
      continue;
    }
  }
  
  return null;
};

export const calculateProfitMargin = (salePrice: number, costPrice: number): number => {
  if (!costPrice || costPrice === 0) return 0;
  return ((salePrice - costPrice) / costPrice) * 100;
};
