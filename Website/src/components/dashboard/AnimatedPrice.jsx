import { useEffect, useRef } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';

/**
 * Drop-in replacement for NumberFlow that is React 19 compatible.
 * Animates between number values using framer-motion's useMotionValue.
 */
export default function AnimatedPrice({ value, className = '' }) {
  const motionVal = useMotionValue(value);
  const displayed = useTransform(motionVal, (v) =>
    new Intl.NumberFormat('id-ID').format(Math.round(v))
  );
  const prevValue = useRef(value);

  useEffect(() => {
    if (prevValue.current !== value) {
      animate(motionVal, value, {
        duration: 0.5,
        ease: 'easeOut',
      });
      prevValue.current = value;
    }
  }, [value, motionVal]);

  return <motion.span className={className}>{displayed}</motion.span>;
}
