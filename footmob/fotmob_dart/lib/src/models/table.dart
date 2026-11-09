import 'package:json_annotation/json_annotation.dart';

part 'table.g.dart';

@JsonSerializable()
class TableLegend {
  final String title;
  final String tKey;
  final String color;
  final List<int> indices;

  TableLegend({
    required this.title,
    required this.tKey,
    required this.color,
    required this.indices,
  });

  factory TableLegend.fromJson(Map<String, dynamic> json) => _$TableLegendFromJson(json);
  Map<String, dynamic> toJson() => _$TableLegendToJson(this);
}

@JsonSerializable()
class TableOngoingMatchTeam {
  final int id;
  final String name;
  final int score;

  TableOngoingMatchTeam({
    required this.id,
    required this.name,
    required this.score,
  });

  factory TableOngoingMatchTeam.fromJson(Map<String, dynamic> json) => _$TableOngoingMatchTeamFromJson(json);
  Map<String, dynamic> toJson() => _$TableOngoingMatchTeamToJson(this);
}

@JsonSerializable()
class TableOngoingMatchStatus {
  final String utcTime;
  final bool started;
  final bool cancelled;
  final bool finished;

  TableOngoingMatchStatus({
    required this.utcTime,
    required this.started,
    required this.cancelled,
    required this.finished,
  });

  factory TableOngoingMatchStatus.fromJson(Map<String, dynamic> json) => _$TableOngoingMatchStatusFromJson(json);
  Map<String, dynamic> toJson() => _$TableOngoingMatchStatusToJson(this);
}

@JsonSerializable()
class TableOngoingMatch {
  final TableOngoingMatchTeam? home;
  final TableOngoingMatchTeam? away;
  final TableOngoingMatchStatus? status;
  final int? matchId;

  TableOngoingMatch({
    this.home,
    this.away,
    this.status,
    this.matchId,
  });

  factory TableOngoingMatch.fromJson(Map<String, dynamic> json) => _$TableOngoingMatchFromJson(json);
  Map<String, dynamic> toJson() => _$TableOngoingMatchToJson(this);
}

@JsonSerializable()
class TableTeamData {
  final String? name;
  final String? shortName;
  final int? id;
  final String? pageUrl;
  final bool? featuredInMatch;
  final int? deduction;
  final List<TableOngoingMatch>? ongoing;
  final int? played;
  final int? wins;
  final int? draws;
  final int? losses;
  final String? scoresStr;
  final int? goalConDiff;
  final int? goalsScored;
  final int? pts;
  final int? idx;
  final String? qualColor;

  TableTeamData({
    this.name,
    this.shortName,
    this.id,
    this.pageUrl,
    this.featuredInMatch,
    this.deduction,
    this.ongoing,
    this.played,
    this.wins,
    this.draws,
    this.losses,
    this.scoresStr,
    this.goalConDiff,
    this.goalsScored,
    this.pts,
    this.idx,
    this.qualColor,
  });

  factory TableTeamData.fromJson(Map<String, dynamic> json) => _$TableTeamDataFromJson(json);
  Map<String, dynamic> toJson() => _$TableTeamDataToJson(this);
}

@JsonSerializable()
class TableData {
  final List<TableTeamData> all;
  final List<TableTeamData> home;
  final List<TableTeamData> away;

  TableData({
    required this.all,
    required this.home,
    required this.away,
  });

  factory TableData.fromJson(Map<String, dynamic> json) => _$TableDataFromJson(json);
  Map<String, dynamic> toJson() => _$TableDataToJson(this);
}

@JsonSerializable()
class LeagueTableResponse {
  final String? ccode;
  final int? leagueId;
  final String? pageUrl;
  final String? leagueName;
  final List<TableLegend>? legend;
  final List<TableOngoingMatch>? ongoing;
  final TableData? table;
  final List<String>? tableFilterTypes;
  final bool? composite;
  final String? selectedSeason;
  final String? isCurrentSeason;

  LeagueTableResponse({
    this.ccode,
    this.leagueId,
    this.pageUrl,
    this.leagueName,
    this.legend,
    this.ongoing,
    this.table,
    this.tableFilterTypes,
    this.composite,
    this.selectedSeason,
    this.isCurrentSeason,
  });

  factory LeagueTableResponse.fromJson(Map<String, dynamic> json) => _$LeagueTableResponseFromJson(json);
  Map<String, dynamic> toJson() => _$LeagueTableResponseToJson(this);
}
