// SPDX-License-Identifier: MIT

/**
 * Minimal PackageJson shape used across the codebase. Keep it permissive
 * and typed enough for common reads (dependencies, devDependencies, scripts).
 */
export interface PackageJson {
  name?: string;
  version?: string;
  description?: string;
  main?: string;
  types?: string;
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
  workspaces?: string[] | { packages?: string[] };
  [key: string]: unknown;
}
