from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime, date


class TimelineBase(BaseModel):
    action_type: str
    employee: Optional[str] = None
    note: Optional[str] = None
    old_status: Optional[str] = None
    new_status: Optional[str] = None
    attachment_path: Optional[str] = None


class TimelineCreate(TimelineBase):
    pass


class TimelineResponse(TimelineBase):
    id: int
    transaction_id: int
    action_date: datetime

    class Config:
        from_attributes = True


class DocumentBase(BaseModel):
    name: str
    status: str = "required"
    received_date: Optional[date] = None
    notes: Optional[str] = None
    file_path: Optional[str] = None


class DocumentCreate(DocumentBase):
    pass


class DocumentUpdate(BaseModel):
    name: Optional[str] = None
    status: Optional[str] = None
    received_date: Optional[date] = None
    notes: Optional[str] = None
    file_path: Optional[str] = None


class DocumentResponse(DocumentBase):
    id: int
    transaction_id: int
    created_at: datetime

    class Config:
        from_attributes = True


class PaymentBase(BaseModel):
    amount: float
    payment_date: Optional[date] = None
    method: Optional[str] = None
    notes: Optional[str] = None
    created_by: Optional[str] = None


class PaymentCreate(PaymentBase):
    pass


class PaymentResponse(PaymentBase):
    id: int
    transaction_id: int
    created_at: datetime

    class Config:
        from_attributes = True


class TransactionTaskBase(BaseModel):
    title: str
    due_date: Optional[date] = None
    priority: str = "medium"
    status: str = "open"
    notes: Optional[str] = None


class TransactionTaskCreate(TransactionTaskBase):
    pass


class TransactionTaskUpdate(BaseModel):
    title: Optional[str] = None
    due_date: Optional[date] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    notes: Optional[str] = None


class TransactionTaskResponse(TransactionTaskBase):
    id: int
    transaction_id: int
    created_at: datetime

    class Config:
        from_attributes = True


class AttachmentResponse(BaseModel):
    id: int
    transaction_id: int
    name: str
    file_path: str
    description: Optional[str] = None
    uploaded_at: datetime

    class Config:
        from_attributes = True


class TransactionBase(BaseModel):
    transaction_type: str
    client_id: int
    company_id: Optional[int] = None
    status: Optional[str] = None
    priority: str = "medium"
    assigned_to: Optional[str] = None
    next_follow_up: Optional[date] = None
    service_value: float = 0
    amount_paid: float = 0
    amount_remaining: Optional[float] = None
    payment_status: Optional[str] = None
    notes: Optional[str] = None
    extra_data: Dict[str, Any] = Field(default_factory=dict)


class TransactionCreate(TransactionBase):
    documents: List[DocumentCreate] = Field(default_factory=list)


class TransactionUpdate(BaseModel):
    transaction_type: Optional[str] = None
    client_id: Optional[int] = None
    company_id: Optional[int] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    assigned_to: Optional[str] = None
    next_follow_up: Optional[date] = None
    service_value: Optional[float] = None
    amount_paid: Optional[float] = None
    amount_remaining: Optional[float] = None
    payment_status: Optional[str] = None
    notes: Optional[str] = None
    extra_data: Optional[Dict[str, Any]] = None


class TransactionResponse(TransactionBase):
    id: int
    transaction_number: str
    status: str
    amount_remaining: float
    payment_status: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    client_name: Optional[str] = None
    client_phone: Optional[str] = None
    company_name: Optional[str] = None
    missing_documents_count: int = 0
    timeline: List[TimelineResponse] = Field(default_factory=list)
    documents: List[DocumentResponse] = Field(default_factory=list)
    payments: List[PaymentResponse] = Field(default_factory=list)
    tasks: List[TransactionTaskResponse] = Field(default_factory=list)
    attachments: List[AttachmentResponse] = Field(default_factory=list)

    class Config:
        from_attributes = True
