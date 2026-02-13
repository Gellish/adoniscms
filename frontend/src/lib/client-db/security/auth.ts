/**
 * ClientDB Security - Auth Module
 * Implements PBKDF2 hashing for secure credential storage.
 */

export interface HashResult {
    hash: string;
    salt: string;
    iterations: number;
}

export class AuthEngine {
    private static readonly ITERATIONS = 100000;
    private static readonly HASH_ALGO = 'SHA-256';

    /**
     * Hashes a password using PBKDF2 with 100,000 iterations.
     */
    static async hashPassword(password: string, saltInput?: Uint8Array): Promise<HashResult> {
        const encoder = new TextEncoder();
        const salt = saltInput || crypto.getRandomValues(new Uint8Array(16));

        const baseKey = await crypto.subtle.importKey(
            'raw',
            encoder.encode(password),
            'PBKDF2',
            false,
            ['deriveBits']
        );

        const bits = await crypto.subtle.deriveBits(
            {
                name: 'PBKDF2',
                salt: salt as any,
                iterations: this.ITERATIONS,
                hash: this.HASH_ALGO
            },
            baseKey,
            256
        );

        return {
            hash: btoa(String.fromCharCode(...new Uint8Array(bits))),
            salt: btoa(String.fromCharCode(...salt)),
            iterations: this.ITERATIONS
        };
    }

    /**
     * Compares a plain text password against a stored secure hash.
     */
    static async verify(password: string, stored: HashResult): Promise<boolean> {
        const salt = Uint8Array.from(atob(stored.salt), c => c.charCodeAt(0));
        const result = await this.hashPassword(password, salt);
        return result.hash === stored.hash;
    }
}
