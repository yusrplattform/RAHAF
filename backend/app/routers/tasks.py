from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date
from ..database import get_db
from ..models.task import Task
from ..models.company import Company
from ..models.client import Client
from ..schemas.task import TaskCreate, TaskUpdate, TaskResponse
from ..auth.jwt_handler import get_current_user

router = APIRouter(prefix="/tasks", tags=["tasks"])

def enrich_task(task: Task, db: Session) -> dict:
    d = {k: v for k, v in task.__dict__.items() if not k.startswith('_')}
    if task.company_id:
        company = db.query(Company).filter(Company.id == task.company_id).first()
        d['company_name'] = company.name if company else None
    else:
        d['company_name'] = None
    if task.client_id:
        client = db.query(Client).filter(Client.id == task.client_id).first()
        d['client_name'] = client.name if client else None
    else:
        d['client_name'] = None
    return d

@router.get("", response_model=List[TaskResponse])
def get_tasks(
    company_id: Optional[int] = None,
    status: Optional[str] = None,
    priority: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    query = db.query(Task)
    if company_id:
        query = query.filter(Task.company_id == company_id)
    if status:
        query = query.filter(Task.status == status)
    if priority:
        query = query.filter(Task.priority == priority)
    tasks = query.order_by(Task.due_date.asc()).all()
    return [enrich_task(t, db) for t in tasks]

@router.post("", response_model=TaskResponse)
def create_task(task_data: TaskCreate, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    task = Task(**task_data.model_dump())
    db.add(task)
    db.commit()
    db.refresh(task)
    return enrich_task(task, db)

@router.put("/{task_id}", response_model=TaskResponse)
def update_task(task_id: int, task_data: TaskUpdate, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="المهمة غير موجودة")
    for key, value in task_data.model_dump(exclude_unset=True).items():
        setattr(task, key, value)
    db.commit()
    db.refresh(task)
    return enrich_task(task, db)

@router.delete("/{task_id}")
def delete_task(task_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="المهمة غير موجودة")
    db.delete(task)
    db.commit()
    return {"message": "تم الحذف بنجاح"}
