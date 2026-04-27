import axios from 'axios';

const SELLFLUX_API_BASE = 'https://api.sellflux.com/v1';
// Use import.meta.env for Vite environment variables
const SELLFLUX_API_KEY = import.meta.env.VITE_SELLFLUX_API_KEY;

export const sellfluxClient = axios.create({
  baseURL: SELLFLUX_API_BASE,
  headers: {
    'Authorization': `Bearer ${SELLFLUX_API_KEY}`,
    'Content-Type': 'application/json',
  },
});

sellfluxClient.interceptors.response.use(
  response => response,
  error => {
    console.error('[sellfluxClient] ❌ ERRO na API SellFlux:', error.response?.data || error.message);
    throw error;
  }
);

export default sellfluxClient;
