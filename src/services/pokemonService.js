import api from './api';

// Lista todos os pokemons disponíveis no seu banco
export const listarPokemons = async () => {
  const response = await api.get('/pokemon');
  return response.data.result; // A doc diz que a lista está dentro de "result"
};

// Busca detalhes de um pokemon específico
export const getPokemonDetalhes = async (id) => {
  const response = await api.get(`/pokemon/${id}`);
  return response.data;
};

// Vincula um Pokemon a um Treinador (Captura)
export const capturarPokemon = async (idTreinador, idPokemon) => {
  return await api.post('/pokemon', {
    idTreinador: String(idTreinador),
    idPokemon: String(idPokemon)
  });
};

// Busca os tipos (opcional)
export const getTiposPokemon = async () => {
    return await api.get('/pokemon/tipo');
}