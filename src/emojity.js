// Create a promise that resolves when all scripts are loaded
const loadScripts = new Promise((resolve) => {
    const scripts = [
        "src/lib/emoji-mart@latest_dist_browser.js",
        "src/lib/js-sha3@0.8.0_build_sha3.min.js.js",
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
});

// Wait for scripts to load before initializing
loadScripts.then(() => {
    (function(root, factory) {
        if (typeof define === 'function' && define.amd) {
            // AMD
            define([], factory);
        } else if (typeof module === 'object' && module.exports) {
            // Node
            module.exports = factory();
        } else {
            // Browser
            root.emojity = factory();
        }
    }(typeof self !== 'undefined' ? self : this, function() {
        // Initialize required libraries
        loadEmojiLib();
        loadOpcodeLib();

        // Return the public API
        return {
            compile: compile,
            loadEmojiLib: loadEmojiLib,
            loadOpcodeLib: loadOpcodeLib
        };
    }));
}); 