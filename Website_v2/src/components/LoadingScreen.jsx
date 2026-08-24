import React from 'react';
import { motion } from 'framer-motion';

const LoadingScreen = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="fixed inset-0 bg-[#06090F] z-[9999] flex flex-col items-center justify-center gap-5 select-none cursor-default"
    >
      {/* CSS Keyframes for the sweep animation */}
      <style>
        {`
          @keyframes sweep {
            0% { left: -70px; }
            100% { left: 170px; }
          }
        `}
      </style>

      {/* Logo Row */}
      <div className="flex items-center gap-[7px]">
        {/* Logo Box */}
        <svg viewBox="0 0 256 256" className="w-[22px] h-[22px]" xmlns="http://www.w3.org/2000/svg">
          <rect width="256" height="256" rx="60" fill="#123c26"/>
          <rect x="56" y="60" width="50" height="40" fill="#ffffff" />
          <path d="M 146 60 L 196 60 L 196 100 L 146 100 L 146 196 L 106 196 L 106 100 Z" fill="#ffffff" />
        </svg>
        
        {/* Text */}
        <span className="font-display text-[14px] font-semibold text-[#F1F5F9] tracking-[-0.2px]">
          TernakOS
        </span>
      </div>

      {/* Sweep Line */}
      <div className="w-[100px] h-[2px] bg-[#162230] rounded overflow-hidden relative">
        <div 
          className="absolute top-0 bottom-0 w-[70px]"
          style={{
            background: 'linear-gradient(90deg, transparent, #021a02, transparent)',
            animation: 'sweep 2s linear infinite'
          }}
        />
      </div>
    </motion.div>
  );
};

export default LoadingScreen;
