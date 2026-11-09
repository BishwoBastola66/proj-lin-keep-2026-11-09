import 'package:json_annotation/json_annotation.dart';

part 'transfers.g.dart';

@JsonSerializable()
class TransferPosition {
  final String label;
  final String key;

  TransferPosition({
    required this.label,
    required this.key,
  });

  factory TransferPosition.fromJson(Map<String, dynamic> json) => _$TransferPositionFromJson(json);
  Map<String, dynamic> toJson() => _$TransferPositionToJson(this);
}

@JsonSerializable()
class TransferFee {
  final String feeText;
  final String localizedFeeText;
  final num value;

  TransferFee({
    required this.feeText,
    required this.localizedFeeText,
    required this.value,
  });

  factory TransferFee.fromJson(Map<String, dynamic> json) => _$TransferFeeFromJson(json);
  Map<String, dynamic> toJson() => _$TransferFeeToJson(this);
}

@JsonSerializable()
class TransferType {
  final String text;
  final String localizationKey;

  TransferType({
    required this.text,
    required this.localizationKey,
  });

  factory TransferType.fromJson(Map<String, dynamic> json) => _$TransferTypeFromJson(json);
  Map<String, dynamic> toJson() => _$TransferTypeToJson(this);
}

@JsonSerializable()
class TransferText {
  final String language;
  final String text;

  TransferText({
    required this.language,
    required this.text,
  });

  factory TransferText.fromJson(Map<String, dynamic> json) => _$TransferTextFromJson(json);
  Map<String, dynamic> toJson() => _$TransferTextToJson(this);
}

@JsonSerializable()
class TransferItem {
  final String name;
  final int playerId;
  final TransferPosition? position;
  final String transferDate;
  final List<TransferText?>? transferText;
  final String fromClub;
  final String fromClubFullName;
  final int fromClubId;
  final String toClub;
  final String toClubFullName;
  final int toClubId;
  final TransferFee? fee;
  final num? amountEuroEstimated;
  final TransferType? transferType;
  final bool contractExtension;
  final bool onLoan;
  final String fromDate;
  final String? toDate;
  final num marketValue;

  TransferItem({
    required this.name,
    required this.playerId,
    this.position,
    required this.transferDate,
    this.transferText,
    required this.fromClub,
    required this.fromClubFullName,
    required this.fromClubId,
    required this.toClub,
    required this.toClubFullName,
    required this.toClubId,
    this.fee,
    this.amountEuroEstimated,
    this.transferType,
    required this.contractExtension,
    required this.onLoan,
    required this.fromDate,
    this.toDate,
    required this.marketValue,
  });

  factory TransferItem.fromJson(Map<String, dynamic> json) => _$TransferItemFromJson(json);
  Map<String, dynamic> toJson() => _$TransferItemToJson(this);
}

@JsonSerializable()
class TopTransfersResponse {
  final List<TransferItem> transfers;
  final int? hits;
  final num? maxFee;

  TopTransfersResponse({
    required this.transfers,
    this.hits,
    this.maxFee,
  });

  factory TopTransfersResponse.fromJson(Map<String, dynamic> json) => _$TopTransfersResponseFromJson(json);
  Map<String, dynamic> toJson() => _$TopTransfersResponseToJson(this);
}
