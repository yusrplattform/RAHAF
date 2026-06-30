import React from 'react'

const colorMap = {
  blue:   { value: '#0284c7', icon: '#7dd3fc', bg: '#f0f9ff' },
  green:  { value: '#059669', icon: '#6ee7b7', bg: '#f0fdf4' },
  red:    { value: '#dc2626', icon: '#fca5a5', bg: '#fff8f8' },
  yellow: { value: '#d97706', icon: '#fcd34d', bg: '#fffdf0' },
  purple: { value: '#7c3aed', icon: '#c4b5fd', bg: '#faf5ff' },
}

export default function StatCard({ title, value, subtitle, color = 'blue', icon }) {
  const c = colorMap[color] || colorMap.blue

  return (
    <div className={`stat-card color-${color}`}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
        <div className="stat-card-label">{title}</div>
        {icon && (
          <div style={{
            width: 36,
            height: 36,
            borderRadius: 9,
            background: c.bg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 18,
            border: '1px solid rgba(0,0,0,0.06)',
          }}>
            {icon}
          </div>
        )}
      </div>
      <div className="stat-card-value" style={{ color: c.value }}>{value}</div>
      {subtitle && <div className="stat-card-sub">{subtitle}</div>}
    </div>
  )
}
