export const DISCORD_LIMITS = [
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
export const HTTP_STATUS_CODES = [
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
export const COMMON_LIMITS = [
    { value: 20, description: 'Paginação padrão (20 items)' },
    { value: 50, description: 'Paginação média (50 items)' },
    { value: 5000, description: 'Limite comum de batch operations' },
    { value: 10000, description: 'Limite de query results' },
];
export const MATH_CONSTANTS = [
    { value: -1, description: 'Index not found' },
    { value: 0, description: 'Zero/inicial' },
    { value: 1, description: 'Um/incremento' },
    { value: 2, description: 'Dois/par' },
    { value: 10, description: 'Base decimal' },
    { value: 100, description: 'Porcentagem' },
    { value: 1000, description: 'Milhar/conversão ms→s' },
];
export const FRAMEWORK_WHITELISTS = {
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
export function isWhitelistedConstant(value, frameworks, userWhitelist) {
    if (userWhitelist && userWhitelist.includes(value)) {
        return true;
    }
    if (MATH_CONSTANTS.some((rule) => rule.value === value)) {
        return true;
    }
    if (COMMON_LIMITS.some((rule) => rule.value === value)) {
        return true;
    }
    if (HTTP_STATUS_CODES.some((rule) => rule.value === value)) {
        return true;
    }
    for (const framework of frameworks) {
        const whitelist = FRAMEWORK_WHITELISTS[framework];
        if (whitelist && whitelist.some((rule) => rule.value === value)) {
            return true;
        }
    }
    return false;
}
export function getConstantDescription(value, frameworks) {
    const allRules = [
        ...MATH_CONSTANTS,
        ...COMMON_LIMITS,
        ...HTTP_STATUS_CODES,
        ...frameworks.flatMap((f) => FRAMEWORK_WHITELISTS[f] || []),
    ];
    const rule = allRules.find((r) => r.value === value);
    return rule?.description;
}
//# sourceMappingURL=magic-constants-whitelist.js.map