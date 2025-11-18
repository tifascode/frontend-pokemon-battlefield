import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { listarTreinadores } from '../services/treinadorService';
import pokeApi from '../services/pokeApi'; // Importando a API oficial
import axios from 'axios'; // Para buscar os detalhes de cada golpe

const Batalha = () => {
  const { player1Id, player2Id } = useParams();
  const navigate = useNavigate();

  // --- ESTADOS GERAIS ---
  const [loading, setLoading] = useState(true);
  const [p1, setP1] = useState(null);
  const [p2, setP2] = useState(null);
  
  const [activeP1Index, setActiveP1Index] = useState(0);
  const [activeP2Index, setActiveP2Index] = useState(0);
  const [hpP1, setHpP1] = useState(100);
  const [hpP2, setHpP2] = useState(100);

  // --- ESTADOS DE BATALHA ---
  const [dialogo, setDialogo] = useState("Carregando dados da batalha...");
  const [turno, setTurno] = useState('p1'); 
  const [menuFase, setMenuFase] = useState('principal'); // 'principal' ou 'ataques'
  
  // Guardar os golpes carregados da API
  const [golpesP1, setGolpesP1] = useState([]);

  // --- SETUP INICIAL ---
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

        // --- A MÁGICA ACONTECE AQUI ---
        // Buscamos os golpes do Pokémon atual do Player 1 na PokéAPI
        const pokemonAtivoNome = t1.pokemons[0].nome; // Pega o nome (ex: "charmander")
        await carregarGolpes(pokemonAtivoNome);

        setDialogo(`Batalha iniciada! ${t1.nome} vs ${t2.nome}`);
        setLoading(false);
      } catch (erro) {
        console.error(erro);
        alert("Erro ao iniciar batalha");
        navigate('/lobby');
      }
    };

    inicializarBatalha();
  }, [player1Id, player2Id]);

  // Função auxiliar para buscar 4 golpes reais
  const carregarGolpes = async (pokemonNome) => {
    try {
      // 1. Busca dados gerais do pokemon
      const resp = await pokeApi.get(`/pokemon/${pokemonNome.toLowerCase()}`);
      
      // 2. Pega os 4 primeiros golpes da lista
      const primeirosGolpes = resp.data.moves.slice(0, 4);

      // 3. Busca os detalhes de cada golpe (Power, Type) em paralelo
      const promessasDetalhadas = primeirosGolpes.map(async (m) => {
        const detalheResp = await axios.get(m.move.url);
        return {
            nome: m.move.name.replace('-', ' '), // Tira os hífens (ex: thunder-shock)
            poder: detalheResp.data.power || 10, // Se for golpe de status (null), põe dano 10
            tipo: detalheResp.data.type.name
        };
      });

      const golpesProntos = await Promise.all(promessasDetalhadas);
      setGolpesP1(golpesProntos);

    } catch (error) {
        console.log("Erro ao carregar golpes", error);
        // Fallback se der erro na API
        setGolpesP1([{ nome: "Tackle", poder: 20 }, { nome: "Scratch", poder: 20 }]);
    }
  };

  // --- AÇÃO DE ATAQUE ---
  const handleUsarGolpe = (golpe) => {
    setMenuFase('principal'); // Esconde o menu de golpes
    
    // 1. Calcula Dano (Baseado no Poder do golpe + aleatoriedade)
    const fatorAleatorio = (Math.floor(Math.random() * 15) + 85) / 100; // Entre 0.85 e 1.0
    const danoFinal = Math.floor(golpe.poder * 0.5 * fatorAleatorio); // Fórmula simplificada
    
    setDialogo(`${p1.pokemons[activeP1Index].nome} usou ${golpe.nome.toUpperCase()}!`);

    // 2. Animação e Dano
    setTimeout(() => {
      setHpP2(prev => Math.max(0, prev - danoFinal));
      
      if (hpP2 - danoFinal <= 0) {
        setDialogo(`${p2.pokemons[activeP2Index].nome} desmaiou! Vitória!`);
        return;
      }

      // Passa a vez
      setTurno('p2');
      setTimeout(contraAtaqueInimigo, 2000);
    }, 1000);
  };

  const contraAtaqueInimigo = () => {
    const dano = Math.floor(Math.random() * 20) + 10; // Inimigo ainda aleatório
    setDialogo(`${p2.pokemons[activeP2Index].nome} inimigo atacou!`);

    setTimeout(() => {
      setHpP1(prev => Math.max(0, prev - dano));
      if (hpP1 - dano <= 0) {
         setDialogo(`Seu pokemon desmaiou...`);
         return;
      }
      setTurno('p1');
      setDialogo(`O que ${p1.pokemons[activeP1Index].nome} vai fazer?`);
    }, 1000);
  };

  if (loading) return <div className="full-screen-center">CARREGANDO GOLPES...</div>;

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

      {/* HUD JOGADOR */}
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

      {/* MENU INTERATIVO */}
      <div style={styles.menuArea}>
        <div style={styles.dialogBox}>
          <p>{dialogo}</p>
        </div>
        
        {/* CONDIÇÃO DE EXIBIÇÃO DOS MENUS */}
        {turno === 'p1' && hpP1 > 0 && hpP2 > 0 && (
            <>
                {menuFase === 'principal' ? (
                    // MENU PRINCIPAL (Lutar/Mochila/etc)
                    <div style={styles.actionsBox}>
                        <button className="btn-action" onClick={() => setMenuFase('ataques')}>LUTAR</button>
                        <button className="btn-action" disabled style={{color:'#aaa'}}>POKÉMON</button>
                        <button className="btn-action" disabled style={{color:'#aaa'}}>MOCHILA</button>
                        <button className="btn-action" onClick={() => navigate('/lobby')}>FUGIR</button>
                    </div>
                ) : (
                    // SUB-MENU DE GOLPES (Os 4 ataques)
                    <div style={styles.movesGrid}>
                        {golpesP1.map((golpe, idx) => (
                            <button key={idx} className="btn-move" onClick={() => handleUsarGolpe(golpe)}>
                                {golpe.nome} <span style={{fontSize:'8px'}}>{golpe.tipo}</span>
                            </button>
                        ))}
                        <button 
                            style={{...styles.btnMove, backgroundColor: '#eee', color: '#000'}} 
                            onClick={() => setMenuFase('principal')}
                        >
                            VOLTAR
                        </button>
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
  // ... (Mantenha os estilos anteriores: arena, enemyArea, playerArea, sprites, hudBox, hpBar, etc)
  arena: { width: '100vw', height: '100vh', backgroundColor: '#f8f9fa', backgroundImage: 'linear-gradient(to bottom, #85C1E9 0%, #85C1E9 40%, #58D68D 40%, #58D68D 100%)', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' },
  enemyArea: { position: 'absolute', top: '50px', right: '50px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' },
  playerArea: { position: 'absolute', bottom: '180px', left: '50px', display: 'flex', alignItems: 'flex-end' },
  enemySprite: { width: '200px', height: '200px', marginTop: '-30px', animation: 'float 3s ease-in-out infinite' },
  heroSprite: { width: '250px', height: '250px', marginRight: '30px' },
  hudBox: { backgroundColor: '#f8f8d8', border: '4px solid #333', padding: '10px 20px', borderRadius: '10px 0 10px 0', boxShadow: '5px 5px 0px rgba(0,0,0,0.2)', width: '250px' },
  nameText: { display: 'block', marginBottom: '5px', textTransform: 'uppercase', fontSize: '14px' },
  hpContainer: { width: '100%', height: '10px', backgroundColor: '#ccc', borderRadius: '5px', border: '2px solid #333', overflow: 'hidden' },
  hpBar: { height: '100%', transition: 'width 0.5s ease-out' },
  hpText: { fontSize: '10px', marginTop: '5px', display: 'block', textAlign: 'right' },
  
  // ESTILOS DO MENU ATUALIZADOS
  menuArea: { position: 'absolute', bottom: 0, width: '100%', height: '150px', backgroundColor: '#2a2a2a', borderTop: '6px solid #FFDE00', display: 'flex', padding: '10px' },
  dialogBox: { flex: 2, backgroundColor: '#333', border: '4px solid #fff', borderRadius: '5px', padding: '20px', marginRight: '10px', color: 'white', fontSize: '18px', lineHeight: '1.5' },
  actionsBox: { flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px', backgroundColor: '#fff', border: '4px solid #333', padding: '5px' },
  
  // NOVO: Grid para os golpes
  movesGrid: { flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px', backgroundColor: '#222', border: '4px solid #DC0A2D', padding: '5px' },
};

export default Batalha;