"""Local proxy for the real `alembic` package.

This directory contains migration scripts. To avoid shadowing the
installed `alembic` package when Python imports `alembic`, we proxy
imports to the real package here.

This file delegates attribute lookups to the installed alembic module.
"""
from importlib import import_module as _import_module
from types import ModuleType as _ModuleType
import sys as _sys

try:
    _real_alembic = _import_module("alembic")
except Exception:
    # If the installed alembic is not available, leave this module empty
    # so import errors surface as normal.
    _real_alembic = None

if _real_alembic is not None:
    # Copy attributes from the real alembic module into this package
    for _name in dir(_real_alembic):
        if _name.startswith("__"):
            continue
        try:
            globals()[_name] = getattr(_real_alembic, _name)
        except Exception:
            # ignore attributes that error on access
            pass

    # Ensure importers see this as a package module
    __all__ = getattr(_real_alembic, "__all__", [n for n in globals() if not n.startswith("_")])
