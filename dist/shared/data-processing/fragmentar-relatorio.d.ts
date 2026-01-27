import type { FileEntryFragmentacao, FragmentOptions, Manifest, ManifestPartFragmentacao, RelatorioCompletoFragmentacao } from '../../types/index.js';
type FileEntry = FileEntryFragmentacao;
type ManifestPart = ManifestPartFragmentacao;
type RelatorioCompleto = RelatorioCompletoFragmentacao;
export type { FileEntry, FragmentOptions, Manifest, ManifestPart, RelatorioCompleto, };
export declare function fragmentarRelatorio(relatorioFull: RelatorioCompleto, dir: string, ts: string, options?: FragmentOptions): Promise<{
    manifestFile: string;
    manifest: Manifest;
}>;
export default fragmentarRelatorio;
//# sourceMappingURL=fragmentar-relatorio.d.ts.map