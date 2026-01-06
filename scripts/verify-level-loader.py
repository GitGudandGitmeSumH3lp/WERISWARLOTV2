const fs = require('fs');
const path = require('path');

console.log('🔍 Level Loader Implementation Verification\n');

const projectRoot = process.cwd();
console.log(`Project root: ${projectRoot}\n`);

const requiredFiles = [
    'src/types/LevelSchema.ts',
    'src/core/LevelLoader.ts',
    'src/app/level-loader-test/page.tsx',
    'public/levels/test_level.json',
    'public/levels/invalid_bounds.json',
    'public/levels/missing_asset.json',
    'public/levels/invalid_weight.json'
];

console.log('📁 Checking file structure...\n');

let allFilesExist = true;
let missingFiles = [];

requiredFiles.forEach(filePath => {
    const fullPath = path.join(projectRoot, filePath);
    const exists = fs.existsSync(fullPath);
    const icon = exists ? '✅' : '❌';
    console.log(`${icon} ${filePath}`);
    if (!exists) {
        allFilesExist = false;
        missingFiles.push(filePath);
    }
});

console.log('\n📋 Implementation Checklist:');

const checklist = [
    { 
        item: 'Types defined in LevelSchema.ts', 
        check: () => {
            try {
                const filePath = path.join(projectRoot, 'src/types/LevelSchema.ts');
                if (!fs.existsSync(filePath)) return false;
                const content = fs.readFileSync(filePath, 'utf8');
                return content.includes('LevelData') && content.includes('ValidationResult');
            } catch (error) {
                return false;
            }
        }
    },
    { 
        item: 'LevelLoader class implements all methods', 
        check: () => {
            try {
                const filePath = path.join(projectRoot, 'src/core/LevelLoader.ts');
                if (!fs.existsSync(filePath)) return false;
                const content = fs.readFileSync(filePath, 'utf8');
                const methods = ['load', 'getCurrentLevel', 'validate', 'getZonesByType', 'getVignetteById'];
                return methods.every(method => content.includes(`static ${method}`));
            } catch (error) {
                return false;
            }
        }
    },
    { 
        item: 'Validation pipeline implemented (4 stages)', 
        check: () => {
            try {
                const filePath = path.join(projectRoot, 'src/core/LevelLoader.ts');
                if (!fs.existsSync(filePath)) return false;
                const content = fs.readFileSync(filePath, 'utf8');
                return content.includes('_validateSchema') && 
                       content.includes('_validateBounds') && 
                       content.includes('_validateAssets') && 
                       content.includes('_validateConstraints');
            } catch (error) {
                return false;
            }
        }
    },
    { 
        item: 'Error handling with custom error types', 
        check: () => {
            try {
                const filePath = path.join(projectRoot, 'src/types/LevelSchema.ts');
                if (!fs.existsSync(filePath)) return false;
                const content = fs.readFileSync(filePath, 'utf8');
                return content.includes('ValidationError') && 
                       content.includes('NetworkError') && 
                       content.includes('ParseError');
            } catch (error) {
                return false;
            }
        }
    },
    { 
        item: 'Test level JSON files exist', 
        check: () => {
            try {
                const levelsDir = path.join(projectRoot, 'public/levels');
                if (!fs.existsSync(levelsDir)) return false;
                const files = fs.readdirSync(levelsDir);
                return files.length >= 4;
            } catch (error) {
                return false;
            }
        }
    }
];

checklist.forEach(({ item, check }) => {
    const passed = check();
    console.log(`${passed ? '✅' : '❌'} ${item}`);
});

console.log('\n🎯 Summary:');

if (!allFilesExist) {
    console.log('❌ Missing files:');
    missingFiles.forEach(file => console.log(`   - ${file}`));
    console.log('\n📝 Create missing files first, then run:');
    console.log('   npm run dev');
    console.log('   # Then visit: http://localhost:3000/level-loader-test');
} else {
    console.log('✅ All required files exist!');
    console.log('\n🚀 Next Steps:');
    console.log('1. Make sure the development server is running:');
    console.log('   npm run dev');
    console.log('\n2. Open your browser and visit:');
    console.log('   http://localhost:3000/level-loader-test');
    console.log('\n3. Follow the testing instructions on the page.');
    console.log('\n4. Check browser console (F12) for additional debug info.');
}

console.log('\n📊 Quick Commands:');
console.log('   # Create missing directories');
console.log('   mkdir -p src/app/level-loader-test');
console.log('   mkdir -p public/levels');
console.log('\n   # Check TypeScript compilation');
console.log('   npx tsc --noEmit');