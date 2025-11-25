#!/usr/bin/env python3
"""
Script to fix the admin role in the database.
Updates any admin records with invalid roles to use "superadmin".
"""

import sys
from pathlib import Path

# Add the src directory to the Python path
sys.path.insert(0, str(Path(__file__).parent / "src"))

from sqlalchemy import select

from app.db.broker import get_dbbroker
from app.models import Admin


def fix_admin_roles():
    """Fix admin roles to use valid literal values."""
    
    db_broker = get_dbbroker()
    
    with db_broker.session() as session:
        try:
            # Get all admin records
            print("Checking admin records...")
            admins = session.execute(select(Admin)).scalars().all()
            
            if not admins:
                print("No admin records found.")
                return
            
            valid_roles = {"superadmin", "manager", "support"}
            fixed_count = 0
            
            for admin in admins:
                if admin.role not in valid_roles:
                    old_role = admin.role
                    admin.role = "superadmin"
                    print(f"✓ Fixed admin ID {admin.id}: '{old_role}' → 'superadmin'")
                    fixed_count += 1
            
            if fixed_count > 0:
                print(f"\n✅ Fixed {fixed_count} admin record(s)")
            else:
                print("\n✅ All admin records already have valid roles")
            
        except Exception as e:
            print(f"\n❌ Error fixing admin roles: {e}")
            raise


if __name__ == "__main__":
    fix_admin_roles()
