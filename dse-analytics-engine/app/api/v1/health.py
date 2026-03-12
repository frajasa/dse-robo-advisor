from fastapi import APIRouter

from app.core.config import settings
from app.models.schemas import HealthResponse

router = APIRouter(tags=["health"])


@router.get("/health", response_model=HealthResponse)
async def health_check() -> HealthResponse:
    """Health check endpoint to verify the service is running."""
    return HealthResponse(
        status="ok",
        version=settings.APP_VERSION,
    )
