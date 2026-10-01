import React, { useState, useEffect } from 'react';
import { TABLES } from '../types';
import { generateQrCodeDataUrl } from '../utils/qrcode';
import { 
  X, QrCode, Printer, Copy, Check, ExternalLink, Download, 
  Flame, Wifi, Smartphone, Sparkles, Layers, Sliders
} from 'lucide-react';

interface QrCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenCustomerView?: (tableName: string) => void;
}

export const QrCodeModal: React.FC<QrCodeModalProps> = ({
  isOpen,
  onClose,
  onOpenCustomerView,
}) => {
  const [selectedTable, setSelectedTable] = useState<string>('Mesa 01');
  const [printAllTables, setPrintAllTables] = useState<boolean>(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [allQrCodes, setAllQrCodes] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState<boolean>(false);
  const [wifiName, setWifiName] = useState<string>('Maresia-Clientes');
  const [wifiPass, setWifiPass] = useState<string>('maresia123');
  const [restaurantName, setRestaurantName] = useState<string>('MARESIA ESPETINHO E BATATA');

  // Build the target URL for a table
  const getTableUrl = (tableName: string) => {
    const origin = window.location.origin;
    const pathname = window.location.pathname;
    return `${origin}${pathname}?view=cardapio&mesa=${encodeURIComponent(tableName)}`;
  };

  // Generate QR code for the selected table
  useEffect(() => {
    if (!isOpen) return;

    const generateCurrent = async () => {
      const url = getTableUrl(selectedTable);
      const dataUrl = await generateQrCodeDataUrl(url, { width: 400, margin: 1 });
      setQrDataUrl(dataUrl);
    };

    generateCurrent();
  }, [selectedTable, isOpen]);

  // Generate all QR codes for bulk printing
  useEffect(() => {
    if (!isOpen || !printAllTables) return;

    const generateAll = async () => {
      const dict: Record<string, string> = {};
      for (const t of TABLES) {
        const url = getTableUrl(t);
        dict[t] = await generateQrCodeDataUrl(url, { width: 350, margin: 1 });
      }
      setAllQrCodes(dict);
    };

    generateAll();
  }, [printAllTables, isOpen]);

  if (!isOpen) return null;

  const currentUrl = getTableUrl(selectedTable);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadQr = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.download = `qrcode-${selectedTable.toLowerCase().replace(/\s+/g, '-')}.png`;
    link.href = qrDataUrl;
    link.click();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      {/* Styles for printout */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #print-area, #print-area * {
            visibility: visible;
          }
          #print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white !important;
            color: black !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .no-print {
            display: none !important;
          }
          .table-card-print {
            page-break-inside: avoid;
            border: 2px dashed #94a3b8 !important;
            margin-bottom: 20px;
          }
        }
      `}</style>

      <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden no-print animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-500/20 text-red-500 flex items-center justify-center font-black">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <span>Cardápio Digital & QR Code das Mesas</span>
                <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 text-[10px] font-extrabold uppercase border border-red-500/30">
                  Autoatendimento
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Gere plaquinhas com QR Code para os clientes apontarem a câmera e pedirem direto da mesa
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 overflow-y-auto space-y-6 flex-1">
          {/* Controls: Table selection & Mode */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
            {/* Table Select */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-300">
                Mesa para Exibição / Teste:
              </label>
              <select
                value={selectedTable}
                onChange={(e) => {
                  setSelectedTable(e.target.value);
                  setPrintAllTables(false);
                }}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-red-500 cursor-pointer"
              >
                {TABLES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            {/* Wi-Fi Name */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-300 flex items-center gap-1">
                <Wifi className="w-3.5 h-3.5 text-slate-400" />
                <span>Nome do Wi-Fi na Plaquinha:</span>
              </label>
              <input
                type="text"
                value={wifiName}
                onChange={(e) => setWifiName(e.target.value)}
                placeholder="Ex: Espetinho-Clientes"
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            {/* Wi-Fi Password */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-300">
                Senha do Wi-Fi:
              </label>
              <input
                type="text"
                value={wifiPass}
                onChange={(e) => setWifiPass(e.target.value)}
                placeholder="Ex: brasa123"
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
          </div>

          {/* Quick Action Pills */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setPrintAllTables(false)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                !printAllTables
                  ? 'bg-red-500 text-white shadow'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Exibir Apenas: {selectedTable}
            </button>
            <button
              onClick={() => setPrintAllTables(true)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                printAllTables
                  ? 'bg-red-500 text-white shadow'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Imprimir Todas as Mesas em Lote ({TABLES.length} plaquinhas)</span>
            </button>
          </div>

          {/* Live Placard Preview */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                Pré-visualização da Plaquinha de Mesa
              </span>
              <span className="text-xs text-slate-400">
                Formato ideal para display acrílico 10x15cm
              </span>
            </div>

            {/* The Placard Design (Card to be printed) */}
            <div className="flex justify-center p-4 bg-slate-950/70 rounded-3xl border border-slate-800">
              <div 
                id="single-card-preview"
                className="w-80 bg-white text-slate-900 rounded-3xl p-6 shadow-2xl border-4 border-slate-900 text-center relative flex flex-col items-center justify-between"
              >
                {/* Placard Top Branding */}
                <div className="w-full space-y-1">
                  <div className="flex items-center justify-center gap-1.5 text-red-600 font-black text-sm uppercase tracking-wide">
                    <Flame className="w-5 h-5 fill-red-600" />
                    <span>{restaurantName}</span>
                  </div>
                  <h3 className="text-xl font-black text-slate-950 tracking-tight">
                    CARDÁPIO DIGITAL
                  </h3>
                  <p className="text-[11px] font-bold text-slate-600 uppercase tracking-widest">
                    Peça direto do celular sem fila!
                  </p>
                </div>

                {/* Table Highlight Banner */}
                <div className="my-3 px-5 py-1.5 rounded-full bg-slate-900 text-white font-black text-base tracking-wider uppercase shadow-md">
                  📍 {selectedTable}
                </div>

                {/* QR Code Container */}
                <div className="p-3 bg-white border-2 border-slate-200 rounded-2xl shadow-inner my-1">
                  {qrDataUrl ? (
                    <img
                      src={qrDataUrl}
                      alt={`QR Code para ${selectedTable}`}
                      className="w-48 h-48 object-contain"
                    />
                  ) : (
                    <div className="w-48 h-48 flex items-center justify-center text-slate-400 text-xs">
                      Gerando QR Code...
                    </div>
                  )}
                </div>

                {/* Step Instructions */}
                <div className="w-full my-2 space-y-1.5 text-black text-left text-xs bg-slate-100 p-3 rounded-xl border border-slate-300">
                  <div className="flex items-center gap-2 font-black">
                    <span className="w-5 h-5 rounded-full bg-red-600 text-white text-xs flex items-center justify-center font-black shrink-0">1</span>
                    <span>Aponte a câmera do seu celular</span>
                  </div>
                  <div className="flex items-center gap-2 font-black">
                    <span className="w-5 h-5 rounded-full bg-red-600 text-white text-xs flex items-center justify-center font-black shrink-0">2</span>
                    <span>Escolha espetos, porções e bebidas</span>
                  </div>
                  <div className="flex items-center gap-2 font-black">
                    <span className="w-5 h-5 rounded-full bg-red-600 text-white text-xs flex items-center justify-center font-black shrink-0">3</span>
                    <span>O pedido vai direto para a churrasqueira!</span>
                  </div>
                </div>

                {/* Wi-Fi Footer Info */}
                {(wifiName || wifiPass) && (
                  <div className="w-full pt-2 border-t-2 border-black flex items-center justify-center gap-2 text-xs text-black font-black">
                    <Wifi className="w-4 h-4 text-black" />
                    <span>Wi-Fi: <strong>{wifiName}</strong></span>
                    <span>•</span>
                    <span>Senha: <strong>{wifiPass}</strong></span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Table URL Display & Quick Actions */}
          <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 space-y-3">
            <label className="block text-xs font-bold text-slate-300">
              Link Direto desta Mesa ({selectedTable}):
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={currentUrl}
                className="flex-1 bg-slate-900 border border-slate-700 text-slate-300 rounded-xl px-3 py-2 text-xs font-mono select-all focus:outline-none"
              />
              <button
                onClick={handleCopyLink}
                className="bg-slate-800 hover:bg-slate-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-400">Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copiar Link</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-4 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadQr}
              className="bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Baixar PNG</span>
            </button>

            {onOpenCustomerView && (
              <button
                onClick={() => {
                  onClose();
                  onOpenCustomerView(selectedTable);
                }}
                className="bg-slate-800 hover:bg-slate-750 text-amber-400 hover:text-amber-300 px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border border-amber-400/20"
              >
                <Smartphone className="w-4 h-4" />
                <span>📱 Testar Cardápio como Cliente ({selectedTable})</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white cursor-pointer"
            >
              Fechar
            </button>
            <button
              onClick={handlePrint}
              className="bg-red-500 hover:bg-red-600 text-white px-5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold flex items-center gap-2 shadow-lg shadow-red-500/30 active:scale-95 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>{printAllTables ? `Imprimir Todas as Mesas (${TABLES.length})` : `Imprimir Plaquinha (${selectedTable})`}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Hidden Print Layout (Activated only when printing) */}
      <div id="print-area" className="hidden">
        {printAllTables ? (
          <div className="p-4 grid grid-cols-2 gap-6 bg-white text-black">
            {TABLES.map((t) => (
              <div
                key={t}
                className="table-card-print p-6 rounded-2xl border-2 border-slate-900 text-center flex flex-col items-center justify-between"
                style={{ pageBreakInside: 'avoid', minHeight: '440px' }}
              >
                <div className="w-full">
                  <div className="text-red-600 font-black text-sm uppercase tracking-wide">
                    🔥 {restaurantName}
                  </div>
                  <h3 className="text-xl font-black text-black">
                    CARDÁPIO DIGITAL
                  </h3>
                  <p className="text-[11px] font-bold text-slate-600">
                    Aponte a câmera para pedir
                  </p>
                </div>

                <div className="my-2 px-4 py-1 rounded-full bg-black text-white font-black text-base">
                  📍 {t}
                </div>

                <div className="my-2 p-2 bg-white border border-slate-300 rounded-xl">
                  {allQrCodes[t] ? (
                    <img
                      src={allQrCodes[t]}
                      alt={`QR Code para ${t}`}
                      className="w-44 h-44 object-contain"
                    />
                  ) : qrDataUrl ? (
                    <img
                      src={qrDataUrl}
                      alt={`QR Code para ${t}`}
                      className="w-44 h-44 object-contain"
                    />
                  ) : null}
                </div>

                <div className="w-full text-black text-left text-xs bg-slate-100 p-2.5 rounded-lg space-y-1 border border-slate-400">
                  <p className="font-black">1. Aponte a câmera do seu celular</p>
                  <p className="font-black">2. Escolha seus espetos e bebidas</p>
                  <p className="font-black">3. O pedido vai direto para a churrasqueira!</p>
                </div>

                {(wifiName || wifiPass) && (
                  <div className="w-full pt-2 text-xs text-black font-black border-t-2 border-black mt-2">
                    Wi-Fi: <strong>{wifiName}</strong> • Senha: <strong>{wifiPass}</strong>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 flex justify-center bg-white text-black min-h-screen">
            <div
              className="table-card-print w-80 p-8 rounded-3xl border-4 border-black text-center flex flex-col items-center justify-between shadow-none"
              style={{ minHeight: '520px' }}
            >
              <div className="w-full space-y-1">
                <div className="text-red-600 font-black text-base uppercase tracking-wide">
                  🔥 {restaurantName}
                </div>
                <h3 className="text-2xl font-black text-black">
                  CARDÁPIO DIGITAL
                </h3>
                <p className="text-xs font-bold text-slate-700 uppercase tracking-widest">
                  Peça direto do celular sem fila!
                </p>
              </div>

              <div className="my-3 px-6 py-2 rounded-full bg-black text-white font-black text-lg">
                📍 {selectedTable}
              </div>

              <div className="p-3 bg-white border-2 border-slate-300 rounded-2xl my-2">
                {qrDataUrl && (
                  <img
                    src={qrDataUrl}
                    alt={`QR Code para ${selectedTable}`}
                    className="w-52 h-52 object-contain"
                  />
                )}
              </div>

              <div className="w-full my-2 space-y-1 text-slate-900 text-left text-xs bg-slate-100 p-3 rounded-xl">
                <p className="font-bold">1. Aponte a câmera do seu celular</p>
                <p className="font-bold">2. Escolha seus espetos e bebidas</p>
                <p className="font-bold">3. Seu pedido vai direto para a churrasqueira!</p>
              </div>

              {(wifiName || wifiPass) && (
                <div className="w-full pt-2 border-t border-slate-300 text-xs text-slate-700 font-semibold mt-2">
                  Wi-Fi: <strong>{wifiName}</strong> • Senha: <strong>{wifiPass}</strong>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
