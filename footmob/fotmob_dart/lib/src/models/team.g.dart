// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'team.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

TeamMemberRole _$TeamMemberRoleFromJson(Map<String, dynamic> json) =>
    TeamMemberRole(
      key: json['key'] as String,
      fallback: json['fallback'] as String,
    );

Map<String, dynamic> _$TeamMemberRoleToJson(TeamMemberRole instance) =>
    <String, dynamic>{
      'key': instance.key,
      'fallback': instance.fallback,
    };

TeamMember _$TeamMemberFromJson(Map<String, dynamic> json) => TeamMember(
      id: (json['id'] as num).toInt(),
      height: (json['height'] as num?)?.toInt(),
      age: (json['age'] as num).toInt(),
      dateOfBirth: json['dateOfBirth'] as String,
      name: json['name'] as String,
      ccode: json['ccode'] as String,
      cname: json['cname'] as String,
      role: TeamMemberRole.fromJson(json['role'] as Map<String, dynamic>),
      excludeFromRanking: json['excludeFromRanking'] as bool?,
      shirtNumber: (json['shirtNumber'] as num?)?.toInt(),
      rating: json['rating'] as num?,
      goals: (json['goals'] as num?)?.toInt(),
      assists: (json['assists'] as num?)?.toInt(),
      injured: json['injured'] as bool?,
    );

Map<String, dynamic> _$TeamMemberToJson(TeamMember instance) =>
    <String, dynamic>{
      'id': instance.id,
      'height': instance.height,
      'age': instance.age,
      'dateOfBirth': instance.dateOfBirth,
      'name': instance.name,
      'ccode': instance.ccode,
      'cname': instance.cname,
      'role': instance.role,
      'excludeFromRanking': instance.excludeFromRanking,
      'shirtNumber': instance.shirtNumber,
      'rating': instance.rating,
      'goals': instance.goals,
      'assists': instance.assists,
      'injured': instance.injured,
    };

TeamSquadPosition _$TeamSquadPositionFromJson(Map<String, dynamic> json) =>
    TeamSquadPosition(
      title: json['title'] as String,
      members: (json['members'] as List<dynamic>)
          .map((e) => TeamMember.fromJson(e as Map<String, dynamic>))
          .toList(),
    );

Map<String, dynamic> _$TeamSquadPositionToJson(TeamSquadPosition instance) =>
    <String, dynamic>{
      'title': instance.title,
      'members': instance.members,
    };

TeamSquad _$TeamSquadFromJson(Map<String, dynamic> json) => TeamSquad(
      squad: (json['squad'] as List<dynamic>?)
          ?.map((e) => TeamSquadPosition.fromJson(e as Map<String, dynamic>))
          .toList(),
      isNationalTeam: json['isNationalTeam'] as bool?,
    );

Map<String, dynamic> _$TeamSquadToJson(TeamSquad instance) => <String, dynamic>{
      'squad': instance.squad,
      'isNationalTeam': instance.isNationalTeam,
    };

TeamResponseDetails _$TeamResponseDetailsFromJson(Map<String, dynamic> json) =>
    TeamResponseDetails(
      id: (json['id'] as num).toInt(),
      type: json['type'] as String,
      name: json['name'] as String,
      latestSeason: json['latestSeason'] as String,
      shortName: json['shortName'] as String,
      country: json['country'] as String,
      primaryLeagueId: (json['primaryLeagueId'] as num).toInt(),
      primaryLeagueName: json['primaryLeagueName'] as String,
    );

Map<String, dynamic> _$TeamResponseDetailsToJson(
        TeamResponseDetails instance) =>
    <String, dynamic>{
      'id': instance.id,
      'type': instance.type,
      'name': instance.name,
      'latestSeason': instance.latestSeason,
      'shortName': instance.shortName,
      'country': instance.country,
      'primaryLeagueId': instance.primaryLeagueId,
      'primaryLeagueName': instance.primaryLeagueName,
    };

TeamResponse _$TeamResponseFromJson(Map<String, dynamic> json) => TeamResponse(
      tabs: (json['tabs'] as List<dynamic>?)?.map((e) => e as String).toList(),
      allAvailableSeasons: (json['allAvailableSeasons'] as List<dynamic>?)
          ?.map((e) => e as String)
          .toList(),
      details: json['details'] == null
          ? null
          : TeamResponseDetails.fromJson(
              json['details'] as Map<String, dynamic>),
      seostr: json['seostr'] as String?,
      squad: json['squad'] == null
          ? null
          : TeamSquad.fromJson(json['squad'] as Map<String, dynamic>),
    );

Map<String, dynamic> _$TeamResponseToJson(TeamResponse instance) =>
    <String, dynamic>{
      'tabs': instance.tabs,
      'allAvailableSeasons': instance.allAvailableSeasons,
      'details': instance.details,
      'seostr': instance.seostr,
      'squad': instance.squad,
    };
