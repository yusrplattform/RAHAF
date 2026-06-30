from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from ..database import get_db
from ..models.company import Company
from ..models.income import Income
from ..models.expense import Expense
from ..models.client import Client
from ..models.task import Task
from ..models.crm import Transaction
from ..schemas.company import CompanyCreate, CompanyUpdate, CompanyResponse, CompanySummary
from ..auth.jwt_handler import get_current_user

router = APIRouter(prefix="/companies", tags=["companies"])

DEFAULT_SERVICES = [
    ("شركة تثمين", "valuation"),
    ("شركة أنظمة داخلية", "systems"),
    ("شركة تحصيل", "collection"),
    ("شركة ميك أب", "makeup"),
    ("شركة خدمات أخرى", "other"),
]

def ensure_default_services(db: Session):
    existing_names = {
        row[0] for row in db.query(Company.name).filter(
            Company.name.in_([name for name, _ in DEFAULT_SERVICES])
        ).all()
    }
    changed = False
    for name, activity_type in DEFAULT_SERVICES:
        if name not in existing_names:
            db.add(Company(
                name=name,
                activity_type=activity_type,
                status="active",
                notes="خدمة افتراضية يمكن تعديلها أو إضافة خدمات أخرى لاحقاً",
            ))
            changed = True
    if changed:
        db.commit()

@router.get("", response_model=List[CompanySummary])
def get_companies(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    companies = db.query(Company).all()
    result = []
    for company in companies:
        total_income = db.query(func.sum(Income.amount_paid)).filter(Income.company_id == company.id).scalar() or 0
        total_expenses = db.query(func.sum(Expense.amount)).filter(Expense.company_id == company.id).scalar() or 0
        client_count = db.query(func.count(Client.id)).filter(Client.company_id == company.id).scalar() or 0
        result.append(CompanySummary(
            **{k: v for k, v in company.__dict__.items() if not k.startswith('_')},
            total_income=total_income,
            total_expenses=total_expenses,
            net_profit=total_income - total_expenses,
            client_count=client_count
        ))
    return result

@router.post("", response_model=CompanyResponse)
def create_company(company_data: CompanyCreate, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    company = Company(**company_data.model_dump())
    db.add(company)
    db.commit()
    db.refresh(company)
    return company

@router.get("/{company_id}", response_model=CompanySummary)
def get_company(company_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="الخدمة غير موجودة")
    total_income = db.query(func.sum(Income.amount_paid)).filter(Income.company_id == company_id).scalar() or 0
    total_expenses = db.query(func.sum(Expense.amount)).filter(Expense.company_id == company_id).scalar() or 0
    client_count = db.query(func.count(Client.id)).filter(Client.company_id == company_id).scalar() or 0
    return CompanySummary(
        **{k: v for k, v in company.__dict__.items() if not k.startswith('_')},
        total_income=total_income,
        total_expenses=total_expenses,
        net_profit=total_income - total_expenses,
        client_count=client_count
    )

@router.put("/{company_id}", response_model=CompanyResponse)
def update_company(company_id: int, company_data: CompanyUpdate, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="الخدمة غير موجودة")
    for key, value in company_data.model_dump(exclude_unset=True).items():
        setattr(company, key, value)
    db.commit()
    db.refresh(company)
    return company

@router.delete("/{company_id}")
def delete_company(company_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    if current_user.role != "owner":
        raise HTTPException(status_code=403, detail="غير مصرح")
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="الخدمة غير موجودة")

    related_counts = {
        "الدخل": db.query(func.count(Income.id)).filter(Income.company_id == company_id).scalar() or 0,
        "المصروفات": db.query(func.count(Expense.id)).filter(Expense.company_id == company_id).scalar() or 0,
        "العملاء": db.query(func.count(Client.id)).filter(Client.company_id == company_id).scalar() or 0,
        "المهام": db.query(func.count(Task.id)).filter(Task.company_id == company_id).scalar() or 0,
        "المعاملات": db.query(func.count(Transaction.id)).filter(Transaction.company_id == company_id).scalar() or 0,
    }
    used_by = [name for name, count in related_counts.items() if count]
    if used_by:
        raise HTTPException(
            status_code=409,
            detail=f"لا يمكن حذف الخدمة لأنها مرتبطة ببيانات في: {', '.join(used_by)}",
        )

    db.delete(company)
    db.commit()
    return {"message": "تم الحذف بنجاح"}
