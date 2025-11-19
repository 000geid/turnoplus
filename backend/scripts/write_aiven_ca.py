from __future__ import annotations

import os
from pathlib import Path


def main() -> None:
    ca_pem = os.getenv("AIVEN_CA_PEM", "")
    target_path = Path(os.getenv("AIVEN_SSL_CA_PATH", "/opt/render/project/src/backend/certs/aiven-ca.pem"))
    if not ca_pem:
        return
    target_path.parent.mkdir(parents=True, exist_ok=True)
    target_path.write_text(ca_pem, encoding="utf-8")


if __name__ == "__main__":
    main()