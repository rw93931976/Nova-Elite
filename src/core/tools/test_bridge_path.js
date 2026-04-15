const path = require('path');
const fs = require('fs');

const testPath = 'C:/Users/Ray/Desktop';
const resolved = path.resolve(testPath);
console.log('Test Path:', testPath);
console.log('Resolved:', resolved);
console.log('Exists:', fs.existsSync(resolved));

if (fs.existsSync(resolved)) {
    console.log('Type:', fs.lstatSync(resolved).isDirectory() ? 'Directory' : 'File');
    if (fs.lstatSync(resolved).isDirectory()) {
        const files = fs.readdirSync(resolved);
        console.log('Files found:', files.length);
        const novaFiles = files.filter(f => f.toLowerCase().includes('nova'));
        console.log('Nova files:', novaFiles);
    }
}
