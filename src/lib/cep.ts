export interface CepData {
  cep: string;
  street: string;
  neighborhood: string;
  city: string;
  state: string;
}

export const fetchCep = async (cep: string): Promise<CepData | null> => {
  try {
    const cleanCep = cep.replace(/\D/g, '');
    
    if (cleanCep.length !== 8) {
      return null;
    }

    const response = await fetch(`https://brasilapi.com.br/api/cep/v1/${cleanCep}`);
    
    if (!response.ok) {
      throw new Error('CEP não encontrado');
    }

    const data = await response.json();
    
    return {
      cep: data.cep,
      street: data.street,
      neighborhood: data.neighborhood,
      city: data.city,
      state: data.state
    };
  } catch (error) {
    console.error('Error fetching CEP:', error);
    return null;
  }
};

export const formatCep = (value: string): string => {
  const cleanValue = value.replace(/\D/g, '');
  if (cleanValue.length <= 5) {
    return cleanValue;
  }
  return `${cleanValue.slice(0, 5)}-${cleanValue.slice(5, 8)}`;
};

export const BRAZILIAN_STATES = [
  { value: 'AC', label: 'Acre' },
  { value: 'AL', label: 'Alagoas' },
  { value: 'AP', label: 'Amapá' },
  { value: 'AM', label: 'Amazonas' },
  { value: 'BA', label: 'Bahia' },
  { value: 'CE', label: 'Ceará' },
  { value: 'DF', label: 'Distrito Federal' },
  { value: 'ES', label: 'Espírito Santo' },
  { value: 'GO', label: 'Goiás' },
  { value: 'MA', label: 'Maranhão' },
  { value: 'MT', label: 'Mato Grosso' },
  { value: 'MS', label: 'Mato Grosso do Sul' },
  { value: 'MG', label: 'Minas Gerais' },
  { value: 'PA', label: 'Pará' },
  { value: 'PB', label: 'Paraíba' },
  { value: 'PR', label: 'Paraná' },
  { value: 'PE', label: 'Pernambuco' },
  { value: 'PI', label: 'Piauí' },
  { value: 'RJ', label: 'Rio de Janeiro' },
  { value: 'RN', label: 'Rio Grande do Norte' },
  { value: 'RS', label: 'Rio Grande do Sul' },
  { value: 'RO', label: 'Rondônia' },
  { value: 'RR', label: 'Roraima' },
  { value: 'SC', label: 'Santa Catarina' },
  { value: 'SP', label: 'São Paulo' },
  { value: 'SE', label: 'Sergipe' },
  { value: 'TO', label: 'Tocantins' }
];
