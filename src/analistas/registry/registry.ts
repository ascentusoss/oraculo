// SPDX-License-Identifier: MIT
// Analistas de melhorias e correções automáticas (unificado)
// Resolve analistas de correção automática dinamicamente para compatibilidade com múltiplas formas de export
// analistaFantasma not exported from js-ts/fantasma; that module provides detectarFantasmas used by zeladores
import { analistaArquitetura } from '@analistas/detectores/detector-arquitetura.js';
import { analistaCodigoFragil } from '@analistas/detectores/detector-codigo-fragil.js';
// Novos analistas refinados
import { analistaConstrucoesSintaticas } from '@analistas/detectores/detector-construcoes-sintaticas.js';
import * as detectorDependenciasMod from '@analistas/detectores/detector-dependencias.js';
import { analistaDuplicacoes } from '@analistas/detectores/detector-duplicacoes.js';
import * as detectorEstruturaMod from '@analistas/detectores/detector-estrutura.js';
import detectorInterfacesInline from '@analistas/detectores/detector-interfaces-inline.js';
// Analistas especializados complementares
import { analistaSeguranca } from '@analistas/detectores/detector-seguranca.js';
import detectorTiposInseguros from '@analistas/detectores/detector-tipos-inseguros.js';
// Analistas contextuais inteligentes
import { analistaSugestoesContextuais } from '@analistas/estrategistas/sugestoes-contextuais.js';
import { analistaComandosCli } from '@analistas/js-ts/analista-comandos-cli.js';
import { analistaFuncoesLongas } from '@analistas/js-ts/analista-funcoes-longas.js';
import { analistaPadroesUso } from '@analistas/js-ts/analista-padroes-uso.js';
import { analistaTodoComments } from '@analistas/js-ts/analista-todo-comments.js';
// Plugins opcionais (movidos para @analistas/plugins/)
import { analistaDocumentacao } from '@analistas/plugins/detector-documentacao.js';
import { detectorMarkdown } from '@analistas/plugins/detector-markdown.js';
import { comSupressaoInline } from '@shared/helpers/analista-wrapper.js';

import type {
  Analista,
  EntradaRegistry,
  InfoAnalista,
  ModuloAnalista,
  Tecnica,
} from '@';

let analistaCorrecaoAutomatica: EntradaRegistry = undefined;
try {
  const mod = await import('@analistas/corrections/analista-pontuacao.js');
  // conservatively treat dynamic module shapes as unknown, avoid `any`
  const dynamicMod = mod as ModuloAnalista;
  analistaCorrecaoAutomatica =
    dynamicMod.analistaCorrecaoAutomatica ??
    dynamicMod.analistas?.[0] ??
    (dynamicMod.default as EntradaRegistry) ??
    undefined;
} catch {
  // leave undefined - registry will tolerate undefined entries
}

let analistaReact: EntradaRegistry | undefined = undefined;
try {
  const mod =
    (await import('@analistas/plugins/analista-react.js')) as ModuloAnalista;
  analistaReact = (mod.analistaReact ?? mod.default ?? mod.analistas?.[0]) as
    | EntradaRegistry
    | undefined;
} catch {
  // opcional: plugin ausente, continuar sem React
}

let analistaReactHooks: EntradaRegistry | undefined = undefined;
try {
  const mod =
    (await import('@analistas/plugins/analista-react-hooks.js')) as ModuloAnalista;
  analistaReactHooks = (mod.analistaReactHooks ??
    mod.default ??
    mod.analistas?.[0]) as EntradaRegistry | undefined;
} catch {
  // opcional: plugin ausente, continuar sem Hooks
}

let analistaTailwind: EntradaRegistry | undefined = undefined;
try {
  const mod =
    (await import('@analistas/plugins/analista-tailwind.js')) as ModuloAnalista;
  analistaTailwind = (mod.analistaTailwind ??
    mod.default ??
    mod.analistas?.[0]) as EntradaRegistry | undefined;
} catch {
  // opcional: plugin ausente, continuar sem Tailwind
}

let analistaCss: EntradaRegistry | undefined = undefined;
try {
  const mod =
    (await import('@analistas/plugins/analista-css.js')) as ModuloAnalista;
  analistaCss = (mod.analistaCss ?? mod.default ?? mod.analistas?.[0]) as
    | EntradaRegistry
    | undefined;
} catch {
  // opcional: plugin ausente, continuar sem CSS
}

let analistaCssInJs: EntradaRegistry | undefined = undefined;
try {
  const mod =
    (await import('@analistas/plugins/analista-css-in-js.js')) as ModuloAnalista;
  analistaCssInJs = (mod.analistaCssInJs ??
    mod.default ??
    mod.analistas?.[0]) as EntradaRegistry | undefined;
} catch {
  // opcional: plugin ausente, continuar sem CSS-in-JS
}

let analistaHtml: EntradaRegistry | undefined = undefined;
try {
  const mod =
    (await import('@analistas/plugins/analista-html.js')) as ModuloAnalista;
  analistaHtml = (mod.analistaHtml ?? mod.default ?? mod.analistas?.[0]) as
    | EntradaRegistry
    | undefined;
} catch {
  // opcional: plugin ausente, continuar sem HTML
}

let analistaXml: EntradaRegistry | undefined = undefined;
try {
  const mod =
    (await import('@analistas/plugins/analista-xml.js')) as ModuloAnalista;
  analistaXml = (mod.analistaXml ?? mod.default ?? mod.analistas?.[0]) as
    | EntradaRegistry
    | undefined;
} catch {
  // opcional: plugin ausente, continuar sem XML
}

let analistaFormatador: EntradaRegistry | undefined = undefined;
try {
  const mod =
    (await import('@analistas/plugins/analista-formater.js')) as ModuloAnalista;
  analistaFormatador = (mod.analistaFormatador ??
    mod.default ??
    mod.analistas?.[0]) as EntradaRegistry | undefined;
} catch {
  // opcional: plugin ausente, continuar sem analista de formatação
}

let analistaSvg: EntradaRegistry | undefined = undefined;
try {
  const mod =
    (await import('@analistas/plugins/analista-svg.js')) as ModuloAnalista;
  analistaSvg = (mod.analistaSvg ?? mod.default ?? mod.analistas?.[0]) as
    | EntradaRegistry
    | undefined;
} catch {
  // opcional: plugin ausente, continuar sem SVG
}
let analistaPython: EntradaRegistry | undefined = undefined;
try {
  const mod =
    (await import('@analistas/plugins/analista-python.js')) as ModuloAnalista;
  analistaPython = (mod.analistaPython ?? mod.default ?? mod.analistas?.[0]) as
    | EntradaRegistry
    | undefined;
} catch {
  // opcional: plugin ausente, continuar sem Python
}

// Registro central de analistas. Futuro: lazy loading, filtros por categoria.
const detectorDependencias =
  (detectorDependenciasMod as ModuloAnalista).detectorDependencias ??
  (detectorDependenciasMod as ModuloAnalista).default ??
  detectorDependenciasMod;

const detectorEstrutura =
  (detectorEstruturaMod as ModuloAnalista).detectorEstrutura ??
  (detectorEstruturaMod as ModuloAnalista).default ??
  detectorEstruturaMod;

export const registroAnalistas: (Analista | Tecnica)[] = [
  // Analistas existentes
  comSupressaoInline(detectorDependencias as unknown as Analista) as Tecnica,
  comSupressaoInline(detectorEstrutura as unknown as Analista) as Tecnica,
  comSupressaoInline(analistaFuncoesLongas as Analista),
  comSupressaoInline(analistaPadroesUso as unknown as Analista) as Tecnica,
  comSupressaoInline(analistaComandosCli as unknown as Analista) as Tecnica,
  comSupressaoInline(analistaTodoComments as unknown as Analista) as Tecnica,

  // Novos analistas refinados
  comSupressaoInline(analistaConstrucoesSintaticas),
  comSupressaoInline(analistaCodigoFragil),
  comSupressaoInline(analistaDuplicacoes),
  comSupressaoInline(analistaArquitetura),

  // Analistas especializados complementares
  // Analistas especializados complementares
  comSupressaoInline(analistaSeguranca),
  comSupressaoInline(analistaDocumentacao),
  comSupressaoInline(detectorMarkdown as unknown as Analista),
  comSupressaoInline(detectorTiposInseguros as unknown as Analista),
  comSupressaoInline(detectorInterfacesInline as unknown as Analista),
  // Plugins opcionais (React, Hooks, Tailwind) - carregados só se disponíveis
  ...(analistaReact
    ? [comSupressaoInline(analistaReact as unknown as Analista) as Tecnica]
    : []),
  ...(analistaReactHooks
    ? [comSupressaoInline(analistaReactHooks as unknown as Analista) as Tecnica]
    : []),
  ...(analistaTailwind
    ? [comSupressaoInline(analistaTailwind as unknown as Analista) as Tecnica]
    : []),
  ...(analistaCss
    ? [comSupressaoInline(analistaCss as unknown as Analista) as Tecnica]
    : []),
  ...(analistaCssInJs
    ? [comSupressaoInline(analistaCssInJs as unknown as Analista) as Tecnica]
    : []),
  ...(analistaHtml
    ? [comSupressaoInline(analistaHtml as unknown as Analista) as Tecnica]
    : []),
  ...(analistaXml
    ? [comSupressaoInline(analistaXml as unknown as Analista) as Tecnica]
    : []),
  ...(analistaFormatador
    ? [comSupressaoInline(analistaFormatador as unknown as Analista) as Tecnica]
    : []),
  ...(analistaSvg
    ? [comSupressaoInline(analistaSvg as unknown as Analista) as Tecnica]
    : []),
  // Analistas contextuais inteligentes
  analistaSugestoesContextuais,
  ...(analistaPython
    ? [comSupressaoInline(analistaPython as unknown as Analista) as Tecnica]
    : []),

  // Analistas de melhorias e correções automáticas
  // If analistaCorrecaoAutomatica couldn't be resolved, skip the entry
  ...(analistaCorrecaoAutomatica ? [analistaCorrecaoAutomatica] : []),
];

export function listarAnalistas(): InfoAnalista[] {
  return registroAnalistas.map((a) => ({
    nome: (a as Analista).nome || 'desconhecido',
    categoria: (a as Analista).categoria || 'n/d',
    descricao: (a as Analista).descricao || '',
  }));
}
