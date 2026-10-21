import { X, Save, BriefcaseBusiness } from "lucide-react";
import "./style/JobDetailsModal.css";
import { useState } from "react";
export default function JobDetailsModal({
  job,
  onClose,
  onSave,
  onDelete,
  saving = false,
  deleting = false,
  error = "",
}) {
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  function handleSubmit(event) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    onSave({
      title: formData.get("title").trim(),
      description: formData.get("description").trim(),
      requirements: {
        ...(job.requirements &&
        typeof job.requirements === "object"
          ? job.requirements
          : {}),
        skills: formData
          .get("requirements")
          .split("\n")
          .map((item) => item.trim())
          .filter(Boolean),
      },
      status: formData.get("status"),
    });
  }

  const currentStatus = job.status || "draft";
  
  return (
    <div
      className="job-details-overlay"
      onClick={(event) => {
        if (
          event.target === event.currentTarget &&
          !saving
        ) {
          onClose();
        }
      }}
    >
      <section
        className="job-details-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="job-details-title"
      >
        <header className="job-details-header">
          <div className="job-details-heading">
            <div className="job-details-icon">
              <BriefcaseBusiness size={22} />
            </div>

            <div>
              <span className="eyebrow">
                JOB POSTING
              </span>
              <h2 id="job-details-title">
                Edit job posting
              </h2>
              <p>
                Update the position details and status.
              </p>
            </div>
          </div>

          <button
            type="button"
            className="job-details-close"
            onClick={onClose}
            disabled={saving}
            aria-label="Close job details"
          >
            <X size={19} />
          </button>
        </header>

        <form onSubmit={handleSubmit}>
          <label className="job-details-field">
            Job title
            <input
              name="title"
              type="text"
              defaultValue={job.title || ""}
              maxLength={200}
              required
            />
          </label>

          <label className="job-details-field">
            Job description
            <textarea
              name="description"
              defaultValue={job.description || ""}
              rows={5}
              required
            />
          </label>

          <label className="job-details-field">
            Requirements
            <textarea
              name="requirements"
              defaultValue={Array.isArray(
                job.requirements?.skills
              )
                ? job.requirements.skills.join("\n")
                : ""}
              rows={4}
              placeholder={
                "Enter one requirement per line:\nPython\nSQL\nCommunication"
              }
            />
            <span className="job-details-hint">
              Enter one requirement per line.
            </span>
          </label>

          <label className="job-details-field">
            Posting status
            <select
              name="status"
              defaultValue={currentStatus}
            >
              <option value="draft">
                Draft — not active
              </option>
              <option value="active">
                Active — open for recruitment
              </option>
            </select>
          </label>

          {error && (
            <p className="job-details-error" role="alert">
              {error}
            </p>
          )}

          <footer className="job-details-actions">
             <button
                type="button"
                className="job-details-delete"
                onClick={() => setShowDeleteConfirmation(true)}
                disabled={saving}
            >
                Delete job
            </button>
            <button
              type="button"
              className="job-details-cancel"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="primary-button"
              disabled={saving}
            >
              <Save size={17} />
              {saving ? "Saving..." : "Save changes"}
            </button>
          </footer>
        </form>
      </section>

      {showDeleteConfirmation && (
        <div className="job-delete-overlay">
            <section
            className="job-delete-dialog"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-job-title"
            >
            <h2 id="delete-job-title">Move job to Trash?</h2>
            <p>
                This job posting will be moved to Trash, where you can
                restore it later.
            </p>

            <div className="job-delete-actions">
                <button
                type="button"
                onClick={() => setShowDeleteConfirmation(false)}
                >
                Cancel
                </button>

                <button
                type="button"
                className="job-details-delete"
                onClick={onDelete}
                disabled={deleting || saving}
                >
                    {deleting ? "Moving to Trash..." : "Move to Trash"}
                </button>
            </div>
            </section>
        </div>
      )}
    </div>
  );
}