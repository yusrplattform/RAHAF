import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const navItems = [
  { path: '/dashboard', label: 'لوحة التحكم', icon: '📊', exact: true },
  { path: '/companies', label: 'الخدمات', icon: '🧩' },
  { path: '/income', label: 'الدخل', icon: '💰' },
  { path: '/expenses', label: 'المصروفات', icon: '📉' },
  { path: '/clients', label: 'العملاء', icon: '👥' },
  { path: '/crm', label: 'متابعة العملاء', icon: '📁' },
  { path: '/collections', label: 'التحصيل والمتأخرات', icon: '⏰' },
  { path: '/tasks', label: 'المهام', icon: '✅' },
  { path: '/reports', label: 'التقارير', icon: '📋' },
]

const roleLabels = {
  owner: 'المالك',
  admin: 'مدير',
  employee: 'موظف',
}

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="sidebar-overlay"
          onClick={onClose}
          style={{ display: 'block' }}
        />
      )}

      <aside className={`sidebar${isOpen ? ' open' : ''}`}>
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
              <path d="M3 3h7v7H3zm11 0h7v7h-7zM3 14h7v7H3zm11 3h2v-2h2v2h2v2h-2v2h-2v-2h-2z"/>
            </svg>
          </div>
          <div className="sidebar-logo-text">
            نظام إدارة الأعمال
            <small>Business Management</small>
          </div>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.exact}
              className={({ isActive }) =>
                `sidebar-nav-link${isActive ? ' active' : ''}`
              }
              onClick={() => {
                if (window.innerWidth <= 768) onClose && onClose()
              }}
            >
              <span className="sidebar-nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          {user && (
            <div className="sidebar-user">
              <div className="sidebar-user-avatar">
                {/* Business person icon */}
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="3" y="13" width="18" height="8" rx="2" fill="#0284c7" opacity="0.18"/>
                  <rect x="7" y="7" width="10" height="6" rx="2" fill="#0284c7" opacity="0.3"/>
                  <rect x="9" y="5" width="6" height="3" rx="1" fill="#0284c7" opacity="0.5"/>
                  <circle cx="12" cy="8" r="3.5" fill="#0284c7"/>
                  <path d="M5 21c0-3.3 3.1-6 7-6s7 2.7 7 6" stroke="#0284c7" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
                  <rect x="9" y="13" width="6" height="1.5" rx="0.75" fill="#38bdf8"/>
                </svg>
              </div>
              <div className="sidebar-user-info">
                <div className="sidebar-user-name">{user.name || 'المستخدم'}</div>
                <div className="sidebar-user-role">
                  {roleLabels[user.role] || user.role || 'مستخدم'}
                </div>
              </div>
            </div>
          )}
          <button className="sidebar-logout-btn" onClick={handleLogout}>
            <span>🚪</span>
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </aside>
    </>
  )
}
