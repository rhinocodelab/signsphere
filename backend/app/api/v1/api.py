from fastapi import APIRouter
from app.api.v1.endpoints import auth, users, train_routes, train_route_translations, announcement_templates, isl_videos

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(
    train_routes.router, prefix="/train-routes", tags=["train-routes"])
api_router.include_router(train_route_translations.router,
                          prefix="/train-route-translations", tags=["train-route-translations"])
api_router.include_router(announcement_templates.router,
                          prefix="/announcement-templates", tags=["announcement-templates"])
api_router.include_router(
    isl_videos.router, prefix="/isl-videos", tags=["isl-videos"])
