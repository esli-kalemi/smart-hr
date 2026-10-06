from fastapi import FastAPI

app = FastAPI(
    title="SmartHR",
    description="AI-powered recruitment and applicant management platform",
    version="1.0.0",
)


@app.get("/")
def root():
    return {
        "message": "SmartHR API is running"
    }