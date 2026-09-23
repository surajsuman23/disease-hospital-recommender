import { createApp } from './app';
const app = createApp();
app.get('*', (c) =>
  c.env.ASSETS
    ? c.env.ASSETS.fetch(c.req.raw)
    : c.text('Frontend asset binding unavailable', 503),
);
export default { fetch: app.fetch };
