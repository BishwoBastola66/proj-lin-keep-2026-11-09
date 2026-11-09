# Signals

CubePod uses Signals for reactive state management.

- `StateSignal`: Holds a mutable value. Modifying `.value` alerts listeners.
- `ComputedSignal`: Derives a value from one or more `StateSignal`s. Recalculates lazily.
- `Effect`: Runs a side effect whenever tracked signals change.
