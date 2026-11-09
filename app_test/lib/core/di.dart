import 'package:cubepod/cubepod.dart';
import 'package:app_test/core/state.dart';
import 'package:app_test/services/auth_service.dart';
import 'package:app_test/services/api_service.dart';
import 'package:app_test/services/sync_manager.dart';

void setupDI() {
  CubePod.register<AuthService>(() => AuthService(), scope: Scope.singleton);
  CubePod.register<ApiService>(() => ApiService(), scope: Scope.singleton);
  CubePod.register<SyncManager>(() => SyncManager(CubePod.get<ApiService>()), scope: Scope.singleton);
  CubePod.register<AppState>(() => AppState(), scope: Scope.singleton);
}
