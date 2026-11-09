import 'package:flutter/material.dart';
import 'package:cubepod/cubepod.dart';
import 'package:app_test/services/auth_service.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _usernameController = TextEditingController();
  final _passwordController = TextEditingController();
  
  // 1. We replace standard variables with StateSignals
  final _isLoading = StateSignal(false);
  final _errorMessage = StateSignal<String?>(null);

  Future<void> _login() async {
    // 2. We update signals instead of calling setState()
    _isLoading.value = true;
    _errorMessage.value = null;

    final authService = CubePod.get<AuthService>();
    final success = await authService.login(
      _usernameController.text,
      _passwordController.text,
    );

    if (!mounted) return;

    _isLoading.value = false;

    if (success) {
      Navigator.of(context).pushReplacementNamed('/');
    } else {
      _errorMessage.value = 'Invalid username or password';
    }
  }

  @override
  void dispose() {
    _usernameController.dispose();
    _passwordController.dispose();
    _isLoading.dispose();
    _errorMessage.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Login')),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            // 3. We wrap ONLY the parts that need to rebuild in CubeBuilder
            CubeBuilder(
              builder: (context, watch) {
                final error = watch(_errorMessage);
                if (error == null) return const SizedBox.shrink();
                return Padding(
                  padding: const EdgeInsets.only(bottom: 16),
                  child: Text(error, style: const TextStyle(color: Colors.red)),
                );
              },
            ),
            TextField(
              controller: _usernameController,
              decoration: const InputDecoration(labelText: 'Username (admin)'),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _passwordController,
              decoration: const InputDecoration(labelText: 'Password (admin)'),
              obscureText: true,
            ),
            const SizedBox(height: 32),
            CubeBuilder(
              builder: (context, watch) {
                final loading = watch(_isLoading);
                return ElevatedButton(
                  onPressed: loading ? null : _login,
                  child: loading
                      ? const CircularProgressIndicator()
                      : const Text('Login'),
                );
              },
            ),
          ],
        ),
      ),
    );
  }
}
