import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Volume2, VolumeX } from 'lucide-react';

// Importe os arquivos de áudio
import lobbyTheme from '../assets/sounds/lobby_theme.mp3';
import battleTheme from '../assets/sounds/battle_theme.mp3';

const MusicPlayer = () => {
  const location = useLocation();
  const audioRef = useRef(new Audio(lobbyTheme)); // Começa com o tema do lobby carregado
  const [isMuted, setIsMuted] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false); // Navegadores bloqueiam áudio automático

  useEffect(() => {
    // Configuração inicial do áudio
    audioRef.current.loop = true;
    audioRef.current.volume = 0.1; // Volume baixo (10%) para não estourar os ouvidos
  }, []);

  useEffect(() => {
    const handleRouteChange = async () => {
      // Identifica qual música deve tocar baseada na URL
      const isBattle = location.pathname.includes('/batalha');
      const targetSource = isBattle ? battleTheme : lobbyTheme;

      // Se a música necessária for diferente da que está tocando agora...
      // (Isso evita reiniciar a música se você for do Lobby pra Seleção)
      const currentSrc = audioRef.current.src;
      
      // Truque para comparar URLs locais (o navegador adiciona http://localhost...)
      if (!currentSrc.includes(targetSource.split('/').pop())) {
        
        // 1. Pause a atual
        audioRef.current.pause();
        
        // 2. Troca a fonte
        audioRef.current.src = targetSource;
        audioRef.current.load(); // Recarrega
        
        // 3. Toca a nova (se o usuário já interagiu com a página)
        if (hasInteracted && !isMuted) {
          try {
            await audioRef.current.play();
          } catch (error) {
            console.log("O navegador bloqueou o autoplay. O usuário precisa clicar na página primeiro.");
          }
        }
      }
    };

    handleRouteChange();
  }, [location, hasInteracted, isMuted]);

  // Função para lidar com o primeiro clique na página (desbloqueia o áudio)
  useEffect(() => {
    const unlockAudio = () => {
      if (!hasInteracted) {
        setHasInteracted(true);
        if (!isMuted) {
            audioRef.current.play().catch(e => console.log(e));
        }
      }
    };

    window.addEventListener('click', unlockAudio);
    window.addEventListener('keydown', unlockAudio);

    return () => {
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
    };
  }, [hasInteracted, isMuted]);

  // Função de Mutar/Desmutar
  const toggleMute = () => {
    if (isMuted) {
      audioRef.current.play();
      setIsMuted(false);
    } else {
      audioRef.current.pause();
      setIsMuted(true);
    }
  };

  return (
    <button 
      onClick={toggleMute}
      style={styles.floatingBtn}
      title="Ligar/Desligar Música"
    >
      {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
    </button>
  );
};

const styles = {
  floatingBtn: {
    position: 'fixed',
    top: '20px',
    right: '20px',
    zIndex: 9999, // Fica acima de tudo
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    color: 'white',
    border: '2px solid white',
    borderRadius: '50%',
    width: '40px',
    height: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    boxShadow: '0 0 10px rgba(0,0,0,0.5)'
  }
};

export default MusicPlayer;