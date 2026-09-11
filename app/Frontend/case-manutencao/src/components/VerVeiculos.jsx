import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../api';

export default function VerVeiculos() {
  const [veiculos, setVeiculos] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const carregarVeiculos = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/veiculos`);
        if (response.ok) {
          const data = await response.json();
          setVeiculos(data);
        }
      } catch (error) {
        console.error('Erro ao buscar veículos:', error);
      } finally {
        setLoading(false);
      }
    };

    carregarVeiculos();
  }, []);

  if (loading) return <p className="text-blue-500">Carregando veículos...</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Veículos Cadastrados</h2>
          <p className="text-sm text-gray-500">Status atual, quilometragem e modelo</p>
        </div>
        <span className="rounded-full bg-blue-50 text-blue-700 px-4 py-2 text-sm font-bold">
          {veiculos.length} veículo(s)
        </span>
      </div>

      {veiculos.length === 0 ? (
        <div className="rounded border border-dashed border-gray-300 p-8 text-center text-gray-500 bg-gray-50">
          Nenhum veículo encontrado.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-gray-200 shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-800 text-white">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide">ID</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide">Modelo</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide">Prefixo</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide">Quilometragem</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide">Status</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide">Chassi</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide">Ano</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide">Garagem</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {veiculos.map((veiculo) => (
                <tr key={veiculo.id} className="hover:bg-gray-50 align-top">
                  <td className="px-4 py-3 font-bold text-blue-700">{veiculo.id}</td>
                  <td className="px-4 py-3 text-gray-700">{veiculo.modelo || '—'}</td>
                  <td className="px-4 py-3 text-gray-700">{veiculo.prefixo || '—'}</td>
                  <td className="px-4 py-3 text-gray-700">{veiculo.km_atual || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${
                      veiculo.status === 'inativo'
                        ? 'bg-red-100 text-red-700'
                        : veiculo.status === 'manutencao'
                        ? 'bg-yellow-100 text-yellow-700'
                        : veiculo.status === 'inspecao'
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-green-100 text-green-700'
                    }`}> {veiculo.status || '—'} </span>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{veiculo.chassi_tipo || '—'}</td>
                  <td className="px-4 py-3 text-gray-700">{veiculo.ano || '—'}</td>
                  <td className="px-4 py-3 text-gray-700">{veiculo.garagem || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
