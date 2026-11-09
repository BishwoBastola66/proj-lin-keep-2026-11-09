import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:crypto/crypto.dart';
import 'dart:convert';

class PinRepository {
  final FlutterSecureStorage _secureStorage = const FlutterSecureStorage();
  static const String _pinHashKey = 'local_pin_hash';

  String _hashPin(String pin) {
    var bytes = utf8.encode(pin);
    var digest = sha256.convert(bytes);
    return digest.toString();
  }

  Future<void> setPin(String pin) async {
    final hash = _hashPin(pin);
    await _secureStorage.write(key: _pinHashKey, value: hash);
  }

  Future<bool> verifyPin(String pin) async {
    final storedHash = await _secureStorage.read(key: _pinHashKey);
    if (storedHash == null) return false;
    
    final attemptHash = _hashPin(pin);
    return storedHash == attemptHash;
  }

  Future<bool> hasPinSet() async {
    final storedHash = await _secureStorage.read(key: _pinHashKey);
    return storedHash != null;
  }

  Future<void> clearPin() async {
    await _secureStorage.delete(key: _pinHashKey);
  }
}
