from fastapi import APIRouter
from app.api.v1.endpoints import auth, users, train_routes

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(train_routes.router, prefix="/train-routes", tags=["train-routes"])
