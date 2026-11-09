// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'table.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

TableLegend _$TableLegendFromJson(Map<String, dynamic> json) => TableLegend(
      title: json['title'] as String,
      tKey: json['tKey'] as String,
      color: json['color'] as String,
      indices: (json['indices'] as List<dynamic>)
          .map((e) => (e as num).toInt())
          .toList(),
    );

Map<String, dynamic> _$TableLegendToJson(TableLegend instance) =>
    <String, dynamic>{
      'title': instance.title,
      'tKey': instance.tKey,
      'color': instance.color,
      'indices': instance.indices,
    };

TableOngoingMatchTeam _$TableOngoingMatchTeamFromJson(
        Map<String, dynamic> json) =>
    TableOngoingMatchTeam(
      id: (json['id'] as num).toInt(),
      name: json['name'] as String,
      score: (json['score'] as num).toInt(),
    );

Map<String, dynamic> _$TableOngoingMatchTeamToJson(
        TableOngoingMatchTeam instance) =>
    <String, dynamic>{
      'id': instance.id,
      'name': instance.name,
      'score': instance.score,
    };

TableOngoingMatchStatus _$TableOngoingMatchStatusFromJson(
        Map<String, dynamic> json) =>
    TableOngoingMatchStatus(
      utcTime: json['utcTime'] as String,
      started: json['started'] as bool,
      cancelled: json['cancelled'] as bool,
      finished: json['finished'] as bool,
    );

Map<String, dynamic> _$TableOngoingMatchStatusToJson(
        TableOngoingMatchStatus instance) =>
    <String, dynamic>{
      'utcTime': instance.utcTime,
      'started': instance.started,
      'cancelled': instance.cancelled,
      'finished': instance.finished,
    };

TableOngoingMatch _$TableOngoingMatchFromJson(Map<String, dynamic> json) =>
    TableOngoingMatch(
      home: json['home'] == null
          ? null
          : TableOngoingMatchTeam.fromJson(
              json['home'] as Map<String, dynamic>),
      away: json['away'] == null
          ? null
          : TableOngoingMatchTeam.fromJson(
              json['away'] as Map<String, dynamic>),
      status: json['status'] == null
          ? null
          : TableOngoingMatchStatus.fromJson(
              json['status'] as Map<String, dynamic>),
      matchId: (json['matchId'] as num?)?.toInt(),
    );

Map<String, dynamic> _$TableOngoingMatchToJson(TableOngoingMatch instance) =>
    <String, dynamic>{
      'home': instance.home,
      'away': instance.away,
      'status': instance.status,
      'matchId': instance.matchId,
    };

TableTeamData _$TableTeamDataFromJson(Map<String, dynamic> json) =>
    TableTeamData(
      name: json['name'] as String?,
      shortName: json['shortName'] as String?,
      id: (json['id'] as num?)?.toInt(),
      pageUrl: json['pageUrl'] as String?,
      featuredInMatch: json['featuredInMatch'] as bool?,
      deduction: (json['deduction'] as num?)?.toInt(),
      ongoing: (json['ongoing'] as List<dynamic>?)
          ?.map((e) => TableOngoingMatch.fromJson(e as Map<String, dynamic>))
          .toList(),
      played: (json['played'] as num?)?.toInt(),
      wins: (json['wins'] as num?)?.toInt(),
      draws: (json['draws'] as num?)?.toInt(),
      losses: (json['losses'] as num?)?.toInt(),
      scoresStr: json['scoresStr'] as String?,
      goalConDiff: (json['goalConDiff'] as num?)?.toInt(),
      goalsScored: (json['goalsScored'] as num?)?.toInt(),
      pts: (json['pts'] as num?)?.toInt(),
      idx: (json['idx'] as num?)?.toInt(),
      qualColor: json['qualColor'] as String?,
    );

Map<String, dynamic> _$TableTeamDataToJson(TableTeamData instance) =>
    <String, dynamic>{
      'name': instance.name,
      'shortName': instance.shortName,
      'id': instance.id,
      'pageUrl': instance.pageUrl,
      'featuredInMatch': instance.featuredInMatch,
      'deduction': instance.deduction,
      'ongoing': instance.ongoing,
      'played': instance.played,
      'wins': instance.wins,
      'draws': instance.draws,
      'losses': instance.losses,
      'scoresStr': instance.scoresStr,
      'goalConDiff': instance.goalConDiff,
      'goalsScored': instance.goalsScored,
      'pts': instance.pts,
      'idx': instance.idx,
      'qualColor': instance.qualColor,
    };

TableData _$TableDataFromJson(Map<String, dynamic> json) => TableData(
      all: (json['all'] as List<dynamic>)
          .map((e) => TableTeamData.fromJson(e as Map<String, dynamic>))
          .toList(),
      home: (json['home'] as List<dynamic>)
          .map((e) => TableTeamData.fromJson(e as Map<String, dynamic>))
          .toList(),
      away: (json['away'] as List<dynamic>)
          .map((e) => TableTeamData.fromJson(e as Map<String, dynamic>))
          .toList(),
    );

Map<String, dynamic> _$TableDataToJson(TableData instance) => <String, dynamic>{
      'all': instance.all,
      'home': instance.home,
      'away': instance.away,
    };

LeagueTableResponse _$LeagueTableResponseFromJson(Map<String, dynamic> json) =>
    LeagueTableResponse(
      ccode: json['ccode'] as String?,
      leagueId: (json['leagueId'] as num?)?.toInt(),
      pageUrl: json['pageUrl'] as String?,
      leagueName: json['leagueName'] as String?,
      legend: (json['legend'] as List<dynamic>?)
          ?.map((e) => TableLegend.fromJson(e as Map<String, dynamic>))
          .toList(),
      ongoing: (json['ongoing'] as List<dynamic>?)
          ?.map((e) => TableOngoingMatch.fromJson(e as Map<String, dynamic>))
          .toList(),
      table: json['table'] == null
          ? null
          : TableData.fromJson(json['table'] as Map<String, dynamic>),
      tableFilterTypes: (json['tableFilterTypes'] as List<dynamic>?)
          ?.map((e) => e as String)
          .toList(),
      composite: json['composite'] as bool?,
      selectedSeason: json['selectedSeason'] as String?,
      isCurrentSeason: json['isCurrentSeason'] as String?,
    );

Map<String, dynamic> _$LeagueTableResponseToJson(
        LeagueTableResponse instance) =>
    <String, dynamic>{
      'ccode': instance.ccode,
      'leagueId': instance.leagueId,
      'pageUrl': instance.pageUrl,
      'leagueName': instance.leagueName,
      'legend': instance.legend,
      'ongoing': instance.ongoing,
      'table': instance.table,
      'tableFilterTypes': instance.tableFilterTypes,
      'composite': instance.composite,
      'selectedSeason': instance.selectedSeason,
      'isCurrentSeason': instance.isCurrentSeason,
    };
