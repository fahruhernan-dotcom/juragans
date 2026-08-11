import { Input } from '@/components/ui/input'

export function InputRupiah({
  value,
  onChange,
  placeholder = '0',
  id,
  ...props
}) {
  // Format angka ke "1.500.000"
  const formatDisplay = (num) => {
    if (num === null || num === undefined || isNaN(num) || num === '') return ''
    if (num === 0) return '0'
    return Number(num).toLocaleString('id-ID')
  }

  const handleChange = (e) => {
    // Hanya izinkan angka
    const raw = e.target.value.replace(/[^\d]/g, '')
    const numValue = raw ? parseInt(raw, 10) : ''
    onChange(numValue)
  }

  return (
    <div
      style={{ position: 'relative' }}
      className="rounded-md transition-shadow duration-200 [&:focus-within]:shadow-[0_0_0_1px_rgba(2, 26, 2,0.25),0_0_12px_rgba(2, 26, 2,0.08)]"
    >
      <span style={{
        position: 'absolute',
        left: '14px',
        top: '50%',
        transform: 'translateY(-50%)',
        fontSize: '14px',
        color: 'hsl(var(--muted-foreground))',
        pointerEvents: 'none',
        userSelect: 'none'
      }}>
        Rp
      </span>
      <Input
        id={id}
        {...props}
        value={formatDisplay(value)}
        onChange={handleChange}
        placeholder={placeholder}
        style={{
          paddingLeft: '36px',
          ...props.style
        }}
      />
    </div>
  )
}
