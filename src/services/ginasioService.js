import api from './api';

export const listarGinasios = async () => {
  return await api.get('/ginasio');
};

export const getGinasioById = async (id) => {
  return await api.get(`/ginasio/${id}`);
};