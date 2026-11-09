# Architecture Guidelines

This project uses **CubePod** for dependency injection and state management.

## Dependency Injection
Dependencies are registered in `lib/main.dart` using `CubePod.register()`. They are accessed in the UI via `context.cube<T>()`.

## State Management
State is managed using **Signals** (`StateSignal`, `ComputedSignal`). Use `CubeBuilder` to rebuild UI when a signal changes. Avoid using `setState` for business logic.

## Services vs Repositories
- **Services**: Handle business logic and application state (e.g., `AuthService`).
- **Repositories**: Handle data fetching and persistence (e.g., `UserRepository`). Services consume Repositories.
