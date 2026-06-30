import React, { useState, useEffect } from 'react'
import api from '../api/axios'
import toast from 'react-hot-toast'
import Modal from '../components/Modal'

const PAYMENT_METHODS = [
  { value: 'cash', label: 'نقدي' },
  { value: 'bank_transfer', label: 'تحويل بنكي' },
  { value: 'check', label: 'شيك' },
  { value: 'electronic', label: 'إلكتروني' },
]

const defaultForm = {
  company_id: '',
  expense_type: '',
  amount: '',
  expense_date: '',
  payment_method: 'cash',
  is_fixed: false,
  notes: '',
}

function formatAmount(v) {
  return Number(v || 0).toLocaleString('ar-OM')
}

function formatDate(d) {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('ar-SA')
}

export default function Expenses() {
  const [expenses, setExpenses] = useState([])
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [form, setForm] = useState(defaultForm)
  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [filters, setFilters] = useState({
    company_id: '',
    expense_type: '',
    date_from: '',
    date_to: '',
    is_fixed: '',
  })

  const fetchAll = async () => {
    setLoading(true)
    try {
      const params = {}
      Object.entries(filters).forEach(([k, v]) => { if (v !== '') params[k] = v })

      const [expRes, compRes] = await Promise.all([
        api.get('/expenses', { params }),
        api.get('/companies'),
      ])
      setExpenses(expRes.data?.expenses || expRes.data || [])
      setCompanies(compRes.data?.companies || compRes.data || [])
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
      company_id: item.company_id || '',
      expense_type: item.expense_type || '',
      amount: item.amount || '',
      expense_date: item.expense_date?.slice(0, 10) || '',
      payment_method: item.payment_method || 'cash',
      is_fixed: item.is_fixed || false,
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
    const { name, value, type, checked } = e.target
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.company_id || !form.amount) {
      toast.error('الخدمة والمبلغ مطلوبان')
      return
    }
    setSaving(true)
    try {
      if (editItem) {
        await api.put(`/expenses/${editItem.id}`, form)
        toast.success('تم تحديث المصروف بنجاح')
      } else {
        await api.post('/expenses', form)
        toast.success('تم إضافة المصروف بنجاح')
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
      await api.delete(`/expenses/${id}`)
      toast.success('تم الحذف بنجاح')
      setDeleteConfirm(null)
      fetchAll()
    } catch {
      toast.error('فشل الحذف')
    }
  }

  const handleExport = async () => {
    try {
      const res = await api.get('/expenses/export', { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement('a')
      a.href = url
      a.download = 'expenses.xlsx'
      a.click()
      toast.success('تم تصدير الملف')
    } catch {
      toast.error('فشل التصدير')
    }
  }

  const getCompanyName = (id) => companies.find(c => c.id == id)?.name || '-'
  const getPmLabel = (v) => PAYMENT_METHODS.find(m => m.value === v)?.label || v || '-'

  const totalExpenses = expenses.reduce((s, e) => s + (e.amount || 0), 0)
  const fixedExpenses = expenses.filter(e => e.is_fixed).reduce((s, e) => s + (e.amount || 0), 0)
  const varExpenses = expenses.filter(e => !e.is_fixed).reduce((s, e) => s + (e.amount || 0), 0)

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-header-title">المصروفات</div>
          <div className="page-header-subtitle">تتبع وإدارة مصروفات الخدمات</div>
        </div>
        <div className="flex gap-3">
          <button className="btn btn-outline" onClick={handleExport}>📊 تصدير Excel</button>
          <button className="btn btn-primary" onClick={openAdd}>➕ إضافة مصروف</button>
        </div>
      </div>

      {/* Summary */}
      <div className="flex gap-3" style={{ marginBottom: 16, flexWrap: 'wrap' }}>
        <div className="info-box info-box-red">📉 إجمالي المصروفات: <strong>{formatAmount(totalExpenses)} ر.ع</strong></div>
        <div className="info-box info-box-blue">🔒 ثابتة: <strong>{formatAmount(fixedExpenses)} ر.ع</strong></div>
        <div className="info-box" style={{ background: '#fff7ed', color: '#c2410c', border: '1px solid #fed7aa' }}>
          🔄 متغيرة: <strong>{formatAmount(varExpenses)} ر.ع</strong>
        </div>
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
        <input
          className="form-control"
          placeholder="نوع المصروف"
          value={filters.expense_type}
          onChange={e => setFilters(p => ({ ...p, expense_type: e.target.value }))}
        />
        <select
          className="form-control"
          value={filters.is_fixed}
          onChange={e => setFilters(p => ({ ...p, is_fixed: e.target.value }))}
        >
          <option value="">جميع الأنواع</option>
          <option value="true">ثابت</option>
          <option value="false">متغير</option>
        </select>
        <input
          type="date"
          className="form-control"
          value={filters.date_from}
          onChange={e => setFilters(p => ({ ...p, date_from: e.target.value }))}
        />
        <input
          type="date"
          className="form-control"
          value={filters.date_to}
          onChange={e => setFilters(p => ({ ...p, date_to: e.target.value }))}
        />
        <button className="btn btn-outline btn-sm" onClick={() => setFilters({ company_id: '', expense_type: '', date_from: '', date_to: '', is_fixed: '' })}>
          إعادة تعيين
        </button>
      </div>

      <div className="card">
        {loading ? (
          <div className="loading-spinner">
            <div className="spinner" />
            <span>جاري التحميل...</span>
          </div>
        ) : expenses.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📉</div>
            <div className="empty-state-text">لا توجد مصروفات</div>
            <div className="empty-state-sub">أضف أول مصروف الآن</div>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>الخدمة</th>
                  <th>نوع المصروف</th>
                  <th>المبلغ</th>
                  <th>التاريخ</th>
                  <th>طريقة الدفع</th>
                  <th>النوع</th>
                  <th>ملاحظات</th>
                  <th>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((item, idx) => (
                  <tr key={item.id}>
                    <td style={{ color: '#94a3b8' }}>{idx + 1}</td>
                    <td style={{ fontWeight: 500 }}>{item.company_name || getCompanyName(item.company_id)}</td>
                    <td>{item.expense_type || '-'}</td>
                    <td style={{ fontWeight: 600, color: '#dc2626' }}>{formatAmount(item.amount)} ر.ع</td>
                    <td style={{ fontSize: 12.5 }}>{formatDate(item.expense_date)}</td>
                    <td>{getPmLabel(item.payment_method)}</td>
                    <td>
                      <span className={`badge ${item.is_fixed ? 'badge-info' : 'badge-warning'}`}>
                        {item.is_fixed ? '🔒 ثابت' : '🔄 متغير'}
                      </span>
                    </td>
                    <td style={{ fontSize: 12.5, color: '#64748b', maxWidth: 150 }}>
                      <div className="truncate">{item.notes || '-'}</div>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button className="btn btn-outline btn-sm" onClick={() => openEdit(item)}>✏️</button>
                        <button className="btn btn-danger btn-sm" onClick={() => setDeleteConfirm(item)}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      <Modal isOpen={modalOpen} onClose={closeModal} title={editItem ? 'تعديل المصروف' : 'إضافة مصروف جديد'}>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">الخدمة <span className="required">*</span></label>
                <select className="form-control" name="company_id" value={form.company_id} onChange={handleChange} required>
                  <option value="">-- اختر الخدمة --</option>
                  {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">نوع المصروف</label>
                <input className="form-control" name="expense_type" value={form.expense_type} onChange={handleChange} placeholder="مثال: إيجار، رواتب..." />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">المبلغ <span className="required">*</span></label>
                <input className="form-control" type="number" name="amount" value={form.amount} onChange={handleChange} placeholder="0" min="0" step="0.01" required />
              </div>
              <div className="form-group">
                <label className="form-label">التاريخ</label>
                <input className="form-control" type="date" name="expense_date" value={form.expense_date} onChange={handleChange} />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">طريقة الدفع</label>
                <select className="form-control" name="payment_method" value={form.payment_method} onChange={handleChange}>
                  {PAYMENT_METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">نوع المصروف</label>
                <div className="toggle-group" style={{ marginTop: 4 }}>
                  <button
                    type="button"
                    className={`toggle-btn${!form.is_fixed ? ' active' : ''}`}
                    onClick={() => setForm(p => ({ ...p, is_fixed: false }))}
                  >
                    🔄 متغير
                  </button>
                  <button
                    type="button"
                    className={`toggle-btn${form.is_fixed ? ' active' : ''}`}
                    onClick={() => setForm(p => ({ ...p, is_fixed: true }))}
                  >
                    🔒 ثابت
                  </button>
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">إرفاق فاتورة</label>
              <input className="form-control" type="file" accept="image/*,.pdf" />
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
          <div className="alert alert-error">⚠️ هل تريد حذف هذا المصروف؟ لا يمكن التراجع.</div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-danger" onClick={() => handleDelete(deleteConfirm?.id)}>🗑️ حذف</button>
          <button className="btn btn-outline" onClick={() => setDeleteConfirm(null)}>إلغاء</button>
        </div>
      </Modal>
    </div>
  )
}
