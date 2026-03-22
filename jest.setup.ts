// Polyfill TextEncoder/TextDecoder for some dependencies that expect them in the test environment
import { TextDecoder, TextEncoder } from 'util';
import 'cross-fetch/polyfill';
import '@testing-library/jest-dom/jest-globals';
import '@testing-library/jest-dom';
(global as any).TextEncoder = TextEncoder;
(global as any).TextDecoder = TextDecoder;

// Polyfill global.crypto with Node's Web Crypto (provides subtle.digest)
// Some dependencies call crypto.subtle.digest which isn't available in the
// default Jest JSDOM environment.
try {
    // Node 16.0+ exposes webcrypto
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { webcrypto } = require('crypto');
    if (webcrypto && !(global as any).crypto) {
        (global as any).crypto = webcrypto;
    }
} catch (e) {
    // If the environment doesn't have Node crypto, tests that rely on
    // crypto.subtle will need to be mocked in their suites.
}

let originalLocalStorage: Storage;
const localStorageMock: Storage = {
    clear() {
        this.store = {};
    },
    getItem(key) {
        return this.store[key];
    },
    key() {
        return 'test key';
    },
    length: 0,
    removeItem(key) {
        delete this.store[key];
    },
    setItem(key, value) {
        this.store[key] = value.toString();
    },
    store: {},
};

export const mockLocalStorageBeforeEachTest = () => {
    originalLocalStorage = global.localStorage;
    Object.defineProperty(global, 'localStorage', { value: localStorageMock });
};

export const restoreLocalStorageAfterEachTest = () => {
    Object.defineProperty(global, 'localStorage', { value: originalLocalStorage });
};

Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
    })),
});
