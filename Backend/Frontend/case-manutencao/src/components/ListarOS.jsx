import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../api';

export default function ListarOS({ onNovaInspecao }) {
  const [listaOS, setListaOS] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const carregarOS = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/ordens_servico`);
        if (response.ok) {
          const data = await response.json();
          setListaOS(data);
        }
      } catch (error) {
        console.error("Erro ao buscar OS:", error);
      } finally {
        setLoading(false);
      }
    };
    carregarOS();
  }, []);

  if (loading) return <p className="text-blue-500">Carregando Ordens de Serviço...</p>;

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4 text-gray-700">Ordens de Serviço</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="py-2 px-4 text-left text-gray-600">ID</th>
              <th className="py-2 px-4 text-left text-gray-600">Veículo</th>
              <th className="py-2 px-4 text-left text-gray-600">Inspeção</th>
              <th className="py-2 px-4 text-left text-gray-600">Item Inspeção</th>
              <th className="py-2 px-4 text-left text-gray-600">Item Checklist</th>
              <th className="py-2 px-4 text-left text-gray-600">Status</th>
              <th className="py-2 px-4 text-left text-gray-600">Descrição</th>
            </tr>
          </thead>
          <tbody>
            {listaOS.map((os) => (
              <tr key={os.id} className="border-b hover:bg-gray-50">
                <td className="py-2 px-4 font-bold text-blue-700">{os.id}</td>
                <td className="py-2 px-4">{os.veiculo_id || '—'}</td>
                <td className="py-2 px-4">{os.inspecao_id || '—'}</td>
                <td className="py-2 px-4">{os.item_inspecao_id || '—'}</td>
                <td className="py-2 px-4">{os.item_checklist_id || '—'}</td>
                <td className="py-2 px-4">{os.status || '—'}</td>
                <td className="py-2 px-4">{os.descricao_problema || os.descricao_servico || 'Sem descrição'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}