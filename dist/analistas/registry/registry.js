import { analistaArquitetura } from '../detectores/detector-arquitetura.js';
import { analistaCodigoFragil } from '../detectores/detector-codigo-fragil.js';
import { analistaConstrucoesSintaticas } from '../detectores/detector-construcoes-sintaticas.js';
import * as detectorDependenciasMod from '../detectores/detector-dependencias.js';
import { analistaDuplicacoes } from '../detectores/detector-duplicacoes.js';
import * as detectorEstruturaMod from '../detectores/detector-estrutura.js';
import detectorInterfacesInline from '../detectores/detector-interfaces-inline.js';
import { analistaSeguranca } from '../detectores/detector-seguranca.js';
import detectorTiposInseguros from '../detectores/detector-tipos-inseguros.js';
import { analistaSugestoesContextuais } from '../estrategistas/sugestoes-contextuais.js';
import { analistaComandosCli } from '../js-ts/analista-comandos-cli.js';
import { analistaFuncoesLongas } from '../js-ts/analista-funcoes-longas.js';
import { analistaPadroesUso } from '../js-ts/analista-padroes-uso.js';
import { analistaTodoComments } from '../js-ts/analista-todo-comments.js';
import { analistaDocumentacao } from '../plugins/detector-documentacao.js';
import { detectorMarkdown } from '../plugins/detector-markdown.js';
import { comSupressaoInline } from '../../shared/helpers/analista-wrapper.js';
let analistaCorrecaoAutomatica = undefined;
try {
    const mod = await import('../corrections/analista-pontuacao.js');
    const dynamicMod = mod;
    analistaCorrecaoAutomatica =
        dynamicMod.analistaCorrecaoAutomatica ??
            dynamicMod.analistas?.[0] ??
            dynamicMod.default ??
            undefined;
}
catch {
}
let analistaReact = undefined;
try {
    const mod = (await import('../plugins/analista-react.js'));
    analistaReact = (mod.analistaReact ?? mod.default ?? mod.analistas?.[0]);
}
catch {
}
let analistaReactHooks = undefined;
try {
    const mod = (await import('../plugins/analista-react-hooks.js'));
    analistaReactHooks = (mod.analistaReactHooks ??
        mod.default ??
        mod.analistas?.[0]);
}
catch {
}
let analistaTailwind = undefined;
try {
    const mod = (await import('../plugins/analista-tailwind.js'));
    analistaTailwind = (mod.analistaTailwind ??
        mod.default ??
        mod.analistas?.[0]);
}
catch {
}
let analistaCss = undefined;
try {
    const mod = (await import('../plugins/analista-css.js'));
    analistaCss = (mod.analistaCss ?? mod.default ?? mod.analistas?.[0]);
}
catch {
}
let analistaCssInJs = undefined;
try {
    const mod = (await import('../plugins/analista-css-in-js.js'));
    analistaCssInJs = (mod.analistaCssInJs ??
        mod.default ??
        mod.analistas?.[0]);
}
catch {
}
let analistaHtml = undefined;
try {
    const mod = (await import('../plugins/analista-html.js'));
    analistaHtml = (mod.analistaHtml ?? mod.default ?? mod.analistas?.[0]);
}
catch {
}
let analistaXml = undefined;
try {
    const mod = (await import('../plugins/analista-xml.js'));
    analistaXml = (mod.analistaXml ?? mod.default ?? mod.analistas?.[0]);
}
catch {
}
let analistaFormatador = undefined;
try {
    const mod = (await import('../plugins/analista-formater.js'));
    analistaFormatador = (mod.analistaFormatador ??
        mod.default ??
        mod.analistas?.[0]);
}
catch {
}
let analistaSvg = undefined;
try {
    const mod = (await import('../plugins/analista-svg.js'));
    analistaSvg = (mod.analistaSvg ?? mod.default ?? mod.analistas?.[0]);
}
catch {
}
let analistaPython = undefined;
try {
    const mod = (await import('../plugins/analista-python.js'));
    analistaPython = (mod.analistaPython ?? mod.default ?? mod.analistas?.[0]);
}
catch {
}
const detectorDependencias = detectorDependenciasMod.detectorDependencias ??
    detectorDependenciasMod.default ??
    detectorDependenciasMod;
const detectorEstrutura = detectorEstruturaMod.detectorEstrutura ??
    detectorEstruturaMod.default ??
    detectorEstruturaMod;
export const registroAnalistas = [
    comSupressaoInline(detectorDependencias),
    comSupressaoInline(detectorEstrutura),
    comSupressaoInline(analistaFuncoesLongas),
    comSupressaoInline(analistaPadroesUso),
    comSupressaoInline(analistaComandosCli),
    comSupressaoInline(analistaTodoComments),
    comSupressaoInline(analistaConstrucoesSintaticas),
    comSupressaoInline(analistaCodigoFragil),
    comSupressaoInline(analistaDuplicacoes),
    comSupressaoInline(analistaArquitetura),
    comSupressaoInline(analistaSeguranca),
    comSupressaoInline(analistaDocumentacao),
    comSupressaoInline(detectorMarkdown),
    comSupressaoInline(detectorTiposInseguros),
    comSupressaoInline(detectorInterfacesInline),
    ...(analistaReact
        ? [comSupressaoInline(analistaReact)]
        : []),
    ...(analistaReactHooks
        ? [comSupressaoInline(analistaReactHooks)]
        : []),
    ...(analistaTailwind
        ? [comSupressaoInline(analistaTailwind)]
        : []),
    ...(analistaCss
        ? [comSupressaoInline(analistaCss)]
        : []),
    ...(analistaCssInJs
        ? [comSupressaoInline(analistaCssInJs)]
        : []),
    ...(analistaHtml
        ? [comSupressaoInline(analistaHtml)]
        : []),
    ...(analistaXml
        ? [comSupressaoInline(analistaXml)]
        : []),
    ...(analistaFormatador
        ? [comSupressaoInline(analistaFormatador)]
        : []),
    ...(analistaSvg
        ? [comSupressaoInline(analistaSvg)]
        : []),
    analistaSugestoesContextuais,
    ...(analistaPython
        ? [comSupressaoInline(analistaPython)]
        : []),
    ...(analistaCorrecaoAutomatica ? [analistaCorrecaoAutomatica] : []),
];
export function listarAnalistas() {
    return registroAnalistas.map((a) => ({
        nome: a.nome || 'desconhecido',
        categoria: a.categoria || 'n/d',
        descricao: a.descricao || '',
    }));
}
//# sourceMappingURL=registry.js.map