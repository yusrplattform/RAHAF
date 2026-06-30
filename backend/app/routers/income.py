from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import date
import os, shutil, uuid
from ..database import get_db
from ..models.income import Income
from ..models.client import Client
from ..models.company import Company
from ..schemas.income import IncomeCreate, IncomeUpdate, IncomeResponse
from ..auth.jwt_handler import get_current_user
from ..config import settings

router = APIRouter(prefix="/income", tags=["income"])

def enrich_income(income: Income, db: Session) -> dict:
    d = {k: v for k, v in income.__dict__.items() if not k.startswith('_')}
    if income.client_id:
        client = db.query(Client).filter(Client.id == income.client_id).first()
        d['client_name'] = client.name if client else None
    else:
        d['client_name'] = None
    company = db.query(Company).filter(Company.id == income.company_id).first()
    d['company_name'] = company.name if company else None
    return d

@router.get("", response_model=List[IncomeResponse])
def get_incomes(
    company_id: Optional[int] = None,
    payment_status: Optional[str] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    query = db.query(Income)
    if company_id:
        query = query.filter(Income.company_id == company_id)
    if payment_status:
        query = query.filter(Income.payment_status == payment_status)
    if date_from:
        query = query.filter(Income.payment_date >= date_from)
    if date_to:
        query = query.filter(Income.payment_date <= date_to)
    incomes = query.order_by(Income.payment_date.desc()).all()
    return [enrich_income(i, db) for i in incomes]

@router.post("", response_model=IncomeResponse)
def create_income(income_data: IncomeCreate, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    income = Income(**income_data.model_dump())
    income.amount_remaining = income.amount - income.amount_paid
    db.add(income)
    db.commit()
    db.refresh(income)
    return enrich_income(income, db)

@router.get("/{income_id}", response_model=IncomeResponse)
def get_income(income_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    income = db.query(Income).filter(Income.id == income_id).first()
    if not income:
        raise HTTPException(status_code=404, detail="السجل غير موجود")
    return enrich_income(income, db)

@router.put("/{income_id}", response_model=IncomeResponse)
def update_income(income_id: int, income_data: IncomeUpdate, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    income = db.query(Income).filter(Income.id == income_id).first()
    if not income:
        raise HTTPException(status_code=404, detail="السجل غير موجود")
    for key, value in income_data.model_dump(exclude_unset=True).items():
        setattr(income, key, value)
    if income_data.amount is not None or income_data.amount_paid is not None:
        income.amount_remaining = income.amount - income.amount_paid
    db.commit()
    db.refresh(income)
    return enrich_income(income, db)

@router.delete("/{income_id}")
def delete_income(income_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    income = db.query(Income).filter(Income.id == income_id).first()
    if not income:
        raise HTTPException(status_code=404, detail="السجل غير موجود")
    db.delete(income)
    db.commit()
    return {"message": "تم الحذف بنجاح"}

@router.post("/{income_id}/upload-receipt")
async def upload_receipt(
    income_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    income = db.query(Income).filter(Income.id == income_id).first()
    if not income:
        raise HTTPException(status_code=404, detail="السجل غير موجود")

    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    ext = file.filename.split(".")[-1]
    filename = f"receipt_{income_id}_{uuid.uuid4().hex}.{ext}"
    filepath = os.path.join(settings.UPLOAD_DIR, filename)

    with open(filepath, "wb") as f:
        shutil.copyfileobj(file.file, f)

    income.receipt_file = filename
    db.commit()
    return {"filename": filename}
