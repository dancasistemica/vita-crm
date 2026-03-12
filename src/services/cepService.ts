import { toast } from 'sonner';

interface CEPResponse {
  cep: string;
  logradouro: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: boolean;
}

export async function fetchAddressByCEP(cep: string): Promise<CEPResponse | null> {
  const cleanCEP = cep.replace(/\D/g, '');

  if (cleanCEP.length !== 8) {
    console.log('[CEPService] CEP inválido:', cleanCEP);
    return null;
  }

  try {
    console.log('[CEPService] Buscando endereço para CEP:', cleanCEP);
    const response = await fetch(`https://viacep.com.br/ws/${cleanCEP}/json/`);
    const data: CEPResponse = await response.json();

    if (data.erro) {
      console.log('[CEPService] CEP não encontrado:', cleanCEP);
      toast.error('CEP não encontrado');
      return null;
    }

    console.log('[CEPService] Endereço encontrado:', data);
    return data;
  } catch (error) {
    console.error('[CEPService] Erro ao buscar CEP:', error);
    toast.error('Erro ao buscar CEP');
    return null;
  }
}

export function formatCEP(value: string): string {
  const clean = value.replace(/\D/g, '').slice(0, 8);
  if (clean.length <= 5) return clean;
  return `${clean.slice(0, 5)}-${clean.slice(5, 8)}`;
}
