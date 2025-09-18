import * as openpgp from 'openpgp';

export interface TransformationResult {
  originalText: string;
  transformedText: string;
  hashedText?: string;
  detectedPiiTypes: string[];
  transformationCount: number;
}

/**
 * Generate SHA256 hash of the input text
 * @param text - The text to hash (will be uppercased before hashing)
 * @returns Promise resolving to SHA256 hash as hex string
 */
async function generateSHA256Hash(text: string): Promise<string> {
  // Convert text to uppercase before hashing
  const uppercasedText = text.toUpperCase();
  
  const encoder = new TextEncoder();
  const data = encoder.encode(uppercasedText);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

/**
 * Convert hex string to Uint8Array
 * @param hex - Hex string (with or without \x prefix)
 * @returns Uint8Array of bytes
 */
function hexToUint8Array(hex: string): Uint8Array {
  if (hex.startsWith("\\x")) {
    hex = hex.slice(2);
  }
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes;
}

/**
 * Decrypt PGP data from hex format
 * @param hexData - Hex-encoded PGP message
 * @param passphrase - The decryption passphrase
 * @returns Promise resolving to decrypted text
 */
async function decryptPGP(hexData: string, passphrase: string): Promise<string> {
  const encrypted = hexToUint8Array(hexData);

  // Parse as PGP message
  const message = await openpgp.readMessage({
    binaryMessage: encrypted,
  });

  // Decrypt with passphrase
  const { data: decrypted } = await openpgp.decrypt({
    message,
    passwords: [passphrase],
    format: "utf8",
  });

  return decrypted as string;
}

/**
 * Real PGP symmetric decryption function using OpenPGP
 * @param encryptedData - The encrypted PGP message (specific hex format only)
 * @param passphrase - The decryption passphrase
 * @returns Promise resolving to decrypted text
 */
export async function safe_pgp_sym_decrypt(encryptedData: string, passphrase: string): Promise<string> {
  try {
    // Only accept the specific hex format starting with \xc30d04070302
    if (!encryptedData.startsWith('\\xc')) {
      throw new Error('Only hex format starting with \\xc is supported');
    }

    if (!passphrase) {
      throw new Error('Passphrase is required for decryption');
    }

    return await decryptPGP(encryptedData, passphrase);
  } catch (error) {
    console.error('PGP decryption failed:', error);
    throw new Error(`PGP decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Convert Uint8Array to hex string with \x prefix
 * @param bytes - Uint8Array of bytes
 * @returns Hex string with \x prefix
 */
function uint8ArrayToHex(bytes: Uint8Array): string {
  const hex = Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  return '\\x' + hex;
}

/**
 * Encrypt plain text to PGP format using symmetric encryption
 * @param plainText - The text to encrypt
 * @param passphrase - The encryption passphrase
 * @returns Promise resolving to hex-encoded PGP message
 */
export async function safe_pgp_sym_encrypt(plainText: string, passphrase: string): Promise<string> {
  try {
    if (!passphrase) {
      throw new Error('Passphrase is required for encryption');
    }

    // Encrypt the message with passphrase
    const encrypted = await openpgp.encrypt({
      message: await openpgp.createMessage({ text: plainText }),
      passwords: [passphrase]
    });

    // Convert to hex format
    const encryptedBytes = new Uint8Array(encrypted as ArrayBuffer);
    return uint8ArrayToHex(encryptedBytes);
  } catch (error) {
    console.error('PGP encryption failed:', error);
    throw new Error(`PGP encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Transform data by decrypting PGP messages and hashing the result
 * @param text - The input text (should be a PGP encrypted message)
 * @param selectedPatterns - Not used (kept for compatibility)
 * @param shouldDecrypt - Whether to attempt decryption
 * @param passphrase - Passphrase for decryption
 * @param skipPiiTransformation - Not used (kept for compatibility)
 * @returns TransformationResult object with decryption result and SHA256 hash
 */
export async function transformPiiData(
  text: string,
  shouldDecrypt: boolean = false,
  passphrase?: string
): Promise<TransformationResult> {
  if (!text.trim()) {
    return {
      originalText: text,
      transformedText: text,
      detectedPiiTypes: [],
      transformationCount: 0
    };
  }

  let transformedText = text;
  const detectedPiiTypes: string[] = [];
  let transformationCount = 0;

  // Decrypt the text if requested
  if (shouldDecrypt) {
    try {
      if (!passphrase) {
        throw new Error('Passphrase is required for decryption');
      }
      transformedText = await safe_pgp_sym_decrypt(text, passphrase);
      detectedPiiTypes.push('PGP_DECRYPTED');
      transformationCount = 1;
    } catch (error) {
      transformedText = `[DECRYPTION_FAILED: ${error instanceof Error ? error.message : 'Unknown error'}]`;
      detectedPiiTypes.push('DECRYPTION_ERROR');
      transformationCount = 1;
    }
  }

  // Generate SHA256 hash of the transformed text
  const hashedText = await generateSHA256Hash(transformedText);
  detectedPiiTypes.push('SHA256_HASHED');
  transformationCount++;

  return {
    originalText: text,
    transformedText,
    hashedText,
    detectedPiiTypes,
    transformationCount
  };
}

/**
 * Backward transformation: encrypt plain text to PGP format
 * @param text - The plain text to encrypt
 * @param passphrase - Passphrase for encryption
 * @returns TransformationResult object with encryption result
 */
export async function backwardTransformPiiData(
  text: string,
  passphrase?: string
): Promise<TransformationResult> {
  if (!text.trim()) {
    return {
      originalText: text,
      transformedText: text,
      detectedPiiTypes: [],
      transformationCount: 0
    };
  }

  let transformedText = text;
  const detectedPiiTypes: string[] = [];
  let transformationCount = 0;

  try {
    if (!passphrase) {
      throw new Error('Passphrase is required for encryption');
    }
    transformedText = await safe_pgp_sym_encrypt(text, passphrase);
    detectedPiiTypes.push('PGP_ENCRYPTED');
    transformationCount = 1;
  } catch (error) {
    transformedText = `[ENCRYPTION_FAILED: ${error instanceof Error ? error.message : 'Unknown error'}]`;
    detectedPiiTypes.push('ENCRYPTION_ERROR');
    transformationCount = 1;
  }

  // Generate SHA256 hash of the transformed text
  const hashedText = await generateSHA256Hash(transformedText);
  detectedPiiTypes.push('SHA256_HASHED');
  transformationCount++;

  return {
    originalText: text,
    transformedText,
    hashedText,
    detectedPiiTypes,
    transformationCount
  };
}

/**
 * Get statistics about the specific hex PGP format
 * @param text - The input text to analyze
 * @returns Object with detection statistics
 */
export function analyzePiiData(text: string) {
  const isSpecificHexPgp = text.startsWith('\\xc');
  
  return {
    stats: {
      'SPECIFIC_HEX_PGP': isSpecificHexPgp ? 1 : 0
    },
    totalMatches: isSpecificHexPgp ? 1 : 0,
    hasAnyPii: isSpecificHexPgp
  };
}

/**
 * Validate if a string contains the specific hex PGP format
 * @param text - The text to validate
 * @returns Boolean indicating if the specific hex format was detected
 */
export function containsPii(text: string): boolean {
  // Only detect the specific hex format starting with \xc
  return text.startsWith('\\xc');
}

/**
 * Get available pattern information (specific hex PGP format only)
 * @returns Array with specific hex PGP pattern information
 */
export function getAvailablePatterns() {
  return [
    {
      name: 'SPECIFIC_HEX_PGP',
      description: 'Specific hex PGP format (\\xc30d04070302...)',
      enabled: true
    }
  ];
}