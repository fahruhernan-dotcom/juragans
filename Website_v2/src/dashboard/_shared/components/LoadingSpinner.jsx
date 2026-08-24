import { motion } from 'framer-motion'

export default function LoadingSpinner({ fullPage = false }) {
  return (
    <div className={fullPage ? 'flex items-center justify-center h-screen w-full bg-white dark:bg-[#06090F]' : 'flex items-center justify-center h-[200px] w-full'}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        style={{
          width: '32px',
          height: '32px',
          border: '3px solid rgba(16, 185, 129, 0.1)',
          borderTop: '3px solid #10B981',
          borderRadius: '50%',
        }}
      />
    </div>
  )
}
