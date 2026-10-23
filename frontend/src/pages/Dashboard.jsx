
import {
  BriefcaseBusiness,
  Users,
  FileText,
  CalendarDays,
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  Sparkles,
} from "lucide-react";

function StatCard({ icon: Icon, label, value, change, color, progress }) {
  return (
    <article className="stat-card">
      <div className="stat-top">
        <div className={`stat-icon ${color}`}>
          <Icon size={20} />
        </div>
        <span className="stat-trend">
          <ArrowUpRight size={14} /> {change}
        </span>
      </div>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      <div className="stat-progress">
        <div
          className={`stat-progress-fill ${color}`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </article>
  );
}

function PipelineRow({ label, count, total, color }) {
  return (
    <div className="pipeline-row">
      <div className="pipeline-label">
        <span><i className={color} />{label}</span>
        <strong>{count}</strong>
      </div>
      <div className="pipeline-track">
        <div
          className={color}
          style={{ width: `${total > 0 ? (count / total) * 100 : 0}%` }}
        />
      </div>
    </div>
  );
}

export default function Dashboard({
  user,
  jobs = [],
  realApplications = [],
  mockApplications = [],
  interviews = [],
  setActivePage,
}) {
  const applications =
    realApplications.length > 0 ? realApplications : mockApplications;
  const scheduledInterviews = interviews.filter(
    (interview) =>
        (interview.status || "scheduled").toLowerCase() === "scheduled"
  );

  const upcomingInterviews = scheduledInterviews.filter(
    (interview) => new Date(interview.scheduled_at) >= new Date()
  );
  return (
    <div className="dashboard">
      <section className="welcome-row">
        <div>
          <div className="eyebrow">
            <span className="status-dot" /> RECRUITMENT OVERVIEW
          </div>
          <h1>Good morning, {user?.name || "Admin"} <span>✦</span></h1>
          <p>Here's what's happening with your hiring today.</p>
        </div>
      </section>

      <section className="stats-grid">
        <StatCard
          icon={BriefcaseBusiness}
          label="Active job postings"
          value={jobs.filter((job) => job.status === "active").length.toString()}
          change={`${jobs.length} total jobs`}
          color="violet"
          progress={72}
        />

        <StatCard
          icon={Users}
          label="Candidates in applications"
          value={new Set(
            realApplications
              .map((application) => application.candidate_id)
              .filter(Boolean)
          ).size.toString()}
          change={`${realApplications.length} total applications`}
          color="blue"
          progress={83}
        />

        <StatCard
          icon={FileText}
          label="Applications this month"
          value={realApplications.filter((application) => {
            if (!application.applied_at) return false;

            const appliedDate = new Date(application.applied_at);
            const today = new Date();

            return (
              appliedDate.getMonth() === today.getMonth() &&
              appliedDate.getFullYear() === today.getFullYear()
            );
          }).length.toString()}
          change={`${realApplications.length} total applications`}
          color="orange"
          progress={58}
        />

        <StatCard
          icon={CalendarDays}
          label="Interviews scheduled"
          value={scheduledInterviews.length.toString()}
          change={`${upcomingInterviews.length} upcoming`}
          color="green"
          progress={45}
        />
      </section>

      <section className="content-grid">
        <div className="panel applications-panel">
          <div className="panel-heading">
            <div>
              <h2>Recent applications</h2>
              <p>Review and manage your latest candidates.</p>
            </div>

            <button
              type="button"
              className="text-button"
              onClick={() => setActivePage("Candidates")}
            >
              View all <ArrowUpRight size={16} />
            </button>
          </div>

          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Candidate</th>
                  <th>Applied for</th>
                  <th>AI match</th>
                  <th>Status</th>
                  <th>Applied</th>
                </tr>
              </thead>

              <tbody>
                {applications.map((application, index) => {
                  const candidateName = application.candidates
                    ? `${application.candidates.first_name || ""} ${
                        application.candidates.last_name || ""
                      }`.trim()
                    : application.name || "Candidate";

                  const stage = application.stage || application.status || "new";

                  const score =
                    application.ai_score != null
                      ? application.ai_score
                      : application.score;

                  return (
                    <tr key={application.id || application.name || index}>
                      <td>
                        <div className="candidate-cell">
                          <div
                            className={`candidate-avatar ${
                              application.color || "purple"
                            }`}
                          >
                            {application.candidates
                              ? `${application.candidates.first_name?.[0] || ""}${
                                  application.candidates.last_name?.[0] || ""
                                }`.toUpperCase()
                              : application.initials ||
                                candidateName.slice(0, 2).toUpperCase()}
                          </div>

                          <strong>{candidateName}</strong>
                        </div>
                      </td>

                      <td>
                        {application.jobs?.title || application.role || "—"}
                      </td>

                      <td>
                        <div className="match-cell">
                          <div className="match-track">
                            <div
                              className="match-fill"
                              style={{
                                width: `${score != null ? score : 0}%`,
                              }}
                            />
                          </div>
                          <strong>
                            {score != null ? `${score}%` : "—"}
                          </strong>
                        </div>
                      </td>

                      <td>
                        <span
                          className={`status-pill ${stage.toLowerCase()}`}
                        >
                          {["shortlisted", "Shortlisted"].includes(stage) ? (
                            <CheckCircle2 size={13} />
                          ) : ["reviewing", "Reviewing"].includes(stage) ? (
                            <Clock3 size={13} />
                          ) : null}

                          {stage.charAt(0).toUpperCase() +
                            stage.slice(1).replaceAll("_", " ")}
                        </span>
                      </td>

                      <td className="date-cell">
                        {application.applied_at
                          ? new Date(application.applied_at).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              }
                            )
                          : application.date || "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="panel-footer">
            {`Showing ${applications.length} recent applications`}

            <button
              type="button"
              className="text-button"
              onClick={() => setActivePage("Applications")}
            >
              View all applications <ArrowUpRight size={15} />
            </button>
          </div>
        </div>

        <aside className="right-column">
          <div className="panel hiring-panel">
            <div className="panel-heading compact">
              <div>
                <h2>Hiring pipeline</h2>
                <p>Candidate progress</p>
              </div>
              <button
                type="button"
                className="more-button"
                aria-label="More options"
              >
                ···
              </button>
            </div>

            <div className="pipeline-total">
              <strong>{realApplications.length}</strong>
              <span>applications in pipeline</span>
            </div>

            <div className="pipeline-bars">
              <PipelineRow
                label="New applicants"
                count={realApplications.filter((app) =>
                  ["new", "applied"].includes((app.stage || "").toLowerCase())
                ).length}
                total={realApplications.length}
                color="pipeline-violet"
              />

              <PipelineRow
                label="Under review"
                count={realApplications.filter((app) =>
                  ["reviewing", "under_review"].includes(
                    (app.stage || "").toLowerCase()
                  )
                ).length}
                total={realApplications.length}
                color="pipeline-blue"
              />

              <PipelineRow
                label="Shortlisted"
                count={realApplications.filter(
                  (app) => (app.stage || "").toLowerCase() === "shortlisted"
                ).length}
                total={realApplications.length}
                color="pipeline-orange"
              />

              <PipelineRow
                label="Interview"
                count={realApplications.filter((app) =>
                  ["interview", "interview_scheduled"].includes(
                    (app.stage || "").toLowerCase()
                  )
                ).length}
                total={realApplications.length}
                color="pipeline-green"
              />

              <PipelineRow
                label="Offer sent"
                count={realApplications.filter((app) =>
                  ["offer", "offer_sent"].includes(
                    (app.stage || "").toLowerCase()
                  )
                ).length}
                total={realApplications.length}
                color="pipeline-dark"
              />
            </div>

            <div className="ai-card">
              <div className="ai-card-icon">
                <Sparkles size={21} />
              </div>
              <div className="ai-card-label">SMARTHR INTELLIGENCE</div>
              <h3>Let AI do the heavy lifting.</h3>
              <p>
                Compare resumes with job requirements and discover your
                strongest candidates faster.
              </p>

              <button
                type="button"
                className="ai-button"
                onClick={() => setActivePage("AI Analysis")}
              >
                Explore AI analysis <ArrowUpRight size={16} />
              </button>

              <div className="ai-decoration ai-decoration-one" />
              <div className="ai-decoration ai-decoration-two" />
            </div>

            </div>
        </aside>
      </section>

      <footer className="dashboard-footer">
        <span>© 2026 SmartHR</span>
        <span>Recruit smarter. Hire better.</span>
        <span>
          <span className="footer-dot" /> All systems operational
        </span>
      </footer>
    </div>
  );
}