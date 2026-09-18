"""Point d'entrée de l'API Meeting Room Booking."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config import settings
from auth.router import router as auth_router
from users.router import router as users_router
from rooms.router import router as rooms_router
from reservations.router import router as reservations_router

settings.validate_runtime_secrets()

app = FastAPI(
    title="Meeting Room Booking API",
    description="API pour la gestion des réservations de salles de réunion",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── CORS ──
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ──
app.include_router(auth_router)
app.include_router(users_router)
app.include_router(rooms_router)
app.include_router(reservations_router)


@app.get("/", tags=["Health"])
async def health_check():
    """Vérification que l'API est en ligne."""
    return {"status": "ok", "app": "Meeting Room Booking API"}
