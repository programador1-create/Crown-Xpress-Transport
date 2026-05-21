export default function Logo({ className = '', showText = true, size = 'md' }) {
  const sizes = {
    sm: { img: 'w-8 h-8', text: 'text-base', sub: 'text-[10px]' },
    md: { img: 'w-12 h-12', text: 'text-2xl', sub: 'text-xs' },
    lg: { img: 'w-16 h-16', text: 'text-3xl', sub: 'text-sm' },
  }
  const s = sizes[size]

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <img
        src="/crown-logo.png"
        alt="Crown Xpress"
        className={`${s.img} object-contain drop-shadow-sm`}
      />
      {showText && (
        <div className="leading-tight">
          <div className={`font-display font-bold text-crown-navy-dark ${s.text} italic`}>
            Crown
          </div>
          <div className={`font-semibold tracking-[0.2em] text-crown-gold-dark ${s.sub} -mt-0.5`}>
            XPRESS TRANSPORT
          </div>
        </div>
      )}
    </div>
  )
}
