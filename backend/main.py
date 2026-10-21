
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes.auth import router as auth_router
from routes.jobs import router as jobs_router
from routes.applicants import router as applicants_router
from routes.analysis import router as analysis_router

app = FastAPI(
    title="SmartHR",
    description="AI-powered recruitment and applicant management platform",
    version="1.0.0",
)

# Allow the local React frontend to communicate with the API.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(jobs_router)
app.include_router(applicants_router)
app.include_router(analysis_router)

@app.get("/")
def root():
    return {
        "message": "SmartHR API is running"
    }
