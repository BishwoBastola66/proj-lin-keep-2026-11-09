/// Welcome to CubePod! 
/// 
/// CubePod is a production-ready framework designed to make Flutter development fast and clean.
/// 
/// 📚 Quick Guidelines for Beginners:
/// 
/// 1. FEATURES: Your app should be broken down into features (like 'auth', 'dashboard', 'settings').
///    -> Run `cubepod feature create <name>` in your terminal to instantly generate one!
/// 
/// 2. CORE: Shared code like colors, themes, and networking go into `lib/core`.
/// 
/// 3. DATA: Global data models go into `lib/data`.
/// 
/// CubePod automatically handles Dependency Injection, State Management (via Signals), 
/// and Routing for you inside the feature modules you generate.
/// 
/// Check out the `docs/ARCHITECTURE.md` file for a deeper dive.
/// 

import 'package:flutter/material.dart';
import 'package:cubepod/cubepod.dart';
import 'app/app.dart';
import 'services/counter_service.dart';
import 'services/auth_service.dart';
import 'repositories/tour_repository.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize Storage (Required for Persisted Signals)
  CubePod.register<StorageService>((c) => MemoryStorage(), scope: Scope.singleton);
  
  // Repositories
  CubePod.register<TourRepository>((c) => TourRepository(), scope: Scope.singleton);
  
  // Services
  CubePod.register<CounterService>((c) => CounterService(), scope: Scope.singleton);
  CubePod.register<AuthService>((c) => AuthService(), scope: Scope.singleton);
  
  runApp(const App());
}
