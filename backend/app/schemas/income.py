from pydantic import BaseModel
from typing import Optional
from datetime import datetime, date

class IncomeBase(BaseModel):
    client_id: Optional[int] = None
    company_id: int
    service_type: str
    amount: float
    payment_date: date
    payment_method: Optional[str] = None
    payment_status: str = "unpaid"
    amount_paid: float = 0
    amount_remaining: float = 0
    notes: Optional[str] = None

class IncomeCreate(IncomeBase):
    pass

class IncomeUpdate(BaseModel):
    client_id: Optional[int] = None
    company_id: Optional[int] = None
    service_type: Optional[str] = None
    amount: Optional[float] = None
    payment_date: Optional[date] = None
    payment_method: Optional[str] = None
    payment_status: Optional[str] = None
    amount_paid: Optional[float] = None
    amount_remaining: Optional[float] = None
    notes: Optional[str] = None

class IncomeResponse(IncomeBase):
    id: int
    receipt_file: Optional[str] = None
    created_at: datetime
    client_name: Optional[str] = None
    company_name: Optional[str] = None

    class Config:
        from_attributes = True
