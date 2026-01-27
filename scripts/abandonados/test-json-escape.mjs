import { stringifyJsonEscaped } from '../dist/shared/data-processing/json.js';

const exemplo = {
    mensagem: 'Olá, Oráculo — teste com acentos e emoji 😃',
    caminho: 'src/arquivoTeste.ts',
    detalhes: ['linha 1: comentário', 'linha 2: variável ç'],
};

console.log('--- UTF-8 (padrão) ---');
console.log(stringifyJsonEscaped(exemplo, 2, { asciiOnly: false }));

console.log('\n--- ASCII-only (\\uXXXX) ---');
console.log(stringifyJsonEscaped(exemplo, 2, { asciiOnly: true }));
