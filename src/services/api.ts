import axios from 'axios';

export const api = axios.create({
  baseURL: 'https://api-lumi-production.up.railway.app',
});
