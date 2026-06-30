from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, select
from typing import Optional
from datetime import date, datetime, timedelta
import os
import shutil
import uuid

from ..database import get_db
from ..config import settings
from ..models.client import Client
from ..models.company import Company
from ..models.crm import (
    Transaction,
    TransactionTimeline,
    TransactionDocument,
    TransactionPayment,
    TransactionTask,
    TransactionAttachment,
)
from ..schemas.crm import (
    TransactionCreate,
    TransactionUpdate,
    TransactionResponse,
    TimelineCreate,
    DocumentCreate,
    DocumentUpdate,
    PaymentCreate,
    TransactionTaskCreate,
    TransactionTaskUpdate,
)
from ..auth.jwt_handler import get_current_user

router = APIRouter(prefix="/crm", tags=["crm"])

DEFAULT_STATUSES = {
    "valuation": "new_request",
    "systems": "lead",
    "collection": "new_request",
    "makeup": "new_inquiry",
    "other": "new",
}


def transaction_prefix(transaction_type: str) -> str:
    return {
        "valuation": "VAL",
        "systems": "SYS",
        "collection": "COL",
        "makeup": "MKP",
        "other": "OTH",
    }.get(transaction_type, "TRX")


def generate_transaction_number(db: Session, transaction_type: str) -> str:
    prefix = transaction_prefix(transaction_type)
    year = datetime.now().year
    count = db.query(Transaction).filter(
        Transaction.transaction_number.like(f"{prefix}-{year}-%")
    ).count() + 1
    return f"{prefix}-{year}-{count:04d}"


def calculate_payment_status(service_value: float, amount_paid: float) -> str:
    if amount_paid <= 0:
        return "unpaid"
    if amount_paid >= service_value and service_value > 0:
        return "paid"
    return "partial"


def sync_amounts(transaction: Transaction) -> None:
    transaction.service_value = transaction.service_value or 0
    transaction.amount_paid = transaction.amount_paid or 0
    transaction.amount_remaining = max(0, transaction.service_value - transaction.amount_paid)
    transaction.payment_status = calculate_payment_status(transaction.service_value, transaction.amount_paid)


def enrich_transaction(transaction: Transaction) -> dict:
    d = {k: v for k, v in transaction.__dict__.items() if not k.startswith("_")}
    d["client_name"] = transaction.client.name if transaction.client else None
    d["client_phone"] = transaction.client.phone if transaction.client else None
    d["company_name"] = transaction.company.name if transaction.company else None
    d["missing_documents_count"] = len([
        doc for doc in transaction.documents
        if doc.status in ("required", "missing")
    ])
    d["timeline"] = sorted(transaction.timeline, key=lambda item: item.action_date or datetime.min, reverse=True)
    d["documents"] = transaction.documents
    d["payments"] = sorted(transaction.payments, key=lambda item: item.created_at or datetime.min, reverse=True)
    d["tasks"] = sorted(transaction.tasks, key=lambda item: item.created_at or datetime.min, reverse=True)
    d["attachments"] = sorted(transaction.attachments, key=lambda item: item.uploaded_at or datetime.min, reverse=True)
    return d


def full_transaction_query(db: Session):
    return db.query(Transaction).options(
        joinedload(Transaction.client),
        joinedload(Transaction.company),
        joinedload(Transaction.timeline),
        joinedload(Transaction.documents),
        joinedload(Transaction.payments),
        joinedload(Transaction.tasks),
        joinedload(Transaction.attachments),
    )


def get_transaction_or_404(db: Session, transaction_id: int) -> Transaction:
    transaction = full_transaction_query(db).filter(Transaction.id == transaction_id).first()
    if not transaction:
        raise HTTPException(status_code=404, detail="المعاملة غير موجودة")
    return transaction


def add_timeline(
    db: Session,
    transaction_id: int,
    action_type: str,
    employee: Optional[str] = None,
    note: Optional[str] = None,
    old_status: Optional[str] = None,
    new_status: Optional[str] = None,
    attachment_path: Optional[str] = None,
) -> None:
    db.add(TransactionTimeline(
        transaction_id=transaction_id,
        action_type=action_type,
        employee=employee,
        note=note,
        old_status=old_status,
        new_status=new_status,
        attachment_path=attachment_path,
    ))


@router.get("/transactions", response_model=list[TransactionResponse])
def get_transactions(
    client_id: Optional[int] = None,
    company_id: Optional[int] = None,
    transaction_type: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    follow_up_today: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    query = full_transaction_query(db)
    if client_id:
        query = query.filter(Transaction.client_id == client_id)
    if company_id:
        query = query.filter(Transaction.company_id == company_id)
    if transaction_type:
        query = query.filter(Transaction.transaction_type == transaction_type)
    if status:
        query = query.filter(Transaction.status == status)
    if follow_up_today:
        query = query.filter(Transaction.next_follow_up <= date.today())
    if search:
        query = query.join(Client).filter(or_(
            Transaction.transaction_number.ilike(f"%{search}%"),
            Client.name.ilike(f"%{search}%"),
            Client.phone.ilike(f"%{search}%"),
        ))
    transactions = query.order_by(Transaction.updated_at.desc().nullslast(), Transaction.created_at.desc()).all()
    return [enrich_transaction(item) for item in transactions]


@router.post("/transactions", response_model=TransactionResponse)
def create_transaction(
    data: TransactionCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    client = db.query(Client).filter(Client.id == data.client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="العميل غير موجود")

    payload = data.model_dump(exclude={"documents"})
    payload["status"] = payload.get("status") or DEFAULT_STATUSES.get(data.transaction_type, "new")
    payload["transaction_number"] = generate_transaction_number(db, data.transaction_type)
    transaction = Transaction(**payload)
    sync_amounts(transaction)
    db.add(transaction)
    db.flush()

    for doc_data in data.documents:
        db.add(TransactionDocument(transaction_id=transaction.id, **doc_data.model_dump()))

    add_timeline(
        db,
        transaction.id,
        "create",
        employee=getattr(current_user, "name", None),
        note="تم فتح المعاملة",
        new_status=transaction.status,
    )
    db.commit()
    return enrich_transaction(get_transaction_or_404(db, transaction.id))


@router.get("/transactions/{transaction_id}", response_model=TransactionResponse)
def get_transaction(
    transaction_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return enrich_transaction(get_transaction_or_404(db, transaction_id))


@router.put("/transactions/{transaction_id}", response_model=TransactionResponse)
def update_transaction(
    transaction_id: int,
    data: TransactionUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    transaction = get_transaction_or_404(db, transaction_id)
    old_status = transaction.status
    updates = data.model_dump(exclude_unset=True)
    for key, value in updates.items():
        setattr(transaction, key, value)
    sync_amounts(transaction)
    if "status" in updates and updates["status"] != old_status:
        add_timeline(
            db,
            transaction.id,
            "status_change",
            employee=getattr(current_user, "name", None),
            note="تم تغيير حالة المعاملة",
            old_status=old_status,
            new_status=transaction.status,
        )
    db.commit()
    return enrich_transaction(get_transaction_or_404(db, transaction_id))


@router.post("/transactions/{transaction_id}/timeline", response_model=TransactionResponse)
def create_timeline_item(
    transaction_id: int,
    data: TimelineCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    transaction = get_transaction_or_404(db, transaction_id)
    if data.new_status and data.new_status != transaction.status:
        old_status = transaction.status
        transaction.status = data.new_status
        data.old_status = data.old_status or old_status
    db.add(TransactionTimeline(transaction_id=transaction.id, **data.model_dump()))
    db.commit()
    return enrich_transaction(get_transaction_or_404(db, transaction_id))


@router.post("/transactions/{transaction_id}/documents", response_model=TransactionResponse)
def create_document(
    transaction_id: int,
    data: DocumentCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    transaction = get_transaction_or_404(db, transaction_id)
    db.add(TransactionDocument(transaction_id=transaction.id, **data.model_dump()))
    add_timeline(db, transaction.id, "document_request", getattr(current_user, "name", None), f"تم طلب/إضافة مستند: {data.name}")
    db.commit()
    return enrich_transaction(get_transaction_or_404(db, transaction_id))


@router.put("/documents/{document_id}", response_model=TransactionResponse)
def update_document(
    document_id: int,
    data: DocumentUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    document = db.query(TransactionDocument).filter(TransactionDocument.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="المستند غير موجود")
    old_status = document.status
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(document, key, value)
    if data.status and data.status != old_status:
        add_timeline(
            db,
            document.transaction_id,
            "document_update",
            getattr(current_user, "name", None),
            f"تم تحديث مستند {document.name}: {old_status} -> {data.status}",
        )
    db.commit()
    return enrich_transaction(get_transaction_or_404(db, document.transaction_id))


@router.post("/documents/{document_id}/upload", response_model=TransactionResponse)
def upload_document_file(
    document_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    document = db.query(TransactionDocument).filter(TransactionDocument.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="المستند غير موجود")
    upload_dir = os.path.join(settings.UPLOAD_DIR, "crm-documents")
    os.makedirs(upload_dir, exist_ok=True)
    ext = os.path.splitext(file.filename or "")[1]
    safe_name = f"{uuid.uuid4().hex}{ext}"
    disk_path = os.path.join(upload_dir, safe_name)
    with open(disk_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    document.file_path = f"/uploads/crm-documents/{safe_name}"
    document.status = "received"
    document.received_date = date.today()
    add_timeline(
        db,
        document.transaction_id,
        "document_upload",
        getattr(current_user, "name", None),
        f"تم رفع ملف مستند: {document.name}",
        attachment_path=document.file_path,
    )
    db.commit()
    return enrich_transaction(get_transaction_or_404(db, document.transaction_id))


@router.post("/transactions/{transaction_id}/payments", response_model=TransactionResponse)
def create_payment(
    transaction_id: int,
    data: PaymentCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    transaction = get_transaction_or_404(db, transaction_id)
    payment_data = data.model_dump()
    payment_data["payment_date"] = payment_data["payment_date"] or date.today()
    payment_data["created_by"] = payment_data["created_by"] or getattr(current_user, "name", None)
    db.add(TransactionPayment(transaction_id=transaction.id, **payment_data))
    transaction.amount_paid = (transaction.amount_paid or 0) + data.amount
    sync_amounts(transaction)
    add_timeline(db, transaction.id, "payment", getattr(current_user, "name", None), f"تم تسجيل دفعة بقيمة {data.amount}")
    db.commit()
    return enrich_transaction(get_transaction_or_404(db, transaction_id))


@router.post("/transactions/{transaction_id}/tasks", response_model=TransactionResponse)
def create_task(
    transaction_id: int,
    data: TransactionTaskCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    transaction = get_transaction_or_404(db, transaction_id)
    db.add(TransactionTask(transaction_id=transaction.id, **data.model_dump()))
    add_timeline(db, transaction.id, "task", getattr(current_user, "name", None), f"تمت إضافة مهمة: {data.title}")
    db.commit()
    return enrich_transaction(get_transaction_or_404(db, transaction_id))


@router.put("/tasks/{task_id}", response_model=TransactionResponse)
def update_task(
    task_id: int,
    data: TransactionTaskUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    task = db.query(TransactionTask).filter(TransactionTask.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="المهمة غير موجودة")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(task, key, value)
    db.commit()
    return enrich_transaction(get_transaction_or_404(db, task.transaction_id))


@router.post("/transactions/{transaction_id}/attachments", response_model=TransactionResponse)
def upload_attachment(
    transaction_id: int,
    file: UploadFile = File(...),
    description: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    transaction = get_transaction_or_404(db, transaction_id)
    upload_dir = os.path.join(settings.UPLOAD_DIR, "crm")
    os.makedirs(upload_dir, exist_ok=True)
    ext = os.path.splitext(file.filename or "")[1]
    safe_name = f"{uuid.uuid4().hex}{ext}"
    disk_path = os.path.join(upload_dir, safe_name)
    with open(disk_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    public_path = f"/uploads/crm/{safe_name}"
    db.add(TransactionAttachment(
        transaction_id=transaction.id,
        name=file.filename or safe_name,
        file_path=public_path,
        description=description,
    ))
    add_timeline(db, transaction.id, "attachment", getattr(current_user, "name", None), f"تم رفع مرفق: {file.filename}", attachment_path=public_path)
    db.commit()
    return enrich_transaction(get_transaction_or_404(db, transaction_id))


@router.get("/daily-follow-up")
def daily_follow_up(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    today = date.today()
    soon = today + timedelta(days=7)
    base = full_transaction_query(db)
    follow_up_today = base.filter(Transaction.next_follow_up <= today).order_by(Transaction.next_follow_up.asc()).limit(50).all()
    missing_document_ids = select(TransactionDocument.transaction_id).filter(
        TransactionDocument.status.in_(["required", "missing"])
    ).distinct().limit(50)
    missing_document_transactions = full_transaction_query(db).filter(
        Transaction.id.in_(missing_document_ids)
    ).all()
    late_payments = full_transaction_query(db).filter(
        Transaction.amount_remaining > 0,
        Transaction.payment_status.in_(["unpaid", "partial"]),
        Transaction.next_follow_up <= today,
    ).limit(50).all()
    awaiting_offers = full_transaction_query(db).filter(
        Transaction.transaction_type == "systems",
        Transaction.status == "awaiting_client_approval",
    ).limit(50).all()
    waiting_deposit = full_transaction_query(db).filter(
        Transaction.transaction_type == "makeup",
        Transaction.status == "waiting_deposit",
    ).limit(50).all()
    upcoming = full_transaction_query(db).filter(
        Transaction.next_follow_up >= today,
        Transaction.next_follow_up <= soon,
    ).order_by(Transaction.next_follow_up.asc()).limit(50).all()

    return {
        "follow_up_today": [enrich_transaction(item) for item in follow_up_today],
        "missing_documents": [enrich_transaction(item) for item in missing_document_transactions],
        "late_payments": [enrich_transaction(item) for item in late_payments],
        "awaiting_offers": [enrich_transaction(item) for item in awaiting_offers],
        "waiting_deposit": [enrich_transaction(item) for item in waiting_deposit],
        "upcoming_appointments": [enrich_transaction(item) for item in upcoming],
    }
