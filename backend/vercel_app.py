import os
import sys

# Add the current directory to the sys.path
# This ensures that 'mycourse_backend' is importable
file_path = os.path.dirname(__file__)
sys.path.append(file_path)

from mycourse_backend.wsgi import application

# 'app' is the variable name Vercel looks for by default
app = application
