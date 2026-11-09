import 'package:cubepod/cubepod.dart';

class CounterService extends Disposable {
  final count = StateSignal<int>(0);

  void increment() {
    count.value++;
  }

  @override
  void dispose() {
    count.dispose();
  }
}
