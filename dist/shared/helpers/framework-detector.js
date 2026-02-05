import fs from 'node:fs';
import path from 'node:path';
export function detectarFrameworks(rootDir) {
    const frameworks = [];
    try {
        const packageJsonPath = path.join(rootDir, 'package.json');
        if (!fs.existsSync(packageJsonPath)) {
            return frameworks;
        }
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
        const dependencies = packageJson.dependencies || {};
        const devDependencies = packageJson.devDependencies || {};
        const knownFrameworks = [
            { pkg: 'discord.js', name: 'Discord.js' },
            { pkg: '@discordjs/rest', name: 'Discord.js' },
            { pkg: 'stripe', name: 'Stripe' },
            { pkg: '@stripe/stripe-js', name: 'Stripe' },
            { pkg: 'aws-sdk', name: 'AWS SDK' },
            { pkg: '@aws-sdk/client-s3', name: 'AWS SDK' },
            { pkg: 'express', name: 'Express' },
            { pkg: 'fastify', name: 'Fastify' },
            { pkg: 'next', name: 'Next.js' },
            { pkg: 'react', name: 'React' },
            { pkg: 'vue', name: 'Vue' },
            { pkg: '@angular/core', name: 'Angular' },
        ];
        for (const { pkg, name } of knownFrameworks) {
            if (dependencies[pkg]) {
                frameworks.push({
                    name,
                    version: dependencies[pkg],
                    isDev: false,
                });
            }
            else if (devDependencies[pkg]) {
                frameworks.push({
                    name,
                    version: devDependencies[pkg],
                    isDev: true,
                });
            }
        }
        const unique = frameworks.reduce((acc, curr) => {
            if (!acc.find((f) => f.name === curr.name)) {
                acc.push(curr);
            }
            return acc;
        }, []);
        return unique;
    }
    catch {
        return frameworks;
    }
}
export function hasFramework(rootDir, frameworkName) {
    const frameworks = detectarFrameworks(rootDir);
    return frameworks.some((f) => f.name === frameworkName);
}
//# sourceMappingURL=framework-detector.js.map