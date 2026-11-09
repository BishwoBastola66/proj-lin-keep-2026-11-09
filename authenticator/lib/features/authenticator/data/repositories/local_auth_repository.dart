import 'package:hive_flutter/hive_flutter.dart';
import '../../domain/models/authenticator_account.dart';

class LocalAuthRepository {
  static const String _boxName = 'authenticator_accounts';
  
  late Box<AuthenticatorAccount> _box;

  Future<void> init() async {
    _box = await Hive.openBox<AuthenticatorAccount>(_boxName);
  }

  List<AuthenticatorAccount> getAccounts() {
    return _box.values.toList();
  }

  Future<void> addAccount(AuthenticatorAccount account) async {
    await _box.put(account.id, account);
  }

  Future<void> updateAccount(AuthenticatorAccount account) async {
    await _box.put(account.id, account);
  }

  Future<void> deleteAccount(String id) async {
    await _box.delete(id);
  }
}
