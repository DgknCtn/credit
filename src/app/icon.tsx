import { ImageResponse } from 'next/og'

export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#2563EB',
          borderRadius: 7,
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="5" width="20" height="14" rx="2.5" />
          <line x1="2" y1="9.25" x2="22" y2="9.25" />
          <polyline points="6,16 10.5,12.5 14,14 18.5,10" />
          <circle cx="18.5" cy="10" r="1.3" fill="white" stroke="none" />
        </svg>
      </div>
    ),
    { ...size }
  )
}
