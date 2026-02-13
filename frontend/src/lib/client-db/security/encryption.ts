/**
 * ClientDB Security - Encryption Module
 * Implements AES-GCM 256-bit encryption for sensitive browser data.
 */

export class CryptoEngine {
    private static readonly ALGORITHM = 'AES-GCM';
    private static readonly KEY_LENGTH = 256;
    private static readonly PBKDF2_ITERATIONS = 100000;

    /**
     * Derives a cryptographic key from a plain text password and salt.
     */
    static async deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
        const encoder = new TextEncoder();
        const baseKey = await crypto.subtle.importKey(
            'raw',
            encoder.encode(password),
            'PBKDF2',
            false,
            ['deriveKey']
        );

        return await crypto.subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt: salt as any,
                iterations: this.PBKDF2_ITERATIONS,
                hash: 'SHA-256'
            },
            baseKey,
            { name: this.ALGORITHM, length: this.KEY_LENGTH },
            false,
            ['encrypt', 'decrypt']
        );
    }

    /**
     * Encrypts a JSON object into a ciphertext string.
     */
    static async encrypt(data: any, key: CryptoKey): Promise<{ ciphertext: string; iv: string }> {
        const encoder = new TextEncoder();
        const encodedData = encoder.encode(JSON.stringify(data));
        const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV for AES-GCM

        const encrypted = await crypto.subtle.encrypt(
            { name: this.ALGORITHM, iv: iv as any },
            key,
            encodedData
        );

        return {
            ciphertext: btoa(String.fromCharCode(...new Uint8Array(encrypted))),
            iv: btoa(String.fromCharCode(...iv))
        };
    }

    /**
     * Decrypts a ciphertext string back into the original JSON object.
     */
    static async decrypt(ciphertext: string, iv: string, key: CryptoKey): Promise<any> {
        const decoder = new TextDecoder();
        const binaryCiphertext = Uint8Array.from(atob(ciphertext), c => c.charCodeAt(0));
        const binaryIv = Uint8Array.from(atob(iv), c => c.charCodeAt(0));

        const decrypted = await crypto.subtle.decrypt(
            { name: this.ALGORITHM, iv: binaryIv as any },
            key,
            binaryCiphertext
        );

        return JSON.parse(decoder.decode(decrypted));
    }

    /**
     * Generates a secure random salt.
     */
    static generateSalt(): Uint8Array {
        return crypto.getRandomValues(new Uint8Array(16));
    }
}
