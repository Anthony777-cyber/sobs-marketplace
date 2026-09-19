export interface Env {
  ASSETS: {
    fetch: (request: Request | string | URL, init?: RequestInit) => Promise<Response>;
  };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    return env.ASSETS.fetch(request);
  },
};
