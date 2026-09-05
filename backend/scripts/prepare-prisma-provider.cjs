#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');
const schema = fs.readFileSync(schemaPath, 'utf8');

function providerFromEnv() {
  const explicit = process.env.BAZAARSETU_PRISMA_PROVIDER || process.env.PRISMA_PROVIDER;
  if (explicit === 'postgresql' || explicit === 'sqlite') return explicit;

  const url = process.env.DATABASE_URL || '';
  if (/^(postgresql|postgres):\/\//i.test(url)) return 'postgresql';
  if (/^(file:|sqlite:)/i.test(url) || !url) return 'sqlite';

  throw new Error(`Cannot infer Prisma provider from DATABASE_URL=${url.replace(/:.+@/, ':***@')}`);
}

const provider = providerFromEnv();
const updated = schema.replace(/provider\s*=\s*"(?:sqlite|postgresql)"/, `provider = "${provider}"`);

if (updated !== schema) {
  fs.writeFileSync(schemaPath, updated);
}

console.log(`Prisma datasource provider ready: ${provider}`);
