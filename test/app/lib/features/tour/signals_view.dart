import 'package:flutter/material.dart';
import 'package:cubepod/cubepod.dart';
import '../../services/counter_service.dart';

class SignalsView extends StatelessWidget {
  const SignalsView({super.key});

  @override
  Widget build(BuildContext context) {
    final counterService = context.get<CounterService>();

    return Scaffold(
      appBar: AppBar(title: const Text('Signals & State')),
      body: Center(
        child: CubeBuilder(
          builder: (context, watch) {
            final count = watch(counterService.count);
            return Text(
              'Count: $count',
              style: const TextStyle(fontSize: 32, fontWeight: FontWeight.bold),
            );
          },
        ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => counterService.increment(),
        child: const Icon(Icons.add),
      ),
    );
  }
}
