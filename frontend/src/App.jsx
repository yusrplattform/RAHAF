import React, { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import Sidebar from './components/Sidebar'
import Header from './components/Header'

// Pages
import PublicProfile from './pages/PublicProfile'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Companies from './pages/Companies'
import Income from './pages/Income'
import Expenses from './pages/Expenses'
import Clients from './pages/Clients'
import CRM from './pages/CRM'
import Collections from './pages/Collections'
import Tasks from './pages/Tasks'
import Reports from './pages/Reports'

const pageTitles = {
  '/dashboard': 'لوحة التحكم',
  '/': 'لوحة التحكم',
  '/companies': 'الخدمات',
  '/income': 'الدخل',
  '/expenses': 'المصروفات',
  '/clients': 'العملاء',
  '/crm': 'متابعة العملاء والمعاملات',
  '/collections': 'التحصيل والمتأخرات',
  '/tasks': 'المهام',
  '/reports': 'التقارير',
}

function ProtectedRoute({ children }) {
  const { token, loading } = useAuth()

  if (loading) {
    return (
      <div className="loading-spinner" style={{ minHeight: '100vh' }}>
        <div className="spinner" />
        <span>جاري التحميل...</span>
      </div>
    )
  }

  if (!token) {
    return <Navigate to="/login" replace />
  }

  return children
}

function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  const pageTitle = pageTitles[location.pathname] || 'نظام إدارة الأعمال'

  return (
    <div className="app-layout">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="main-content">
        <Header
          title={pageTitle}
          onMenuToggle={() => setSidebarOpen((v) => !v)}
        />
        <main className="page-content">
          <Routes>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/companies" element={<Companies />} />
            <Route path="/income" element={<Income />} />
            <Route path="/expenses" element={<Expenses />} />
            <Route path="/clients" element={<Clients />} />
            <Route path="/crm" element={<CRM />} />
            <Route path="/collections" element={<Collections />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/reports" element={<Reports />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3500,
            style: {
              fontFamily: 'Cairo, sans-serif',
              fontSize: '14px',
              direction: 'rtl',
            },
          }}
        />
        <Routes>
          <Route path="/" element={<PublicProfile />} />
          <Route path="/login" element={<Login />} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
