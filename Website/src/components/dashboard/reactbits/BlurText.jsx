import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'

function BlurText({
  text = '',
  delay = 200,
  className = '',
  animateBy = 'words',
  direction = 'top',
  onAnimationComplete,
  stepDuration = 0.35,
  style = {},
}) {
  const elements = animateBy === 'words' 
    ? text.split(' ') 
    : text.split('')
  
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-50px' })
  
  const defaultFrom = direction === 'top'
    ? { filter: 'blur(10px)', opacity: 0, y: -20 }
    : { filter: 'blur(10px)', opacity: 0, y: 20 }
    
  const defaultTo = [
    { filter: 'blur(5px)', opacity: 0.5, y: direction === 'top' ? -10 : 10 },
    { filter: 'blur(0px)', opacity: 1, y: 0 }
  ]

  return (
    <p ref={ref} className={className} style={{ margin: 0, padding: 0, display: 'flex', flexWrap: 'wrap', gap: animateBy === 'words' ? '0.25em' : '0', userSelect: 'none', ...style }}>
      {elements.map((el, i) => (
        <motion.span
          key={i}
          initial={defaultFrom}
          animate={isInView ? defaultTo[defaultTo.length - 1] : defaultFrom}
          transition={{
            delay: (i * delay) / 1000,
            duration: stepDuration * 2,
            ease: [0.25, 0.46, 0.45, 0.94]
          }}
          style={{ willChange: 'transform, filter, opacity', display: 'inline-block' }}
          onAnimationComplete={i === elements.length - 1 ? onAnimationComplete : undefined}
        >
          {el === ' ' ? '\u00A0' : el}
        </motion.span>
      ))}
    </p>
  )
}

export default BlurText
