import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import toast from 'react-hot-toast'

function BusinessIllustration() {
  return (
    <svg width="100%" height="200" viewBox="0 0 340 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Sky background circles */}
      <circle cx="300" cy="40" r="55" fill="#bae6fd" opacity="0.35"/>
      <circle cx="40" cy="160" r="40" fill="#e0f2fe" opacity="0.4"/>

      {/* Buildings */}
      <rect x="18" y="115" width="28" height="72" rx="3" fill="#bae6fd"/>
      <rect x="52" y="90" width="28" height="97" rx="3" fill="#7dd3fc"/>
      <rect x="86" y="68" width="30" height="119" rx="3" fill="#38bdf8"/>
      <rect x="122" y="82" width="24" height="105" rx="3" fill="#7dd3fc"/>

      {/* Building windows */}
      <rect x="23" y="124" width="8" height="6" rx="1" fill="white" opacity="0.75"/>
      <rect x="34" y="124" width="8" height="6" rx="1" fill="white" opacity="0.75"/>
      <rect x="23" y="137" width="8" height="6" rx="1" fill="white" opacity="0.75"/>
      <rect x="34" y="137" width="8" height="6" rx="1" fill="white" opacity="0.75"/>
      <rect x="57" y="99" width="8" height="6" rx="1" fill="white" opacity="0.75"/>
      <rect x="68" y="99" width="8" height="6" rx="1" fill="white" opacity="0.75"/>
      <rect x="57" y="112" width="8" height="6" rx="1" fill="white" opacity="0.75"/>
      <rect x="68" y="112" width="8" height="6" rx="1" fill="white" opacity="0.75"/>
      <rect x="91" y="77" width="8" height="6" rx="1" fill="white" opacity="0.75"/>
      <rect x="102" y="77" width="8" height="6" rx="1" fill="white" opacity="0.75"/>
      <rect x="91" y="90" width="8" height="6" rx="1" fill="white" opacity="0.75"/>
      <rect x="102" y="90" width="8" height="6" rx="1" fill="white" opacity="0.75"/>

      {/* Bar chart (right side) */}
      <rect x="175" y="140" width="16" height="40" rx="3" fill="#bae6fd"/>
      <rect x="198" y="120" width="16" height="60" rx="3" fill="#7dd3fc"/>
      <rect x="221" y="100" width="16" height="80" rx="3" fill="#38bdf8"/>
      <rect x="244" y="80" width="16" height="100" rx="3" fill="#0284c7"/>
      <rect x="267" y="60" width="16" height="120" rx="3" fill="#0369a1"/>

      {/* Growth trend line on chart */}
      <polyline
        points="183,138 206,118 229,98 252,78 275,58"
        stroke="#16a34a" strokeWidth="2.5" fill="none"
        strokeLinecap="round" strokeLinejoin="round"
      />
      <circle cx="183" cy="138" r="3.5" fill="#16a34a"/>
      <circle cx="206" cy="118" r="3.5" fill="#16a34a"/>
      <circle cx="229" cy="98" r="3.5" fill="#16a34a"/>
      <circle cx="252" cy="78" r="3.5" fill="#16a34a"/>
      <circle cx="275" cy="58" r="3.5" fill="#16a34a"/>
      {/* Arrow at end */}
      <polygon points="275,58 267,65 272,53" fill="#16a34a"/>

      {/* Ground line */}
      <line x1="10" y1="187" x2="330" y2="187" stroke="#bae6fd" strokeWidth="2"/>

      {/* Coins / money */}
      <circle cx="310" cy="170" r="10" fill="#fbbf24" opacity="0.9"/>
      <circle cx="325" cy="175" r="7" fill="#f59e0b" opacity="0.85"/>
      <circle cx="295" cy="176" r="6" fill="#fbbf24" opacity="0.85"/>
      <text x="306" y="174" fontSize="8" fill="white" fontWeight="bold" textAnchor="middle">$</text>

      {/* Stars / sparkles */}
      <circle cx="155" cy="50" r="3" fill="#fbbf24"/>
      <circle cx="165" cy="35" r="2" fill="#38bdf8"/>
      <circle cx="148" cy="30" r="1.5" fill="#0284c7"/>

      {/* Upward arrow decoration */}
      <line x1="158" y1="72" x2="158" y2="55" stroke="#0284c7" strokeWidth="2" strokeLinecap="round"/>
      <polygon points="158,52 154,60 162,60" fill="#0284c7"/>
    </svg>
  )
}

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPass, setShowPass] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email || !password) {
      setError('يرجى إدخال البريد الإلكتروني وكلمة المرور')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await api.post('/auth/login', { email, password })
      const { access_token, user } = res.data
      login(access_token, user)
      toast.success(`مرحباً ${user.name || 'بك'} 👋`)
      navigate('/dashboard')
    } catch (err) {
      const msg = err.response?.data?.detail || err.response?.data?.message || 'خطأ في البريد الإلكتروني أو كلمة المرور'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #e0f2fe 0%, #f0f9ff 50%, #dbeafe 100%)',
      padding: '20px',
    }}>
      {/* Subtle background pattern */}
      <div style={{
        position: 'fixed',
        inset: 0,
        backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(56,189,248,0.12) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(2,132,199,0.08) 0%, transparent 50%)',
        pointerEvents: 'none',
      }} />

      <div style={{
        background: '#fff',
        borderRadius: 24,
        boxShadow: '0 20px 60px rgba(2,132,199,0.15), 0 4px 16px rgba(0,0,0,0.06)',
        width: '100%',
        maxWidth: 460,
        position: 'relative',
        overflow: 'hidden',
        border: '1px solid #e0f2fe',
      }}>
        {/* Business illustration banner */}
        <div style={{
          background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
          padding: '24px 24px 0',
          borderBottom: '1px solid #bae6fd',
        }}>
          <BusinessIllustration />
        </div>

        {/* Form section */}
        <div style={{ padding: '32px 36px 36px' }}>
          {/* Logo / Header */}
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{
              width: 56,
              height: 56,
              background: 'linear-gradient(135deg, #0284c7, #38bdf8)',
              borderRadius: 14,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 14px',
              boxShadow: '0 4px 15px rgba(2,132,199,0.25)',
            }}>
              <svg width="30" height="30" viewBox="0 0 24 24" fill="white">
                <path d="M3 3h18v2H3zm0 4h18v2H3zm0 4h12v2H3zm0 4h12v2H3zm14-4l4 4-4 4v-3h-3v-2h3z"/>
              </svg>
            </div>
            <h1 style={{ fontSize: 21, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>
              نظام إدارة الأعمال
            </h1>
            <p style={{ fontSize: 13, color: '#64748b' }}>
              سجّل دخولك للمتابعة
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="alert alert-error" style={{ marginBottom: 20 }}>
              ⚠️ {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label className="form-label">البريد الإلكتروني</label>
              <input
                type="email"
                className="form-control"
                placeholder="example@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                style={{ padding: '11px 14px', fontSize: 14 }}
              />
            </div>

            <div className="form-group">
              <label className="form-label">كلمة المرور</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPass ? 'text' : 'password'}
                  className="form-control"
                  placeholder="أدخل كلمة المرور"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  style={{ padding: '11px 14px', paddingLeft: 44, fontSize: 14 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  style={{
                    position: 'absolute',
                    left: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 16,
                    color: '#94a3b8',
                  }}
                >
                  {showPass ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg"
              style={{ width: '100%', marginTop: 8, justifyContent: 'center', letterSpacing: 0.5 }}
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                  <span>جاري الدخول...</span>
                </>
              ) : (
                'تسجيل الدخول 🔐'
              )}
            </button>
          </form>

          {/* Hint */}
          <div style={{
            marginTop: 22,
            padding: '12px 14px',
            background: '#f0f9ff',
            borderRadius: 10,
            border: '1px solid #bae6fd',
            fontSize: 12,
            color: '#64748b',
            lineHeight: 1.7,
          }}>
            <div style={{ fontWeight: 600, marginBottom: 4, color: '#0284c7' }}>
              🔑 بيانات الدخول الافتراضية:
            </div>
            <div>البريد: <code style={{ background: '#e0f2fe', padding: '1px 6px', borderRadius: 4, color: '#0369a1' }}>owner@rahaf.com</code></div>
            <div>كلمة المرور: <code style={{ background: '#e0f2fe', padding: '1px 6px', borderRadius: 4, color: '#0369a1' }}>admin123</code></div>
          </div>
        </div>
      </div>
    </div>
  )
}
