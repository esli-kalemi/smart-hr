
import { useState } from "react";
import { X, Plus } from "lucide-react";
import "./style/CreateJobModal.css";

const PRIORITY_FIELDS = [
  { key: "skills", label: "Skills" },
  { key: "experience", label: "Experience" },
  { key: "education", label: "Education" },
  { key: "certifications", label: "Certifications" },
  { key: "soft_skills", label: "Soft skills" },
];

const INITIAL_WEIGHTS = {
  skills: "",
  experience: "",
  education: "",
  certifications: "",
  soft_skills: "",
};

export default function CreateJobModal({
  onClose,
  onCreateJob,
  saving = false,
  error = "",
}) {
  const [weights, setWeights] = useState(INITIAL_WEIGHTS);

  const totalWeight = Object.values(weights).reduce(
    (total, weight) => total + (Number(weight) || 0),
    0
  );

  const allWeightsEntered = Object.values(weights).every(
    (weight) => weight !== ""
  );

  function handleWeightChange(key, value) {
    if (value === "") {
      setWeights((current) => ({
        ...current,
        [key]: "",
      }));
      return;
    }

    const parsedValue = Number(value);

    if (Number.isFinite(parsedValue)) {
      setWeights((current) => ({
        ...current,
        [key]: Math.min(100, Math.max(0, parsedValue)),
      }));
    }
  }

  function handleSubmit(event) {
    event.preventDefault();

    if (!allWeightsEntered || totalWeight !== 100) {
      return;
    }

    const formData = new FormData(event.currentTarget);

    onCreateJob({
      title: formData.get("title").trim(),
      description: formData.get("description").trim(),
      requirements: formData
        .get("requirements")
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean),
      priority_weights: Object.fromEntries(
        Object.entries(weights).map(([key, value]) => [
          key,
          Number(value),
        ])
      ),
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
              placeholder={
                "Enter requirements, one per line:\nPython\nSQL\n1 year of experience"
              }
              rows={4}
            />
            <span className="create-job-hint">
              Enter each requirement on a separate line.
            </span>
          </label>

          <div className="create-job-priorities">
            <div className="create-job-priorities-heading">
              <h3>Candidate Matching Priorities</h3>
              <p>
                Enter the percentage each category should contribute to
                the candidate's match score. The total must equal 100%.
              </p>
            </div>

            {PRIORITY_FIELDS.map(({ key, label }) => (
              <label className="create-job-priority" key={key}>
                <span>{label}</span>

                <div className="create-job-priority-control">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    value={weights[key]}
                    onChange={(event) =>
                      handleWeightChange(key, event.target.value)
                    }
                    onWheel={(event) => event.currentTarget.blur()}
                    aria-label={`${label} priority percentage`}
                    disabled={saving}
                    required
                  />
                  <span>%</span>
                </div>
              </label>
            ))}

            <div
              className={`create-job-priority-total ${
                totalWeight > 100
                  ? "is-invalid"
                  : totalWeight === 100 && allWeightsEntered
                    ? "is-valid"
                    : ""
              }`}
              aria-live="polite"
            >
              <span>Total allocation</span>
              <strong>{totalWeight}%</strong>
            </div>

            {totalWeight > 100 && (
              <p className="create-job-error" role="alert">
                The total exceeds 100%. Please reduce one or more
                priorities.
              </p>
            )}

            {totalWeight < 100 && (
              <p className="create-job-hint">
                {allWeightsEntered
                  ? `You have allocated ${totalWeight}%. Add ${100 - totalWeight}% to reach 100%.`
                  : `You have allocated ${totalWeight}%. Fill in all five fields and reach 100%.`}
              </p>
            )}

            {totalWeight === 100 && allWeightsEntered && (
              <p className="create-job-priority-success">
                All priorities add up to 100%.
              </p>
            )}
          </div>

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
              disabled={
                saving ||
                !allWeightsEntered ||
                totalWeight !== 100
              }
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