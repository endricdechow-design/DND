// Runder Avatar mit Anfangsbuchstaben – später kommt hier das Charakterbild hinein
export default function Avatar({ name = '?', variant = 'player', size = 'md' }) {
  const sizes = { sm: 'h-8 w-8 text-sm', md: 'h-11 w-11 text-lg', lg: 'h-16 w-16 text-2xl' }
  const colors = variant === 'gm' ? 'bg-amber-600 text-stone-950' : 'bg-violet-800 text-violet-100'
  return (
    <div className={`flex shrink-0 items-center justify-center rounded-full font-display font-bold ${sizes[size]} ${colors}`}>
      {name.charAt(0).toUpperCase()}
    </div>
  )
}
