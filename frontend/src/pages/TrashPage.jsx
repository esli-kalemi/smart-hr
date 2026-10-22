
import {
  Trash2,
  BriefcaseBusiness,
  CalendarDays,
  RotateCcw,
} from "lucide-react";
import "./style/TrashPage.css";

export default function TrashPage({
  jobs,
  loading,
  error,
  restoringJobId,
  onRestore,
}) {
  const formatDate = (date) => {
    if (!date) return "Date unavailable";

    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="trash-page">
      <section className="trash-page-header">
        <div>
          <div className="eyebrow">RECRUITMENT WORKSPACE</div>
          <h1>Trash</h1>
          <p>
            View deleted job postings and restore them when needed.
          </p>
        </div>

        <div className="trash-header-icon">
          <Trash2 size={23} />
        </div>
      </section>

      <section className="trash-summary">
        <div className="trash-summary-card">
          <span>Deleted job postings</span>
          <strong>{jobs.length}</strong>
        </div>
      </section>

      {error && (
        <div className="trash-error" role="alert">
          {error}
        </div>
      )}

      {loading ? (
        <section className="trash-empty-state">
          <p>Loading deleted jobs...</p>
        </section>
      ) : jobs.length === 0 ? (
        <section className="trash-empty-state">
          <div className="trash-empty-icon">
            <Trash2 size={27} />
          </div>
          <h2>Trash is empty</h2>
          <p>
            Jobs you delete will appear here, where you can restore them.
          </p>
        </section>
      ) : (
        <section className="trash-jobs-list">
          {jobs.map((job) => (
            <article className="trash-job-card" key={job.id}>
              <div className="trash-job-main">
                <div className="trash-job-icon">
                  <BriefcaseBusiness size={21} />
                </div>

                <div className="trash-job-info">
                  <h2>{job.title}</h2>
                  <p>
                    {job.description || "No description provided."}
                  </p>

                  <span className="trash-job-date">
                    <CalendarDays size={15} />
                    Deleted {formatDate(job.deleted_at)}
                  </span>
                </div>
              </div>

              <button
                type="button"
                className="trash-restore-button"
                onClick={() => onRestore(job)}
                disabled={restoringJobId === job.id}
              >
                <RotateCcw size={16} />
                {restoringJobId === job.id
                  ? "Restoring..."
                  : "Restore"}
              </button>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
