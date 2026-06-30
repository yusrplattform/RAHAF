import React, { useState, useEffect } from 'react'
import api from '../api/axios'
import toast from 'react-hot-toast'
import Modal from '../components/Modal'

const CLIENT_STATUS = {
  new: { label: 'جديد', cls: 'badge-info', color: '#0284c7', bg: '#f0f9ff' },
  following: { label: 'قيد المتابعة', cls: 'badge-warning', color: '#d97706', bg: '#fffbeb' },
  waiting_payment: { label: 'بانتظار الدفع', cls: 'badge-orange', color: '#ea580c', bg: '#fff7ed' },
  paid: { label: 'مدفوع', cls: 'badge-success', color: '#059669', bg: '#f0fdf4' },
  late: { label: 'متأخر', cls: 'badge-danger', color: '#dc2626', bg: '#fef2f2' },
  completed: { label: 'مكتمل', cls: 'badge-purple', color: '#7c3aed', bg: '#faf5ff' },
}

const defaultForm = {
  name: '',
  phone: '',
  email: '',
  company_id: '',
  service_type: '',
  total_amount: '',
  amount_paid: '',
  amount_remaining: '',
  status: 'new',
  last_contact: '',
  next_follow_up: '',
  notes: '',
}

/* ── Business-themed SVG icons rotating per client ── */
const businessIcons = [
  // Briefcase
  (color) => (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
      <rect x="2" y="8" width="20" height="13" rx="2" fill={color} opacity="0.15" stroke={color} strokeWidth="1.5"/>
      <path d="M8 8V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke={color} strokeWidth="1.5" fill="none"/>
      <line x1="2" y1="14" x2="22" y2="14" stroke={color} strokeWidth="1.5"/>
      <circle cx="12" cy="14" r="1.5" fill={color}/>
    </svg>
  ),
  // Handshake / Deal
  (color) => (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
      <path d="M4 10L2 12l4 4 2-2" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M20 10l2 2-4 4-2-2" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M9 7l3 3 3-3 3 3-6 6-6-6 3-3z" fill={color} opacity="0.2" stroke={color} strokeWidth="1.3" strokeLinejoin="round"/>
    </svg>
  ),
  // Growth chart
  (color) => (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="3" width="18" height="18" rx="2" fill={color} opacity="0.08"/>
      <polyline points="5,17 9,13 13,15 19,8" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <polygon points="19,8 15,9 18,12" fill={color}/>
      <rect x="5" y="18" width="14" height="1.5" rx="0.75" fill={color} opacity="0.3"/>
    </svg>
  ),
  // Building / Office
  (color) => (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="6" width="14" height="16" rx="1" fill={color} opacity="0.15" stroke={color} strokeWidth="1.4"/>
      <rect x="17" y="10" width="5" height="12" rx="1" fill={color} opacity="0.1" stroke={color} strokeWidth="1.3"/>
      <rect x="6" y="9" width="3" height="3" rx="0.5" fill={color} opacity="0.5"/>
      <rect x="11" y="9" width="3" height="3" rx="0.5" fill={color} opacity="0.5"/>
      <rect x="6" y="14" width="3" height="3" rx="0.5" fill={color} opacity="0.5"/>
      <rect x="11" y="14" width="3" height="3" rx="0.5" fill={color} opacity="0.5"/>
      <rect x="8" y="19" width="4" height="3" rx="0.5" fill={color} opacity="0.4"/>
    </svg>
  ),
  // Target / Goal
  (color) => (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.5" opacity="0.3"/>
      <circle cx="12" cy="12" r="6" stroke={color} strokeWidth="1.5" opacity="0.5"/>
      <circle cx="12" cy="12" r="3" fill={color} opacity="0.8"/>
      <line x1="18" y1="6" x2="14" y2="10" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="21" y1="3" x2="18" y2="6" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  // Presentation / Strategy
  (color) => (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
      <rect x="2" y="4" width="20" height="14" rx="2" fill={color} opacity="0.1" stroke={color} strokeWidth="1.5"/>
      <line x1="12" y1="18" x2="12" y2="21" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="9" y1="21" x2="15" y2="21" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      <polyline points="6,14 9,10 13,12 18,7" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
]

function formatAmount(v) {
  return Number(v || 0).toLocaleString('ar-OM')
}

function formatDate(d) {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('ar-SA')
}

function PaymentProgress({ total, paid }) {
  const pct = total > 0 ? Math.min(100, Math.round((paid / total) * 100)) : 0
  const color = pct >= 100 ? '#16a34a' : pct >= 50 ? '#d97706' : '#dc2626'
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#64748b', marginBottom: 4 }}>
        <span>نسبة السداد</span>
        <span style={{ fontWeight: 700, color }}>{pct}%</span>
      </div>
      <div className="progress-bar" style={{ height: 7 }}>
        <div className="progress-bar-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  )
}

function ClientCard({ client, idx, onEdit, onDelete, onWhatsApp, getCompanyName }) {
  const st = CLIENT_STATUS[client.status] || { label: client.status, cls: 'badge-secondary', color: '#64748b', bg: '#f1f5f9' }
  const IconComp = businessIcons[idx % businessIcons.length]

  return (
    <div style={{
      background: '#fff',
      borderRadius: 16,
      border: `1.5px solid ${st.color}22`,
      boxShadow: '0 2px 12px rgba(2,132,199,0.07)',
      overflow: 'hidden',
      transition: 'transform 0.18s ease, box-shadow 0.18s ease',
      display: 'flex',
      flexDirection: 'column',
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(2,132,199,0.13)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(2,132,199,0.07)' }}
    >
      {/* Card header with business icon */}
      <div style={{
        background: `linear-gradient(135deg, ${st.bg}, #f8fafc)`,
        padding: '18px 18px 14px',
        borderBottom: `1px solid ${st.color}18`,
        display: 'flex',
        alignItems: 'flex-start',
        gap: 14,
      }}>
        {/* Business icon */}
        <div style={{
          width: 56,
          height: 56,
          borderRadius: 14,
          background: '#fff',
          border: `1.5px solid ${st.color}30`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          boxShadow: `0 2px 8px ${st.color}15`,
        }}>
          {IconComp(st.color)}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: '#0f172a', marginBottom: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {client.name}
          </div>
          {client.phone && (
            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }} dir="ltr">{client.phone}</div>
          )}
          <span className={`badge ${st.cls}`} style={{ fontSize: 11 }}>{st.label}</span>
        </div>
      </div>

      {/* Card body */}
      <div style={{ padding: '14px 18px', flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* Info rows */}
        {client.company_name || getCompanyName(client.company_id) !== '-' ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12.5 }}>
            <span style={{ color: '#0284c7', fontSize: 14 }}>🏢</span>
            <span style={{ color: '#475569' }}>{client.company_name || getCompanyName(client.company_id)}</span>
          </div>
        ) : null}

        {client.service_type && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12.5 }}>
            <span style={{ color: '#7c3aed', fontSize: 14 }}>⚙️</span>
            <span style={{ color: '#475569' }}>{client.service_type}</span>
          </div>
        )}

        {/* Amounts */}
        <div style={{
          background: '#f8fafc',
          borderRadius: 10,
          padding: '10px 12px',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 8,
          border: '1px solid #e0f2fe',
        }}>
          <div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 2 }}>المبلغ الكلي</div>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: '#0f172a' }}>{formatAmount(client.total_amount)} <span style={{ fontSize: 10, fontWeight: 400 }}>ر.ع</span></div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 2 }}>المدفوع</div>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: '#059669' }}>{formatAmount(client.amount_paid)} <span style={{ fontSize: 10, fontWeight: 400 }}>ر.ع</span></div>
          </div>
        </div>

        {/* Progress */}
        <PaymentProgress total={client.total_amount || 0} paid={client.amount_paid || 0} />

        {client.next_follow_up && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#d97706', background: '#fffbeb', borderRadius: 7, padding: '6px 10px', border: '1px solid #fde68a' }}>
            <span>📅</span>
            <span>متابعة: {formatDate(client.next_follow_up)}</span>
          </div>
        )}
      </div>

      {/* Card footer - actions */}
      <div style={{
        padding: '12px 16px',
        borderTop: '1px solid #f0f9ff',
        display: 'flex',
        gap: 8,
        background: '#fafeff',
      }}>
        <button
          className="btn btn-outline btn-sm"
          style={{ flex: 1, fontSize: 12, justifyContent: 'center' }}
          onClick={() => onEdit(client)}
        >
          ✏️ تعديل
        </button>
        <button
          className="btn btn-sm"
          style={{ background: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0', fontSize: 12 }}
          onClick={() => onWhatsApp(client.phone, client.name)}
          title="واتساب"
        >
          💬
        </button>
        <button
          className="btn btn-sm"
          style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', fontSize: 12 }}
          onClick={() => onDelete(client)}
          title="حذف"
        >
          🗑️
        </button>
      </div>
    </div>
  )
}

export default function Clients() {
  const [clients, setClients] = useState([])
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [form, setForm] = useState(defaultForm)
  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState({ company_id: '', status: '' })

  const fetchAll = async () => {
    setLoading(true)
    try {
      const params = {}
      if (filters.company_id) params.company_id = filters.company_id
      if (filters.status) params.status = filters.status
      if (search) params.search = search

      const [cliRes, compRes] = await Promise.all([
        api.get('/clients', { params }),
        api.get('/companies'),
      ])
      setClients(cliRes.data?.clients || cliRes.data || [])
      setCompanies(compRes.data?.companies || compRes.data || [])
    } catch {
      toast.error('فشل في تحميل البيانات')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => fetchAll(), 300)
    return () => clearTimeout(timer)
  }, [search, filters])

  const openAdd = () => {
    setEditItem(null)
    setForm(defaultForm)
    setModalOpen(true)
  }

  const openEdit = (item) => {
    setEditItem(item)
    setForm({
      name: item.name || '',
      phone: item.phone || '',
      email: item.email || '',
      company_id: item.company_id || '',
      service_type: item.service_type || '',
      total_amount: item.total_amount || '',
      amount_paid: item.amount_paid || '',
      amount_remaining: item.amount_remaining || '',
      status: item.status || 'new',
      last_contact: item.last_contact?.slice(0, 10) || '',
      next_follow_up: item.next_follow_up?.slice(0, 10) || '',
      notes: item.notes || '',
    })
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditItem(null)
    setForm(defaultForm)
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    const updated = { ...form, [name]: value }
    if (name === 'total_amount' || name === 'amount_paid') {
      const total = parseFloat(name === 'total_amount' ? value : form.total_amount) || 0
      const paid = parseFloat(name === 'amount_paid' ? value : form.amount_paid) || 0
      updated.amount_remaining = Math.max(0, total - paid).toString()
    }
    setForm(updated)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) {
      toast.error('اسم العميل مطلوب')
      return
    }
    setSaving(true)
    try {
      if (editItem) {
        await api.put(`/clients/${editItem.id}`, form)
        toast.success('تم تحديث العميل بنجاح')
      } else {
        await api.post('/clients', form)
        toast.success('تم إضافة العميل بنجاح')
      }
      closeModal()
      fetchAll()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'حدث خطأ')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    try {
      await api.delete(`/clients/${id}`)
      toast.success('تم حذف العميل')
      setDeleteConfirm(null)
      fetchAll()
    } catch {
      toast.error('فشل الحذف')
    }
  }

  const openWhatsApp = (phone, name) => {
    if (!phone) { toast.error('لا يوجد رقم هاتف'); return }
    const clean = phone.replace(/\D/g, '')
    const msg = encodeURIComponent(`السلام عليكم ${name}، نتواصل معكم بخصوص خدماتنا.`)
    window.open(`https://wa.me/${clean}?text=${msg}`, '_blank')
  }

  const getCompanyName = (id) => companies.find(c => c.id == id)?.name || '-'

  // Summary counts
  const statusCounts = Object.keys(CLIENT_STATUS).reduce((acc, k) => {
    acc[k] = clients.filter(c => c.status === k).length
    return acc
  }, {})

  return (
    <div>
      {/* Page header */}
      <div className="page-header">
        <div>
          <div className="page-header-title">العملاء</div>
          <div className="page-header-subtitle">إدارة جميع العملاء ومتابعة حالاتهم • {clients.length} عميل</div>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>➕ إضافة عميل</button>
      </div>

      {/* Status summary bar */}
      {clients.length > 0 && (
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 18 }}>
          {Object.entries(CLIENT_STATUS).map(([k, v]) => statusCounts[k] > 0 && (
            <div key={k} style={{
              padding: '6px 14px',
              borderRadius: 20,
              background: v.bg,
              border: `1px solid ${v.color}30`,
              fontSize: 12.5,
              fontWeight: 600,
              color: v.color,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}>
              <span style={{
                width: 20, height: 20, borderRadius: '50%',
                background: v.color, color: '#fff',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700,
              }}>{statusCounts[k]}</span>
              {v.label}
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="filter-bar">
        <div className="search-input-wrapper" style={{ flex: 1, minWidth: 200 }}>
          <span className="search-icon">🔍</span>
          <input
            className="form-control"
            placeholder="بحث بالاسم أو الهاتف..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select className="form-control" value={filters.company_id} onChange={e => setFilters(p => ({ ...p, company_id: e.target.value }))}>
          <option value="">جميع الخدمات</option>
          {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select className="form-control" value={filters.status} onChange={e => setFilters(p => ({ ...p, status: e.target.value }))}>
          <option value="">جميع الحالات</option>
          {Object.entries(CLIENT_STATUS).map(([v, { label }]) => (
            <option key={v} value={v}>{label}</option>
          ))}
        </select>
        <button className="btn btn-outline btn-sm" onClick={() => { setSearch(''); setFilters({ company_id: '', status: '' }) }}>
          إعادة تعيين
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="loading-spinner">
          <div className="spinner" />
          <span>جاري التحميل...</span>
        </div>
      ) : clients.length === 0 ? (
        <div className="card">
          <div className="empty-state" style={{ padding: '60px 20px' }}>
            {/* Business empty state illustration */}
            <svg width="120" height="90" viewBox="0 0 120 90" fill="none" style={{ marginBottom: 16, opacity: 0.6 }}>
              <rect x="10" y="30" width="25" height="50" rx="3" fill="#bae6fd"/>
              <rect x="40" y="20" width="25" height="60" rx="3" fill="#7dd3fc"/>
              <rect x="70" y="10" width="25" height="70" rx="3" fill="#38bdf8"/>
              <circle cx="95" cy="25" r="12" fill="#e0f2fe" stroke="#7dd3fc" strokeWidth="2"/>
              <path d="M91 25l3 3 5-5" stroke="#0284c7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <rect x="5" y="82" width="110" height="2" rx="1" fill="#bae6fd"/>
            </svg>
            <div className="empty-state-text">لا توجد عملاء</div>
            <div className="empty-state-sub" style={{ marginBottom: 16 }}>أضف أول عميل لبدء تطوير أعمالك</div>
            <button className="btn btn-primary" onClick={openAdd}>➕ إضافة عميل</button>
          </div>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 18,
        }}>
          {clients.map((client, idx) => (
            <ClientCard
              key={client.id}
              client={client}
              idx={idx}
              onEdit={openEdit}
              onDelete={setDeleteConfirm}
              onWhatsApp={openWhatsApp}
              getCompanyName={getCompanyName}
            />
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal isOpen={modalOpen} onClose={closeModal} title={editItem ? 'تعديل العميل' : 'إضافة عميل جديد'} size="lg">
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">الاسم <span className="required">*</span></label>
                <input className="form-control" name="name" value={form.name} onChange={handleChange} placeholder="اسم العميل" required />
              </div>
              <div className="form-group">
                <label className="form-label">رقم الهاتف</label>
                <input className="form-control" name="phone" value={form.phone} onChange={handleChange} placeholder="05xxxxxxxx" dir="ltr" />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">البريد الإلكتروني</label>
                <input className="form-control" type="email" name="email" value={form.email} onChange={handleChange} placeholder="email@example.com" dir="ltr" />
              </div>
              <div className="form-group">
                <label className="form-label">الخدمة المرتبطة</label>
                <select className="form-control" name="company_id" value={form.company_id} onChange={handleChange}>
                  <option value="">-- اختر الخدمة --</option>
                  {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">نوع الخدمة</label>
              <input className="form-control" name="service_type" value={form.service_type} onChange={handleChange} placeholder="الخدمة المقدمة..." />
            </div>

            <div className="form-row-3">
              <div className="form-group">
                <label className="form-label">المبلغ الكلي</label>
                <input className="form-control" type="number" name="total_amount" value={form.total_amount} onChange={handleChange} placeholder="0" min="0" step="0.01" />
              </div>
              <div className="form-group">
                <label className="form-label">المبلغ المدفوع</label>
                <input className="form-control" type="number" name="amount_paid" value={form.amount_paid} onChange={handleChange} placeholder="0" min="0" step="0.01" />
              </div>
              <div className="form-group">
                <label className="form-label">المتبقي</label>
                <input className="form-control" type="number" name="amount_remaining" value={form.amount_remaining} readOnly style={{ background: '#f0f9ff', color: '#0284c7', fontWeight: 600 }} />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">الحالة</label>
                <select className="form-control" name="status" value={form.status} onChange={handleChange}>
                  {Object.entries(CLIENT_STATUS).map(([v, { label }]) => (
                    <option key={v} value={v}>{label}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">آخر تواصل</label>
                <input className="form-control" type="date" name="last_contact" value={form.last_contact} onChange={handleChange} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">موعد المتابعة</label>
              <input className="form-control" type="date" name="next_follow_up" value={form.next_follow_up} onChange={handleChange} />
            </div>

            <div className="form-group">
              <label className="form-label">ملاحظات</label>
              <textarea className="form-control" name="notes" value={form.notes} onChange={handleChange} placeholder="ملاحظات إضافية..." rows={3} />
            </div>
          </div>
          <div className="modal-footer">
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? <><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> جاري الحفظ...</> : (editItem ? '💾 حفظ' : '➕ إضافة')}
            </button>
            <button type="button" className="btn btn-outline" onClick={closeModal}>إلغاء</button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm */}
      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="تأكيد الحذف" size="sm">
        <div className="modal-body">
          <div className="alert alert-error">⚠️ هل تريد حذف العميل <strong>{deleteConfirm?.name}</strong>؟</div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-danger" onClick={() => handleDelete(deleteConfirm?.id)}>🗑️ حذف</button>
          <button className="btn btn-outline" onClick={() => setDeleteConfirm(null)}>إلغاء</button>
        </div>
      </Modal>
    </div>
  )
}
