import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play } from 'lucide-react';

const StickyCTA = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show after scrolling 600px
      if (window.scrollY > 600) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          className="fixed bottom-6 left-0 right-0 mx-auto z-[9999] w-[calc(100%-32px)] max-w-[480px]"
        >
            <div className="bg-bg-2/95 backdrop-blur-xl border border-border-strong rounded-2xl p-2.5 md:p-3 shadow-[0_20px_50px_rgba(0,0,0,0.15)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.6)] flex items-center justify-between gap-2.5">
              <div className="hidden sm:flex flex-col pl-3 pr-4 border-r border-border-subtle">
                <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest leading-none mb-1">Mulai Gratis</span>
                <span className="text-xs font-bold text-text-primary leading-none whitespace-nowrap">Siap Scale-up?</span>
              </div>
              
              <div className="flex flex-1 items-center gap-1.5 md:gap-2">
                <a 
                  href="/register" 
                  className="flex-[1.5] text-center py-3.5 bg-emerald-500 hover:bg-emerald-400 text-white font-display font-black text-[10px] md:text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-emerald-500/20 active:scale-95 whitespace-nowrap px-2"
                >
                  Coba Gratis
                </a>
                <a 
                  href="/upgrade" 
                  className="flex-1 text-center py-3.5 bg-bg-3 border border-border-default hover:bg-bg-3/80 text-text-primary font-display font-black text-[10px] md:text-xs uppercase tracking-widest rounded-xl transition-all active:scale-95 whitespace-nowrap px-2"
                >
                  Harga
                </a>
              </div>
            </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default StickyCTA;
