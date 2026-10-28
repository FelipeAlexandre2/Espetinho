import React, { useState, useEffect } from 'react';
import { PrintJob, Order } from '../types';
import { 
  Printer, Smartphone, CheckCircle2, Clock, RefreshCw, Volume2, 
  VolumeX, HelpCircle, X, Sparkles, AlertCircle, Play, Laptop
} from 'lucide-react';
import { fetchPrintQueueHistory, reprintJob } from '../lib/storage';
import { printReceiptDirect, getReceiptSettings } from '../utils/printReceipt';
import { playOrderAlertChime } from '../utils/audioAlert';

interface UsbPrintStationModalProps {
  isOpen: boolean;
  onClose: () => void;
  isAutoPrintEnabled: boolean;
  onToggleAutoPrint: (enabled: boolean) => void;
  isSoundEnabled: boolean;
  onToggleSound: (enabled: boolean) => void;
  recentJobs: PrintJob[];
  onRefreshJobs: () => void;
}

export const UsbPrintStationModal: React.FC<UsbPrintStationModalProps> = ({
  isOpen,
  onClose,
  isAutoPrintEnabled,
  onToggleAutoPrint,
  isSoundEnabled,
  onToggleSound,
  recentJobs,
  onRefreshJobs,
}) => {
  const [activeTab, setActiveTab] = useState<'status' | 'historico' | 'ajuda'>('status');
  const [testPrinting, setTestPrinting] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const showNotification = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  const handleTestPrint = async () => {
    setTestPrinting(true);
    try {
      if (isSoundEnabled) playOrderAlertChime();
      
      const settings = getReceiptSettings();
      const testOrder: Order = {
        id: `test-print-${Date.now()}`,
        orderNumber: 9999,
        tableOrCustomer: 'TESTE IMPRESSÃO USB',
        items: [
          {
            id: 't-1',
            productId: 'test',
            productName: 'Espeto Carne Teste',
            quantity: 2,
            price: 11.00,
            meatPoint: 'ao_ponto',
            status: 'entregue',
            requiresMeatPoint: true,
          },
          {
            id: 't-2',
            productId: 'test-beb',
            productName: 'Coca-Cola 350ml',
            quantity: 1,
            price: 6.00,
            status: 'entregue',
            requiresMeatPoint: false,
          }
        ],
        status: 'novo',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        subtotal: 28.00,
        discount: 0,
        serviceFee: 0,
        total: 28.00,
        isPaid: false,
        notes: 'TESTE DE COMUNICAÇÃO CELULAR -> COMPUTADOR USB (58MM)',
      };

      await printReceiptDirect(testOrder, settings, 'etiqueta_mesa', '58mm');
      showNotification('✅ Etiqueta de teste 58mm enviada para a impressora!');
    } catch (e) {
      console.error(e);
      showNotification('⚠️ Erro ao disparar impressão de teste.');
    } finally {
      setTestPrinting(false);
    }
  };

  const handleReprint = async (job: PrintJob) => {
    try {
      const settings = getReceiptSettings();
      await printReceiptDirect(job.order, settings, job.type || 'etiqueta_mesa', '58mm');
      await reprintJob(job.id);
      onRefreshJobs();
      showNotification(`✅ Etiqueta #${job.orderNumber} reenviada para a impressora!`);
    } catch (e) {
      showNotification('⚠️ Falha ao reimprimir.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-orange-500/25 shrink-0">
              <Printer className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black tracking-tight text-white">
                  Estação de Impressão USB (58mm)
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                  Online no PC
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Conecta os pedidos feitos no <strong>celular</strong> à impressora USB deste <strong>computador</strong>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback message banner */}
        {feedbackMsg && (
          <div className="bg-amber-500 text-slate-950 px-4 py-2.5 text-xs font-black flex items-center justify-between animate-in slide-in-from-top-2">
            <span>{feedbackMsg}</span>
            <button onClick={() => setFeedbackMsg(null)} className="cursor-pointer font-bold">✕</button>
          </div>
        )}

        {/* Subheader / Tabs */}
        <div className="bg-slate-100 p-2 border-b border-slate-200 flex items-center space-x-1 shrink-0">
          <button
            onClick={() => setActiveTab('status')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'status'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Laptop className="w-4 h-4 text-amber-500" />
            <span>Painel do Computador</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('historico');
              onRefreshJobs();
            }}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'historico'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-4 h-4 text-blue-500" />
            <span>Fila & Histórico ({recentJobs.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('ajuda')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'ajuda'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <HelpCircle className="w-4 h-4 text-emerald-500" />
            <span>Como Configurar</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          
          {/* TAB 1: STATUS & CONTROLS */}
          {activeTab === 'status' && (
            <div className="space-y-4">
              {/* How it connects illustration banner */}
              <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-red-500/10 border border-amber-500/20 rounded-2xl p-4 flex items-center justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <div className="text-3xl">📱 ➔ 💻 ➔ 🖨️</div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-black text-slate-900">
                      Ponte Automática Celular ➔ Impressora USB
                    </h4>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Quando o atendente ou cliente confirmar no celular, a etiqueta de <strong>58mm</strong> sai na impressora ligada ao USB deste computador.
                    </p>
                  </div>
                </div>
              </div>

              {/* Switches Container */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Auto-print toggle */}
                <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-xs font-black text-slate-800 block">
                      Auto-Imprimir Pedidos do Celular
                    </span>
                    <span className="text-[11px] text-slate-500 block">
                      {isAutoPrintEnabled ? '🟢 Ativo (Imprime assim que o celular envia)' : '⏸️ Pausado'}
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isAutoPrintEnabled}
                      onChange={(e) => onToggleAutoPrint(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                  </label>
                </div>

                {/* Sound chime toggle */}
                <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-xs font-black text-slate-800 block">
                      Tocar Aviso Sonoro (Sino)
                    </span>
                    <span className="text-[11px] text-slate-500 block">
                      {isSoundEnabled ? '🔔 Toca um sino ao chegar pedido' : '🔇 Silencioso'}
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isSoundEnabled}
                      onChange={(e) => onToggleSound(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                  </label>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
                <button
                  type="button"
                  onClick={handleTestPrint}
                  disabled={testPrinting}
                  className="flex-1 py-3 px-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  <Printer className="w-4 h-4 text-amber-400" />
                  <span>{testPrinting ? 'Imprimindo teste...' : 'Testar Impressão 58mm no Computador'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => playOrderAlertChime()}
                  className="py-3 px-4 rounded-2xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                  title="Testar som do sino"
                >
                  <Volume2 className="w-4 h-4 text-amber-600" />
                  <span>Testar Sino</span>
                </button>
              </div>

              {/* Status information note */}
              <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-2xl text-xs text-blue-900 space-y-1">
                <p className="font-black flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-blue-600" />
                  <span>Este computador está pronto para receber os pedidos dos celulares!</span>
                </p>
                <p className="text-[11px] text-blue-700">
                  Basta deixar esta aba aberta no computador. Quando qualquer pessoa fechar um pedido no celular, a etiqueta sairá automaticamente na impressora USB conectada aqui.
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: HISTORY & QUEUE */}
          {activeTab === 'historico' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-700 uppercase">
                  Últimos Pedidos Recebidos para Impressão
                </span>
                <button
                  onClick={onRefreshJobs}
                  className="text-xs text-amber-600 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Atualizar</span>
                </button>
              </div>

              {recentJobs.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  <Smartphone className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  Nenhum pedido foi enviado pelo celular ainda. Faça um pedido no celular para testar!
                </div>
              ) : (
                <div className="space-y-2">
                  {recentJobs.map((job) => (
                    <div
                      key={job.id}
                      className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-xs sm:text-sm text-slate-800">
                            Pedido #{job.orderNumber} • {job.tableName}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                            📱 {job.source || 'celular'}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2">
                          <span>{new Date(job.createdAt).toLocaleTimeString('pt-BR')}</span>
                          <span>•</span>
                          <span>{job.order?.items?.length || 0} itens</span>
                          <span>•</span>
                          <span className="font-bold text-emerald-700">
                            R$ {(job.order?.total || 0).toFixed(2).replace('.', ',')}
                          </span>
                          <span>•</span>
                          <span className={job.printed ? 'text-emerald-600 font-bold' : 'text-orange-600 font-black'}>
                            {job.printed ? '✓ Impresso' : '⏳ Aguardando'}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleReprint(job)}
                        className="py-1.5 px-3 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-black shadow-2xs transition active:scale-95 cursor-pointer flex items-center gap-1"
                      >
                        <Printer className="w-3.5 h-3.5 text-slate-600" />
                        <span>Reimprimir 58mm</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: SETUP INSTRUCTIONS */}
          {activeTab === 'ajuda' && (
            <div className="space-y-4 text-xs text-slate-700 leading-relaxed">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <h4 className="font-black text-slate-900 text-sm">
                  1. Impressora Conectada no Computador:
                </h4>
                <p>
                  Conecte o cabo USB da sua impressora térmica 58mm no computador (Windows, Mac ou Linux) e instale o driver da sua impressora (ex: POS-58, Elgin, Bematech ou Generic / Text Only).
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <h4 className="font-black text-slate-900 text-sm">
                  2. Defina a Impressora 58mm como Padrão:
                </h4>
                <p>
                  No Painel de Controle do Windows (Impressoras) ou Preferências do Sistema no Mac, clique com botão direito na sua impressora térmica 58mm e escolha <strong>"Definir como Impressora Padrão"</strong>.
                </p>
              </div>

              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-emerald-950 space-y-2">
                <h4 className="font-black text-sm flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>Dica de Ouro: Impressão 100% Silenciosa (Sem Janela)</span>
                </h4>
                <p className="text-xs">
                  Para que a etiqueta saia no papel <strong>instantaneamente</strong> sem nem abrir aquela tela de confirmação do navegador:
                </p>
                <ol className="list-decimal list-inside space-y-1 text-xs">
                  <li>No Windows, crie um atalho do Google Chrome na sua área de trabalho.</li>
                  <li>Clique com botão direito no atalho ➔ <strong>Propriedades</strong>.</li>
                  <li>No campo <strong>Destino</strong>, adicione ao final: <code className="bg-white px-2 py-0.5 rounded border font-mono font-bold text-slate-900">--kiosk-printing</code></li>
                  <li>Pronto! Ao abrir o sistema por esse atalho, cada pedido que o garçom confirmar no celular sairá direto do papel da impressora USB na hora!</li>
                </ol>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-5 py-3.5 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Serviço ativo na porta 3000 • Bobina 58mm</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black cursor-pointer shadow-xs"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
