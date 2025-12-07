/**
 * Mock-Daten für Tests
 */

module.exports = {
    // Avatar-Mappings für Tests
    AVATAR_VOICE_MAP: {
        'Maxx': { voice: 'ash', image: 'maxx.png' },
        'Terra': { voice: 'sage', image: 'terra.png' },
        'Nova': { voice: 'nova', image: 'nova.png' },
        'Nyxari': { voice: 'coral', image: 'nyxari.png' }
    },

    // Test-Texte verschiedener Längen
    TEST_TEXTS: {
        SHORT: "Hallo, wie geht es dir?",
        MEDIUM: "Dies ist ein mittellanger Testtext mit mehreren Sätzen. Er enthält genug Inhalt, um die Verarbeitung zu testen. Die Qualität sollte gut sein.",
        LONG: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.",
        VERY_LONG: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. ".repeat(100),
    },

    // Test-Charaktere
    TEST_CHARACTERS: [
        { name: 'Maxx', voice: 'ash', id: 'maxx' },
        { name: 'Terra', voice: 'sage', id: 'terra' },
        { name: 'Nova', voice: 'nova', id: 'nova' },
        { name: 'Nyxari', voice: 'coral', id: 'nyxari' }
    ],

    // Mock-Audio-Buffer
    MOCK_AUDIO_BUFFER: Buffer.from([
        0xFF, 0xFB, 0x90, 0x00, // MP3 Header
        ...Array(1000).fill(0x00) // Dummy Audio-Daten
    ]),

    // Test-Pfade
    TEST_PATHS: {
        TMP: '/tmp/etts-test',
        VIDEOS: '/tmp/etts-test/videos',
        AUDIO: '/tmp/etts-test/audio',
        IMAGES: '/tmp/etts-test/images'
    },

    // Test-Events
    TEST_EVENTS: {
        TTS_PLAYBACK: { text: 'Test audio', avatar: 'Nova|nova' },
        TTS_SAVE: { text: 'Test save', filePath: '/tmp/test.mp3', avatar: 'Maxx|ash' },
        PROGRESS_UPDATE: { progress: 50, totalBlocks: 4, currentBlock: 2, blockProgress: 75 }
    }
};
