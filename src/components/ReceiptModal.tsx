import React, { useState, useEffect } from 'react';
import { Order, ReceiptSettings, ReceiptPaperWidth, ReceiptType } from '../types';
import { 
  getReceiptSettings, 
  saveReceiptSettings, 
  printReceiptDirect, 
  openReceiptInNewWindow, 
  formatReceiptWhatsAppText, 
  formatReceiptRawText, 
  shareReceiptNative 
} from '../utils/printReceipt';
import { 
  Printer, X, Check, Share2, Copy, ExternalLink, Settings, 
  Smartphone, Monitor, Flame, Utensils, FileText, CheckCircle2, ChevronRight
} from 'lucide-react';

interface ReceiptModalProps {
  order: Order | null;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ order, onClose }) => {
  if (!order) return null;

  // Print format & profile states
  const [paperWidth, setPaperWidth] = useState<ReceiptPaperWidth>('80mm');
  const [receiptType, setReceiptType] = useState<ReceiptType>('cliente');
  const [settings, setSettings] = useState<ReceiptSettings>(getReceiptSettings);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [copiedNotification, setCopiedNotification] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  // Synchronize settings with localStorage
  useEffect(() => {
    setSettings(getReceiptSettings());
  }, []);

  const handleSaveSettings = (newSettings: ReceiptSettings) => {
    setSettings(newSettings);
    saveReceiptSettings(newSettings);
  };

  const handlePrint = async () => {
    setIsPrinting(true);
    try {
      await printReceiptDirect(order, settings, receiptType, paperWidth);
    } finally {
      setTimeout(() => setIsPrinting(false), 800);
    }
  };

  const handleOpenNewWindow = () => {
    openReceiptInNewWindow(order, settings, receiptType, paperWidth);
  };

  const handleShareWhatsApp = () => {
    shareReceiptNative(order, settings, receiptType);
  };

  const handleCopyText = async () => {
    const text = formatReceiptRawText(order, settings, receiptType, paperWidth);
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        textarea.remove();
      }
      setCopiedNotification(true);
      setTimeout(() => setCopiedNotification(false), 2500);
    } catch (err) {
      console.error('Falha ao copiar texto:', err);
    }
  };

  const formattedDate = new Date(order.createdAt).toLocaleDateString('pt-BR');
  const formattedTime = new Date(order.createdAt).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const isKitchen = receiptType === 'cozinha';

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[96vh] my-auto">
        
        {/* Header Bar */}
        <div className="no-print bg-slate-900 text-white p-3.5 sm:p-4 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
              <Printer className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base leading-tight">Imprimir Comprovante</h3>
              <p className="text-[11px] text-slate-400">Compatível com Celular & Computador</p>
            </div>
          </div>
          
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
              className={`p-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                isSettingsOpen
                  ? 'bg-amber-500 text-slate-950 border-amber-400'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
              }`}
              title="Configurar Dados do Restaurante"
            >
              <Settings className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick Options Toolbar */}
        <div className="no-print bg-slate-100 p-2.5 sm:p-3 border-b border-slate-200 space-y-2 shrink-0">
          {/* Format and Type Selectors */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            
            {/* Document Type Selector */}
            <div className="flex items-center bg-white p-0.5 rounded-xl border border-slate-200 shadow-2xs">
              <button
                type="button"
                onClick={() => setReceiptType('cliente')}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  receiptType === 'cliente'
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Conta / Cliente
              </button>
              <button
                type="button"
                onClick={() => setReceiptType('cozinha')}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                  receiptType === 'cozinha'
                    ? 'bg-orange-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Flame className="w-3 h-3 text-amber-300" />
                <span>Cozinha / Grelha</span>
              </button>
              <button
                type="button"
                onClick={() => setReceiptType('pre_conta')}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  receiptType === 'pre_conta'
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Pré-Conta
              </button>
            </div>

            {/* Paper Width Selector */}
            <div className="flex items-center gap-1 bg-white p-0.5 rounded-xl border border-slate-200 shadow-2xs">
              <button
                type="button"
                onClick={() => setPaperWidth('80mm')}
                className={`px-2 py-1 text-[11px] font-black rounded-lg transition-all cursor-pointer ${
                  paperWidth === '80mm'
                    ? 'bg-amber-500 text-slate-950 font-black'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Impressoras térmicas de balcão (Epson, Elgin, Bematech 80mm)"
              >
                80mm
              </button>
              <button
                type="button"
                onClick={() => setPaperWidth('58mm')}
                className={`px-2 py-1 text-[11px] font-black rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                  paperWidth === '58mm'
                    ? 'bg-amber-500 text-slate-950 font-black'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Mini impressoras térmicas Bluetooth portáteis (58mm)"
              >
                <Smartphone className="w-3 h-3" />
                <span>58mm</span>
              </button>
              <button
                type="button"
                onClick={() => setPaperWidth('a4')}
                className={`px-2 py-1 text-[11px] font-black rounded-lg transition-all cursor-pointer ${
                  paperWidth === 'a4'
                    ? 'bg-amber-500 text-slate-950 font-black'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Impressoras convencionais A4"
              >
                A4
              </button>
            </div>

          </div>

          {/* Settings Drawer (if open) */}
          {isSettingsOpen && (
            <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3 text-xs space-y-2 mt-2 animate-in fade-in duration-200">
              <div className="flex items-center justify-between font-bold text-amber-900 pb-1 border-b border-amber-200">
                <span>Personalizar Cabeçalho do Restaurante</span>
                <button
                  onClick={() => setIsSettingsOpen(false)}
                  className="text-amber-700 hover:text-amber-950 text-[11px] font-extrabold cursor-pointer"
                >
                  Fechar ✕
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-600">Nome do Estabelecimento:</label>
                  <input
                    type="text"
                    value={settings.restaurantName}
                    onChange={(e) => handleSaveSettings({ ...settings, restaurantName: e.target.value })}
                    className="w-full px-2 py-1 bg-white border border-amber-300 rounded-lg text-slate-900 font-bold outline-none"
                    placeholder="ESPETINHO DO CHEFE"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-600">Telefone / WhatsApp:</label>
                  <input
                    type="text"
                    value={settings.phone || ''}
                    onChange={(e) => handleSaveSettings({ ...settings, phone: e.target.value })}
                    className="w-full px-2 py-1 bg-white border border-amber-300 rounded-lg text-slate-900 font-bold outline-none"
                    placeholder="(11) 98765-4321"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-600">Endereço:</label>
                  <input
                    type="text"
                    value={settings.address || ''}
                    onChange={(e) => handleSaveSettings({ ...settings, address: e.target.value })}
                    className="w-full px-2 py-1 bg-white border border-amber-300 rounded-lg text-slate-900 font-bold outline-none"
                    placeholder="Rua da Brasa, 100 - Centro"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-600">CNPJ / CPF:</label>
                  <input
                    type="text"
                    value={settings.cnpj || ''}
                    onChange={(e) => handleSaveSettings({ ...settings, cnpj: e.target.value })}
                    className="w-full px-2 py-1 bg-white border border-amber-300 rounded-lg text-slate-900 font-bold outline-none"
                    placeholder="12.345.678/0001-90"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-600">Mensagem do Rodapé:</label>
                <input
                  type="text"
                  value={settings.footerMessage || ''}
                  onChange={(e) => handleSaveSettings({ ...settings, footerMessage: e.target.value })}
                  className="w-full px-2 py-1 bg-white border border-amber-300 rounded-lg text-slate-900 font-bold outline-none"
                  placeholder="Obrigado pela preferência! Volte sempre 🔥"
                />
              </div>
            </div>
          )}
        </div>

        {/* Receipt Visual Preview (Scrollable Area) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-200/60 flex items-center justify-center min-h-[300px]">
          
          <div 
            className={`printable-receipt bg-white shadow-lg border border-slate-300 font-mono text-slate-900 space-y-3 transition-all duration-200 rounded-xs ${
              paperWidth === '58mm'
                ? 'w-[280px] p-4 text-[11px]'
                : paperWidth === '80mm'
                ? 'w-[340px] p-5 text-[12px]'
                : 'w-full max-w-[420px] p-6 text-[13px]'
            }`}
          >
            {/* Header */}
            <div className="text-center space-y-0.5 border-b border-dashed border-slate-400 pb-3">
              <h2 className="font-black text-slate-900 text-base uppercase tracking-wider">
                {settings.restaurantName || 'ESPETINHO DO CHEFE'}
              </h2>
              {settings.subtitle && <p className="text-[10px] text-slate-600">{settings.subtitle}</p>}
              {settings.address && <p className="text-[10px] text-slate-600">{settings.address}</p>}
              {settings.phone && <p className="text-[10px] text-slate-600">WhatsApp/Tel: {settings.phone}</p>}
              {settings.cnpj && <p className="text-[10px] text-slate-600">CNPJ: {settings.cnpj}</p>}
              
              <div className="mt-1 pt-1 inline-block border border-dashed border-slate-400 px-2 py-0.5 rounded text-[9px] font-extrabold text-slate-700 uppercase">
                {isKitchen
                  ? '🔥 COMANDA DE COZINHA / GRELHA 🔥'
                  : receiptType === 'pre_conta'
                  ? '📄 PRÉ-CONTA / CONFERÊNCIA'
                  : '*** COMPROVANTE NÃO FISCAL ***'}
              </div>
            </div>

            {/* Order & Table info */}
            <div className="flex justify-between font-black text-slate-900 border-b border-dashed border-slate-400 pb-2">
              <span className="text-sm">PEDIDO #{order.orderNumber}</span>
              <span className="uppercase text-sm">{order.tableOrCustomer}</span>
            </div>

            <div className="text-[10px] text-slate-600 flex justify-between">
              <span>Data: {formattedDate}</span>
              <span>Hora: {formattedTime}</span>
            </div>

            {order.notes && (
              <div className="text-[11px] bg-amber-50 p-1.5 rounded border border-amber-200 text-amber-900 font-medium">
                <strong>Obs:</strong> {order.notes}
              </div>
            )}

            {/* Items list */}
            <div className="space-y-2 py-2 border-y border-dashed border-slate-400">
              <div className="flex justify-between font-extrabold text-slate-800 text-[10px] uppercase">
                <span>Qtd Descrição</span>
                {!isKitchen && <span>Total</span>}
              </div>

              {order.items.map((item) => (
                <div key={item.id} className="receipt-item space-y-0.5">
                  <div className="flex justify-between font-bold text-slate-900">
                    <span className={isKitchen ? 'text-xs font-black' : ''}>
                      {item.quantity}x {item.productName}
                    </span>
                    {!isKitchen && (
                      <span>R$ {(item.price * item.quantity).toFixed(2).replace('.', ',')}</span>
                    )}
                  </div>
                  {item.meatPoint && (
                    <div className="text-[11px] text-amber-900 font-extrabold pl-2">
                      ▸ Ponto: {item.meatPoint === 'mal_passada' ? 'MAL PASSADA' : item.meatPoint === 'ao_ponto' ? 'AO PONTO' : 'BEM PASSADA'}
                    </div>
                  )}
                  {item.notes && (
                    <div className="text-[10px] text-slate-600 italic pl-2">
                      * Obs: {item.notes}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Financial Totals (Only if not kitchen ticket) */}
            {!isKitchen && (
              <div className="space-y-1 text-[11px] pt-1">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal Itens:</span>
                  <span>R$ {order.subtotal.toFixed(2).replace('.', ',')}</span>
                </div>

                {order.serviceFee > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Taxa de Serviço:</span>
                    <span>R$ {order.serviceFee.toFixed(2).replace('.', ',')}</span>
                  </div>
                )}

                {order.discount > 0 && (
                  <div className="flex justify-between text-rose-600 font-bold">
                    <span>Desconto Especial:</span>
                    <span>- R$ {order.discount.toFixed(2).replace('.', ',')}</span>
                  </div>
                )}

                <div className="flex justify-between font-black text-slate-900 text-sm pt-2 border-t border-slate-400">
                  <span>TOTAL A PAGAR:</span>
                  <span>R$ {order.total.toFixed(2).replace('.', ',')}</span>
                </div>

                <div className="flex justify-between text-[10px] text-slate-700 pt-1 border-t border-dotted border-slate-300">
                  <span>Forma de Pagamento:</span>
                  <span className="font-extrabold uppercase">{order.paymentMethod || 'Não Definido'}</span>
                </div>

                <div className="flex justify-between text-[10px] text-slate-700">
                  <span>Status do Pagamento:</span>
                  <span className="font-extrabold text-emerald-800 uppercase">
                    {order.isPaid ? 'PAGO / LIQUIDADO' : 'PENDENTE'}
                  </span>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="text-center pt-3 border-t border-dashed border-slate-400 text-[10px] text-slate-600 space-y-1">
              {isKitchen ? (
                <p className="font-black text-slate-900 uppercase">🔥 Agilidade no Preparo! 🔥</p>
              ) : (
                <>
                  <p className="font-bold text-slate-900">{settings.footerMessage || 'Obrigado pela preferência!'}</p>
                  <p>Volte Sempre ao Espetinho do Chefe 🔥</p>
                </>
              )}
              <p className="text-[8px] text-slate-400 pt-1">Sistema de Gestão & KDS</p>
            </div>

          </div>

        </div>

        {/* Footer Actions (Responsive Buttons for Computer & Phone) */}
        <div className="no-print p-3 sm:p-4 bg-slate-900 text-white flex flex-col sm:flex-row items-center justify-between gap-2.5 border-t border-slate-800 shrink-0">
          
          {/* Secondary Mobile Actions */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="flex-1 sm:flex-initial px-3 py-2 text-xs font-extrabold text-emerald-300 bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-700/60 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
              title="Compartilhar pelo WhatsApp ou app do celular"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>WhatsApp / Compartilhar</span>
            </button>

            <button
              type="button"
              onClick={handleCopyText}
              className="px-3 py-2 text-xs font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 shrink-0"
              title="Copiar texto para impressoras Bluetooth / RawBT"
            >
              {copiedNotification ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedNotification ? 'Copiado!' : 'Copiar Texto'}</span>
            </button>
          </div>

          {/* Primary Print Actions */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleOpenNewWindow}
              className="hidden sm:flex px-3 py-2.5 text-xs font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-all items-center gap-1.5 cursor-pointer active:scale-95"
              title="Abrir em nova aba para impressão isolada"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Nova Guia</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2.5 text-xs font-bold text-slate-400 hover:text-white bg-transparent hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              Fechar
            </button>

            <button
              type="button"
              onClick={handlePrint}
              disabled={isPrinting}
              className="flex-1 sm:flex-initial px-5 py-2.5 text-xs sm:text-sm font-black text-slate-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 rounded-xl shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all"
            >
              <Printer className={`w-4 h-4 ${isPrinting ? 'animate-bounce' : ''}`} />
              <span>{isPrinting ? 'Enviando...' : 'Imprimir Cupom'}</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
