import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'

function AnimatedContent({
  children,
  distance = 40,
  direction = 'vertical',
  reverse = false,
  config: _config = { tension: 50, friction: 25 },
  initialOpacity = 0,
  animateOpacity = true,
  scale = 1,
  threshold: _threshold = 0.1,
  delay = 0,
  className = '',
}) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })
  
  const getInitial = () => {
    const x = direction === 'horizontal' ? (reverse ? -distance : distance) : 0
    const y = direction === 'vertical' ? (reverse ? -distance : distance) : 0
    return { x, y, opacity: animateOpacity ? initialOpacity : 1, scale }
  }

  return (
    <motion.div
      ref={ref}
      initial={getInitial()}
      animate={isInView ? { x: 0, y: 0, opacity: 1, scale: 1 } : getInitial()}
      transition={{
        delay,
        duration: 0.55,
        ease: [0.25, 0.46, 0.45, 0.94]
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export default AnimatedContent
