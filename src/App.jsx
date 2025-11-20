import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Cadastro from './pages/Cadastro';
import SelecaoTime from './pages/SelecaoTime';
import Lobby from './pages/Lobby';
import Batalha from './pages/Batalha';

// IMPORTAR O TOCADOR DE MÚSICA
import MusicPlayer from './components/MusicPlayer';

function App() {
  return (
    <BrowserRouter>
      {/* O MusicPlayer fica aqui dentro, mas fora das Routes para não ser destruído ao navegar */}
      <MusicPlayer />
      
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/cadastro" element={<Cadastro />} />
        <Route path="/selecao" element={<SelecaoTime />} />
        <Route path="/lobby" element={<Lobby />} />
        <Route path="/batalha/:player1Id/:player2Id" element={<Batalha />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;