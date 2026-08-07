const TOKEN_KEY = "spook-shack-token";

const isBrowser = typeof window !== "undefined";

function getStoredToken() {
  if (!isBrowser) return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

function setStoredToken(token) {
  if (!isBrowser) return;
  if (!token) {
    window.localStorage.removeItem(TOKEN_KEY);
    return;
  }
  window.localStorage.setItem(TOKEN_KEY, token);
}

async function request(path, { method = "GET", body, auth = true } = {}) {
  const headers = { "Content-Type": "application/json" };
  const token = auth ? getStoredToken() : null;
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(path, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const raw = await res.text();
  const data = raw ? JSON.parse(raw) : null;
  if (!res.ok) {
    const message = data?.error || data?.message || `Request failed (${res.status})`;
    const err = new Error(message);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

function entity(name) {
  return {
    async list(sort = "-created_date", limit = 1000) {
      return await request(`/api/entities/${name}/query`, {
        method: "POST",
        body: { query: {}, sort, limit },
      });
    },
    async filter(query = {}, sort = "-created_date", limit = 1000) {
      return await request(`/api/entities/${name}/query`, {
        method: "POST",
        body: { query, sort, limit },
      });
    },
    async create(data) {
      return await request(`/api/entities/${name}`, { method: "POST", body: data });
    },
    async update(id, data) {
      return await request(`/api/entities/${name}/${id}`, { method: "PUT", body: data });
    },
    async delete(id) {
      return await request(`/api/entities/${name}/${id}`, { method: "DELETE" });
    },
    async bulkCreate(items) {
      const results = [];
      for (const item of items || []) results.push(await this.create(item));
      return results;
    },
  };
}

async function authLogin(email, password) {
  const data = await request("/api/auth/login", {
    method: "POST",
    body: { email, password },
    auth: false,
  });
  setStoredToken(data.access_token);
  return data.user;
}

async function authRegister(payload) {
  return await request("/api/auth/register", {
    method: "POST",
    body: payload,
    auth: false,
  });
}

async function authVerifyOtp(payload) {
  const data = await request("/api/auth/verify-otp", {
    method: "POST",
    body: payload,
    auth: false,
  });
  setStoredToken(data.access_token);
  return data;
}

async function authResendOtp(email) {
  return await request("/api/auth/resend-otp", {
    method: "POST",
    body: { email },
    auth: false,
  });
}

async function authResetPassword({ resetToken, newPassword }) {
  return await request("/api/auth/reset-password", {
    method: "POST",
    body: { resetToken, newPassword },
    auth: false,
  });
}

async function authForgotPassword(email) {
  return await request("/api/auth/forgot-password", {
    method: "POST",
    body: { email },
    auth: false,
  });
}

async function authProvider(provider, returnTo = "/") {
  const data = await request("/api/auth/provider", {
    method: "POST",
    body: { provider, returnTo },
    auth: false,
  });
  setStoredToken(data.access_token);
  if (isBrowser) window.location.href = data.redirect_url || returnTo || "/";
  return data;
}

function logout(returnTo = "/login") {
  setStoredToken(null);
  if (!isBrowser) return;
  if (returnTo === false) return;
  const target = typeof returnTo === "string" && returnTo.startsWith("/")
    ? `/login?returnTo=${encodeURIComponent(returnTo)}`
    : "/login";
  window.location.href = target;
}

function redirectToLogin(returnTo = "/") {
  if (!isBrowser) return;
  const target = typeof returnTo === "string" && returnTo.startsWith("/")
    ? `/login?returnTo=${encodeURIComponent(returnTo)}`
    : "/login";
  window.location.href = target;
}

async function invoke(name, payload = {}) {
  const data = await request(`/api/functions/${name}`, {
    method: "POST",
    body: payload,
  });
  return { data };
}

export const base44 = {
  auth: {
    me: async () => await request("/api/auth/me", { auth: true }),
    loginViaEmailPassword: authLogin,
    register: authRegister,
    verifyOtp: authVerifyOtp,
    resendOtp: authResendOtp,
    resetPassword: authResetPassword,
    forgotPassword: authForgotPassword,
    resetPasswordRequest: authForgotPassword,
    loginWithProvider: authProvider,
    logout,
    redirectToLogin,
    setToken: setStoredToken,
  },
  entities: {
    IntelSource: entity("IntelSource"),
    IntelItem: entity("IntelItem"),
    IngestionRun: entity("IngestionRun"),
    ItemNote: entity("ItemNote"),
    IntelReport: entity("IntelReport"),
    TechForecast: entity("TechForecast"),
    User: entity("User"),
  },
  users: {
    inviteUser: async (email, role) => await request("/api/users/invite", { method: "POST", body: { email, role } }),
  },
  functions: {
    invoke,
  },
};

export function getAccessToken() {
  return getStoredToken();
}
