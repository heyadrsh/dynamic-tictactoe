const fs = require('fs');
const path = require('path');

// Create dist directory if it doesn't exist
const distDir = path.join(__dirname, 'dist');
if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
}

// Copy all files except the ones we need to process
const filesToCopy = [
    'styles.css',
    'gemini-ai.js',
    'favicon'
];

filesToCopy.forEach(file => {
    const srcPath = path.join(__dirname, file);
    const destPath = path.join(distDir, file);
    
    if (fs.lstatSync(srcPath).isDirectory()) {
        // Copy directory recursively
        copyDir(srcPath, destPath);
    } else {
        // Copy file
        fs.copyFileSync(srcPath, destPath);
    }
});

// Function to copy directory recursively
function copyDir(src, dest) {
    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
    }
    
    const entries = fs.readdirSync(src, { withFileTypes: true });
    
    for (let entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        
        if (entry.isDirectory()) {
            copyDir(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

// Process script.js to inject environment variable
let scriptContent = fs.readFileSync(path.join(__dirname, 'script.js'), 'utf8');

// Replace the hardcoded API key with environment variable placeholder
const apiKey = process.env.GEMINI_API_KEY || '';
scriptContent = scriptContent.replace(
    /const apiKey = 'AIzaSyDsNoQfLs93EcPC4Oz4WuxlLbiHg2vqbTo';/,
    `const apiKey = '${apiKey}';`
);

// Write the processed script.js
fs.writeFileSync(path.join(distDir, 'script.js'), scriptContent);

// Process index.html (copy as-is for now)
const indexContent = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
fs.writeFileSync(path.join(distDir, 'index.html'), indexContent);

console.log('✅ Build completed successfully!');
console.log('📁 Output directory: dist/');
console.log('🔑 API Key configured:', apiKey ? 'Yes' : 'No (will use modal)'); 