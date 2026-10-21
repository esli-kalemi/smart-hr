
const API_BASE_URL = "http://127.0.0.1:8000";


export async function apiRequest(path, options = {}) {
  const token = localStorage.getItem("smarthr_token");

  let response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        ...(options.body && !(options.body instanceof FormData)
          ? { "Content-Type": "application/json" }
          : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });
  } catch {
    const networkError = new Error(
      "Could not connect to the server. Check your connection and try again."
    );
    networkError.code = "NETWORK_ERROR";
    throw networkError;
  }

  const contentType = response.headers.get("content-type");
  const data = contentType?.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message =
      typeof data === "object" && data !== null
        ? data.detail || "Something went wrong."
        : data || "Something went wrong.";

    const apiError = new Error(
      typeof message === "string" ? message : JSON.stringify(message)
    );

    apiError.status = response.status;
    throw apiError;
  }

  return data;
}

export async function loginUser(credentials) {
  const data = await apiRequest("/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(credentials),
  });

  const token = data.session?.access_token || data.access_token || data.token;
  if (!token) {
    throw new Error("The login response did not contain an access token.");
  }

  localStorage.setItem("smarthr_token", token);

  return data;
}

export async function getCurrentUser() {
  return apiRequest("/auth/me");
}

export async function logoutUser() {
  localStorage.removeItem("smarthr_token");
}

export async function analyzeApplication(applicationId) {
  return apiRequest(
    `/applicants/applications/${applicationId}/analyze`,
    {
      method: "POST",
    }
  );
}

export async function createJob(jobData) {
  return apiRequest("/jobs/", {
    method: "POST",
    body: JSON.stringify(jobData),
  });
}

export async function updateJob(jobId, jobData) {
  return apiRequest(`/jobs/${jobId}`, {
    method: "PUT",
    body: JSON.stringify(jobData),
  });
}


export async function deleteJob(jobId) {
  return apiRequest(`/jobs/${jobId}`, {
    method: "DELETE",
  });
}

export async function getDeletedJobs() {
  return apiRequest("/jobs/trash");
}

export async function restoreJob(jobId) {
  return apiRequest(`/jobs/${jobId}/restore`, {
    method: "POST",
  });
}
