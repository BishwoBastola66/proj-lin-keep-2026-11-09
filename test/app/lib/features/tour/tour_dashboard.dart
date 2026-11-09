import 'package:flutter/material.dart';

class TourDashboard extends StatelessWidget {
  const TourDashboard({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('CubePod Tour 🚀')),
      body: ListView(
        children: [
          _TourItem(title: 'Dependency Injection', route: '/tour/di', icon: Icons.extension),
          _TourItem(title: 'Signals & State', route: '/tour/signals', icon: Icons.bolt),
          _TourItem(title: 'Async Resources (Queries)', route: '/tour/async', icon: Icons.cloud_download),
          _TourItem(title: 'Queries & Caching', route: '/tour/queries', icon: Icons.search),
          _TourItem(title: 'Local Storage', route: '/tour/storage', icon: Icons.save),
        ],
      ),
    );
  }
}

class _TourItem extends StatelessWidget {
  final String title;
  final String route;
  final IconData icon;

  const _TourItem({required this.title, required this.route, required this.icon});

  @override
  Widget build(BuildContext context) {
    return ListTile(
      leading: Icon(icon, color: Colors.blueAccent),
      title: Text(title, style: const TextStyle(fontWeight: FontWeight.bold)),
      trailing: const Icon(Icons.arrow_forward_ios, size: 16),
      onTap: () => Navigator.of(context).pushNamed(route),
    );
  }
}
