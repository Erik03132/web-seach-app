import fs from 'fs';

const COLORS = {
    reset: "\x1b[0m",
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    bold: "\x1b[1m"
};

const log = (color: string, msg: string) => console.log(`${color}${msg}${COLORS.reset}`);

// --- CONFIGURATION ---
// Customize these for your specific project within the template
const CONFIG = {
    requiredEnvVars: ['NEXT_PUBLIC_FIREBASE_API_KEY', 'GEMINI_API_KEY'], // Add others like OPENAI_API_KEY as needed
    requiredFiles: [
        'src/components/MobileNav.tsx', // Enforce Mobile-First
        'CLAUDE.md',
        'README.md'
    ],
    requiredDeps: [
        'lucide-react',
        'framer-motion',
        '@google/generative-ai' // AI-First template
    ]
};
// ---------------------

console.log(`${COLORS.bold}${COLORS.blue}🚀 Initiating 'Go to Stars' Protocol...${COLORS.reset}\n`);

let hasErrors = false;

// 1. Environment Check
log(COLORS.yellow, "1. Checking Environment...");
if (fs.existsSync('.env.local')) {
    const envContent = fs.readFileSync('.env.local', 'utf-8');
    const missingKeys = CONFIG.requiredEnvVars.filter(key => !envContent.includes(key));

    if (missingKeys.length > 0) {
        log(COLORS.red, `❌ Missing API Keys in .env.local: ${missingKeys.join(', ')}`);
        hasErrors = true;
    } else {
        log(COLORS.green, "✅ Environment variables present.");
    }
} else {
    log(COLORS.red, "❌ .env.local not found! Copy .env.template to .env.local and fill it.");
    hasErrors = true;
}

// 2. Project Structure & Rules Check
log(COLORS.yellow, "\n2. Checking Project Structure...");
CONFIG.requiredFiles.forEach(file => {
    if (fs.existsSync(file)) {
        log(COLORS.green, `✅ Found ${file}`);
    } else {
        log(COLORS.red, `❌ Missing critical file: ${file}`);
        hasErrors = true;
    }
});

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

const missingDeps = CONFIG.requiredDeps.filter(d => !deps[d]);
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
