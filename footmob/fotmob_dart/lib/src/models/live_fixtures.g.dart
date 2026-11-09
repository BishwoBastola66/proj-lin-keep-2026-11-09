// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'live_fixtures.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

LiveFixtureLeague _$LiveFixtureLeagueFromJson(Map<String, dynamic> json) =>
    LiveFixtureLeague(
      primaryLeagueId: (json['primaryLeagueId'] as num?)?.toInt(),
      leagueId: (json['leagueId'] as num?)?.toInt(),
      leagueName: json['leagueName'] as String?,
      parentLeagueId: (json['parentLeagueId'] as num?)?.toInt(),
      stageId: (json['stageId'] as num?)?.toInt(),
      tournamentId: (json['tournamentId'] as num?)?.toInt(),
      isCup: json['isCup'] as bool?,
      countryCode: json['countryCode'] as String?,
    );

Map<String, dynamic> _$LiveFixtureLeagueToJson(LiveFixtureLeague instance) =>
    <String, dynamic>{
      'primaryLeagueId': instance.primaryLeagueId,
      'leagueId': instance.leagueId,
      'leagueName': instance.leagueName,
      'parentLeagueId': instance.parentLeagueId,
      'stageId': instance.stageId,
      'tournamentId': instance.tournamentId,
      'isCup': instance.isCup,
      'countryCode': instance.countryCode,
    };

LiveFixtureMatch _$LiveFixtureMatchFromJson(Map<String, dynamic> json) =>
    LiveFixtureMatch(
      matchId: (json['matchId'] as num?)?.toInt(),
      homeId: (json['homeId'] as num?)?.toInt(),
      awayId: (json['awayId'] as num?)?.toInt(),
      homeScore: (json['homeScore'] as num?)?.toInt(),
      awayScore: (json['awayScore'] as num?)?.toInt(),
      homeName: json['homeName'] as String?,
      awayName: json['awayName'] as String?,
      matchDateUtc: json['matchDateUtc'] as String?,
      league: json['league'] == null
          ? null
          : LiveFixtureLeague.fromJson(json['league'] as Map<String, dynamic>),
      round: json['round'] as String?,
      statusId: (json['statusId'] as num?)?.toInt(),
      status: json['status'] as String?,
      homeShortName: json['homeShortName'] as String?,
      awayShortName: json['awayShortName'] as String?,
    );

Map<String, dynamic> _$LiveFixtureMatchToJson(LiveFixtureMatch instance) =>
    <String, dynamic>{
      'matchId': instance.matchId,
      'homeId': instance.homeId,
      'awayId': instance.awayId,
      'homeScore': instance.homeScore,
      'awayScore': instance.awayScore,
      'homeName': instance.homeName,
      'awayName': instance.awayName,
      'matchDateUtc': instance.matchDateUtc,
      'league': instance.league,
      'round': instance.round,
      'statusId': instance.statusId,
      'status': instance.status,
      'homeShortName': instance.homeShortName,
      'awayShortName': instance.awayShortName,
    };

LiveFixturesResponse _$LiveFixturesResponseFromJson(
        Map<String, dynamic> json) =>
    LiveFixturesResponse(
      matches: (json['matches'] as List<dynamic>)
          .map((e) => LiveFixtureMatch.fromJson(e as Map<String, dynamic>))
          .toList(),
    );

Map<String, dynamic> _$LiveFixturesResponseToJson(
        LiveFixturesResponse instance) =>
    <String, dynamic>{
      'matches': instance.matches,
    };
