import 'package:cubepod/cubepod.dart';

class AuthService extends Disposable {
  final isAuthenticated = StateSignal<bool>(false);

  void login() => isAuthenticated.value = true;
  void logout() => isAuthenticated.value = false;

  @override
  void dispose() {
    isAuthenticated.dispose();
  }
}
