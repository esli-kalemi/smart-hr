
import { useState } from "react";
import { ChevronDown, Sparkles, CheckCircle2, AlertTriangle, Lightbulb, X, } from "lucide-react";
import "./style/AIAnalysis.css";

export default function AIAnalysis({
  realApplications,
  analyzingId,
  analysisError,
  analysisSuccess,
  selectedAnalysis,
  handleAnalyzeApplication,
  setSelectedAnalysis,
}) {
  const [expandedJobs, setExpandedJobs] = useState({});

  function toggleJob(jobId) {
    setExpandedJobs((previous) => ({
      ...previous,
      [jobId]: !previous[jobId],
    }));
  }
  return (
    <div className="dashboard ai-analysis-page">
      <section className="welcome-row">
        <div>
          <div className="eyebrow">
            <span className="status-dot" /> SMARTHR INTELLIGENCE
          </div>
          <h1>
            AI Candidate Analysis <span>✦</span>
          </h1>
          <p>
            Compare candidates with job requirements and review their strengths
            and gaps.
          </p>
        </div>
      </section>

      <section className="panel ai-candidates-panel">
        <div className="panel-heading">
          <div>
            <h2>Candidates by job posting</h2>
            <p>Choose a candidate to run or review their AI analysis.</p>
          </div>
        </div>

        {realApplications.length === 0 ? (
          <p className="ai-empty-state">
            No real applications are available to analyze yet.
          </p>
        ) : (
          Object.entries(
            realApplications.reduce((groups, application) => {
              const jobId =
                application.job_id ||
                application.jobs?.id ||
                "unknown-job";

              const jobTitle =
                application.jobs?.title || "Job posting unavailable";

              if (!groups[jobId]) {
                groups[jobId] = {
                  title: jobTitle,
                  applications: [],
                };
              }

              groups[jobId].applications.push(application);

              return groups;
            }, {})
          ).map(([jobId, group]) => (
            <div className="ai-job-group" key={jobId}>
                
            <button
            type="button"
            className="ai-job-heading"
            onClick={() => toggleJob(jobId)}
            aria-expanded={Boolean(expandedJobs[jobId])}
            >
            <div className="ai-job-icon">
                <Sparkles size={18} />
            </div>

            <div className="ai-job-title">
                <h3>{group.title}</h3>
            </div>

            <span className="ai-job-count">
                {group.applications.length}{" "}
                {group.applications.length === 1 ? "candidate" : "candidates"}
            </span>

            <ChevronDown
                className={`ai-job-chevron ${
                expandedJobs[jobId] ? "expanded" : ""
                }`}
                size={20}
            />
            </button>

            {expandedJobs[jobId] && (
              <div className="ai-candidate-list">
                {group.applications.map((application) => {
                  const candidateName = application.candidates
                    ? `${application.candidates.first_name || ""} ${
                        application.candidates.last_name || ""
                      }`.trim()
                    : application.name || "Unnamed candidate";

                  const initials =
                    candidateName
                      .split(/\s+/)
                      .filter(Boolean)
                      .slice(0, 2)
                      .map((part) => part[0].toUpperCase())
                      .join("") || "?";

                  return (
                    <div
                      className="ai-candidate-row"
                      key={application.id}
                    >
                      <div className="ai-candidate-identity">
                        <div className="ai-candidate-avatar">
                          {initials}
                        </div>

                        <div className="ai-candidate-name">
                          <strong>{candidateName}</strong>
                          <span>
                            {application.ai_score != null
                              ? "Analysis available"
                              : "Awaiting analysis"}
                          </span>
                        </div>
                      </div>

                      <div className="ai-candidate-match">
                        <strong>
                          {application.ai_score != null
                            ? `${application.ai_score}%`
                            : "—"}
                        </strong>
                        <span>AI match</span>
                      </div>

                      <button
                        type="button"
                        className="text-button ai-analyze-button"
                        onClick={() =>
                          handleAnalyzeApplication(application.id)
                        }
                        disabled={
                          !application.id ||
                          analyzingId === application.id
                        }
                      >
                        {analyzingId === application.id
                          ? "Analyzing..."
                          : application.ai_score != null
                            ? "Re-analyze"
                            : "Analyze"}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
            </div>
          ))
        )}
      </section>

      {analysisError && (
        <div className="analysis-error" role="alert">
          {analysisError}
        </div>
      )}

      {analysisSuccess && (
        <div className="analysis-success" role="status">
            {analysisSuccess}
        </div>
      )}
        {selectedAnalysis && (
        <section className="panel analysis-results">
            <div className="panel-heading">
            <div>
                <div className="eyebrow">
                <span className="status-dot" /> AI ASSESSMENT
                </div>
                <h2>Analysis Results</h2>
                <p>Candidate assessment against the job requirements</p>
            </div>

            <button
                type="button"
                className="text-button"
                onClick={() => setSelectedAnalysis(null)}
                aria-label="Close analysis results"
            >
                <X size={18} />
                Close
            </button>
            </div>

            <div className="analysis-score-card">
            <div className="analysis-score">
                <span>Overall match</span>
                <strong>
                {selectedAnalysis.ai_score != null
                    ? `${selectedAnalysis.ai_score}%`
                    : "Not available"}
                </strong>
            </div>

            <div className="analysis-score-context">
                <strong>Candidate compatibility</strong>
                <p>
                This score summarizes how the candidate's profile
                matches the job requirements.
                </p>
            </div>
            </div>

            <div className="analysis-summary-card">
            <h3>Summary</h3>
            <p className="analysis-summary">
                {selectedAnalysis.ai_analysis?.summary ||
                "No summary is available."}
            </p>
            </div>

            <div className="analysis-details">
            <div className="analysis-detail-card strengths-card">
                <div className="analysis-detail-heading">
                <CheckCircle2 size={19} />
                <h3>Strengths</h3>
                </div>

                {selectedAnalysis.ai_analysis?.strengths?.length ? (
                <ul>
                    {selectedAnalysis.ai_analysis.strengths.map(
                    (item, index) => (
                        <li key={index}>{item}</li>
                    )
                    )}
                </ul>
                ) : (
                <p>No strengths were returned.</p>
                )}
            </div>

            <div className="analysis-detail-card gaps-card">
                <div className="analysis-detail-heading">
                <AlertTriangle size={19} />
                <h3>Gaps to investigate</h3>
                </div>

                {selectedAnalysis.ai_analysis?.gaps?.length ? (
                <ul>
                    {selectedAnalysis.ai_analysis.gaps.map(
                    (item, index) => (
                        <li key={index}>{item}</li>
                    )
                    )}
                </ul>
                ) : (
                <p>No gaps were returned.</p>
                )}
            </div>

            <div className="analysis-detail-card recommendations-card">
                <div className="analysis-detail-heading">
                <Lightbulb size={19} />
                <h3>Recommendations</h3>
                </div>

                {selectedAnalysis.ai_analysis?.recommendations?.length ? (
                <ul>
                    {selectedAnalysis.ai_analysis.recommendations.map(
                    (item, index) => (
                        <li key={index}>{item}</li>
                    )
                    )}
                </ul>
                ) : (
                <p>No recommendations were returned.</p>
                )}
            </div>
            </div>
        </section>
        )}
    </div>
  );
}