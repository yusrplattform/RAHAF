import React, { useState, useEffect } from 'react'
import api from '../api/axios'
import toast from 'react-hot-toast'
import Modal from '../components/Modal'

function formatAmount(v) {
  return Number(v || 0).toLocaleString('ar-OM')
}

function formatDate(d) {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('ar-SA')
}

function getDaysLate(dateStr) {
  if (!dateStr) return null
  const target = new Date(dateStr)
  const today = new Date()
  const diff = Math.floor((today - target) / (1000 * 60 * 60 * 24))
  return diff
}

function LateBadge({ days }) {
  if (days === null || days === undefined) return <span className="badge badge-secondary">-</span>
  if (days > 30) return <span className="badge badge-danger">🔴 {days} يوم</span>
  if (days > 7) return <span className="badge badge-warning">🟠 {days} يوم</span>
  if (days > 0) return <span className="badge badge-orange">🟡 {days} يوم</span>
  return <span className="badge badge-success">قريب</span>
}

export default function Collections() {
  const [clients, setClients] = useState([])
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ company_id: '', status: '' })

  // Payment Modal
  const [payModal, setPayModal] = useState(null)
  const [payAmount, setPayAmount] = useState('')
  const [payNote, setPayNote] = useState('')
  const [saving, setSaving] = useState(false)

  // Note Modal
  const [noteModal, setNoteModal] = useState(null)
  const [noteText, setNoteText] = useState('')

  const fetchAll = async () => {
    setLoading(true)
    try {
      const params = { status: 'late,waiting_payment' }
      if (filters.company_id) params.company_id = filters.company_id
      if (filters.status) params.status = filters.status

      const [cliRes, compRes] = await Promise.all([
        api.get('/clients', { params }),
        api.get('/companies'),
      ])
      let data = cliRes.data?.clients || cliRes.data || []
      if (!filters.status) {
        data = data.filter(c => ['late', 'waiting_payment'].includes(c.status))
      }
      setClients(data)
      setCompanies(compRes.data?.companies || compRes.data || [])
    } catch {
      toast.error('فشل في تحميل البيانات')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAll() }, [filters])

  const handlePayment = async (e) => {
    e.preventDefault()
    if (!payAmount || isNaN(payAmount)) {
      toast.error('أدخل مبلغاً صحيحاً')
      return
    }
    setSaving(true)
    try {
      const client = payModal
      const newPaid = (client.amount_paid || 0) + parseFloat(payAmount)
      const newRemaining = Math.max(0, (client.total_amount || 0) - newPaid)
      const newStatus = newRemaining <= 0 ? 'paid' : client.status

      await api.put(`/clients/${client.id}`, {
        ...client,
        amount_paid: newPaid,
        amount_remaining: newRemaining,
        status: newStatus,
        notes: payNote ? `${client.notes || ''}\n[دفعة بتاريخ ${new Date().toLocaleDateString('ar-SA')}]: ${payNote}` : client.notes,
        last_contact: new Date().toISOString().slice(0, 10),
      })
      toast.success(`✅ تم تسجيل دفعة ${formatAmount(payAmount)} ر.ع`)
      setPayModal(null)
      setPayAmount('')
      setPayNote('')
      fetchAll()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'حدث خطأ')
    } finally {
      setSaving(false)
    }
  }

  const handleNote = async (e) => {
    e.preventDefault()
    if (!noteText.trim()) {
      toast.error('أدخل ملاحظة')
      return
    }
    setSaving(true)
    try {
      const client = noteModal
      const today = new Date().toLocaleDateString('ar-SA')
      await api.put(`/clients/${client.id}`, {
        ...client,
        notes: `${client.notes || ''}\n[${today}]: ${noteText}`.trim(),
        last_contact: new Date().toISOString().slice(0, 10),
      })
      toast.success('تم إضافة الملاحظة')
      setNoteModal(null)
      setNoteText('')
      fetchAll()
    } catch {
      toast.error('حدث خطأ')
    } finally {
      setSaving(false)
    }
  }

  const openWhatsApp = (client) => {
    if (!client.phone) {
      toast.error('لا يوجد رقم هاتف')
      return
    }
    const clean = client.phone.replace(/\D/g, '')
    const msg = encodeURIComponent(
      `السلام عليكم ${client.name}، نذكركم بضرورة سداد المبلغ المستحق ${formatAmount(client.amount_remaining)} ريال عُماني. نشكركم على تعاملكم معنا.`
    )
    window.open(`https://wa.me/${clean}?text=${msg}`, '_blank')
  }

  const getCompanyName = (id) => companies.find(c => c.id == id)?.name || '-'

  const totalPending = clients.reduce((s, c) => s + (c.amount_remaining || 0), 0)
  const veryLate = clients.filter(c => getDaysLate(c.next_follow_up) > 30).length
  const late = clients.filter(c => {
    const d = getDaysLate(c.next_follow_up)
    return d > 7 && d <= 30
  }).length

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-header-title">التحصيل والمتأخرات</div>
          <div className="page-header-subtitle">متابعة العملاء المتأخرين وتحصيل المستحقات</div>
        </div>
      </div>

      {/* Summary */}
      <div className="flex gap-3" style={{ marginBottom: 16, flexWrap: 'wrap' }}>
        <div className="info-box info-box-red">
          💰 إجمالي المستحقات: <strong>{formatAmount(totalPending)} ر.ع</strong>
        </div>
        <div className="info-box" style={{ background: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca' }}>
          🔴 متأخر جداً (+30 يوم): <strong>{veryLate}</strong>
        </div>
        <div className="info-box info-box-red" style={{ background: '#fff7ed', color: '#c2410c', border: '1px solid #fed7aa' }}>
          🟠 متأخر (7-30 يوم): <strong>{late}</strong>
        </div>
        <div className="info-box info-box-blue">
          👥 إجمالي المتأخرين: <strong>{clients.length}</strong>
        </div>
      </div>

      {/* Filters */}
      <div className="filter-bar">
        <select className="form-control" value={filters.company_id} onChange={e => setFilters(p => ({ ...p, company_id: e.target.value }))}>
          <option value="">جميع الخدمات</option>
          {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select className="form-control" value={filters.status} onChange={e => setFilters(p => ({ ...p, status: e.target.value }))}>
          <option value="">متأخر + بانتظار الدفع</option>
          <option value="late">متأخر فقط</option>
          <option value="waiting_payment">بانتظار الدفع فقط</option>
        </select>
        <button className="btn btn-outline btn-sm" onClick={() => setFilters({ company_id: '', status: '' })}>
          إعادة تعيين
        </button>
        <div style={{ flex: 1 }} />
        <button className="btn btn-success btn-sm" onClick={fetchAll}>🔄 تحديث</button>
      </div>

      <div className="card">
        {loading ? (
          <div className="loading-spinner">
            <div className="spinner" />
            <span>جاري التحميل...</span>
          </div>
        ) : clients.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">✅</div>
            <div className="empty-state-text">رائع! لا يوجد عملاء متأخرين</div>
            <div className="empty-state-sub">جميع المدفوعات محدثة</div>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>اسم العميل</th>
                  <th>الخدمة</th>
                  <th>المبلغ المتبقي</th>
                  <th>آخر تواصل</th>
                  <th>موعد المتابعة</th>
                  <th>أيام التأخير</th>
                  <th>الحالة</th>
                  <th>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((client, idx) => {
                  const days = getDaysLate(client.next_follow_up)
                  const rowBg = days > 30 ? '#fff5f5' : days > 7 ? '#fffbeb' : 'transparent'
                  return (
                    <tr key={client.id} style={{ background: rowBg }}>
                      <td style={{ color: '#94a3b8' }}>{idx + 1}</td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{client.name}</div>
                        {client.phone && <div style={{ fontSize: 11.5, color: '#94a3b8' }}>{client.phone}</div>}
                      </td>
                      <td>{client.company_name || getCompanyName(client.company_id)}</td>
                      <td style={{ fontWeight: 700, color: '#dc2626' }}>
                        {formatAmount(client.amount_remaining)} ر.ع
                      </td>
                      <td style={{ fontSize: 12.5 }}>{formatDate(client.last_contact)}</td>
                      <td style={{ fontSize: 12.5 }}>{formatDate(client.next_follow_up)}</td>
                      <td><LateBadge days={days} /></td>
                      <td>
                        <span className={`badge ${client.status === 'late' ? 'badge-danger' : 'badge-warning'}`}>
                          {client.status === 'late' ? 'متأخر' : 'بانتظار الدفع'}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="btn btn-success btn-sm"
                            onClick={() => { setPayModal(client); setPayAmount(''); setPayNote('') }}
                          >
                            💳 دفعة
                          </button>
                          <button
                            className="btn btn-outline btn-sm"
                            onClick={() => { setNoteModal(client); setNoteText('') }}
                          >
                            📝 ملاحظة
                          </button>
                          <button
                            className="btn btn-sm"
                            style={{ background: '#25D366', color: '#fff', border: 'none' }}
                            onClick={() => openWhatsApp(client)}
                          >
                            💬 واتساب
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payment Modal */}
      <Modal isOpen={!!payModal} onClose={() => setPayModal(null)} title="تسجيل دفعة" size="sm">
        {payModal && (
          <form onSubmit={handlePayment}>
            <div className="modal-body">
              <div className="alert alert-info" style={{ marginBottom: 16 }}>
                <div><strong>{payModal.name}</strong></div>
                <div style={{ fontSize: 12.5 }}>المتبقي: {formatAmount(payModal.amount_remaining)} ر.ع</div>
              </div>
              <div className="form-group">
                <label className="form-label">مبلغ الدفعة <span className="required">*</span></label>
                <input
                  className="form-control"
                  type="number"
                  value={payAmount}
                  onChange={e => setPayAmount(e.target.value)}
                  placeholder="0"
                  min="0.01"
                  max={payModal.amount_remaining}
                  step="0.01"
                  required
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label className="form-label">ملاحظة</label>
                <input
                  className="form-control"
                  value={payNote}
                  onChange={e => setPayNote(e.target.value)}
                  placeholder="ملاحظة اختيارية..."
                />
              </div>
            </div>
            <div className="modal-footer">
              <button type="submit" className="btn btn-success" disabled={saving}>
                {saving ? <><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> جاري...</> : '✅ تسجيل الدفعة'}
              </button>
              <button type="button" className="btn btn-outline" onClick={() => setPayModal(null)}>إلغاء</button>
            </div>
          </form>
        )}
      </Modal>

      {/* Note Modal */}
      <Modal isOpen={!!noteModal} onClose={() => setNoteModal(null)} title="إضافة ملاحظة" size="sm">
        {noteModal && (
          <form onSubmit={handleNote}>
            <div className="modal-body">
              <div style={{ marginBottom: 12, fontWeight: 600, color: '#374151' }}>{noteModal.name}</div>
              <div className="form-group">
                <label className="form-label">الملاحظة <span className="required">*</span></label>
                <textarea
                  className="form-control"
                  value={noteText}
                  onChange={e => setNoteText(e.target.value)}
                  placeholder="أدخل الملاحظة..."
                  rows={4}
                  required
                  autoFocus
                />
              </div>
            </div>
            <div className="modal-footer">
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'جاري الحفظ...' : '📝 إضافة الملاحظة'}
              </button>
              <button type="button" className="btn btn-outline" onClick={() => setNoteModal(null)}>إلغاء</button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}
