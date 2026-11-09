// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'transfers.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

TransferPosition _$TransferPositionFromJson(Map<String, dynamic> json) =>
    TransferPosition(
      label: json['label'] as String,
      key: json['key'] as String,
    );

Map<String, dynamic> _$TransferPositionToJson(TransferPosition instance) =>
    <String, dynamic>{
      'label': instance.label,
      'key': instance.key,
    };

TransferFee _$TransferFeeFromJson(Map<String, dynamic> json) => TransferFee(
      feeText: json['feeText'] as String,
      localizedFeeText: json['localizedFeeText'] as String,
      value: json['value'] as num,
    );

Map<String, dynamic> _$TransferFeeToJson(TransferFee instance) =>
    <String, dynamic>{
      'feeText': instance.feeText,
      'localizedFeeText': instance.localizedFeeText,
      'value': instance.value,
    };

TransferType _$TransferTypeFromJson(Map<String, dynamic> json) => TransferType(
      text: json['text'] as String,
      localizationKey: json['localizationKey'] as String,
    );

Map<String, dynamic> _$TransferTypeToJson(TransferType instance) =>
    <String, dynamic>{
      'text': instance.text,
      'localizationKey': instance.localizationKey,
    };

TransferText _$TransferTextFromJson(Map<String, dynamic> json) => TransferText(
      language: json['language'] as String,
      text: json['text'] as String,
    );

Map<String, dynamic> _$TransferTextToJson(TransferText instance) =>
    <String, dynamic>{
      'language': instance.language,
      'text': instance.text,
    };

TransferItem _$TransferItemFromJson(Map<String, dynamic> json) => TransferItem(
      name: json['name'] as String,
      playerId: (json['playerId'] as num).toInt(),
      position: json['position'] == null
          ? null
          : TransferPosition.fromJson(json['position'] as Map<String, dynamic>),
      transferDate: json['transferDate'] as String,
      transferText: (json['transferText'] as List<dynamic>?)
          ?.map((e) => e == null
              ? null
              : TransferText.fromJson(e as Map<String, dynamic>))
          .toList(),
      fromClub: json['fromClub'] as String,
      fromClubFullName: json['fromClubFullName'] as String,
      fromClubId: (json['fromClubId'] as num).toInt(),
      toClub: json['toClub'] as String,
      toClubFullName: json['toClubFullName'] as String,
      toClubId: (json['toClubId'] as num).toInt(),
      fee: json['fee'] == null
          ? null
          : TransferFee.fromJson(json['fee'] as Map<String, dynamic>),
      amountEuroEstimated: json['amountEuroEstimated'] as num?,
      transferType: json['transferType'] == null
          ? null
          : TransferType.fromJson(json['transferType'] as Map<String, dynamic>),
      contractExtension: json['contractExtension'] as bool,
      onLoan: json['onLoan'] as bool,
      fromDate: json['fromDate'] as String,
      toDate: json['toDate'] as String?,
      marketValue: json['marketValue'] as num,
    );

Map<String, dynamic> _$TransferItemToJson(TransferItem instance) =>
    <String, dynamic>{
      'name': instance.name,
      'playerId': instance.playerId,
      'position': instance.position,
      'transferDate': instance.transferDate,
      'transferText': instance.transferText,
      'fromClub': instance.fromClub,
      'fromClubFullName': instance.fromClubFullName,
      'fromClubId': instance.fromClubId,
      'toClub': instance.toClub,
      'toClubFullName': instance.toClubFullName,
      'toClubId': instance.toClubId,
      'fee': instance.fee,
      'amountEuroEstimated': instance.amountEuroEstimated,
      'transferType': instance.transferType,
      'contractExtension': instance.contractExtension,
      'onLoan': instance.onLoan,
      'fromDate': instance.fromDate,
      'toDate': instance.toDate,
      'marketValue': instance.marketValue,
    };

TopTransfersResponse _$TopTransfersResponseFromJson(
        Map<String, dynamic> json) =>
    TopTransfersResponse(
      transfers: (json['transfers'] as List<dynamic>)
          .map((e) => TransferItem.fromJson(e as Map<String, dynamic>))
          .toList(),
      hits: (json['hits'] as num?)?.toInt(),
      maxFee: json['maxFee'] as num?,
    );

Map<String, dynamic> _$TopTransfersResponseToJson(
        TopTransfersResponse instance) =>
    <String, dynamic>{
      'transfers': instance.transfers,
      'hits': instance.hits,
      'maxFee': instance.maxFee,
    };
