from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from typing import List, Optional
from datetime import date
from ..database import get_db
from ..models.client import Client
from ..models.company import Company
from ..models.crm import Transaction
from ..schemas.client import ClientCreate, ClientUpdate, ClientResponse
from ..auth.jwt_handler import get_current_user

router = APIRouter(prefix="/clients", tags=["clients"])

def enrich_client(client: Client, db: Session) -> dict:
    d = {k: v for k, v in client.__dict__.items() if not k.startswith('_')}
    d['total_amount'] = client.agreement_value or 0
    if client.company_id:
        company = db.query(Company).filter(Company.id == client.company_id).first()
        d['company_name'] = company.name if company else None
    else:
        d['company_name'] = None
    d['transactions_count'] = db.query(Transaction).filter(Transaction.client_id == client.id).count()
    return d

def normalize_client_payload(data: dict) -> dict:
    if data.get("total_amount") is not None and data.get("agreement_value") in (None, 0):
        data["agreement_value"] = data["total_amount"]
    data.pop("total_amount", None)
    return data

@router.get("", response_model=List[ClientResponse])
def get_clients(
    company_id: Optional[int] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    query = db.query(Client)
    if company_id:
        query = query.filter(Client.company_id == company_id)
    if status:
        query = query.filter(Client.status == status)
    if search:
        query = query.filter(or_(
            Client.name.ilike(f"%{search}%"),
            Client.phone.ilike(f"%{search}%"),
            Client.email.ilike(f"%{search}%"),
        ))
    clients = query.order_by(Client.created_at.desc()).all()
    return [enrich_client(c, db) for c in clients]

@router.post("", response_model=ClientResponse)
def create_client(client_data: ClientCreate, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    payload = normalize_client_payload(client_data.model_dump())
    client = Client(**payload)
    client.amount_remaining = client.agreement_value - client.amount_paid
    db.add(client)
    db.commit()
    db.refresh(client)
    return enrich_client(client, db)

@router.get("/late/list")
def get_late_clients(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    clients = db.query(Client).filter(Client.status == "late").all()
    return [enrich_client(c, db) for c in clients]

@router.get("/{client_id}", response_model=ClientResponse)
def get_client(client_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="العميل غير موجود")
    return enrich_client(client, db)

@router.put("/{client_id}", response_model=ClientResponse)
def update_client(client_id: int, client_data: ClientUpdate, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="العميل غير موجود")
    for key, value in normalize_client_payload(client_data.model_dump(exclude_unset=True)).items():
        setattr(client, key, value)
    if client_data.agreement_value is not None or client_data.total_amount is not None or client_data.amount_paid is not None:
        client.amount_remaining = client.agreement_value - client.amount_paid
    db.commit()
    db.refresh(client)
    return enrich_client(client, db)

@router.delete("/{client_id}")
def delete_client(client_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="العميل غير موجود")
    db.delete(client)
    db.commit()
    return {"message": "تم الحذف بنجاح"}
