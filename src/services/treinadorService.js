import api from './api';

export const getClasses = async () => {
  const response = await api.get('/classes-treinadores');
  // A API retorna um Map {"NOME": {bonus...}}, convertemos para Array
  const classesArray = Object.entries(response.data).map(([key, value]) => ({
    nome: key, 
    ...value
  }));
  return { data: classesArray };
};

export const cadastrarTreinador = async (nome, classeTreinador) => {
  // A doc pede "classeTreinador" no body
  return await api.post('/treinador', { nome, classeTreinador });
};

export const listarTreinadores = async () => {
  return await api.get('/treinador');
};

export const getTreinadorById = async (id) => {
  return await api.get(`/treinador/${id}`);
};