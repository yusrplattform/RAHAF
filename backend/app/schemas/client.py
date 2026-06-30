from pydantic import BaseModel
from typing import Optional
from datetime import datetime, date

class ClientBase(BaseModel):
    name: str
    client_type: str = "individual"
    phone: Optional[str] = None
    email: Optional[str] = None
    source: Optional[str] = None
    company_id: Optional[int] = None
    service_type: Optional[str] = None
    agreement_value: float = 0
    total_amount: Optional[float] = None
    amount_paid: float = 0
    amount_remaining: float = 0
    status: str = "new"
    last_contact: Optional[date] = None
    next_follow_up: Optional[date] = None
    notes: Optional[str] = None

class ClientCreate(ClientBase):
    pass

class ClientUpdate(BaseModel):
    name: Optional[str] = None
    client_type: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    source: Optional[str] = None
    company_id: Optional[int] = None
    service_type: Optional[str] = None
    agreement_value: Optional[float] = None
    total_amount: Optional[float] = None
    amount_paid: Optional[float] = None
    amount_remaining: Optional[float] = None
    status: Optional[str] = None
    last_contact: Optional[date] = None
    next_follow_up: Optional[date] = None
    notes: Optional[str] = None

class ClientResponse(ClientBase):
    id: int
    created_at: datetime
    company_name: Optional[str] = None
    transactions_count: int = 0

    class Config:
        from_attributes = True
