import { useEffect, useRef, useState } from 'react'
import { useInView, useMotionValue, animate } from 'framer-motion'

function CountUp({
  from = 0,
  to,
  separator = '',
  direction = 'up',
  duration = 1.5,
  className = '',
  onStart,
  onEnd,
  prefix = '',
  suffix = '',
  style = {},
}) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '0px' })
  const count = useMotionValue(direction === 'down' ? to : from)
  const [displayValue, setDisplayValue] = useState(
    direction === 'down' ? to : from
  )

  const onStartRef = useRef(onStart)
  const onEndRef = useRef(onEnd)

  useEffect(() => {
    onStartRef.current = onStart
    onEndRef.current = onEnd
  }, [onStart, onEnd])

  useEffect(() => {
    if (!isInView) return
    if (onStartRef.current) onStartRef.current()
    
    const target = direction === 'down' ? from : to
    const controls = animate(count, target, {
      duration,
      ease: 'easeOut',
      onUpdate: (v) => {
        const rounded = Math.round(v)
        const formatted = separator
          ? rounded.toLocaleString('id-ID')
          : String(rounded)
        setDisplayValue(formatted)
      },
      onComplete: () => { if (onEndRef.current) onEndRef.current() }
    })
    
    return controls.stop
  }, [isInView, to, from, direction, duration, separator, count])

  return (
    <span ref={ref} className={className} style={style}>
      {prefix}{displayValue}{suffix}
    </span>
  )
}

export default CountUp
