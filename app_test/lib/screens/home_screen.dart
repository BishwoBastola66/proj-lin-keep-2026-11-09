import 'package:flutter/material.dart';
import 'package:cubepod/cubepod.dart';
import 'package:app_test/core/di.dart';
import 'package:app_test/core/state.dart';
import 'package:app_test/services/api_service.dart';
import 'package:app_test/services/sync_manager.dart';
import 'package:app_test/models/user.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  late final CubeQuery<List<User>> userQuery;
  bool _isStressTesting = false;

  @override
  void initState() {
    super.initState();
    final apiService = CubePod.get<ApiService>();
    userQuery = CubeQuery<List<User>>(
      queryFn: () => apiService.fetchUsers(),
      staleTime: const Duration(minutes: 5),
    );
  }

  @override
  Widget build(BuildContext context) {
    final appState = CubePod.get<AppState>();
    final syncManager = CubePod.get<SyncManager>();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Hardest CubePod App'),
        actions: [
          IconButton(
            icon: const Icon(Icons.login),
            onPressed: () {
              Navigator.of(context).pushNamed('/login');
            },
            tooltip: 'Login',
          ),
          IconButton(
            icon: const Icon(Icons.sync),
            onPressed: () {
              appState.addLog('Enqueuing sync task...');
              syncManager.queue.enqueue(
                MockSyncTask(DateTime.now().millisecondsSinceEpoch.toString(), {}),
              );
              ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Task Enqueued!')));
            },
          ),
          IconButton(
            icon: const Icon(Icons.arrow_forward),
            onPressed: () {
              Navigator.of(context).pushNamed('/details');
            },
          ),
        ],
      ),
      body: Column(
        children: [
          CubeBuilder(
            builder: (context, watch) {
              final count = watch(appState.count);
              return Padding(
                padding: const EdgeInsets.all(16.0),
                child: Text('Counter: $count', style: Theme.of(context).textTheme.headlineMedium),
              );
            },
          ),
          ElevatedButton(
            onPressed: () => appState.increment(),
            child: const Text('Increment'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.of(context).pushNamed('/counter'),
            child: const Text('Test Counter Memory Leak'),
          ),
          ElevatedButton(
            onPressed: () async {
              if (_isStressTesting) return;
              setState(() => _isStressTesting = true);
              ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Starting Infinite Stress Test...')));
              int currentDelay = 100;
              while (_isStressTesting && mounted) {
                Navigator.of(context).pushNamed('/counter');
                await Future.delayed(Duration(milliseconds: currentDelay));
                if (!_isStressTesting || !mounted) break;
                Navigator.of(context).pop();
                await Future.delayed(Duration(milliseconds: currentDelay));
                
                // Double the speed (halve the delay) each iteration, down to a minimum of 16ms
                // If it goes to 0, it floods the event loop and causes an Application Not Responding (ANR) freeze!
                if (currentDelay > 16) {
                  currentDelay = currentDelay ~/ 2;
                }
              }
            },
            style: ElevatedButton.styleFrom(backgroundColor: Colors.redAccent, foregroundColor: Colors.white),
            child: const Text('Run Infinite Stress Test (Doubles Speed)'),
          ),
          ElevatedButton(
            onPressed: () {
              if (_isStressTesting) {
                setState(() => _isStressTesting = false);
                ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Stopping Stress Test...')));
              }
            },
            style: ElevatedButton.styleFrom(backgroundColor: Colors.blueGrey, foregroundColor: Colors.white),
            child: const Text('Stop Stress Test'),
          ),
          const Divider(),
          Expanded(
            child: CubeBuilder(
              builder: (context, watch) {
                final state = watch(userQuery);
                if (state.isLoading) return const Center(child: CircularProgressIndicator());
                if (state.hasError) return Center(child: Text('Error: ${state.error}'));
                
                final users = state.data ?? [];
                return ListView.builder(
                  itemCount: users.length,
                  itemBuilder: (context, index) {
                    final user = users[index];
                    return ListTile(
                      title: Text(user.name),
                      subtitle: Text(user.email),
                    );
                  },
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
