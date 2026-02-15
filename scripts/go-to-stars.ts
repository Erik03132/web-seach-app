import fs from 'fs';
import path from 'path';

const COLORS = {
    reset: "\x1b[0m",
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    bold: "\x1b[1m"
};

const log = (color: string, msg: string) => console.log(`${color}${msg}${COLORS.reset}`);

console.log(`${COLORS.bold}${COLORS.blue}🚀 Initiating 'Go to Stars' Protocol...${COLORS.reset}\n`);

let hasErrors = false;

// 1. Environment Check
log(COLORS.yellow, "1. Checking Environment...");
if (fs.existsSync('.env.local')) {
    const envContent = fs.readFileSync('.env.local', 'utf-8');
    const requiredKeys = ['GEMINI_API_KEY', 'NEXT_PUBLIC_FIREBASE_API_KEY'];
    const missingKeys = requiredKeys.filter(key => !envContent.includes(key));

    if (missingKeys.length > 0) {
        log(COLORS.red, `❌ Missing API Keys: ${missingKeys.join(', ')}`);
        hasErrors = true;
    } else {
        log(COLORS.green, "✅ Environment variables present.");
    }
} else {
    log(COLORS.red, "❌ .env.local not found!");
    hasErrors = true;
}

// 2. Mobile Adaptation Check
log(COLORS.yellow, "\n2. Checking Mobile Readiness...");
const componentsDir = path.join('src', 'components');
if (fs.existsSync(path.join(componentsDir, 'MobileNav.tsx'))) {
    log(COLORS.green, "✅ MobileNav component exists.");
} else {
    log(COLORS.red, "❌ MobileNav component missing! Mobile experience will be degraded.");
    hasErrors = true;
}

// 3. Configuration Integrity
log(COLORS.yellow, "\n3. Checking Configuration...");
const nextConfigPath = 'next.config.ts';
if (fs.existsSync(nextConfigPath)) {
    const configContent = fs.readFileSync(nextConfigPath, 'utf-8');
    if (configContent.includes('eslint: {') && configContent.includes('dirs:')) {
        log(COLORS.red, "❌ Deprecated ESLint config detected in next.config.ts (dirs option).");
        hasErrors = true;
    } else {
        log(COLORS.green, "✅ Next.js config looks modern.");
    }
}

// 4. Dependency Check
log(COLORS.yellow, "\n4. Checking Critical Dependencies...");
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
const requiredDeps = ['@google/generative-ai', 'lucide-react', 'framer-motion'];

const missingDeps = requiredDeps.filter(d => !deps[d]);
if (missingDeps.length > 0) {
    log(COLORS.red, `❌ Missing critical dependencies: ${missingDeps.join(', ')}`);
    hasErrors = true;
} else {
    log(COLORS.green, "✅ Core dependencies installed.");
}

console.log("\n------------------------------------------------");
if (hasErrors) {
    log(COLORS.red, "💥 System Check Failed. Please fix the issues above before launch.");
    process.exit(1);
} else {
    log(COLORS.green, "✨ All Systems Nominal. Ready to Code!");
    log(COLORS.blue, "   Next step: Run 'npm run dev' to start engines.");
}
