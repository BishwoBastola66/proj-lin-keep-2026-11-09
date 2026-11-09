import 'package:flutter/material.dart';
import 'package:cubepod/cubepod.dart';
import 'package:app_test/core/state.dart';

class CounterOnlyScreen extends StatelessWidget {
  const CounterOnlyScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final appState = CubePod.get<AppState>();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Counter Memory Test'),
      ),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Text(
              'Push and pop this screen repeatedly while watching the DevTools Memory tab.',
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 32),
            CubeBuilder(
              builder: (context, watch) {
                final count = watch(appState.count);
                return Text(
                  'Counter: $count',
                  style: Theme.of(context).textTheme.displayMedium,
                );
              },
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: () => appState.increment(),
              child: const Text('Increment'),
            ),
          ],
        ),
      ),
    );
  }
}
