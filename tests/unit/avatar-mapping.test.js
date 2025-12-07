/**
 * Unit Tests für Avatar-Voice-Mapping
 */

const mockData = require('../mocks/mock-data');

describe('Avatar Voice Mapping', () => {
    const AVATAR_VOICE_MAP = mockData.AVATAR_VOICE_MAP;

    describe('Stimmen-Zuordnung', () => {
        it('sollte Maxx die Stimme "ash" zuordnen', () => {
            expect(AVATAR_VOICE_MAP['Maxx'].voice).toBe('ash');
        });

        it('sollte Terra die Stimme "sage" zuordnen', () => {
            expect(AVATAR_VOICE_MAP['Terra'].voice).toBe('sage');
        });

        it('sollte Nova die Stimme "nova" zuordnen', () => {
            expect(AVATAR_VOICE_MAP['Nova'].voice).toBe('nova');
        });

        it('sollte Nyxari die Stimme "coral" zuordnen', () => {
            expect(AVATAR_VOICE_MAP['Nyxari'].voice).toBe('coral');
        });
    });

    describe('Bild-Zuordnung', () => {
        it('sollte Maxx das Bild "maxx.png" zuordnen', () => {
            expect(AVATAR_VOICE_MAP['Maxx'].image).toBe('maxx.png');
        });

        it('sollte Terra das Bild "terra.png" zuordnen', () => {
            expect(AVATAR_VOICE_MAP['Terra'].image).toBe('terra.png');
        });
    });

    describe('Voice-Namen validierung', () => {
        it('alle Voice-Namen sollten lowercase sein', () => {
            Object.values(AVATAR_VOICE_MAP).forEach(avatar => {
                expect(avatar.voice).toBe(avatar.voice.toLowerCase());
            });
        });

        it('alle Avatar-Namen sollten in PascalCase sein', () => {
            Object.keys(AVATAR_VOICE_MAP).forEach(name => {
                expect(name[0]).toBe(name[0].toUpperCase());
            });
        });
    });

    describe('Fehlerbehandlung', () => {
        it('sollte null für ungültige Avatare zurückgeben', () => {
            expect(AVATAR_VOICE_MAP['InvalidAvatar']).toBeUndefined();
        });

        it('sollte alle erforderlichen Felder haben', () => {
            Object.values(AVATAR_VOICE_MAP).forEach(avatar => {
                expect(avatar).toHaveProperty('voice');
                expect(avatar).toHaveProperty('image');
            });
        });
    });
});
