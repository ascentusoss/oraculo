// SPDX-License-Identifier: MIT

/**
 * Whitelist de magic constants conhecidos de frameworks populares.
 *
 * Esses valores são limitações documentadas de APIs externas e não devem
 * ser reportados como magic numbers, pois criar constantes para eles é verboso
 * e todos os desenvolvedores que usam essas APIs conhecem esses limites.
 */

import type { MagicConstantRule } from '@';

export type { MagicConstantRule };

/**
 * Discord.js API limits (oficialmente documentados)
 * @see https://discord.com/developers/docs/resources/channel#embed-limits
 * @see https://discord.com/developers/docs/interactions/message-components#select-menus
 */
export const DISCORD_LIMITS: MagicConstantRule[] = [
  { value: 10, description: 'Máximo de fields em embed' },
  { value: 25, description: 'Máximo de opções em SelectMenu' },
  { value: 90, description: 'Máximo de caracteres em button label' },
  { value: 100, description: 'Máximo de caracteres em select option label' },
  { value: 256, description: 'Máximo de caracteres em embed field name' },
  { value: 1024, description: 'Máximo de caracteres em embed field value' },
  { value: 2000, description: 'Máximo de caracteres em mensagem' },
  { value: 4000, description: 'Máximo de caracteres em embed description' },
  { value: 6000, description: 'Máximo total de caracteres em embed' },
];

/**
 * HTTP Status Codes comuns
 */
export const HTTP_STATUS_CODES: MagicConstantRule[] = [
  { value: 200, description: 'HTTP OK' },
  { value: 201, description: 'HTTP Created' },
  { value: 204, description: 'HTTP No Content' },
  { value: 400, description: 'HTTP Bad Request' },
  { value: 401, description: 'HTTP Unauthorized' },
  { value: 403, description: 'HTTP Forbidden' },
  { value: 404, description: 'HTTP Not Found' },
  { value: 500, description: 'HTTP Internal Server Error' },
  { value: 502, description: 'HTTP Bad Gateway' },
  { value: 503, description: 'HTTP Service Unavailable' },
];

/**
 * Limites comuns de paginação e performance
 */
export const COMMON_LIMITS: MagicConstantRule[] = [
  { value: 20, description: 'Paginação padrão (20 items)' },
  { value: 50, description: 'Paginação média (50 items)' },
  { value: 5000, description: 'Limite comum de batch operations' },
  { value: 10000, description: 'Limite de query results' },
];

/**
 * Valores matemáticos comuns (já cobertos no detector, mas listados para completude)
 */
export const MATH_CONSTANTS: MagicConstantRule[] = [
  { value: -1, description: 'Index not found' },
  { value: 0, description: 'Zero/inicial' },
  { value: 1, description: 'Um/incremento' },
  { value: 2, description: 'Dois/par' },
  { value: 10, description: 'Base decimal' },
  { value: 100, description: 'Porcentagem' },
  { value: 1000, description: 'Milhar/conversão ms→s' },
];

/**
 * Mapa de frameworks para suas whitelists
 */
export const FRAMEWORK_WHITELISTS: Record<string, MagicConstantRule[]> = {
  'Discord.js': DISCORD_LIMITS,
  Express: HTTP_STATUS_CODES,
  Fastify: HTTP_STATUS_CODES,
  'Next.js': HTTP_STATUS_CODES,
  React: [],
  Vue: [],
  Angular: [],
  Stripe: [],
  'AWS SDK': [],
};

/**
 * Verifica se um valor numérico está na whitelist para os frameworks detectados
 */
export function isWhitelistedConstant(
  value: number,
  frameworks: string[],
  userWhitelist?: number[],
): boolean {
  // Verificar whitelist do usuário primeiro
  if (userWhitelist && userWhitelist.includes(value)) {
    return true;
  }

  // Verificar valores matemáticos comuns (sempre válidos)
  if (MATH_CONSTANTS.some((rule) => rule.value === value)) {
    return true;
  }

  // Verificar limites comuns
  if (COMMON_LIMITS.some((rule) => rule.value === value)) {
    return true;
  }

  // Verificar HTTP status codes (sempre válidos em projetos web)
  if (HTTP_STATUS_CODES.some((rule) => rule.value === value)) {
    return true;
  }

  // Verificar whitelists específicas de frameworks
  for (const framework of frameworks) {
    const whitelist = FRAMEWORK_WHITELISTS[framework];
    if (whitelist && whitelist.some((rule) => rule.value === value)) {
      return true;
    }
  }

  return false;
}

/**
 * Obtém a descrição de um magic constant, se estiver na whitelist
 */
export function getConstantDescription(
  value: number,
  frameworks: string[],
): string | undefined {
  // Verificar todas as whitelists
  const allRules = [
    ...MATH_CONSTANTS,
    ...COMMON_LIMITS,
    ...HTTP_STATUS_CODES,
    ...frameworks.flatMap((f) => FRAMEWORK_WHITELISTS[f] || []),
  ];

  const rule = allRules.find((r) => r.value === value);
  return rule?.description;
}
