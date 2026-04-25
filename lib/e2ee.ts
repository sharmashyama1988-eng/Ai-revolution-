export async function generateECDHKeyPair() {
  const keyPair = await window.crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveKey", "deriveBits"]
  );
  const publicKey = await window.crypto.subtle.exportKey("jwk", keyPair.publicKey);
  const privateKey = await window.crypto.subtle.exportKey("jwk", keyPair.privateKey);
  return { publicKey: JSON.stringify(publicKey), privateKey: JSON.stringify(privateKey) };
}

export async function deriveSecretKey(privateKeyJson: string, publicKeyJson: string) {
  const privateKeyJwk = JSON.parse(privateKeyJson);
  const publicKeyJwk = JSON.parse(publicKeyJson);
  
  const privateKey = await window.crypto.subtle.importKey(
    "jwk", privateKeyJwk, { name: "ECDH", namedCurve: "P-256" }, true, ["deriveKey", "deriveBits"]
  );
  const publicKey = await window.crypto.subtle.importKey(
    "jwk", publicKeyJwk, { name: "ECDH", namedCurve: "P-256" }, true, []
  );
  return await window.crypto.subtle.deriveKey(
    { name: "ECDH", public: publicKey },
    privateKey,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
}

function arrayBufferToBase64(buffer: ArrayBuffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

function base64ToArrayBuffer(base64: string) {
  const binary_string = window.atob(base64);
  const len = binary_string.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
      bytes[i] = binary_string.charCodeAt(i);
  }
  return bytes.buffer;
}

export async function encryptSymmetric(text: string, secretKey: CryptoKey) {
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(text);
  const ciphertext = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    secretKey,
    encoded
  );
  // combine iv and ciphertext
  const combined = new Uint8Array(iv.length + ciphertext.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(ciphertext), iv.length);
  return arrayBufferToBase64(combined.buffer);
}

export async function decryptSymmetric(base64Payload: string, secretKey: CryptoKey) {
  const buffer = base64ToArrayBuffer(base64Payload);
  const combined = new Uint8Array(buffer);
  
  const iv = combined.slice(0, 12);
  const ciphertext = combined.slice(12);
  
  const decrypted = await window.crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    secretKey,
    ciphertext
  );
  return new TextDecoder().decode(decrypted);
}

export async function computeProofOfWork(handle: string, onProgress: (nonce: number) => void): Promise<number> {
    let nonce = 0;
    while (true) {
        if (nonce % 1000 === 0) {
            // yield to main thread to update UI
            await new Promise(resolve => setTimeout(resolve, 0));
            onProgress(nonce);
        }
        const text = `${handle}:${nonce}`;
        const encoded = new TextEncoder().encode(text);
        const hashBuffer = await window.crypto.subtle.digest('SHA-256', encoded);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        if (hashHex.startsWith('000')) {
            return nonce;
        }
        nonce++;
    }
}
