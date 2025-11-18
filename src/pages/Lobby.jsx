import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { listarTreinadores } from '../services/treinadorService';
import { UserPlus, Swords, Trash2 } from 'lucide-react';

const Lobby = () => {
  const navigate = useNavigate();
  const [treinadores, setTreinadores] = useState([]);
  
  // Selecionados para a batalha
  const [player1, setPlayer1] = useState(null);
  const [player2, setPlayer2] = useState(null);

  useEffect(() => {
    carregarTreinadores();
  }, []);

  const carregarTreinadores = async () => {
    const response = await listarTreinadores();
    // Filtra apenas quem tem pokemons definidos (prontos para batalha)
    const prontos = response.data.filter(t => t.pokemons && t.pokemons.length > 0);
    setTreinadores(prontos);
  };

  const handleIniciarBatalha = () => {
    if (player1 && player2) {
      // Vamos passar os IDs na URL para a tela de batalha saber quem carregar
      navigate(`/batalha/${player1}/${player2}`);
    }
  };

  const limparDados = () => {
    if(confirm("Isso vai apagar todos os treinadores. Tem certeza?")) {
        localStorage.removeItem('db_treinadores');
        setTreinadores([]);
        setPlayer1(null);
        setPlayer2(null);
    }
  }

  return (
    <div className="full-screen-center" style={{ backgroundColor: '#2a2a2a', flexDirection: 'row' }}>
      
      {/* COLUNA DA ESQUERDA: Lista de Treinadores */}
      <div style={styles.listContainer}>
        <h2 style={{ marginBottom: '20px', color: '#FFDE00' }}>TREINADORES PRONTOS</h2>
        
        {treinadores.length === 0 ? (
            <p style={{fontSize: '10px', color: '#ccc'}}>Nenhum treinador pronto.<br/>Cadastre alguém e escolha um time!</p>
        ) : (
            <div style={styles.scrollList}>
            {treinadores.map(t => (
                <div key={t.id} style={styles.cardTreinador}>
                <div>
                    <span style={{color: '#DC0A2D'}}>{t.nome}</span>
                    <br/>
                    <span style={{fontSize: '10px', color: '#666'}}>{t.classe}</span>
                </div>
                <div style={{fontSize: '10px'}}>
                    {t.pokemons.length} POKÉMONS
                </div>
                </div>
            ))}
            </div>
        )}

        <button className="btn-pixel" onClick={() => navigate('/cadastro')} style={styles.btnAdd}>
          <UserPlus size={16} style={{marginRight: 10}}/> NOVO TREINADOR
        </button>

        <button onClick={limparDados} style={styles.btnReset}>
           <Trash2 size={14} /> Resetar Dados
        </button>
      </div>

      {/* COLUNA DA DIREITA: Setup da Batalha */}
      <div style={styles.vsContainer}>
        <h1 style={{fontSize: '40px', marginBottom: '40px', color: '#DC0A2D'}}>VS MODE</h1>

        <div style={styles.selectors}>
          {/* PLAYER 1 */}
          <div style={styles.playerBox}>
            <label>PLAYER 1</label>
            <select 
                style={styles.select} 
                onChange={(e) => setPlayer1(e.target.value)}
                defaultValue=""
            >
                <option value="" disabled>Selecione...</option>
                {treinadores.map(t => (
                    <option key={t.id} value={t.id} disabled={t.id == player2}>
                        {t.nome}
                    </option>
                ))}
            </select>
          </div>

          <Swords size={60} color="#FFDE00" />

          {/* PLAYER 2 */}
          <div style={styles.playerBox}>
            <label>PLAYER 2</label>
            <select 
                style={styles.select} 
                onChange={(e) => setPlayer2(e.target.value)}
                defaultValue=""
            >
                <option value="" disabled>Selecione...</option>
                {treinadores.map(t => (
                    <option key={t.id} value={t.id} disabled={t.id == player1}>
                        {t.nome}
                    </option>
                ))}
            </select>
          </div>
        </div>

        <button 
            className="btn-pixel" 
            style={{ 
                backgroundColor: (player1 && player2) ? '#DC0A2D' : '#555', 
                color: 'white',
                borderColor: 'white',
                marginTop: '40px'
            }}
            disabled={!player1 || !player2}
            onClick={handleIniciarBatalha}
        >
            FIGHT!
        </button>
      </div>

    </div>
  );
};

const styles = {
  listContainer: {
    width: '35%',
    height: '100%',
    backgroundColor: '#202020',
    borderRight: '4px solid white',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column'
  },
  scrollList: {
    flex: 1,
    overflowY: 'auto',
    marginBottom: '20px'
  },
  cardTreinador: {
    backgroundColor: '#fff',
    color: '#000',
    padding: '15px',
    marginBottom: '10px',
    border: '4px solid #444',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  btnAdd: {
    width: '100%',
    fontSize: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  btnReset: {
    background: 'transparent',
    border: 'none',
    color: '#666',
    marginTop: '10px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '10px'
  },
  vsContainer: {
    width: '65%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundImage: 'radial-gradient(#444 10%, #2a2a2a 90%)'
  },
  selectors: {
    display: 'flex',
    alignItems: 'center',
    gap: '30px'
  },
  playerBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '10px'
  },
  select: {
    padding: '15px',
    fontFamily: '"Press Start 2P", cursive',
    fontSize: '14px',
    border: '4px solid white',
    backgroundColor: '#222',
    color: 'white',
    width: '200px'
  }
};

export default Lobby;