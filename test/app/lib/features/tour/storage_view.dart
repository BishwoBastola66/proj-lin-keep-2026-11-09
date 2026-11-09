import 'package:flutter/material.dart';
import 'package:cubepod/cubepod.dart';

class StorageView extends StatefulWidget {
  const StorageView({super.key});

  @override
  State<StorageView> createState() => _StorageViewState();
}

class _StorageViewState extends State<StorageView> {
  late PersistedSignal<String> _nameSignal;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _nameSignal = PersistedSignal<String>(
      key: 'user_name',
      initialValue: '',
      storage: context.get<StorageService>(),
    );
  }

  @override
  void dispose() {
    _nameSignal.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Storage')),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: [
            const Text('This value persists across app restarts!'),
            const SizedBox(height: 20),
            TextField(
              decoration: const InputDecoration(labelText: 'Enter your name'),
              onChanged: (val) => _nameSignal.value = val,
            ),
            const SizedBox(height: 20),
            CubeBuilder(
              builder: (context, watch) {
                return Text('Stored: ${watch(_nameSignal)}');
              },
            )
          ],
        ),
      ),
    );
  }
}
