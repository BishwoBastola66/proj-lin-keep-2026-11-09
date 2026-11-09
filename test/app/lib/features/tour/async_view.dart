import 'package:flutter/material.dart';
import 'package:cubepod/cubepod.dart';
import '../../resources/user_resource.dart';

class AsyncView extends StatefulWidget {
  const AsyncView({super.key});
  
  @override
  State<AsyncView> createState() => _AsyncViewState();
}

class _AsyncViewState extends State<AsyncView> {
  late final CubeQuery<String> _query;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _query = getFactQuery(context);
    _query.queryFn(); // start fetch
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Async Resources (Queries)')),
      body: Center(
        child: CubeBuilder(
          builder: (context, watch) {
            final state = watch(_query);
            
            if (state.isLoading) return const CircularProgressIndicator();
            if (state.hasError) return Text('Error: ${state.error}');
            
            return Padding(
              padding: const EdgeInsets.all(24.0),
              child: Text(
                state.data ?? 'No data',
                textAlign: TextAlign.center,
                style: const TextStyle(fontSize: 20),
              ),
            );
          },
        ),
      ),
    );
  }
}
