import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = path.resolve(__dirname, '../dist');

function walk(dir, callback) {
  if (!fs.existsSync(dir)) return;
  fs.readdirSync(dir).forEach((file) => {
    const filepath = path.join(dir, file);
    const stat = fs.statSync(filepath);
    if (stat.isDirectory()) {
      walk(filepath, callback);
    } else if (file.endsWith('.js')) {
      callback(filepath);
    }
  });
}

function fixImports() {
  if (!fs.existsSync(rootDir)) {
    console.error('❌ Error: "dist" directory not found.');
    process.exit(1);
  }

  console.log('🚀 Fixing all imports (./ and ../) in dist...');

  walk(rootDir, (filepath) => {
    const content = fs.readFileSync(filepath, 'utf8');
    

    const newContent = content.replace(
      /(import|export) (.+?) from (['"])(\.\.?\/.+?)(['"])/g,
      (match, type, names, quote, pathName) => {
       
        if (pathName.endsWith('.js') || pathName.endsWith('.json')) return match;

      
        const targetPath = path.resolve(path.dirname(filepath), pathName);
        
        
        if (fs.existsSync(`${targetPath}.js`)) {
          return `${type} ${names} from ${quote}${pathName}.js${quote}`;
        }
        

        if (fs.existsSync(targetPath) && fs.lstatSync(targetPath).isDirectory()) {
          const indexPath = path.join(targetPath, 'index.js');
          if (fs.existsSync(indexPath)) {
            return `${type} ${names} from ${quote}${pathName}/index.js${quote}`;
          }
        }


        return `${type} ${names} from ${quote}${pathName}.js${quote}`;
      }
    );

    if (content !== newContent) {
      fs.writeFileSync(filepath, newContent);
      console.log(`✅ Fixed: ${path.relative(rootDir, filepath)}`);
    }
  });

  console.log('✨ Success: All imports are now ESM compatible!');
}

fixImports();