import 'package:flutter/material.dart';
import '../features/tour/tour_dashboard.dart';
import '../features/tour/di_view.dart';
import '../features/tour/signals_view.dart';
import '../features/tour/async_view.dart';
import '../features/tour/queries_view.dart';
import '../features/tour/storage_view.dart';

class AppRouter {
  static Route<dynamic> onGenerateRoute(RouteSettings settings) {
    switch (settings.name) {
      case '/':
        return MaterialPageRoute(builder: (_) => const TourDashboard());
      case '/tour/di':
        return MaterialPageRoute(builder: (_) => const DiView());
      case '/tour/signals':
        return MaterialPageRoute(builder: (_) => const SignalsView());
      case '/tour/async':
        return MaterialPageRoute(builder: (_) => const AsyncView());
      case '/tour/queries':
        return MaterialPageRoute(builder: (_) => const QueriesView());
      case '/tour/storage':
        return MaterialPageRoute(builder: (_) => const StorageView());
      default:
        return MaterialPageRoute(
          builder: (_) => Scaffold(
            appBar: AppBar(title: const Text('Error')),
            body: const Center(child: Text('Route not found')),
          ),
        );
    }
  }
}
