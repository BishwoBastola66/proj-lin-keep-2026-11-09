import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../domain/models/authenticator_account.dart';
import '../../data/repositories/local_auth_repository.dart';
import 'package:uuid/uuid.dart';

final localAuthRepositoryProvider = Provider<LocalAuthRepository>((ref) {
  throw UnimplementedError('Initialize in main.dart before running app');
});

final authAccountsProvider = StateNotifierProvider<AuthAccountsNotifier, List<AuthenticatorAccount>>((ref) {
  final repository = ref.watch(localAuthRepositoryProvider);
  return AuthAccountsNotifier(repository);
});

class AuthAccountsNotifier extends StateNotifier<List<AuthenticatorAccount>> {
  final LocalAuthRepository _repository;

  AuthAccountsNotifier(this._repository) : super(_repository.getAccounts());

  Future<void> addAccount({
    required String issuer,
    required String accountName,
    required String secret,
  }) async {
    final newAccount = AuthenticatorAccount(
      id: const Uuid().v4(),
      issuer: issuer,
      accountName: accountName,
      secret: secret,
      createdAt: DateTime.now(),
    );
    
    await _repository.addAccount(newAccount);
    state = _repository.getAccounts(); // Refresh state
  }

  Future<void> removeAccount(String id) async {
    await _repository.deleteAccount(id);
    state = _repository.getAccounts(); // Refresh state
  }
}
