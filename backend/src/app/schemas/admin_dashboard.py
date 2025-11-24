from pydantic import BaseModel


class AdminDashboardSummary(BaseModel):
    total_users: int
    active_doctors: int
    appointments_today: int
    medical_records: int


__all__ = ["AdminDashboardSummary"]
