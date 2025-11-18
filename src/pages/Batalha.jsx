import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { listarTreinadores } from '../services/treinadorService';
import pokeApi from '../services/pokeApi';
import axios from 'axios';
import battleBg from '../assets/battle_bg.png'; // Sua imagem de fundo

const Batalha = () => {
  const { player1Id, player2Id } = useParams();
  const navigate = useNavigate();

  // --- ESTADOS ---
  const [loading, setLoading] = useState(true);
  const [p1, setP1] = useState(null);
  const [p2, setP2] = useState(null);
  
  const [activeP1Index, setActiveP1Index] = useState(0);
  const [activeP2Index, setActiveP2Index] = useState(0);
  
  const [hpP1, setHpP1] = useState(100);
  const [hpP2, setHpP2] = useState(100);

  const [dialogo, setDialogo] = useState("Preparando a arena...");
  const [turno, setTurno] = useState('p1'); 
  const [menuFase, setMenuFase] = useState('principal'); 
  const [golpesP1, setGolpesP1] = useState([]); 

  // --- INICIALIZAÇÃO ---
  useEffect(() => {
    const inicializarBatalha = async () => {
      try {
        const response = await listarTreinadores();
        const todos = response.data;
        const t1 = todos.find(t => t.id == player1Id);
        const t2 = todos.find(t => t.id == player2Id);

        if (!t1 || !t2) { throw new Error("Treinadores não encontrados"); }

        setP1(t1);
        setP2(t2);
        setHpP1(100);
        setHpP2(100);

        // Carrega golpes do primeiro pokemon
        if (t1.pokemons.length > 0) {
            await carregarGolpes(t1.pokemons[0].nome);
        }

        setDialogo(`Batalha iniciada! ${t1.nome} vs ${t2.nome}`);
        setLoading(false);
      } catch (erro) {
        console.error(erro);
        navigate('/lobby');
      }
    };
    inicializarBatalha();
  }, [player1Id, player2Id]);

  // --- CARREGAR GOLPES ---
  const carregarGolpes = async (pokemonNome) => {
    try {
      setDialogo(`Analisando ${pokemonNome}...`);
      const resp = await pokeApi.get(`/pokemon/${pokemonNome.toLowerCase()}`);
      const primeirosGolpes = resp.data.moves.slice(0, 4);

      const promessasDetalhadas = primeirosGolpes.map(async (m) => {
        const detalheResp = await axios.get(m.move.url);
        return {
            nome: m.move.name.replace('-', ' '),
            poder: detalheResp.data.power || 15,
            tipo: detalheResp.data.type.name
        };
      });

      const golpesProntos = await Promise.all(promessasDetalhadas);
      setGolpesP1(golpesProntos);
      setDialogo("Sua vez!");
    } catch (error) {
        setGolpesP1([{ nome: "Tackle", poder: 20, tipo: "normal" }]);
    }
  };

  // --- LÓGICA: ATAQUE DO JOGADOR ---
  const handleUsarGolpe = (golpe) => {
    setMenuFase('principal'); 
    
    const fatorSorte = (Math.floor(Math.random() * 15) + 85) / 100; 
    const danoFinal = Math.floor(golpe.poder * 0.5 * fatorSorte); 
    
    setDialogo(`${p1.pokemons[activeP1Index].nome} usou ${golpe.nome.toUpperCase()}!`);

    // 1. Aplica o dano
    setTimeout(() => {
      const novoHpInimigo = Math.max(0, hpP2 - danoFinal);
      setHpP2(novoHpInimigo);

      // 2. Verifica se matou
      if (novoHpInimigo <= 0) {
        verificarVitoriaOuTroca();
      } else {
        // Se não matou, passa a vez
        setTurno('p2');
        setTimeout(contraAtaqueInimigo, 2000);
      }
    }, 1000);
  };

  // --- LÓGICA: INIMIGO DESMAIOU? ---
  const verificarVitoriaOuTroca = () => {
    const pokemonMorto = p2.pokemons[activeP2Index].nome;
    setDialogo(`${pokemonMorto} desmaiou!`);

    setTimeout(() => {
      const proximoIndex = activeP2Index + 1;
      
      // Tem mais pokemons?
      if (proximoIndex < p2.pokemons.length) {
        // TROCA DE POKEMON INIMIGO
        setActiveP2Index(proximoIndex);
        setHpP2(100); // Vida cheia para o novo
        const novoPoke = p2.pokemons[proximoIndex].nome;
        setDialogo(`${p2.nome} enviou ${novoPoke}!`);
        
        // Volta a vez para o player atacar o novo pokemon
        setTurno('p1'); 
      } else {
        // VITÓRIA FINAL
        setDialogo(`Vitória! ${p1.nome} venceu a batalha!`);
        setTimeout(() => navigate('/lobby'), 4000);
      }
    }, 2000);
  };

  // --- LÓGICA: ATAQUE DO INIMIGO ---
  const contraAtaqueInimigo = () => {
    const danoInimigo = Math.floor(Math.random() * 25) + 10; 
    setDialogo(`${p2.pokemons[activeP2Index].nome} inimigo atacou!`);

    setTimeout(() => {
      const novoHpPlayer = Math.max(0, hpP1 - danoInimigo);
      setHpP1(novoHpPlayer);
      
      if (novoHpPlayer <= 0) {
         verificarDerrotaOuTroca();
      } else {
         setTurno('p1');
         setDialogo(`O que ${p1.pokemons[activeP1Index].nome} vai fazer?`);
      }
    }, 1000);
  };

  // --- LÓGICA: JOGADOR DESMAIOU? ---
  const verificarDerrotaOuTroca = () => {
    const pokemonMorto = p1.pokemons[activeP1Index].nome;
    setDialogo(`${pokemonMorto} desmaiou...`);

    setTimeout(() => {
      const proximoIndex = activeP1Index + 1;

      if (proximoIndex < p1.pokemons.length) {
        // TROCA DE POKEMON PLAYER
        const novoPoke = p1.pokemons[proximoIndex].nome;
        setActiveP1Index(proximoIndex);
        setHpP1(100);
        setDialogo(`Vai, ${novoPoke}!`);
        
        // Importante: Carregar os golpes do novo pokemon!
        carregarGolpes(novoPoke);
        
        setTurno('p1'); // Player começa atacando com o novo
      } else {
        // DERROTA FINAL
        setDialogo(`Você perdeu... Tente novamente.`);
        setTimeout(() => navigate('/lobby'), 4000);
      }
    }, 2000);
  };

  if (loading) return <div className="full-screen-center" style={{backgroundColor:'#000', color:'white'}}>CARREGANDO...</div>;

  const activeP1 = p1.pokemons[activeP1Index];
  const activeP2 = p2.pokemons[activeP2Index];
  const backSpriteUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/back/${activeP1.id}.png`;

  return (
    <div style={styles.arena}>
      
      {/* HUD INIMIGO */}
      <div style={styles.enemyArea}>
        <div style={styles.hudBox}>
          <span style={styles.nameText}>{activeP2.nome}</span>
          <div style={styles.hpContainer}>
            <div style={{...styles.hpBar, width: `${hpP2}%`, backgroundColor: getHpColor(hpP2)}}></div>
          </div>
        </div>
        <img src={activeP2.sprite} alt="Enemy" style={styles.enemySprite} />
      </div>

      {/* HUD PLAYER */}
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

      {/* MENU */}
      <div style={styles.menuArea}>
        <div style={styles.dialogBox}>
          <p>{dialogo}</p>
        </div>
        
        {turno === 'p1' && hpP1 > 0 && hpP2 > 0 && (
            <>
                {menuFase === 'principal' ? (
                    <div style={styles.actionsBox}>
                        <button className="btn-action" onClick={() => setMenuFase('ataques')}>LUTAR</button>
                        <button className="btn-action" style={{color:'#aaa'}}>POKÉMON</button>
                        <button className="btn-action" style={{color:'#aaa'}}>MOCHILA</button>
                        <button className="btn-action" onClick={() => navigate('/lobby')}>FUGIR</button>
                    </div>
                ) : (
                    <div style={styles.movesGrid}>
                        {golpesP1.map((golpe, idx) => (
                            <button key={idx} className="btn-move" onClick={() => handleUsarGolpe(golpe)}>
                                {golpe.nome} 
                                <span style={{fontSize:'8px', marginTop:'4px', color:'#555'}}>{golpe.tipo}</span>
                            </button>
                        ))}
                        <button style={{...styles.btnMove, backgroundColor: '#ddd'}} onClick={() => setMenuFase('principal')}>VOLTAR</button>
                    </div>
                )}
            </>
        )}
      </div>
    </div>
  );
};

const getHpColor = (hp) => {
  if (hp > 50) return '#4CAF50';
  if (hp > 20) return '#FFDE00';
  return '#DC0A2D';
}

const styles = {
  arena: {
    width: '100vw',
    height: '100vh',
    position: 'relative',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: 'black', 
    backgroundImage: `url(${battleBg})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center bottom',
    backgroundRepeat: 'no-repeat',
    imageRendering: 'pixelated'
  },
  enemyArea: { position: 'absolute', top: '120px', right: '60px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' },
  playerArea: { position: 'absolute', bottom: '180px', left: '60px', display: 'flex', alignItems: 'flex-end' },
  
  // Sprites grandes
  enemySprite: { width: '280px', height: '280px', marginTop: '-20px', marginRight: '40px', animation: 'float 3s ease-in-out infinite', filter: 'drop-shadow(5px 10px 10px rgba(0,0,0,0.5))' },
  heroSprite: { width: '380px', height: '380px', marginBottom: '-20px', marginLeft: '40px', filter: 'drop-shadow(5px 10px 10px rgba(0,0,0,0.5))' },

  hudBox: { backgroundColor: '#f8f8d8', border: '4px solid #333', padding: '10px 20px', borderRadius: '10px 0 10px 0', boxShadow: '6px 6px 0px rgba(0,0,0,0.3)', width: '280px', zIndex: 5 },
  nameText: { display: 'block', marginBottom: '8px', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '16px', color: '#000' },
  hpContainer: { width: '100%', height: '12px', backgroundColor: '#555', borderRadius: '6px', border: '2px solid #222', overflow: 'hidden' },
  hpBar: { height: '100%', transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)' },
  hpText: { fontSize: '12px', marginTop: '5px', display: 'block', textAlign: 'right', color: '#333' },
  menuArea: { position: 'absolute', bottom: 0, width: '100%', height: '160px', backgroundColor: '#2a2a2a', borderTop: '6px solid #FFDE00', display: 'flex', padding: '15px', boxShadow: '0 -5px 20px rgba(0,0,0,0.5)' },
  dialogBox: { flex: 2, backgroundColor: 'rgba(0, 0, 0, 0.8)', border: '4px solid #fff', borderRadius: '8px', padding: '25px', marginRight: '15px', color: 'white', fontSize: '20px', lineHeight: '1.5', textShadow: '2px 2px 0 #000' },
  actionsBox: { flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', backgroundColor: '#fff', border: '4px solid #333', padding: '8px', borderRadius: '4px' },
  movesGrid: { flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', backgroundColor: '#222', border: '4px solid #DC0A2D', padding: '8px', borderRadius: '4px' },
  btnMove: { display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', fontFamily: '"Press Start 2P", cursive', fontSize: '10px', backgroundColor: '#f0f0f0', border: '2px solid #555' }
};

export default Batalha;