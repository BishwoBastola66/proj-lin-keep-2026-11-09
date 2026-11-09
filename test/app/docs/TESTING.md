# Testing

CubePod apps are highly testable.

- `CubePod.reset()`: Clear the DI container between tests.
- Overrides: Register mock instances using `CubePod.register()` before running tests.
