// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'totw.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

TotwPlayerName _$TotwPlayerNameFromJson(Map<String, dynamic> json) =>
    TotwPlayerName(
      firstName: json['firstName'] as String,
      lastName: json['lastName'] as String,
      fullName: json['fullName'] as String,
    );

Map<String, dynamic> _$TotwPlayerNameToJson(TotwPlayerName instance) =>
    <String, dynamic>{
      'firstName': instance.firstName,
      'lastName': instance.lastName,
      'fullName': instance.fullName,
    };

TotwTopRating _$TotwTopRatingFromJson(Map<String, dynamic> json) =>
    TotwTopRating(
      isTopRating: json['isTopRating'] as bool,
    );

Map<String, dynamic> _$TotwTopRatingToJson(TotwTopRating instance) =>
    <String, dynamic>{
      'isTopRating': instance.isTopRating,
    };

TotwRating _$TotwRatingFromJson(Map<String, dynamic> json) => TotwRating(
      num: json['num'] as String,
      bgcolor: json['bgcolor'] as String,
      isTop: TotwTopRating.fromJson(json['isTop'] as Map<String, dynamic>),
    );

Map<String, dynamic> _$TotwRatingToJson(TotwRating instance) =>
    <String, dynamic>{
      'num': instance.num,
      'bgcolor': instance.bgcolor,
      'isTop': instance.isTop,
    };

TotwVerticalLayout _$TotwVerticalLayoutFromJson(Map<String, dynamic> json) =>
    TotwVerticalLayout(
      width: json['width'] as num,
      height: json['height'] as num,
      x: json['x'] as num,
      y: json['y'] as num,
    );

Map<String, dynamic> _$TotwVerticalLayoutToJson(TotwVerticalLayout instance) =>
    <String, dynamic>{
      'width': instance.width,
      'height': instance.height,
      'x': instance.x,
      'y': instance.y,
    };

TotwPlayer _$TotwPlayerFromJson(Map<String, dynamic> json) => TotwPlayer(
      id: (json['id'] as num).toInt(),
      name: TotwPlayerName.fromJson(json['name'] as Map<String, dynamic>),
      rating: TotwRating.fromJson(json['rating'] as Map<String, dynamic>),
      matchId: (json['matchId'] as num).toInt(),
      teamId: (json['teamId'] as num).toInt(),
      verticalLayout: TotwVerticalLayout.fromJson(
          json['verticalLayout'] as Map<String, dynamic>),
      isTots: json['isTots'] as bool,
    );

Map<String, dynamic> _$TotwPlayerToJson(TotwPlayer instance) =>
    <String, dynamic>{
      'id': instance.id,
      'name': instance.name,
      'rating': instance.rating,
      'matchId': instance.matchId,
      'teamId': instance.teamId,
      'verticalLayout': instance.verticalLayout,
      'isTots': instance.isTots,
    };

TotwRound _$TotwRoundFromJson(Map<String, dynamic> json) => TotwRound(
      localizedKey: json['localizedKey'] as String?,
      roundId: json['roundId'] as String,
      isCompleted: json['isCompleted'] as bool,
    );

Map<String, dynamic> _$TotwRoundToJson(TotwRound instance) => <String, dynamic>{
      'localizedKey': instance.localizedKey,
      'roundId': instance.roundId,
      'isCompleted': instance.isCompleted,
    };

TeamOfTheWeekRoundsResponse _$TeamOfTheWeekRoundsResponseFromJson(
        Map<String, dynamic> json) =>
    TeamOfTheWeekRoundsResponse(
      last: TotwRound.fromJson(json['last'] as Map<String, dynamic>),
      rounds: (json['rounds'] as List<dynamic>)
          .map((e) => TotwRound.fromJson(e as Map<String, dynamic>))
          .toList(),
    );

Map<String, dynamic> _$TeamOfTheWeekRoundsResponseToJson(
        TeamOfTheWeekRoundsResponse instance) =>
    <String, dynamic>{
      'last': instance.last,
      'rounds': instance.rounds,
    };
