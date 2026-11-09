import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:hive/hive.dart';

part 'vault_item.freezed.dart';
part 'vault_item.g.dart';

@freezed
@HiveType(typeId: 2)
class VaultItem with _$VaultItem {
  const factory VaultItem({
    @HiveField(0) required String id,
    @HiveField(1) required String title,
    @HiveField(2) required String itemType, // password, note, key
    @HiveField(3) required String encryptedPayload, // The AES encrypted data
    @HiveField(4) required DateTime createdAt,
    @HiveField(5) @Default(false) bool isFavorite,
  }) = _VaultItem;

  factory VaultItem.fromJson(Map<String, dynamic> json) => _$VaultItemFromJson(json);
}
