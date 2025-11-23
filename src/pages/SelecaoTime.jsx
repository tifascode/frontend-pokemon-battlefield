import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { listarPokemons, capturarPokemon } from '../services/pokemonService';
import { listarTreinadores } from '../services/treinadorService';

const SelecaoTime = () => {
  const navigate = useNavigate();
  
  const [treinadores, setTreinadores] = useState([]);
  const [selectedTreinadorId, setSelectedTreinadorId] = useState('');
  const [todosPokemons, setTodosPokemons] = useState([]);
  const [meuTime, setMeuTime] = useState([]);
  const [salvando, setSalvando] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const carregarDados = async () => {
        try {
            console.log("--- INICIANDO CARGAMENTO ---");
            
            // 1. Busca Treinadores
            const trainersRes = await listarTreinadores();
            console.log("Treinadores RAW:", trainersRes.data);
            
            let listaTreinadores = [];
            if (Array.isArray(trainersRes.data)) {
                listaTreinadores = trainersRes.data;
            } else if (trainersRes.data && trainersRes.data.content) {
                listaTreinadores = trainersRes.data.content;
            }
            setTreinadores(listaTreinadores);

            // 2. Busca Pokémons
            const pokesRes = await listarPokemons();
            console.log("Pokemons RAW:", pokesRes); // <--- OLHE ISSO NO CONSOLE

            let listaPokes = [];
            
            // Tenta adivinhar onde está a lista
            if (Array.isArray(pokesRes)) {
                listaPokes = pokesRes;
            } else if (pokesRes && pokesRes.result) {
                 listaPokes = pokesRes.result;
            } else if (pokesRes && pokesRes.content) {
                 listaPokes = pokesRes.content;
            } else if (pokesRes && pokesRes.data) {
                 // Caso o service tenha retornado o response completo do axios
                 listaPokes = pokesRes.data; 
            }

            console.log("Lista processada:", listaPokes);

            if (listaPokes.length === 0) {
                console.warn("ALERTA: A lista de pokemons está vazia! Verifique se há dados no banco.");
            }

            // Mapeamento seguro
            const pokesFormatados = listaPokes.map(p => ({
                id: p.id,
                name: p.nome || "Sem Nome", 
                // Proteção: Se sprites for null, usa fallback
                sprite: p.sprites?.front || 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/0.png', 
                temDono: p.temDono || false
            }));
            
            setTodosPokemons(pokesFormatados);

        } catch (error) {
            console.error("ERRO CRÍTICO AO CARREGAR:", error);
            alert("Erro ao carregar dados. Abra o console (F12) para ver detalhes.");
        } finally {
            setLoading(false);
        }
    };
    carregarDados();
  }, []);

  const togglePokemon = (pokemon) => {
    if (pokemon.temDono) return alert("Esse Pokémon já tem treinador!");
    
    if (meuTime.some(p => p.id === pokemon.id)) {
      setMeuTime(meuTime.filter(p => p.id !== pokemon.id));
    } else {
      if (meuTime.length >= 6) return alert("Time cheio (Máx 6)!");
      setMeuTime([...meuTime, pokemon]);
    }
  };

  const handleSalvar = async () => {
    if (!selectedTreinadorId) return alert("Selecione SEU NOME na lista acima!");
    if (meuTime.length === 0) return alert("Escolha pelo menos 1 Pokémon!");
    
    setSalvando(true);
    try {
      for (const poke of meuTime) {
          await capturarPokemon(selectedTreinadorId, poke.id);
      }
      alert("Time salvo com sucesso!");
      navigate('/lobby');
    } catch (error) {
      console.error(error);
      alert("Erro ao salvar. Verifique o console.");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div style={{display:'flex', height:'100vh', width:'100vw', backgroundColor:'#202020', overflow:'hidden'}}>
        {/* Barra Lateral Esquerda */}
        <div style={{width:'320px', background:'#DC0A2D', padding:'20px', borderRight:'6px solid black', display:'flex', flexDirection:'column', boxShadow:'5px 0 15px rgba(0,0,0,0.5)', zIndex:10}}>
            
            <div style={{backgroundColor:'#fff', padding:'10px', borderRadius:'5px', border:'4px solid #333', marginBottom:'20px'}}>
                <label style={{color:'#333', fontSize:'10px', display:'block', marginBottom:'5px'}}>QUEM É VOCÊ?</label>
                <select 
                    style={{width:'100%', padding:'10px', fontFamily:'"Press Start 2P"', border:'2px solid #ccc'}} 
                    value={selectedTreinadorId} 
                    onChange={e => setSelectedTreinadorId(e.target.value)}
                >
                    <option value="">Selecione...</option>
                    {treinadores.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
                </select>
            </div>

            <h3 style={{fontSize:'16px', marginBottom:'15px', textShadow:'2px 2px #333'}}>SEU TIME ({meuTime.length}/6)</h3>
            
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', overflowY:'auto', flex:1}}>
                {meuTime.map(p => (
                    <div key={p.id} style={{background:'white', border:'3px solid black', borderRadius:'5px', padding:'5px', display:'flex', justifyContent:'center'}}>
                        <img src={p.sprite} style={{width:'60px', height:'60px', objectFit:'contain'}} alt={p.name}/>
                    </div>
                ))}
                {[...Array(6 - meuTime.length)].map((_, i) => (
                    <div key={i} style={{background:'rgba(0,0,0,0.2)', border:'3px dashed rgba(0,0,0,0.5)', borderRadius:'5px', height:'70px'}}></div>
                ))}
            </div>
            
            <button className="btn-pixel" onClick={handleSalvar} style={{marginTop:'20px', width:'100%', fontSize:'14px'}} disabled={salvando}>
                {salvando ? 'SALVANDO...' : 'CONFIRMAR TIME'}
            </button>
        </div>

        {/* Grade de Pokemons (Direita) */}
        <div style={{flex:1, padding:'30px', overflowY:'auto', backgroundColor:'#f8f9fa'}}>
            <h1 style={{color:'#333', fontSize:'24px', marginBottom:'30px', textAlign:'center', textTransform:'uppercase'}}>Pokémons Disponíveis</h1>
            
            {loading ? (
                <p style={{color:'black', textAlign:'center'}}>CARREGANDO DADOS...</p>
            ) : todosPokemons.length === 0 ? (
                <div style={{textAlign:'center', color:'red'}}>
                    <p>NENHUM POKEMON ENCONTRADO.</p>
                    <p style={{fontSize:'12px', marginTop:'10px'}}>Verifique se o backend está populado.</p>
                </div>
            ) : (
                <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(140px, 1fr))', gap:'20px', paddingBottom:'50px'}}>
                    {todosPokemons.map(p => {
                        const isSelected = meuTime.some(x=>x.id===p.id);
                        return (
                            <div key={p.id} onClick={() => togglePokemon(p)} 
                                style={{
                                    border: isSelected ? '4px solid #4CAF50' : '4px solid #333', 
                                    background: isSelected ? '#e8f5e9' : (p.temDono ? '#e0e0e0' : 'white'),
                                    borderRadius:'10px',
                                    padding:'15px', 
                                    display:'flex', flexDirection:'column', alignItems:'center', 
                                    cursor: p.temDono ? 'not-allowed' : 'pointer', 
                                    opacity: p.temDono ? 0.6 : 1,
                                    position: 'relative',
                                    boxShadow: isSelected ? '0 0 10px #4CAF50' : '5px 5px 0 rgba(0,0,0,0.1)',
                                    transform: isSelected ? 'translateY(-5px)' : 'none',
                                    transition: 'all 0.1s'
                                }}>
                                <img src={p.sprite} style={{width:'80px', height:'80px', objectFit:'contain'}} alt={p.name} />
                                <span style={{fontSize:'10px', textAlign:'center', marginTop:'10px', color:'#333'}}>{p.name}</span>
                                <span style={{fontSize:'8px', color:'#666', marginTop:'5px'}}>#{p.id}</span>
                                
                                {p.temDono && (
                                    <div style={{position:'absolute', top:'5px', right:'5px', background:'red', color:'white', fontSize:'8px', padding:'2px 4px', borderRadius:'3px'}}>
                                        DONO
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    </div>
  );
};
export default SelecaoTime;