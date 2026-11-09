import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:hive/hive.dart';

part 'authenticator_account.freezed.dart';
part 'authenticator_account.g.dart';

@freezed
@HiveType(typeId: 1)
class AuthenticatorAccount with _$AuthenticatorAccount {
  const factory AuthenticatorAccount({
    @HiveField(0) required String id,
    @HiveField(1) required String issuer,
    @HiveField(2) required String accountName,
    @HiveField(3) required String secret,
    @HiveField(4) @Default('SHA1') String algorithm,
    @HiveField(5) @Default(6) int digits,
    @HiveField(6) @Default(30) int period,
    @HiveField(7) String? category,
    @HiveField(8) @Default(false) bool isFavorite,
    @HiveField(9) required DateTime createdAt,
  }) = _AuthenticatorAccount;

  factory AuthenticatorAccount.fromJson(Map<String, dynamic> json) =>
      _$AuthenticatorAccountFromJson(json);
}
