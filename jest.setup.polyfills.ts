// Polyfills that must run before modules are imported in tests
// Provide a global.crypto.webcrypto implementation so modules that access
// crypto.subtle.digest at import-time don't break in Jest's environment.

try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { webcrypto } = require('crypto');
    if (webcrypto && !(global as any).crypto) {
        (global as any).crypto = webcrypto;
        // also expose on globalThis and window for modules that access `window.crypto` or `globalThis.crypto`
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (globalThis as any).crypto = webcrypto;
        } catch (e) {
            // ignore
        }
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            if (typeof window !== 'undefined') (window as any).crypto = webcrypto;
        } catch (e) {
            // ignore
        }
    }
} catch (e) {
    // nothing we can do if webcrypto isn't available
}

// If crypto.subtle.digest is still not available (some Node/JSDOM combos), provide a simple
// polyfill that uses Node's `crypto.createHash` under the hood so code that calls
// `crypto.subtle.digest` (like @deriv-com/utils.hashObject) will work in tests.
try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-var-requires
    const globalAny: any = globalThis as any;
    if (globalAny.crypto && (!globalAny.crypto.subtle || typeof globalAny.crypto.subtle.digest !== 'function')) {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const nodeCrypto = require('crypto');
        const toBuffer = (input: ArrayBuffer | ArrayBufferView) => {
            if (ArrayBuffer.isView(input)) return Buffer.from((input as ArrayBufferView).buffer, (input as ArrayBufferView).byteOffset, (input as ArrayBufferView).byteLength);
            return Buffer.from(input as ArrayBuffer);
        };

        globalAny.crypto.subtle = {
            digest: async (algorithm: string, data: ArrayBuffer | ArrayBufferView) => {
                const buf = toBuffer(data);
                // only support SHA-256 for the test polyfill (used by hashObject)
                const hash = nodeCrypto.createHash('sha256').update(buf).digest();
                return hash.buffer.slice(hash.byteOffset, hash.byteOffset + hash.byteLength);
            },
        };
        // mirror on window if present
        try {
            if (typeof window !== 'undefined') (window as any).crypto = globalAny.crypto;
        } catch (e) {
            // ignore
        }
    }
} catch (e) {
    // ignore polyfill errors
}

// Provide a safe noop for window.location.assign in JSDOM so tests that
// trigger navigation don't throw "Not implemented: navigation" errors.
try {
    if (typeof window !== 'undefined' && window.location) {
        try {
            // First attempt: override assign on the location object
            Object.defineProperty(window.location, 'assign', {
                configurable: true,
                writable: true,
                value: () => undefined,
            });
            // also guard replace just in case components call it
            try {
                Object.defineProperty(window.location, 'replace', {
                    configurable: true,
                    writable: true,
                    value: () => undefined,
                });
            } catch (e) {
                // ignore
            }
        } catch (e) {
            // If overriding the existing property fails (non-configurable), replace the whole
            // window.location object with a shallow copy that includes noop assign/replace.
            try {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const loc: any = (window as any).location || {};
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                Object.defineProperty(window, 'location', {
                    configurable: true,
                    enumerable: true,
                    writable: true,
                    value: {
                        ...loc,
                        assign: () => undefined,
                        replace: () => undefined,
                        href: loc.href || '',
                    },
                });
            } catch (e2) {
                // last resort: monkey-patch via any cast (may be ignored if read-only)
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                try { (window as any).location = { ...(window as any).location, assign: () => undefined, replace: () => undefined }; } catch (e3) { /* ignore */ }
            }
        }
    }
} catch (e) {
    // ignore if window isn't available at this stage
}
