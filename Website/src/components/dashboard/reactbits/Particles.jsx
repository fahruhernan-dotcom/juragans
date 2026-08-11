import { useEffect, useRef } from 'react'

function Particles({
  particleColors = ['#021a02', '#021a02'],
  particleCount = 50,
  speed = 0.5,
  particleBaseSize = 1.5,
  moveParticlesOnHover: _moveParticlesOnHover = false,
  className = '',
}) {
  const canvasRef = useRef(null)
  const animRef = useRef(null)
  const particlesRef = useRef([])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    const resize = () => {
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    }
    resize()

    particlesRef.current = Array.from({ length: particleCount }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * speed,
      vy: (Math.random() - 0.5) * speed,
      size: particleBaseSize + Math.random() * particleBaseSize,
      color: particleColors[Math.floor(Math.random() * particleColors.length)],
      opacity: 0.1 + Math.random() * 0.4,
    }))

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      particlesRef.current.forEach(p => {
        p.x += p.vx
        p.y += p.vy
        
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1
        
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = p.color + Math.round(p.opacity * 255).toString(16).padStart(2, '0')
        ctx.fill()
      })
      
      animRef.current = requestAnimationFrame(draw)
    }
    
    draw()
    window.addEventListener('resize', resize)
    
    return () => {
      cancelAnimationFrame(animRef.current)
      window.removeEventListener('resize', resize)
    }
  }, [particleCount, speed, particleBaseSize, particleColors])

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ width: '100%', height: '100%' }}
    />
  )
}

export default Particles
