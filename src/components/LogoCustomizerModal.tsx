import React, { useState } from 'react';
import { X, Upload, Link as LinkIcon, RotateCcw, Check, Sparkles, Image as ImageIcon } from 'lucide-react';
import { DEFAULT_MARESIA_LOGO, saveMaresiaLogo } from '../lib/storage';

interface LogoCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLogo: string;
  onLogoChange: (newLogo: string) => void;
}

export const LOGO_PRESETS = [
  {
    id: 'badge_nautical',
    name: 'Maresia Gastronomia (Circular Azul & Brasa)',
    url: DEFAULT_MARESIA_LOGO,
  },
  {
    id: 'badge_store',
    name: 'Maresia Estilo Badge (Inspirado no TT Store)',
    url: `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
  <circle cx="100" cy="100" r="95" fill="#1e2749" stroke="#ffffff" stroke-width="6"/>
  <circle cx="100" cy="100" r="85" fill="#151c35" stroke="#3b4b80" stroke-width="2"/>
  <polygon points="100,28 103,38 113,38 105,44 108,54 100,48 92,54 95,44 87,38 97,38" fill="#ffffff"/>
  <text x="100" y="98" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="44" fill="#ffffff" letter-spacing="1">M</text>
  <text x="100" y="125" text-anchor="middle" font-family="'Brush Script MT', cursive, sans-serif" font-weight="bold" font-size="28" fill="#e11d48">Maresia</text>
  <rect x="55" y="137" width="90" height="18" rx="9" fill="#243058"/>
  <text x="100" y="149" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-weight="800" font-size="8.5" fill="#cbd5e1" letter-spacing="2">ESPETOS & MARMITAS</text>
  <circle cx="100" cy="170" r="4" fill="#e11d48"/>
</svg>
`)}`,
  },
  {
    id: 'flame_minimal',
    name: 'Maresia Fogo & Brasa Minimalista',
    url: `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
  <defs>
    <linearGradient id="gradRed" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#dc2626"/>
      <stop offset="100%" stop-color="#ea580c"/>
    </linearGradient>
  </defs>
  <circle cx="100" cy="100" r="95" fill="#090d16" stroke="#ea580c" stroke-width="4"/>
  <circle cx="100" cy="100" r="86" fill="#0f172a"/>
  <path d="M100 40 C85 65 75 80 80 100 C83 112 92 120 100 120 C108 120 117 112 120 100 C125 80 115 65 100 40 Z" fill="url(#gradRed)"/>
  <path d="M100 68 C94 80 90 90 92 98 C94 104 98 107 100 107 C102 107 106 104 108 98 C110 90 106 80 100 68 Z" fill="#fbbf24"/>
  <text x="100" y="152" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="22" fill="#ffffff" letter-spacing="2">MARESIA</text>
  <text x="100" y="168" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-weight="700" font-size="8" fill="#f97316" letter-spacing="3">RESTAURANTE</text>
</svg>
`)}`,
  }
];

export const LogoCustomizerModal: React.FC<LogoCustomizerModalProps> = ({
  isOpen,
  onClose,
  currentLogo,
  onLogoChange,
}) => {
  const [logoInput, setLogoInput] = useState(currentLogo || DEFAULT_MARESIA_LOGO);
  const [urlInput, setUrlInput] = useState('');
  const [activeTab, setActiveTab] = useState<'upload' | 'url' | 'presets'>('upload');
  const [uploadSuccess, setUploadSuccess] = useState(false);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit: max 4MB
    if (file.size > 4 * 1024 * 1024) {
      alert('A imagem deve ter até 4MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setLogoInput(dataUrl);
        setUploadSuccess(true);
        setTimeout(() => setUploadSuccess(false), 2500);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleApplyUrl = () => {
    if (!urlInput.trim()) return;
    setLogoInput(urlInput.trim());
    setUploadSuccess(true);
    setTimeout(() => setUploadSuccess(false), 2500);
  };

  const handleSaveAndApply = () => {
    saveMaresiaLogo(logoInput);
    onLogoChange(logoInput);
    onClose();
  };

  const handleResetDefault = () => {
    setLogoInput(DEFAULT_MARESIA_LOGO);
    saveMaresiaLogo(DEFAULT_MARESIA_LOGO);
    onLogoChange(DEFAULT_MARESIA_LOGO);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden text-slate-800 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
          <div>
            <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <span>Colocar Logo do Maresia</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Personalize o logotipo exibido na tela de login, barra superior e comprovantes
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Live Preview */}
          <div className="flex flex-col items-center justify-center p-5 bg-gradient-to-b from-slate-50 to-slate-100/80 rounded-2xl border border-slate-200">
            <div className="relative group">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden shadow-xl ring-4 ring-white bg-slate-900 flex items-center justify-center">
                <img
                  src={logoInput}
                  alt="Prévia do Logo Maresia"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-1 -right-1 bg-amber-500 text-slate-950 rounded-full p-1.5 shadow-md">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
            </div>
            <p className="text-xs font-bold text-slate-600 mt-3">Prévia do Logo</p>
            {uploadSuccess && (
              <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full mt-1 flex items-center gap-1 border border-emerald-200">
                <Check className="w-3 h-3 text-emerald-600" />
                Imagem carregada com sucesso!
              </span>
            )}
          </div>

          {/* Tab Selector */}
          <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveTab('upload')}
              className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'upload' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Enviar Arquivo</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('url')}
              className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'url' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <LinkIcon className="w-3.5 h-3.5" />
              <span>Link da Web (URL)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('presets')}
              className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'presets' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Modelos Prontos</span>
            </button>
          </div>

          {/* Tab Content: Upload */}
          {activeTab === 'upload' && (
            <div className="space-y-3">
              <label className="block p-5 border-2 border-dashed border-slate-300 hover:border-amber-500 rounded-2xl bg-slate-50 hover:bg-amber-50/30 transition text-center cursor-pointer group">
                <Upload className="w-8 h-8 mx-auto text-slate-400 group-hover:text-amber-500 mb-2 transition-colors" />
                <p className="text-sm font-bold text-slate-800">
                  Clique para carregar uma imagem
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Formatos suportados: PNG, JPG, JPEG, SVG ou WebP (máx. 4MB)
                </p>
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/jpg, image/svg+xml, image/webp"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              {/* GitHub folder info banner */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs space-y-1.5">
                <div className="flex items-center gap-1.5 text-slate-800 font-bold">
                  <span>📁 Pasta criada no repositório GitHub:</span>
                </div>
                <p className="text-slate-500 text-[11px] leading-relaxed">
                  Você pode colocar a foto/logo do cliente diretamente na pasta:
                  <code className="block mt-1 font-mono font-bold text-slate-800 bg-slate-200/80 px-2 py-1 rounded-md text-[11px]">
                    public/logo/logo.png
                  </code>
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setLogoInput('/logo/logo.png');
                    setUploadSuccess(true);
                    setTimeout(() => setUploadSuccess(false), 2500);
                  }}
                  className="text-[11px] text-amber-700 hover:text-amber-800 font-bold underline cursor-pointer"
                >
                  Usar arquivo da pasta public/logo/logo.png
                </button>
              </div>
            </div>
          )}

          {/* Tab Content: URL */}
          {activeTab === 'url' && (
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">
                Endereço URL da Imagem da Logo:
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://exemplo.com/sua-logo.png"
                  className="flex-1 px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                />
                <button
                  type="button"
                  onClick={handleApplyUrl}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Testar
                </button>
              </div>
            </div>
          )}

          {/* Tab Content: Presets */}
          {activeTab === 'presets' && (
            <div className="space-y-2">
              <p className="text-xs text-slate-500 mb-2">
                Escolha um dos designs especiais desenvolvidos para a marca Maresia:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {LOGO_PRESETS.map((preset) => {
                  const isSelected = logoInput === preset.url;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setLogoInput(preset.url)}
                      className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-between ${
                        isSelected
                          ? 'border-amber-500 bg-amber-50/60 ring-2 ring-amber-500/20'
                          : 'border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300'
                      }`}
                    >
                      <div className="w-14 h-14 rounded-full overflow-hidden shadow-sm bg-slate-900 mb-2 p-0.5">
                        <img src={preset.url} alt={preset.name} className="w-full h-full object-cover rounded-full" />
                      </div>
                      <span className="text-[11px] font-bold text-slate-800 leading-tight">
                        {preset.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleResetDefault}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restaurar Padrão</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-200/50 rounded-xl transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSaveAndApply}
              className="px-5 py-2.5 bg-gradient-to-r from-red-600 via-orange-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white rounded-xl text-xs font-bold transition shadow-md shadow-orange-500/20 cursor-pointer active:scale-95"
            >
              Salvar Logo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
