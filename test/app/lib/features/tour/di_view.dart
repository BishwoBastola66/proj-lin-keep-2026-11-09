import 'package:flutter/material.dart';
import 'package:cubepod/cubepod.dart';
import '../../services/auth_service.dart';

class DiView extends StatelessWidget {
  const DiView({super.key});

  @override
  Widget build(BuildContext context) {
    // Dependency Injection in action
    final authService = context.get<AuthService>();

    return Scaffold(
      appBar: AppBar(title: const Text('Dependency Injection')),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Text('AuthService retrieved via DI!'),
            const SizedBox(height: 20),
            CubeBuilder(
              builder: (context, watch) {
                final isAuth = watch(authService.isAuthenticated);
                return Text('Status: ${isAuth ? 'Logged In' : 'Logged Out'}');
              },
            ),
            ElevatedButton(
              onPressed: () => authService.login(),
              child: const Text('Login'),
            )
          ],
        ),
      ),
    );
  }
}
