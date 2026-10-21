
import { useState } from "react";
import { BriefcaseBusiness, Eye, EyeOff, LockKeyhole, Mail, Sparkles } from "lucide-react";
import "./style/Login.css";

export default function Login({ onLogin, loading, error }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    await onLogin({ email, password });
  }

  return (
    <main className="login-page">
      <section className="login-card">
        <div className="login-brand">
          <div className="login-logo">
            <BriefcaseBusiness size={24} />
          </div>
          <span>SmartHR</span>
        </div>

        <div className="login-heading">
          <div className="login-sparkle">
            <Sparkles size={20} />
          </div>
          <h1>Welcome back</h1>
          <p>Sign in to manage your recruitment workspace.</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <label htmlFor="login-email">Email address</label>
          <div className="login-input-wrapper">
            <Mail size={18} />
            <input
              id="login-email"
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
            />
          </div>

          <div className="login-password-label">
            <label htmlFor="login-password">Password</label>
          </div>

          <div className="login-input-wrapper">
            <LockKeyhole size={18} />
            <input
              id="login-password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
            />
            <button
              className="login-password-toggle"
              type="button"
              onClick={() => setShowPassword((visible) => !visible)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {error && <p className="login-error" role="alert">{error}</p>}

          <button className="login-submit" type="submit" disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="login-footer">
          AI-powered recruitment, made simpler.
        </p>
      </section>
    </main>
  );
}
