import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Swords, UserPlus, Users } from 'lucide-react'; // Importando ícones novos

const Home = () => {
  const navigate = useNavigate();
  const [menuAberto, setMenuAberto] = useState(false);

  return (
    <div className="full-screen-center" style={{ backgroundColor: '#DC0A2D' }}> 
      
      <div style={styles.contentBox}>
        <Swords size={120} color="#FFDE00" strokeWidth={2.5} style={{ marginBottom: '20px', filter: 'drop-shadow(6px 6px 0px #2a2a2a)' }} />
        
        <h1 style={styles.title}>POKÉMON<br/>BATTLEFIELD</h1>
        <p style={styles.subtitle}>SIMULATOR V1.0</p>
        
        <div style={{ height: '60px' }}></div> {/* Espaçamento */}

        {/* LÓGICA DO MENU: Se não estiver aberto, mostra START. Se estiver, mostra OPÇÕES */}
        {!menuAberto ? (
          <button className="btn-pixel" onClick={() => setMenuAberto(true)}>
            PRESS START
          </button>
        ) : (
          <div style={styles.menuOptions}>
            <button 
              className="btn-pixel" 
              style={styles.btnOption} 
              onClick={() => navigate('/cadastro')}
            >
              <UserPlus size={24} style={{marginBottom: '10px'}}/>
              ADICIONAR TREINADOR
            </button>

            <button 
              className="btn-pixel" 
              style={styles.btnOption} 
              onClick={() => navigate('/lobby')}
            >
              <Users size={24} style={{marginBottom: '10px'}}/>
              CONTINUAR
            </button>
          </div>
        )}
        
        {/* Botãozinho discreto para cancelar/voltar ao estado inicial */}
        {menuAberto && (
            <button onClick={() => setMenuAberto(false)} style={styles.btnBack}>
                CANCELAR
            </button>
        )}

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
    textShadow: '6px 6px #3B4CCA',
    fontSize: '60px',
    marginBottom: '20px',
    lineHeight: '1.4',
    textAlign: 'center'
  },
  subtitle: {
    fontSize: '18px',
    color: 'white',
    letterSpacing: '4px',
    textShadow: '2px 2px 0px black'
  },
  menuOptions: {
    display: 'flex',
    gap: '20px', // Espaço entre os botões
    animation: 'slideUp 0.3s ease-out'
  },
  btnOption: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    width: '200px', // Largura fixa para ficarem iguais
    fontSize: '16px',
    backgroundColor: '#fff'
  },
  btnBack: {
    marginTop: '20px',
    background: 'transparent',
    border: 'none',
    color: 'white',
    cursor: 'pointer',
    fontSize: '12px',
    fontFamily: 'inherit',
    textDecoration: 'underline'
  }
};

// Adicionando a animação CSS via JS (ou você pode por no index.css)
const styleSheet = document.createElement("style");
styleSheet.innerText = `
  @keyframes slideUp {
    from { transform: translateY(20px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
`;
document.head.appendChild(styleSheet);

export default Home;