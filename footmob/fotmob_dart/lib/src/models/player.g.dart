// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'player.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

PlayerName _$PlayerNameFromJson(Map<String, dynamic> json) => PlayerName(
      firstName: json['firstName'] as String,
      lastName: json['lastName'] as String,
      fullName: json['fullName'] as String,
    );

Map<String, dynamic> _$PlayerNameToJson(PlayerName instance) =>
    <String, dynamic>{
      'firstName': instance.firstName,
      'lastName': instance.lastName,
      'fullName': instance.fullName,
    };

PlayerTeam _$PlayerTeamFromJson(Map<String, dynamic> json) => PlayerTeam(
      teamId: (json['teamId'] as num).toInt(),
      teamName: json['teamName'] as String,
    );

Map<String, dynamic> _$PlayerTeamToJson(PlayerTeam instance) =>
    <String, dynamic>{
      'teamId': instance.teamId,
      'teamName': instance.teamName,
    };

PlayerCareerItem _$PlayerCareerItemFromJson(Map<String, dynamic> json) =>
    PlayerCareerItem(
      teamId: (json['teamId'] as num).toInt(),
      teamName: json['teamName'] as String,
      appearances: json['appearances'],
      goals: json['goals'],
      season: json['season'] as String?,
      startDate: json['startDate'] as String?,
      endDate: json['endDate'] as String?,
    );

Map<String, dynamic> _$PlayerCareerItemToJson(PlayerCareerItem instance) =>
    <String, dynamic>{
      'teamId': instance.teamId,
      'teamName': instance.teamName,
      'appearances': instance.appearances,
      'goals': instance.goals,
      'season': instance.season,
      'startDate': instance.startDate,
      'endDate': instance.endDate,
    };

PlayerResponse _$PlayerResponseFromJson(Map<String, dynamic> json) =>
    PlayerResponse(
      id: (json['id'] as num).toInt(),
      name: json['name'] as String,
      isCoach: json['isCoach'] as bool,
      isCaptain: json['isCaptain'] as bool,
      gender: json['gender'] as String,
      status: json['status'] as String?,
    );

Map<String, dynamic> _$PlayerResponseToJson(PlayerResponse instance) =>
    <String, dynamic>{
      'id': instance.id,
      'name': instance.name,
      'isCoach': instance.isCoach,
      'isCaptain': instance.isCaptain,
      'gender': instance.gender,
      'status': instance.status,
    };
