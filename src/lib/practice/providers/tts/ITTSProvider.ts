// Contrato que deben cumplir todos los providers de TTS
// Para cambiar de proveedor: implementar esta interfaz y actualizar el factory

export interface TTSOptions {
    language?: string;  // "en-US", "en-GB", "en-AU"
    speed?: number;     // 0.5 - 2.0 (1.0 = normal)
    voice?: string;     // Nombre de la voz (según soporte del provider)
}

export interface ITTSProvider {
    /**
     * Convierte texto a audio.
     * @returns ArrayBuffer con el audio en formato mp3/ogg, o null si el proveedor
     *          delega la síntesis al cliente (ej: BrowserTTSProvider).
     */
    synthesize(text: string, options?: TTSOptions): Promise<ArrayBuffer | null>;
}
