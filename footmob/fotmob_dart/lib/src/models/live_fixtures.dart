import 'package:json_annotation/json_annotation.dart';

part 'live_fixtures.g.dart';

@JsonSerializable()
class LiveFixtureLeague {
  final int? primaryLeagueId;
  final int? leagueId;
  final String? leagueName;
  final int? parentLeagueId;
  final int? stageId;
  final int? tournamentId;
  final bool? isCup;
  final String? countryCode;

  LiveFixtureLeague({
    this.primaryLeagueId,
    this.leagueId,
    this.leagueName,
    this.parentLeagueId,
    this.stageId,
    this.tournamentId,
    this.isCup,
    this.countryCode,
  });

  factory LiveFixtureLeague.fromJson(Map<String, dynamic> json) => _$LiveFixtureLeagueFromJson(json);
  Map<String, dynamic> toJson() => _$LiveFixtureLeagueToJson(this);
}

@JsonSerializable()
class LiveFixtureMatch {
  final int? matchId;
  final int? homeId;
  final int? awayId;
  final int? homeScore;
  final int? awayScore;
  final String? homeName;
  final String? awayName;
  final String? matchDateUtc;
  final LiveFixtureLeague? league;
  final String? round;
  final int? statusId;
  final String? status;
  final String? homeShortName;
  final String? awayShortName;

  LiveFixtureMatch({
    this.matchId,
    this.homeId,
    this.awayId,
    this.homeScore,
    this.awayScore,
    this.homeName,
    this.awayName,
    this.matchDateUtc,
    this.league,
    this.round,
    this.statusId,
    this.status,
    this.homeShortName,
    this.awayShortName,
  });

  factory LiveFixtureMatch.fromJson(Map<String, dynamic> json) => _$LiveFixtureMatchFromJson(json);
  Map<String, dynamic> toJson() => _$LiveFixtureMatchToJson(this);
}

@JsonSerializable()
class LiveFixturesResponse {
  final List<LiveFixtureMatch> matches;

  LiveFixturesResponse({required this.matches});

  factory LiveFixturesResponse.fromJson(Map<String, dynamic> json) => _$LiveFixturesResponseFromJson(json);
  Map<String, dynamic> toJson() => _$LiveFixturesResponseToJson(this);
}
