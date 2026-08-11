import React, { useEffect, useState } from 'react';

const SplineScene = ({ scene, className, style }) => {
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);

  useEffect(() => {
    const inject = () => {
      // Method 1: style tag inject ke semua shadow roots
      document.querySelectorAll('*').forEach(el => {
        if (el.shadowRoot) {
          const existing = el.shadowRoot.querySelector('#hide-watermark')
          if (!existing) {
            const styleElement = document.createElement('style')
            styleElement.id = 'hide-watermark'
            styleElement.textContent = `
              #logo-bottom-right,
              a[href*="spline.design"],
              [class*="watermark"],
              [id*="watermark"] {
                display: none !important;
                opacity: 0 !important;
                visibility: hidden !important;
                pointer-events: none !important;
              }
            `
            el.shadowRoot.appendChild(styleElement)
          }
        }
      })
      // Method 2: direct DOM
      document.querySelectorAll(
        '#logo-bottom-right, a[href*="spline.design"]'
      ).forEach(el => { el.style.cssText += 'display:none!important' })
    }

    inject()
    const t1 = setTimeout(inject, 500)
    const t2 = setTimeout(inject, 1500)
    const t3 = setTimeout(inject, 3000)
    const obs = new MutationObserver(inject)
    obs.observe(document.body, { childList:true, subtree:true })

    return () => {
      clearTimeout(t1); clearTimeout(t2); clearTimeout(t3)
      obs.disconnect()
    }
  }, [])

  useEffect(() => {
    // Load Spline Viewer script if not already present
    if (!document.querySelector('script[src*="spline-viewer"]')) {
      const script = document.createElement('script');
      script.type = 'module';
      script.src = 'https://unpkg.com/@splinetool/viewer@1.9.92/build/spline-viewer.js';
      script.onload = () => setIsScriptLoaded(true);
      document.head.appendChild(script);
    } else {
      setIsScriptLoaded(true);
    }
  }, []);

  return (
    <div className={`relative ${className || ''}`} style={{ ...style, width: '100%', height: '100%' }}>
      {!isScriptLoaded ? (
        <div className="absolute inset-0 flex items-center justify-center bg-[#0C1319]/50 overflow-hidden" style={{ width: '100%', height: '100%' }}>
          <div className="w-20 h-20 rounded-full bg-emerald-500/10 animate-pulse border border-emerald-500/20" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#021a020a_0%,_transparent_70%)]" />
        </div>
      ) : (
        <div style={{ width: '100%', height: '100%' }} className="overflow-hidden grayscale-[0.2] hover:grayscale-0 transition-all duration-700">
          <spline-viewer 
            url={scene} 
            style={{ width: '100%', height: '100%' }}
            loading-anim
          ></spline-viewer>
        </div>
      )}
    </div>
  );
};

export default SplineScene;
