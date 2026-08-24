import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import FadeUp from './FadeUp'

const itemVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.3 } },
}

const listVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.15 },
  },
}

export default function GroupCard({ Icon, title, desc, features, delay = 0 }) {
  return (
    <FadeUp delay={delay} className="h-full">
      <motion.div
        whileHover={{ scale: 1.02, y: -4 }}
        className="group relative bg-[linear-gradient(135deg,rgba(255,255,255,0.05),rgba(255,255,255,0.01))] rounded-2xl p-7 border border-white/8 hover:border-emerald-500/40 hover:shadow-[0_20px_45px_rgba(2, 26, 2,0.12)] transition-all duration-300 h-full flex flex-col overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/0 via-emerald-500/0 to-emerald-500/0 group-hover:from-emerald-500/5 group-hover:to-transparent transition-all duration-500" />

        <div className="relative z-10 w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-6 shrink-0 group-hover:bg-emerald-500/20 group-hover:scale-110 transition-all duration-300">
          <Icon size={24} className="text-emerald-400" />
        </div>
        <h3 className="relative z-10 font-['Sora'] font-bold text-white text-lg mb-2 leading-snug tracking-tight">{title}</h3>
        {desc && <p className="relative z-10 text-xs text-[#4B6478] mb-6 leading-relaxed font-medium">{desc}</p>}

        <motion.ul
          className="relative z-10 space-y-3 mt-auto"
          variants={listVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-20px' }}
        >
          {features.map((f, i) => (
            <motion.li key={i} variants={itemVariants} className="flex items-start gap-3">
              <Check size={14} className="text-emerald-400 shrink-0 mt-0.5" />
              <span className="text-[13px] text-[#94A3B8] leading-snug font-medium">{f}</span>
            </motion.li>
          ))}
        </motion.ul>
      </motion.div>
    </FadeUp>
  )
}
