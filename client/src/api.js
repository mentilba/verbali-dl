import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

export const getClienti   = (params) => api.get('/clienti', { params });
export const getCliente   = (id)     => api.get(`/clienti/${id}`);
export const createCliente = (data)  => api.post('/clienti', data);
export const updateCliente = (id, d) => api.put(`/clienti/${id}`, d);
export const deleteCliente = (id)    => api.delete(`/clienti/${id}`);
export const getKpi        = ()      => api.get('/kpi');
export const getImpostazioni = ()    => api.get('/impostazioni');
export const updateImpostazioni = (d)=> api.put('/impostazioni', d);
export const exportCsv     = ()      => window.open('/api/export/csv', '_blank');
