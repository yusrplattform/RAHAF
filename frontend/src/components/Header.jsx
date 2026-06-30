import React from 'react'
import { useAuth } from '../context/AuthContext'

const roleLabels = {
  owner: 'المالك',
  admin: 'مدير النظام',
  employee: 'موظف',
}

function getArabicDate() {
  const now = new Date()
  return now.toLocaleDateString('ar-SA', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export default function Header({ title, onMenuToggle }) {
  const { user } = useAuth()

  return (
    <header className="header">
      <button
        className="header-menu-btn"
        onClick={onMenuToggle}
        aria-label="فتح القائمة"
      >
        ☰
      </button>

      <div style={{ flex: 1 }}>
        <h1 className="header-title">{title}</h1>
      </div>

      <div className="header-date">
        {getArabicDate()}
      </div>

      {user && (
        <div className="header-role-badge">
          {roleLabels[user.role] || user.role || 'مستخدم'}
        </div>
      )}
    </header>
  )
}
