
import {
  LayoutDashboard,
  BriefcaseBusiness,
  Users,
  FileText,
  CalendarDays,
  Settings,
  Search,
  Bell,
  Plus,
  ChevronDown,
  ArrowUpRight,
  Clock3,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import "./App.css";

const navigation = [
  { label: "Dashboard", icon: LayoutDashboard, active: true },
  { label: "Jobs", icon: BriefcaseBusiness },
  { label: "Candidates", icon: Users },
  { label: "Applications", icon: FileText },
  { label: "Interviews", icon: CalendarDays },
];

const applications = [
  {
    name: "Olivia Martin",
    initials: "OM",
    role: "Frontend Developer",
    date: "Oct 12, 2026",
    score: 92,
    status: "Shortlisted",
    color: "purple",
  },
  {
    name: "James Wilson",
    initials: "JW",
    role: "Product Designer",
    date: "Oct 11, 2026",
    score: 86,
    status: "Reviewing",
    color: "blue",
  },
  {
    name: "Sophia Chen",
    initials: "SC",
    role: "Data Analyst",
    date: "Oct 10, 2026",
    score: 78,
    status: "Reviewing",
    color: "orange",
  },
  {
    name: "Noah Williams",
    initials: "NW",
    role: "Marketing Specialist",
    date: "Oct 9, 2026",
    score: 65,
    status: "New",
    color: "green",
  },
];

function App() {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#dashboard">
          <span className="brand-mark">
            <Sparkles size={21} />
          </span>
          <span>Smart<span className="brand-accent">HR</span></span>
        </a>

        <div className="workspace-label">WORKSPACE</div>
        <div className="workspace-switcher">
          <div className="workspace-avatar">S</div>
          <div className="workspace-info">
            <strong>SmartHR Company</strong>
            <span>Recruitment team</span>
          </div>
          <ChevronDown size={16} />
        </div>

        <nav className="navigation">
          <span className="nav-section-label">MENU</span>
          {navigation.map(({ label, icon: Icon, active }) => (
            <a
              href={`#${label.toLowerCase()}`}
              className={`nav-link ${active ? "active" : ""}`}
              key={label}
            >
              <Icon size={19} strokeWidth={1.8} />
              <span>{label}</span>
              {label === "Applications" && (
                <span className="nav-count">12</span>
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
            <div className="profile-avatar">EK</div>
            <div className="profile-info">
              <strong>Recruitment Admin</strong>
              <span>Administrator</span>
            </div>
            <ChevronDown size={16} />
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="breadcrumb">
            Workspace <span>/</span> <strong>Dashboard</strong>
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
              <span>October 2026</span>
            </div>
          </div>
        </header>

        <div className="dashboard">
          <section className="welcome-row">
            <div>
              <div className="eyebrow">
                <span className="status-dot" /> RECRUITMENT OVERVIEW
              </div>
              <h1>Good morning, Admin <span>✦</span></h1>
              <p>Here's what's happening with your hiring today.</p>
            </div>
            <button className="primary-button">
              <Plus size={18} /> Create job posting
            </button>
          </section>

          <section className="stats-grid">
            <StatCard
              icon={BriefcaseBusiness}
              label="Active job postings"
              value="12"
              change="+2 this month"
              color="violet"
              progress={72}
            />
            <StatCard
              icon={Users}
              label="Total candidates"
              value="248"
              change="+18 this week"
              color="blue"
              progress={83}
            />
            <StatCard
              icon={FileText}
              label="New applications"
              value="36"
              change="+12 this week"
              color="orange"
              progress={58}
            />
            <StatCard
              icon={CalendarDays}
              label="Interviews scheduled"
              value="8"
              change="3 upcoming"
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
                <button className="text-button">
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
                    {applications.map((application) => (
                      <tr key={application.name}>
                        <td>
                          <div className="candidate-cell">
                            <div className={`candidate-avatar ${application.color}`}>
                              {application.initials}
                            </div>
                            <strong>{application.name}</strong>
                          </div>
                        </td>
                        <td>{application.role}</td>
                        <td>
                          <div className="match-cell">
                            <div className="match-track">
                              <div
                                className="match-fill"
                                style={{ width: `${application.score}%` }}
                              />
                            </div>
                            <strong>{application.score}%</strong>
                          </div>
                        </td>
                        <td>
                          <span className={`status-pill ${application.status.toLowerCase()}`}>
                            {application.status === "Shortlisted" && (
                              <CheckCircle2 size={13} />
                            )}
                            {application.status === "Reviewing" && (
                              <Clock3 size={13} />
                            )}
                            {application.status}
                          </span>
                        </td>
                        <td className="date-cell">{application.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="panel-footer">
                Showing 4 of 36 recent applications
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
                  <button className="more-button" aria-label="More options">···</button>
                </div>
                <div className="pipeline-total">
                  <strong>248</strong>
                  <span>candidates in pipeline</span>
                </div>
                <div className="pipeline-bars">
                  <PipelineRow label="New applicants" count={84} total={248} color="pipeline-violet" />
                  <PipelineRow label="Under review" count={62} total={248} color="pipeline-blue" />
                  <PipelineRow label="Shortlisted" count={48} total={248} color="pipeline-orange" />
                  <PipelineRow label="Interview" count={32} total={248} color="pipeline-green" />
                  <PipelineRow label="Offer sent" count={22} total={248} color="pipeline-dark" />
                </div>
              </div>

              <div className="ai-card">
                <div className="ai-card-icon"><Sparkles size={21} /></div>
                <div className="ai-card-label">SMARTHR INTELLIGENCE</div>
                <h3>Let AI do the heavy lifting.</h3>
                <p>Compare resumes with job requirements and discover your strongest candidates faster.</p>
                <button className="ai-button">
                  Explore AI analysis <ArrowUpRight size={16} />
                </button>
                <div className="ai-decoration ai-decoration-one" />
                <div className="ai-decoration ai-decoration-two" />
              </div>

              <div className="upcoming-card">
                <div className="upcoming-icon"><CalendarDays size={18} /></div>
                <div>
                  <strong>Upcoming interviews</strong>
                  <p>Interview scheduling coming soon</p>
                </div>
                <ArrowUpRight size={17} />
              </div>
            </aside>
          </section>

          <footer className="dashboard-footer">
            <span>© 2026 SmartHR</span>
            <span>Recruit smarter. Hire better.</span>
            <span><span className="footer-dot" /> All systems operational</span>
          </footer>
        </div>
      </main>
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
