
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
import InterviewsPage from "./pages/InterviewsPage"
import Dashboard from "./pages/Dashboard";

const navigation = [
  { label: "Dashboard", icon: LayoutDashboard, active: true },
  { label: "AI Analysis", icon: Sparkles },
  { label: "Jobs", icon: BriefcaseBusiness },
  { label: "Candidates", icon: Users },
  { label: "Applications", icon: FileText },
  { label: "Interviews", icon: CalendarDays },
  { label: "Trash", icon: Trash2 },
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
  const [interviews, setInterviews] = useState([]);

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
  useEffect(() => {
    if (!user) return;

    async function fetchInterviews() {
      try {
        const data = await apiRequest("/interviews/");
        setInterviews(data.interviews || []);
      } catch (error) {
        console.error("Failed to fetch interviews:", error);
      }
    }

    fetchInterviews();
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
          <Dashboard
            user={user}
            jobs={jobs}
            interviews={interviews}
            realApplications={realApplications}
            setActivePage={setActivePage}
          />
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
         ) : activePage === "Interviews" ? (
          <InterviewsPage
            apiRequest={apiRequest}
            realApplications={realApplications}
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


export default App;