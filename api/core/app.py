from starlette.middleware.cors import CORSMiddleware
from fastapi import FastAPI
from contextlib import asynccontextmanager
from core.routers.websocket_server import router as WebsocketRouter

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Starting up...")
    yield
    print("Shutting down...")


app = FastAPI(
    title="AIAIVN Google Contest MVP",
    docs_url="/docs",
    version="0.0.1",
    lifespan=lifespan,
)

# config rate limiter
# app.state.limiter = RATE_LIMITER.get_limiter()
# app.add_exception_handler(
#     RateLimitExceeded, _rate_limit_exceeded_handler
# )
# app.add_middleware(SlowAPIMiddleware)


@app.get("/", tags=["Root"])
async def read_root():
    return {
        "message": "Develop a comprehensive AIAIVN Voice Service Server API system that tracks and manages user actions across different applications. This system should be designed to handle high-volume logging, provide search and filtering capabilities, and ensure data integrity and security."
    }

app.include_router(
    WebsocketRouter,
    tags=["WebSocket Route"],
    prefix="/ws/v1/translate"
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["POST", "PUT", "DELETE", "OPTION", "GET"],
    allow_headers=["*"],
)
