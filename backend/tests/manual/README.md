# Manual/legacy test scripts

These scripts were used before the pytest suite existed. They are kept for reference and ad-hoc debugging:

- `test_appointment_fix.py`
- `test_auth_debug.py`
- `test_auth_role_validation.py`
- `test_booked_block_visibility.py`
- `test_complete_fix.py`
- `test_existing_availability.py`
- `test_full_booking_flow.py`
- `test_patient_registration.py`
- `test_simple_booking.py`

They are not executed by `pytest` (test discovery points to `tests/`). Run them manually if needed, or port any missing coverage into the pytest suite.
