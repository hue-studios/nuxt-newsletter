// scripts/check-requirements.js
#!/usr/bin/env node
console.log('🔍 Checking requirements...')

// Check Node version
const nodeVersion = process.version
const requiredVersion = 'v16.0.0'

if (!nodeVersion.startsWith('v16') && !nodeVersion.startsWith('v18') && !nodeVersion.startsWith('v20')) {
  console.error(`❌ Node.js ${requiredVersion}+ required. Found ${nodeVersion}`)
  process.exit(1)
}

console.log('✅ Requirements check passed!')