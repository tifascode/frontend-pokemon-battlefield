import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Swords } from 'lucide-react'; // Ícone de batalha

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="full-screen-center" style={{ backgroundColor: '#DC0A2D' }}> 
      {/* Fundo Vermelho Pokedex para destacar */}
      
      <div style={styles.contentBox}>
        <Swords size={120} color="#FFDE00" strokeWidth={2.5} style={{ marginBottom: '20px', filter: 'drop-shadow(6px 6px 0px #2a2a2a)' }} />
        
        <h1 style={styles.title}>POKÉMON<br/>BATTLE</h1>
        <p style={styles.subtitle}>SIMULATOR V1.0</p>
        
        <div style={{ height: '40px' }}></div> {/* Espaçamento */}

        <button className="btn-pixel" onClick={() => navigate('/cadastro')}>
          PRESS START
        </button>
      </div>
    </div>
  );
};

const styles = {
  contentBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    animation: 'fadeIn 1s ease-in',
  },
  title: {
    color: '#FFDE00', 
    textShadow: '6px 6px #3B4CCA', // Sombra maior
    fontSize: '60px', // Fonte GIGANTE
    marginBottom: '20px',
    lineHeight: '1.4',
    textAlign: 'center'
  },
  subtitle: {
    fontSize: '18px',
    color: 'white',
    letterSpacing: '4px',
    textShadow: '2px 2px 0px black'
  }
};

export default Home;