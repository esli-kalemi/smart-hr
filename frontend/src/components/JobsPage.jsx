import { BriefcaseBusiness, Plus, CalendarDays } from "lucide-react";
import "./JobsPage.css";

export default function JobsPage({
  jobs,
  onCreateJob,
  onOpenJob,
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
    <div className="jobs-page">
      <section className="jobs-page-header">
        <div>
          <div className="eyebrow">RECRUITMENT WORKSPACE</div>
          <h1>Job postings</h1>
          <p>Manage your company's open roles and draft positions.</p>
        </div>

        <button
          type="button"
          className="primary-button"
          onClick={onCreateJob}
        >
          <Plus size={18} />
          Create job posting
        </button>
      </section>

      <section className="jobs-summary">
        <div className="jobs-summary-card">
          <span>Total jobs</span>
          <strong>{jobs.length}</strong>
        </div>

        <div className="jobs-summary-card">
          <span>Active jobs</span>
          <strong>
            {jobs.filter((job) => job.status === "active").length}
          </strong>
        </div>

        <div className="jobs-summary-card">
          <span>Drafts</span>
          <strong>
            {jobs.filter((job) => job.status === "draft").length}
          </strong>
        </div>
      </section>

      {jobs.length === 0 ? (
        <section className="jobs-empty-state">
          <div className="jobs-empty-icon">
            <BriefcaseBusiness size={26} />
          </div>
          <h2>No job postings yet</h2>
          <p>Create your first job posting to start organizing your hiring.</p>
          <button
            type="button"
            className="primary-button"
            onClick={onCreateJob}
          >
            <Plus size={18} />
            Create your first job
          </button>
        </section>
      ) : (
        <section className="jobs-list">
          {jobs.map((job) => (
            <article
                className="job-card"
                key={job.id}
                role="button"
                tabIndex={0}
                onClick={() => onOpenJob(job)}
                onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onOpenJob(job);
                    }
                }}
                aria-label={`Open ${job.title} job posting`}
            >              
                <div className="job-card-main">
                <div className="job-card-icon">
                  <BriefcaseBusiness size={21} />
                </div>

                <div className="job-card-info">
                  <h2>{job.title}</h2>
                  <p>{job.description || "No description provided."}</p>

                  <span className="job-card-date">
                    <CalendarDays size={15} />
                    Created {formatDate(job.created_at)}
                  </span>
                </div>
              </div>

              <span
                className={`job-status job-status-${(
                  job.status || "draft"
                ).toLowerCase()}`}
              >
                {job.status || "draft"}
              </span>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}