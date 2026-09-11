import React, { useState } from 'react';
import ListarOS from './components/ListarOS';
import CriarInspecao from './components/CriarInspecao';
import CriarVeiculo from './components/CriarVeiculo';
import CriarGaragem from './components/CriarGaragem';
import VerInspecoes from './components/VerInspecoes';
import VerVeiculos from './components/VerVeiculos';

export default function App() {
  const [telaAtual, setTelaAtual] = useState('listarOS');

  const [osSelecionada, setOsSelecionada] = useState('');

  const irParaNovaInspecao = (id) => {
    setOsSelecionada(id || '');
    setTelaAtual('criarInspecao');
  };

  const botoes = [
    { id: 'listarOS', label: 'Listar OS' },
    { id: 'criarInspecao', label: 'Criar Inspeção' },
    { id: 'verInspecao', label: 'Ver Inspeções' },
    { id: 'criarVeiculo', label: 'Criar Veículo' },
    { id: 'criarGaragem', label: 'Criar Garagem' },
    { id: 'verVeiculos', label: 'Ver Veículos' },
  ];

  return (
    <div className="min-h-screen bg-slate-100 p-8 font-sans">
      <div className="max-w-6xl mx-auto bg-white p-6 rounded-2xl shadow-lg border border-slate-200">
        <header className="mb-8 border-b border-slate-200 pb-5">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-3xl font-bold text-slate-800 mb-2">Gestão de Manutenção</h1>
              <p className="text-sm text-slate-500">Painel operacional</p>
            </div>
          </div>

          <nav className="mt-5 flex flex-wrap gap-3">
            {botoes.map((botao) => (
              <button
                key={botao.id}
                onClick={() => {
                  if (botao.id === 'criarInspecao') {
                    irParaNovaInspecao('');
                    return;
                  }
                  if (botao.id === 'verInspecao') {
                    setTelaAtual('verInspecao');
                    return;
                  }
                  if (botao.id === 'criarVeiculo') {
                    setTelaAtual('criarVeiculo');
                    return;
                  }
                  if (botao.id === 'criarGaragem') {
                    setTelaAtual('criarGaragem');
                    return;
                  }
                  if (botao.id === 'verVeiculos') {
                    setTelaAtual('verVeiculos');
                    return;
                  }
                  setTelaAtual(botao.id);
                }}
                className={`min-w-[130px] px-4 py-2 rounded-xl text-sm font-bold border transition-all duration-200 ${
                  telaAtual === botao.id
                    ? 'bg-blue-700 text-white border-blue-700 shadow-md'
                    : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-blue-50 hover:text-blue-800 hover:border-blue-300 hover:shadow-sm'
                }`}
              >
                {botao.label}
              </button>
            ))}
          </nav>
        </header>

        <main>
          {telaAtual === 'listarOS' && (
            <ListarOS onNovaInspecao={irParaNovaInspecao} />
          )}

          {telaAtual === 'criarInspecao' && (
            <CriarInspecao
              osInicial={osSelecionada}
              onSucesso={() => setTelaAtual('verInspecao')}
            />
          )}

          {telaAtual === 'verInspecao' && (
            <VerInspecoes />
          )}

          {telaAtual === 'criarVeiculo' && (
            <CriarVeiculo onSucesso={() => setTelaAtual('listarOS')} />
          )}

          {telaAtual === 'criarGaragem' && (
            <CriarGaragem onSucesso={() => setTelaAtual('listarOS')} />
          )}

          {telaAtual === 'verVeiculos' && (
            <VerVeiculos />
          )}
        </main>
      </div>
    </div>
  );
}