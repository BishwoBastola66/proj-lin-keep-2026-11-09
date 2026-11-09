import 'package:cubepod/cubepod.dart';
import 'package:flutter/foundation.dart';
import 'package:app_test/services/api_service.dart';

class MockSyncTask implements SyncTask {
  @override
  final String id;
  @override
  final String type = 'mock_task';
  final Map<String, dynamic> payload;

  MockSyncTask(this.id, this.payload);

  @override
  Map<String, dynamic> toJson() => {'id': id, 'payload': payload};

  @override
  Future<void> execute() async {
    debugPrint('Executing task $id');
    await Future.delayed(const Duration(seconds: 1));
  }
}

class SyncManager {
  final ApiService api;
  late final SyncQueue queue;

  SyncManager(this.api) {
    queue = SyncQueue(storage: MemoryStorage()); 
  }
  
  Future<void> init() async {
    queue.registerFactory('mock_task', (json) => MockSyncTask(json['id'], json['payload']));
  }
}
