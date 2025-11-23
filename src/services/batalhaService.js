import api from './api';

export const registrarBatalha = async (idPokemons, idTreinadorGanhador, idGinasio) => {
  return await api.post('/batalha', {
    idPokemons,           // Array de Integers
    idTreinadorGanhador,  // UUID
    idGinasio             // UUID
  });
};