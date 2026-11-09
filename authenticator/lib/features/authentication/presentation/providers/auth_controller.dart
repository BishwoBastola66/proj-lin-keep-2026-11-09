import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/api/api_provider.dart';
import '../../data/repositories/auth_repository.dart';
import '../../data/repositories/pin_repository.dart';

enum AuthState {
  initial,
  unauthenticated,
  authenticatedLocked,
  authenticatedUnlocked,
  authenticatedNeedsPin,
}

final authRepositoryProvider = Provider<AuthRepository>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return AuthRepository(apiClient);
});

final authEmailProvider = FutureProvider<String?>((ref) async {
  final repo = ref.watch(authRepositoryProvider);
  return await repo.getUserEmail();
});

final pinRepositoryProvider = Provider<PinRepository>((ref) {
  return PinRepository();
});

final authControllerProvider = StateNotifierProvider<AuthController, AuthState>((ref) {
  final authRepo = ref.watch(authRepositoryProvider);
  final pinRepo = ref.watch(pinRepositoryProvider);
  return AuthController(authRepo, pinRepo);
});

class AuthController extends StateNotifier<AuthState> {
  final AuthRepository _authRepository;
  final PinRepository _pinRepository;

  AuthController(this._authRepository, this._pinRepository) : super(AuthState.initial) {
    _init();
  }

  Future<void> _init() async {
    final isAuthenticated = await _authRepository.isAuthenticated();
    if (!isAuthenticated) {
      state = AuthState.unauthenticated;
      return;
    }

    final hasPin = await _pinRepository.hasPinSet();
    if (!hasPin) {
      state = AuthState.authenticatedNeedsPin;
      return;
    }

    // Has PIN and is authenticated, so it's locked by default on open
    state = AuthState.authenticatedLocked;
  }

  Future<void> login(String email, String password) async {
    await _authRepository.login(email, password);
    final hasPin = await _pinRepository.hasPinSet();
    state = hasPin ? AuthState.authenticatedUnlocked : AuthState.authenticatedNeedsPin;
  }

  Future<void> register(String email, String password, {String? fullName}) async {
    await _authRepository.register(email, password, fullName: fullName);
    state = AuthState.authenticatedNeedsPin; 
  }

  Future<void> logout() async {
    await _authRepository.logout();
    await _pinRepository.clearPin(); // Optionally clear PIN on logout, or keep it. Let's clear for full logout.
    state = AuthState.unauthenticated;
  }

  Future<void> setPin(String pin) async {
    await _pinRepository.setPin(pin);
    state = AuthState.authenticatedUnlocked;
  }

  Future<bool> verifyPin(String pin) async {
    final isValid = await _pinRepository.verifyPin(pin);
    if (isValid) {
      state = AuthState.authenticatedUnlocked;
    }
    return isValid;
  }

  Future<bool> hasPinSet() async {
    return await _pinRepository.hasPinSet();
  }
}
