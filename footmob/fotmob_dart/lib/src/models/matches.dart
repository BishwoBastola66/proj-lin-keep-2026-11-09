import 'package:json_annotation/json_annotation.dart';

part 'matches.g.dart';

@JsonSerializable()
class MatchTeam {
  final int id;
  final int score;
  final String name;
  final String longName;

  MatchTeam({
    required this.id,
    required this.score,
    required this.name,
    required this.longName,
  });

  factory MatchTeam.fromJson(Map<String, dynamic> json) => _$MatchTeamFromJson(json);
  Map<String, dynamic> toJson() => _$MatchTeamToJson(this);
}

@JsonSerializable()
class MatchStatusReason {
  final String short;
  final String shortKey;
  final String long;
  final String longKey;

  MatchStatusReason({
    required this.short,
    required this.shortKey,
    required this.long,
    required this.longKey,
  });

  factory MatchStatusReason.fromJson(Map<String, dynamic> json) => _$MatchStatusReasonFromJson(json);
  Map<String, dynamic> toJson() => _$MatchStatusReasonToJson(this);
}

@JsonSerializable()
class MatchStatus {
  final String utcTime;
  final bool finished;
  final bool started;
  final bool cancelled;
  final String? scoreStr;
  final MatchStatusReason? reason;

  MatchStatus({
    required this.utcTime,
    required this.finished,
    required this.started,
    required this.cancelled,
    this.scoreStr,
    this.reason,
  });

  factory MatchStatus.fromJson(Map<String, dynamic> json) => _$MatchStatusFromJson(json);
  Map<String, dynamic> toJson() => _$MatchStatusToJson(this);
}

@JsonSerializable()
class MatchItem {
  final int id;
  final int leagueId;
  final String time;
  final MatchTeam home;
  final MatchTeam away;
  final int statusId;
  final String tournamentStage;
  final MatchStatus status;
  final int timeTS;

  MatchItem({
    required this.id,
    required this.leagueId,
    required this.time,
    required this.home,
    required this.away,
    required this.statusId,
    required this.tournamentStage,
    required this.status,
    required this.timeTS,
  });

  factory MatchItem.fromJson(Map<String, dynamic> json) => _$MatchItemFromJson(json);
  Map<String, dynamic> toJson() => _$MatchItemToJson(this);
}

@JsonSerializable()
class MatchesLeague {
  final String ccode;
  final int id;
  final int primaryId;
  final String name;
  final List<MatchItem> matches;

  MatchesLeague({
    required this.ccode,
    required this.id,
    required this.primaryId,
    required this.name,
    required this.matches,
  });

  factory MatchesLeague.fromJson(Map<String, dynamic> json) => _$MatchesLeagueFromJson(json);
  Map<String, dynamic> toJson() => _$MatchesLeagueToJson(this);
}

@JsonSerializable()
class MatchesResponse {
  final List<MatchesLeague> leagues;

  MatchesResponse({required this.leagues});

  factory MatchesResponse.fromJson(Map<String, dynamic> json) => _$MatchesResponseFromJson(json);
  Map<String, dynamic> toJson() => _$MatchesResponseToJson(this);
}
