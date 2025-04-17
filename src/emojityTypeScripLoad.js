// Helper to check if we're in browser environment
const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';

// Add Node.js exports
const fs = require('fs');
const path = require('path');

let compileEmojityCompiler;
let emojiLibLoaded = false;
let opcodeLibLoaded = false;

async function loadEmojiLib() {
    if (!emojiLibLoaded) {
        const emojiPath = path.join(__dirname, '..', 'csv', 'emojis.csv');
        const data = await fs.promises.readFile(emojiPath, 'utf8');
        emojiMap = parseCSVData(data);
        emojiLibLoaded = true;
    }
}

async function loadOpcodeLib() {
    if (!opcodeLibLoaded) {
        const opcodePath = path.join(__dirname, '..', 'csv', 'opcodes.csv');
        const data = await fs.promises.readFile(opcodePath, 'utf8');
        opcodeMap = parseCSVData(data);
        opcodeLibLoaded = true;
    }
}

async function compile(code) {
    if (!emojiLibLoaded || !opcodeLibLoaded) {
        throw new Error('compileEmojityCompiler not initialized. Please ensure loadEmojiLib() and loadOpcodeLib() are called first.');
    }

    const compiler = require('./compiler/compiler');
    return compiler.compile(code);
}

// Modified script loading logic
const loadScripts = new Promise((resolve) => {
    if (!isBrowser) {
        // In Node.js environment, require the files directly
        try {
            require('./lib/twemoji.min.js');
            require('./evm/memory.js');
            require('./evm/instructions.js');
            require('./lib/js-sha3@0.8.0_build_sha3.min.js');
            require('./emoji/emoji.js');
            require('./compiler/irCode.js');
            require('./compiler/compiler.js');
            require('./compiler/parser.js');
            require('./compiler/utils.js');
            require('./compiler/sonatina.js');
            
            // Make functions globally available in Node environment
            global.loadEmojiLib = loadEmojiLib;
            global.loadOpcodeLib = loadOpcodeLib;
            global.compileEmojity = require('./compiler/compiler.js').default;
            
            resolve();
        } catch (error) {
            console.error('Error loading Node.js dependencies:', error);
            throw error;
        }
    } else {
        const scripts = [
            "src/lib/emoji-mart@latest_dist_browser.js",
            "src/lib/js-sha3@0.8.0_build_sha3.min.js",
            "src/lib/web3_1.3.5_web3.min.js",
            "src/lib/twemoji.min.js",
            "src/emoji/emoji.js",
            "src/evm/evm.js",
            "src/evm/instructions.js",
            "src/evm/memory.js",
            "src/compiler/irCode.js",
            "src/compiler/compiler.js",
            "src/compiler/parser.js",
            "src/compiler/utils.js",
            "src/compiler/sonatina.js",
        ];

        let loaded = 0;
        scripts.forEach(src => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = () => {
                loaded++;
                if (loaded === scripts.length) {
                    resolve();
                }
            };
            document.head.appendChild(script);
        });
    }
});

// Modified initialize function
const initialize = () => {
    return new Promise((resolve) => {
        loadScripts.then(() => {
            // Ensure these are called regardless of environment
            loadEmojiLib();
            loadOpcodeLib();
            resolve({
                compile,
                loadEmojiLib,
                loadOpcodeLib
            });
        });
    });
};

// Export for different environments
if (typeof define === 'function' && define.amd) {
    // AMD
    define([], () => initialize());
} else if (typeof module === 'object' && module.exports) {
    // Node
    module.exports = initialize();
} else if (isBrowser) {
    // Browser
    window.emojity = initialize();
} 