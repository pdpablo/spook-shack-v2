const DEFAULT_RUNTIME_CONFIG = {
  appId: "local-spook-shack",
  appBaseUrl: "",
  functionsVersion: "local",
};

export function getRuntimeConfig() {
  if (typeof window === "undefined") return DEFAULT_RUNTIME_CONFIG;
  return window.__SPOOK_SHACK_RUNTIME__ || DEFAULT_RUNTIME_CONFIG;
}

export const appParams = {
  appId: getRuntimeConfig().appId,
  functionsVersion: getRuntimeConfig().functionsVersion,
  appBaseUrl: getRuntimeConfig().appBaseUrl,
};
