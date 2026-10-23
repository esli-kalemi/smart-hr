
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  BriefcaseBusiness,
  Users,
  FileText,
  CalendarDays,
  Settings,
  Search,
  Bell,
  ChevronDown,
  ArrowUpRight,
  Clock3,
  CheckCircle2,
  Sparkles,
  LogOut,
  Trash2,
} from "lucide-react";
import {
  loginUser,
  logoutUser,
  getCurrentUser,
  apiRequest,
  analyzeApplication,
  deleteJob,
  getDeletedJobs,
  restoreJob,
} from "./api/client";
import Login from "./components/Login";
import "./App.css";
import AIAnalysis from "./pages/AIAnalysis";
import CreateJobModal from "./components/CreateJobModal";
import { createJob, updateJob } from "./api/client";
import JobsPage from "./pages/JobsPage";
import JobDetailsModal from "./components/JobDetailsModal";
import TrashPage from "./pages/TrashPage";
import CandidatesPage from "./pages/CandidatesPage";
import ApplicationsPage from "./pages/ApplicationsPage";

const navigation = [
  { label: "Dashboard", icon: LayoutDashboard, active: true },
  { label: "AI Analysis", icon: Sparkles },
  { label: "Jobs", icon: BriefcaseBusiness },
  { label: "Candidates", icon: Users },
  { label: "Applications", icon: FileText },
  { label: "Interviews", icon: CalendarDays },
  { label: "Trash", icon: Trash2 },
];

const mockApplications = [
  { name: "Olivia Martin", initials: "OM", role: "Frontend Developer", date: "Oct 12, 2026", score: 92, status: "Shortlisted", color: "purple" },
  { name: "James Wilson", initials: "JW", role: "Product Designer", date: "Oct 11, 2026", score: 86, status: "Reviewing", color: "blue" },
  { name: "Sophia Chen", initials: "SC", role: "Data Analyst", date: "Oct 10, 2026", score: 78, status: "Reviewing", color: "orange" },
  { name: "Noah Williams", initials: "NW", role: "Marketing Specialist", date: "Oct 9, 2026", score: 65, status: "New", color: "green" },
];

function App() {
  const [user, setUser] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [activePage, setActivePage] = useState("Dashboard");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [jobs, setJobs] = useState([]);
  const [realApplications, setRealApplications] = useState([]);
  const [analyzingId, setAnalyzingId] = useState(null);
  const [analysisError, setAnalysisError] = useState("");
  const [selectedAnalysis, setSelectedAnalysis] = useState(null);
  const [analysisSuccess, setAnalysisSuccess] = useState("");
  const [showJobForm, setShowJobForm] = useState(false);
  const [savingJob, setSavingJob] = useState(false);
  const [jobFormError, setJobFormError] = useState("");
  const [selectedJob, setSelectedJob] = useState(null);
  const [savingJobChanges, setSavingJobChanges] = useState(false);
  const [jobDetailsError, setJobDetailsError] = useState(""); 
  const [deletingJob, setDeletingJob] = useState(false);
  const [deletedJobs, setDeletedJobs] = useState([]);
  const [loadingDeletedJobs, setLoadingDeletedJobs] = useState(false);
  const [trashError, setTrashError] = useState("");
  const [restoringJobId, setRestoringJobId] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function checkSession() {
      const token = localStorage.getItem("smarthr_token");

      if (!token) {
        if (!cancelled) setCheckingSession(false);
        return;
      }

      try {
        const result = await getCurrentUser();
        if (!cancelled) setUser(result.user ?? result);
      } catch {
        logoutUser();
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setCheckingSession(false);
      }
    }

    checkSession();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!user) return;

    async function fetchJobs() {
      try {
        const data = await apiRequest("/jobs/");
        setJobs(data.jobs || []);
      } catch (error) {
        console.error("Failed to fetch jobs:", error);
      }
    }

    fetchJobs();
  }, [user]);
  
  useEffect(() => {
    if (!user || activePage !== "Trash") {
      return;
    }

    const fetchDeletedJobs = async () => {
      setLoadingDeletedJobs(true);
      setTrashError("");

      try {
        const data = await getDeletedJobs();
        setDeletedJobs(data.jobs || []);
      } catch (error) {
        setTrashError(error.message || "Failed to load deleted jobs.");
      } finally {
        setLoadingDeletedJobs(false);
      }
    };

    fetchDeletedJobs();
  }, [user, activePage]);

  useEffect(() => {
    if (!user) return;

    async function fetchApplications() {
      try {
        const data = await apiRequest("/applicants/applications");
        setRealApplications(data.applications || []);
      } catch (error) {
        console.error("Failed to fetch applications:", error);
      }
    }

    fetchApplications();
  }, [user]);

  async function handleLogin(credentials) {
    setLoginLoading(true);
    setLoginError("");

    try {
      await loginUser(credentials);
      const result = await getCurrentUser();
      setUser(result.user ?? result);
    } catch (error) {
      logoutUser();
      setLoginError(error.message || "Unable to sign in. Please try again.");
    } finally {
      setLoginLoading(false);
    }
  }

  async function handleCreateJob(formData) {
    setSavingJob(true);
    setJobFormError("");

    try {
      const requirements = {
        skills: formData.requirements,
      };

      await createJob({
        title: formData.title,
        description: formData.description,
        requirements,
      });

      const response = await apiRequest("/jobs/");

      setJobs(response.jobs || []);
      setShowJobForm(false);
    } catch (error) {
      setJobFormError(error.message || "Failed to create job posting.");
    } finally {
      setSavingJob(false);
    }
  }
  async function handleUpdateJob(jobData) {
    if (!selectedJob) return;

    setSavingJobChanges(true);
    setJobDetailsError("");

    try {
      await updateJob(selectedJob.id, jobData);

      const response = await apiRequest("/jobs/");
      setJobs(response.jobs || []);

      setSelectedJob(null);
    } catch (error) {
      setJobDetailsError(
        error.message || "Failed to update job posting."
      );
    } finally {
      setSavingJobChanges(false);
    }
  }
  
  
  function handleCloseApplicationAnalysis() {
    setSelectedAnalysis(null);
    setAnalysisError("");
    setAnalysisSuccess("");
  }

  
  async function handleDeleteJob() {
    if (!selectedJob) return;

    setDeletingJob(true);
    setJobDetailsError("");

    try {
      await deleteJob(selectedJob.id);

      const response = await apiRequest("/jobs/");
      setJobs(response.jobs || []);

      setSelectedJob(null);
    } catch (error) {
      setJobDetailsError(
        error.message || "Failed to move job to Trash."
      );
    } finally {
      setDeletingJob(false);
    }
  }
  
  const handleRestoreJob = async (job) => {
    setRestoringJobId(job.id);
    setTrashError("");

    try {
      await restoreJob(job.id);

      // Refresh the active jobs list.
      const activeJobsData = await apiRequest("/jobs/");
      setJobs(activeJobsData.jobs || []);

      // Refresh the Trash list.
      const deletedJobsData = await getDeletedJobs();
      setDeletedJobs(deletedJobsData.jobs || []);
    } catch (error) {
      setTrashError(error.message || "Failed to restore the job.");
    } finally {
      setRestoringJobId(null);
    }
  };


  async function handleAnalyzeApplication(applicationId) {
    if (analyzingId !== null) return;

    setAnalyzingId(applicationId);
    setAnalysisError("");
    setAnalysisSuccess("");
    setSelectedAnalysis(null);

    try {
      const result = await analyzeApplication(applicationId);

      // The analysis succeeded, so display its results immediately.
      setSelectedAnalysis(result);
      setAnalysisSuccess("Analysis completed successfully.");

      // Refresh the applications separately. A refresh failure should
      // not make a successful analysis appear to have failed.
      try {
        const data = await apiRequest("/applicants/applications");
        setRealApplications(data.applications || []);
      } catch (refreshError) {
        console.error("Failed to refresh applications:", refreshError);
        setAnalysisSuccess(
          "Analysis completed successfully, but the application list could not be refreshed. Reload the page to update saved scores."
        );
      }
    } catch (error) {
      console.error("Application analysis failed:", error);

      const status = error.status || error.statusCode;
      const message = (error.message || "").toLowerCase();

      if (
        status === 404 ||
        message.includes("not found") ||
        message.includes("application does not exist")
      ) {
        setAnalysisError(
          "This application could not be found. It may have been deleted or is no longer available."
        );
      } else if (
        error.code === "NETWORK_ERROR" ||
        message.includes("failed to fetch") ||
        message.includes("networkerror") ||
        message.includes("network error") ||
        message.includes("connection refused")
      ) {
        setAnalysisError(
          "Could not connect to the server. Check that the backend is running and try again."
        );
      } else {
        setAnalysisError(
          "The AI analysis could not be completed. Please try again. If the problem continues, check the server logs."
        );
      }
    } finally {
      setAnalyzingId(null);
    }
  }
  
  
  async function handleUpdateApplication(applicationId, updates) {
    try {
      const result = await apiRequest(
        `/applicants/applications/${applicationId}`,
        {
          method: "PUT",
          body: JSON.stringify(updates),
        }
      );

      const updatedApplication = result.application;

      setRealApplications((previousApplications) =>
        previousApplications.map((application) =>
          application.id === applicationId
            ? { ...application, ...updatedApplication }
            : application
        )
      );

      return updatedApplication;
    } catch (error) {
      console.error("Failed to update application:", error);
      throw error;
    }
  }


  function handleViewAnalysis(application) {
    setAnalysisError("");
    setAnalysisSuccess("");
    setSelectedAnalysis(application);

    // Only generate a new analysis if no saved result exists.
    if (application.ai_analysis && application.ai_score != null) {
      return;
    }

    // Otherwise, run the analysis for this application.
    handleAnalyzeApplication(application.id);
  }

  function handleLogout() {
    logoutUser();
    setUser(null);
    setLoginError("");
  }

  if (checkingSession) {
    return (
      <div className="app-loading">
        <div className="app-loading-mark"><Sparkles size={24} /></div>
        <p>Loading your SmartHR workspace...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <Login
        onLogin={handleLogin}
        loading={loginLoading}
        error={loginError}
      />
    );
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#dashboard">
          <span className="brand-mark"><Sparkles size={21} /></span>
          <span>Smart<span className="brand-accent">HR</span></span>
        </a>

        <div className="workspace-label">WORKSPACE</div>
        <div className="workspace-switcher">
          <div className="workspace-avatar">
            {(user.name || user.email || "S").charAt(0).toUpperCase()}
          </div>
          <div className="workspace-info">
            <strong>{user.name || "SmartHR Company"}</strong>
            <span>{user.role || "Recruitment team"}</span>
          </div>
          <ChevronDown size={16} />
        </div>

        <nav className="navigation">
          <span className="nav-section-label">MENU</span>

          {navigation.map(({ label, icon: Icon }) => (
            <a
              href={`#${label.toLowerCase().replaceAll(" ", "-")}`}
              className={`nav-link ${activePage === label ? "active" : ""}`}
              key={label}
              onClick={(event) => {
                event.preventDefault();
                setActivePage(label);
              }}
            >
              <Icon size={19} strokeWidth={1.8} />
              <span>{label}</span>

              {label === "Applications" && (
                <span className="nav-count">{realApplications.length}</span>
              )}
            </a>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <a href="#settings" className="nav-link">
            <Settings size={19} strokeWidth={1.8} />
            <span>Settings</span>
          </a>
          <div className="sidebar-help">
            <div className="help-icon"><Sparkles size={18} /></div>
            <strong>AI-powered hiring</strong>
            <p>Find the right candidates with less effort.</p>
          </div>
          <div className="user-profile">
            <div className="profile-avatar">
              {(user.name || user.email || "U").slice(0, 2).toUpperCase()}
            </div>
            <div className="profile-info">
              <strong>{user.name || user.email}</strong>
              <span>{user.email}</span>
            </div>
            <button
              type="button"
              className="logout-button"
              onClick={handleLogout}
              aria-label="Log out"
              title="Log out"
            >
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="breadcrumb">
            Workspace <span>/</span> <strong>{activePage}</strong>
          </div>
          <div className="topbar-actions">
            <label className="search-box">
              <Search size={18} />
              <input placeholder="Search anything..." aria-label="Search" />
              <kbd>⌘ K</kbd>
            </label>
            <button className="icon-button" aria-label="Notifications">
              <Bell size={19} />
              <span className="notification-dot" />
            </button>
            <div className="topbar-divider" />
            <div className="today-label">
              <CalendarDays size={17} />
              <span>
                {new Date().toLocaleDateString("en-US", {
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>
        </header>
        {activePage === "Dashboard" ? (
        <div className="dashboard">
          <section className="welcome-row">
            <div>
              <div className="eyebrow">
                <span className="status-dot" /> RECRUITMENT OVERVIEW
              </div>
              <h1>Good morning, {user.name || "Admin"} <span>✦</span></h1>
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
              value={
                new Set(
                  realApplications
                    .map((application) => application.candidate_id)
                    .filter(Boolean)
                ).size.toString()
              }
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
            <StatCard icon={CalendarDays} label="Interviews scheduled" value="8" change="3 upcoming" color="green" progress={45} />
          </section>
          <section className="content-grid">
            <div className="panel applications-panel">
              <div className="panel-heading">
                <div>
                  <h2>Recent applications</h2>
                  <p>Review and manage your latest candidates.</p>
                </div>
                <button className="text-button">View all <ArrowUpRight size={16} /></button>
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
                    {(realApplications.length > 0 ? realApplications : mockApplications).map((application) => (
                      <tr key={application.name}>
                        <td>
                          <div className="candidate-cell">
                            <div className={`candidate-avatar ${application.color || "purple"}`}>
                            {application.candidates
                              ? `${application.candidates.first_name?.[0] || ""}${application.candidates.last_name?.[0] || ""}`.toUpperCase()
                              : application.initials}
                          </div>
                            <strong>{application.candidates
                            ? `${application.candidates.first_name || ""} ${application.candidates.last_name || ""}`.trim()
                            : application.name}</strong>
                          </div>
                        </td>
                        <td>{application.jobs?.title || application.role || "—"}</td>
                        <td>
                          <div className="match-cell">
                            <div className="match-track">
                              <div
                                className="match-fill"
                                style={{
                                  width: `${
                                    application.ai_score != null
                                      ? application.ai_score
                                      : application.score != null
                                        ? application.score
                                        : 0
                                  }%`,
                                }}
                              />                            
                            </div>
                            <strong>  
                              {application.ai_score != null
                              ? `${application.ai_score}%`
                              : application.score != null
                                ? `${application.score}%`
                                : "—"}
                              </strong>
                          </div>
                        </td>
                        <td>
                          <span
                            className={`status-pill ${
                              (application.stage || application.status || "new").toLowerCase()
                            }`}
                          >
                            {(application.stage || application.status) === "shortlisted" ||
                            (application.stage || application.status) === "Shortlisted" ? (
                              <CheckCircle2 size={13} />
                            ) : (application.stage || application.status) === "reviewing" ||
                              (application.stage || application.status) === "Reviewing" ? (
                              <Clock3 size={13} />
                            ) : null}

                            {application.stage
                              ? application.stage.charAt(0).toUpperCase() +
                                application.stage.slice(1).replaceAll("_", " ")
                              : application.status}
                          </span>
                        </td>
                        <td className="date-cell">
                          {application.applied_at
                            ? new Date(application.applied_at).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })
                            : application.date}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="panel-footer">
                {`Showing ${
                  (realApplications.length > 0
                    ? realApplications
                    : mockApplications
                  ).length
                } recent applications`}
                <button className="text-button">View all applications <ArrowUpRight size={15} /></button>
              </div>
            </div>

            <aside className="right-column">
              <div className="panel hiring-panel">
                <div className="panel-heading compact">
                  <div>
                    <h2>Hiring pipeline</h2>
                    <p>Candidate progress</p>
                  </div>
                  <button className="more-button" aria-label="More options">
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
                      ["new", "applied"].includes(
                        (app.stage || "").toLowerCase()
                      )
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

                <div className="upcoming-card">
                  <div className="upcoming-icon">
                    <CalendarDays size={18} />
                  </div>
                  <div>
                    <strong>Upcoming interviews</strong>
                    <p>Interview scheduling coming soon</p>
                  </div>
                  <ArrowUpRight size={17} />
                </div>
              </div>
            </aside>
          </section>

          <footer className="dashboard-footer">
            <span>© 2026 SmartHR</span>
            <span>Recruit smarter. Hire better.</span>
            <span><span className="footer-dot" /> All systems operational</span>
          </footer>
        </div>
        ) : activePage === "Jobs" ? (
          <JobsPage
            jobs={jobs}
            onCreateJob={() => setShowJobForm(true)}
            onOpenJob={(job) => {
              setSelectedJob(job);
              setJobDetailsError("");
            }}    
          />
        ) : activePage === "Candidates" ? (
          <CandidatesPage
            realApplications={realApplications}
            analyzingId={analyzingId}
            onAnalyzeApplication={handleAnalyzeApplication}
            onViewAnalysis={handleViewAnalysis}
            selectedAnalysis={selectedAnalysis}
            analysisError={analysisError}
          />
        ) : activePage === "Applications" ? (
          <ApplicationsPage
            realApplications={realApplications}
            onViewAnalysis={handleViewAnalysis}
            onUpdateApplication={handleUpdateApplication}
            analyzingId={analyzingId}
            selectedAnalysis={selectedAnalysis}
            analysisError={analysisError}
            onAnalyzeApplication={handleAnalyzeApplication}
            onCloseAnalysis={handleCloseApplicationAnalysis}
          />
        ) : activePage === "AI Analysis" ? (
          <AIAnalysis
            realApplications={realApplications}
            analyzingId={analyzingId}
            analysisError={analysisError}
            analysisSuccess={analysisSuccess}
            selectedAnalysis={selectedAnalysis}
            handleAnalyzeApplication={handleAnalyzeApplication}
            setSelectedAnalysis={setSelectedAnalysis}
          />
         ) : activePage === "Trash" ? (
          <TrashPage
            jobs={deletedJobs}
            loading={loadingDeletedJobs}
            error={trashError}
            restoringJobId={restoringJobId}
            onRestore={handleRestoreJob}
          />
        ) : (
        <div className="dashboard">
          <section className="welcome-row">
            <div>
              <div className="eyebrow">WORKSPACE</div>
              <h1>{activePage}</h1>
              <p>This section is not available yet.</p>
            </div>
          </section>
        </div>
      )}
      </main>
      {showJobForm && (
        <CreateJobModal
          onClose={() => {
            setShowJobForm(false);
            setJobFormError("");
          }}
          onCreateJob={handleCreateJob}
          saving={savingJob}
          error={jobFormError}
        />
      )}
      {selectedJob && (
        <JobDetailsModal
          job={selectedJob}
          onClose={() => {
            setSelectedJob(null);
            setJobDetailsError("");
          }}
          onSave={handleUpdateJob}
          onDelete={handleDeleteJob}
          saving={savingJobChanges}
          deleting={deletingJob}
          error={jobDetailsError}
        />
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, change, color, progress }) {
  return (
    <article className="stat-card">
      <div className="stat-top">
        <div className={`stat-icon ${color}`}><Icon size={20} /></div>
        <span className="stat-trend"><ArrowUpRight size={14} /> {change}</span>
      </div>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      <div className="stat-progress">
        <div className={`stat-progress-fill ${color}`} style={{ width: `${progress}%` }} />
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
        <div className={color} style={{ width: `${(count / total) * 100}%` }} />
      </div>
    </div>
  );
}

export default App;