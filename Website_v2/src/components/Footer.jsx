import React from 'react';
import { Link } from 'react-router-dom';
import { Instagram, Smartphone, Disc as TiktokIcon } from 'lucide-react';

import { WA_URL } from '@/lib/constants/contact';

const Footer = () => {
  return (
    <footer className="bg-bg-base relative overflow-hidden border-t border-border-subtle" style={{ padding: '40px clamp(20px, 5vw, 80px) 32px' }}>
      {/* Large Watermark */}
      <div style={{
        position: 'absolute',
        bottom: '-20px', left: '50%',
        transform: 'translateX(-50%)',
        fontFamily: 'Sora',
        fontSize: 'clamp(80px, 15vw, 140px)',
        fontWeight: 900,
        color: 'var(--watermark-color-val)',
        userSelect: 'none',
        pointerEvents: 'none',
        whiteSpace: 'nowrap',
        letterSpacing: '-4px',
        zIndex: 0
      }}>
        TERNAKOS
      </div>

      <div className="max-w-[1280px] mx-auto relative z-10">

        {/* Brand */}
        <div className="text-center md:text-left mb-8 md:mb-[48px]">
          <Link to="/" className="flex items-center justify-center md:justify-start gap-[10px] mb-[10px] group">
            <div className="relative shrink-0">
              <div className="absolute inset-0 rounded-[10px] bg-emerald-500/10 blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
              <img
                src="/logo.png"
                alt="TernakOS"
                style={{ width: 36, height: 36, borderRadius: 10, objectFit: 'cover', display: 'block', border: '1px solid var(--border-def-val)' }}
                className="group-hover:scale-105 transition-transform duration-200 relative z-10"
              />
            </div>
            <span className="font-['Sora'] text-xl font-black text-text-primary tracking-tight leading-none">
              Ternak<span className="text-emerald-500">OS</span>
            </span>
          </Link>
          <p className="font-body text-[13px] text-text-secondary leading-[1.6] max-w-[280px] mx-auto md:mx-0">
            Platform manajemen bisnis peternakan terlengkap di Indonesia.
          </p>
        </div>

        {/* Links Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-[40px] mb-[36px] lg:mb-[56px]">

          {/* Produk */}
          <div>
            <h4 className="font-body text-[11px] font-bold tracking-wide text-text-primary mb-[12px]">PRODUK</h4>
            <ul className="space-y-[6px]">
              {[
                { name: 'Fitur',       to: '/fitur' },
                { name: 'Harga',       to: '/harga' },
                { name: 'Harga Pasar', to: '/harga-pasar' },
                { name: 'FAQ',         to: '/faq' },
                { name: 'Blog',        to: '/blog' },
                { name: 'Download Android (APK)', href: 'https://github.com/fahruhernan-dotcom/SaaS/actions/runs/26570279873/artifacts/7264021711', isExternal: true },
              ].map((link, i) => (
                <li key={i}>
                  {link.isExternal ? (
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-body text-[13px] text-text-secondary hover:text-text-primary block transition-colors duration-150"
                    >
                      {link.name}
                    </a>
                  ) : (
                    <Link to={link.to} className="font-body text-[13px] text-text-secondary hover:text-text-primary block transition-colors duration-150">
                      {link.name}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Perusahaan */}
          <div>
            <h4 className="font-body text-[11px] font-bold tracking-wide text-text-primary mb-[12px]">PERUSAHAAN</h4>
            <ul className="space-y-[6px]">
              {[
                { name: 'Tentang Kami', to: '/tentang-kami' },
                { name: 'Keamanan',    to: '/keamanan' },
                { name: 'Hubungi Kami', to: '/hubungi-kami' },
                { name: 'Karir',        to: '#' },
              ].map((link, i) => (
                <li key={i}>
                  <Link to={link.to} className="font-body text-[13px] text-text-secondary hover:text-text-primary block transition-colors duration-150">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Social — external, keep <a> */}
          <div>
            <h4 className="font-body text-[12px] font-bold tracking-wide text-text-primary mb-[14px]">IKUTI KAMI</h4>
            <div className="flex gap-[12px] flex-wrap">
              {[Instagram, Smartphone, TiktokIcon].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="w-[32px] h-[32px] border border-border-default rounded-[8px] flex items-center justify-center text-text-secondary hover:border-em-400 hover:text-em-400 transition-colors bg-bg-1"
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-body text-[10px] font-bold tracking-wide text-text-primary mb-[12px]">SUPPORT</h4>
            <ul className="space-y-[6px]">
              {/* WhatsApp — external, keep <a> */}
              <li>
                <a
                  href={WA_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-body text-[12px] text-text-secondary hover:text-text-primary block transition-colors duration-150"
                >
                  WhatsApp Admin
                </a>
              </li>
              {[
                { name: 'Pusat Bantuan', to: '#' },
                { name: 'Status Sistem', to: '#' },
              ].map((link, i) => (
                <li key={i}>
                  <Link to={link.to} className="font-body text-[12px] text-text-secondary hover:text-text-primary block transition-colors duration-150">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="border-t border-border-subtle pt-[24px] flex flex-col md:flex-row justify-center md:justify-between items-center gap-[8px] md:gap-[16px] text-center">
          <p className="font-body text-[11px] text-text-muted" suppressHydrationWarning>© {new Date().getFullYear()} TernakOS. All rights reserved.</p>
          <div className="flex items-center gap-[12px] text-[11px] text-text-muted">
            <Link to="/privacy" className="hover:text-text-primary transition-colors">Kebijakan Privasi</Link>
            <span>·</span>
            <Link to="/terms" className="hover:text-text-primary transition-colors">Syarat &amp; Ketentuan</Link>
            <span>·</span>
            <Link to="/keamanan" className="hover:text-text-primary transition-colors">Keamanan</Link>
          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
