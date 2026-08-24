import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Home, Globe, MessageCircle } from 'lucide-react'
import Particles from '../components/reactbits/Particles'
import { logError } from '@/lib/logger/errorLogger'

const MotionDiv = motion.div
const MotionH2 = motion.h2
const MotionP = motion.p

export default function NotFound() {
  const navigate = useNavigate()

  useEffect(() => {
    if (typeof window === 'undefined') return
    logError({
      level: 'warning',
      source: 'not_found',
      component: 'NotFound',
      actionName: 'route.not_found',
      error: {
        message: `404: ${window.location.pathname}`,
        code: '404',
        stack: null,
        details: null,
      },
      metadata: {
        path: window.location.pathname,
        search: window.location.search,
        referrer: document.referrer || null,
      },
    })
  }, [])

  return (
    <div className="min-h-screen bg-[#06090F] text-[#F1F5F9] relative overflow-hidden flex flex-col items-center justify-center p-8">
      
      {/* Dynamic Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <Particles
          particleColors={['#021a02', '#ffffff', '#021a02']}
          particleCount={40}
          speed={0.1}
          particleBaseSize={1}
        />
        {/* Deep Glows */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-500/[0.03] blur-[150px] rounded-full" />
      </div>

      <div className="relative z-10 w-full max-w-3xl flex flex-col items-center">
        
        {/* 404 Hero - Crip & Elegant */}
        <div className="relative flex flex-col items-center mb-16">
          <MotionDiv
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 mb-8"
          >
            <div className="w-6 h-6 bg-emerald-500 rounded-md flex items-center justify-center font-black italic text-xs">T</div>
            <span className="font-['Sora'] font-bold text-sm tracking-widest uppercase opacity-60">TernakOS Indonesia</span>
          </MotionDiv>

          <MotionDiv
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative"
          >
            <h1 className="text-[120px] md:text-[220px] font-['Sora'] font-black leading-none tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white/[0.05] to-transparent pointer-events-none">
              404
            </h1>
            
            <div className="absolute inset-0 flex flex-col items-center justify-center pt-8">
              <MotionH2 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-4xl md:text-6xl font-['Sora'] font-black text-white text-center tracking-tight"
              >
                Halaman Hilang<span className="text-emerald-500">.</span>
              </MotionH2>
            </div>
          </MotionDiv>
          
          <MotionP
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-[#94A3B8] max-w-md text-center text-sm md:text-base font-medium leading-relaxed mt-4"
          >
            Maaf, kami tidak bisa menemukan halaman tersebut. Mungkin sedang dalam masa pemeliharaan atau kodenya mengalami anomali.
          </MotionP>
        </div>

        {/* Navigation Actions - Glass Card Style */}
        <MotionDiv
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="w-full max-w-xl bg-white/[0.03] border border-white/5 rounded-[32px] p-2 backdrop-blur-xl shadow-2xl"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-1">
             <NavLink icon={<Home size={18} />} label="Beranda" to="/" />
             <NavLink icon={<Globe size={18} />} label="Market" to="/market" />
             <NavLink icon={<MessageCircle size={18} />} label="Bantuan" to="/hubungi-kami" />
             <button 
               onClick={() => navigate(-1)}
               className="flex flex-col items-center justify-center gap-2 p-4 rounded-3xl hover:bg-white/5 transition-all text-[#94A3B8] hover:text-white border-none bg-transparent cursor-pointer"
             >
               <ArrowLeft size={18} />
               <span className="text-[10px] font-black uppercase tracking-widest">Kembali</span>
             </button>
          </div>
        </MotionDiv>

        {/* System Footer Info */}
        <MotionDiv
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           transition={{ delay: 0.7 }}
           className="mt-20 flex flex-col items-center gap-4"
        >
          <div className="h-px w-12 bg-white/10" />
          <p className="text-[9px] font-black text-[#4B6478] uppercase tracking-[0.4em] text-center">
            System Status: <span className="text-emerald-500">All Systems Operational</span>
          </p>
        </MotionDiv>

      </div>
    </div>
  )
}

function NavLink({ icon, label, to }) {
  return (
    <a 
      href={to}
      className="flex flex-col items-center justify-center gap-2 p-4 rounded-3xl hover:bg-white/5 transition-all text-[#94A3B8] hover:text-white no-underline group"
    >
      <div className="transition-transform group-hover:-translate-y-1 duration-300">
        {icon}
      </div>
      <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
    </a>
  )
}
