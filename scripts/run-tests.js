#!/usr/bin/env node

/**
 * Test Runner Script
 * Ensures proper setup before running tests
 */

const { execSync } = require('child_process');
const { existsSync } = require('fs');
const { join } = require('path');

console.log('🧪 Running Newsletter Module Tests\n');

// Check if node_modules exists
if (!existsSync(join(process.cwd(), 'node_modules'))) {
  console.log('📦 Installing dependencies...');
  execSync('npm install', { stdio: 'inherit' });
}

// Check if module is built
if (!existsSync(join(process.cwd(), 'dist'))) {
  console.log('🔨 Building module...');
  execSync('npm run dev:prepare', { stdio: 'inherit' });
}

console.log('\n🚀 Running tests...\n');

try {
  execSync('npm test', { stdio: 'inherit' });
  console.log('\n✅ All tests passed!');
} catch (error) {
  console.error('\n❌ Tests failed');
  process.exit(1);
}