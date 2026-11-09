# Dependency Injection

CubePod uses a lightweight Service Locator pattern via `CubePod.register()`.

- Register dependencies in `lib/main.dart`.
- Scope: Use `Scope.singleton` for app-wide instances, or `Scope.factory` for new instances per request.
- Access: Use `context.cube<T>()` inside widgets, or `container.get<T>()` in Dart code.
