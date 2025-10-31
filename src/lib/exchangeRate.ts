// Utility to fetch USD to BRL exchange rate from Brazilian Central Bank
export const fetchExchangeRate = async (date: Date): Promise<number | null> => {
  try {
    const formattedDate = date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).replace(/\//g, '-');

    const url = `https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata/CotacaoDolarDia(dataCotacao=@dataCotacao)?@dataCotacao='${formattedDate}'&$top=1&$format=json&$select=cotacaoCompra`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.value && data.value.length > 0) {
      return data.value[0].cotacaoCompra;
    }
    
    return null;
  } catch (error) {
    console.error('Erro ao buscar cotação:', error);
    return null;
  }
};

export const calculateProfitMargin = (salePrice: number, costPrice: number): number => {
  if (!costPrice || costPrice === 0) return 0;
  return ((salePrice - costPrice) / costPrice) * 100;
};
