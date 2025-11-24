from __future__ import annotations

from contextlib import contextmanager
from datetime import datetime, timedelta, timezone
from typing import Iterator

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.db.broker import DBBroker, get_dbbroker
from app.models.appointment import Appointment as AppointmentModel
from app.models.enums import AppointmentStatus, UserRole
from app.models.medical_record import MedicalRecord as MedicalRecordModel
from app.models.user import User as UserModel
from app.schemas.admin_dashboard import AdminDashboardSummary


class AdminDashboardService:
    """Aggregate metrics for the admin dashboard."""

    def __init__(self, session: Session | None = None, *, broker: DBBroker | None = None) -> None:
        self._session = session
        self._broker = broker

    def get_summary(self) -> AdminDashboardSummary:
        with self._session_scope() as session:
            total_users = session.scalar(
                select(func.count()).select_from(UserModel)
            ) or 0

            active_doctors = session.scalar(
                select(func.count())
                .select_from(UserModel)
                .where(
                    UserModel.role == UserRole.DOCTOR,
                    UserModel.is_active.is_(True),
                )
            ) or 0

            now = datetime.now(timezone.utc)
            start_of_day = now.replace(hour=0, minute=0, second=0, microsecond=0)
            end_of_day = start_of_day + timedelta(days=1)

            appointments_today = session.scalar(
                select(func.count())
                .select_from(AppointmentModel)
                .where(
                    AppointmentModel.start_at >= start_of_day,
                    AppointmentModel.start_at < end_of_day,
                    AppointmentModel.status != AppointmentStatus.CANCELED,
                )
            ) or 0

            medical_records = session.scalar(
                select(func.count()).select_from(MedicalRecordModel)
            ) or 0

            return AdminDashboardSummary(
                total_users=total_users,
                active_doctors=active_doctors,
                appointments_today=appointments_today,
                medical_records=medical_records,
            )

    @contextmanager
    def _session_scope(self) -> Iterator[Session]:
        if self._session is not None:
            yield self._session
        else:
            broker = self._broker or get_dbbroker()
            with broker.session() as session:
                yield session


__all__ = ["AdminDashboardService"]
