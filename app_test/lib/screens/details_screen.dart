import 'package:flutter/material.dart';
import 'package:cubepod/cubepod.dart';
import 'package:app_test/core/state.dart';

class DetailsScreen extends StatelessWidget {
  const DetailsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final appState = CubePod.get<AppState>();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Activity Logs'),
      ),
      body: CubeBuilder(
        builder: (context, watch) {
          final logs = watch(appState.logs);
          if (logs.isEmpty) {
            return const Center(child: Text('No activity yet.'));
          }
          return ListView.builder(
            itemCount: logs.length,
            itemBuilder: (context, index) {
              return ListTile(
                title: Text(logs[index]),
              );
            },
          );
        },
      ),
    );
  }
}
