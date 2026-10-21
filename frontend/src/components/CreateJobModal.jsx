import { X, Plus } from "lucide-react";
import "./style/CreateJobModal.css";

export default function CreateJobModal({
  onClose,
  onCreateJob,
  saving = false,
  error = "",
}) {
  function handleSubmit(event) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    onCreateJob({
      title: formData.get("title").trim(),
      description: formData.get("description").trim(),
      requirements: formData
        .get("requirements")
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean),
    });
  }

  return (
    <div
      className="create-job-overlay"
      onClick={(event) => {
        if (event.target === event.currentTarget && !saving) {
          onClose();
        }
      }}
    >
      <section
        className="create-job-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-job-title"
      >
        <div className="create-job-header">
          <div>
            <div className="eyebrow">NEW OPPORTUNITY</div>
            <h2 id="create-job-title">Create job posting</h2>
            <p>Add the details for your new position.</p>
          </div>

          <button
            type="button"
            className="create-job-close"
            onClick={onClose}
            disabled={saving}
            aria-label="Close job form"
          >
            <X size={19} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <label className="create-job-field">
            Job title
            <input
              name="title"
              type="text"
              placeholder="e.g. Junior Software Developer"
              required
              maxLength={200}
            />
          </label>

          <label className="create-job-field">
            Job description
            <textarea
              name="description"
              placeholder="Describe the role and responsibilities..."
              rows={4}
              required
            />
          </label>

          <label className="create-job-field">
            Requirements
            <textarea
              name="requirements"
              placeholder={"Enter requirements, one per line:\nPython\nSQL\n1 year of experience"}
              rows={4}
            />
            <span className="create-job-hint">
              Enter each requirement on a separate line.
            </span>
          </label>

          {error && (
            <p className="create-job-error" role="alert">
              {error}
            </p>
          )}

          <div className="create-job-actions">
            <button
              type="button"
              className="create-job-cancel"
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
              <Plus size={17} />
              {saving ? "Creating..." : "Create job"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}