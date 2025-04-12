declare function loadEmojiLib(): void;
declare function loadOpcodeLib(): void;
declare function compile(code: string): Promise<{
    bytecode: string;
    abi: string;
    metadata: string;
    solidityInterface: string;
    sonatina: string;
}>;

declare const emojity: Promise<{
    compile: typeof compile;
    loadEmojiLib: typeof loadEmojiLib;
    loadOpcodeLib: typeof loadOpcodeLib;
}>;

export = emojity;