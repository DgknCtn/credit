// Purely decorative — a static mock statement card for the landing page hero,
// styled the same way as the real card visuals in src/app/(app)/cards/page.tsx
// so the marketing page actually looks like the product instead of just
// describing it.
export function CardPreviewMock() {
  return (
    <div
      className="rounded-2xl p-4 shadow-xl"
      style={{
        background: 'linear-gradient(135deg, var(--navy-800) 0%, var(--blue-600) 140%)',
        transform: 'rotate(-2deg)',
      }}
    >
      <div className="flex items-center justify-between mb-6">
        <span className="text-[10px] font-medium uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.55)' }}>
          Örnek Banka
        </span>
        <div className="w-6 h-4 rounded-sm" style={{ background: 'rgba(255,255,255,0.25)' }} />
      </div>
      <p
        className="text-sm tracking-[0.2em] tabular-nums font-mono mb-5"
        style={{ color: 'rgba(255,255,255,0.9)' }}
      >
        **** **** **** 4821
      </p>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Dönem Borcu
          </p>
          <p className="text-base font-bold text-white">4.280,50 TL</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Son Ödeme
          </p>
          <p className="text-xs font-semibold text-white">12 Ağustos</p>
        </div>
      </div>
    </div>
  )
}
