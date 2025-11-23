import api from './api';

export const listarPokemons = async () => {
  const response = await api.get('/pokemon');
  return response.data.result; // A doc diz que a lista está em "result"
};

export const capturarPokemon = async (idTreinador, idPokemon) => {
  // A doc pede IDs como String no body
  return await api.post('/pokemon', {
    idTreinador: String(idTreinador),
    idPokemon: String(idPokemon)
  });
};