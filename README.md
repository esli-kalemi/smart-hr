# SmartHR — AI-Powered Recruitment Management System

SmartHR is an AI-powered recruitment management platform designed to simplify the hiring process. It helps HR professionals manage job postings, organize candidates, and evaluate applicants through automated resume analysis and configurable AI scoring.

## Features

- **HR Dashboard:** Overview of recruitment activities.
- **Job Management:** Create, edit, manage, and soft-delete job postings.
- **Candidate Management:** Organize applicants by job and review their information.
- **Resume Analysis:** Extract relevant information from uploaded PDF and DOCX resumes.
- **AI Candidate Evaluation:** Compare candidate qualifications against job requirements.
- **Custom Scoring:** Assign different weights to skills, experience, education, certifications, and soft skills.
- **AI Explanations:** Generate candidate strengths, skill gaps, and recommendations.
- **Candidate Ranking:** Sort applicants based on their AI match scores.
- **Interview Scheduling:** Schedule interviews for applicants in the interview stage.


## Technologies

| Technology | Purpose |
|---|---|
| React.js | Frontend development |
| Vite | Frontend development server and build tool |
| JavaScript | Application logic |
| CSS | User interface styling |
| Python | Backend development |
| FastAPI | REST API |
| Supabase | PostgreSQL database and file storage |
| Google Gemini API | AI-generated explanations |
| Semantic embeddings | Similarity-based candidate matching |

## AI Analysis Workflow

1. HR creates a job posting and defines its requirements and scoring priorities.
2. A candidate submits their resume.
3. The backend extracts and processes the resume text.
4. Candidate qualifications are compared with job requirements.
5. The scoring engine calculates category scores and an overall match percentage.
6. Google Gemini generates an explanation of the comparison.
7. Results are stored in Supabase and displayed in the HR dashboard.

## Project Objective

The goal of SmartHR is to reduce manual recruitment effort, improve applicant organization, and provide HR professionals with AI-assisted insights to support more informed hiring decisions.

Human in the loop approach: AI-generated scores are estimated based on extracted resume information and they support, not replace, human hiring decisions.