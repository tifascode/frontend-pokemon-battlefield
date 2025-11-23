import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { listarTreinadores } from '../services/treinadorService';
import { listarGinasios } from '../services/ginasioService'; // Novo Service
import { Swords, MapPin } from 'lucide-react';

const Lobby = () => {
  const navigate = useNavigate();
  const [treinadores, setTreinadores] = useState([]);
  const [ginasios, setGinasios] = useState([]);
  
  const [p1, setP1] = useState('');
  const [p2, setP2] = useState('');
  const [ginasioId, setGinasioId] = useState('');

  useEffect(() => {
    const carregar = async () => {
        const [tRes, gRes] = await Promise.all([listarTreinadores(), listarGinasios()]);
        // Filtra apenas quem tem pokemons
        setTreinadores(tRes.data.filter(t => t.pokemons && t.pokemons.length > 0));
        setGinasios(gRes.data);
    };
    carregar();
  }, []);

  const handleLutar = () => {
    // Passamos o ID do ginásio na URL agora
    navigate(`/batalha/${p1}/${p2}/${ginasioId}`);
  };

  return (
    <div className="full-screen-center" style={{backgroundColor:'#2a2a2a', flexDirection:'row', gap:'20px'}}>
        {/* Lista de Treinadores */}
        <div style={{width:'300px', height:'80vh', background:'#fff', padding:'20px', overflowY:'auto', border:'4px solid #333'}}>
            <h3>TREINADORES</h3>
            {treinadores.map(t => (
                <div key={t.id} style={{borderBottom:'1px solid #ccc', padding:'10px'}}>
                    <strong>{t.nome}</strong><br/>
                    <small>{t.classeTreinador} - {t.pokemons.length} Pokes</small>
                </div>
            ))}
             <button onClick={() => navigate('/cadastro')} style={{marginTop:'20px', width:'100%'}} className="btn-pixel">NOVO +</button>
             <button onClick={() => navigate('/selecao')} style={{marginTop:'10px', width:'100%', fontSize:'10px'}} className="btn-pixel">MONTAR TIME</button>
        </div>

        {/* Setup da Luta */}
        <div style={{color:'white', display:'flex', flexDirection:'column', alignItems:'center', gap:'20px'}}>
            <h1>VS MODE</h1>
            
            <select style={styles.select} value={p1} onChange={e => setP1(e.target.value)}>
                <option value="">JOGADOR 1</option>
                {treinadores.map(t => <option key={t.id} value={t.id} disabled={t.id===p2}>{t.nome}</option>)}
            </select>

            <Swords size={50} color="yellow"/>

            <select style={styles.select} value={p2} onChange={e => setP2(e.target.value)}>
                <option value="">JOGADOR 2</option>
                {treinadores.map(t => <option key={t.id} value={t.id} disabled={t.id===p1}>{t.nome}</option>)}
            </select>

            <div style={{height:'2px', width:'100%', background:'gray', margin:'20px 0'}}></div>

            <MapPin size={30} />
            <select style={styles.select} value={ginasioId} onChange={e => setGinasioId(e.target.value)}>
                <option value="">ESCOLHER GINÁSIO</option>
                {ginasios.map(g => <option key={g.id} value={g.id}>{g.nome} ({g.bairro})</option>)}
            </select>

            <button className="btn-pixel" disabled={!p1 || !p2 || !ginasioId} onClick={handleLutar} 
                style={{backgroundColor: (!p1 || !p2 || !ginasioId) ? '#555' : '#DC0A2D', color:'white', marginTop:'20px'}}>
                FIGHT!
            </button>
        </div>
    </div>
  );
};

const styles = {
    select: { padding:'15px', fontFamily:'"Press Start 2P"', fontSize:'12px', width:'250px' }
};

export default Lobby;