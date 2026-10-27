import { useMemo, useEffect,useRef, useState } from "react";
import { ChevronDown, Users, UserRound, FileText, Sparkles } from "lucide-react";
import "./style/CandidatesPage.css";
import CandidateAnalysisModal from "../components/CandidateAnalysisModal";
import  { renderAsync } from "docx-preview";

export default function CandidatesPage({
  realApplications,
  analyzingId,
  onViewAnalysis,
  selectedAnalysis,
  analysisError,
  onAnalyzeApplication,
}) {
  const [expandedJobs, setExpandedJobs] = useState({});
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [analysisCandidate, setAnalysisCandidate] = useState(null);
  const [showResumeViewer, setShowResumeViewer] = useState(false);
  const resumeViewerRef = useRef(null);
  
  useEffect(() => {
    if (!showResumeViewer || !selectedCandidate) return;

    let cancelled = false;
    let pdfObjectUrl=null;

    async function loadResume() {
      const container = resumeViewerRef.current;

      try {
        if (!container) return;

        container.replaceChildren();

        const applicationId = selectedCandidate.id;

        const response = await fetch(
          `http://127.0.0.1:8000/applicants/applications/${applicationId}/resume-url`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("smarthr_token")}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Could not retrieve the resume.");
        }

        const data = await response.json();

        const documentResponse = await fetch(data.resume_url);

        if (!documentResponse.ok) {
          throw new Error("Could not download the resume for viewing.");
        }

        const documentBlob = await documentResponse.blob();

        if (cancelled || !container) return;

        container.replaceChildren();

        if (documentBlob.type === "application/pdf") {
          pdfObjectUrl = URL.createObjectURL(documentBlob);

          const pdfFrame = document.createElement("iframe");
          pdfFrame.src = pdfObjectUrl;
          pdfFrame.title = "Candidate resume PDF";
          pdfFrame.style.width = "100%";
          pdfFrame.style.height = "100%";
          pdfFrame.style.minHeight = "600px";
          pdfFrame.style.border = "none";
          pdfFrame.style.display = "block";

          container.appendChild(pdfFrame);
        } else {
          await renderAsync(documentBlob, container, container, {
            className: "docx-preview",
            inWrapper: true,
            ignoreWidth: false,
            ignoreHeight: false,
            breakPages: true,
          });
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Resume viewer error:", error);

          if (container) {
            container.replaceChildren();

            const message = document.createElement("p");
            message.textContent =
              "The resume could not be displayed. Please try again.";
            message.style.padding = "24px";
            message.style.color = "#b91c1c";

            container.appendChild(message);
          }
        }
      }
    }

    loadResume();

    return () => {
      cancelled = true;

      if (pdfObjectUrl) {
        URL.revokeObjectURL(pdfObjectUrl);
      }
    };
  }, [showResumeViewer, selectedCandidate]);

  const groupedApplications = useMemo(() => {
    const groups = {};

    realApplications.forEach((application) => {
      const jobId = application.job_id || application.jobs?.id || "unknown-job";
      const jobTitle = application.jobs?.title || "Job posting unavailable";

      if (!groups[jobId]) {
        groups[jobId] = {
          title: jobTitle,
          applications: [],
        };
      }

      groups[jobId].applications.push(application);
    });

    Object.values(groups).forEach((group) => {
      group.applications.sort((a, b) => {
        const scoreA = a.ai_score;
        const scoreB = b.ai_score;

        if (scoreA == null && scoreB == null) return 0;
        if (scoreA == null) return 1;
        if (scoreB == null) return -1;

        return scoreB - scoreA;
      });
    });

    return Object.entries(groups);
  }, [realApplications]);

  function toggleJob(jobId) {
    setExpandedJobs((previous) => ({
      ...previous,
      [jobId]: !previous[jobId],
    }));
  }

  function getCandidateName(application) {
    const candidate = application.candidates;

    return candidate
      ? `${candidate.first_name || ""} ${candidate.last_name || ""}`.trim() ||
          "Unnamed candidate"
      : "Unnamed candidate";
  }
  function handleViewCandidateAnalysis(application) {
    setAnalysisCandidate(application);
    onViewAnalysis(application);
  }
  function getResumePreview(application) {
    const resumeText = application.candidates?.resume_text?.trim();

    if (!resumeText) {
      return "No resume description is available for this candidate.";
    }

    return resumeText.length > 240
      ? `${resumeText.slice(0, 240).trim()}…`
      : resumeText;
  }

  return (
    <div className="dashboard candidates-page">
      <section className="welcome-row">
        <div>
          <div className="eyebrow">
            <span className="status-dot" /> TALENT OVERVIEW
          </div>
          <h1>Candidates</h1>
          <p>
            Explore applicants by job posting, compare their AI match scores,
            and review their submitted information.
          </p>
        </div>
      </section>

      <section className="panel candidates-panel">
        <div className="panel-heading">
          <div>
            <h2>Applicants by job</h2>
            <p>Highest AI match scores appear first within each job.</p>
          </div>
        </div>

        {realApplications.length === 0 ? (
          <p className="candidates-empty">
            No applications are available yet.
          </p>
        ) : (
          groupedApplications.map(([jobId, group]) => (
            <section className="candidates-job-group" key={jobId}>
              <button
                type="button"
                className="candidates-job-heading"
                onClick={() => toggleJob(jobId)}
                aria-expanded={Boolean(expandedJobs[jobId])}
              >
                <span className="candidates-job-icon">
                  <Users size={19} />
                </span>

                <span className="candidates-job-title">{group.title}</span>

                <span className="candidates-job-count">
                  {group.applications.length}{" "}
                  {group.applications.length === 1 ? "candidate" : "candidates"}
                </span>

                <ChevronDown
                  className={expandedJobs[jobId] ? "expanded" : ""}
                  size={19}
                />
              </button>

              {expandedJobs[jobId] && (
                <div className="candidates-list">
                  {group.applications.map((application) => {
                    const candidateName = getCandidateName(application);
                    const score = application.ai_score;

                    return (
                      <article
                        className="candidate-card"
                        key={application.id}
                      >
                        <button
                          type="button"
                          className="candidate-card-main"
                          onClick={() => setSelectedCandidate(application)}
                        >
                          <span className="candidate-avatar">
                            <UserRound size={20} />
                          </span>

                          <span className="candidate-card-identity">
                            <strong>{candidateName}</strong>
                            <span>
                              {application.candidates?.email || "No email provided"}
                            </span>
                          </span>

                          <span className="candidate-match">
                            <strong>{score != null ? `${score}%` : "—"}</strong>
                            <span>AI match</span>
                          </span>
                        </button>

                        <div className="candidate-card-actions">
                          <button
                            type="button"
                            className="candidate-secondary-button"
                            onClick={() => setSelectedCandidate(application)}
                          >
                            <FileText size={16} />
                            View details
                          </button>

                          <button
                            type="button"
                            className="candidate-analysis-button"
                            onClick={() => handleViewCandidateAnalysis(application)}
                            disabled={!application.id || analyzingId === application.id}
                          >
                            <Sparkles size={16} />
                            View AI Analysis
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          ))
        )}
      </section>

      {selectedCandidate && (
        <div
          className="candidate-modal-backdrop"
          onClick={() => setSelectedCandidate(null)}
        >
          <section
            className="candidate-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="candidate-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="candidate-modal-close"
              onClick={() => setSelectedCandidate(null)}
              aria-label="Close candidate details"
            >
              ×
            </button>

            <div className="eyebrow">CANDIDATE PROFILE</div>
            <h2 id="candidate-modal-title">
              {getCandidateName(selectedCandidate)}
            </h2>

            <div className="candidate-detail-fields">
              <p>
                <strong>Email</strong>
                <span>
                  {selectedCandidate.candidates?.email || "Not provided"}
                </span>
              </p>

              <p>
                <strong>Phone</strong>
                <span>
                  {selectedCandidate.candidates?.phone || "Not provided"}
                </span>
              </p>

              <p>
                <strong>Applied for</strong>
                <span>
                  {selectedCandidate.jobs?.title || "Job posting unavailable"}
                </span>
              </p>

              <p>
                <strong>Application status</strong>
                <span>
                  {selectedCandidate.stage || selectedCandidate.status || "Not specified"}
                </span>
              </p>

              <p>
                <strong>AI match</strong>
                <span>
                  {selectedCandidate.ai_score != null
                    ? `${selectedCandidate.ai_score}%`
                    : "Not analyzed yet"}
                </span>
              </p>
            </div>

            <div className="candidate-resume-preview">
              <h3>Submitted resume</h3>
              <p>{getResumePreview(selectedCandidate)}</p>
            </div>

            {selectedCandidate.candidates?.resume_url && (
              <button
                type="button"
                className="candidate-resume-link"
                onClick={() => setShowResumeViewer(true)}
              >
                View submitted resume
              </button>
            )}

            <button
              type="button"
              className="candidate-analysis-button candidate-modal-analysis"
              onClick={() => handleViewCandidateAnalysis(selectedCandidate)}
              disabled={
                !selectedCandidate.id ||
                analyzingId === selectedCandidate.id
              }
            >
              <Sparkles size={16} />
              View AI Analysis
            
            </button>
          </section>

          {showResumeViewer && selectedCandidate && (
            <div
              className="resume-viewer-overlay"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="resume-viewer-modal">
                <div className="resume-viewer-header">
                  <h3>Submitted Resume</h3>

                  <button
                    type="button"
                    onClick={() => setShowResumeViewer(false)}
                    aria-label="Close resume viewer"
                  >
                    &times;
                  </button>
                </div>

                <div
                  ref={resumeViewerRef}
                  className="resume-viewer-content"
                />
              </div>
            </div>
          )}
        </div>
      )}
      
      {analysisCandidate && (
        <CandidateAnalysisModal
          application={analysisCandidate}
          analysisResult={selectedAnalysis}
          analyzing={analyzingId === analysisCandidate.id}
          error={analysisError}
          onClose={() => setAnalysisCandidate(null)}
          onAnalyze={() => onAnalyzeApplication(analysisCandidate.id)}
        />
      )}
      
    </div>
  );
}