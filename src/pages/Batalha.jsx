import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { listarTreinadores } from '../services/treinadorService';
import { Swords } from 'lucide-react';

const Batalha = () => {
  const { player1Id, player2Id } = useParams();
  const navigate = useNavigate();

  // --- ESTADOS DO JOGO ---
  const [loading, setLoading] = useState(true);
  const [p1, setP1] = useState(null); // Objeto do Treinador 1
  const [p2, setP2] = useState(null); // Objeto do Treinador 2
  
  // Pokemons Ativos (Índice no array do time)
  const [activeP1Index, setActiveP1Index] = useState(0);
  const [activeP2Index, setActiveP2Index] = useState(0);

  // HP Atual (Separado do objeto original para não alterar o banco permanentemente ainda)
  const [hpP1, setHpP1] = useState(100);
  const [hpP2, setHpP2] = useState(100);

  const [dialogo, setDialogo] = useState("A batalha começou!");
  const [turno, setTurno] = useState('p1'); // 'p1' ou 'p2'

  // --- SETUP INICIAL ---
  useEffect(() => {
    const carregarDados = async () => {
      const response = await listarTreinadores();
      const todos = response.data;
      
      const t1 = todos.find(t => t.id == player1Id);
      const t2 = todos.find(t => t.id == player2Id);

      if (!t1 || !t2) {
        alert("Erro ao carregar treinadores!");
        navigate('/lobby');
        return;
      }

      setP1(t1);
      setP2(t2);
      
      // Reseta HP visual
      setHpP1(100); 
      setHpP2(100);
      
      setDialogo(`${t1.nome} desafiou ${t2.nome}!`);
      setLoading(false);
    };

    carregarDados();
  }, [player1Id, player2Id]);

  // --- LÓGICA DE BATALHA ---
  const realizarAtaque = () => {
    if (turno !== 'p1') return; // Bloqueia clique se não for sua vez

    // 1. Calcula Dano (Aleatório entre 10 e 25)
    const dano = Math.floor(Math.random() * 15) + 10;
    
    setDialogo(`${p1.pokemons[activeP1Index].nome} usou INVESTIDA!`);

    // 2. Aplica Dano no Inimigo visualmente
    setTimeout(() => {
      setHpP2(prev => Math.max(0, prev - dano));
      
      // Verifica se morreu
      if (hpP2 - dano <= 0) {
        setDialogo(`${p2.pokemons[activeP2Index].nome} desmaiou! Vitória de ${p1.nome}!`);
        // Aqui você poderia mostrar um botão "Voltar ao Lobby"
        return;
      }

      // 3. Passa a vez para o Inimigo (Automação simples por enquanto)
      setTurno('p2');
      setTimeout(contraAtaqueInimigo, 2000); // Inimigo ataca em 2 segundos
    }, 1000);
  };

  const contraAtaqueInimigo = () => {
    // Lógica simples de IA
    const dano = Math.floor(Math.random() * 15) + 10;
    
    setDialogo(`${p2.pokemons[activeP2Index].nome} inimigo atacou!`);

    setTimeout(() => {
      setHpP1(prev => Math.max(0, prev - dano));
      
      if (hpP1 - dano <= 0) {
         setDialogo(`${p1.pokemons[activeP1Index].nome} desmaiou... Você perdeu.`);
         return;
      }

      setTurno('p1'); // Devolve a vez
      setDialogo(`O que ${p1.pokemons[activeP1Index].nome} vai fazer?`);
    }, 1000);
  };

  if (loading) return <div className="full-screen-center">PREPARANDO ARENA...</div>;

  const activeP1 = p1.pokemons[activeP1Index];
  const activeP2 = p2.pokemons[activeP2Index];

  // Gera URL do sprite de costas dinamicamente
  const backSpriteUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/back/${activeP1.id}.png`;

  return (
    <div style={styles.arena}>
      
      {/* --- ÁREA DO INIMIGO (Topo Direita) --- */}
      <div style={styles.enemyArea}>
        <div style={styles.hudBox}>
          <span style={styles.nameText}>{activeP2.nome}</span>
          <div style={styles.hpContainer}>
            <div style={{...styles.hpBar, width: `${hpP2}%`, backgroundColor: getHpColor(hpP2)}}></div>
          </div>
        </div>
        <img src={activeP2.sprite} alt="Enemy" style={styles.enemySprite} />
      </div>

      {/* --- ÁREA DO JOGADOR (Fundo Esquerda) --- */}
      <div style={styles.playerArea}>
        <img src={backSpriteUrl} alt="Hero" style={styles.heroSprite} />
        <div style={styles.hudBox}>
          <span style={styles.nameText}>{activeP1.nome}</span>
          <div style={styles.hpContainer}>
            <div style={{...styles.hpBar, width: `${hpP1}%`, backgroundColor: getHpColor(hpP1)}}></div>
          </div>
          <span style={styles.hpText}>{hpP1}/100</span>
        </div>
      </div>

      {/* --- MENU DE BATALHA (Fundo) --- */}
      <div style={styles.menuArea}>
        <div style={styles.dialogBox}>
          <p>{dialogo}</p>
        </div>
        
        {/* Só mostra ações se for turno do Player 1 e ninguém morreu */}
        {turno === 'p1' && hpP1 > 0 && hpP2 > 0 && (
            <div style={styles.actionsBox}>
            <button className="btn-action" onClick={realizarAtaque}>
                LUTAR
            </button>
            <button className="btn-action" disabled style={{opacity: 0.5}}>
                POKÉMON
            </button>
            <button className="btn-action" disabled style={{opacity: 0.5}}>
                MOCHILA
            </button>
            <button className="btn-action" onClick={() => navigate('/lobby')}>
                FUGIR
            </button>
            </div>
        )}
      </div>
    </div>
  );
};

// Função auxiliar para cor da vida
const getHpColor = (hp) => {
  if (hp > 50) return '#4CAF50'; // Verde
  if (hp > 20) return '#FFDE00'; // Amarelo
  return '#DC0A2D'; // Vermelho
}

const styles = {
  arena: {
    width: '100vw',
    height: '100vh',
    backgroundColor: '#f8f9fa',
    backgroundImage: 'linear-gradient(to bottom, #85C1E9 0%, #85C1E9 40%, #58D68D 40%, #58D68D 100%)', // Céu e Grama simples
    position: 'relative',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column'
  },
  enemyArea: {
    position: 'absolute',
    top: '50px',
    right: '50px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end'
  },
  playerArea: {
    position: 'absolute',
    bottom: '180px', // Acima do menu
    left: '50px',
    display: 'flex',
    alignItems: 'flex-end'
  },
  enemySprite: {
    width: '200px',
    height: '200px',
    marginTop: '-30px',
    animation: 'float 3s ease-in-out infinite'
  },
  heroSprite: {
    width: '250px',
    height: '250px',
    marginRight: '30px'
  },
  hudBox: {
    backgroundColor: '#f8f8d8',
    border: '4px solid #333',
    padding: '10px 20px',
    borderRadius: '10px 0 10px 0', // Borda estilo Pokemon
    boxShadow: '5px 5px 0px rgba(0,0,0,0.2)',
    width: '250px'
  },
  nameText: {
    display: 'block',
    marginBottom: '5px',
    textTransform: 'uppercase',
    fontSize: '14px'
  },
  hpContainer: {
    width: '100%',
    height: '10px',
    backgroundColor: '#ccc',
    borderRadius: '5px',
    border: '2px solid #333',
    overflow: 'hidden'
  },
  hpBar: {
    height: '100%',
    transition: 'width 0.5s ease-out' // Animação suave da vida descendo
  },
  hpText: {
    fontSize: '10px',
    marginTop: '5px',
    display: 'block',
    textAlign: 'right'
  },
  menuArea: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: '150px',
    backgroundColor: '#2a2a2a',
    borderTop: '6px solid #FFDE00',
    display: 'flex',
    padding: '10px'
  },
  dialogBox: {
    flex: 2,
    backgroundColor: '#333', // Fundo escuro estilo Fire Red novo
    border: '4px solid #fff',
    borderRadius: '5px',
    padding: '20px',
    marginRight: '10px',
    color: 'white',
    fontSize: '18px',
    lineHeight: '1.5'
  },
  actionsBox: {
    flex: 1,
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '5px',
    backgroundColor: '#fff',
    border: '4px solid #333',
    padding: '5px'
  }
};

export default Batalha;