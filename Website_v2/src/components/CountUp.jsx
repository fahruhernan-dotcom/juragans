import React, { useEffect, useRef } from 'react';
import { motion, useMotionValue, useTransform, animate, useInView } from 'framer-motion';

export default function CountUp({ from = 0, to, duration = 1.5, prefix = '', suffix = '' }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '0px' });
  const count = useMotionValue(from);
  const rounded = useTransform(count, v => prefix + Math.round(v).toLocaleString('id-ID') + suffix);

  useEffect(() => {
    if (isInView) {
      animate(count, to, { duration, ease: 'easeOut' });
    }
  }, [isInView, count, to, duration]);

  return <motion.span ref={ref}>{rounded}</motion.span>;
}
