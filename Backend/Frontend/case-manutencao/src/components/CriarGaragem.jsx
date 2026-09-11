import React, { useState } from 'react';
import { API_BASE_URL } from '../api';

export default function CriarGaragem({ onSucesso }) {
  const [loading, setLoading] = useState(false);

  const [novaGaragem, setNovaGaragem] = useState({
    nome: '',
    endereco: ''
  });

  const handleCriarGaragem = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/garagens`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(novaGaragem),
      });

      if (response.ok) {
        alert('Garagem criada com sucesso!');
        if (onSucesso) onSucesso();
      } else {
        const mensagem = await response.text();
        alert(`Erro ao criar a garagem. Verifique os dados. ${mensagem}`);
      }
    } catch (error) {
      console.error('Erro ao criar garagem:', error);
      alert('Erro de conexão com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4 text-gray-700">Nova Garagem</h2>
      <form onSubmit={handleCriarGaragem} className="space-y-4">
        <div>
          <label className="block text-gray-700 mb-1">Nome:</label>
          <input
            type="text"
            required
            value={novaGaragem.nome}
            onChange={(e) => setNovaGaragem({ ...novaGaragem, nome: e.target.value })}
            className="w-full border p-2 rounded focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-gray-700 mb-1">Endereço:</label>
          <input
            type="text"
            required
            value={novaGaragem.endereco}
            onChange={(e) => setNovaGaragem({ ...novaGaragem, endereco: e.target.value })}
            className="w-full border p-2 rounded focus:border-blue-500"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 disabled:opacity-50"
        >
          {loading ? 'Salvando...' : 'Salvar Garagem'}
        </button>
      </form>
    </div>
  );
}
