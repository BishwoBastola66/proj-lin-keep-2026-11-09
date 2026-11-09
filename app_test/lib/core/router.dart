import 'package:cubepod/cubepod.dart';
import 'package:app_test/screens/home_screen.dart';
import 'package:app_test/screens/details_screen.dart';
import 'package:app_test/screens/counter_screen.dart';
import 'package:app_test/screens/login_screen.dart';

final router = CubeRouter([
  CubeRoute(path: '/', builder: (_) => const HomeScreen()),
  CubeRoute(
    path: '/details',
    builder: (_) => const DetailsScreen(),
  ),
  CubeRoute(
    path: '/counter',
    builder: (_) => const CounterOnlyScreen(),
  ),
  CubeRoute(
    path: '/login',
    builder: (_) => const LoginScreen(),
  ),
]);
