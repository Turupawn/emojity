export interface EmojityCompilation {
  bytecode: string;
  abi: string;
  metadata: string;
  solidityInterface: string;
  sonatina: string;
}

export interface EmojityCompiler {
  compile(code: string): Promise<EmojityCompilation>;
  generateABI(): string;
  generateSolidityInterface(): string;
  generateJsonMetadata(
    abi: string,
    compilerVersion: string,
    backend: string,
    license: string,
    fileKeccak256: string,
    urls: string[]
  ): string;
  deploy(abi: string, bytecode: string): Promise<void>;
}

declare const compileEmojity: EmojityCompiler;
export default compileEmojity; 