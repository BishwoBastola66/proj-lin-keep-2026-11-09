// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'matches.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

MatchTeam _$MatchTeamFromJson(Map<String, dynamic> json) => MatchTeam(
      id: (json['id'] as num).toInt(),
      score: (json['score'] as num).toInt(),
      name: json['name'] as String,
      longName: json['longName'] as String,
    );

Map<String, dynamic> _$MatchTeamToJson(MatchTeam instance) => <String, dynamic>{
      'id': instance.id,
      'score': instance.score,
      'name': instance.name,
      'longName': instance.longName,
    };

MatchStatusReason _$MatchStatusReasonFromJson(Map<String, dynamic> json) =>
    MatchStatusReason(
      short: json['short'] as String,
      shortKey: json['shortKey'] as String,
      long: json['long'] as String,
      longKey: json['longKey'] as String,
    );

Map<String, dynamic> _$MatchStatusReasonToJson(MatchStatusReason instance) =>
    <String, dynamic>{
      'short': instance.short,
      'shortKey': instance.shortKey,
      'long': instance.long,
      'longKey': instance.longKey,
    };

MatchStatus _$MatchStatusFromJson(Map<String, dynamic> json) => MatchStatus(
      utcTime: json['utcTime'] as String,
      finished: json['finished'] as bool,
      started: json['started'] as bool,
      cancelled: json['cancelled'] as bool,
      scoreStr: json['scoreStr'] as String?,
      reason: json['reason'] == null
          ? null
          : MatchStatusReason.fromJson(json['reason'] as Map<String, dynamic>),
    );

Map<String, dynamic> _$MatchStatusToJson(MatchStatus instance) =>
    <String, dynamic>{
      'utcTime': instance.utcTime,
      'finished': instance.finished,
      'started': instance.started,
      'cancelled': instance.cancelled,
      'scoreStr': instance.scoreStr,
      'reason': instance.reason,
    };

MatchItem _$MatchItemFromJson(Map<String, dynamic> json) => MatchItem(
      id: (json['id'] as num).toInt(),
      leagueId: (json['leagueId'] as num).toInt(),
      time: json['time'] as String,
      home: MatchTeam.fromJson(json['home'] as Map<String, dynamic>),
      away: MatchTeam.fromJson(json['away'] as Map<String, dynamic>),
      statusId: (json['statusId'] as num).toInt(),
      tournamentStage: json['tournamentStage'] as String,
      status: MatchStatus.fromJson(json['status'] as Map<String, dynamic>),
      timeTS: (json['timeTS'] as num).toInt(),
    );

Map<String, dynamic> _$MatchItemToJson(MatchItem instance) => <String, dynamic>{
      'id': instance.id,
      'leagueId': instance.leagueId,
      'time': instance.time,
      'home': instance.home,
      'away': instance.away,
      'statusId': instance.statusId,
      'tournamentStage': instance.tournamentStage,
      'status': instance.status,
      'timeTS': instance.timeTS,
    };

MatchesLeague _$MatchesLeagueFromJson(Map<String, dynamic> json) =>
    MatchesLeague(
      ccode: json['ccode'] as String,
      id: (json['id'] as num).toInt(),
      primaryId: (json['primaryId'] as num).toInt(),
      name: json['name'] as String,
      matches: (json['matches'] as List<dynamic>)
          .map((e) => MatchItem.fromJson(e as Map<String, dynamic>))
          .toList(),
    );

Map<String, dynamic> _$MatchesLeagueToJson(MatchesLeague instance) =>
    <String, dynamic>{
      'ccode': instance.ccode,
      'id': instance.id,
      'primaryId': instance.primaryId,
      'name': instance.name,
      'matches': instance.matches,
    };

MatchesResponse _$MatchesResponseFromJson(Map<String, dynamic> json) =>
    MatchesResponse(
      leagues: (json['leagues'] as List<dynamic>)
          .map((e) => MatchesLeague.fromJson(e as Map<String, dynamic>))
          .toList(),
    );

Map<String, dynamic> _$MatchesResponseToJson(MatchesResponse instance) =>
    <String, dynamic>{
      'leagues': instance.leagues,
    };
