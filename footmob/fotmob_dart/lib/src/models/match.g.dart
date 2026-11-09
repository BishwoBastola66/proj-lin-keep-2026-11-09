// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'match.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

MatchDataTeam _$MatchDataTeamFromJson(Map<String, dynamic> json) =>
    MatchDataTeam(
      id: (json['id'] as num).toInt(),
      name: json['name'] as String,
      shortName: json['shortName'] as String,
      score: (json['score'] as num).toInt(),
    );

Map<String, dynamic> _$MatchDataTeamToJson(MatchDataTeam instance) =>
    <String, dynamic>{
      'id': instance.id,
      'name': instance.name,
      'shortName': instance.shortName,
      'score': instance.score,
    };

MatchDataStatusHalfs _$MatchDataStatusHalfsFromJson(
        Map<String, dynamic> json) =>
    MatchDataStatusHalfs(
      firstHalfStarted: json['firstHalfStarted'] as String,
      firstHalfEnded: json['firstHalfEnded'] as String?,
      secondHalfStarted: json['secondHalfStarted'] as String,
      secondHalfEnded: json['secondHalfEnded'] as String?,
      firstExtraHalfStarted: json['firstExtraHalfStarted'] as String,
      secondExtraHalfStarted: json['secondExtraHalfStarted'] as String,
      gameEnded: json['gameEnded'] as String?,
    );

Map<String, dynamic> _$MatchDataStatusHalfsToJson(
        MatchDataStatusHalfs instance) =>
    <String, dynamic>{
      'firstHalfStarted': instance.firstHalfStarted,
      'firstHalfEnded': instance.firstHalfEnded,
      'secondHalfStarted': instance.secondHalfStarted,
      'secondHalfEnded': instance.secondHalfEnded,
      'firstExtraHalfStarted': instance.firstExtraHalfStarted,
      'secondExtraHalfStarted': instance.secondExtraHalfStarted,
      'gameEnded': instance.gameEnded,
    };

MatchDataStatusReason _$MatchDataStatusReasonFromJson(
        Map<String, dynamic> json) =>
    MatchDataStatusReason(
      short: json['short'] as String,
      shortKey: json['shortKey'] as String,
      long: json['long'] as String,
      longKey: json['longKey'] as String,
    );

Map<String, dynamic> _$MatchDataStatusReasonToJson(
        MatchDataStatusReason instance) =>
    <String, dynamic>{
      'short': instance.short,
      'shortKey': instance.shortKey,
      'long': instance.long,
      'longKey': instance.longKey,
    };

MatchDataStatus _$MatchDataStatusFromJson(Map<String, dynamic> json) =>
    MatchDataStatus(
      utcTime: json['utcTime'] as String,
      halfs:
          MatchDataStatusHalfs.fromJson(json['halfs'] as Map<String, dynamic>),
      periodLength: (json['periodLength'] as num).toInt(),
      started: json['started'] as bool,
      finished: json['finished'] as bool,
      cancelled: json['cancelled'] as bool,
      awarded: json['awarded'] as bool?,
      scoreStr: json['scoreStr'] as String?,
      reason: json['reason'] == null
          ? null
          : MatchDataStatusReason.fromJson(
              json['reason'] as Map<String, dynamic>),
    );

Map<String, dynamic> _$MatchDataStatusToJson(MatchDataStatus instance) =>
    <String, dynamic>{
      'utcTime': instance.utcTime,
      'halfs': instance.halfs,
      'periodLength': instance.periodLength,
      'started': instance.started,
      'finished': instance.finished,
      'cancelled': instance.cancelled,
      'awarded': instance.awarded,
      'scoreStr': instance.scoreStr,
      'reason': instance.reason,
    };

MatchDataLiveTime _$MatchDataLiveTimeFromJson(Map<String, dynamic> json) =>
    MatchDataLiveTime(
      short: json['short'] as String,
      shortKey: json['shortKey'] as String,
      long: json['long'] as String,
      longKey: json['longKey'] as String,
    );

Map<String, dynamic> _$MatchDataLiveTimeToJson(MatchDataLiveTime instance) =>
    <String, dynamic>{
      'short': instance.short,
      'shortKey': instance.shortKey,
      'long': instance.long,
      'longKey': instance.longKey,
    };

MatchDataStat _$MatchDataStatFromJson(Map<String, dynamic> json) =>
    MatchDataStat(
      title: json['title'] as String,
      localizedTitle: json['localizedTitle'] as String,
      stats: json['stats'] as List<dynamic>,
      highlighted: json['highlighted'] as String?,
      type: json['type'] as String,
      decimals: (json['decimals'] as num?)?.toInt(),
    );

Map<String, dynamic> _$MatchDataStatToJson(MatchDataStat instance) =>
    <String, dynamic>{
      'title': instance.title,
      'localizedTitle': instance.localizedTitle,
      'stats': instance.stats,
      'highlighted': instance.highlighted,
      'type': instance.type,
      'decimals': instance.decimals,
    };

MatchDataTeamColors _$MatchDataTeamColorsFromJson(Map<String, dynamic> json) =>
    MatchDataTeamColors(
      home: json['home'] as String,
      away: json['away'] as String,
    );

Map<String, dynamic> _$MatchDataTeamColorsToJson(
        MatchDataTeamColors instance) =>
    <String, dynamic>{
      'home': instance.home,
      'away': instance.away,
    };

MatchDataTeamColorModes _$MatchDataTeamColorModesFromJson(
        Map<String, dynamic> json) =>
    MatchDataTeamColorModes(
      darkMode: MatchDataTeamColors.fromJson(
          json['darkMode'] as Map<String, dynamic>),
      lightMode: MatchDataTeamColors.fromJson(
          json['lightMode'] as Map<String, dynamic>),
      fontDarkMode: MatchDataTeamColors.fromJson(
          json['fontDarkMode'] as Map<String, dynamic>),
      fontLightMode: MatchDataTeamColors.fromJson(
          json['fontLightMode'] as Map<String, dynamic>),
    );

Map<String, dynamic> _$MatchDataTeamColorModesToJson(
        MatchDataTeamColorModes instance) =>
    <String, dynamic>{
      'darkMode': instance.darkMode,
      'lightMode': instance.lightMode,
      'fontDarkMode': instance.fontDarkMode,
      'fontLightMode': instance.fontLightMode,
    };

MatchDataStats _$MatchDataStatsFromJson(Map<String, dynamic> json) =>
    MatchDataStats(
      stats: (json['stats'] as List<dynamic>)
          .map((e) => MatchDataStat.fromJson(e as Map<String, dynamic>))
          .toList(),
      leagueIds: (json['leagueIds'] as List<dynamic>)
          .map((e) => (e as num).toInt())
          .toList(),
      leagueNames: (json['leagueNames'] as List<dynamic>)
          .map((e) => e as String)
          .toList(),
      teamColors: MatchDataTeamColorModes.fromJson(
          json['teamColors'] as Map<String, dynamic>),
    );

Map<String, dynamic> _$MatchDataStatsToJson(MatchDataStats instance) =>
    <String, dynamic>{
      'stats': instance.stats,
      'leagueIds': instance.leagueIds,
      'leagueNames': instance.leagueNames,
      'teamColors': instance.teamColors,
    };

MatchDataResponse _$MatchDataResponseFromJson(Map<String, dynamic> json) =>
    MatchDataResponse(
      id: (json['id'] as num?)?.toInt(),
      home: json['home'] == null
          ? null
          : MatchDataTeam.fromJson(json['home'] as Map<String, dynamic>),
      away: json['away'] == null
          ? null
          : MatchDataTeam.fromJson(json['away'] as Map<String, dynamic>),
      matchDate: json['matchDate'] as String?,
      homeScore: json['homeScore'] as num?,
      awayScore: json['awayScore'] as num?,
      status: json['status'] == null
          ? null
          : MatchDataStatus.fromJson(json['status'] as Map<String, dynamic>),
      pageUrl: json['pageUrl'] as String?,
      odds: json['odds'],
      liveTime: json['liveTime'] == null
          ? null
          : MatchDataLiveTime.fromJson(
              json['liveTime'] as Map<String, dynamic>),
      startDay: json['startDay'] as String?,
      stats: json['stats'] == null
          ? null
          : MatchDataStats.fromJson(json['stats'] as Map<String, dynamic>),
    );

Map<String, dynamic> _$MatchDataResponseToJson(MatchDataResponse instance) =>
    <String, dynamic>{
      'id': instance.id,
      'home': instance.home,
      'away': instance.away,
      'matchDate': instance.matchDate,
      'homeScore': instance.homeScore,
      'awayScore': instance.awayScore,
      'status': instance.status,
      'pageUrl': instance.pageUrl,
      'odds': instance.odds,
      'liveTime': instance.liveTime,
      'startDay': instance.startDay,
      'stats': instance.stats,
    };
