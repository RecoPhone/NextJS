// server.js — Next + Express avec bootstrap d'installation et chargement .env
const fs = require('fs');
const path = require('path');
const express = require('express');

// 1) Chargement des variables d'env (priorité aux variables cPanel ; .env.production si présent ; sinon .env)
const prodEnvPath = path.join(__dirname, '.env.production');
const devEnvPath = path.join(__dirname, '.env');
let loadedFrom = 'cpanel-env-only';
if (fs.existsSync(prodEnvPath)) {
  require('dotenv').config({ path: prodEnvPath });
  loadedFrom = '.env.production';
} else if (fs.existsSync(devEnvPath)) {
  require('dotenv').config({ path: devEnvPath });
  loadedFrom = '.env';
}
console.log('[ENV] Chargé depuis :', loadedFrom);

// 2) Préflight : liste des clés minimales attendues au runtime (ajuste au besoin)
const REQUIRED_AT_RUNTIME = [
  'NEXT_PUBLIC_SITE_URL',
  'FONEDAY_API_URL',
  'FONEDAY_API_TOKEN',
  // Décommente si Stripe actif :
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
];
for (const k of REQUIRED_AT_RUNTIME) {
  if (!process.env[k] || String(process.env[k]).trim() === '') {
    console.error(`[ENV] Variable manquante : ${k}`);
  }
}

const port = process.env.PORT || 3000;
const hasBuild = fs.existsSync(path.join(__dirname, '.next', 'BUILD_ID'));

// 3) MODE INSTALLATEUR : pendant "Run NPM Install" (pas de build encore)
if (!hasBuild) {
  const app = express();
  app.get('/healthz', (_req, res) => res.status(200).send('ok - waiting for build'));
  app.get('/diag/env', (_req, res) => {
    const keys = [
      'NEXT_PUBLIC_SITE_URL',
      'FONEDAY_API_URL',
      'FONEDAY_API_TOKEN',
      'STRIPE_SECRET_KEY',
      'STRIPE_WEBHOOK_SECRET',
    ];
    const out = {};
    for (const k of keys) {
      const v = process.env[k];
      out[k] = v ? (k.startsWith('NEXT_PUBLIC_') ? v : '***') : null;
    }
    res.json({ loadedFrom, vars: out });
  });
  app.get('*', (_req, res) => {
    res.status(200).send(
      '<h1>RecoPhone - Installer</h1><p>Build Next absent (.next). ' +
      'Lancez <code>npm run build</code> puis redémarrez l’app.</p>'
    );
  });
  app.listen(port, '0.0.0.0', () => console.log(`Installer mode on ${port}`));
  return;
}

// 4) MODE PROD : Next + Express
const next = require('next');
const nextApp = next({ dev: false });
const handle = nextApp.getRequestHandler();

nextApp.prepare().then(() => {
  const app = express();

  // (Optionnel) compression HTTP
  // const compression = require('compression'); app.use(compression());

  // (Optionnel) Webhook Stripe à placer AVANT handle() et en raw :
  // app.post('/api/stripe/webhook', express.raw({ type: '*/*' }), (req, res) => { ... });

  // Endpoints de diagnostic
  app.get('/healthz', (_req, res) => res.status(200).send('ok'));
  app.get('/diag/env', (_req, res) => {
    const keys = [
      'NEXT_PUBLIC_SITE_URL',
      'FONEDAY_API_URL',
      'FONEDAY_API_TOKEN',
      'STRIPE_SECRET_KEY',
      'STRIPE_WEBHOOK_SECRET',
    ];
    const out = {};
    for (const k of keys) {
      const v = process.env[k];
      out[k] = v ? (k.startsWith('NEXT_PUBLIC_') ? v : '***') : null;
    }
    res.json({ loadedFrom, vars: out });
  });

  // Next gère tout le reste
  app.all('*', (req, res) => handle(req, res));

  app.listen(port, '0.0.0.0', () => console.log(`RecoPhone running on ${port}`));
}).catch((err) => {
  console.error('Next prepare failed:', err);
  process.exit(1);
});
