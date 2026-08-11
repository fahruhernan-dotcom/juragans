import React from 'react';
import { useRouteError, useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/useLanguage';

export default function GlobalRouteError() {
  const error = useRouteError();
  const navigate = useNavigate();
  const { t } = useLanguage();
  
  console.error("Global route error caught by errorElement:", error);

  return (
    <div className="min-h-screen bg-[#060D13] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-[20%] left-[20%] w-[500px] h-[500px] bg-red-500/5 rounded-full blur-[100px] pointer-events-none" />
      
      <div className="w-full max-w-md bg-[#0C1319]/80 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl flex flex-col items-center text-center relative z-10">
        <div className="w-20 h-20 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(239,68,68,0.15)]">
          <AlertCircle className="w-10 h-10 text-red-500" />
        </div>
        
        <h1 className="font-['Sora'] font-black text-white text-2xl mb-3">
          {t('error_system_failed', 'Sistem Gagal Memuat')}
        </h1>
        
        <div className="bg-white/[0.02] border border-white/[0.05] p-3 rounded-xl mb-6 w-full text-left">
           <p className="text-[#4B6478] text-[11px] font-mono break-all line-clamp-2 uppercase tracking-wide">
             [ERR] {error?.statusText || error?.message || t('error_route_default', 'Kami tidak dapat memuat rute atau memproses data jaringan yang Anda tuju.')}
           </p>
        </div>

        <div className="flex flex-col gap-3 w-full">
          <Button 
            onClick={() => window.location.reload()} 
            className="w-full h-12 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white font-black shadow-lg shadow-red-500/20"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            {t('error_reload_page', 'Muat Ulang Halaman')}
          </Button>
          <Button 
            variant="outline"
            onClick={() => navigate('/')} 
            className="w-full h-12 rounded-xl border-white/10 bg-transparent hover:bg-white/5 text-[#94A3B8] font-bold"
          >
            <Home className="w-4 h-4 mr-2" />
            {t('error_back_home', 'Kembali ke Beranda')}
          </Button>
        </div>
      </div>
    </div>
  );
}
