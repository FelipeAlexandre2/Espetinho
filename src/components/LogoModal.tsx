import React, { useState, useRef } from 'react';
import { X, Upload, Link as LinkIcon, RefreshCw, Check, AlertCircle, Image as ImageIcon, Sparkles } from 'lucide-react';
import { BrandLogo } from './BrandLogo';

interface LogoModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLogo?: string;
  onSaveLogo: (newLogo: string) => void;
}

export const LogoModal: React.FC<LogoModalProps> = ({
  isOpen,
  onClose,
  currentLogo,
  onSaveLogo,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'url' | 'github'>('upload');
  const [previewUrl, setPreviewUrl] = useState<string>(currentLogo || '/logo/capa.png');
  const [inputUrl, setInputUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Por favor, selecione um arquivo de imagem válido (PNG, JPG, WebP ou SVG).');
      return;
    }

    setErrorMessage('');
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setPreviewUrl(result);
    };
    reader.readAsDataURL(file);
  };

  const handleApplyUrl = () => {
    if (!inputUrl.trim()) {
      setErrorMessage('Cole um link válido para a imagem.');
      return;
    }
    setErrorMessage('');
    setPreviewUrl(inputUrl.trim());
  };

  const handleSave = async () => {
    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      // If preview is a base64 data URL, upload to server so it saves as capa.png on disk
      if (previewUrl.startsWith('data:image/')) {
        const response = await fetch('/api/upload-capa', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageData: previewUrl }),
        });

        if (response.ok) {
          const data = await response.json();
          // Add timestamp to bust browser cache
          const finalUrl = `${data.path || '/logo/capa.png'}?t=${Date.now()}`;
          onSaveLogo(finalUrl);
        } else {
          // Fallback to storing in state/localStorage
          onSaveLogo(previewUrl);
        }
      } else {
        onSaveLogo(previewUrl);
      }

      setSuccessMessage('Logo e capa atualizadas com sucesso em todo o sistema!');
      setTimeout(() => {
        setSuccessMessage('');
        onClose();
      }, 1200);
    } catch (err: any) {
      console.warn('Erro ao salvar no servidor, aplicando localmente:', err);
      onSaveLogo(previewUrl);
      setSuccessMessage('Logo salva localmente com sucesso!');
      setTimeout(() => {
        setSuccessMessage('');
        onClose();
      }, 1200);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetDefault = () => {
    const defaultPath = `/logo/logo.svg?t=${Date.now()}`;
    setPreviewUrl(defaultPath);
    onSaveLogo(defaultPath);
    setSuccessMessage('Restaurado para a logo padrão do Maresia!');
    setTimeout(() => {
      setSuccessMessage('');
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl text-slate-100 flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-white">Logo & Capa do Sistema</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  Exclusivo Admin
                </span>
              </div>
              <p className="text-xs text-slate-400">Gerenciamento oficial de identidade visual</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="grid grid-cols-3 p-2 bg-slate-950/60 border-b border-slate-800 text-xs font-bold gap-1">
          <button
            onClick={() => setActiveTab('upload')}
            className={`py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer ${
              activeTab === 'upload'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Enviar Foto</span>
          </button>

          <button
            onClick={() => setActiveTab('url')}
            className={`py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer ${
              activeTab === 'url'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <LinkIcon className="w-3.5 h-3.5" />
            <span>Colar Link</span>
          </button>

          <button
            onClick={() => setActiveTab('github')}
            className={`py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer ${
              activeTab === 'github'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Pelo GitHub</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          {/* Live Preview */}
          <div className="flex flex-col items-center justify-center p-4 bg-slate-950/80 rounded-2xl border border-slate-800/80">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Pré-visualização
            </span>
            <div className="w-28 h-28 rounded-full overflow-hidden shadow-xl ring-4 ring-slate-800 bg-[#1e2749] flex items-center justify-center">
              <BrandLogo
                src={previewUrl}
                alt="Preview da Logo"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Tab 1: Upload Direto */}
          {activeTab === 'upload' && (
            <div className="space-y-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-6 px-4 rounded-2xl border-2 border-dashed border-amber-500/40 hover:border-amber-400 bg-amber-500/5 hover:bg-amber-500/10 flex flex-col items-center justify-center gap-2 transition cursor-pointer group"
              >
                <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center group-hover:scale-110 transition">
                  <Upload className="w-6 h-6" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-white">
                    Clique aqui para escolher a foto
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Selecione direto do seu celular ou computador (PNG, JPG, WebP)
                  </p>
                </div>
              </button>
            </div>
          )}

          {/* Tab 2: Colar Link Direto */}
          {activeTab === 'url' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Link direto da imagem (URL da internet ou GitHub Raw):
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="https://exemplo.com/minha-capa.png"
                    value={inputUrl}
                    onChange={(e) => setInputUrl(e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                  <button
                    type="button"
                    onClick={handleApplyUrl}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Ver Imagem
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Instrução GitHub Super Simples */}
          {activeTab === 'github' && (
            <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 text-xs text-slate-300 space-y-2.5">
              <p className="font-bold text-amber-400 text-sm">
                Como colocar pelo GitHub (Caminho mais fácil):
              </p>
              <p>
                Basta salvar a sua imagem com o nome <strong>capa.png</strong> e colocar diretamente na pasta:
              </p>
              <div className="bg-slate-900 border border-slate-700 p-2.5 rounded-xl font-mono text-amber-300 text-xs text-center select-all">
                public/logo/capa.png
              </div>
              <p className="text-slate-400 text-[11px]">
                (Ou se preferir, pode jogar como <code>capa.png</code> diretamente na raiz principal do projeto). O sistema carrega na hora!
              </p>
            </div>
          )}

          {/* Feedback messages */}
          {errorMessage && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-2 text-red-400 text-xs font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-2 text-emerald-400 text-xs font-medium">
              <Check className="w-4 h-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleResetDefault}
            className="px-3 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800/80 flex items-center gap-1.5 transition cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Padrão</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isLoading}
              className="px-5 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 shadow-lg shadow-orange-500/20 flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>{isLoading ? 'Salvando...' : 'Salvar Capa'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
