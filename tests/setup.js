/**
 * Test-Setup für eTTS
 * Konfiguriert alle notwendigen Mock-Objekte und Umgebungsvariablen
 */

// Mock für .env
process.env.OPENAI_API_KEY = 'test-api-key-12345';
process.env.NODE_ENV = 'test';

// Mock für Electron (falls tests laufen)
jest.mock('electron', () => ({
    app: {
        getPath: jest.fn((pathType) => {
            if (pathType === 'videos') return '/tmp/test-videos';
            if (pathType === 'userData') return '/tmp/test-data';
            return '/tmp/test';
        }),
        whenReady: jest.fn(() => Promise.resolve()),
        quit: jest.fn(),
        on: jest.fn()
    },
    BrowserWindow: jest.fn().mockImplementation(() => ({
        loadFile: jest.fn(() => Promise.resolve()),
        webContents: {
            toggleDevTools: jest.fn(),
            openDevTools: jest.fn(),
            send: jest.fn()
        },
        on: jest.fn()
    })),
    ipcMain: {
        on: jest.fn(),
        handle: jest.fn()
    },
    dialog: {
        showOpenDialog: jest.fn(),
        showSaveDialog: jest.fn(),
        showErrorBox: jest.fn()
    },
    globalShortcut: {
        register: jest.fn()
    }
}), { virtual: true });

// Mock für @electron/remote
jest.mock('@electron/remote/main', () => ({
    initialize: jest.fn(),
    enable: jest.fn()
}), { virtual: true });

// Mock für OpenAI
jest.mock('openai', () => ({
    OpenAI: jest.fn().mockImplementation(() => ({
        audio: {
            speech: {
                create: jest.fn(async (config) => ({
                    arrayBuffer: async () => Buffer.from('mock-audio-data')
                }))
            }
        }
    }))
}), { virtual: true });

// Logging
console.log('✓ Test-Setup geladen');
