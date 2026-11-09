import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../features/authentication/presentation/pages/splash_page.dart';
import '../../features/authentication/presentation/pages/onboarding_page.dart';
import '../../features/authentication/presentation/pages/login_page.dart';
import '../../features/authentication/presentation/pages/pin_lock_page.dart';
import '../../features/dashboard/presentation/pages/dashboard_page.dart';
import '../../features/authenticator/presentation/pages/add_account_page.dart';
import '../../features/scanner/presentation/pages/scanner_page.dart';
import '../../features/authentication/presentation/providers/auth_controller.dart';

final appRouterProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authControllerProvider);

  return GoRouter(
    initialLocation: '/',
    redirect: (context, state) {
      if (authState == AuthState.initial) {
        return '/'; // Stay on splash while loading
      }

      final isSplash = state.matchedLocation == '/';
      final isOnboarding = state.matchedLocation == '/onboarding';
      final isLogin = state.matchedLocation == '/login';
      final isDashboard = state.matchedLocation == '/dashboard';

      if (authState == AuthState.unauthenticated) {
        if (!isSplash && !isOnboarding && !isLogin) {
          return '/onboarding';
        }
      } else if (authState == AuthState.authenticatedLocked) {
        if (state.matchedLocation != '/verify-pin') {
          return '/verify-pin';
        }
      } else if (authState == AuthState.authenticatedNeedsPin) {
        if (state.matchedLocation != '/setup-pin') {
          return '/setup-pin';
        }
      } else if (authState == AuthState.authenticatedUnlocked) {
        if (isSplash || isOnboarding || isLogin || state.matchedLocation == '/verify-pin' || state.matchedLocation == '/setup-pin') {
          return '/dashboard';
        }
      }

      return null;
    },
    routes: [
      GoRoute(
        path: '/',
        builder: (context, state) => const SplashPage(),
      ),
      GoRoute(
        path: '/onboarding',
        builder: (context, state) => const OnboardingPage(),
      ),
      GoRoute(
        path: '/login',
        builder: (context, state) => const LoginPage(),
      ),
      GoRoute(
        path: '/verify-pin',
        builder: (context, state) => const PinLockPage(isSetup: false),
      ),
      GoRoute(
        path: '/setup-pin',
        builder: (context, state) => const PinLockPage(isSetup: true),
      ),
      GoRoute(
        path: '/dashboard',
        builder: (context, state) {
          // If we reach dashboard without a pin, push setup-pin immediately
          return const DashboardPage();
        },
      ),
      GoRoute(
        path: '/add-account',
        builder: (context, state) => const AddAccountPage(),
      ),
      GoRoute(
        path: '/scanner',
        builder: (context, state) => const ScannerPage(),
      ),
    ],
  );
});
