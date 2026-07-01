type Props = {
  size?: number
  className?: string
}

// Brand mark: a card silhouette with a small ascending trend line — the two
// ideas this product combines (kart takibi + harcama analizi). Drawn in the
// lucide icon convention (24x24 viewBox, stroke-based, currentColor) so it
// drops into existing `<Icon className="w-4 h-4 text-white" />` call sites
// without any wrapper changes.
export function LogoMark({ size = 24, className }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      role="img"
      aria-label="Ekstre Takip logosu"
    >
      <rect x="2" y="5" width="20" height="14" rx="2.5" />
      <line x1="2" y1="9.25" x2="22" y2="9.25" />
      <polyline points="6,16 10.5,12.5 14,14 18.5,10" />
      <circle cx="18.5" cy="10" r="1.15" fill="currentColor" stroke="none" />
    </svg>
  )
}
