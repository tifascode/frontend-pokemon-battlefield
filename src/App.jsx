import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Cadastro from './pages/Cadastro';
import SelecaoTime from './pages/SelecaoTime';
import Lobby from './pages/Lobby'; // <--- Importe o Lobby
import Batalha from './pages/Batalha';
// Pode remover MapaGinasios se quiser

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/cadastro" element={<Cadastro />} />
        <Route path="/selecao" element={<SelecaoTime />} />
        
        {/* Nova Rota Intermediária */}
        <Route path="/lobby" element={<Lobby />} />
        
        {/* Rota de Batalha agora recebe ID do Player 1 e ID do Player 2 */}
        <Route path="/batalha/:player1Id/:player2Id" element={<Batalha />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;