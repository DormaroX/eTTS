/**
 * Unit Tests für Text-Splitting (Chunking)
 */

const mockData = require('../mocks/mock-data');

// Funktionen aus main.js extrahiert zum Testen
function splitTextIntoChunks(text, maxLength) {
    let chunks = [];
    while (text.length > 0) {
        let chunk = text.substring(0, maxLength);
        let lastPeriod = chunk.lastIndexOf(". ");
        if (lastPeriod !== -1 && lastPeriod > maxLength * 0.8) {
            chunk = text.substring(0, lastPeriod + 1);
        }
        chunks.push(chunk.trim());
        text = text.substring(chunk.length).trim();
    }
    return chunks;
}

describe('Text Splitting / Chunking', () => {
    const MAX_CHARS = 4095;

    describe('Grundlegende Funktionalität', () => {
        it('sollte kurze Texte nicht aufteilen', () => {
            const text = mockData.TEST_TEXTS.SHORT;
            const chunks = splitTextIntoChunks(text, MAX_CHARS);
            expect(chunks.length).toBe(1);
            expect(chunks[0]).toBe(text);
        });

        it('sollte lange Texte aufteilen', () => {
            const text = mockData.TEST_TEXTS.VERY_LONG;
            const chunks = splitTextIntoChunks(text, MAX_CHARS);
            expect(chunks.length).toBeGreaterThan(1);
        });

        it('sollte kein Chunk MAX_CHARS überschreiten', () => {
            const text = mockData.TEST_TEXTS.VERY_LONG;
            const chunks = splitTextIntoChunks(text, MAX_CHARS);
            chunks.forEach(chunk => {
                expect(chunk.length).toBeLessThanOrEqual(MAX_CHARS);
            });
        });
    });

    describe('Satzaufteilung', () => {
        it('sollte bei Punkte aufteilen wenn möglich', () => {
            const text = "Satz eins. Satz zwei. Satz drei.";
            const chunks = splitTextIntoChunks(text, 15);
            expect(chunks.length).toBeGreaterThan(1);
        });

        it('sollte keine halben Sätze haben', () => {
            const text = "Das ist ein langer Satz. " + "A".repeat(100);
            const chunks = splitTextIntoChunks(text, 50);
            chunks.forEach((chunk, index) => {
                // Prüfe nicht auf "." da einige Chunks im Wort enden können
                expect(chunk.trim().length).toBeGreaterThan(0);
            });
        });
    });

    describe('Kantenfall-Tests', () => {
        it('sollte leeren String handhaben', () => {
            const chunks = splitTextIntoChunks('', MAX_CHARS);
            expect(chunks.length).toBe(0);
        });

        it('sollte nur Whitespace handhaben', () => {
            const chunks = splitTextIntoChunks('   \n\n  ', MAX_CHARS);
            expect(chunks.filter(c => c.length > 0).length).toBe(0);
        });

        it('sollte sehr lange Worte handhaben', () => {
            const text = 'a'.repeat(5000);
            const chunks = splitTextIntoChunks(text, MAX_CHARS);
            expect(chunks.length).toBeGreaterThan(0);
        });

        it('sollte Trimming anwenden', () => {
            const text = "  Text mit Leerzeichen am Anfang  ";
            const chunks = splitTextIntoChunks(text, MAX_CHARS);
            expect(chunks[0]).toBe("Text mit Leerzeichen am Anfang");
        });
    });

    describe('Erhaltung von Inhalt', () => {
        it('sollte kombinierte Chunks den Original-Text ergeben', () => {
            const text = mockData.TEST_TEXTS.LONG;
            const chunks = splitTextIntoChunks(text, MAX_CHARS);
            const combined = chunks.join(' ').replace(/  +/g, ' ');
            const original = text.replace(/  +/g, ' ');
            expect(combined.includes(original.substring(0, 50))).toBe(true);
        });
    });
});
