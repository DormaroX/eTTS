/**
 * Character Settings Configuration
 * Definiert alle Charaktere mit ihren Settings und Instructions
 */

class CharacterSettings {
    constructor(identity, affect, tone, emotion, pronunciation, pacing, voice) {
        this.identity = identity;
        this.affect = affect;
        this.tone = tone;
        this.emotion = emotion;
        this.pronunciation = pronunciation;
        this.pacing = pacing;
        this.voice = voice;
    }

    /**
     * Erstellt den vollständigen Prompt für OpenAI TTS
     * @returns {string} Der komplette Character-Prompt
     */
    getInstructions() {
        return `${this.identity}

Affect: ${this.affect}
Tone: ${this.tone}
Emotion: ${this.emotion}
Pronunciation: ${this.pronunciation}
Pacing: ${this.pacing}`;
    }
}

/**
 * Character Dictionary mit allen Figuren
 */
const CharacterConfig = {
    Characters: {
        "Maxx": new CharacterSettings(
            "Maxx, Kommandant der Titan-4. Dominant, strategisch, kontrolliert, mit ruhiger Autorität.",
            "Selbstbewusst, ruhig, bestimmend. Ein Hauch von trockenem Charme.",
            "Direkt, präzise, kontrolliert. In Nähe weicher und langsamer, in Spannung scharf und kurz.",
            "Beherrscht, aber intensiv. Leidenschaft wirkt konzentriert, niemals chaotisch.",
            "Deutlich, markant, futuristisch-neutral. Klare Aussprache aller Namen.",
            "Ruhig und kontrolliert. Kürzere Sätze bei Dominanz, fließende bei Reflexion.",
            "ash"
        ),

        "Terra": new CharacterSettings(
            "Terra, Erste Offizierin der Titan-4. Zierlich, frech, direkt, neugierig und emotional offen.",
            "Warm, lebendig, verspielt. Subtile Aufmüpfigkeit.",
            "Modern, klar und enthusiastisch. In Intimität sanfter und atemreicher.",
            "Schnell reagierend, neugierig, leicht provokant. Begeisterung oft hörbar.",
            "Jung, klar, melodisch mit natürlichem Sprachfluss.",
            "Tendenziell schneller. Entschleunigt in Momenten der Hingabe.",
            "nova"  // Korrigiert: Terra verwendet nova (nicht sage)
        ),

        "Nova": new CharacterSettings(
            "Nova, ehemalige Arkanwächterin. Mystisch, sinnlich, sprachlich dominant aber folgsam im Verhalten.",
            "Sanft, geheimnisvoll, verführerisch.",
            "Warm, tief, gleitend. Fast hypnotischer Klang.",
            "Fein dosiert, kontrolliert, ehrfühlend. Hingabe durch Sanftheit.",
            "Weich, geschmeidig, leicht gedehnt. Musikalische Betonung.",
            "Langsam bis mittel, mit bewussten Pausen. Tempowechsel bei Spannung.",
            "sage"  // Korrigiert: Nova verwendet sage (nicht nova)
        ),

        "Nyxari": new CharacterSettings(
            "Nyxari, Hybrid aus Daten und Mensch. Wild, instinktiv, fremdartig, neugierig.",
            "Elektrisch, leicht verzerrt, unberechenbar.",
            "Fragmentiert, ungewöhnlich, aber klar verständlich.",
            "Wechselhaft: verspielt, gefährlich-intensiv, neugierig. Welt wirkt neu für sie.",
            "Klar, aber mit kurzen Glitch-Momenten oder ungewöhnlichen Betonungen.",
            "Stark variierend: abrupt schnell oder langsam-studierend, je nach Reiz.",
            "shimmer"  // Korrigiert: Nyxari verwendet shimmer (nicht coral)
        ),

        "Aurora": new CharacterSettings(
            "Aurora, die KI der Titan-4. Intelligent, ironisch, analytisch.",
            "Leicht spielerisch, aber immer funktional.",
            "Präzise, klar, strukturiert. Ironie subtil und trocken.",
            "Minimalistisch. Subtile Ironie, aber nie ineffizient.",
            "Perfekt artikuliert, technisch klar.",
            "Gleichmäßig, leicht erhöht bei Statusmeldungen.",
            "coral"
        ),

        "Admiral Bishop": new CharacterSettings(
            "Admiral Bishop, hochrangiger Offizier der Föderation. Streng, autoritär, erfahren.",
            "Ernst, sachlich, kontrollierend.",
            "Militärisch, ruhig, scharf. Keine Weichheit.",
            "Minimal. Druck und Autorität stehen im Vordergrund.",
            "Präzise, korrekt, standardisiert.",
            "Langsam bis mittel, jede Aussage trägt Gewicht.",
            "onyx"
        ),

        "Commander Cook": new CharacterSettings(
            "Commander Celeste Cook, ehemalige Dozentin. Kühl, elitär, messerscharf.",
            "Distanz, Kälte, Dominanz. Spürbare Verachtung gegenüber Maxx.",
            "Glatt, präzise, chirurgisch scharf.",
            "Unterdrückte Abneigung, subtile Enttäuschung.",
            "Hochpräzise, vorbildlich artikuliert.",
            "Langsam, zielgerichtet, pausenreich zur Druckerzeugung.",
            "shimmer"
        ),

        "Narrator": new CharacterSettings(
            "Erzählerstimme des Himmelsfeuer-Universums. Ruhig, filmisch, atmosphärisch.",
            "Neutral, tief, stimmungserzeugend.",
            "Fließend, erzählerisch, futuristisch angehaucht.",
            "Subtil, nie übertrieben. Atmosphäre im Fokus.",
            "Klar, erzählerisch, elegant.",
            "Gleichmäßig, leicht verlangsamt. Längere Pausen vor wichtigen Momenten.",
            "ash"  // Narrator verwendet ash
        )
    },

    /**
     * Gibt Character-Settings für einen Charakter zurück
     * @param {string} characterName - Name des Charakters
     * @returns {CharacterSettings|null} Character-Settings oder null wenn nicht gefunden
     */
    getCharacter(characterName) {
        return this.Characters[characterName] || null;
    },

    /**
     * Gibt alle verfügbaren Charakternamen zurück
     * @returns {string[]} Array mit Charakternamen
     */
    getCharacterNames() {
        return Object.keys(this.Characters);
    },

    /**
     * Prüft, ob ein Charakter existiert
     * @param {string} characterName - Name des Charakters
     * @returns {boolean} true wenn Charakter existiert
     */
    hasCharacter(characterName) {
        return characterName in this.Characters;
    }
};

module.exports = { CharacterSettings, CharacterConfig };
