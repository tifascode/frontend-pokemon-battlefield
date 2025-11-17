import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import pokeApi from '../services/pokeApi';
import { salvarTime } from '../services/treinadorService';
import { Swords, Save } from 'lucide-react';

const SelecaoTime = () => {
  const navigate = useNavigate();
  
  // Estados
  const [todosPokemons, setTodosPokemons] = useState([]);
  const [meuTime, setMeuTime] = useState([]);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);

  // Carregar os 151 primeiros pokemons (Geração 1 / Fire Red)
  useEffect(() => {
    const carregarPokemons = async () => {
      try {
        const response = await pokeApi.get('/pokemon?limit=151');
        // Adicionamos o ID manualmente para facilitar pegar a imagem depois
        const listaMapeada = response.data.results.map((poke, index) => ({
          ...poke,
          id: index + 1,
          sprite: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${index + 1}.png`
        }));
        setTodosPokemons(listaMapeada);
      } catch (error) {
        console.error("Erro ao carregar pokemons", error);
        alert("Erro ao conectar na PokéAPI");
      } finally {
        setLoading(false);
      }
    };
    carregarPokemons();
  }, []);

  // Função para adicionar ou remover do time
  const togglePokemon = (pokemon) => {
    const jaEstaNoTime = meuTime.some(p => p.id === pokemon.id);

    if (jaEstaNoTime) {
      // Remove do time
      setMeuTime(meuTime.filter(p => p.id !== pokemon.id));
    } else {
      // Adiciona ao time (se tiver espaço)
      if (meuTime.length >= 6) {
        alert("Seu time já está cheio! (Máximo 6)");
        return;
      }
      setMeuTime([...meuTime, pokemon]);
    }
  };

  // Salvar e ir para o mapa
  const handleSalvarTime = async () => {
    if (meuTime.length === 0) {
      alert("Escolha pelo menos 1 Pokémon!");
      return;
    }

    setSalvando(true);
    try {
    const treinadorId = localStorage.getItem('treinadorId');
    await salvarTime(treinadorId, meuTime);
    
    // MUDANÇA AQUI: Vai para o Lobby em vez de Ginasios
    navigate('/lobby'); 
    
    } catch (error) {
      alert("Erro ao salvar time");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div style={styles.container}>
      
      {/* --- BARRA LATERAL (SEU TIME) --- */}
      <div style={styles.sidebar}>
        <h2 style={styles.sidebarTitle}>SEU TIME</h2>
        <p style={{ marginBottom: '20px', fontSize: '14px' }}>{meuTime.length} / 6</p>

        <div style={styles.timeGrid}>
          {meuTime.map(poke => (
            <div key={poke.id} style={styles.miniCard}>
              <img src={poke.sprite} alt={poke.name} style={{ width: '60px', height: '60px' }} />
            </div>
          ))}
          {/* Slots vazios para completar visualmente os 6 espaços */}
          {[...Array(6 - meuTime.length)].map((_, i) => (
            <div key={i} style={styles.emptySlot}></div>
          ))}
        </div>

        <button 
          className="btn-pixel" 
          onClick={handleSalvarTime}
          disabled={salvando || meuTime.length === 0}
          style={styles.saveButton}
        >
           {salvando ? 'SALVANDO...' : 'PRONTO'}
        </button>
      </div>

      {/* --- ÁREA PRINCIPAL (LISTA DE POKEMONS) --- */}
      <div style={styles.mainArea}>
        <h1 style={styles.mainTitle}>ESCOLHA SEUS PARCEIROS</h1>
        
        {loading ? (
          <p>CARREGANDO POKEDEX...</p>
        ) : (
          <div style={styles.grid}>
            {todosPokemons.map(poke => {
              const isSelected = meuTime.some(p => p.id === poke.id);
              return (
                <div 
                  key={poke.id} 
                  onClick={() => togglePokemon(poke)}
                  style={{
                    ...styles.card,
                    backgroundColor: isSelected ? '#98ff98' : 'white', // Verde se selecionado
                    borderColor: isSelected ? '#006400' : '#333',
                    transform: isSelected ? 'translate(4px, 4px)' : 'none',
                    boxShadow: isSelected ? 'none' : '6px 6px 0px #000'
                  }}
                >
                  <img src={poke.sprite} alt={poke.name} style={styles.sprite} />
                  <span style={styles.pokeName}>{poke.name}</span>
                  <span style={styles.pokeId}>#{poke.id}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    height: '100vh',
    width: '100vw',
    backgroundColor: '#202020',
  },
  sidebar: {
    width: '300px',
    backgroundColor: '#DC0A2D', // Vermelho Pokedex
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    borderRight: '6px solid #000',
    zIndex: 10
  },
  sidebarTitle: {
    fontSize: '20px',
    marginTop: '20px',
    textShadow: '2px 2px #000'
  },
  timeGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '10px',
    marginBottom: 'auto', // Empurra o botão para baixo
    marginTop: '20px'
  },
  miniCard: {
    backgroundColor: 'white',
    border: '4px solid #000',
    width: '80px',
    height: '80px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '5px'
  },
  emptySlot: {
    backgroundColor: '#a0051e',
    border: '4px dashed #000',
    width: '80px',
    height: '80px',
    opacity: 0.5,
    borderRadius: '5px'
  },
  saveButton: {
    width: '100%',
    fontSize: '16px',
    padding: '15px',
    backgroundColor: '#4CAF50', // Verde confirmar
    color: 'black',
    marginBottom: '20px'
  },
  mainArea: {
    flex: 1,
    padding: '40px',
    overflowY: 'auto', // Permite rolar a lista de pokemons
    backgroundColor: '#f8f9fa'
  },
  mainTitle: {
    color: 'black',
    fontSize: '30px',
    marginBottom: '30px',
    textAlign: 'center',
    textTransform: 'uppercase'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', // Responsivo
    gap: '20px',
    paddingBottom: '50px'
  },
  card: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '15px',
    border: '4px solid #333',
    cursor: 'pointer',
    transition: 'all 0.1s',
    borderRadius: '8px'
  },
  sprite: {
    width: '100px', // Imagem grande
    height: '100px',
    marginBottom: '10px'
  },
  pokeName: {
    fontSize: '12px',
    textTransform: 'uppercase',
    marginBottom: '5px'
  },
  pokeId: {
    fontSize: '10px',
    color: '#666'
  }
};

export default SelecaoTime;