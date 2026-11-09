import 'package:json_annotation/json_annotation.dart';

part 'match.g.dart';

@JsonSerializable()
class MatchDataTeam {
  final int id;
  final String name;
  final String shortName;
  final int score;

  MatchDataTeam({
    required this.id,
    required this.name,
    required this.shortName,
    required this.score,
  });

  factory MatchDataTeam.fromJson(Map<String, dynamic> json) => _$MatchDataTeamFromJson(json);
  Map<String, dynamic> toJson() => _$MatchDataTeamToJson(this);
}

@JsonSerializable()
class MatchDataStatusHalfs {
  final String firstHalfStarted;
  final String? firstHalfEnded;
  final String secondHalfStarted;
  final String? secondHalfEnded;
  final String firstExtraHalfStarted;
  final String secondExtraHalfStarted;
  final String? gameEnded;

  MatchDataStatusHalfs({
    required this.firstHalfStarted,
    this.firstHalfEnded,
    required this.secondHalfStarted,
    this.secondHalfEnded,
    required this.firstExtraHalfStarted,
    required this.secondExtraHalfStarted,
    this.gameEnded,
  });

  factory MatchDataStatusHalfs.fromJson(Map<String, dynamic> json) => _$MatchDataStatusHalfsFromJson(json);
  Map<String, dynamic> toJson() => _$MatchDataStatusHalfsToJson(this);
}

@JsonSerializable()
class MatchDataStatusReason {
  final String short;
  final String shortKey;
  final String long;
  final String longKey;

  MatchDataStatusReason({
    required this.short,
    required this.shortKey,
    required this.long,
    required this.longKey,
  });

  factory MatchDataStatusReason.fromJson(Map<String, dynamic> json) => _$MatchDataStatusReasonFromJson(json);
  Map<String, dynamic> toJson() => _$MatchDataStatusReasonToJson(this);
}

@JsonSerializable()
class MatchDataStatus {
  final String utcTime;
  final MatchDataStatusHalfs halfs;
  final int periodLength;
  final bool started;
  final bool finished;
  final bool cancelled;
  final bool? awarded;
  final String? scoreStr;
  final MatchDataStatusReason? reason;

  MatchDataStatus({
    required this.utcTime,
    required this.halfs,
    required this.periodLength,
    required this.started,
    required this.finished,
    required this.cancelled,
    this.awarded,
    this.scoreStr,
    this.reason,
  });

  factory MatchDataStatus.fromJson(Map<String, dynamic> json) => _$MatchDataStatusFromJson(json);
  Map<String, dynamic> toJson() => _$MatchDataStatusToJson(this);
}

@JsonSerializable()
class MatchDataLiveTime {
  final String short;
  final String shortKey;
  final String long;
  final String longKey;

  MatchDataLiveTime({
    required this.short,
    required this.shortKey,
    required this.long,
    required this.longKey,
  });

  factory MatchDataLiveTime.fromJson(Map<String, dynamic> json) => _$MatchDataLiveTimeFromJson(json);
  Map<String, dynamic> toJson() => _$MatchDataLiveTimeToJson(this);
}

@JsonSerializable()
class MatchDataStat {
  final String title;
  final String localizedTitle;
  final List<dynamic> stats;
  final String? highlighted;
  final String type;
  final int? decimals;

  MatchDataStat({
    required this.title,
    required this.localizedTitle,
    required this.stats,
    this.highlighted,
    required this.type,
    this.decimals,
  });

  factory MatchDataStat.fromJson(Map<String, dynamic> json) => _$MatchDataStatFromJson(json);
  Map<String, dynamic> toJson() => _$MatchDataStatToJson(this);
}

@JsonSerializable()
class MatchDataTeamColors {
  final String home;
  final String away;

  MatchDataTeamColors({
    required this.home,
    required this.away,
  });

  factory MatchDataTeamColors.fromJson(Map<String, dynamic> json) => _$MatchDataTeamColorsFromJson(json);
  Map<String, dynamic> toJson() => _$MatchDataTeamColorsToJson(this);
}

@JsonSerializable()
class MatchDataTeamColorModes {
  final MatchDataTeamColors darkMode;
  final MatchDataTeamColors lightMode;
  final MatchDataTeamColors fontDarkMode;
  final MatchDataTeamColors fontLightMode;

  MatchDataTeamColorModes({
    required this.darkMode,
    required this.lightMode,
    required this.fontDarkMode,
    required this.fontLightMode,
  });

  factory MatchDataTeamColorModes.fromJson(Map<String, dynamic> json) => _$MatchDataTeamColorModesFromJson(json);
  Map<String, dynamic> toJson() => _$MatchDataTeamColorModesToJson(this);
}

@JsonSerializable()
class MatchDataStats {
  final List<MatchDataStat> stats;
  final List<int> leagueIds;
  final List<String> leagueNames;
  final MatchDataTeamColorModes teamColors;

  MatchDataStats({
    required this.stats,
    required this.leagueIds,
    required this.leagueNames,
    required this.teamColors,
  });

  factory MatchDataStats.fromJson(Map<String, dynamic> json) => _$MatchDataStatsFromJson(json);
  Map<String, dynamic> toJson() => _$MatchDataStatsToJson(this);
}

@JsonSerializable()
class MatchDataResponse {
  final int? id;
  final MatchDataTeam? home;
  final MatchDataTeam? away;
  final String? matchDate;
  final num? homeScore;
  final num? awayScore;
  final MatchDataStatus? status;
  final String? pageUrl;
  final dynamic odds;
  final MatchDataLiveTime? liveTime;
  final String? startDay;
  final MatchDataStats? stats;

  MatchDataResponse({
    this.id,
    this.home,
    this.away,
    this.matchDate,
    this.homeScore,
    this.awayScore,
    this.status,
    this.pageUrl,
    this.odds,
    this.liveTime,
    this.startDay,
    this.stats,
  });

  factory MatchDataResponse.fromJson(Map<String, dynamic> json) => _$MatchDataResponseFromJson(json);
  Map<String, dynamic> toJson() => _$MatchDataResponseToJson(this);
}
