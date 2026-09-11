import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../api';

export default function CriarVeiculo({ onSucesso }) {
  const [loading, setLoading] = useState(false);
  const [garagens, setGaragens] = useState([]);

  const [novoVeiculo, setNovoVeiculo] = useState({
    prefixo: '',
    modelo: '',
    chassi_tipo: '',
    ano: '',
    garagem: '',
    km_atual: '',
    status: 'ativo'
  });

  useEffect(() => {
    const carregarGaragens = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/garagens`);
        if (response.ok) {
          const data = await response.json();
          setGaragens(data);
          if (data.length > 0) {
            setNovoVeiculo((veiculoAtual) => ({
              ...veiculoAtual,
              garagem: data[0].nome
            }));
          }
        }
      } catch (error) {
        console.error('Erro ao carregar garagens:', error);
      }
    };

    carregarGaragens();
  }, []);

  const handleCriarVeiculo = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/veiculos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(novoVeiculo),
      });

      if (response.ok) {
        alert('Veículo criado com sucesso!');
        if (onSucesso) onSucesso();
      } else {
        const mensagem = await response.text();
        alert(`Erro ao criar o veículo. Verifique os dados. ${mensagem}`);
      }
    } catch (error) {
      console.error('Erro ao criar veículo:', error);
      alert('Erro de conexão com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4 text-gray-700">Novo Veículo</h2>
      <form onSubmit={handleCriarVeiculo} className="space-y-4">
        <div>
          <label className="block text-gray-700 mb-1">Prefixo:</label>
          <input
            type="text"
            required
            value={novoVeiculo.prefixo}
            onChange={(e) => setNovoVeiculo({ ...novoVeiculo, prefixo: e.target.value })}
            className="w-full border p-2 rounded focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-gray-700 mb-1">Modelo:</label>
          <input
            type="text"
            required
            value={novoVeiculo.modelo}
            onChange={(e) => setNovoVeiculo({ ...novoVeiculo, modelo: e.target.value })}
            className="w-full border p-2 rounded focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-gray-700 mb-1">Chassi tipo:</label>
          <input
            type="text"
            required
            value={novoVeiculo.chassi_tipo}
            onChange={(e) => setNovoVeiculo({ ...novoVeiculo, chassi_tipo: e.target.value })}
            className="w-full border p-2 rounded focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-gray-700 mb-1">Ano:</label>
          <input
            type="text"
            required
            value={novoVeiculo.ano}
            onChange={(e) => setNovoVeiculo({ ...novoVeiculo, ano: e.target.value })}
            className="w-full border p-2 rounded focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-gray-700 mb-1">Garagem:</label>
          <select
            required
            value={novoVeiculo.garagem}
            onChange={(e) => setNovoVeiculo({ ...novoVeiculo, garagem: e.target.value })}
            className="w-full border p-2 rounded focus:border-blue-500"
          >
            {garagens.length === 0 && <option value="">Nenhuma garagem cadastrada</option>}
            {garagens.map((garagem) => (
              <option key={garagem.id} value={garagem.nome}>
                {garagem.nome}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-gray-700 mb-1">KM atual:</label>
          <input
            type="text"
            required
            value={novoVeiculo.km_atual}
            onChange={(e) => setNovoVeiculo({ ...novoVeiculo, km_atual: e.target.value })}
            className="w-full border p-2 rounded focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-gray-700 mb-1">Status:</label>
          <select
            required
            value={novoVeiculo.status}
            onChange={(e) => setNovoVeiculo({ ...novoVeiculo, status: e.target.value })}
            className="w-full border p-2 rounded focus:border-blue-500"
          >
            <option value="ativo">ativo</option>
            <option value="inativo">inativo</option>
            <option value="manutencao">manutencao</option>
            <option value="inspecao">inspecao</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 disabled:opacity-50"
        >
          {loading ? 'Salvando...' : 'Salvar Veículo'}
        </button>
      </form>
    </div>
  );
}