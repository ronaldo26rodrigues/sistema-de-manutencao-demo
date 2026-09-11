import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../api';

export default function CriarInspecao({ osInicial, onSucesso }) {
  const [listaVeiculos, setListaVeiculos] = useState([]);
  const [listaGaragens, setListaGaragens] = useState([]);
  const [loading, setLoading] = useState(false);

  const [novaInspecao, setNovaInspecao] = useState({
    veiculo_id: '',
    data_inspecao: '',
    turno: 'manha',
    garagem_id: '',
    mecanico_id: '',
    km_no_ato: '',
    observacoes: ''
  });

  useEffect(() => {
    const carregarVeiculos = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/veiculos`);
        if (response.ok) {
          const data = await response.json();
          setListaVeiculos(data);
          if (data.length > 0) {
            setNovaInspecao((atual) => ({ ...atual, veiculo_id: data[0].id }));
          }
        }
      } catch (error) {
        console.error('Erro ao carregar veículos para o select:', error);
      }
    };

    const carregarGaragens = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/garagens`);
        if (response.ok) {
          const data = await response.json();
          setListaGaragens(data);
          if (data.length > 0) {
            setNovaInspecao((atual) => ({ ...atual, garagem_id: data[0].id }));
          }
        }
      } catch (error) {
        console.error('Erro ao carregar garagens para o select:', error);
      }
    };

    carregarVeiculos();
    carregarGaragens();
  }, []);

  const handleCriarInspecao = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...novaInspecao,
        veiculo_id: Number(novaInspecao.veiculo_id),
        garagem_id: Number(novaInspecao.garagem_id),
        km_no_ato: Number(novaInspecao.km_no_ato)
      };

      const response = await fetch(`${API_BASE_URL}/inspecoes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        alert('Inspeção criada com sucesso!');
        if (onSucesso) onSucesso();
      } else {
        const mensagem = await response.text();
        alert(`Erro ao criar a inspeção. Verifique os dados. ${mensagem}`);
      }
    } catch (error) {
      console.error('Erro ao criar inspeção:', error);
      alert('Erro de conexão com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4 text-gray-700">Nova Inspeção</h2>
      <form onSubmit={handleCriarInspecao} className="space-y-4">
        <div>
          <label className="block text-gray-700 mb-1">Veículo:</label>
          <select
            required
            value={novaInspecao.veiculo_id}
            onChange={(e) => setNovaInspecao({ ...novaInspecao, veiculo_id: e.target.value })}
            className="w-full border p-2 rounded focus:border-blue-500"
          >
            <option value="">Selecione um veículo</option>
            {listaVeiculos.map((veiculo) => (
              <option key={veiculo.id} value={veiculo.id}>
                {veiculo.prefixo} - {veiculo.modelo}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-gray-700 mb-1">Data da inspeção:</label>
          <input
            type="date"
            required
            value={novaInspecao.data_inspecao}
            onChange={(e) => setNovaInspecao({ ...novaInspecao, data_inspecao: e.target.value })}
            className="w-full border p-2 rounded focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-gray-700 mb-1">Turno:</label>
          <select
            required
            value={novaInspecao.turno}
            onChange={(e) => setNovaInspecao({ ...novaInspecao, turno: e.target.value })}
            className="w-full border p-2 rounded focus:border-blue-500"
          >
            <option value="manha">manha</option>
            <option value="tarde">tarde</option>
            <option value="noite">noite</option>
          </select>
        </div>

        <div>
          <label className="block text-gray-700 mb-1">Garagem:</label>
          <select
            required
            value={novaInspecao.garagem_id}
            onChange={(e) => setNovaInspecao({ ...novaInspecao, garagem_id: e.target.value })}
            className="w-full border p-2 rounded focus:border-blue-500"
          >
            <option value="">Selecione uma garagem</option>
            {listaGaragens.map((garagem) => (
              <option key={garagem.id} value={garagem.id}>
                {garagem.nome}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-gray-700 mb-1">Mecânico:</label>
          <input
            type="text"
            required
            value={novaInspecao.mecanico_id}
            onChange={(e) => setNovaInspecao({ ...novaInspecao, mecanico_id: e.target.value })}
            className="w-full border p-2 rounded focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-gray-700 mb-1">KM no ato:</label>
          <input
            type="number"
            required
            value={novaInspecao.km_no_ato}
            onChange={(e) => setNovaInspecao({ ...novaInspecao, km_no_ato: e.target.value })}
            className="w-full border p-2 rounded focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-gray-700 mb-1">Observações:</label>
          <textarea
            rows="3"
            value={novaInspecao.observacoes}
            onChange={(e) => setNovaInspecao({ ...novaInspecao, observacoes: e.target.value })}
            className="w-full border p-2 rounded focus:border-blue-500"
          ></textarea>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 disabled:opacity-50"
        >
          {loading ? 'Salvando...' : 'Salvar Inspeção'}
        </button>
      </form>
    </div>
  );
}