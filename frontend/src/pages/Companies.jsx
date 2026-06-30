import React, { useState, useEffect } from 'react'
import api from '../api/axios'
import toast from 'react-hot-toast'
import Modal from '../components/Modal'

const STATUS_LABELS = {
  active: { label: 'نشطة', cls: 'badge-success' },
  inactive: { label: 'غير نشطة', cls: 'badge-secondary' },
  suspended: { label: 'موقوفة', cls: 'badge-danger' },
}

const defaultForm = {
  name: '',
  activity_type: '',
  status: 'active',
  notes: '',
}

const SERVICE_TYPES = [
  { value: 'valuation', label: 'تثمين' },
  { value: 'systems', label: 'أنظمة داخلية' },
  { value: 'collection', label: 'تحصيل' },
  { value: 'makeup', label: 'ميك أب' },
  { value: 'other', label: 'خدمات أخرى' },
]

function formatAmount(v) {
  return Number(v || 0).toLocaleString('ar-OM')
}

export default function Companies() {
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [form, setForm] = useState(defaultForm)
  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  const fetchCompanies = async () => {
    setLoading(true)
    try {
      const res = await api.get('/companies')
      setCompanies(res.data?.companies || res.data || [])
    } catch {
      toast.error('فشل في تحميل الخدمات')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchCompanies() }, [])

  const openAdd = () => {
    setEditItem(null)
    setForm(defaultForm)
    setModalOpen(true)
  }

  const openEdit = (item) => {
    setEditItem(item)
    setForm({
      name: item.name || '',
      activity_type: item.activity_type || item.business_type || '',
      status: item.status || 'active',
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
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) {
      toast.error('اسم الخدمة مطلوب')
      return
    }
    if (!form.activity_type.trim()) {
      toast.error('نوع الخدمة مطلوب')
      return
    }
    setSaving(true)
    try {
      if (editItem) {
        await api.put(`/companies/${editItem.id}`, form)
        toast.success('تم تحديث الخدمة بنجاح')
      } else {
        await api.post('/companies', form)
        toast.success('تم إضافة الخدمة بنجاح')
      }
      closeModal()
      fetchCompanies()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'حدث خطأ')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    try {
      await api.delete(`/companies/${id}`)
      toast.success('تم حذف الخدمة')
      setDeleteConfirm(null)
      fetchCompanies()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'فشل الحذف')
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-header-title">الخدمات</div>
          <div className="page-header-subtitle">إدارة الخدمات الأساسية وإضافة خدمات جديدة مستقبلاً</div>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          ➕ إضافة خدمة
        </button>
      </div>

      <div className="card">
        {loading ? (
          <div className="loading-spinner">
            <div className="spinner" />
            <span>جاري التحميل...</span>
          </div>
        ) : companies.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🏢</div>
            <div className="empty-state-text">لا توجد خدمات</div>
            <div className="empty-state-sub">ابدأ بإضافة خدمة جديدة</div>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>اسم الخدمة</th>
                  <th>نوع الخدمة</th>
                  <th>الحالة</th>
                  <th>إجمالي الدخل</th>
                  <th>إجمالي المصروفات</th>
                  <th>صافي الربح</th>
                  <th>العملاء</th>
                  <th>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {companies.map((company, idx) => {
                  const netProfit = (company.total_income || 0) - (company.total_expenses || 0)
                  const st = STATUS_LABELS[company.status] || { label: company.status, cls: 'badge-secondary' }
                  return (
                    <tr key={company.id}>
                      <td style={{ color: '#94a3b8' }}>{idx + 1}</td>
                      <td>
                        <div style={{ fontWeight: 600, color: '#1e293b' }}>{company.name}</div>
                        {company.notes && (
                          <div style={{ fontSize: 11.5, color: '#94a3b8', marginTop: 2 }}>{company.notes}</div>
                        )}
                      </td>
                      <td>{SERVICE_TYPES.find(t => t.value === company.activity_type)?.label || company.activity_type || '-'}</td>
                      <td>
                        <span className={`badge ${st.cls}`}>{st.label}</span>
                      </td>
                      <td style={{ color: '#16a34a', fontWeight: 600 }}>
                        {formatAmount(company.total_income)} ر.ع
                      </td>
                      <td style={{ color: '#dc2626', fontWeight: 600 }}>
                        {formatAmount(company.total_expenses)} ر.ع
                      </td>
                      <td style={{ fontWeight: 600, color: netProfit >= 0 ? '#16a34a' : '#dc2626' }}>
                        {formatAmount(netProfit)} ر.ع
                      </td>
                      <td>
                        <span className="badge badge-info">{company.client_count || 0} عميل</span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="btn btn-outline btn-sm"
                            onClick={() => openEdit(company)}
                          >
                            ✏️ تعديل
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => setDeleteConfirm(company)}
                          >
                            🗑️ حذف
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

      {/* Add/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title={editItem ? 'تعديل الخدمة' : 'إضافة خدمة جديدة'}
      >
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">اسم الخدمة <span className="required">*</span></label>
              <input
                className="form-control"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="مثال: شركة تثمين، شركة تحصيل..."
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">نوع الخدمة <span className="required">*</span></label>
                <input
                  className="form-control"
                  name="activity_type"
                  value={form.activity_type}
                  onChange={handleChange}
                  list="service-types"
                  placeholder="اختر نوعاً أو اكتب نوع خدمة جديد"
                  required
                />
                <datalist id="service-types">
                  {SERVICE_TYPES.map(type => <option key={type.value} value={type.value}>{type.label}</option>)}
                </datalist>
              </div>
              <div className="form-group">
                <label className="form-label">الحالة</label>
                <select className="form-control" name="status" value={form.status} onChange={handleChange}>
                  <option value="active">نشطة</option>
                  <option value="inactive">غير نشطة</option>
                  <option value="suspended">موقوفة</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">ملاحظات</label>
              <textarea
                className="form-control"
                name="notes"
                value={form.notes}
                onChange={handleChange}
                placeholder="ملاحظات إضافية..."
                rows={3}
              />
            </div>
          </div>
          <div className="modal-footer">
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? <><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> جاري الحفظ...</> : (editItem ? '💾 حفظ التغييرات' : '➕ إضافة الخدمة')}
            </button>
            <button type="button" className="btn btn-outline" onClick={closeModal}>
              إلغاء
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="تأكيد الحذف"
        size="sm"
      >
        <div className="modal-body">
          <div className="alert alert-error">
            ⚠️ هل أنت متأكد من حذف خدمة <strong>{deleteConfirm?.name}</strong>؟ لا يمكن التراجع عن هذا الإجراء.
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-danger" onClick={() => handleDelete(deleteConfirm?.id)}>
            🗑️ نعم، احذف
          </button>
          <button className="btn btn-outline" onClick={() => setDeleteConfirm(null)}>
            إلغاء
          </button>
        </div>
      </Modal>
    </div>
  )
}
