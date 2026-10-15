import os
import sys
from pathlib import Path

# Set testing database URI before importing app modules
os.environ["DATABASE_URL"] = "sqlite+aiosqlite:///./test_interiorai.db"
os.environ["ENVIRONMENT"] = "test"

# Ensure apps/api is in sys.path
api_root = Path(__file__).resolve().parent
if str(api_root) not in sys.path:
    sys.path.insert(0, str(api_root))
