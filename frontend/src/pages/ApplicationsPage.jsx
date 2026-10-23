
import { useEffect, useMemo, useState } from "react";
import { Search, Users, Clock3, CheckCircle2 } from "lucide-react";
import "./style/ApplicationsPage.css";
import CandidateAnalysisModal from "../components/CandidateAnalysisModal";
export default function ApplicationsPage({
  realApplications = [],
  onUpdateApplication,
  onViewAnalysis,
  analyzingId,
  selectedAnalysis,
  analysisError,
  onAnalyzeApplication,
  onCloseAnalysis,
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStage, setSelectedStage] = useState("all");
  const [notification, setNotification] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  const applications = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return realApplications.filter((application) => {
        const candidateName = [
        application.candidates?.first_name,
        application.candidates?.last_name,
        ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

        const jobTitle = (
        application.jobs?.title || ""
        ).toLowerCase();

        const matchesSearch =
        !search ||
        candidateName.includes(search) ||
        jobTitle.includes(search);

        const stage = (application.stage || "new").toLowerCase();

        const matchesStage =
        selectedStage === "all" ||
        stage === selectedStage.toLowerCase();

        return matchesSearch && matchesStage;
    });
  }, [realApplications, searchTerm, selectedStage]);


  const shortlistedCount = realApplications.filter(
    (application) =>
      (application.stage || "").toLowerCase() === "shortlisted"
  ).length;

  const reviewingCount = realApplications.filter((application) =>
    ["reviewing", "under_review"].includes(
      (application.stage || "").toLowerCase()
    )
  ).length;
  useEffect(() => {
    if (!notification) return;

    const timeoutId = setTimeout(() => {
        setNotification(null);
    }, 2000);

    return () => clearTimeout(timeoutId);
  }, [notification]);
  async function handleStageChange(applicationId, newStage) {
    setUpdatingId(applicationId);
    setNotification(null);

    try {
        await onUpdateApplication(applicationId, { stage: newStage });

        setNotification({
        type: "success",
        message: "Application stage updated successfully.",
        });
    } catch (error) {
        setNotification({
        type: "error",
        message: error.message || "Could not update the application stage.",
        });
    } finally {
        setUpdatingId(null);
    }
  }

  return (
    <div className="applications-page">
      <header className="applications-header">
        <div>
          <span className="eyebrow">RECRUITMENT</span>
          <h1>Applications</h1>
          <p>Review candidates and manage their recruitment progress.</p>
        </div>
      </header>
      
      {notification && (
        <div
            className={`application-notification ${notification.type}`}
            role="status"
        >
            <span>{notification.message}</span>
            <button
            type="button"
            onClick={() => setNotification(null)}
            aria-label="Dismiss notification"
            >
            ×
            </button>
        </div>
      )}

      <section className="applications-stats">
        <article className="application-stat-card">
          <div className="application-stat-icon">
            <Users size={20} />
          </div>
          <div>
            <p>Total applications</p>
            <h2>{realApplications.length}</h2>
          </div>
        </article>

        <article className="application-stat-card">
          <div className="application-stat-icon">
            <Clock3 size={20} />
          </div>
          <div>
            <p>Under review</p>
            <h2>{reviewingCount}</h2>
          </div>
        </article>

        <article className="application-stat-card">
          <div className="application-stat-icon">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <p>Shortlisted</p>
            <h2>{shortlistedCount}</h2>
          </div>
        </article>
      </section>

      <section className="applications-panel">
        <div className="applications-toolbar">
          <div>
            <h2>All applications</h2>
            <p>Manage candidate status and review AI match scores.</p>
          </div>

          <div className="applications-filters">
            <label className="applications-search">
              <Search size={17} />
              <input
                type="search"
                placeholder="Search candidates or jobs..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </label>

            <select
              aria-label="Filter by recruitment stage"
              value={selectedStage}
              onChange={(event) => setSelectedStage(event.target.value)}
            >
              <option value="all">All stages</option>
              <option value="new">New</option>
              <option value="applied">Applied</option>
              <option value="reviewing">Reviewing</option>
              <option value="shortlisted">Shortlisted</option>
              <option value="interview">Interview</option>
              <option value="offer">Offer</option>
              <option value="hired">Hired</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        <div className="applications-table-wrapper">
          <table className="applications-table">
            <thead>
              <tr>
                <th>Candidate</th>
                <th>Job</th>
                <th>Applied</th>
                <th>AI match</th>
                <th>Stage</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {applications.map((application) => {
                const candidate = application.candidates || {};
                const name =
                  `${candidate.first_name || ""} ${candidate.last_name || ""}`.trim() ||
                  "Unnamed candidate";

                const stage = application.stage || "new";

                return (
                  <tr key={application.id}>
                    <td>
                      <div className="application-candidate">
                        <div className="application-avatar">
                          {name
                            .split(" ")
                            .map((part) => part[0])
                            .join("")
                            .slice(0, 2)
                            .toUpperCase()}
                        </div>
                        <div>
                          <strong>{name}</strong>
                          <span>{candidate.email || "No email"}</span>
                        </div>
                      </div>
                    </td>

                    <td>{application.jobs?.title || "Job unavailable"}</td>

                    <td>
                      {application.applied_at
                        ? new Date(application.applied_at).toLocaleDateString()
                        : "—"}
                    </td>

                    <td>
                      {application.ai_score != null
                        ? `${application.ai_score}%`
                        : "Not analyzed"}
                    </td>

                    <td>
                      <select
                        aria-label={`Stage for ${name}`}
                        value={stage}
                        onChange={(event) =>
                         handleStageChange(application.id, event.target.value)
                         }
                        disabled={updatingId === application.id}
                      >
                        <option value="new">New</option>
                        <option value="applied">Applied</option>
                        <option value="reviewing">Reviewing</option>
                        <option value="shortlisted">Shortlisted</option>
                        <option value="interview">Interview</option>
                        <option value="offer">Offer</option>
                        <option value="hired">Hired</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </td>

                    <td>
                      <button
                        type="button"
                        className="application-analysis-button"
                        onClick={() => onViewAnalysis?.(application)}
                      >
                        View AI analysis
                      </button>
                    </td>
                  </tr>
                );
              })}

              {applications.length === 0 && (
                <tr>
                  <td colSpan={6} className="applications-empty">
                    No applications match your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <footer className="applications-footer">
          Showing {applications.length} of {realApplications.length} applications
        </footer>
      </section>
      {selectedAnalysis && (
        <CandidateAnalysisModal
            application={
            realApplications.find(
                (application) => application.id === selectedAnalysis.id
            ) || selectedAnalysis
            }
            analysisResult={
            selectedAnalysis.application_id
                ? selectedAnalysis
                : null
            }
            analyzing={analyzingId === selectedAnalysis.id}
            error={analysisError}
            onClose={onCloseAnalysis}
            onAnalyze={() =>
            onAnalyzeApplication(selectedAnalysis.id)
            }
        />
        )}
    </div>
  );
}
