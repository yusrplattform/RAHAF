import React, { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import {
  CalendarClock, CheckCircle2, CircleDollarSign, FilePlus2, MessageCircle,
  Paperclip, Plus, RefreshCcw, Search, Send, UserPlus, XCircle
} from 'lucide-react'
import api from '../api/axios'
import Modal from '../components/Modal'
import StatCard from '../components/StatCard'

const TRANSACTION_TYPES = {
  valuation: 'معاملة تثمين',
  systems: 'طلب نظام داخلي',
  collection: 'خدمة تحصيل',
  makeup: 'حجز ميك أب',
  other: 'خدمة أخرى',
}

const SERVICE_COMPANIES = {
  valuation: 'شركة تثمين',
  systems: 'شركة أنظمة داخلية',
  collection: 'شركة تحصيل',
  makeup: 'شركة ميك أب',
  other: 'شركة خدمات أخرى',
}

const CLIENT_TYPES = {
  individual: 'فرد',
  company: 'شركة',
  entity: 'جهة',
}

const CLIENT_STATUS = {
  new: 'جديد',
  following: 'قيد المتابعة',
  waiting_payment: 'بانتظار الدفع',
  paid: 'مدفوع',
  late: 'متأخر',
  completed: 'مكتمل',
}

const PRIORITIES = {
  low: 'منخفضة',
  medium: 'متوسطة',
  high: 'عالية',
  urgent: 'عاجلة',
}

const PAYMENT_STATUS = {
  unpaid: 'غير مدفوع',
  partial: 'مدفوع جزئياً',
  paid: 'مدفوع',
}

const DOCUMENT_STATUS = {
  required: 'مطلوب',
  received: 'مستلم',
  missing: 'ناقص',
  not_required: 'غير مطلوب',
}

const STATUS_OPTIONS = {
  valuation: [
    ['new_request', 'طلب جديد'],
    ['waiting_documents', 'بانتظار المستندات'],
    ['missing_documents', 'مستندات ناقصة'],
    ['documents_completed', 'المستندات مكتملة'],
    ['sent_to_valuation_company', 'تم إرسالها لشركة التثمين'],
    ['waiting_company_reply', 'بانتظار الرد من الشركة'],
    ['waiting_inspection', 'بانتظار المعاينة'],
    ['inspection_scheduled', 'تم تحديد موعد المعاينة'],
    ['inspected', 'تمت المعاينة'],
    ['report_preparation', 'قيد إعداد التقرير'],
    ['report_ready', 'التقرير جاهز'],
    ['delivered_to_client', 'تم تسليم التقرير للعميل'],
    ['paid', 'مدفوع'],
    ['closed', 'مغلق'],
    ['cancelled', 'ملغي'],
  ],
  systems: [
    ['lead', 'عميل محتمل'],
    ['contacted', 'تم التواصل'],
    ['waiting_meeting', 'بانتظار اجتماع'],
    ['meeting_done', 'تم عقد الاجتماع'],
    ['waiting_requirements', 'بانتظار المتطلبات'],
    ['requirements_received', 'تم استلام المتطلبات'],
    ['under_study', 'قيد دراسة الطلب'],
    ['offer_sent', 'تم إرسال العرض'],
    ['awaiting_client_approval', 'بانتظار موافقة العميل'],
    ['agreed', 'تم الاتفاق'],
    ['waiting_first_payment', 'بانتظار الدفعة الأولى'],
    ['in_progress', 'قيد التنفيذ'],
    ['review', 'مرحلة المراجعة'],
    ['delivered', 'تم التسليم'],
    ['support', 'دعم فني'],
    ['closed', 'مغلق'],
    ['rejected_or_cancelled', 'مرفوض أو ملغي'],
  ],
  collection: [
    ['new_request', 'طلب جديد'],
    ['waiting_debtor_data', 'بانتظار بيانات المديون'],
    ['waiting_documents', 'بانتظار المستندات'],
    ['file_received', 'تم استلام الملف'],
    ['under_review', 'قيد مراجعة الملف'],
    ['contact_started', 'تم بدء التواصل'],
    ['payment_promise', 'وعد بالسداد'],
    ['payments_scheduled', 'تم جدولة دفعات'],
    ['partial_collected', 'تم تحصيل جزئي'],
    ['fully_collected', 'تم تحصيل كامل'],
    ['defaulted', 'متعثر'],
    ['legal_action_needed', 'يحتاج إجراء قانوني'],
    ['closed', 'مغلق'],
  ],
  makeup: [
    ['new_inquiry', 'استفسار جديد'],
    ['responded', 'تم الرد'],
    ['waiting_appointment', 'بانتظار تحديد الموعد'],
    ['waiting_deposit', 'بانتظار العربون'],
    ['booking_confirmed', 'تم تأكيد الحجز'],
    ['before_appointment', 'قبل الموعد'],
    ['service_done', 'تم تنفيذ الخدمة'],
    ['waiting_review', 'بانتظار التقييم'],
    ['completed', 'مكتمل'],
    ['cancelled', 'ملغي'],
  ],
  other: [
    ['new', 'جديد'],
    ['in_progress', 'قيد التنفيذ'],
    ['waiting_client', 'بانتظار العميل'],
    ['completed', 'مكتمل'],
    ['closed', 'مغلق'],
    ['cancelled', 'ملغي'],
  ],
}

const EXTRA_FIELDS = {
  valuation: [
    ['property_type', 'نوع الأصل', 'select', ['بناء', 'أرض', 'عقار']],
    ['bank', 'البنك'],
    ['sent_to_company_date', 'تاريخ إرسال الطلب للشركة', 'date'],
  ],
  systems: [
    ['company_name', 'اسم الشركة'],
    ['system_type', 'نوع النظام المطلوب'],
    ['project_size', 'حجم المشروع'],
    ['expected_budget', 'الميزانية المتوقعة', 'number'],
    ['current_problem', 'المشكلة الحالية لدى العميل', 'textarea'],
    ['main_requirements', 'المتطلبات الأساسية', 'textarea'],
    ['meeting_date', 'موعد الاجتماع', 'datetime-local'],
    ['meeting_link', 'رابط الاجتماع'],
    ['offer_value', 'قيمة العرض', 'number'],
    ['expected_delivery_date', 'تاريخ التسليم المتوقع', 'date'],
  ],
  collection: [
    ['collector_client_name', 'اسم العميل طالب التحصيل'],
    ['debtor_name', 'اسم الطرف المطلوب منه السداد'],
    ['debtor_phone', 'رقم الطرف المطلوب منه السداد'],
    ['claim_amount', 'مبلغ المطالبة', 'number'],
    ['collected_amount', 'المبلغ المحصل', 'number'],
    ['remaining_claim_amount', 'المبلغ المتبقي', 'number'],
    ['commission_rate', 'نسبة العمولة', 'number'],
    ['last_follow_up_date', 'تاريخ آخر متابعة', 'date'],
    ['payment_promise_date', 'تاريخ وعد السداد', 'date'],
    ['next_installment_date', 'تاريخ القسط القادم', 'date'],
  ],
  makeup: [
    ['occasion_type', 'نوع المناسبة'],
    ['occasion_date', 'تاريخ المناسبة', 'date'],
    ['booking_time', 'وقت الحجز', 'time'],
    ['location', 'الموقع'],
    ['service_type', 'نوع الخدمة'],
    ['price', 'السعر', 'number'],
    ['deposit', 'العربون', 'number'],
    ['remaining', 'المتبقي', 'number'],
    ['travel_required', 'هل يوجد تنقل'],
    ['look_notes', 'ملاحظات عن اللوك المطلوب', 'textarea'],
    ['reference_images', 'صور مرجعية', 'textarea'],
  ],
  other: [
    ['service_name', 'اسم الخدمة'],
    ['details', 'التفاصيل', 'textarea'],
  ],
}

const DEFAULT_DOCUMENTS = {
  valuation: ['صك الملكية', 'هوية المالك', 'رخصة البناء', 'كروكي الموقع'],
  systems: ['السجل التجاري', 'المتطلبات الأولية', 'نماذج العمل الحالية'],
  collection: ['العقد أو الفاتورة', 'بيانات المديون', 'إثبات المطالبة'],
  makeup: ['صورة مرجعية', 'بيانات الموقع'],
  other: [],
}

const defaultClientForm = {
  name: '',
  client_type: 'individual',
  phone: '',
  email: '',
  source: '',
  company_id: '',
  status: 'new',
  last_contact: '',
  next_follow_up: '',
  notes: '',
}

const defaultTransactionForm = {
  transaction_type: 'valuation',
  client_id: '',
  company_id: '',
  status: '',
  priority: 'medium',
  assigned_to: SERVICE_COMPANIES.valuation,
  next_follow_up: '',
  service_value: '',
  amount_paid: '',
  notes: '',
  extra_data: {},
}

function formatAmount(value) {
  return Number(value || 0).toLocaleString('ar-OM')
}

function formatDate(value) {
  if (!value) return '-'
  return new Date(value).toLocaleDateString('ar-SA')
}

function statusLabel(type, status) {
  return STATUS_OPTIONS[type]?.find(([key]) => key === status)?.[1] || status || '-'
}

function badgeClass(value) {
  if (['paid', 'completed', 'closed', 'fully_collected', 'delivered_to_client'].includes(value)) return 'badge-success'
  if (['cancelled', 'rejected_or_cancelled', 'defaulted', 'legal_action_needed', 'missing_documents'].includes(value)) return 'badge-danger'
  if (['waiting_documents', 'waiting_first_payment', 'waiting_deposit', 'awaiting_client_approval', 'partial'].includes(value)) return 'badge-warning'
  return 'badge-info'
}

function buildWhatsAppMessage(transaction, template) {
  const name = transaction.client_name || 'عميلنا'
  const number = transaction.transaction_number
  const type = TRANSACTION_TYPES[transaction.transaction_type]
  const templates = {
    missing_docs: `السلام عليكم ${name}، نحتاج استكمال المستندات الناقصة للمعاملة ${number} (${type}) حتى نكمل الإجراء.`,
    payment: `السلام عليكم ${name}، نذكركم بوجود مبلغ متبقي قدره ${formatAmount(transaction.amount_remaining)} ر.ع للمعاملة ${number}.`,
    meeting: `السلام عليكم ${name}، نذكركم بموعد المتابعة/الاجتماع الخاص بالمعاملة ${number} بتاريخ ${formatDate(transaction.next_follow_up)}.`,
    offer: `السلام عليكم ${name}، نتابع معكم بخصوص عرض السعر المرسل للمعاملة ${number}. يسعدنا معرفة ملاحظاتكم أو اعتمادكم.`,
    deposit: `السلام عليكم ${name}، نذكركم بسداد العربون لتأكيد الحجز الخاص بالمعاملة ${number}.`,
    done: `السلام عليكم ${name}، نفيدكم بانتهاء الخدمة الخاصة بالمعاملة ${number}. شكراً لثقتكم.`,
  }
  return templates[template]
}

function emptyDaily() {
  return {
    follow_up_today: [],
    missing_documents: [],
    late_payments: [],
    awaiting_offers: [],
    waiting_deposit: [],
    upcoming_appointments: [],
  }
}

export default function CRM() {
  const [activeTab, setActiveTab] = useState('daily')
  const [clients, setClients] = useState([])
  const [companies, setCompanies] = useState([])
  const [transactions, setTransactions] = useState([])
  const [daily, setDaily] = useState(emptyDaily())
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState({ transaction_type: '', status: '', client_id: '' })
  const [clientModal, setClientModal] = useState(false)
  const [clientForm, setClientForm] = useState(defaultClientForm)
  const [transactionModal, setTransactionModal] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState(null)
  const [transactionForm, setTransactionForm] = useState(defaultTransactionForm)
  const [transactionClientMode, setTransactionClientMode] = useState('existing')
  const [newTransactionClientForm, setNewTransactionClientForm] = useState(defaultClientForm)
  const [selected, setSelected] = useState(null)
  const [detailTab, setDetailTab] = useState('summary')
  const [actionModal, setActionModal] = useState(null)
  const [actionForm, setActionForm] = useState({})
  const [uploadFile, setUploadFile] = useState(null)
  const [saving, setSaving] = useState(false)

  const fetchAll = async () => {
    setLoading(true)
    try {
      const params = {}
      if (search) params.search = search
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params[key] = value
      })
      const [clientsRes, companiesRes, trxRes, dailyRes] = await Promise.all([
        api.get('/clients', { params: search ? { search } : {} }),
        api.get('/companies'),
        api.get('/crm/transactions', { params }),
        api.get('/crm/daily-follow-up'),
      ])
      setClients(clientsRes.data || [])
      setCompanies(companiesRes.data?.companies || companiesRes.data || [])
      setTransactions(trxRes.data || [])
      setDaily(dailyRes.data || emptyDaily())
    } catch (err) {
      toast.error('فشل تحميل بيانات المتابعة')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(fetchAll, 250)
    return () => clearTimeout(timer)
  }, [search, filters])

  const stats = useMemo(() => {
    const missingDocs = transactions.filter(t => t.missing_documents_count > 0).length
    const latePayments = transactions.filter(t => (t.amount_remaining || 0) > 0 && t.payment_status !== 'paid').length
    return {
      clients: clients.length,
      transactions: transactions.length,
      followUp: daily.follow_up_today?.length || 0,
      missingDocs,
      latePayments,
      upcoming: daily.upcoming_appointments?.length || 0,
    }
  }, [clients, transactions, daily])

  const refreshSelected = async (id = selected?.id) => {
    if (!id) return
    const res = await api.get(`/crm/transactions/${id}`)
    setSelected(res.data)
    setTransactions(prev => prev.map(item => item.id === id ? res.data : item))
  }

  const openClientModal = () => {
    setClientForm(defaultClientForm)
    setClientModal(true)
  }

  const submitClient = async (e) => {
    e.preventDefault()
    if (!clientForm.name.trim()) {
      toast.error('اسم العميل مطلوب')
      return
    }
    setSaving(true)
    try {
      await api.post('/clients', {
        ...clientForm,
        company_id: clientForm.company_id || null,
      })
      toast.success('تم إضافة العميل')
      setClientModal(false)
      fetchAll()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'فشل حفظ العميل')
    } finally {
      setSaving(false)
    }
  }

  const openTransactionModal = (transaction = null, clientId = '') => {
    setEditingTransaction(transaction)
    setTransactionClientMode(transaction || clientId ? 'existing' : 'new')
    setNewTransactionClientForm(defaultClientForm)
    setTransactionForm(transaction ? {
      transaction_type: transaction.transaction_type,
      client_id: transaction.client_id || '',
      company_id: transaction.company_id || '',
      status: transaction.status || '',
      priority: transaction.priority || 'medium',
      assigned_to: transaction.assigned_to || '',
      next_follow_up: transaction.next_follow_up?.slice(0, 10) || '',
      service_value: transaction.service_value || '',
      amount_paid: transaction.amount_paid || '',
      notes: transaction.notes || '',
      extra_data: transaction.extra_data || {},
    } : { ...defaultTransactionForm, client_id: clientId, assigned_to: SERVICE_COMPANIES.valuation })
    setTransactionModal(true)
  }

  const setTransactionField = (name, value) => {
    if (name === 'transaction_type') {
      setTransactionForm(prev => ({
        ...prev,
        transaction_type: value,
        status: '',
        assigned_to: SERVICE_COMPANIES[value] || SERVICE_COMPANIES.other,
        extra_data: {},
      }))
      return
    }
    setTransactionForm(prev => ({ ...prev, [name]: value }))
  }

  const getServiceCompanyId = async (transactionType) => {
    const name = SERVICE_COMPANIES[transactionType] || SERVICE_COMPANIES.other
    const existing = companies.find(company => company.name?.trim() === name)
    if (existing) return existing.id

    const res = await api.post('/companies', {
      name,
      activity_type: name,
      status: 'active',
      notes: 'تم إنشاؤها تلقائياً حسب نوع المعاملة',
    })
    setCompanies(prev => [...prev, res.data])
    return res.data.id
  }

  const setExtraField = (name, value) => {
    setTransactionForm(prev => ({
      ...prev,
      extra_data: { ...prev.extra_data, [name]: value },
    }))
  }

  const submitTransaction = async (e) => {
    e.preventDefault()
    if (transactionClientMode === 'existing' && !transactionForm.client_id) {
      toast.error('اختر العميل المرتبط')
      return
    }
    if (!editingTransaction && transactionClientMode === 'new' && !newTransactionClientForm.name.trim()) {
      toast.error('اسم العميل الجديد مطلوب')
      return
    }
    setSaving(true)
    try {
      const serviceCompanyId = await getServiceCompanyId(transactionForm.transaction_type)
      let clientId = transactionForm.client_id
      if (!editingTransaction && transactionClientMode === 'new') {
        const clientRes = await api.post('/clients', {
          ...newTransactionClientForm,
          company_id: serviceCompanyId,
          next_follow_up: newTransactionClientForm.next_follow_up || transactionForm.next_follow_up || null,
        })
        clientId = clientRes.data.id
      }
      const payload = {
        ...transactionForm,
        client_id: Number(clientId),
        company_id: serviceCompanyId,
        assigned_to: transactionForm.assigned_to || SERVICE_COMPANIES[transactionForm.transaction_type] || SERVICE_COMPANIES.other,
        service_value: Number(transactionForm.service_value || 0),
        amount_paid: Number(transactionForm.amount_paid || 0),
      }
      if (!editingTransaction) {
        payload.documents = (DEFAULT_DOCUMENTS[payload.transaction_type] || []).map(name => ({ name, status: 'required' }))
        await api.post('/crm/transactions', payload)
        toast.success('تم فتح المعاملة')
      } else {
        await api.put(`/crm/transactions/${editingTransaction.id}`, payload)
        toast.success('تم تحديث المعاملة')
      }
      setTransactionModal(false)
      setEditingTransaction(null)
      fetchAll()
      if (selected?.id === editingTransaction?.id) refreshSelected(editingTransaction.id)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'فشل حفظ المعاملة')
    } finally {
      setSaving(false)
    }
  }

  const openAction = (type, defaults = {}) => {
    setUploadFile(null)
    setActionForm(defaults)
    setActionModal(type)
  }

  const submitAction = async (e) => {
    e.preventDefault()
    if (!selected) return
    setSaving(true)
    try {
      if (actionModal === 'followup') {
        await api.post(`/crm/transactions/${selected.id}/timeline`, {
          action_type: 'follow_up',
          employee: actionForm.employee || '',
          note: actionForm.note || '',
          old_status: selected.status,
          new_status: actionForm.new_status || null,
        })
        if (actionForm.next_follow_up) {
          await api.put(`/crm/transactions/${selected.id}`, { next_follow_up: actionForm.next_follow_up })
        }
      }
      if (actionModal === 'status') {
        await api.put(`/crm/transactions/${selected.id}`, { status: actionForm.status })
      }
      if (actionModal === 'document') {
        await api.post(`/crm/transactions/${selected.id}/documents`, {
          name: actionForm.name,
          status: actionForm.status || 'required',
          notes: actionForm.notes || '',
        })
      }
      if (actionModal === 'payment') {
        await api.post(`/crm/transactions/${selected.id}/payments`, {
          amount: Number(actionForm.amount || 0),
          payment_date: actionForm.payment_date || null,
          method: actionForm.method || '',
          notes: actionForm.notes || '',
        })
      }
      if (actionModal === 'task') {
        await api.post(`/crm/transactions/${selected.id}/tasks`, {
          title: actionForm.title,
          due_date: actionForm.due_date || null,
          priority: actionForm.priority || 'medium',
          notes: actionForm.notes || '',
        })
      }
      if (actionModal === 'attachment') {
        if (!uploadFile) {
          toast.error('اختر ملفاً للرفع')
          setSaving(false)
          return
        }
        const data = new FormData()
        data.append('file', uploadFile)
        data.append('description', actionForm.description || '')
        await api.post(`/crm/transactions/${selected.id}/attachments`, data, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      }
      if (actionModal === 'schedule') {
        await api.put(`/crm/transactions/${selected.id}`, { next_follow_up: actionForm.next_follow_up })
        await api.post(`/crm/transactions/${selected.id}/timeline`, {
          action_type: 'schedule_follow_up',
          note: actionForm.note || 'تم تحديد موعد متابعة',
        })
      }
      toast.success('تم تنفيذ الإجراء')
      setActionModal(null)
      await refreshSelected()
      fetchAll()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'فشل تنفيذ الإجراء')
    } finally {
      setSaving(false)
    }
  }

  const quickStatus = async (status) => {
    if (!selected) return
    await api.put(`/crm/transactions/${selected.id}`, { status })
    toast.success('تم تحديث الحالة')
    await refreshSelected()
    fetchAll()
  }

  const uploadDocument = async (doc, file) => {
    if (!file) return
    const data = new FormData()
    data.append('file', file)
    await api.post(`/crm/documents/${doc.id}/upload`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    toast.success('تم رفع المستند')
    await refreshSelected()
    fetchAll()
  }

  const updateDocumentStatus = async (doc, status) => {
    await api.put(`/crm/documents/${doc.id}`, { status })
    toast.success('تم تحديث المستند')
    await refreshSelected()
    fetchAll()
  }

  const sendWhatsApp = (template = 'missing_docs') => {
    if (!selected?.client_phone) {
      toast.error('لا يوجد رقم هاتف للعميل')
      return
    }
    const clean = selected.client_phone.replace(/\D/g, '')
    const msg = encodeURIComponent(buildWhatsAppMessage(selected, template))
    window.open(`https://wa.me/${clean}?text=${msg}`, '_blank')
  }

  const closeStatus = STATUS_OPTIONS[selected?.transaction_type]?.find(([key]) => ['closed', 'completed'].includes(key))?.[0] || 'closed'
  const cancelStatus = STATUS_OPTIONS[selected?.transaction_type]?.find(([key]) => ['cancelled', 'rejected_or_cancelled'].includes(key))?.[0] || 'cancelled'

  const renderTransactionMini = (item) => (
    <div key={item.id} className="crm-mini-row" onClick={() => { setSelected(item); setDetailTab('summary') }}>
      <div>
        <div className="font-semibold">{item.transaction_number} - {item.client_name}</div>
        <div className="text-sm text-muted">{TRANSACTION_TYPES[item.transaction_type]} · متابعة: {formatDate(item.next_follow_up)}</div>
      </div>
      <span className={`badge ${badgeClass(item.status)}`}>{statusLabel(item.transaction_type, item.status)}</span>
    </div>
  )

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-header-title">متابعة العملاء والمعاملات</div>
          <div className="page-header-subtitle">ملفات العملاء، المعاملات، المستندات، الدفعات، والمهام في مكان واحد</div>
        </div>
        <div className="action-buttons">
          <button className="btn btn-outline" onClick={fetchAll}><RefreshCcw size={16} /> تحديث</button>
          <button className="btn btn-outline-primary" onClick={openClientModal}><UserPlus size={16} /> عميل جديد</button>
          <button className="btn btn-primary" onClick={() => openTransactionModal()}><Plus size={16} /> معاملة جديدة</button>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard title="العملاء" value={stats.clients} subtitle="ملفات رئيسية" color="blue" icon="👥" />
        <StatCard title="المعاملات" value={stats.transactions} subtitle="طلبات مفتوحة ومحفوظة" color="purple" icon="📁" />
        <StatCard title="متابعة اليوم" value={stats.followUp} subtitle="تحتاج إجراء" color="yellow" icon="⏰" />
        <StatCard title="مستندات ناقصة" value={stats.missingDocs} subtitle="تنبيه مستندات" color="red" icon="📎" />
        <StatCard title="دفعات متأخرة" value={stats.latePayments} subtitle="مبالغ متبقية" color="red" icon="💳" />
        <StatCard title="مواعيد قادمة" value={stats.upcoming} subtitle="خلال 7 أيام" color="green" icon="📅" />
      </div>

      <div className="filter-bar">
        <div className="toggle-group">
          {[
            ['daily', 'اليومية'],
            ['transactions', 'المعاملات'],
            ['clients', 'العملاء'],
          ].map(([key, label]) => (
            <button key={key} className={`toggle-btn${activeTab === key ? ' active' : ''}`} onClick={() => setActiveTab(key)}>{label}</button>
          ))}
        </div>
        <div className="search-input-wrapper" style={{ flex: 1, minWidth: 220 }}>
          <Search className="search-icon" size={16} />
          <input className="form-control" value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث باسم العميل أو رقم المعاملة أو الهاتف..." />
        </div>
        <select className="form-control" value={filters.transaction_type} onChange={e => setFilters(p => ({ ...p, transaction_type: e.target.value, status: '' }))}>
          <option value="">كل الأنواع</option>
          {Object.entries(TRANSACTION_TYPES).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
        </select>
        <select className="form-control" value={filters.status} onChange={e => setFilters(p => ({ ...p, status: e.target.value }))}>
          <option value="">كل الحالات</option>
          {(filters.transaction_type ? STATUS_OPTIONS[filters.transaction_type] : Object.values(STATUS_OPTIONS).flat()).map(([key, label]) => (
            <option key={`${key}-${label}`} value={key}>{label}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="loading-spinner"><div className="spinner" /><span>جاري تحميل بيانات المتابعة...</span></div>
      ) : activeTab === 'daily' ? (
        <div className="crm-daily-grid">
          {[
            ['follow_up_today', 'متابعات اليوم', CalendarClock],
            ['missing_documents', 'عملاء لم يرسلوا المستندات', FilePlus2],
            ['late_payments', 'عملاء متأخرون في الدفع', CircleDollarSign],
            ['awaiting_offers', 'عروض تنتظر موافقة', Send],
            ['waiting_deposit', 'حجوزات تنتظر عربون', CheckCircle2],
            ['upcoming_appointments', 'اجتماعات ومعاينات قادمة', CalendarClock],
          ].map(([key, title, Icon]) => (
            <div className="card" key={key}>
              <div className="card-header">
                <span className="card-title"><Icon size={17} /> {title}</span>
                <span className="badge badge-secondary">{daily[key]?.length || 0}</span>
              </div>
              <div className="card-body crm-list-body">
                {daily[key]?.length ? daily[key].map(renderTransactionMini) : <div className="empty-lite">لا توجد عناصر</div>}
              </div>
            </div>
          ))}
        </div>
      ) : activeTab === 'clients' ? (
        <div className="card">
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>العميل</th>
                  <th>النوع</th>
                  <th>الهاتف</th>
                  <th>المصدر</th>
                  <th>الخدمة</th>
                  <th>الحالة</th>
                  <th>آخر تواصل</th>
                  <th>المتابعة القادمة</th>
                  <th>المعاملات</th>
                  <th>إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {clients.map(client => (
                  <tr key={client.id}>
                    <td>
                      <div className="font-semibold">{client.name}</div>
                      <div className="text-sm text-muted">{client.email || '-'}</div>
                    </td>
                    <td>{CLIENT_TYPES[client.client_type] || '-'}</td>
                    <td dir="ltr">{client.phone || '-'}</td>
                    <td>{client.source || '-'}</td>
                    <td>{client.company_name || '-'}</td>
                    <td><span className="badge badge-info">{CLIENT_STATUS[client.status] || client.status}</span></td>
                    <td>{formatDate(client.last_contact)}</td>
                    <td>{formatDate(client.next_follow_up)}</td>
                    <td><span className="badge badge-secondary">{client.transactions_count || 0}</span></td>
                    <td>
                      <div className="action-buttons">
                        <button className="btn btn-outline btn-sm" onClick={() => openTransactionModal(null, client.id)}>معاملة</button>
                        <button className="btn btn-outline btn-sm" onClick={() => { setFilters(p => ({ ...p, client_id: client.id })); setActiveTab('transactions') }}>عرض</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>رقم المعاملة</th>
                  <th>النوع</th>
                  <th>العميل</th>
                  <th>الحالة</th>
                  <th>الأولوية</th>
                  <th>الشركة المسؤولة</th>
                  <th>المتابعة</th>
                  <th>القيمة</th>
                  <th>المتبقي</th>
                  <th>المستندات</th>
                  <th>إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map(item => (
                  <tr key={item.id}>
                    <td className="font-semibold">{item.transaction_number}</td>
                    <td>{TRANSACTION_TYPES[item.transaction_type]}</td>
                    <td>{item.client_name}</td>
                    <td><span className={`badge ${badgeClass(item.status)}`}>{statusLabel(item.transaction_type, item.status)}</span></td>
                    <td>{PRIORITIES[item.priority] || item.priority}</td>
                    <td>{item.assigned_to || '-'}</td>
                    <td>{formatDate(item.next_follow_up)}</td>
                    <td>{formatAmount(item.service_value)} ر.ع</td>
                    <td className={item.amount_remaining > 0 ? 'text-danger font-semibold' : 'text-success font-semibold'}>{formatAmount(item.amount_remaining)} ر.ع</td>
                    <td>{item.missing_documents_count > 0 ? <span className="badge badge-danger">ناقص {item.missing_documents_count}</span> : <span className="badge badge-success">مكتملة</span>}</td>
                    <td>
                      <div className="action-buttons">
                        <button className="btn btn-outline btn-sm" onClick={() => { setSelected(item); setDetailTab('summary') }}>تفاصيل</button>
                        <button className="btn btn-outline btn-sm" onClick={() => openTransactionModal(item)}>تعديل</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal isOpen={clientModal} onClose={() => setClientModal(false)} title="إضافة عميل جديد" size="lg">
        <form onSubmit={submitClient}>
          <div className="modal-body">
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">اسم العميل <span className="required">*</span></label>
                <input className="form-control" value={clientForm.name} onChange={e => setClientForm(p => ({ ...p, name: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label className="form-label">نوع العميل</label>
                <select className="form-control" value={clientForm.client_type} onChange={e => setClientForm(p => ({ ...p, client_type: e.target.value }))}>
                  {Object.entries(CLIENT_TYPES).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">رقم الهاتف</label><input className="form-control" dir="ltr" value={clientForm.phone} onChange={e => setClientForm(p => ({ ...p, phone: e.target.value }))} /></div>
              <div className="form-group"><label className="form-label">البريد الإلكتروني</label><input className="form-control" dir="ltr" type="email" value={clientForm.email} onChange={e => setClientForm(p => ({ ...p, email: e.target.value }))} /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">مصدر العميل</label><input className="form-control" value={clientForm.source} onChange={e => setClientForm(p => ({ ...p, source: e.target.value }))} /></div>
              <div className="form-group">
                <label className="form-label">الخدمة المرتبطة</label>
                <select className="form-control" value={clientForm.company_id} onChange={e => setClientForm(p => ({ ...p, company_id: e.target.value }))}>
                  <option value="">بدون</option>
                  {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">آخر تواصل</label><input className="form-control" type="date" value={clientForm.last_contact} onChange={e => setClientForm(p => ({ ...p, last_contact: e.target.value }))} /></div>
              <div className="form-group"><label className="form-label">موعد المتابعة القادم</label><input className="form-control" type="date" value={clientForm.next_follow_up} onChange={e => setClientForm(p => ({ ...p, next_follow_up: e.target.value }))} /></div>
            </div>
            <div className="form-group"><label className="form-label">ملاحظات عامة</label><textarea className="form-control" value={clientForm.notes} onChange={e => setClientForm(p => ({ ...p, notes: e.target.value }))} /></div>
          </div>
          <div className="modal-footer">
            <button className="btn btn-primary" disabled={saving}>حفظ العميل</button>
            <button type="button" className="btn btn-outline" onClick={() => setClientModal(false)}>إلغاء</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={transactionModal} onClose={() => setTransactionModal(false)} title={editingTransaction ? 'تعديل معاملة' : 'فتح معاملة جديدة'} size="lg">
        <form onSubmit={submitTransaction}>
          <div className="modal-body">
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">نوع المعاملة</label>
                <select className="form-control" value={transactionForm.transaction_type} onChange={e => setTransactionField('transaction_type', e.target.value)}>
                  {Object.entries(TRANSACTION_TYPES).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                </select>
              </div>
              {!editingTransaction && (
                <div className="form-group">
                  <label className="form-label">طريقة إدخال العميل</label>
                  <div className="toggle-group">
                    <button type="button" className={`toggle-btn${transactionClientMode === 'new' ? ' active' : ''}`} onClick={() => setTransactionClientMode('new')}>عميل جديد</button>
                    <button type="button" className={`toggle-btn${transactionClientMode === 'existing' ? ' active' : ''}`} onClick={() => setTransactionClientMode('existing')}>عميل موجود</button>
                  </div>
                </div>
              )}
            </div>
            {editingTransaction || transactionClientMode === 'existing' ? (
              <div className="form-group">
                <label className="form-label">العميل المرتبط <span className="required">*</span></label>
                <select className="form-control" value={transactionForm.client_id} onChange={e => setTransactionField('client_id', e.target.value)} required>
                  <option value="">اختر العميل</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            ) : (
              <div className="crm-inline-panel">
                <div className="form-section-title">بيانات العميل الجديد</div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">اسم العميل <span className="required">*</span></label>
                    <input className="form-control" value={newTransactionClientForm.name} onChange={e => setNewTransactionClientForm(p => ({ ...p, name: e.target.value }))} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">نوع العميل</label>
                    <select className="form-control" value={newTransactionClientForm.client_type} onChange={e => setNewTransactionClientForm(p => ({ ...p, client_type: e.target.value }))}>
                      {Object.entries(CLIENT_TYPES).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">رقم الهاتف</label>
                    <input className="form-control" dir="ltr" value={newTransactionClientForm.phone} onChange={e => setNewTransactionClientForm(p => ({ ...p, phone: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">البريد الإلكتروني</label>
                    <input className="form-control" dir="ltr" type="email" value={newTransactionClientForm.email} onChange={e => setNewTransactionClientForm(p => ({ ...p, email: e.target.value }))} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">مصدر العميل</label>
                    <input className="form-control" value={newTransactionClientForm.source} onChange={e => setNewTransactionClientForm(p => ({ ...p, source: e.target.value }))} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">ملاحظات عامة عن العميل</label>
                  <textarea className="form-control" value={newTransactionClientForm.notes} onChange={e => setNewTransactionClientForm(p => ({ ...p, notes: e.target.value }))} />
                </div>
              </div>
            )}
            <div className="form-row-3">
              <div className="form-group"><label className="form-label">الحالة</label><select className="form-control" value={transactionForm.status} onChange={e => setTransactionField('status', e.target.value)}><option value="">تلقائي</option>{STATUS_OPTIONS[transactionForm.transaction_type].map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></div>
              <div className="form-group"><label className="form-label">الأولوية</label><select className="form-control" value={transactionForm.priority} onChange={e => setTransactionField('priority', e.target.value)}>{Object.entries(PRIORITIES).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></div>
              <div className="form-group"><label className="form-label">الشركة المسؤولة</label><input className="form-control" value={transactionForm.assigned_to} onChange={e => setTransactionField('assigned_to', e.target.value)} /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">شركة الخدمة تلقائياً</label><input className="form-control" value={SERVICE_COMPANIES[transactionForm.transaction_type] || SERVICE_COMPANIES.other} readOnly style={{ background: '#f8fafc' }} /></div>
              <div className="form-group"><label className="form-label">موعد المتابعة القادم</label><input className="form-control" type="date" value={transactionForm.next_follow_up} onChange={e => setTransactionField('next_follow_up', e.target.value)} /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">قيمة الخدمة</label><input className="form-control" type="number" value={transactionForm.service_value} onChange={e => setTransactionField('service_value', e.target.value)} /></div>
              <div className="form-group"><label className="form-label">المبلغ المدفوع</label><input className="form-control" type="number" value={transactionForm.amount_paid} onChange={e => setTransactionField('amount_paid', e.target.value)} /></div>
            </div>
            <div className="form-section-title">بيانات إضافية حسب نوع المعاملة</div>
            <div className="form-row">
              {EXTRA_FIELDS[transactionForm.transaction_type].map(([name, label, type = 'text', options = []]) => (
                <div className="form-group" key={name}>
                  <label className="form-label">{label}</label>
                  {type === 'select' ? (
                    <select className="form-control" value={transactionForm.extra_data?.[name] || ''} onChange={e => setExtraField(name, e.target.value)}>
                      <option value="">اختر</option>
                      {options.map(option => <option key={option} value={option}>{option}</option>)}
                    </select>
                  ) : type === 'textarea' ? (
                    <textarea className="form-control" value={transactionForm.extra_data?.[name] || ''} onChange={e => setExtraField(name, e.target.value)} />
                  ) : (
                    <input className="form-control" type={type} value={transactionForm.extra_data?.[name] || ''} onChange={e => setExtraField(name, e.target.value)} />
                  )}
                </div>
              ))}
            </div>
            <div className="form-group"><label className="form-label">ملاحظات</label><textarea className="form-control" value={transactionForm.notes} onChange={e => setTransactionField('notes', e.target.value)} /></div>
          </div>
          <div className="modal-footer">
            <button className="btn btn-primary" disabled={saving}>{editingTransaction ? 'حفظ التعديل' : 'فتح المعاملة'}</button>
            <button type="button" className="btn btn-outline" onClick={() => setTransactionModal(false)}>إلغاء</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!selected} onClose={() => setSelected(null)} title={selected ? `${selected.transaction_number} - ${selected.client_name}` : ''} size="xl">
        {selected && (
          <>
            <div className="crm-detail-toolbar">
              <button className="btn btn-outline btn-sm" onClick={() => openAction('followup')}><Plus size={15} /> إضافة متابعة</button>
              <button className="btn btn-outline btn-sm" onClick={() => openAction('status', { status: selected.status })}><RefreshCcw size={15} /> تغيير الحالة</button>
              <button className="btn btn-outline btn-sm" onClick={() => openAction('document')}><FilePlus2 size={15} /> طلب مستند</button>
              <button className="btn btn-outline btn-sm" onClick={() => openAction('payment')}><CircleDollarSign size={15} /> تسجيل دفعة</button>
              <button className="btn btn-outline btn-sm" onClick={() => openAction('task')}><CheckCircle2 size={15} /> إضافة مهمة</button>
              <button className="btn btn-outline btn-sm" onClick={() => openAction('attachment')}><Paperclip size={15} /> رفع مرفق</button>
              <button className="btn btn-outline btn-sm" onClick={() => sendWhatsApp()}><MessageCircle size={15} /> واتساب</button>
              <button className="btn btn-outline btn-sm" onClick={() => openAction('schedule', { next_follow_up: selected.next_follow_up || '' })}><CalendarClock size={15} /> موعد متابعة</button>
              <button className="btn btn-success btn-sm" onClick={() => quickStatus(closeStatus)}><CheckCircle2 size={15} /> إغلاق</button>
              <button className="btn btn-danger btn-sm" onClick={() => quickStatus(cancelStatus)}><XCircle size={15} /> إلغاء</button>
            </div>
            {selected.missing_documents_count > 0 && <div className="alert alert-warning crm-alert">تنبيه: توجد مستندات ناقصة أو مطلوبة في هذه المعاملة.</div>}
            <div className="modal-body">
              <div className="toggle-group mb-4">
                {[
                  ['summary', 'الملخص'],
                  ['timeline', 'Timeline'],
                  ['documents', 'المستندات'],
                  ['payments', 'الدفعات'],
                  ['tasks', 'المهام'],
                  ['attachments', 'المرفقات'],
                  ['whatsapp', 'واتساب'],
                ].map(([key, label]) => <button key={key} className={`toggle-btn${detailTab === key ? ' active' : ''}`} onClick={() => setDetailTab(key)}>{label}</button>)}
              </div>

              {detailTab === 'summary' && (
                <div className="crm-summary-grid">
                  {[
                    ['نوع المعاملة', TRANSACTION_TYPES[selected.transaction_type]],
                    ['الحالة الحالية', statusLabel(selected.transaction_type, selected.status)],
                    ['الأولوية', PRIORITIES[selected.priority]],
                    ['الشركة المسؤولة', selected.assigned_to || '-'],
                    ['تاريخ الإنشاء', formatDate(selected.created_at)],
                    ['آخر تحديث', formatDate(selected.updated_at)],
                    ['موعد المتابعة', formatDate(selected.next_follow_up)],
                    ['قيمة الخدمة', `${formatAmount(selected.service_value)} ر.ع`],
                    ['المبلغ المدفوع', `${formatAmount(selected.amount_paid)} ر.ع`],
                    ['المبلغ المتبقي', `${formatAmount(selected.amount_remaining)} ر.ع`],
                    ['حالة الدفع', PAYMENT_STATUS[selected.payment_status] || selected.payment_status],
                    ['شركة الخدمة', selected.company_name || SERVICE_COMPANIES[selected.transaction_type] || '-'],
                  ].map(([label, value]) => <div className="crm-info" key={label}><span>{label}</span><strong>{value}</strong></div>)}
                  <div className="crm-info crm-info-wide"><span>ملاحظات</span><strong>{selected.notes || '-'}</strong></div>
                  {Object.entries(selected.extra_data || {}).filter(([, value]) => value).map(([key, value]) => {
                    const label = EXTRA_FIELDS[selected.transaction_type]?.find(([name]) => name === key)?.[1] || key
                    return <div className="crm-info" key={key}><span>{label}</span><strong>{String(value)}</strong></div>
                  })}
                </div>
              )}

              {detailTab === 'timeline' && (
                <div className="crm-timeline">
                  {selected.timeline?.length ? selected.timeline.map(item => (
                    <div className="crm-timeline-item" key={item.id}>
                      <div className="crm-timeline-dot" />
                      <div>
                        <div className="font-semibold">{item.action_type} · {formatDate(item.action_date)}</div>
                        <div className="text-sm text-muted">{item.employee || '-'} {item.old_status || item.new_status ? `· ${statusLabel(selected.transaction_type, item.old_status)} ← ${statusLabel(selected.transaction_type, item.new_status)}` : ''}</div>
                        <div>{item.note || '-'}</div>
                        {item.attachment_path && <a className="text-primary text-sm" href={item.attachment_path} target="_blank" rel="noreferrer">عرض المرفق</a>}
                      </div>
                    </div>
                  )) : <div className="empty-lite">لا يوجد سجل زمني</div>}
                </div>
              )}

              {detailTab === 'documents' && (
                <div className="table-container">
                  <table className="table">
                    <thead><tr><th>المستند</th><th>الحالة</th><th>تاريخ الاستلام</th><th>ملاحظات</th><th>ملف</th></tr></thead>
                    <tbody>
                      {selected.documents?.map(doc => (
                        <tr key={doc.id}>
                          <td>{doc.name}</td>
                          <td><select className="form-control" value={doc.status} onChange={e => updateDocumentStatus(doc, e.target.value)}>{Object.entries(DOCUMENT_STATUS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></td>
                          <td>{formatDate(doc.received_date)}</td>
                          <td>{doc.notes || '-'}</td>
                          <td>{doc.file_path ? <a className="text-primary" href={doc.file_path} target="_blank" rel="noreferrer">عرض</a> : <input className="form-control" type="file" onChange={e => uploadDocument(doc, e.target.files?.[0])} />}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {detailTab === 'payments' && (
                <div className="table-container"><table className="table"><thead><tr><th>المبلغ</th><th>التاريخ</th><th>الطريقة</th><th>الموظف</th><th>ملاحظات</th></tr></thead><tbody>{selected.payments?.map(p => <tr key={p.id}><td>{formatAmount(p.amount)} ر.ع</td><td>{formatDate(p.payment_date)}</td><td>{p.method || '-'}</td><td>{p.created_by || '-'}</td><td>{p.notes || '-'}</td></tr>)}</tbody></table></div>
              )}

              {detailTab === 'tasks' && (
                <div className="table-container"><table className="table"><thead><tr><th>المهمة</th><th>التاريخ</th><th>الأولوية</th><th>الحالة</th><th>ملاحظات</th></tr></thead><tbody>{selected.tasks?.map(t => <tr key={t.id}><td>{t.title}</td><td>{formatDate(t.due_date)}</td><td>{PRIORITIES[t.priority]}</td><td>{t.status}</td><td>{t.notes || '-'}</td></tr>)}</tbody></table></div>
              )}

              {detailTab === 'attachments' && (
                <div className="crm-file-grid">{selected.attachments?.length ? selected.attachments.map(file => <a key={file.id} className="crm-file" href={file.file_path} target="_blank" rel="noreferrer"><Paperclip size={18} /><span>{file.name}</span><small>{file.description || formatDate(file.uploaded_at)}</small></a>) : <div className="empty-lite">لا توجد مرفقات</div>}</div>
              )}

              {detailTab === 'whatsapp' && (
                <div className="crm-template-grid">
                  {[
                    ['missing_docs', 'طلب مستندات ناقصة'],
                    ['payment', 'تذكير بالدفع'],
                    ['meeting', 'تذكير بموعد اجتماع'],
                    ['offer', 'متابعة عرض سعر'],
                    ['deposit', 'تذكير بالعربون'],
                    ['done', 'إشعار بانتهاء الخدمة'],
                  ].map(([key, label]) => <button key={key} className="btn btn-outline" onClick={() => sendWhatsApp(key)}><MessageCircle size={16} /> {label}</button>)}
                </div>
              )}
            </div>
          </>
        )}
      </Modal>

      <Modal isOpen={!!actionModal} onClose={() => setActionModal(null)} title="إجراء سريع" size="lg">
        <form onSubmit={submitAction}>
          <div className="modal-body">
            {actionModal === 'followup' && <>
              <div className="form-row"><div className="form-group"><label className="form-label">الموظف</label><input className="form-control" value={actionForm.employee || ''} onChange={e => setActionForm(p => ({ ...p, employee: e.target.value }))} /></div><div className="form-group"><label className="form-label">الحالة الجديدة</label><select className="form-control" value={actionForm.new_status || ''} onChange={e => setActionForm(p => ({ ...p, new_status: e.target.value }))}><option value="">بدون تغيير</option>{STATUS_OPTIONS[selected?.transaction_type || 'other'].map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></div></div>
              <div className="form-group"><label className="form-label">موعد المتابعة القادم</label><input className="form-control" type="date" value={actionForm.next_follow_up || ''} onChange={e => setActionForm(p => ({ ...p, next_follow_up: e.target.value }))} /></div>
              <div className="form-group"><label className="form-label">الملاحظة</label><textarea className="form-control" required value={actionForm.note || ''} onChange={e => setActionForm(p => ({ ...p, note: e.target.value }))} /></div>
            </>}
            {actionModal === 'status' && <div className="form-group"><label className="form-label">الحالة الجديدة</label><select className="form-control" value={actionForm.status || ''} onChange={e => setActionForm(p => ({ ...p, status: e.target.value }))} required>{STATUS_OPTIONS[selected?.transaction_type || 'other'].map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></div>}
            {actionModal === 'document' && <><div className="form-group"><label className="form-label">اسم المستند</label><input className="form-control" required value={actionForm.name || ''} onChange={e => setActionForm(p => ({ ...p, name: e.target.value }))} /></div><div className="form-group"><label className="form-label">ملاحظات</label><textarea className="form-control" value={actionForm.notes || ''} onChange={e => setActionForm(p => ({ ...p, notes: e.target.value }))} /></div></>}
            {actionModal === 'payment' && <><div className="form-row"><div className="form-group"><label className="form-label">المبلغ</label><input className="form-control" type="number" required value={actionForm.amount || ''} onChange={e => setActionForm(p => ({ ...p, amount: e.target.value }))} /></div><div className="form-group"><label className="form-label">تاريخ الدفع</label><input className="form-control" type="date" value={actionForm.payment_date || ''} onChange={e => setActionForm(p => ({ ...p, payment_date: e.target.value }))} /></div></div><div className="form-group"><label className="form-label">طريقة الدفع</label><input className="form-control" value={actionForm.method || ''} onChange={e => setActionForm(p => ({ ...p, method: e.target.value }))} /></div><div className="form-group"><label className="form-label">ملاحظات</label><textarea className="form-control" value={actionForm.notes || ''} onChange={e => setActionForm(p => ({ ...p, notes: e.target.value }))} /></div></>}
            {actionModal === 'task' && <><div className="form-group"><label className="form-label">عنوان المهمة</label><input className="form-control" required value={actionForm.title || ''} onChange={e => setActionForm(p => ({ ...p, title: e.target.value }))} /></div><div className="form-row"><div className="form-group"><label className="form-label">تاريخ الاستحقاق</label><input className="form-control" type="date" value={actionForm.due_date || ''} onChange={e => setActionForm(p => ({ ...p, due_date: e.target.value }))} /></div><div className="form-group"><label className="form-label">الأولوية</label><select className="form-control" value={actionForm.priority || 'medium'} onChange={e => setActionForm(p => ({ ...p, priority: e.target.value }))}>{Object.entries(PRIORITIES).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></div></div><div className="form-group"><label className="form-label">ملاحظات</label><textarea className="form-control" value={actionForm.notes || ''} onChange={e => setActionForm(p => ({ ...p, notes: e.target.value }))} /></div></>}
            {actionModal === 'attachment' && <><div className="form-group"><label className="form-label">الملف</label><input className="form-control" type="file" required onChange={e => setUploadFile(e.target.files?.[0] || null)} /></div><div className="form-group"><label className="form-label">وصف</label><input className="form-control" value={actionForm.description || ''} onChange={e => setActionForm(p => ({ ...p, description: e.target.value }))} /></div></>}
            {actionModal === 'schedule' && <><div className="form-group"><label className="form-label">موعد المتابعة</label><input className="form-control" type="date" required value={actionForm.next_follow_up || ''} onChange={e => setActionForm(p => ({ ...p, next_follow_up: e.target.value }))} /></div><div className="form-group"><label className="form-label">ملاحظة</label><textarea className="form-control" value={actionForm.note || ''} onChange={e => setActionForm(p => ({ ...p, note: e.target.value }))} /></div></>}
          </div>
          <div className="modal-footer">
            <button className="btn btn-primary" disabled={saving}>تنفيذ</button>
            <button type="button" className="btn btn-outline" onClick={() => setActionModal(null)}>إلغاء</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
