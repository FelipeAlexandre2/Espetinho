import React from 'react';
import { X, Smartphone, Monitor, Share2, PlusSquare, CheckCircle, ArrowDown, Download, Sparkles } from 'lucide-react';
import { BrandLogo } from './BrandLogo';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface ShortcutInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  logo: string;
}

export const ShortcutInstallModal: React.FC<ShortcutInstallModalProps> = ({
  isOpen,
  onClose,
  logo,
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    if (isInstallable) {
      const success = await install();
      if (success) {
        onClose();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-lg w-full p-6 text-white shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-lg border border-amber-500/40 bg-slate-950 flex items-center justify-center p-0.5">
            <BrandLogo src={logo} alt="Atalho Maresia" className="w-full h-full object-cover rounded-xl" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              Atalho do Sistema
              <span className="text-xs bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-semibold">
                Com a Logo Ativa
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Ícone oficial do Maresia na tela inicial do seu celular ou computador
            </p>
          </div>
        </div>

        {/* Preview of the Shortcut Icon */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 mb-5 text-center">
          <p className="text-xs text-slate-400 mb-3 font-medium">
            Visualização do Ícone do Atalho:
          </p>
          <div className="inline-flex flex-col items-center">
            <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-2xl border-2 border-amber-500/80 bg-slate-900 flex items-center justify-center p-1 relative ring-4 ring-amber-500/20">
              <BrandLogo src={logo} alt="Ícone do Atalho" className="w-full h-full object-cover rounded-xl" />
            </div>
            <span className="text-xs font-semibold text-slate-200 mt-2 truncate max-w-[120px]">
              Maresia
            </span>
          </div>
          <p className="text-[11px] text-emerald-400 mt-2 flex items-center justify-center gap-1">
            <CheckCircle className="w-3.5 h-3.5" />
            Vinculado à logo configurada no sistema
          </p>
        </div>

        {/* Action based on status */}
        {isInstalled ? (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 mb-4 text-center">
            <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-emerald-300">Aplicativo Já Instalado!</h3>
            <p className="text-xs text-slate-300 mt-1">
              Este sistema já está rodando como atalho direto. O ícone com a logo está pronto na sua área de trabalho ou tela inicial.
            </p>
          </div>
        ) : isInstallable ? (
          <div className="mb-5">
            <button
              onClick={handleInstallClick}
              className="w-full py-3 px-4 rounded-xl font-bold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition"
            >
              <Download className="w-5 h-5" />
              Criar Atalho / Instalar Agora
            </button>
            <p className="text-[11px] text-slate-400 text-center mt-2">
              Clique acima para o navegador salvar o atalho com a logo na sua tela inicial
            </p>
          </div>
        ) : null}

        {/* Step by step for Mobile & Desktop */}
        <div className="space-y-3 text-xs text-slate-300">
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3">
            <div className="flex items-center gap-2 font-semibold text-amber-400 mb-1.5">
              <Smartphone className="w-4 h-4" />
              <span>No Celular (Android ou iPhone):</span>
            </div>
            {isIOS ? (
              <ol className="list-decimal list-inside space-y-1 text-slate-300 pl-1">
                <li>Toque no botão de <strong>Compartilhar</strong> (ícone do quadrado com seta para cima no Safari).</li>
                <li>Role para baixo e selecione <strong>"Adicionar à Tela de Início"</strong>.</li>
                <li>Confirme o nome <strong>Maresia</strong> e toque em <strong>Adicionar</strong>. O atalho aparecerá com a logo!</li>
              </ol>
            ) : (
              <ol className="list-decimal list-inside space-y-1 text-slate-300 pl-1">
                <li>Toque nos <strong>3 pontinhos</strong> do navegador (canto superior direito).</li>
                <li>Selecione <strong>"Adicionar à tela inicial"</strong> ou <strong>"Instalar aplicativo"</strong>.</li>
                <li>O atalho será criado com a logo oficial do Maresia!</li>
              </ol>
            )}
          </div>

          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3">
            <div className="flex items-center gap-2 font-semibold text-blue-400 mb-1.5">
              <Monitor className="w-4 h-4" />
              <span>No Computador (Chrome ou Edge):</span>
            </div>
            <ol className="list-decimal list-inside space-y-1 text-slate-300 pl-1">
              <li>Clique nos <strong>3 pontinhos</strong> do Chrome no topo direito.</li>
              <li>Vá em <strong>Salvar e Compartilhar</strong> &gt; <strong>Criar atalho...</strong> (ou clique no ícone de instalar na barra de endereço).</li>
              <li>Marque a opção <strong>"Abrir como janela"</strong> e clique em <strong>Criar</strong>.</li>
            </ol>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-5 pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
          >
            Entendi / Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
