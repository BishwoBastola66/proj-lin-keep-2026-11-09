// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'authenticator_account.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
    'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models');

AuthenticatorAccount _$AuthenticatorAccountFromJson(Map<String, dynamic> json) {
  return _AuthenticatorAccount.fromJson(json);
}

/// @nodoc
mixin _$AuthenticatorAccount {
  @HiveField(0)
  String get id => throw _privateConstructorUsedError;
  @HiveField(1)
  String get issuer => throw _privateConstructorUsedError;
  @HiveField(2)
  String get accountName => throw _privateConstructorUsedError;
  @HiveField(3)
  String get secret => throw _privateConstructorUsedError;
  @HiveField(4)
  String get algorithm => throw _privateConstructorUsedError;
  @HiveField(5)
  int get digits => throw _privateConstructorUsedError;
  @HiveField(6)
  int get period => throw _privateConstructorUsedError;
  @HiveField(7)
  String? get category => throw _privateConstructorUsedError;
  @HiveField(8)
  bool get isFavorite => throw _privateConstructorUsedError;
  @HiveField(9)
  DateTime get createdAt => throw _privateConstructorUsedError;

  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;
  @JsonKey(ignore: true)
  $AuthenticatorAccountCopyWith<AuthenticatorAccount> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $AuthenticatorAccountCopyWith<$Res> {
  factory $AuthenticatorAccountCopyWith(AuthenticatorAccount value,
          $Res Function(AuthenticatorAccount) then) =
      _$AuthenticatorAccountCopyWithImpl<$Res, AuthenticatorAccount>;
  @useResult
  $Res call(
      {@HiveField(0) String id,
      @HiveField(1) String issuer,
      @HiveField(2) String accountName,
      @HiveField(3) String secret,
      @HiveField(4) String algorithm,
      @HiveField(5) int digits,
      @HiveField(6) int period,
      @HiveField(7) String? category,
      @HiveField(8) bool isFavorite,
      @HiveField(9) DateTime createdAt});
}

/// @nodoc
class _$AuthenticatorAccountCopyWithImpl<$Res,
        $Val extends AuthenticatorAccount>
    implements $AuthenticatorAccountCopyWith<$Res> {
  _$AuthenticatorAccountCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? issuer = null,
    Object? accountName = null,
    Object? secret = null,
    Object? algorithm = null,
    Object? digits = null,
    Object? period = null,
    Object? category = freezed,
    Object? isFavorite = null,
    Object? createdAt = null,
  }) {
    return _then(_value.copyWith(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as String,
      issuer: null == issuer
          ? _value.issuer
          : issuer // ignore: cast_nullable_to_non_nullable
              as String,
      accountName: null == accountName
          ? _value.accountName
          : accountName // ignore: cast_nullable_to_non_nullable
              as String,
      secret: null == secret
          ? _value.secret
          : secret // ignore: cast_nullable_to_non_nullable
              as String,
      algorithm: null == algorithm
          ? _value.algorithm
          : algorithm // ignore: cast_nullable_to_non_nullable
              as String,
      digits: null == digits
          ? _value.digits
          : digits // ignore: cast_nullable_to_non_nullable
              as int,
      period: null == period
          ? _value.period
          : period // ignore: cast_nullable_to_non_nullable
              as int,
      category: freezed == category
          ? _value.category
          : category // ignore: cast_nullable_to_non_nullable
              as String?,
      isFavorite: null == isFavorite
          ? _value.isFavorite
          : isFavorite // ignore: cast_nullable_to_non_nullable
              as bool,
      createdAt: null == createdAt
          ? _value.createdAt
          : createdAt // ignore: cast_nullable_to_non_nullable
              as DateTime,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$AuthenticatorAccountImplCopyWith<$Res>
    implements $AuthenticatorAccountCopyWith<$Res> {
  factory _$$AuthenticatorAccountImplCopyWith(_$AuthenticatorAccountImpl value,
          $Res Function(_$AuthenticatorAccountImpl) then) =
      __$$AuthenticatorAccountImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {@HiveField(0) String id,
      @HiveField(1) String issuer,
      @HiveField(2) String accountName,
      @HiveField(3) String secret,
      @HiveField(4) String algorithm,
      @HiveField(5) int digits,
      @HiveField(6) int period,
      @HiveField(7) String? category,
      @HiveField(8) bool isFavorite,
      @HiveField(9) DateTime createdAt});
}

/// @nodoc
class __$$AuthenticatorAccountImplCopyWithImpl<$Res>
    extends _$AuthenticatorAccountCopyWithImpl<$Res, _$AuthenticatorAccountImpl>
    implements _$$AuthenticatorAccountImplCopyWith<$Res> {
  __$$AuthenticatorAccountImplCopyWithImpl(_$AuthenticatorAccountImpl _value,
      $Res Function(_$AuthenticatorAccountImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? issuer = null,
    Object? accountName = null,
    Object? secret = null,
    Object? algorithm = null,
    Object? digits = null,
    Object? period = null,
    Object? category = freezed,
    Object? isFavorite = null,
    Object? createdAt = null,
  }) {
    return _then(_$AuthenticatorAccountImpl(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as String,
      issuer: null == issuer
          ? _value.issuer
          : issuer // ignore: cast_nullable_to_non_nullable
              as String,
      accountName: null == accountName
          ? _value.accountName
          : accountName // ignore: cast_nullable_to_non_nullable
              as String,
      secret: null == secret
          ? _value.secret
          : secret // ignore: cast_nullable_to_non_nullable
              as String,
      algorithm: null == algorithm
          ? _value.algorithm
          : algorithm // ignore: cast_nullable_to_non_nullable
              as String,
      digits: null == digits
          ? _value.digits
          : digits // ignore: cast_nullable_to_non_nullable
              as int,
      period: null == period
          ? _value.period
          : period // ignore: cast_nullable_to_non_nullable
              as int,
      category: freezed == category
          ? _value.category
          : category // ignore: cast_nullable_to_non_nullable
              as String?,
      isFavorite: null == isFavorite
          ? _value.isFavorite
          : isFavorite // ignore: cast_nullable_to_non_nullable
              as bool,
      createdAt: null == createdAt
          ? _value.createdAt
          : createdAt // ignore: cast_nullable_to_non_nullable
              as DateTime,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$AuthenticatorAccountImpl implements _AuthenticatorAccount {
  const _$AuthenticatorAccountImpl(
      {@HiveField(0) required this.id,
      @HiveField(1) required this.issuer,
      @HiveField(2) required this.accountName,
      @HiveField(3) required this.secret,
      @HiveField(4) this.algorithm = 'SHA1',
      @HiveField(5) this.digits = 6,
      @HiveField(6) this.period = 30,
      @HiveField(7) this.category,
      @HiveField(8) this.isFavorite = false,
      @HiveField(9) required this.createdAt});

  factory _$AuthenticatorAccountImpl.fromJson(Map<String, dynamic> json) =>
      _$$AuthenticatorAccountImplFromJson(json);

  @override
  @HiveField(0)
  final String id;
  @override
  @HiveField(1)
  final String issuer;
  @override
  @HiveField(2)
  final String accountName;
  @override
  @HiveField(3)
  final String secret;
  @override
  @JsonKey()
  @HiveField(4)
  final String algorithm;
  @override
  @JsonKey()
  @HiveField(5)
  final int digits;
  @override
  @JsonKey()
  @HiveField(6)
  final int period;
  @override
  @HiveField(7)
  final String? category;
  @override
  @JsonKey()
  @HiveField(8)
  final bool isFavorite;
  @override
  @HiveField(9)
  final DateTime createdAt;

  @override
  String toString() {
    return 'AuthenticatorAccount(id: $id, issuer: $issuer, accountName: $accountName, secret: $secret, algorithm: $algorithm, digits: $digits, period: $period, category: $category, isFavorite: $isFavorite, createdAt: $createdAt)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$AuthenticatorAccountImpl &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.issuer, issuer) || other.issuer == issuer) &&
            (identical(other.accountName, accountName) ||
                other.accountName == accountName) &&
            (identical(other.secret, secret) || other.secret == secret) &&
            (identical(other.algorithm, algorithm) ||
                other.algorithm == algorithm) &&
            (identical(other.digits, digits) || other.digits == digits) &&
            (identical(other.period, period) || other.period == period) &&
            (identical(other.category, category) ||
                other.category == category) &&
            (identical(other.isFavorite, isFavorite) ||
                other.isFavorite == isFavorite) &&
            (identical(other.createdAt, createdAt) ||
                other.createdAt == createdAt));
  }

  @JsonKey(ignore: true)
  @override
  int get hashCode => Object.hash(runtimeType, id, issuer, accountName, secret,
      algorithm, digits, period, category, isFavorite, createdAt);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$AuthenticatorAccountImplCopyWith<_$AuthenticatorAccountImpl>
      get copyWith =>
          __$$AuthenticatorAccountImplCopyWithImpl<_$AuthenticatorAccountImpl>(
              this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$AuthenticatorAccountImplToJson(
      this,
    );
  }
}

abstract class _AuthenticatorAccount implements AuthenticatorAccount {
  const factory _AuthenticatorAccount(
          {@HiveField(0) required final String id,
          @HiveField(1) required final String issuer,
          @HiveField(2) required final String accountName,
          @HiveField(3) required final String secret,
          @HiveField(4) final String algorithm,
          @HiveField(5) final int digits,
          @HiveField(6) final int period,
          @HiveField(7) final String? category,
          @HiveField(8) final bool isFavorite,
          @HiveField(9) required final DateTime createdAt}) =
      _$AuthenticatorAccountImpl;

  factory _AuthenticatorAccount.fromJson(Map<String, dynamic> json) =
      _$AuthenticatorAccountImpl.fromJson;

  @override
  @HiveField(0)
  String get id;
  @override
  @HiveField(1)
  String get issuer;
  @override
  @HiveField(2)
  String get accountName;
  @override
  @HiveField(3)
  String get secret;
  @override
  @HiveField(4)
  String get algorithm;
  @override
  @HiveField(5)
  int get digits;
  @override
  @HiveField(6)
  int get period;
  @override
  @HiveField(7)
  String? get category;
  @override
  @HiveField(8)
  bool get isFavorite;
  @override
  @HiveField(9)
  DateTime get createdAt;
  @override
  @JsonKey(ignore: true)
  _$$AuthenticatorAccountImplCopyWith<_$AuthenticatorAccountImpl>
      get copyWith => throw _privateConstructorUsedError;
}
