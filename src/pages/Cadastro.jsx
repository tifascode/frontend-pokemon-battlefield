import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { cadastrarTreinador, getClasses } from '../services/treinadorService';
import { User, Shield } from 'lucide-react'; // Ícones novos

const Cadastro = () => {
  const navigate = useNavigate();
  
  // Estados
  const [nome, setNome] = useState('');
  const [classeSelecionada, setClasseSelecionada] = useState('');
  const [listaClasses, setListaClasses] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  // Carregar as classes assim que a tela abre
  useEffect(() => {
    const carregarClasses = async () => {
      try {
        const response = await getClasses();
        // O backend pode retornar um array de strings ou objetos. 
        // Aqui assumimos que response.data é uma lista: [{nome: 'Iniciante'}, ...]
        setListaClasses(response.data);
        
        // Seleciona a primeira classe automaticamente pra facilitar
        if (response.data.length > 0) {
            setClasseSelecionada(response.data[0].nome);
        }
      } catch (error) {
        console.error("Erro ao buscar classes", error);
        setErro('Não foi possível carregar as classes de treinador.');
      }
    };

    carregarClasses();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErro('');

    if (!nome.trim()) {
      setErro('Por favor, digite seu nome!');
      setLoading(false);
      return;
    }

    if (!classeSelecionada) {
        setErro('Por favor, escolha uma classe!');
        setLoading(false);
        return;
    }

    try {
      const response = await cadastrarTreinador(nome, classeSelecionada);
      
      // Salva dados locais
      localStorage.setItem('treinadorId', response.data.id);
      localStorage.setItem('treinadorNome', nome);
      localStorage.setItem('treinadorClasse', classeSelecionada);

      navigate('/selecao');
      
    } catch (error) {
      console.error("Erro ao cadastrar", error);
      setErro('Erro ao conectar com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="full-screen-center" style={{ backgroundColor: '#202020' }}>
      <h2 style={styles.title}>NOVO TREINADOR</h2>

      <form onSubmit={handleSubmit} style={styles.form}>
        
        {/* Campo Nome */}
        <div style={styles.inputGroup}>
          <label style={styles.label}>
            <User size={20} style={{ marginRight: '10px' }}/> 
            SEU NOME
          </label>
          <input 
            type="text" 
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            maxLength={12}
            placeholder="ASH"
            style={styles.input}
          />
        </div>

        {/* Campo Classe (Dropdown) */}
        <div style={styles.inputGroup}>
          <label style={styles.label}>
            <Shield size={20} style={{ marginRight: '10px' }}/> 
            SUA CLASSE
          </label>
          
          <select 
            value={classeSelecionada}
            onChange={(e) => setClasseSelecionada(e.target.value)}
            style={styles.select}
          >
            {listaClasses.map((classe, index) => (
              <option key={index} value={classe.nome}>
                {classe.nome}
              </option>
            ))}
          </select>
        </div>

        {erro && <p style={{ color: '#ff5555', fontSize: '14px', marginBottom: '20px', textAlign: 'center' }}>{erro}</p>}

        <button type="submit" className="btn-pixel" disabled={loading} style={{ width: '100%', marginTop: '20px' }}>
          {loading ? 'SALVANDO...' : 'CONFIRMAR'}
        </button>
      </form>
      
      <button 
        onClick={() => navigate('/')} 
        style={styles.backBtn}
      >
        VOLTAR
      </button>
    </div>
  );
};

const styles = {
  title: {
    color: 'white',
    fontSize: '40px',
    marginBottom: '40px',
    textShadow: '4px 4px #333'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '100%',
    maxWidth: '500px', // Mais largo para tela cheia
    backgroundColor: '#f8f9fa',
    padding: '40px',
    border: '4px solid #d3d3d3',
    boxShadow: '10px 10px 0px #000'
  },
  inputGroup: {
    marginBottom: '30px',
    width: '100%',
  },
  label: {
    marginBottom: '15px',
    display: 'flex',
    alignItems: 'center',
    fontSize: '18px',
    color: '#333'
  },
  input: {
    width: '100%',
    padding: '20px',
    fontFamily: '"Press Start 2P", cursive',
    border: '4px solid #333',
    outline: 'none',
    fontSize: '20px',
    backgroundColor: '#fff'
  },
  select: {
    width: '100%',
    padding: '20px',
    fontFamily: '"Press Start 2P", cursive',
    border: '4px solid #333',
    outline: 'none',
    fontSize: '16px', // Um pouco menor que o input para caber nomes longos
    backgroundColor: '#fff',
    cursor: 'pointer',
    appearance: 'none', // Remove estilo nativo do navegador
    backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23000000%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")', // Seta customizada
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 20px center',
    backgroundSize: '15px auto',
  },
  backBtn: {
    marginTop: '40px', 
    background: 'transparent', 
    border: 'none', 
    cursor: 'pointer', 
    fontFamily: 'inherit', 
    fontSize: '16px',
    color: '#666'
  }
};

export default Cadastro;