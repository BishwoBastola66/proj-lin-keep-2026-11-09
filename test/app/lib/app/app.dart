import 'package:flutter/material.dart';
import 'package:cubepod/cubepod.dart';
import '../routes/app_router.dart';
import '../core/theme.dart';

class App extends StatelessWidget {
  const App({super.key});

  @override
  Widget build(BuildContext context) {
    return CubeScope(
      child: MaterialApp(
        title: 'CubePod Tour',
        theme: AppTheme.lightTheme,
        onGenerateRoute: AppRouter.onGenerateRoute,
      ),
    );
  }
}
