import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv, type ConfigEnv, type ProxyOptions, type UserConfig } from 'vite';
import path from 'path';

const apiTarget = 'https://sobs-marketplace.zevenx3.workers.dev';

export default defineConfig(async ({ command, mode }: ConfigEnv): Promise<UserConfig> => {
  const devEnv = command === 'serve' && mode === 'development'
    ? loadEnv(mode, process.cwd(), '')
    : {};
  const devSellerId = devEnv.SOBS_DEV_SELLER_ID;
  const devLoginSecret = devEnv.SOBS_DEV_LOGIN_SECRET;
  const hasDevSellerCredentials = Boolean(devSellerId && devLoginSecret);
  let devSessionToken = '';
  let refreshTimer: ReturnType<typeof setTimeout> | undefined;

  function scheduleDevSellerRefresh(delay: number) {
    clearTimeout(refreshTimer);
    refreshTimer = setTimeout(() => {
      refreshDevSellerSession().catch((error) => {
        console.warn(`${error.message} Retrying in five minutes.`);
        scheduleDevSellerRefresh(5 * 60_000);
      });
    }, delay);
    refreshTimer.unref?.();
  }

  async function refreshDevSellerSession() {
    const response = await fetch(`${apiTarget}/api/seller/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sellerId: devSellerId, loginSecret: devLoginSecret }),
    });
    const data = await response.json().catch(() => ({})) as {
      success?: boolean;
      sessionToken?: string;
      expiresAt?: string;
    };
    if (!response.ok || !data.success || !data.sessionToken) {
      throw new Error(`Dev seller login failed (${response.status}). Check the local dev credentials.`);
    }

    devSessionToken = data.sessionToken;
    const expiry = Date.parse(data.expiresAt || '');
    const refreshIn = Number.isFinite(expiry) ? Math.max(60_000, expiry - Date.now() - 30 * 60_000) : 12 * 60 * 60_000;
    scheduleDevSellerRefresh(refreshIn);
  }

  if (hasDevSellerCredentials) await refreshDevSellerSession();

  return {
    plugins: [react()],
    base: '/',
    server: {
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true,
          configure(proxy: Parameters<NonNullable<ProxyOptions['configure']>>[0]) {
            if (!hasDevSellerCredentials) return;
            proxy.on('proxyReq', (proxyRequest, request) => {
              if (request.url?.startsWith('/api/seller/chats')) {
                proxyRequest.setHeader('X-SOBS-Global-Key', devSellerId);
                proxyRequest.setHeader('X-SOBS-Seller-Session', devSessionToken);
              }
            });
          },
        },
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
  };
});
