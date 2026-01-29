// SPDX-License-Identifier: MIT

import fs from 'node:fs';
import path from 'node:path';

import type { FrameworkInfo } from '@';

export type { FrameworkInfo };

/**
 * Detecta frameworks instalados no projeto via package.json
 */
export function detectarFrameworks(rootDir: string): FrameworkInfo[] {
  const frameworks: FrameworkInfo[] = [];

  try {
    const packageJsonPath = path.join(rootDir, 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
      return frameworks;
    }

    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    const dependencies = packageJson.dependencies || {};
    const devDependencies = packageJson.devDependencies || {};

    // Lista de frameworks conhecidos com seus identificadores
    const knownFrameworks = [
      { pkg: 'discord.js', name: 'Discord.js' },
      { pkg: '/rest', name: 'Discord.js' },
      { pkg: 'stripe', name: 'Stripe' },
      { pkg: '/stripe-js', name: 'Stripe' },
      { pkg: 'aws-sdk', name: 'AWS SDK' },
      { pkg: '/client-s3', name: 'AWS SDK' },
      { pkg: 'express', name: 'Express' },
      { pkg: 'fastify', name: 'Fastify' },
      { pkg: 'next', name: 'Next.js' },
      { pkg: 'react', name: 'React' },
      { pkg: 'vue', name: 'Vue' },
      { pkg: '/core', name: 'Angular' },
    ];

    // Verificar dependências
    for (const { pkg, name } of knownFrameworks) {
      if (dependencies[pkg]) {
        frameworks.push({
          name,
          version: dependencies[pkg],
          isDev: false,
        });
      } else if (devDependencies[pkg]) {
        frameworks.push({
          name,
          version: devDependencies[pkg],
          isDev: true,
        });
      }
    }

    // Remover duplicatas (mesma framework em prod e dev)
    const unique = frameworks.reduce((acc, curr) => {
      if (!acc.find((f) => f.name === curr.name)) {
        acc.push(curr);
      }
      return acc;
    }, [] as FrameworkInfo[]);

    return unique;
  } catch {
    return frameworks;
  }
}

/**
 * Verifica se um framework específico está instalado
 */
export function hasFramework(rootDir: string, frameworkName: string): boolean {
  const frameworks = detectarFrameworks(rootDir);
  return frameworks.some((f) => f.name === frameworkName);
}
