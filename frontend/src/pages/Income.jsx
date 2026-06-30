import React, { useState, useEffect } from 'react'
import api from '../api/axios'
import toast from 'react-hot-toast'
import Modal from '../components/Modal'

const PAYMENT_STATUS = {
  paid: { label: 'مدفوع', cls: 'badge-success' },
  partial: { label: 'جزئي', cls: 'badge-warning' },
  unpaid: { label: 'غير مدفوع', cls: 'badge-danger' },
}

const PAYMENT_METHODS = [
  { value: 'cash', label: 'نقدي' },
  { value: 'bank_transfer', label: 'تحويل بنكي' },
  { value: 'check', label: 'شيك' },
  { value: 'electronic', label: 'إلكتروني' },
]

const defaultForm = {
  client_id: '',
  company_id: '',
  service_type: '',
  total_amount: '',
  amount_paid: '',
  amount_remaining: '',
  payment_date: '',
  payment_method: 'cash',
  payment_status: 'unpaid',
  notes: '',
}

function formatAmount(v) {
  return Number(v || 0).toLocaleString('ar-OM')
}

function formatDate(d) {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('ar-SA')
}

export default function Income() {
  const [incomes, setIncomes] = useState([])
  const [companies, setCompanies] = useState([])
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [form, setForm] = useState(defaultForm)
  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [filters, setFilters] = useState({
    company_id: '',
    payment_status: '',
    date_from: '',
    date_to: '',
  })

  const fetchAll = async () => {
    setLoading(true)
    try {
      const params = {}
      if (filters.company_id) params.company_id = filters.company_id
      if (filters.payment_status) params.payment_status = filters.payment_status
      if (filters.date_from) params.date_from = filters.date_from
      if (filters.date_to) params.date_to = filters.date_to

      const [incRes, compRes, cliRes] = await Promise.all([
        api.get('/income', { params }),
        api.get('/companies'),
        api.get('/clients'),
      ])
      setIncomes(incRes.data?.income || incRes.data || [])
      setCompanies(compRes.data?.companies || compRes.data || [])
      setClients(cliRes.data?.clients || cliRes.data || [])
    } catch {
      toast.error('فشل في تحميل البيانات')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAll() }, [filters])

  const openAdd = () => {
    setEditItem(null)
    setForm(defaultForm)
    setModalOpen(true)
  }

  const openEdit = (item) => {
    setEditItem(item)
    setForm({
      client_id: item.client_id || '',
      company_id: item.company_id || '',
      service_type: item.service_type || '',
      total_amount: item.total_amount || '',
      amount_paid: item.amount_paid || '',
      amount_remaining: item.amount_remaining || '',
      payment_date: item.payment_date?.slice(0, 10) || '',
      payment_method: item.payment_method || 'cash',
      payment_status: item.payment_status || 'unpaid',
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
      const remaining = Math.max(0, total - paid)
      updated.amount_remaining = remaining.toString()
      if (paid >= total && total > 0) updated.payment_status = 'paid'
      else if (paid > 0) updated.payment_status = 'partial'
      else updated.payment_status = 'unpaid'
    }

    setForm(updated)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.company_id || !form.total_amount) {
      toast.error('الخدمة والمبلغ الكلي مطلوبان')
      return
    }
    setSaving(true)
    try {
      const payload = { ...form }
      if (editItem) {
        await api.put(`/income/${editItem.id}`, payload)
        toast.success('تم تحديث الدخل بنجاح')
      } else {
        await api.post('/income', payload)
        toast.success('تم إضافة الدخل بنجاح')
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
      await api.delete(`/income/${id}`)
      toast.success('تم الحذف بنجاح')
      setDeleteConfirm(null)
      fetchAll()
    } catch {
      toast.error('فشل الحذف')
    }
  }

  const handleExport = async () => {
    try {
      const params = {}
      if (filters.company_id) params.company_id = filters.company_id
      if (filters.payment_status) params.payment_status = filters.payment_status
      const res = await api.get('/income/export', { params, responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement('a')
      a.href = url
      a.download = 'income.xlsx'
      a.click()
      toast.success('تم تصدير الملف')
    } catch {
      toast.error('فشل التصدير')
    }
  }

  const getClientName = (id) => clients.find(c => c.id == id)?.name || '-'
  const getCompanyName = (id) => companies.find(c => c.id == id)?.name || '-'
  const getPmLabel = (v) => PAYMENT_METHODS.find(m => m.value === v)?.label || v || '-'

  const totalIncome = incomes.reduce((s, i) => s + (i.total_amount || 0), 0)
  const totalPaid = incomes.reduce((s, i) => s + (i.amount_paid || 0), 0)
  const totalRemaining = incomes.reduce((s, i) => s + (i.amount_remaining || 0), 0)

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-header-title">الدخل</div>
          <div className="page-header-subtitle">إدارة جميع إيرادات الخدمات</div>
        </div>
        <div className="flex gap-3">
          <button className="btn btn-outline" onClick={handleExport}>
            📊 تصدير Excel
          </button>
          <button className="btn btn-primary" onClick={openAdd}>
            ➕ إضافة دخل
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="flex gap-3" style={{ marginBottom: 16, flexWrap: 'wrap' }}>
        <div className="info-box info-box-green">💰 إجمالي الدخل: <strong>{formatAmount(totalIncome)} ر.ع</strong></div>
        <div className="info-box info-box-blue">✅ المدفوع: <strong>{formatAmount(totalPaid)} ر.ع</strong></div>
        <div className="info-box info-box-red">⏳ المتبقي: <strong>{formatAmount(totalRemaining)} ر.ع</strong></div>
      </div>

      {/* Filters */}
      <div className="filter-bar">
        <select
          className="form-control"
          value={filters.company_id}
          onChange={e => setFilters(p => ({ ...p, company_id: e.target.value }))}
        >
          <option value="">جميع الخدمات</option>
          {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select
          className="form-control"
          value={filters.payment_status}
          onChange={e => setFilters(p => ({ ...p, payment_status: e.target.value }))}
        >
          <option value="">جميع الحالات</option>
          <option value="paid">مدفوع</option>
          <option value="partial">جزئي</option>
          <option value="unpaid">غير مدفوع</option>
        </select>
        <input
          type="date"
          className="form-control"
          value={filters.date_from}
          onChange={e => setFilters(p => ({ ...p, date_from: e.target.value }))}
          placeholder="من تاريخ"
        />
        <input
          type="date"
          className="form-control"
          value={filters.date_to}
          onChange={e => setFilters(p => ({ ...p, date_to: e.target.value }))}
          placeholder="إلى تاريخ"
        />
        <button
          className="btn btn-outline btn-sm"
          onClick={() => setFilters({ company_id: '', payment_status: '', date_from: '', date_to: '' })}
        >
          إعادة تعيين
        </button>
      </div>

      <div className="card">
        {loading ? (
          <div className="loading-spinner">
            <div className="spinner" />
            <span>جاري التحميل...</span>
          </div>
        ) : incomes.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">💰</div>
            <div className="empty-state-text">لا توجد إيرادات</div>
            <div className="empty-state-sub">أضف أول إيراد الآن</div>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>العميل</th>
                  <th>الخدمة</th>
                  <th>نوع الخدمة</th>
                  <th>المبلغ الكلي</th>
                  <th>المدفوع</th>
                  <th>المتبقي</th>
                  <th>الحالة</th>
                  <th>التاريخ</th>
                  <th>طريقة الدفع</th>
                  <th>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {incomes.map((item, idx) => {
                  const st = PAYMENT_STATUS[item.payment_status] || { label: item.payment_status, cls: 'badge-secondary' }
                  return (
                    <tr key={item.id}>
                      <td style={{ color: '#94a3b8' }}>{idx + 1}</td>
                      <td style={{ fontWeight: 500 }}>{item.client_name || getClientName(item.client_id)}</td>
                      <td>{item.company_name || getCompanyName(item.company_id)}</td>
                      <td>{item.service_type || '-'}</td>
                      <td style={{ fontWeight: 600 }}>{formatAmount(item.total_amount)} ر.ع</td>
                      <td style={{ color: '#16a34a', fontWeight: 600 }}>{formatAmount(item.amount_paid)} ر.ع</td>
                      <td style={{ color: '#dc2626', fontWeight: 600 }}>{formatAmount(item.amount_remaining)} ر.ع</td>
                      <td><span className={`badge ${st.cls}`}>{st.label}</span></td>
                      <td style={{ fontSize: 12.5 }}>{formatDate(item.payment_date)}</td>
                      <td>{getPmLabel(item.payment_method)}</td>
                      <td>
                        <div className="action-buttons">
                          <button className="btn btn-outline btn-sm" onClick={() => openEdit(item)}>✏️</button>
                          <button className="btn btn-danger btn-sm" onClick={() => setDeleteConfirm(item)}>🗑️</button>
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

      {/* Modal */}
      <Modal isOpen={modalOpen} onClose={closeModal} title={editItem ? 'تعديل الدخل' : 'إضافة دخل جديد'} size="lg">
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">العميل</label>
                <select className="form-control" name="client_id" value={form.client_id} onChange={handleChange}>
                  <option value="">-- اختر العميل --</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">الخدمة <span className="required">*</span></label>
                <select className="form-control" name="company_id" value={form.company_id} onChange={handleChange} required>
                  <option value="">-- اختر الخدمة --</option>
                  {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">نوع الخدمة</label>
              <input className="form-control" name="service_type" value={form.service_type} onChange={handleChange} placeholder="مثال: تصميم موقع، استشارات..." />
            </div>

            <div className="form-row-3">
              <div className="form-group">
                <label className="form-label">المبلغ الكلي <span className="required">*</span></label>
                <input className="form-control" type="number" name="total_amount" value={form.total_amount} onChange={handleChange} placeholder="0" min="0" step="0.01" required />
              </div>
              <div className="form-group">
                <label className="form-label">المبلغ المدفوع</label>
                <input className="form-control" type="number" name="amount_paid" value={form.amount_paid} onChange={handleChange} placeholder="0" min="0" step="0.01" />
              </div>
              <div className="form-group">
                <label className="form-label">المبلغ المتبقي</label>
                <input className="form-control" type="number" name="amount_remaining" value={form.amount_remaining} readOnly style={{ background: '#f8fafc' }} placeholder="0" />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">تاريخ الدفع</label>
                <input className="form-control" type="date" name="payment_date" value={form.payment_date} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">طريقة الدفع</label>
                <select className="form-control" name="payment_method" value={form.payment_method} onChange={handleChange}>
                  {PAYMENT_METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">حالة الدفع</label>
                <select className="form-control" name="payment_status" value={form.payment_status} onChange={handleChange}>
                  <option value="paid">مدفوع</option>
                  <option value="partial">جزئي</option>
                  <option value="unpaid">غير مدفوع</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">إرفاق إيصال</label>
                <input className="form-control" type="file" accept="image/*,.pdf" onChange={e => {}} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">ملاحظات</label>
              <textarea className="form-control" name="notes" value={form.notes} onChange={handleChange} placeholder="ملاحظات إضافية..." rows={2} />
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
          <div className="alert alert-error">⚠️ هل تريد حذف هذا الدخل؟ لا يمكن التراجع.</div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-danger" onClick={() => handleDelete(deleteConfirm?.id)}>🗑️ حذف</button>
          <button className="btn btn-outline" onClick={() => setDeleteConfirm(null)}>إلغاء</button>
        </div>
      </Modal>
    </div>
  )
}
