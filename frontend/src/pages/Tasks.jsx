import React, { useState, useEffect } from 'react'
import api from '../api/axios'
import toast from 'react-hot-toast'
import Modal from '../components/Modal'

const TASK_STATUS = {
  new: { label: 'جديدة', cls: 'badge-info' },
  in_progress: { label: 'قيد التنفيذ', cls: 'badge-warning' },
  completed: { label: 'مكتملة', cls: 'badge-success' },
  cancelled: { label: 'ملغاة', cls: 'badge-secondary' },
}

const TASK_PRIORITY = {
  high: { label: 'عالية', cls: 'badge-danger' },
  medium: { label: 'متوسطة', cls: 'badge-warning' },
  low: { label: 'منخفضة', cls: 'badge-success' },
}

const defaultForm = {
  title: '',
  description: '',
  company_id: '',
  client_id: '',
  assigned_to: '',
  due_date: '',
  priority: 'medium',
  status: 'new',
  notes: '',
}

function formatDate(d) {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('ar-SA')
}

function isDueClose(dateStr) {
  if (!dateStr) return false
  const due = new Date(dateStr)
  const today = new Date()
  const diff = (due - today) / (1000 * 60 * 60 * 24)
  return diff <= 2 && diff >= 0
}

function isOverdue(dateStr) {
  if (!dateStr) return false
  return new Date(dateStr) < new Date()
}

export default function Tasks() {
  const [tasks, setTasks] = useState([])
  const [companies, setCompanies] = useState([])
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [form, setForm] = useState(defaultForm)
  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [filters, setFilters] = useState({ status: '', priority: '', company_id: '' })

  const fetchAll = async () => {
    setLoading(true)
    try {
      const params = {}
      Object.entries(filters).forEach(([k, v]) => { if (v) params[k] = v })

      const [taskRes, compRes, cliRes] = await Promise.all([
        api.get('/tasks', { params }),
        api.get('/companies'),
        api.get('/clients'),
      ])
      setTasks(taskRes.data?.tasks || taskRes.data || [])
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
      title: item.title || '',
      description: item.description || '',
      company_id: item.company_id || '',
      client_id: item.client_id || '',
      assigned_to: item.assigned_to || '',
      due_date: item.due_date?.slice(0, 10) || '',
      priority: item.priority || 'medium',
      status: item.status || 'new',
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
    if (!form.title.trim()) {
      toast.error('عنوان المهمة مطلوب')
      return
    }
    setSaving(true)
    try {
      if (editItem) {
        await api.put(`/tasks/${editItem.id}`, form)
        toast.success('تم تحديث المهمة')
      } else {
        await api.post('/tasks', form)
        toast.success('تم إضافة المهمة')
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
      await api.delete(`/tasks/${id}`)
      toast.success('تم حذف المهمة')
      setDeleteConfirm(null)
      fetchAll()
    } catch {
      toast.error('فشل الحذف')
    }
  }

  const quickStatus = async (task, newStatus) => {
    try {
      await api.put(`/tasks/${task.id}`, { ...task, status: newStatus })
      toast.success('تم تحديث الحالة')
      fetchAll()
    } catch {
      toast.error('فشل التحديث')
    }
  }

  const getCompanyName = (id) => companies.find(c => c.id == id)?.name || '-'
  const getClientName = (id) => clients.find(c => c.id == id)?.name || '-'

  const counts = {
    new: tasks.filter(t => t.status === 'new').length,
    in_progress: tasks.filter(t => t.status === 'in_progress').length,
    completed: tasks.filter(t => t.status === 'completed').length,
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-header-title">المهام</div>
          <div className="page-header-subtitle">إدارة ومتابعة جميع المهام</div>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>➕ إضافة مهمة</button>
      </div>

      {/* Summary */}
      <div className="flex gap-3" style={{ marginBottom: 16, flexWrap: 'wrap' }}>
        <div className="info-box info-box-blue">📋 جديدة: <strong>{counts.new}</strong></div>
        <div className="info-box" style={{ background: '#fff7ed', color: '#c2410c', border: '1px solid #fed7aa' }}>
          🔄 قيد التنفيذ: <strong>{counts.in_progress}</strong>
        </div>
        <div className="info-box info-box-green">✅ مكتملة: <strong>{counts.completed}</strong></div>
      </div>

      {/* Filters */}
      <div className="filter-bar">
        <select className="form-control" value={filters.status} onChange={e => setFilters(p => ({ ...p, status: e.target.value }))}>
          <option value="">جميع الحالات</option>
          {Object.entries(TASK_STATUS).map(([v, { label }]) => <option key={v} value={v}>{label}</option>)}
        </select>
        <select className="form-control" value={filters.priority} onChange={e => setFilters(p => ({ ...p, priority: e.target.value }))}>
          <option value="">جميع الأولويات</option>
          {Object.entries(TASK_PRIORITY).map(([v, { label }]) => <option key={v} value={v}>{label}</option>)}
        </select>
        <select className="form-control" value={filters.company_id} onChange={e => setFilters(p => ({ ...p, company_id: e.target.value }))}>
          <option value="">جميع الخدمات</option>
          {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <button className="btn btn-outline btn-sm" onClick={() => setFilters({ status: '', priority: '', company_id: '' })}>
          إعادة تعيين
        </button>
      </div>

      <div className="card">
        {loading ? (
          <div className="loading-spinner">
            <div className="spinner" />
            <span>جاري التحميل...</span>
          </div>
        ) : tasks.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">✅</div>
            <div className="empty-state-text">لا توجد مهام</div>
            <div className="empty-state-sub">أضف أول مهمة الآن</div>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>العنوان</th>
                  <th>الخدمة</th>
                  <th>العميل</th>
                  <th>تاريخ التنفيذ</th>
                  <th>الأولوية</th>
                  <th>الحالة</th>
                  <th>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task, idx) => {
                  const st = TASK_STATUS[task.status] || { label: task.status, cls: 'badge-secondary' }
                  const pr = TASK_PRIORITY[task.priority] || { label: task.priority, cls: 'badge-secondary' }
                  const overdue = isOverdue(task.due_date) && task.status !== 'completed'
                  const dueClose = isDueClose(task.due_date)

                  return (
                    <tr key={task.id} style={{ background: overdue ? '#fff5f5' : dueClose ? '#fffbeb' : 'transparent' }}>
                      <td style={{ color: '#94a3b8' }}>{idx + 1}</td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{task.title}</div>
                        {task.description && (
                          <div style={{ fontSize: 11.5, color: '#94a3b8', marginTop: 2 }} className="truncate">
                            {task.description}
                          </div>
                        )}
                        {overdue && <span style={{ fontSize: 11, color: '#dc2626' }}>⚠️ متأخرة</span>}
                      </td>
                      <td>{task.company_name || getCompanyName(task.company_id)}</td>
                      <td>{task.client_name || getClientName(task.client_id)}</td>
                      <td style={{ fontSize: 12.5, color: overdue ? '#dc2626' : 'inherit' }}>
                        {formatDate(task.due_date)}
                      </td>
                      <td><span className={`badge ${pr.cls}`}>{pr.label}</span></td>
                      <td><span className={`badge ${st.cls}`}>{st.label}</span></td>
                      <td>
                        <div className="action-buttons">
                          {task.status === 'new' && (
                            <button className="btn btn-warning btn-sm" onClick={() => quickStatus(task, 'in_progress')}>▶️</button>
                          )}
                          {task.status === 'in_progress' && (
                            <button className="btn btn-success btn-sm" onClick={() => quickStatus(task, 'completed')}>✅</button>
                          )}
                          <button className="btn btn-outline btn-sm" onClick={() => openEdit(task)}>✏️</button>
                          <button className="btn btn-danger btn-sm" onClick={() => setDeleteConfirm(task)}>🗑️</button>
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
      <Modal isOpen={modalOpen} onClose={closeModal} title={editItem ? 'تعديل المهمة' : 'إضافة مهمة جديدة'}>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">عنوان المهمة <span className="required">*</span></label>
              <input className="form-control" name="title" value={form.title} onChange={handleChange} placeholder="عنوان المهمة" required />
            </div>

            <div className="form-group">
              <label className="form-label">الوصف</label>
              <textarea className="form-control" name="description" value={form.description} onChange={handleChange} placeholder="وصف تفصيلي للمهمة..." rows={2} />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">الخدمة</label>
                <select className="form-control" name="company_id" value={form.company_id} onChange={handleChange}>
                  <option value="">-- اختر الخدمة --</option>
                  {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">العميل</label>
                <select className="form-control" name="client_id" value={form.client_id} onChange={handleChange}>
                  <option value="">-- اختر العميل --</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">تاريخ التنفيذ</label>
                <input className="form-control" type="date" name="due_date" value={form.due_date} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">المسؤول</label>
                <input className="form-control" name="assigned_to" value={form.assigned_to} onChange={handleChange} placeholder="اسم المسؤول" />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">الأولوية</label>
                <select className="form-control" name="priority" value={form.priority} onChange={handleChange}>
                  <option value="high">عالية</option>
                  <option value="medium">متوسطة</option>
                  <option value="low">منخفضة</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">الحالة</label>
                <select className="form-control" name="status" value={form.status} onChange={handleChange}>
                  <option value="new">جديدة</option>
                  <option value="in_progress">قيد التنفيذ</option>
                  <option value="completed">مكتملة</option>
                  <option value="cancelled">ملغاة</option>
                </select>
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
          <div className="alert alert-error">⚠️ هل تريد حذف مهمة <strong>{deleteConfirm?.title}</strong>؟</div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-danger" onClick={() => handleDelete(deleteConfirm?.id)}>🗑️ حذف</button>
          <button className="btn btn-outline" onClick={() => setDeleteConfirm(null)}>إلغاء</button>
        </div>
      </Modal>
    </div>
  )
}
