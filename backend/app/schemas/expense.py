from pydantic import BaseModel
from typing import Optional
from datetime import datetime, date

class ExpenseBase(BaseModel):
    company_id: int
    expense_type: str
    amount: float
    expense_date: date
    payment_method: Optional[str] = None
    is_fixed: bool = False
    notes: Optional[str] = None

class ExpenseCreate(ExpenseBase):
    pass

class ExpenseUpdate(BaseModel):
    company_id: Optional[int] = None
    expense_type: Optional[str] = None
    amount: Optional[float] = None
    expense_date: Optional[date] = None
    payment_method: Optional[str] = None
    is_fixed: Optional[bool] = None
    notes: Optional[str] = None

class ExpenseResponse(ExpenseBase):
    id: int
    invoice_file: Optional[str] = None
    created_at: datetime
    company_name: Optional[str] = None

    class Config:
        from_attributes = True
