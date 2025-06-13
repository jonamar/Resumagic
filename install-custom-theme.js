const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Paths
const customThemePath = path.join(__dirname, 'custom-themes', 'jsonresume-theme-stackoverflow-custom');
const nodeModulesPath = path.join(__dirname, 'node_modules');
const customThemeNodeModulesPath = path.join(nodeModulesPath, 'jsonresume-theme-stackoverflow-custom');

// Check if the custom theme exists
if (!fs.existsSync(customThemePath)) {
  console.error('Custom theme not found at:', customThemePath);
  process.exit(1);
}

// Create symlink or copy directory
try {
  console.log('Installing custom theme...');
  
  // Remove existing theme if it exists
  if (fs.existsSync(customThemeNodeModulesPath)) {
    console.log('Removing existing installation...');
    fs.rmSync(customThemeNodeModulesPath, { recursive: true, force: true });
  }
  
  // Create node_modules directory if it doesn't exist
  if (!fs.existsSync(nodeModulesPath)) {
    fs.mkdirSync(nodeModulesPath, { recursive: true });
  }

  // Copy directory instead of symlink (more compatible)
  fs.cpSync(customThemePath, customThemeNodeModulesPath, { recursive: true });
  
  console.log('Custom theme installed successfully at:', customThemeNodeModulesPath);
  console.log('\nYou can now use your custom theme with:');
  console.log('resume export resume.html -r resume-formatted.json --theme stackoverflow-custom');
} catch (error) {
  console.error('Error installing custom theme:', error);
  process.exit(1);
}
