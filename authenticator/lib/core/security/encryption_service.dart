import 'dart:convert';
import 'dart:typed_data';
import 'package:encrypt/encrypt.dart' as encrypt;
import 'package:crypto/crypto.dart';

class EncryptionService {
  // In a real app, this key would be derived from a PBKDF2 hash of the user's master password.
  // For the prototype, we use a static derived key to simulate the E2EE flow.
  static final String _masterKeyString = "SuperSecretMasterKeyThatIs32BytesLong!";
  late encrypt.Key _key;
  late encrypt.Encrypter _encrypter;

  EncryptionService() {
    _key = _deriveKey(_masterKeyString);
    _encrypter = encrypt.Encrypter(encrypt.AES(_key, mode: encrypt.AESMode.gcm));
  }

  encrypt.Key _deriveKey(String password) {
    // Hash password to get a 32-byte key (256 bits) for AES-256
    final bytes = utf8.encode(password);
    final digest = sha256.convert(bytes);
    return encrypt.Key(Uint8List.fromList(digest.bytes));
  }

  /// Encrypts plaintext data using AES-256-GCM.
  /// Returns a Base64 string containing both the IV and the ciphertext.
  String encryptData(String plaintext) {
    final iv = encrypt.IV.fromSecureRandom(12); // GCM standard IV size
    final encrypted = _encrypter.encrypt(plaintext, iv: iv);
    
    // Prepend IV to ciphertext (Base64 encoded)
    final payload = "${iv.base64}:${encrypted.base64}";
    return payload;
  }

  /// Decrypts a Base64 payload containing IV:Ciphertext back to plaintext.
  String decryptData(String payload) {
    final parts = payload.split(':');
    if (parts.length != 2) throw Exception("Invalid payload format");
    
    final iv = encrypt.IV.fromBase64(parts[0]);
    final encrypted = encrypt.Encrypted.fromBase64(parts[1]);
    
    return _encrypter.decrypt(encrypted, iv: iv);
  }
}
