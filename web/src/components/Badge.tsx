interface BadgeProps {
  variant?: 'region' | 'type' | 'status' | 'level'
  color?: string
  children: React.ReactNode
}

const statusStyles: Record<string, string> = {
  Aberto: 'bg-green-500/10 text-green-400 border-green-500/20',
  Fechado: 'bg-red-500/10 text-red-400 border-red-500/20',
  'Em Breve': 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
}

export default function Badge({ variant = 'region', color, children }: BadgeProps) {
  const baseStyle = 'inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium'

  if (variant === 'status' && typeof children === 'string' && children in statusStyles) {
    return (
      <span className={`${baseStyle} ${statusStyles[children]}`}>
        {children}
      </span>
    )
  }

  const bgColor = color ? `rgba(${hexToRgb(color)}, 0.1)` : undefined
  const borderColor = color ? `${color}33` : undefined
  const textColor = color || undefined

  return (
    <span
      className={baseStyle}
      style={{
        backgroundColor: bgColor,
        borderColor: borderColor,
        color: textColor,
      }}
    >
      {children}
    </span>
  )
}

function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) return '255,255,255'
  return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
}
