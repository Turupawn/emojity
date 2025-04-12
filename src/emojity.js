// Helper to check if we're in browser environment
const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';

if (!isBrowser) {
  const { loadEmojiLib } = require('./emoji/emoji');
  const { loadOpcodeLib } = require('./evm/evm');
  const { compile } = require('./compiler/compiler');
}

// Modified script loading logic
const loadScripts = new Promise((resolve) => {
    if (!isBrowser) {
        // In Node.js environment, require the files directly
        try {
            require('./lib/emoji-mart@latest_dist_browser.js');
            require('./lib/js-sha3@0.8.0_build_sha3.min.js');
            require('./lib/web3_1.3.5_web3.min.js');
            require('./lib/twemoji.min.js');
            require('./emoji/emoji.js');
            require('./evm/evm.js');
            require('./evm/instructions.js');
            require('./evm/memory.js');
            require('./compiler/irCode.js');
            require('./compiler/compiler.js');
            require('./compiler/parser.js');
            require('./compiler/utils.js');
            require('./compiler/sonatina.js');
            resolve();
        } catch (error) {
            console.error('Error loading Node.js dependencies:', error);
            throw error;
        }
        return;
    }

    const scripts = [
        "src/lib/emoji-mart@latest_dist_browser.js",
        "src/lib/js-sha3@0.8.0_build_sha3.min.js",
        "src/lib/web3_1.3.5_web3.min.js",
        "src/lib/twemoji.min.js",
        "src/globals/globals.js",
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
});

// Initialize function
const initialize = () => {
    return new Promise((resolve) => {
        loadScripts.then(() => {
            if (typeof loadEmojiLib === 'function') loadEmojiLib();
            if (typeof loadOpcodeLib === 'function') loadOpcodeLib();
            resolve({
                compile: compile,
                loadEmojiLib: loadEmojiLib,
                loadOpcodeLib: loadOpcodeLib
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