import './ShinyText.css'

function ShinyText({ text, disabled = false, speed = 5, className = '', style = {} }) {
  return (
    <span
      className={`shiny-text ${disabled ? 'disabled' : ''} ${className}`}
      style={{ '--speed': `${speed}s`, ...style }}
    >
      {text}
    </span>
  )
}

export default ShinyText
