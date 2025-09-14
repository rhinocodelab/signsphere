# SignSphere

A production-grade full-stack application with Next.js frontend and FastAPI backend.

## Project Structure

```
SignSphere/
├── frontend/          # Next.js React application
│   ├── src/
│   ├── public/
│   │   └── images/    # Frontend images (logos, icons, etc.)
│   ├── package.json
│   └── next.config.js
├── backend/           # FastAPI Python application
│   ├── app/
│   │   ├── api/       # API routes
│   │   ├── core/      # Core configuration
│   │   ├── db/        # Database configuration
│   │   ├── models/    # SQLAlchemy models
│   │   ├── schemas/   # Pydantic schemas
│   │   ├── services/  # Business logic
│   │   └── utils/     # Utility functions
│   ├── tests/         # Test files
│   ├── venv/          # Virtual environment
│   └── requirements.txt
├── README.md
├── start_services.sh    # Start both frontend and backend
└── .gitignore
```

## Quick Start

### HTTPS Setup (Recommended)

1. **Generate SSL certificates:**
   ```bash
   cd scripts
   ./generate_certificates.sh 192.168.1.100  # Replace with your IP
   ```

2. **Configure HTTPS:**
   ```bash
   ./setup_https.sh 192.168.1.100  # Replace with your IP
   ```

3. **Start both services:**
   ```bash
   cd ..
   ./start_services.sh
   ```

The application will be available at:
- **Frontend**: `https://192.168.1.100:3000`
- **Backend API**: `https://192.168.1.100:5001`

### Manual Setup (HTTP)

#### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create and activate virtual environment:
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Copy environment variables:
   ```bash
   cp env.example .env
   ```

5. Run the development server:
   ```bash
   python run.py
   ```

The API will be available at `http://localhost:5001`

#### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy environment variables:
   ```bash
   cp env.example .env.local
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

The frontend will be available at `http://localhost:3000`

## Service Management

### Start Services
```bash
./start_services.sh
```
This script will:
- Stop any running instances of frontend and backend
- Start both services with HTTPS (if configured)
- Display service information and access URLs
- Handle graceful shutdown on Ctrl+C

### Stop Services
Simply press **Ctrl+C** while the `start_services.sh` script is running to gracefully stop all services.

## API Documentation

Once the backend is running, you can access the interactive API documentation at:
- Swagger UI: `http://localhost:5001/docs`
- ReDoc: `http://localhost:5001/redoc`

## Development

### Backend Development

- The backend uses FastAPI with SQLAlchemy for database operations
- Authentication is handled using JWT tokens
- The API follows RESTful principles
- Database models are defined in `app/models/`
- API schemas are defined in `app/schemas/`
- Business logic is in `app/services/`

### Frontend Development

- The frontend uses Next.js 14 with App Router
- Styling is done with Tailwind CSS
- TypeScript is configured for type safety
- ESLint is configured for code quality

## Production Deployment

### Backend

1. Set production environment variables
2. Use a production ASGI server like Gunicorn with Uvicorn workers
3. Set up a reverse proxy with Nginx
4. Use a production database (PostgreSQL recommended)

### Frontend

1. Build the production bundle:
   ```bash
   npm run build
   ```

2. Start the production server:
   ```bash
   npm start
   ```

## Environment Variables

### Backend (.env)

- `SECRET_KEY`: JWT secret key
- `DATABASE_URL`: Database connection string
- `BACKEND_CORS_ORIGINS`: Allowed CORS origins

### Frontend (.env.local)

- `NEXT_PUBLIC_API_URL`: Backend API URL

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.
