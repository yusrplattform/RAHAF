from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from typing import Optional
from datetime import date, datetime
import io
from ..database import get_db
from ..models.income import Income
from ..models.expense import Expense
from ..models.client import Client
from ..models.company import Company
from ..auth.jwt_handler import get_current_user, require_accountant_or_owner

router = APIRouter(prefix="/reports", tags=["reports"])

@router.get("/dashboard")
def get_dashboard(
    period: Optional[str] = "month",
    company_id: Optional[int] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    from datetime import timedelta
    today = date.today()

    if not date_from and not date_to:
        if period == "day":
            date_from = today
            date_to = today
        elif period == "week":
            date_from = today - timedelta(days=7)
            date_to = today
        elif period == "month":
            date_from = today.replace(day=1)
            date_to = today
        elif period == "year":
            date_from = today.replace(month=1, day=1)
            date_to = today

    income_query = db.query(Income)
    expense_query = db.query(Expense)
    client_query = db.query(Client)

    if company_id:
        income_query = income_query.filter(Income.company_id == company_id)
        expense_query = expense_query.filter(Expense.company_id == company_id)
        client_query = client_query.filter(Client.company_id == company_id)

    if date_from:
        income_query = income_query.filter(Income.payment_date >= date_from)
        expense_query = expense_query.filter(Expense.expense_date >= date_from)
    if date_to:
        income_query = income_query.filter(Income.payment_date <= date_to)
        expense_query = expense_query.filter(Expense.expense_date <= date_to)

    total_income = income_query.with_entities(func.sum(Income.amount_paid)).scalar() or 0
    total_expenses = expense_query.with_entities(func.sum(Expense.amount)).scalar() or 0
    total_clients = client_query.count()
    late_clients = client_query.filter(Client.status == "late").count()
    pending_amount = client_query.with_entities(func.sum(Client.amount_remaining)).scalar() or 0

    # Top company by income
    top_company = db.query(
        Company.name,
        func.sum(Income.amount_paid).label("total")
    ).join(Income, Company.id == Income.company_id).group_by(Company.id, Company.name).order_by(func.sum(Income.amount_paid).desc()).first()

    # Top income sources
    top_services = db.query(
        Income.service_type,
        func.sum(Income.amount_paid).label("total")
    ).group_by(Income.service_type).order_by(func.sum(Income.amount_paid).desc()).limit(5).all()

    # Top expense types
    top_expenses = db.query(
        Expense.expense_type,
        func.sum(Expense.amount).label("total")
    ).group_by(Expense.expense_type).order_by(func.sum(Expense.amount).desc()).limit(5).all()

    # Monthly breakdown for current year
    monthly_income = db.query(
        extract('month', Income.payment_date).label('month'),
        func.sum(Income.amount_paid).label('total')
    ).filter(extract('year', Income.payment_date) == today.year).group_by('month').all()

    monthly_expenses = db.query(
        extract('month', Expense.expense_date).label('month'),
        func.sum(Expense.amount).label('total')
    ).filter(extract('year', Expense.expense_date) == today.year).group_by('month').all()

    monthly_data = {}
    for m in range(1, 13):
        monthly_data[m] = {"income": 0, "expenses": 0}
    for row in monthly_income:
        monthly_data[int(row.month)]["income"] = float(row.total)
    for row in monthly_expenses:
        monthly_data[int(row.month)]["expenses"] = float(row.total)

    return {
        "total_income": float(total_income),
        "total_expenses": float(total_expenses),
        "net_profit": float(total_income - total_expenses),
        "total_clients": total_clients,
        "late_clients": late_clients,
        "pending_amount": float(pending_amount),
        "top_company": {"name": top_company[0], "total": float(top_company[1])} if top_company else None,
        "top_services": [{"service": r.service_type, "total": float(r.total)} for r in top_services],
        "top_expenses": [{"type": r.expense_type, "total": float(r.total)} for r in top_expenses],
        "monthly_data": [{"month": m, "income": v["income"], "expenses": v["expenses"]} for m, v in monthly_data.items()],
        "break_even": float(total_expenses)
    }

@router.get("/company-summary")
def get_company_summary(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    companies = db.query(Company).all()
    result = []
    for company in companies:
        total_income = db.query(func.sum(Income.amount_paid)).filter(Income.company_id == company.id).scalar() or 0
        total_expenses = db.query(func.sum(Expense.amount)).filter(Expense.company_id == company.id).scalar() or 0
        result.append({
            "id": company.id,
            "name": company.name,
            "status": company.status,
            "total_income": float(total_income),
            "total_expenses": float(total_expenses),
            "net_profit": float(total_income - total_expenses)
        })
    return result

@router.get("/export/excel")
def export_excel(
    report_type: str = "income",
    company_id: Optional[int] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user = Depends(require_accountant_or_owner)
):
    from fastapi.responses import StreamingResponse
    import openpyxl

    wb = openpyxl.Workbook()
    ws = wb.active

    if report_type == "income":
        ws.title = "الدخل"
        ws.append(["#", "العميل", "الخدمة", "نوع الخدمة", "المبلغ", "المدفوع", "المتبقي", "الحالة", "التاريخ", "طريقة الدفع"])
        query = db.query(Income)
        if company_id:
            query = query.filter(Income.company_id == company_id)
        if date_from:
            query = query.filter(Income.payment_date >= date_from)
        if date_to:
            query = query.filter(Income.payment_date <= date_to)
        for i, inc in enumerate(query.all(), 1):
            client = db.query(Client).filter(Client.id == inc.client_id).first() if inc.client_id else None
            company = db.query(Company).filter(Company.id == inc.company_id).first()
            ws.append([
                i, client.name if client else "", company.name if company else "",
                inc.service_type, inc.amount, inc.amount_paid, inc.amount_remaining,
                inc.payment_status, str(inc.payment_date), inc.payment_method or ""
            ])
    elif report_type == "expenses":
        ws.title = "المصروفات"
        ws.append(["#", "الخدمة", "نوع المصروف", "المبلغ", "التاريخ", "طريقة الدفع", "ثابت/متغير"])
        query = db.query(Expense)
        if company_id:
            query = query.filter(Expense.company_id == company_id)
        if date_from:
            query = query.filter(Expense.expense_date >= date_from)
        if date_to:
            query = query.filter(Expense.expense_date <= date_to)
        for i, exp in enumerate(query.all(), 1):
            company = db.query(Company).filter(Company.id == exp.company_id).first()
            ws.append([
                i, company.name if company else "", exp.expense_type,
                exp.amount, str(exp.expense_date), exp.payment_method or "",
                "ثابت" if exp.is_fixed else "متغير"
            ])

    output = io.BytesIO()
    wb.save(output)
    output.seek(0)

    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={report_type}_report.xlsx"}
    )
