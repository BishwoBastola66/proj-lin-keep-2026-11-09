import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'core/router/app_router.dart';
import 'core/theme/app_theme.dart';
import 'features/authenticator/data/repositories/local_auth_repository.dart';
import 'features/authenticator/domain/models/authenticator_account.dart';
import 'features/authenticator/presentation/providers/auth_provider.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Initialize Local Storage
  await Hive.initFlutter();
  
  // Register Hive Adapters
  Hive.registerAdapter(AuthenticatorAccountAdapter());
  
  // Initialize Repository
  final localAuthRepository = LocalAuthRepository();
  await localAuthRepository.init();
  
  runApp(
    ProviderScope(
      overrides: [
        localAuthRepositoryProvider.overrideWithValue(localAuthRepository),
      ],
      child: const VaultXApp(),
    ),
  );
}

class VaultXApp extends ConsumerWidget {
  const VaultXApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(appRouterProvider);

    return MaterialApp.router(
      title: 'Vault X',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      themeMode: ThemeMode.light,
      routerConfig: router,
    );
  }
}
