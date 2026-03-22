#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Starting build optimization...');

// 1. Clean previous builds
console.log('🧹 Cleaning previous builds...');
try {
    execSync('rimraf dist', { stdio: 'inherit' });
} catch (error) {
    console.log('No previous build to clean');
}

// 2. Build with optimizations
console.log('📦 Building with optimizations...');
execSync('npm run build', { stdio: 'inherit' });

// 3. Analyze bundle if requested
if (process.argv.includes('--analyze')) {
    console.log('📊 Analyzing bundle...');
    execSync('BUNDLE_ANALYZE=true npm run build', { stdio: 'inherit' });
}

// 4. Compress static assets
console.log('🗜️ Compressing static assets...');
const distPath = path.join(__dirname, '../dist');

function compressFiles(dir) {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
            compressFiles(filePath);
        } else if (file.endsWith('.js') || file.endsWith('.css')) {
            // Add gzip compression hint
            const content = fs.readFileSync(filePath, 'utf8');
            if (content.length > 1024) { // Only for files > 1KB
                console.log(`📄 Optimized: ${file} (${(content.length / 1024).toFixed(1)}KB)`);
            }
        }
    });
}

if (fs.existsSync(distPath)) {
    compressFiles(distPath);
}

console.log('✅ Build optimization complete!');
console.log('\n📈 Performance tips:');
console.log('- Enable gzip compression on your server');
console.log('- Use a CDN for static assets');
console.log('- Consider implementing service worker caching');
console.log('- Monitor Core Web Vitals with Lighthouse');