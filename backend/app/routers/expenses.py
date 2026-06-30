from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date
import os, shutil, uuid
from ..database import get_db
from ..models.expense import Expense
from ..models.company import Company
from ..schemas.expense import ExpenseCreate, ExpenseUpdate, ExpenseResponse
from ..auth.jwt_handler import get_current_user
from ..config import settings

router = APIRouter(prefix="/expenses", tags=["expenses"])

def enrich_expense(expense: Expense, db: Session) -> dict:
    d = {k: v for k, v in expense.__dict__.items() if not k.startswith('_')}
    company = db.query(Company).filter(Company.id == expense.company_id).first()
    d['company_name'] = company.name if company else None
    return d

@router.get("", response_model=List[ExpenseResponse])
def get_expenses(
    company_id: Optional[int] = None,
    expense_type: Optional[str] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    query = db.query(Expense)
    if company_id:
        query = query.filter(Expense.company_id == company_id)
    if expense_type:
        query = query.filter(Expense.expense_type == expense_type)
    if date_from:
        query = query.filter(Expense.expense_date >= date_from)
    if date_to:
        query = query.filter(Expense.expense_date <= date_to)
    expenses = query.order_by(Expense.expense_date.desc()).all()
    return [enrich_expense(e, db) for e in expenses]

@router.post("", response_model=ExpenseResponse)
def create_expense(expense_data: ExpenseCreate, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    expense = Expense(**expense_data.model_dump())
    db.add(expense)
    db.commit()
    db.refresh(expense)
    return enrich_expense(expense, db)

@router.put("/{expense_id}", response_model=ExpenseResponse)
def update_expense(expense_id: int, expense_data: ExpenseUpdate, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    expense = db.query(Expense).filter(Expense.id == expense_id).first()
    if not expense:
        raise HTTPException(status_code=404, detail="السجل غير موجود")
    for key, value in expense_data.model_dump(exclude_unset=True).items():
        setattr(expense, key, value)
    db.commit()
    db.refresh(expense)
    return enrich_expense(expense, db)

@router.delete("/{expense_id}")
def delete_expense(expense_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    expense = db.query(Expense).filter(Expense.id == expense_id).first()
    if not expense:
        raise HTTPException(status_code=404, detail="السجل غير موجود")
    db.delete(expense)
    db.commit()
    return {"message": "تم الحذف بنجاح"}

@router.post("/{expense_id}/upload-invoice")
async def upload_invoice(
    expense_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    expense = db.query(Expense).filter(Expense.id == expense_id).first()
    if not expense:
        raise HTTPException(status_code=404, detail="السجل غير موجود")

    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    ext = file.filename.split(".")[-1]
    filename = f"invoice_{expense_id}_{uuid.uuid4().hex}.{ext}"
    filepath = os.path.join(settings.UPLOAD_DIR, filename)

    with open(filepath, "wb") as f:
        shutil.copyfileobj(file.file, f)

    expense.invoice_file = filename
    db.commit()
    return {"filename": filename}
