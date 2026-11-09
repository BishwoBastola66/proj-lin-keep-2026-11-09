// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'authenticator_account.dart';

// **************************************************************************
// TypeAdapterGenerator
// **************************************************************************

class AuthenticatorAccountAdapter extends TypeAdapter<AuthenticatorAccount> {
  @override
  final int typeId = 1;

  @override
  AuthenticatorAccount read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return AuthenticatorAccount(
      id: fields[0] as String,
      issuer: fields[1] as String,
      accountName: fields[2] as String,
      secret: fields[3] as String,
      algorithm: fields[4] as String,
      digits: fields[5] as int,
      period: fields[6] as int,
      category: fields[7] as String?,
      isFavorite: fields[8] as bool,
      createdAt: fields[9] as DateTime,
    );
  }

  @override
  void write(BinaryWriter writer, AuthenticatorAccount obj) {
    writer
      ..writeByte(10)
      ..writeByte(0)
      ..write(obj.id)
      ..writeByte(1)
      ..write(obj.issuer)
      ..writeByte(2)
      ..write(obj.accountName)
      ..writeByte(3)
      ..write(obj.secret)
      ..writeByte(4)
      ..write(obj.algorithm)
      ..writeByte(5)
      ..write(obj.digits)
      ..writeByte(6)
      ..write(obj.period)
      ..writeByte(7)
      ..write(obj.category)
      ..writeByte(8)
      ..write(obj.isFavorite)
      ..writeByte(9)
      ..write(obj.createdAt);
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is AuthenticatorAccountAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$AuthenticatorAccountImpl _$$AuthenticatorAccountImplFromJson(
        Map<String, dynamic> json) =>
    _$AuthenticatorAccountImpl(
      id: json['id'] as String,
      issuer: json['issuer'] as String,
      accountName: json['accountName'] as String,
      secret: json['secret'] as String,
      algorithm: json['algorithm'] as String? ?? 'SHA1',
      digits: (json['digits'] as num?)?.toInt() ?? 6,
      period: (json['period'] as num?)?.toInt() ?? 30,
      category: json['category'] as String?,
      isFavorite: json['isFavorite'] as bool? ?? false,
      createdAt: DateTime.parse(json['createdAt'] as String),
    );

Map<String, dynamic> _$$AuthenticatorAccountImplToJson(
        _$AuthenticatorAccountImpl instance) =>
    <String, dynamic>{
      'id': instance.id,
      'issuer': instance.issuer,
      'accountName': instance.accountName,
      'secret': instance.secret,
      'algorithm': instance.algorithm,
      'digits': instance.digits,
      'period': instance.period,
      'category': instance.category,
      'isFavorite': instance.isFavorite,
      'createdAt': instance.createdAt.toIso8601String(),
    };
