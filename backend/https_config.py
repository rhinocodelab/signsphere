import uvicorn
import os
from app.main import app

if __name__ == "__main__":
    # Get the project root directory dynamically
    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    cert_dir = os.path.join(project_root, "certificates")
    
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=5001,
        reload=True,
        log_level="info",
        ssl_keyfile=os.path.join(cert_dir, "signsphere.key"),
        ssl_certfile=os.path.join(cert_dir, "signsphere.crt")
    )
