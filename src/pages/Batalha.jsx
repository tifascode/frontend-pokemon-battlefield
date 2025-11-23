import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTreinadorById } from '../services/treinadorService';
import { getGinasioById } from '../services/ginasioService';
import { registrarBatalha } from '../services/batalhaService';
import battleBg from '../assets/battle_bg.png'; // Fallback se o ginásio não tiver imagem

const Batalha = () => {
  // Recebe IDs da URL (Players e Ginásio)
  const { player1Id, player2Id, ginasioId } = useParams();
  const navigate = useNavigate();

  // --- ESTADOS DE DADOS (BACKEND) ---
  const [loading, setLoading] = useState(true);
  const [p1, setP1] = useState(null);
  const [p2, setP2] = useState(null);
  const [ginasio, setGinasio] = useState(null);

  // Índices dos Pokemons Ativos
  const [activeP1Index, setActiveP1Index] = useState(0);
  const [activeP2Index, setActiveP2Index] = useState(0);

  // HP Visual e Máximo
  const [hpP1, setHpP1] = useState(100);
  const [hpP2, setHpP2] = useState(100);
  const [maxHpP1, setMaxHpP1] = useState(100);
  const [maxHpP2, setMaxHpP2] = useState(100);

  // --- ESTADOS DE INTERFACE ---
  const [dialogo, setDialogo] = useState("Conectando ao servidor...");
  const [turno, setTurno] = useState('p1'); 
  const [menuFase, setMenuFase] = useState('principal'); 

  // --- ESTADOS DE ANIMAÇÃO ---
  const [showPlayerAttack, setShowPlayerAttack] = useState(false);
  const [showEnemyAttack, setShowEnemyAttack] = useState(false);
  const [playerDamaged, setPlayerDamaged] = useState(false);
  const [enemyDamaged, setEnemyDamaged] = useState(false);
  const [playerFlash, setPlayerFlash] = useState(false); 
  const [enemyFlash, setEnemyFlash] = useState(false);   

  // --- INICIALIZAÇÃO ---
  useEffect(() => {
    const iniciarBatalha = async () => {
      try {
        // Busca Treinadores e Ginásio em paralelo
        const [t1Res, t2Res, gRes] = await Promise.all([
            getTreinadorById(player1Id),
            getTreinadorById(player2Id),
            getGinasioById(ginasioId)
        ]);

        const t1 = t1Res.data;
        const t2 = t2Res.data;

        // Inicializa HP Atual localmente para controlar a batalha
        t1.pokemons = t1.pokemons.map(p => ({ ...p, hpAtual: p.pontosVida }));
        t2.pokemons = t2.pokemons.map(p => ({ ...p, hpAtual: p.pontosVida }));

        setP1(t1);
        setP2(t2);
        setGinasio(gRes.data);

        // Configura HP inicial dos primeiros pokemons
        if (t1.pokemons.length > 0) {
            setHpP1(t1.pokemons[0].pontosVida);
            setMaxHpP1(t1.pokemons[0].pontosVida);
        }
        if (t2.pokemons.length > 0) {
            setHpP2(t2.pokemons[0].pontosVida);
            setMaxHpP2(t2.pokemons[0].pontosVida);
        }

        setDialogo(`Batalha no ${gRes.data.nome}! ${t1.nome} vs ${t2.nome}`);
        setLoading(false);

      } catch (erro) {
        console.error(erro);
        alert("Erro ao carregar dados da batalha.");
        navigate('/lobby');
      }
    };
    iniciarBatalha();
  }, [player1Id, player2Id, ginasioId]);

  // --- FINALIZAR BATALHA (POST no Backend) ---
  const finalizarBatalha = async (vencedorId) => {
      setDialogo("Registrando resultados na Liga Pokémon...");
      try {
          // Coleta IDs de todos os pokemons que participaram
          const idsP1 = p1.pokemons.map(p => p.id);
          const idsP2 = p2.pokemons.map(p => p.id);
          const todosPokemonsIds = [...idsP1, ...idsP2];

          await registrarBatalha(todosPokemonsIds, vencedorId, ginasioId);
          
          setDialogo("Batalha registrada com sucesso!");
          setTimeout(() => navigate('/lobby'), 3000);

      } catch (error) {
          console.error(error);
          setDialogo("Erro ao salvar registro, mas a luta acabou.");
          setTimeout(() => navigate('/lobby'), 3000);
      }
  };

  // --- AÇÃO: JOGADOR USA AÇÃO (ATAQUE/CURA) ---
  const handleUsarGolpe = (acao) => {
    setMenuFase('principal'); 
    
    // Dados vindos do backend (acoesPokemon)
    const nomeGolpe = acao.nomeAcao;
    const valor = acao.valorAcao;
    const tipo = acao.tipoDeAcao; // 'ATAQUE', 'DEFESA', 'CURA'

    setDialogo(`${p1.pokemons[activeP1Index].nome} usou ${nomeGolpe}!`);

    if (tipo === 'CURA') {
        // Lógica de Cura
        const novaVida = Math.min(maxHpP1, hpP1 + valor);
        setHpP1(novaVida);
        p1.pokemons[activeP1Index].hpAtual = novaVida;
        setDialogo(`${p1.pokemons[activeP1Index].nome} recuperou vida!`);
        
        setTimeout(() => {
            setTurno('p2');
            setTimeout(contraAtaqueInimigo, 1500);
        }, 1000);

    } else {
        // Lógica de Ataque
        setShowPlayerAttack(true); 

        setTimeout(() => {
          setShowPlayerAttack(false); 
          setEnemyDamaged(true); 
          setEnemyFlash(true); 

          const novoHpInimigo = Math.max(0, hpP2 - valor);
          setHpP2(novoHpInimigo);
          p2.pokemons[activeP2Index].hpAtual = novoHpInimigo;

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
    }
  };

  // --- AÇÃO: IA DO INIMIGO ---
  const contraAtaqueInimigo = () => {
    // Escolhe ação aleatória do backend
    const acoesInimigo = p2.pokemons[activeP2Index].acoesPokemon;
    const acaoEscolhida = acoesInimigo[Math.floor(Math.random() * acoesInimigo.length)];

    setDialogo(`${p2.pokemons[activeP2Index].nome} usou ${acaoEscolhida.nomeAcao}!`);

    if (acaoEscolhida.tipoDeAcao === 'CURA') {
        const novaVida = Math.min(maxHpP2, hpP2 + acaoEscolhida.valorAcao);
        setHpP2(novaVida);
        p2.pokemons[activeP2Index].hpAtual = novaVida;
        
        setTimeout(() => {
             setTurno('p1');
             setDialogo(`Sua vez!`);
        }, 1500);

    } else {
        setShowEnemyAttack(true);

        setTimeout(() => {
          setShowEnemyAttack(false); 
          setPlayerDamaged(true); 
          setPlayerFlash(true); 

          const novoHpPlayer = Math.max(0, hpP1 - acaoEscolhida.valorAcao);
          setHpP1(novoHpPlayer);
          p1.pokemons[activeP1Index].hpAtual = novoHpPlayer;
          
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
    }
  };

  // --- LÓGICA: TROCAR POKEMON ---
  const handleTrocarPokemon = (novoIndex) => {
    const novoPoke = p1.pokemons[novoIndex];
    
    // Impede troca para pokemon morto
    if (novoPoke.hpAtual <= 0) {
        return;
    }

    setDialogo(`Vai, ${novoPoke.nome}!`);
    setActiveP1Index(novoIndex);
    
    setHpP1(novoPoke.hpAtual);
    setMaxHpP1(novoPoke.pontosVida); // Atualiza barra com o MaxHP do novo
    
    setMenuFase('principal');
    setTurno('p1');
  };

  // --- VERIFICAÇÕES DE FIM DE TURNO ---
  const verificarVitoriaOuTrocaInimigo = () => {
    const nomeMorto = p2.pokemons[activeP2Index].nome;
    setDialogo(`${nomeMorto} desmaiou!`);

    setTimeout(() => {
      // Simples lógica: pega o próximo da lista (se houver)
      const proximoIndex = activeP2Index + 1;
      
      if (proximoIndex < p2.pokemons.length) {
        setActiveP2Index(proximoIndex);
        setHpP2(p2.pokemons[proximoIndex].hpAtual);
        setMaxHpP2(p2.pokemons[proximoIndex].pontosVida);
        
        const novoPoke = p2.pokemons[proximoIndex].nome;
        setDialogo(`${p2.nome} enviou ${novoPoke}!`);
        setTurno('p1'); 
      } else {
        setDialogo(`VITÓRIA! ${p1.nome} venceu a batalha!`);
        finalizarBatalha(p1.id);
      }
    }, 2000);
  };

  const verificarDerrotaOuTrocaPlayer = () => {
    const nomeMorto = p1.pokemons[activeP1Index].nome;
    setDialogo(`${nomeMorto} desmaiou...`);

    setTimeout(() => {
        // Verifica se ainda tem pokemon vivo
        const temPokemonVivo = p1.pokemons.some(p => p.hpAtual > 0);

        if (temPokemonVivo) {
            setDialogo("Escolha seu próximo Pokémon!");
            setMenuFase('troca'); 
        } else {
            setDialogo(`Você perdeu a batalha...`);
            finalizarBatalha(p2.id); // Registra vitória do inimigo
        }
    }, 2000);
  };

  if (loading) return <div className="full-screen-center" style={{backgroundColor:'#000', color:'white'}}>CARREGANDO DADOS DO BACKEND...</div>;

  const activeP1 = p1.pokemons[activeP1Index];
  const activeP2 = p2.pokemons[activeP2Index];

  // Cálculo de Porcentagem para as Barras
  const p1Perc = (hpP1 / maxHpP1) * 100;
  const p2Perc = (hpP2 / maxHpP2) * 100;

  // Imagem de Fundo (Usa a do ginásio ou fallback)
  const bgImage = ginasio?.backgroundImage ? `url(${ginasio.backgroundImage})` : `url(${battleBg})`;

  return (
    <div style={{...styles.arena, backgroundImage: bgImage}}>
      
      {/* HUD INIMIGO */}
      <div style={styles.enemyArea}>
        <div style={styles.hudBox}>
          <span style={styles.nameText}>{activeP2.nome}</span>
          <div style={styles.hpContainer}>
            <div style={{...styles.hpBar, width: `${p2Perc}%`, backgroundColor: getHpColor(p2Perc)}}></div>
          </div>
        </div>
        <img 
            src={activeP2.sprites.front} 
            alt="Enemy" 
            style={styles.enemySprite} 
            className={`idle-float ${enemyDamaged ? 'damaged-animation' : ''} ${enemyFlash ? 'flash-animation' : ''}`} 
        />
      </div>

      {/* HUD PLAYER */}
      <div style={styles.playerArea}>
        <img 
            src={activeP1.sprites.back} 
            alt="Hero" 
            style={styles.heroSprite} 
            className={`${playerDamaged ? 'damaged-animation' : ''} ${playerFlash ? 'flash-animation' : ''}`} 
        />
        <div style={styles.hudBox}>
          <span style={styles.nameText}>{activeP1.nome}</span>
          <div style={styles.hpContainer}>
            <div style={{...styles.hpBar, width: `${p1Perc}%`, backgroundColor: getHpColor(p1Perc)}}></div>
          </div>
          <span style={styles.hpText}>{hpP1}/{maxHpP1}</span>
        </div>
      </div>

      {/* ANIMAÇÕES DE ATAQUE (RAIOS) */}
      {showPlayerAttack && (
        <div className="attack-ray player-attack-ray" style={{ left: '200px', bottom: '300px', backgroundColor: 'rgba(255, 255, 0, 0.8)' }}></div>
      )}

      {showEnemyAttack && (
        <div className="attack-ray enemy-attack-ray" style={{ right: '200px', top: '200px', backgroundColor: 'rgba(255, 0, 0, 0.8)' }}></div>
      )}

      {/* MENU INFERIOR */}
      <div style={styles.menuArea}>
        <div style={styles.dialogBox}>
          <p>{dialogo}</p>
        </div>
        
        {menuFase === 'troca' ? (
            <div style={styles.movesGrid}>
                {p1.pokemons.map((poke, idx) => (
                    <button 
                        key={idx} 
                        className="btn-move" 
                        disabled={idx === activeP1Index || poke.hpAtual <= 0} 
                        onClick={() => handleTrocarPokemon(idx)}
                        style={{
                            backgroundColor: (idx === activeP1Index || poke.hpAtual <= 0) ? '#555' : '#fff',
                            color: (idx === activeP1Index || poke.hpAtual <= 0) ? '#888' : '#000',
                            cursor: (idx === activeP1Index || poke.hpAtual <= 0) ? 'not-allowed' : 'pointer'
                        }}
                    >
                        {poke.nome} {poke.hpAtual <= 0 && "(KO)"}
                    </button>
                ))}
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
                                {activeP1.acoesPokemon.map((acao, idx) => (
                                    <button key={idx} className="btn-move" onClick={() => handleUsarGolpe(acao)}>
                                        {acao.nomeAcao} 
                                        <span style={{fontSize:'8px', color:'#555'}}>{acao.tipoDeAcao}</span>
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
    width: '100vw',
    height: '100vh',
    position: 'relative',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: 'black', 
    // Imagem dinâmica agora é gerida inline no componente
    backgroundSize: 'cover',
    backgroundPosition: 'center bottom',
    backgroundRepeat: 'no-repeat',
    imageRendering: 'pixelated'
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