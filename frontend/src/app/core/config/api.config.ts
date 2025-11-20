import { environment as appEnvironment } from '../../../environments/environment';

const backendTunnelHost = 'turnoplus.onrender.com';
const backendTunnelBaseUrl = `https://${backendTunnelHost}`;

const isLocalhost = ['localhost', '127.0.0.1'].includes(window.location.hostname);
const isBackendTunnel = window.location.hostname === backendTunnelHost;

// Use environment variable if set, otherwise fall back to hostname-based logic
const apiHost = appEnvironment.API_URL && appEnvironment.API_URL !== '${API_URL}'
  ? appEnvironment.API_URL
  : isLocalhost
    ? 'http://localhost:8000'
    : isBackendTunnel
      ? backendTunnelBaseUrl
      : backendTunnelBaseUrl;

export const API_BASE_URL = `${apiHost}/api/v1`;

export const environmentConfig = {
  apiBaseUrl: API_BASE_URL,
  backendTunnelHost,
};

// Keep the old export for backward compatibility
export const environment = environmentConfig;
