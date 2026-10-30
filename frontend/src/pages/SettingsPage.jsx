
import { useState } from "react";
import "./style/SettingsPage.css";

const INITIAL_COMPANY_INFO = {
  companyName: "",
  industry: "",
  website: "",
  location: "",
  description: "",
};
const loadCompanyInfo = () => {
  const savedInfo = localStorage.getItem("smarthr_company_info");

  if (savedInfo) {
    try {
      return {
        ...INITIAL_COMPANY_INFO,
        ...JSON.parse(savedInfo),
      };
    } catch {
      console.error("Could not load company information.");
    }
  }

  return INITIAL_COMPANY_INFO;
};

function SettingsPage({ user }) {
  const [companyInfo, setCompanyInfo] = useState(loadCompanyInfo);
  const [isEditingCompany, setIsEditingCompany] = useState(false);
  const handleCompanyChange = (event) => {
    const { name, value } = event.target;

    setCompanyInfo((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveCompany = () => {
    localStorage.setItem(
      "smarthr_company_info",
      JSON.stringify(companyInfo)
    );

    setIsEditingCompany(false);
  };

  const handleCancelCompany = () => {
    const savedInfo = localStorage.getItem("smarthr_company_info");

    setCompanyInfo(
      savedInfo
        ? { ...INITIAL_COMPANY_INFO, ...JSON.parse(savedInfo) }
        : INITIAL_COMPANY_INFO
    );

    setIsEditingCompany(false);
  };

  return (
    <div className="settings-page">
      <div className="settings-header">
        <h1>Settings</h1>
        <p>Manage your account and company information.</p>
      </div>

      {/* Profile Information */}
      <div className="settings-section">
        <h2>Profile Information</h2>

        <div className="settings-profile-card">
          <div className="settings-avatar">
            {user?.name?.charAt(0)?.toUpperCase() || "H"}
          </div>

          <div className="settings-profile-details">
            <div className="settings-field">
              <label>Full Name</label>
              <p>{user?.name || "HR Administrator"}</p>
            </div>

            <div className="settings-field">
              <label>Email Address</label>
              <p>{user?.email || "Not available"}</p>
            </div>

            <div className="settings-field">
              <label>Role</label>
              <p>HR Admin</p>
            </div>
          </div>
        </div>
      </div>

      {/* Company Information */}
      <div className="settings-section">
        <div className="settings-section-heading">
          <div>
            <h2>Company Information</h2>
            <p>Manage your company's basic information.</p>
          </div>

          {!isEditingCompany && (
            <button
              type="button"
              className="settings-edit-button"
              onClick={() => setIsEditingCompany(true)}
            >
              Edit Information
            </button>
          )}
        </div>

        <div className="settings-company-card">
          <div className="settings-company-grid">
            <div className="settings-field">
              <label>Company Name</label>
              {isEditingCompany ? (
                <input
                  type="text"
                  name="companyName"
                  value={companyInfo.companyName}
                  onChange={handleCompanyChange}
                  placeholder="Enter company name"
                />
              ) : (
                <p>{companyInfo.companyName || "Not provided"}</p>
              )}
            </div>

            <div className="settings-field">
              <label>Industry</label>
              {isEditingCompany ? (
                <input
                  type="text"
                  name="industry"
                  value={companyInfo.industry}
                  onChange={handleCompanyChange}
                  placeholder="e.g. Information Technology"
                />
              ) : (
                <p>{companyInfo.industry || "Not provided"}</p>
              )}
            </div>

            <div className="settings-field">
              <label>Company Website</label>
              {isEditingCompany ? (
                <input
                  type="url"
                  name="website"
                  value={companyInfo.website}
                  onChange={handleCompanyChange}
                  placeholder="https://www.example.com"
                />
              ) : (
                <p>{companyInfo.website || "Not provided"}</p>
              )}
            </div>

            <div className="settings-field">
              <label>Location</label>
              {isEditingCompany ? (
                <input
                  type="text"
                  name="location"
                  value={companyInfo.location}
                  onChange={handleCompanyChange}
                  placeholder="City, Country"
                />
              ) : (
                <p>{companyInfo.location || "Not provided"}</p>
              )}
            </div>

            <div className="settings-field settings-company-description">
              <label>Company Description</label>
              {isEditingCompany ? (
                <textarea
                  name="description"
                  value={companyInfo.description}
                  onChange={handleCompanyChange}
                  placeholder="Describe your company..."
                  rows={4}
                />
              ) : (
                <p>{companyInfo.description || "Not provided"}</p>
              )}
            </div>
          </div>

          {isEditingCompany && (
            <div className="settings-company-actions">
              <button
                type="button"
                className="settings-cancel-button"
                onClick={handleCancelCompany}
              >
                Cancel
              </button>

              <button
                type="button"
                className="settings-save-button"
                onClick={handleSaveCompany}
              >
                Save Changes
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SettingsPage;
