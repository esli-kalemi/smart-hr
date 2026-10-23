
import { useEffect, useMemo, useState } from "react";
import "./style/InterviewsPage.css";

const INTERVIEW_STATUSES = [
  "scheduled",
  "completed",
  "cancelled",
  "rescheduled",
];
const INTERVIEW_TYPES = [
  "HR",
  "Technical",
  "Behavioral",
  "Final",
  "Other",
];

function getRelatedObject(value) {
  return Array.isArray(value) ? value[0] : value;
}

function getCandidateName(interview) {
  const application = getRelatedObject(interview.applications);
  const candidate = getRelatedObject(
    application?.candidates ?? application?.candidate
  );

  if (candidate) {
    const fullName = [candidate.first_name, candidate.last_name]
      .filter(Boolean)
      .join(" ");

    return (
      fullName ||
      candidate.full_name ||
      candidate.name ||
      candidate.email ||
      "Unknown candidate"
    );
  }

  return (
    application?.candidate_name ||
    interview.candidate_name ||
    "Unknown candidate"
  );
}

function getJobTitle(interview) {
  const application = getRelatedObject(interview.applications);
  const job = getRelatedObject(application?.jobs ?? application?.job);

  return (
    job?.title ||
    job?.job_title ||
    application?.job_title ||
    interview.job_title ||
    "Unknown position"
  );
}

function getApplicationId(application) {
  return application.id ?? application.application_id;
}

function getApplicationCandidate(application) {
  const candidate = getRelatedObject(
    application.candidates ?? application.candidate
  );

  if (candidate) {
    const fullName = [candidate.first_name, candidate.last_name]
      .filter(Boolean)
      .join(" ");

    return (
      fullName ||
      candidate.full_name ||
      candidate.name ||
      candidate.email ||
      "Unknown candidate"
    );
  }

  return application.candidate_name || "Unknown candidate";
}

function getApplicationJob(application) {
  const job = getRelatedObject(application.jobs ?? application.job);

  return (
    job?.title ||
    job?.job_title ||
    application.job_title ||
    "Unknown position"
  );
}

function formatDate(dateValue) {
  if (!dateValue) return "Not scheduled";

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) return "Invalid date";

  return date.toLocaleString([], {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function toDateTimeLocal(dateValue) {
  if (!dateValue) return "";

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "";

  const localDate = new Date(
    date.getTime() - date.getTimezoneOffset() * 60000
  );

  return localDate.toISOString().slice(0, 16);
}

function getErrorMessage(error) {
  return error?.message || "Something went wrong. Please try again.";
}

export default function InterviewsPage({
  apiRequest,
  realApplications = [],
}) {
  const [interviewToDelete, setInterviewToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pageError, setPageError] = useState("");
  const [formError, setFormError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editingInterview, setEditingInterview] = useState(null);

  const emptyForm = {
    application_id: "",
    scheduled_at: "",
    type: "HR",
    status: "scheduled",
    notes: "",
  };

  const [formData, setFormData] = useState(emptyForm);

  async function fetchInterviews({ showLoading = true } = {}) 
    {
        if (showLoading) {
            setLoading(true);
            setPageError("");
        }

        try {
            const response = await apiRequest("/interviews/");
            const data = Array.isArray(response)
                ? response
                : response.interviews ?? response.data ?? [];

            setInterviews(data);
            setPageError("");
        } catch (error) {
        setPageError(getErrorMessage(error));
        } finally {
        if (showLoading) {
            setLoading(false);
        }
        }
    }

    useEffect(() => {
        let cancelled = false;

        async function loadInterviews() {
            try {
                const response = await apiRequest("/interviews/");
                const data = Array.isArray(response)
                    ? response
                    : response.interviews ?? response.data ?? [];

                if (!cancelled) {
                    setInterviews(data);
                    setPageError("");
                }
            } catch (error) {
                if (!cancelled) {
                    setPageError(getErrorMessage(error));
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        loadInterviews();

        return () => {
            cancelled = true;
        };
    }, [apiRequest]);

  const now = new Date();

  const upcomingCount = interviews.filter((interview) => {
    const scheduledAt = new Date(interview.scheduled_at);

    return (
      !Number.isNaN(scheduledAt.getTime()) &&
      scheduledAt > now &&
      !["completed", "cancelled"].includes(
        (interview.status || "").toLowerCase()
      )
    );
  }).length;

  const completedCount = interviews.filter(
    (interview) => (interview.status || "").toLowerCase() === "completed"
  ).length;

  const filteredInterviews = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    return interviews.filter((interview) => {
      const matchesStatus =
        statusFilter === "all" ||
        (interview.status || "").toLowerCase() === statusFilter;

      const searchableText = [
        getCandidateName(interview),
        getJobTitle(interview),
        interview.type,
        interview.status,
        interview.notes,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return matchesStatus && searchableText.includes(searchValue);
    });
  }, [interviews, search, statusFilter]);

  function openCreateForm() {
    setEditingInterview(null);
    setFormData({
      ...emptyForm,
      application_id: realApplications[0]
        ? String(getApplicationId(realApplications[0]))
        : "",
    });
    setFormError("");
    setShowForm(true);
  }

  function openEditForm(interview) {
    const application = getRelatedObject(interview.applications);

    setEditingInterview(interview);
    setFormData({
      application_id: String(
        interview.application_id ?? application?.id ?? ""
      ),
      scheduled_at: toDateTimeLocal(interview.scheduled_at),
      type: interview.type || "HR",
      status: interview.status || "scheduled",
      notes: interview.notes || "",
    });
    setFormError("");
    setShowForm(true);
  }

  function closeForm() {
    if (saving) return;

    setShowForm(false);
    setEditingInterview(null);
    setFormData(emptyForm);
    setFormError("");
  }

  function handleInputChange(event) {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError("");

    if (!formData.application_id && !editingInterview) {
      setFormError("Please select an application.");
      return;
    }

    if (!formData.scheduled_at) {
      setFormError("Please choose a date and time.");
      return;
    }

    if (
        !editingInterview &&
        new Date(formData.scheduled_at) <= new Date()
    ) {
        setFormError("Please choose a date and time in the future.");
        return;
    }

    const payload = {
      scheduled_at: new Date(formData.scheduled_at).toISOString(),
      type: formData.type,
      status: formData.status,
      notes: formData.notes.trim() || null,
    };

    if (!editingInterview) {
      payload.application_id = formData.application_id;
    }

    setSaving(true);

    try {
      if (editingInterview) {
        await apiRequest(`/interviews/${editingInterview.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      } else {
        await apiRequest("/interviews/", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }

      setShowForm(false);
      setEditingInterview(null);
      setFormData(emptyForm);
      await fetchInterviews();
    } catch (error) {
      setFormError(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }
  
async function handleDeleteInterview() {
  if (!interviewToDelete) return;

  setDeleting(true);
  setDeleteError("");

  try {
    await apiRequest(`/interviews/${interviewToDelete.id}`, {
      method: "DELETE",
    });

    setInterviews((previous) =>
      previous.filter(
        (interview) => interview.id !== interviewToDelete.id
      )
    );

    setInterviewToDelete(null);
  } catch (error) {
    setDeleteError(getErrorMessage(error));
  } finally {
    setDeleting(false);
  }
}
  return (
    <main className="interviews-page">
      <header className="interviews-header">
        <div>
          <h1>Interviews</h1>
          <p>Schedule interviews and track your hiring process.</p>
        </div>

        <button
          type="button"
          className="interviews-primary-button"
          onClick={openCreateForm}
        >
          + Schedule interview
        </button>
      </header>

      <section className="interviews-summary">
        <article className="interview-summary-card">
          <div className="interview-summary-icon total-icon">▤</div>
          <div>
            <p>Total interviews</p>
            <h2>{interviews.length}</h2>
            <span>All interview statuses</span>
          </div>
        </article>

        <article className="interview-summary-card">
          <div className="interview-summary-icon upcoming-icon">◷</div>
          <div>
            <p>Upcoming interviews</p>
            <h2>{upcomingCount}</h2>
            <span>Future scheduled interviews</span>
          </div>
        </article>

        <article className="interview-summary-card">
          <div className="interview-summary-icon completed-icon">✓</div>
          <div>
            <p>Completed interviews</p>
            <h2>{completedCount}</h2>
            <span>Successfully completed</span>
          </div>
        </article>
      </section>

      <section className="interviews-content">
        <div className="interviews-toolbar">
          <div>
            <h2>All interviews</h2>
            <p>Manage candidate interview sessions.</p>
          </div>

          <div className="interviews-filters">
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search candidate or job..."
              aria-label="Search interviews"
            />

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              aria-label="Filter interviews by status"
            >
              <option value="all">All statuses</option>
              {INTERVIEW_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {pageError && (
          <div className="interviews-error" role="alert">
            {pageError}
            <button type="button" onClick={fetchInterviews}>
              Retry
            </button>
          </div>
        )}

        {loading ? (
          <div className="interviews-state">Loading interviews...</div>
        ) : filteredInterviews.length === 0 ? (
          <div className="interviews-empty">
            <div className="interviews-empty-icon">▤</div>
            <h3>
              {interviews.length === 0
                ? "No interviews yet"
                : "No matching interviews"}
            </h3>
            <p>
              {interviews.length === 0
                ? "Schedule an interview for one of your applications to get started."
                : "Try changing your search or status filter."}
            </p>

            {interviews.length === 0 && (
              <button
                type="button"
                className="interviews-primary-button"
                onClick={openCreateForm}
              >
                Schedule your first interview
              </button>
            )}
          </div>
        ) : (
          <div className="interviews-table-wrapper">
            <table className="interviews-table">
              <thead>
                <tr>
                  <th>Candidate</th>
                  <th>Job position</th>
                  <th>Date and time</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredInterviews.map((interview) => (
                  <tr key={interview.id}>
                    <td>
                      <div className="interview-candidate-cell">
                        <div className="interview-avatar">
                          {getCandidateName(interview)
                            .charAt(0)
                            .toUpperCase()}
                        </div>
                        <span>{getCandidateName(interview)}</span>
                      </div>
                    </td>

                    <td>{getJobTitle(interview)}</td>
                    <td>{formatDate(interview.scheduled_at)}</td>
                    <td>
                      <span className="interview-type">
                        {interview.type || "Not specified"}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`interview-status status-${(
                          interview.status || "scheduled"
                        )
                          .toLowerCase()
                          .replace(/\s+/g, "-")}`}
                      >
                        {interview.status || "scheduled"}
                      </span>
                    </td>
                    <td>
                        <div className="interview-row-actions">
                            <button
                                type="button"
                                className="interview-edit-button"
                                onClick={() => openEditForm(interview)}
                            >
                                Edit
                            </button>

                            <button
                                type="button"
                                className="interview-delete-button"
                                onClick={() => {
                                setDeleteError("");
                                setInterviewToDelete(interview);
                               }}
                            >
                                Delete
                            </button>
                        </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && filteredInterviews.length > 0 && (
          <div className="interviews-list-footer">
            Showing {filteredInterviews.length} of {interviews.length} interviews
          </div>
        )}
      </section>

      {showForm && (
        <div
          className="interview-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeForm();
          }}
        >
          <section
            className="interview-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="interview-form-title"
          >
            <header className="interview-modal-header">
              <div>
                <h2 id="interview-form-title">
                  {editingInterview ? "Edit interview" : "Schedule interview"}
                </h2>
                <p>
                  {editingInterview
                    ? "Update the interview details below."
                    : "Choose an application and set up the interview."}
                </p>
              </div>

              <button
                type="button"
                className="interview-modal-close"
                onClick={closeForm}
                disabled={saving}
                aria-label="Close form"
              >
                ×
              </button>
            </header>

            <form className="interview-form" onSubmit={handleSubmit}>
              {!editingInterview && (
                <label>
                  Application <span className="required-star">*</span>
                  <select
                    name="application_id"
                    value={formData.application_id}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select an application</option>
                    {realApplications
                        .filter(
                            (application) => (application.stage || "").trim().toLowerCase() === "interview"
                        )
                        .map((application) => {
                            const applicationId = getApplicationId(application);

                            if (!applicationId) return null;

                            return (
                                <option
                                key={applicationId}
                                value={applicationId}
                                >
                                {getApplicationCandidate(application)} —{" "}
                                {getApplicationJob(application)}
                                </option>
                            );
                        })}
                  </select>

                  {!realApplications.some(
                    (application) => (application.stage || "").trim().toLowerCase() === "interview"
                    ) && (
                    <small>
                        No applications are currently at the Interview stage.
                        Update an application's status on the Applications page first.
                    </small>
                  )}
                </label>
              )}

              <label>
                Date and time <span className="required-star">*</span>
                <input
                  type="datetime-local"
                  name="scheduled_at"
                  value={formData.scheduled_at}
                  onChange={handleInputChange}
                  min={toDateTimeLocal(new Date())}
                  required
                />
              </label>

              <div className="interview-form-row">
                <label>
                  Interview type
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    required
                  >
                    {INTERVIEW_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Status
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    required
                  >
                    {INTERVIEW_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label>
                Notes
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  placeholder="Add interview instructions or notes..."
                  rows={4}
                />
              </label>

              {formError && (
                <div className="interviews-error" role="alert">
                  {formError}
                </div>
              )}

              <footer className="interview-form-actions">
                <button
                  type="button"
                  className="interview-secondary-button"
                  onClick={closeForm}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="interviews-primary-button"
                  disabled={
                    saving ||
                    (!editingInterview && 
                        !realApplications.some(
                            (application)=>
                                (application.stage || "").trim().toLowerCase() ==="interview")
                    )}
                >
                  {saving
                    ? "Saving..."
                    : editingInterview
                      ? "Save changes"
                      : "Schedule interview"}
                </button>
              </footer>
            </form>
          </section>
        </div>
      )}
      
      {interviewToDelete && (
        <div
            className="interview-modal-backdrop"
            onMouseDown={(event) => {
            if (event.target === event.currentTarget && !deleting) {
                setInterviewToDelete(null);
                setDeleteError("");
            }
            }}
        >
            <section
            className="interview-delete-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-interview-title"
            >
            <div className="interview-delete-icon">!</div>

            <h2 id="delete-interview-title">Delete interview?</h2>

            <p>
                Are you sure you want to permanently delete the interview with{" "}
                <strong>{getCandidateName(interviewToDelete)}</strong>?
                This action cannot be undone.
            </p>

            {deleteError && (
                <div className="interviews-error" role="alert">
                {deleteError}
                </div>
            )}

            <div className="interview-delete-actions">
                <button
                type="button"
                className="interview-secondary-button"
                onClick={() => {
                    setInterviewToDelete(null);
                    setDeleteError("");
                }}
                disabled={deleting}
                >
                Cancel
                </button>

                <button
                type="button"
                className="interview-confirm-delete-button"
                onClick={handleDeleteInterview}
                disabled={deleting}
                >
                {deleting ? "Deleting..." : "Delete interview"}
                </button>
            </div>
            </section>
        </div>
      )}
    </main>
  );
}
