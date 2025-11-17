import api from './api';

const USAR_MOCK = true;

// Função auxiliar para simular banco de dados no navegador
const getMockDB = () => JSON.parse(localStorage.getItem('db_treinadores') || '[]');
const setMockDB = (data) => localStorage.setItem('db_treinadores', JSON.stringify(data));

// 1. Buscar Classes (sem alterações)
export const getClasses = async () => {
  if (USAR_MOCK) {
    return { data: [{ nome: 'Iniciante' }, { nome: 'Líder de Ginásio' }, { nome: 'Elite Four' }] };
  } else {
    return await api.get('/classes'); 
  }
};

// 2. Cadastrar Treinador (Agora salva na lista)
export const cadastrarTreinador = async (nome, classe) => {
  if (USAR_MOCK) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const db = getMockDB();
        const novoTreinador = {
          id: Date.now(), // ID único baseado no tempo
          nome,
          classe,
          pokemons: []
        };
        db.push(novoTreinador);
        setMockDB(db);
        
        resolve({ data: novoTreinador });
      }, 500);
    });
  } else {
    return await api.post('/treinador', { nome, classe });
  }
};

// 3. Salvar Time (Atualiza o treinador existente na lista)
export const salvarTime = async (treinadorId, pokemons) => {
  if (USAR_MOCK) {
    return new Promise((resolve) => {
      const db = getMockDB();
      const index = db.findIndex(t => t.id == treinadorId);
      
      if (index !== -1) {
        db[index].pokemons = pokemons.map(p => ({ 
          nome: p.name, 
          id: p.id, 
          sprite: p.sprite, // Salvamos a url da imagem pra facilitar
          hp: 100 // Já preparando para a batalha: Vida cheia!
        }));
        setMockDB(db);
      }
      resolve({ status: 200 });
    });
  } else {
    const payload = { treinadorId, pokemons: pokemons.map(p => ({ nome: p.name, id: p.id })) };
    return await api.post(`/treinador/${treinadorId}/pokemons`, payload);
  }
};

// 4. NOVA FUNÇÃO: Listar todos os treinadores (Para o Lobby)
export const listarTreinadores = async () => {
  if (USAR_MOCK) {
    return { data: getMockDB() };
  } else {
    return await api.get('/treinadores');
  }
};