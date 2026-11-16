/** Small ZIP STORE writer for UTF-8 text exports; no runtime dependency. */
export declare function textZip(files: Record<string, string>): Uint8Array<ArrayBuffer>;
export declare function downloadTextZip(name: string, files: Record<string, string>): void;
