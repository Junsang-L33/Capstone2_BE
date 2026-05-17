import os
import sys


BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PACKAGE_DIR = os.path.join(BASE_DIR, ".python-packages")

sys.path.insert(0, BASE_DIR)
sys.path.insert(0, PACKAGE_DIR)

import uvicorn


if __name__ == "__main__":
    uvicorn.run("app:app", host="0.0.0.0", port=8000)
