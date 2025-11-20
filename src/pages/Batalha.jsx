import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { listarTreinadores } from '../services/treinadorService';
import pokeApi from '../services/pokeApi';
import axios from 'axios';
import battleBg from '../assets/battle_bg2.gif';

const Batalha = () => {
  const { player1Id, player2Id } = useParams();
  const navigate = useNavigate();

  // --- ESTADOS ---
  const [loading, setLoading] = useState(true);
  const [p1, setP1] = useState(null);
  const [p2, setP2] = useState(null);
  
  const [activeP1Index, setActiveP1Index] = useState(0);
  const [activeP2Index, setActiveP2Index] = useState(0);
  
  // HP Visual (Barras)
  const [hpP1, setHpP1] = useState(100);
  const [hpP2, setHpP2] = useState(100);

  const [dialogo, setDialogo] = useState("Preparando a arena...");
  const [turno, setTurno] = useState('p1'); 
  const [menuFase, setMenuFase] = useState('principal'); 
  const [golpesP1, setGolpesP1] = useState([]); 

  // --- ESTADOS DE ANIMAÇÃO ---
  const [showPlayerAttack, setShowPlayerAttack] = useState(false);
  const [showEnemyAttack, setShowEnemyAttack] = useState(false);
  const [playerDamaged, setPlayerDamaged] = useState(false);
  const [enemyDamaged, setEnemyDamaged] = useState(false);
  const [playerFlash, setPlayerFlash] = useState(false); 
  const [enemyFlash, setEnemyFlash] = useState(false);   

  // --- INICIALIZAÇÃO ---
  useEffect(() => {
    const inicializarBatalha = async () => {
      try {
        const response = await listarTreinadores();
        const todos = response.data;
        const t1 = todos.find(t => t.id == player1Id);
        const t2 = todos.find(t => t.id == player2Id);

        if (!t1 || !t2) { throw new Error("Treinadores não encontrados"); }

        // CORREÇÃO 1: Inicializar HP de todos os pokemons
        // Adicionamos a propriedade .hpAtual para cada um
        t1.pokemons = t1.pokemons.map(p => ({ ...p, hpAtual: 100 }));
        t2.pokemons = t2.pokemons.map(p => ({ ...p, hpAtual: 100 }));

        setP1(t1);
        setP2(t2);
        
        // Define HP visual inicial
        setHpP1(100);
        setHpP2(100);

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

  // --- HELPER: ATUALIZAR HP REAL ---
  // Essa função garante que o objeto P1 seja atualizado, não só a barra visual
  const aplicarDanoP1 = (dano) => {
    const novoHp = Math.max(0, hpP1 - dano);
    setHpP1(novoHp);
    
    // Atualiza o objeto profundo
    const novoP1 = { ...p1 };
    novoP1.pokemons[activeP1Index].hpAtual = novoHp;
    setP1(novoP1);
    
    return novoHp;
  };

  const aplicarDanoP2 = (dano) => {
    const novoHp = Math.max(0, hpP2 - dano);
    setHpP2(novoHp);
    
    // Atualiza o objeto profundo
    const novoP2 = { ...p2 };
    novoP2.pokemons[activeP2Index].hpAtual = novoHp;
    setP2(novoP2);
    
    return novoHp;
  };

  // --- CARREGAR GOLPES ---
  const carregarGolpes = async (pokemonNome) => {
    try {
      setDialogo(`Preparando ${pokemonNome}...`);
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

  // --- AÇÃO: TROCAR POKÉMON ---
  const handleTrocarPokemon = (novoIndex) => {
    const novoPokeObj = p1.pokemons[novoIndex];
    
    // CORREÇÃO 2: Verificar se o pokemon alvo está vivo antes de trocar (segurança extra)
    if (novoPokeObj.hpAtual <= 0) {
        setDialogo(`${novoPokeObj.nome} está desmaiado!`);
        return;
    }

    setDialogo(`Vai, ${novoPokeObj.nome}!`);
    setActiveP1Index(novoIndex);
    
    // CORREÇÃO 3: Carregar o HP REAL do novo pokemon, em vez de resetar para 100
    setHpP1(novoPokeObj.hpAtual);
    
    carregarGolpes(novoPokeObj.nome);
    
    setMenuFase('principal');
    setTurno('p1');
  };

  // --- AÇÃO: JOGADOR ATACA ---
  const handleUsarGolpe = (golpe) => {
    setMenuFase('principal'); 
    const fatorSorte = (Math.floor(Math.random() * 15) + 85) / 100; 
    const danoFinal = Math.floor(golpe.poder * 0.5 * fatorSorte); 
    
    setDialogo(`${p1.pokemons[activeP1Index].nome} usou ${golpe.nome.toUpperCase()}!`);

    setShowPlayerAttack(true); 

    setTimeout(() => {
      setShowPlayerAttack(false); 
      setEnemyDamaged(true); 
      setEnemyFlash(true); 

      // USA A NOVA FUNÇÃO DE DANO
      const novoHpInimigo = aplicarDanoP2(danoFinal);

      setTimeout(() => {
          setEnemyDamaged(false);
          setEnemyFlash(false); 
      }, 300); 

      if (novoHpInimigo <= 0) {
        verificarVitoriaOuTrocaInimigo();
      } else {
        setTurno('p2');
        setTimeout(contraAtaqueInimigo, 2000);
      }
    }, 800); 
  };

  // --- LÓGICA: INIMIGO DESMAIOU ---
  const verificarVitoriaOuTrocaInimigo = () => {
    const pokemonMorto = p2.pokemons[activeP2Index].nome;
    setDialogo(`${pokemonMorto} desmaiou!`);

    setTimeout(() => {
      // Procura o próximo pokemon vivo do inimigo
      // (Lógica simples: pega o próximo da lista. Num jogo real, a IA escolheria)
      const proximoIndex = activeP2Index + 1;
      
      if (proximoIndex < p2.pokemons.length) {
        setActiveP2Index(proximoIndex);
        
        // Recupera HP do próximo inimigo (como inicializamos com 100, deve estar 100)
        setHpP2(p2.pokemons[proximoIndex].hpAtual);
        
        const novoPoke = p2.pokemons[proximoIndex].nome;
        setDialogo(`${p2.nome} enviou ${novoPoke}!`);
        setTurno('p1'); 
      } else {
        setDialogo(`Vitória! ${p1.nome} venceu a batalha!`);
        setTimeout(() => navigate('/lobby'), 4000);
      }
    }, 2000);
  };

  // --- LÓGICA: PLAYER DESMAIOU ---
  const verificarDerrotaOuTrocaPlayer = () => {
    const pokemonMorto = p1.pokemons[activeP1Index].nome;
    setDialogo(`${pokemonMorto} desmaiou...`);

    setTimeout(() => {
        // Verifica se existe algum pokemon no time com HP > 0
        const temPokemonVivo = p1.pokemons.some(p => p.hpAtual > 0);

        if (temPokemonVivo) {
            setDialogo("Escolha seu próximo Pokémon!");
            setMenuFase('troca'); 
        } else {
            setDialogo(`Você não tem mais Pokémons... Derrota.`);
            setTimeout(() => navigate('/lobby'), 4000);
        }
    }, 2000);
  };

  // --- AÇÃO: INIMIGO ATACA ---
  const contraAtaqueInimigo = () => {
    const danoInimigo = Math.floor(Math.random() * 25) + 10; 
    setDialogo(`${p2.pokemons[activeP2Index].nome} inimigo atacou!`);

    setShowEnemyAttack(true);

    setTimeout(() => {
      setShowEnemyAttack(false); 
      setPlayerDamaged(true); 
      setPlayerFlash(true); 

      // USA A NOVA FUNÇÃO DE DANO
      const novoHpPlayer = aplicarDanoP1(danoInimigo);
      
      setTimeout(() => {
          setPlayerDamaged(false);
          setPlayerFlash(false); 
      }, 300);

      if (novoHpPlayer <= 0) {
         verificarDerrotaOuTrocaPlayer();
      } else {
         setTurno('p1');
         setDialogo(`O que ${p1.pokemons[activeP1Index].nome} vai fazer?`);
      }
    }, 800); 
  };

  if (loading) return <div className="full-screen-center" style={{backgroundColor:'#000', color:'white'}}>CARREGANDO...</div>;

  const activeP1 = p1.pokemons[activeP1Index];
  const activeP2 = p2.pokemons[activeP2Index];
  const backSpriteUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/back/${activeP1.id}.png`;

  return (
    <div style={styles.arena}>
      
      <div style={styles.enemyArea}>
        <div style={styles.hudBox}>
          <span style={styles.nameText}>{activeP2.nome}</span>
          <div style={styles.hpContainer}>
            <div style={{...styles.hpBar, width: `${hpP2}%`, backgroundColor: getHpColor(hpP2)}}></div>
          </div>
        </div>
        <img 
            src={activeP2.sprite} 
            alt="Enemy" 
            style={styles.enemySprite} 
            className={`idle-float ${enemyDamaged ? 'damaged-animation' : ''} ${enemyFlash ? 'flash-animation' : ''}`} 
        />
      </div>

      <div style={styles.playerArea}>
        <img 
            src={backSpriteUrl} 
            alt="Hero" 
            style={styles.heroSprite} 
            className={`${playerDamaged ? 'damaged-animation' : ''} ${playerFlash ? 'flash-animation' : ''}`} 
        />
        <div style={styles.hudBox}>
          <span style={styles.nameText}>{activeP1.nome}</span>
          <div style={styles.hpContainer}>
            <div style={{...styles.hpBar, width: `${hpP1}%`, backgroundColor: getHpColor(hpP1)}}></div>
          </div>
          <span style={styles.hpText}>{hpP1}/100</span>
        </div>
      </div>

      {showPlayerAttack && (
        <div className="attack-ray player-attack-ray" style={{ left: '200px', bottom: '300px', backgroundColor: 'rgba(255, 255, 0, 0.8)' }}></div>
      )}

      {showEnemyAttack && (
        <div className="attack-ray enemy-attack-ray" style={{ right: '200px', top: '200px', backgroundColor: 'rgba(255, 0, 0, 0.8)' }}></div>
      )}

      <div style={styles.menuArea}>
        <div style={styles.dialogBox}>
          <p>{dialogo}</p>
        </div>
        
        {menuFase === 'troca' ? (
            <div style={styles.movesGrid}>
                {p1.pokemons.map((poke, idx) => {
                    // Verifica se está morto baseado na propriedade hpAtual
                    const isFainted = poke.hpAtual <= 0;
                    const isActive = idx === activeP1Index;

                    return (
                        <button 
                            key={idx} 
                            className="btn-move" 
                            disabled={isActive || isFainted} // Desabilita se for o atual OU se estiver morto
                            onClick={() => handleTrocarPokemon(idx)}
                            style={{
                                backgroundColor: (isActive || isFainted) ? '#555' : '#fff',
                                color: (isActive || isFainted) ? '#888' : '#000',
                                cursor: (isActive || isFainted) ? 'not-allowed' : 'pointer'
                            }}
                        >
                            {poke.nome} 
                            {isFainted && " (MORTO)"}
                            {isActive && " (ATUAL)"}
                        </button>
                    );
                })}
            </div>
        ) : (
            <>
                {turno === 'p1' && hpP1 > 0 && hpP2 > 0 && (
                    <>
                        {menuFase === 'principal' ? (
                            <div style={styles.actionsBox}>
                                <button className="btn-action" onClick={() => setMenuFase('ataques')}>LUTAR</button>
                                <button className="btn-action" onClick={() => setMenuFase('troca')}>POKÉMON</button> 
                                <button className="btn-action" style={{color:'#aaa'}}>MOCHILA</button>
                                <button className="btn-action" onClick={() => navigate('/lobby')}>FUGIR</button>
                            </div>
                        ) : (
                            <div style={styles.movesGrid}>
                                {golpesP1.map((golpe, idx) => (
                                    <button key={idx} className="btn-move" onClick={() => handleUsarGolpe(golpe)}>
                                        {golpe.nome} <span style={{fontSize:'8px', color:'#555'}}>{golpe.tipo}</span>
                                    </button>
                                ))}
                                <button style={{...styles.btnMove, backgroundColor: '#ddd'}} onClick={() => setMenuFase('principal')}>VOLTAR</button>
                            </div>
                        )}
                    </>
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
    width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', backgroundColor: 'black', 
    backgroundImage: `url(${battleBg})`, backgroundSize: 'cover', backgroundPosition: 'center bottom', backgroundRepeat: 'no-repeat', imageRendering: 'pixelated'
  },
  enemyArea: { position: 'absolute', top: '120px', right: '60px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' },
  playerArea: { position: 'absolute', bottom: '180px', left: '60px', display: 'flex', alignItems: 'flex-end' },
  enemySprite: { width: '280px', height: '280px', marginTop: '-20px', marginRight: '40px', filter: 'drop-shadow(5px 10px 10px rgba(0,0,0,0.5))' },
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