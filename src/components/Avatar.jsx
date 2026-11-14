import { useState } from 'react'

// Runder Avatar: zeigt das Charakterbild oder – falls keins da ist bzw. es nicht lädt – den Anfangsbuchstaben
export default function Avatar({ name = '?', src, variant = 'player', size = 'md' }) {
  const [failedSrc, setFailedSrc] = useState(null)
  const sizes = {
    sm: 'h-8 w-8 text-sm',
    md: 'h-11 w-11 text-lg',
    lg: 'h-16 w-16 text-2xl',
    xl: 'h-28 w-28 text-5xl sm:h-32 sm:w-32',
  }
  const ring = variant === 'gm' ? 'ring-amber-500/70' : 'ring-violet-500/60'

  if (src && src !== failedSrc) {
    return (
      <img
        src={src}
        alt={name}
        onError={() => setFailedSrc(src)}
        className={`shrink-0 rounded-full object-cover ring-2 ${ring} ${sizes[size]}`}
        loading="lazy"
      />
    )
  }

  const colors = variant === 'gm' ? 'bg-amber-600 text-stone-950' : 'bg-violet-800 text-violet-100'
  return (
    <div className={`flex shrink-0 items-center justify-center rounded-full font-display font-bold ${sizes[size]} ${colors}`}>
      {name.charAt(0).toUpperCase()}
    </div>
  )
}
