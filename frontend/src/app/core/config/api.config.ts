const backendTunnelHost = 'backend-tunnel.ogeid.xyz';
const backendTunnelBaseUrl = `https://${backendTunnelHost}`;

const isLocalhost = ['localhost', '127.0.0.1'].includes(window.location.hostname);
const isBackendTunnel = window.location.hostname === backendTunnelHost;

const apiHost = isLocalhost
  ? 'http://localhost:8000'
  : isBackendTunnel
    ? backendTunnelBaseUrl
    : backendTunnelBaseUrl;

export const API_BASE_URL = `${apiHost}/api/v1`;

export const environment = {
  apiBaseUrl: API_BASE_URL,
  backendTunnelHost,
};
