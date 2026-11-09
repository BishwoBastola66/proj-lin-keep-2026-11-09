import 'package:flutter/material.dart';
import 'package:cubepod/cubepod.dart';
import 'package:app_test/core/di.dart';
import 'package:app_test/services/sync_manager.dart';
import 'package:app_test/core/router.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Initialize dependency injection
  setupDI();

  // Initialize sync manager safely
  try {
    final syncManager = CubePod.get<SyncManager>();
    await syncManager.init();
  } catch (e, stackTrace) {
    debugPrint('SyncManager initialization failed: $e\n$stackTrace');
  }

  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Hardest CubePod App',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.deepPurple),
        useMaterial3: true,
      ),
      onGenerateRoute: router.onGenerateRoute,
    );
  }
}
