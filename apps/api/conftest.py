import sys
from pathlib import Path

# Ensure apps/api is in sys.path
api_root = Path(__file__).resolve().parent
if str(api_root) not in sys.path:
    sys.path.insert(0, str(api_root))
