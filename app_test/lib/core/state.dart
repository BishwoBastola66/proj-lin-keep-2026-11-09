import 'package:cubepod/cubepod.dart';

class AppState {
  final count = StateSignal(0);
  final isOffline = StateSignal(false);
  final logs = StateSignal<List<String>>([]);

  void increment() {
    count.value++;
    addLog('Counter incremented to ${count.value}');
  }

  void toggleOffline() {
    isOffline.value = !isOffline.value;
    addLog('Offline mode: ${isOffline.value}');
  }

  void addLog(String message) {
    logs.value = [...logs.value, '${DateTime.now().toIso8601String()}: $message'];
  }
}
