const { execSync } = require('child_process');
try {
  const output = execSync('git status', { encoding: 'utf8' });
  console.log(output);
} catch (error) {
  console.error('Error:', error.message);
  console.error('Stderr:', error.stderr);
}
