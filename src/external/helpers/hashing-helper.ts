import {Base64} from 'js-base64';
import * as crypto from 'crypto';

// Generate code_verifier
const dec2hex = (dec: number) => {
    return ('0' + dec.toString(16)).slice(-2);
};

const generateCodeVerifier = () => {
    // Generate a random length for code_verifier which should be between 43 and 128
    const length = Math.floor(Math.random() * (129-43) + 43);

    // Use Node.js crypto module instead of window.crypto
    const buffer = crypto.randomBytes(Math.ceil(length / 2));

    return Array.from(new Uint8Array(buffer))
        .map(dec2hex)
        .join('');
};

// Generate code_challenge using Node.js crypto
const sha256 = (plain: string) => {
    return crypto.createHash('sha256')
        .update(plain)
        .digest();
};

const base64urlEncode = (hashed: Buffer) => {
    // Base64 encode and make URL safe
    return Base64.fromUint8Array(new Uint8Array(hashed), true);
};

export const generateCodeChallengeFromVerifier = (codeVerifier: string) => {
    const hashed = sha256(codeVerifier);
    return base64urlEncode(hashed);
};

// Synchronous version for server-side use
export const generatePKCEPair = (): { codeVerifier: string; codeChallenge: string } => {
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = generateCodeChallengeFromVerifier(codeVerifier);

    return {
        codeVerifier,
        codeChallenge
    };
};
