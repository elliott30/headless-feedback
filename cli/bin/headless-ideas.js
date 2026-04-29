#!/usr/bin/env node
const { readFileSync, writeFileSync, mkdirSync } = require('fs');
const { homedir } = require('os');
const { join } = require('path');

const CONFIG_DIR  = join(homedir(), '.headless-ideas');
const CONFIG_FILE = join(CONFIG_DIR, 'config.json');
const API_BASE    = 'https://headless-ideas.vercel.app';

async function main() {
  const [,, command] = process.argv;
  if (command !== 'init') {
    console.error('Usage: headless-ideas init');
    process.exit(1);
  }

  let config = null;
  try {
    const raw = JSON.parse(readFileSync(CONFIG_FILE, 'utf8'));
    if (raw.apiKey && raw.accountId) config = raw;
  } catch {}

  if (!config) {
    const res = await fetch(`${API_BASE}/api/signup`, { method: 'POST' }).catch(e => {
      console.error('Network error:', e.message);
      process.exit(1);
    });
    if (!res.ok) {
      console.error(`Signup failed (${res.status})`);
      process.exit(1);
    }
    config = await res.json();
    mkdirSync(CONFIG_DIR, { recursive: true });
    writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), { mode: 0o600 });
  }

  console.log(`
✓ Headless Ideas ready

Your account ID: ${config.accountId}

Paste this anywhere in your app to show the feedback widget:

  <script src="${API_BASE}/widget.js"
          data-account="${config.accountId}" async></script>
  <div id="hf-feedback"></div>
`);
}

main();
