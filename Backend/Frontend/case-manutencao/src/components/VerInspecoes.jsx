import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../api';

export default function VerInspecoes() {
  const [inspecoes, setInspecoes] = useState([]);
  const [itensChecklist, setItensChecklist] = useState([]);
  const [itensPorInspecao, setItensPorInspecao] = useState({});
  const [inspecaoSelecionada, setInspecaoSelecionada] = useState(null);
  const [mostrarDetalhes, setMostrarDetalhes] = useState(false);
  const [itemEmEdicao, setItemEmEdicao] = useState(null);
  const [formItem, setFormItem] = useState({
    resultado: '',
    hora_inicio: '',
    observacoes: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const carregarDados = async () => {
      setLoading(true);
      try {
        const [resInspecoes, resItensChecklist] = await Promise.all([
          fetch(`${API_BASE_URL}/inspecoes`),
          fetch(`${API_BASE_URL}/itenschecklist`)
        ]);

        if (resInspecoes.ok) {
          const dataInspecoes = await resInspecoes.json();
          setInspecoes(dataInspecoes);
        }

        if (resItensChecklist.ok) {
          const dataItensChecklist = await resItensChecklist.json();
          setItensChecklist(dataItensChecklist);
        }
      } catch (error) {
        console.error('Erro ao buscar inspeções:', error);
      } finally {
        setLoading(false);
      }
    };

    carregarDados();
  }, []);

  const abrirInspecao = async (inspecao) => {
    setInspecaoSelecionada(inspecao);
    setMostrarDetalhes(true);
    setItemEmEdicao(null);
    setFormItem({
      resultado: '',
      hora_inicio: '',
      observacoes: '',
    });

    if (itensPorInspecao[inspecao.id]) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/itens_inspecao/inspecao/${inspecao.id}`);
      if (response.ok) {
        const data = await response.json();
        setItensPorInspecao((atual) => ({
          ...atual,
          [inspecao.id]: data,
        }));
      }
    } catch (error) {
      console.error(`Erro ao buscar itens da inspeção ${inspecao.id}:`, error);
    }
  };

  const iniciarConclusao = (item) => {
    setItemEmEdicao(item.id);
    setFormItem({
      resultado: '',
      hora_inicio: '',
      observacoes: '',
    });
  };

  const concluirItem = async (item) => {
    if (!formItem.resultado || !formItem.hora_inicio || !formItem.observacoes.trim()) {
      alert('Preencha conformidade, hora de início e observações para concluir o item.');
      return;
    }

    try {
      const payload = {
        resultado: formItem.resultado,
        feito: true,
        hora_inicio: formItem.hora_inicio,
        observacoes: formItem.observacoes.trim(),
      };

      const response = await fetch(`${API_BASE_URL}/itens_inspecao/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const atualizado = await response.json();
        const listaAtual = itensPorInspecao[inspecaoSelecionada.id] || [];
        const novaLista = listaAtual.map((i) => i.id === atualizado.id ? atualizado : i);
        setItensPorInspecao((atual) => ({
          ...atual,
          [inspecaoSelecionada.id]: novaLista,
        }));
        setItemEmEdicao(null);
        setFormItem({
          resultado: '',
          hora_inicio: '',
          observacoes: '',
        });
      } else {
        const texto = await response.text();
        console.error('Erro ao concluir item:', texto);
        alert(`Erro ao concluir o item: ${texto}`);
      }
    } catch (error) {
      console.error('Erro ao concluir item:', error);
      alert('Erro de conexão ao concluir o item.');
    }
  };

  const voltarParaLista = () => {
    setMostrarDetalhes(false);
    setInspecaoSelecionada(null);
    setItemEmEdicao(null);
    setFormItem({
      resultado: '',
      hora_inicio: '',
      observacoes: '',
    });
  };

  if (loading) return <p className="text-blue-500">Carregando inspeções...</p>;

  if (mostrarDetalhes && inspecaoSelecionada) {
    const listaItens = itensPorInspecao[inspecaoSelecionada.id] || [];

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Inspeção #{inspecaoSelecionada.id}</h2>
            <p className="text-sm text-gray-500">
              {inspecaoSelecionada.data_inspecao} • {inspecaoSelecionada.turno}
            </p>
          </div>
          <button
            onClick={voltarParaLista}
            className="bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-900"
          >
            Voltar para lista
          </button>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm text-gray-700">
            <span><b>Veículo:</b> {inspecaoSelecionada.veiculo_prefixo || inspecaoSelecionada.veiculo_id}</span>
            <span><b>Status inspeção:</b> {inspecaoSelecionada.status_inspecao || 'pendente'}</span>
            <span><b>Garagem:</b> {inspecaoSelecionada.garagem_id}</span>
            <span><b>Mecânico:</b> {inspecaoSelecionada.mecanico_id}</span>
            <span><b>KM no Ato:</b> {inspecaoSelecionada.km_no_ato}</span>
          </div>
          <div className="mt-3 text-sm text-gray-700">
            <b>Observações:</b> {inspecaoSelecionada.observacoes || 'Sem observações'}
          </div>
          <div className="mt-4">
            <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide">Ordens de serviço vinculadas</h3>
            {(inspecaoSelecionada.ordens_servico || []).length === 0 ? (
              <p className="text-xs text-gray-500 mt-2">Nenhuma OS vinculada.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                {(inspecaoSelecionada.ordens_servico || []).map((os) => (
                  <div key={os.id} className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs text-gray-700">
                    <div><b>OS #{os.id}</b></div>
                    <div>Veículo: {os.veiculo_id}</div>
                    <div>Inspeção: {os.inspecao_id}</div>
                    <div>ItemInspecao: {os.item_inspecao_id}</div>
                    <div>ItemChecklist: {os.item_checklist_id}</div>
                    <div>Status: {os.status}</div>
                    <div>Descrição: {os.descricao_problema || os.descricao_servico || 'Sem descrição'}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-800">Itens da inspeção</h3>
            <span className="rounded-full bg-blue-50 text-blue-700 px-3 py-1 text-xs font-bold">
              {listaItens.length} item(ns)
            </span>
          </div>

          {listaItens.length === 0 ? (
            <p className="text-gray-500">Nenhum item de inspeção encontrado.</p>
          ) : (
            listaItens.map((item) => {
              const checklist = itensChecklist.find((check) => check.id === item.item_checklist_id);
              const estaEditando = itemEmEdicao === item.id;

              return (
                <div key={item.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <span className="font-bold text-blue-700">
                        Item #{item.item_checklist_id}
                      </span>
                      <p className="text-sm text-gray-700 mt-1">
                        {checklist?.descricao || 'Descrição não informada'}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full px-3 py-1 text-xs font-bold bg-gray-100 text-gray-700">
                        {item.resultado}
                      </span>
                      <span className="rounded-full px-3 py-1 text-xs font-bold bg-gray-100 text-gray-700">
                        {item.feito ? 'Concluído' : 'Pendente'}
                      </span>
                      {!item.feito && (
                        <button
                          onClick={() => iniciarConclusao(item)}
                          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 text-sm font-semibold"
                        >
                          Definir como concluído
                        </button>
                      )}
                    </div>
                  </div>

                  {estaEditando && (
                    <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">
                            Conformidade
                          </label>
                          <select
                            required
                            value={formItem.resultado}
                            onChange={(e) => setFormItem({ ...formItem, resultado: e.target.value })}
                            className="w-full border p-2 rounded"
                          >
                            <option value="">Selecione</option>
                            <option value="conforme">conforme</option>
                            <option value="nao_conforme">nao_conforme</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">
                            Hora de início
                          </label>
                          <input
                            type="time"
                            required
                            value={formItem.hora_inicio}
                            onChange={(e) => setFormItem({ ...formItem, hora_inicio: e.target.value })}
                            className="w-full border p-2 rounded"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-sm font-semibold text-gray-700 mb-1">
                            Observações
                          </label>
                          <textarea
                            rows="3"
                            required
                            value={formItem.observacoes}
                            onChange={(e) => setFormItem({ ...formItem, observacoes: e.target.value })}
                            className="w-full border p-2 rounded"
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mt-4">
                        <button
                          onClick={() => concluirItem(item)}
                          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 text-sm font-semibold"
                        >
                          Salvar como concluído
                        </button>
                        <button
                          onClick={() => {
                            setItemEmEdicao(null);
                            setFormItem({
                              resultado: '',
                              hora_inicio: '',
                              observacoes: '',
                            });
                          }}
                          className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400 text-sm font-semibold"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3 text-xs text-gray-600">
                    <span><b>Hora início:</b> {item.hora_inicio || '—'}</span>
                    <span><b>Duração:</b> {item.duracao_min || '0'} min</span>
                    <span><b>Resultado:</b> {item.resultado}</span>
                    <span><b>Obs.:</b> {item.observacoes || '—'}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Inspeções Registradas</h2>
          <p className="text-sm text-gray-500">Histórico de inspeções</p>
        </div>
        <span className="rounded-full bg-blue-50 text-blue-700 px-4 py-2 text-sm font-bold">
          {inspecoes.length} registro(s)
        </span>
      </div>

      {inspecoes.length === 0 ? (
        <div className="rounded border border-dashed border-gray-300 p-8 text-center text-gray-500 bg-gray-50">
          Nenhuma inspeção encontrada.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-gray-200 shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-800 text-white">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide">#</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide">Data</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide">Veículo</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide">Status inspeção</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide">Garagem</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide">Mecânico</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide">Turno</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide">KM no Ato</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide">Observações</th>
                <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wide">Ação</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {inspecoes.map((inspecao) => (
                <tr key={inspecao.id} className="hover:bg-gray-50 align-top">
                  <td className="px-4 py-3 font-bold text-blue-700">{inspecao.id}</td>
                  <td className="px-4 py-3 text-gray-700">{inspecao.data_inspecao || '—'}</td>
                  <td className="px-4 py-3 text-gray-700">{inspecao.veiculo_prefixo || inspecao.veiculo_id}</td>
                  <td className="px-4 py-3 text-gray-700">{inspecao.status_inspecao || 'pendente'}</td>
                  <td className="px-4 py-3 text-gray-700">{inspecao.garagem_id}</td>
                  <td className="px-4 py-3 text-gray-700">{inspecao.mecanico_id}</td>
                  <td className="px-4 py-3 text-gray-700 capitalize">{inspecao.turno}</td>
                  <td className="px-4 py-3 text-gray-700">{inspecao.km_no_ato}</td>
                  <td className="px-4 py-3 text-gray-700 max-w-xs whitespace-pre-wrap">
                    {inspecao.observacoes || 'Sem observações'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => abrirInspecao(inspecao)}
                      className="bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700 text-sm font-semibold"
                    >
                      Abrir inspeção
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}