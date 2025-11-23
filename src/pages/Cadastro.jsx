import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { cadastrarTreinador, getClasses } from '../services/treinadorService';

const Cadastro = () => {
  const navigate = useNavigate();
  const [nome, setNome] = useState('');
  const [classeSelecionada, setClasseSelecionada] = useState('');
  const [listaClasses, setListaClasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    const carregar = async () => {
      try {
        const response = await getClasses();
        // Verifica se é array, se não for, tenta tratar
        const dados = Array.isArray(response.data) ? response.data : [];
        setListaClasses(dados);
        if (dados.length > 0) setClasseSelecionada(dados[0].nome);
      } catch (error) { 
        console.error(error); 
        setErro("Erro ao carregar classes. O backend está rodando?");
      }
    };
    carregar();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErro('');

    if (!nome.trim() || !classeSelecionada) {
      setErro('Preencha todos os campos!');
      setLoading(false);
      return;
    }

    try {
      console.log("Enviando:", { nome, classeTreinador: classeSelecionada });
      
      // Chamada ao backend
      await cadastrarTreinador(nome, classeSelecionada);

      // SE CHEGOU AQUI, É SUCESSO (200 ou 201)
      // Não precisamos do ID agora. Vamos para a seleção e o usuário se escolhe na lista.
      alert(`Treinador ${nome} criado com sucesso! Selecione seu nome na lista a seguir.`);
      navigate('/selecao');

    } catch (error) {
      console.error(error);
      // Tratamento de erro melhorado
      if (error.response && error.response.status === 409) {
          setErro('Já existe um treinador com esse nome!');
      } else {
          setErro('Erro ao conectar com o servidor.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="full-screen-center" style={{ backgroundColor: '#202020' }}>
      <h2 style={{ color: 'white', fontSize: '30px', marginBottom: '40px', fontFamily: '"Press Start 2P"' }}>NOVO TREINADOR</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '300px' }}>
        
        <div>
            <label style={{color:'white', display:'block', marginBottom:'10px', fontSize:'12px'}}>NOME</label>
            <input type="text" value={nome} onChange={e => setNome(e.target.value)} maxLength={12} 
                style={{width:'100%', padding:'15px', fontFamily:'"Press Start 2P"'}} />
        </div>

        <div>
            <label style={{color:'white', display:'block', marginBottom:'10px', fontSize:'12px'}}>CLASSE</label>
            <select value={classeSelecionada} onChange={e => setClasseSelecionada(e.target.value)}
                style={{width:'100%', padding:'15px', fontFamily:'"Press Start 2P"'}}>
                {listaClasses.map((c, i) => <option key={i} value={c.nome}>{c.nome}</option>)}
            </select>
        </div>

        {erro && <p style={{color:'#ff5555', fontSize:'10px', textAlign:'center'}}>{erro}</p>}
        
        <button type="submit" className="btn-pixel" disabled={loading}>
            {loading ? 'SALVANDO...' : 'CONFIRMAR'}
        </button>
        
        <button type="button" onClick={() => navigate('/')} style={{background:'transparent', border:'none', color:'#aaa', cursor:'pointer', marginTop:'10px', fontFamily:'inherit'}}>
            VOLTAR
        </button>
      </form>
    </div>
  );
};
export default Cadastro;