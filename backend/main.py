from fastapi import FastAPI

from routes.auth import router as auth_router
from routes.jobs import router as jobs_router


app = FastAPI(
    title="SmartHR",
    description="AI-powered recruitment and applicant management platform",
    version="1.0.0",
)


app.include_router(auth_router)
app.include_router(jobs_router)

@app.get("/")
def root():
    return {
        "message": "SmartHR API is running"
    }