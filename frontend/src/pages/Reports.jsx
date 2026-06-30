import React, { useState, useEffect } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line
} from 'recharts'
import api from '../api/axios'
import toast from 'react-hot-toast'

const MONTHS_AR = [
  '', 'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
]

const COLORS = ['#1e40af', '#16a34a', '#dc2626', '#d97706', '#7c3aed', '#0891b2', '#db2777', '#65a30d']

function formatAmount(v) {
  return Number(v || 0).toLocaleString('ar-OM')
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: '10px 14px', fontSize: 12.5, fontFamily: 'Cairo' }}>
        <div style={{ fontWeight: 700, marginBottom: 6 }}>{label}</div>
        {payload.map((p, i) => (
          <div key={i} style={{ color: p.color }}>
            {p.name}: {formatAmount(p.value)} ر.ع
          </div>
        ))}
      </div>
    )
  }
  return null
}

const PieTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 12px', fontSize: 12.5, fontFamily: 'Cairo' }}>
        <div style={{ fontWeight: 600 }}>{payload[0].name}</div>
        <div style={{ color: payload[0].payload.fill }}>{formatAmount(payload[0].value)} ر.ع</div>
      </div>
    )
  }
  return null
}

export default function Reports() {
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())
  const [data, setData] = useState(null)
  const [companies, setCompanies] = useState([])
  const [selectedCompany, setSelectedCompany] = useState('')
  const [loading, setLoading] = useState(true)

  const fetchReports = async () => {
    setLoading(true)
    try {
      const params = { month, year }
      if (selectedCompany) params.company_id = selectedCompany

      const [repRes, compRes] = await Promise.all([
        api.get('/reports/monthly', { params }),
        api.get('/companies'),
      ])
      setData(repRes.data)
      setCompanies(compRes.data?.companies || compRes.data || [])
    } catch {
      toast.error('فشل في تحميل التقارير')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchReports() }, [month, year, selectedCompany])

  const handleExport = async () => {
    try {
      const params = { month, year }
      if (selectedCompany) params.company_id = selectedCompany
      const res = await api.get('/reports/export', { params, responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement('a')
      a.href = url
      a.download = `report_${year}_${month}.xlsx`
      a.click()
      toast.success('تم تصدير التقرير')
    } catch {
      toast.error('فشل التصدير')
    }
  }

  const handlePrint = () => window.print()

  const stats = data?.stats || {}
  const companyProfits = data?.company_profits || []
  const incomeByService = data?.income_by_service || []
  const expensesByType = data?.expenses_by_type || []
  const monthlyTrend = data?.monthly_trend || []

  const totalIncome = stats.total_income || 0
  const totalExpenses = stats.total_expenses || 0
  const netProfit = totalIncome - totalExpenses
  const breakEven = stats.break_even || totalExpenses

  const yearsOptions = Array.from({ length: 5 }, (_, i) => now.getFullYear() - i)

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-header-title">التقارير</div>
          <div className="page-header-subtitle">تقارير مالية شاملة للأداء</div>
        </div>
        <div className="flex gap-3">
          <button className="btn btn-outline" onClick={handlePrint}>🖨️ طباعة</button>
          <button className="btn btn-success" onClick={handleExport}>📊 تصدير Excel</button>
        </div>
      </div>

      {/* Filters */}
      <div className="filter-bar" style={{ marginBottom: 20 }}>
        <select className="form-control" value={month} onChange={e => setMonth(Number(e.target.value))}>
          {MONTHS_AR.slice(1).map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
        </select>
        <select className="form-control" value={year} onChange={e => setYear(Number(e.target.value))}>
          {yearsOptions.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <select className="form-control" value={selectedCompany} onChange={e => setSelectedCompany(e.target.value)}>
          <option value="">جميع الخدمات</option>
          {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <div style={{ flex: 1 }} />
        <div style={{ fontWeight: 600, fontSize: 14, color: '#1e40af' }}>
          📅 {MONTHS_AR[month]} {year}
        </div>
      </div>

      {loading ? (
        <div className="loading-spinner">
          <div className="spinner" />
          <span>جاري تحميل التقارير...</span>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: '18px 20px' }}>
              <div style={{ fontSize: 12.5, color: '#64748b', marginBottom: 6 }}>إجمالي الدخل</div>
              <div style={{ fontSize: 26, fontWeight: 700, color: '#16a34a' }}>{formatAmount(totalIncome)} ر.ع</div>
            </div>
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, padding: '18px 20px' }}>
              <div style={{ fontSize: 12.5, color: '#64748b', marginBottom: 6 }}>إجمالي المصروفات</div>
              <div style={{ fontSize: 26, fontWeight: 700, color: '#dc2626' }}>{formatAmount(totalExpenses)} ر.ع</div>
            </div>
            <div style={{ background: netProfit >= 0 ? '#eff6ff' : '#fef2f2', border: `1px solid ${netProfit >= 0 ? '#bfdbfe' : '#fecaca'}`, borderRadius: 12, padding: '18px 20px' }}>
              <div style={{ fontSize: 12.5, color: '#64748b', marginBottom: 6 }}>صافي الربح</div>
              <div style={{ fontSize: 26, fontWeight: 700, color: netProfit >= 0 ? '#1e40af' : '#dc2626' }}>
                {netProfit >= 0 ? '' : '-'}{formatAmount(Math.abs(netProfit))} ر.ع
              </div>
            </div>
            <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 12, padding: '18px 20px' }}>
              <div style={{ fontSize: 12.5, color: '#64748b', marginBottom: 6 }}>نقطة التعادل</div>
              <div style={{ fontSize: 26, fontWeight: 700, color: '#d97706' }}>{formatAmount(breakEven)} ر.ع</div>
              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
                {totalIncome >= breakEven ? '✅ تجاوزتم نقطة التعادل' : '⚠️ لم تصلوا بعد'}
              </div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid-2" style={{ marginBottom: 20 }}>
            {/* Income by Service Pie */}
            <div className="card">
              <div className="card-header">
                <span className="card-title">🍕 الدخل حسب نوع الخدمة</span>
              </div>
              <div className="card-body" style={{ padding: '10px 0' }}>
                {incomeByService.length > 0 ? (
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie
                        data={incomeByService}
                        dataKey="total"
                        nameKey="service_type"
                        cx="50%"
                        cy="50%"
                        outerRadius={90}
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        labelLine={false}
                      >
                        {incomeByService.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<PieTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="empty-state" style={{ padding: '40px 20px' }}>
                    <div className="empty-state-text">لا توجد بيانات</div>
                  </div>
                )}
              </div>
            </div>

            {/* Expenses by Type Pie */}
            <div className="card">
              <div className="card-header">
                <span className="card-title">📊 المصروفات حسب النوع</span>
              </div>
              <div className="card-body" style={{ padding: '10px 0' }}>
                {expensesByType.length > 0 ? (
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie
                        data={expensesByType}
                        dataKey="total"
                        nameKey="expense_type"
                        cx="50%"
                        cy="50%"
                        outerRadius={90}
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        labelLine={false}
                      >
                        {expensesByType.map((_, i) => (
                          <Cell key={i} fill={COLORS[(i + 2) % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<PieTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="empty-state" style={{ padding: '40px 20px' }}>
                    <div className="empty-state-text">لا توجد بيانات</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Monthly Trend Chart */}
          {monthlyTrend.length > 0 && (
            <div className="card" style={{ marginBottom: 20 }}>
              <div className="card-header">
                <span className="card-title">📈 اتجاه الربح الشهري</span>
              </div>
              <div className="card-body" style={{ padding: '16px 8px' }}>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={monthlyTrend.map(item => ({
                    name: MONTHS_AR[item.month] || item.month_name || '',
                    الدخل: item.income || 0,
                    المصروفات: item.expenses || 0,
                    الربح: (item.income || 0) - (item.expenses || 0),
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fontFamily: 'Cairo' }} />
                    <YAxis tick={{ fontSize: 11, fontFamily: 'Cairo' }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontFamily: 'Cairo', fontSize: 12 }} />
                    <Bar dataKey="الدخل" fill="#16a34a" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="المصروفات" fill="#dc2626" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="الربح" fill="#1e40af" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Company Profit/Loss Table */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">🧩 ملخص أرباح وخسائر الخدمات</span>
            </div>
            {companyProfits.length === 0 ? (
              <div className="empty-state" style={{ padding: '40px 20px' }}>
                <div className="empty-state-text">لا توجد بيانات شركات</div>
              </div>
            ) : (
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>الخدمة</th>
                      <th>إجمالي الدخل</th>
                      <th>إجمالي المصروفات</th>
                      <th>صافي الربح</th>
                      <th>هامش الربح</th>
                      <th>عدد العملاء</th>
                    </tr>
                  </thead>
                  <tbody>
                    {companyProfits.map((company, idx) => {
                      const net = (company.total_income || 0) - (company.total_expenses || 0)
                      const margin = company.total_income > 0
                        ? ((net / company.total_income) * 100).toFixed(1)
                        : 0
                      return (
                        <tr key={company.id || idx}>
                          <td style={{ color: '#94a3b8' }}>{idx + 1}</td>
                          <td style={{ fontWeight: 600 }}>{company.name}</td>
                          <td style={{ color: '#16a34a', fontWeight: 600 }}>{formatAmount(company.total_income)} ر.ع</td>
                          <td style={{ color: '#dc2626', fontWeight: 600 }}>{formatAmount(company.total_expenses)} ر.ع</td>
                          <td style={{ fontWeight: 700, color: net >= 0 ? '#16a34a' : '#dc2626' }}>
                            {net >= 0 ? '' : '-'}{formatAmount(Math.abs(net))} ر.ع
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div className="progress-bar" style={{ width: 80 }}>
                                <div
                                  className="progress-bar-fill"
                                  style={{
                                    width: `${Math.max(0, Math.min(100, Number(margin)))}%`,
                                    background: Number(margin) >= 20 ? '#16a34a' : Number(margin) >= 0 ? '#d97706' : '#dc2626',
                                  }}
                                />
                              </div>
                              <span style={{ fontSize: 12, color: '#64748b' }}>{margin}%</span>
                            </div>
                          </td>
                          <td>
                            <span className="badge badge-info">{company.client_count || 0}</span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                  <tfoot>
                    <tr style={{ background: '#f8fafc', fontWeight: 700 }}>
                      <td colSpan={2} style={{ padding: '12px 16px' }}>الإجمالي</td>
                      <td style={{ padding: '12px 16px', color: '#16a34a' }}>
                        {formatAmount(companyProfits.reduce((s, c) => s + (c.total_income || 0), 0))} ر.ع
                      </td>
                      <td style={{ padding: '12px 16px', color: '#dc2626' }}>
                        {formatAmount(companyProfits.reduce((s, c) => s + (c.total_expenses || 0), 0))} ر.ع
                      </td>
                      <td style={{ padding: '12px 16px', color: netProfit >= 0 ? '#16a34a' : '#dc2626' }}>
                        {formatAmount(netProfit)} ر.ع
                      </td>
                      <td colSpan={2} />
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
