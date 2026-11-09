import 'package:flutter/material.dart';

class QueriesView extends StatelessWidget {
  const QueriesView({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Queries')),
      body: const Center(
        child: Text('Queries provide caching and deduplication. See docs!'),
      ),
    );
  }
}
