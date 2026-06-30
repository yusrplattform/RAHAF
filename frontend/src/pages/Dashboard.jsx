import React, { useState, useEffect } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import api from '../api/axios'
import toast from 'react-hot-toast'
import StatCard from '../components/StatCard'

const PERIODS = [
  { key: 'today', label: 'اليوم' },
  { key: 'week', label: 'الأسبوع' },
  { key: 'month', label: 'الشهر' },
  { key: 'year', label: 'السنة' },
]

const MONTH_NAMES_AR = [
  'يناير','فبراير','مارس','أبريل','مايو','يونيو',
  'يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'
]

function formatAmount(v) {
  if (v === undefined || v === null) return '0'
  return Number(v).toLocaleString('ar-OM')
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: '10px 14px', fontSize: 12.5, fontFamily: 'Cairo, sans-serif' }}>
        <div style={{ fontWeight: 700, marginBottom: 6 }}>{label}</div>
        {payload.map((p, i) => (
          <div key={i} style={{ color: p.color, marginBottom: 2 }}>
            {p.name}: {formatAmount(p.value)} ر.ع
          </div>
        ))}
      </div>
    )
  }
  return null
}

export default function Dashboard() {
  const [period, setPeriod] = useState('month')
  const [companyFilter, setCompanyFilter] = useState('')
  const [data, setData] = useState(null)
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchDashboard = async () => {
    setLoading(true)
    try {
      const params = { period }
      if (companyFilter) params.company_id = companyFilter
      const [dashRes, compRes] = await Promise.all([
        api.get('/reports/dashboard', { params }),
        api.get('/companies'),
      ])
      setData(dashRes.data)
      setCompanies(compRes.data?.companies || compRes.data || [])
    } catch (err) {
      toast.error('فشل في تحميل بيانات لوحة التحكم')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboard()
  }, [period, companyFilter])

  const stats = data?.stats || {}
  const monthlyChart = data?.monthly_chart || []
  const topServices = data?.top_services || []
  const topExpenses = data?.top_expenses || []
  const topCompany = data?.top_company

  const chartData = monthlyChart.map((item) => ({
    name: item.month_name || MONTH_NAMES_AR[(item.month || 1) - 1] || '',
    الدخل: item.income || 0,
    المصروفات: item.expenses || 0,
    الربح: (item.income || 0) - (item.expenses || 0),
  }))

  return (
    <div>
      {/* Filters */}
      <div className="filter-bar" style={{ marginBottom: 20 }}>
        <div className="period-filter">
          {PERIODS.map(p => (
            <button
              key={p.key}
              className={`period-btn${period === p.key ? ' active' : ''}`}
              onClick={() => setPeriod(p.key)}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="filter-bar-spacer" />
        <select
          className="form-control"
          value={companyFilter}
          onChange={e => setCompanyFilter(e.target.value)}
          style={{ minWidth: 180 }}
        >
          <option value="">جميع الخدمات</option>
          {companies.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="loading-spinner">
          <div className="spinner" />
          <span>جاري تحميل البيانات...</span>
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="stats-grid">
            <StatCard
              title="إجمالي الدخل"
              value={`${formatAmount(stats.total_income)} ر.ع`}
              subtitle={`${stats.income_count || 0} عملية`}
              color="green"
              icon="💰"
            />
            <StatCard
              title="إجمالي المصروفات"
              value={`${formatAmount(stats.total_expenses)} ر.ع`}
              subtitle={`${stats.expense_count || 0} عملية`}
              color="red"
              icon="📉"
            />
            <StatCard
              title="صافي الربح"
              value={`${formatAmount(stats.net_profit)} ر.ع`}
              subtitle="الربح الصافي"
              color={(stats.net_profit || 0) >= 0 ? 'green' : 'red'}
              icon="📈"
            />
            <StatCard
              title="عدد العملاء"
              value={stats.total_clients || 0}
              subtitle="إجمالي العملاء"
              color="blue"
              icon="👥"
            />
            <StatCard
              title="العملاء المتأخرين"
              value={stats.late_clients || 0}
              subtitle="بحاجة إلى متابعة"
              color="yellow"
              icon="⚠️"
            />
            <StatCard
              title="المبالغ المستحقة"
              value={`${formatAmount(stats.pending_amount)} ر.ع`}
              subtitle="إجمالي المتبقي"
              color="purple"
              icon="⏰"
            />
          </div>

          {/* Charts Row */}
          <div className="grid-2" style={{ marginBottom: 20 }}>
            {/* Monthly Bar Chart */}
            <div className="card">
              <div className="card-header">
                <span className="card-title">📊 الدخل والمصروفات الشهرية</span>
              </div>
              <div className="card-body" style={{ padding: '16px 8px' }}>
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fontFamily: 'Cairo' }} />
                      <YAxis tick={{ fontSize: 11, fontFamily: 'Cairo' }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend
                        wrapperStyle={{ fontFamily: 'Cairo', fontSize: 12 }}
                        formatter={(v) => v}
                      />
                      <Bar dataKey="الدخل" fill="#16a34a" radius={[4,4,0,0]} />
                      <Bar dataKey="المصروفات" fill="#dc2626" radius={[4,4,0,0]} />
                      <Bar dataKey="الربح" fill="#1e40af" radius={[4,4,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="empty-state" style={{ padding: '40px 20px' }}>
                    <div className="empty-state-icon">📊</div>
                    <div className="empty-state-text">لا توجد بيانات للرسم البياني</div>
                  </div>
                )}
              </div>
            </div>

            {/* Top Service */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {topCompany && (
                <div className="card">
                  <div className="card-header">
                    <span className="card-title">🏆 أفضل خدمة</span>
                  </div>
                  <div className="card-body">
                    <div style={{ fontSize: 18, fontWeight: 700, color: '#1e40af', marginBottom: 12 }}>
                      🧩 {topCompany.name}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <div className="flex justify-between" style={{ fontSize: 13 }}>
                        <span className="text-secondary">الدخل</span>
                        <span style={{ fontWeight: 600, color: '#16a34a' }}>{formatAmount(topCompany.total_income)} ر.ع</span>
                      </div>
                      <div className="flex justify-between" style={{ fontSize: 13 }}>
                        <span className="text-secondary">المصروفات</span>
                        <span style={{ fontWeight: 600, color: '#dc2626' }}>{formatAmount(topCompany.total_expenses)} ر.ع</span>
                      </div>
                      <hr className="divider" />
                      <div className="flex justify-between" style={{ fontSize: 14 }}>
                        <span style={{ fontWeight: 600 }}>صافي الربح</span>
                        <span style={{ fontWeight: 700, color: '#1e40af' }}>{formatAmount(topCompany.net_profit)} ر.ع</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Top Services */}
              <div className="card" style={{ flex: 1 }}>
                <div className="card-header">
                  <span className="card-title">⭐ أبرز الخدمات</span>
                </div>
                <div className="card-body" style={{ padding: '12px 16px' }}>
                  {topServices.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {topServices.slice(0, 5).map((s, i) => (
                        <div key={i} className="flex justify-between items-center">
                          <span style={{ fontSize: 13, color: '#374151' }}>
                            <span style={{ color: '#94a3b8', marginLeft: 6 }}>#{i + 1}</span>
                            {s.service_type || s.name}
                          </span>
                          <span style={{ fontSize: 13, fontWeight: 600, color: '#16a34a' }}>
                            {formatAmount(s.total)} ر.ع
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ color: '#94a3b8', fontSize: 13, textAlign: 'center', padding: '16px 0' }}>
                      لا توجد بيانات
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Top Expenses */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">📋 أبرز المصروفات</span>
            </div>
            <div className="card-body" style={{ padding: '12px 0' }}>
              {topExpenses.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {topExpenses.slice(0, 5).map((e, i) => (
                    <div key={i} className="flex justify-between items-center" style={{
                      padding: '10px 20px',
                      borderBottom: i < topExpenses.length - 1 ? '1px solid #f1f5f9' : 'none',
                    }}>
                      <span style={{ fontSize: 13 }}>
                        <span style={{ color: '#94a3b8', marginLeft: 8 }}>#{i + 1}</span>
                        {e.expense_type || e.name}
                      </span>
                      <span style={{ fontWeight: 600, color: '#dc2626', fontSize: 13 }}>
                        {formatAmount(e.total)} ر.ع
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state" style={{ padding: '30px 20px' }}>
                  <div className="empty-state-text">لا توجد مصروفات</div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
