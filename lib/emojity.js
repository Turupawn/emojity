// Create a promise that resolves when all scripts are loaded
const loadScripts = new Promise((resolve) => {
    const scripts = [
        "lib/emoji/emoji.js",
        "lib/evm/evm.js",
        "lib/evm/instructions.js",
        "lib/evm/memory.js",
        "lib/compiler/irCode.js",
        "lib/compiler/compiler.js",
        "lib/compiler/parser.js",
        "lib/compiler/utils.js",
        "lib/compiler/sonatina.js",
        "lib/emoji/twemoji.min.js"
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