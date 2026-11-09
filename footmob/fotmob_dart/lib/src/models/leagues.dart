import 'package:json_annotation/json_annotation.dart';

part 'leagues.g.dart';

@JsonSerializable()
class LeagueSeasonWinner {
  final int id;
  final String name;
  final bool? winner;

  LeagueSeasonWinner({
    required this.id,
    required this.name,
    this.winner,
  });

  factory LeagueSeasonWinner.fromJson(Map<String, dynamic> json) => _$LeagueSeasonWinnerFromJson(json);
  Map<String, dynamic> toJson() => _$LeagueSeasonWinnerToJson(this);
}

@JsonSerializable()
class LeagueSeason {
  final String seasonName;
  final LeagueSeasonWinner? winner;
  final LeagueSeasonWinner? loser;

  LeagueSeason({
    required this.seasonName,
    this.winner,
    this.loser,
  });

  factory LeagueSeason.fromJson(Map<String, dynamic> json) => _$LeagueSeasonFromJson(json);
  Map<String, dynamic> toJson() => _$LeagueSeasonToJson(this);
}

@JsonSerializable()
class LeagueOverview {
  final String season;
  final String selectedSeason;
  final bool? hasTotw;
  final bool? hasOngoingMatch;
  final bool? shotMap;
  // Deeply nested dynamic data omitted for simplicity based on TS 'any' types.

  LeagueOverview({
    required this.season,
    required this.selectedSeason,
    this.hasTotw,
    this.hasOngoingMatch,
    this.shotMap,
  });

  factory LeagueOverview.fromJson(Map<String, dynamic> json) => _$LeagueOverviewFromJson(json);
  Map<String, dynamic> toJson() => _$LeagueOverviewToJson(this);
}

@JsonSerializable()
class LeagueStats {
  final List<String> seasonsWithLinks;
  // nested data omitted

  LeagueStats({
    required this.seasonsWithLinks,
  });

  factory LeagueStats.fromJson(Map<String, dynamic> json) => _$LeagueStatsFromJson(json);
  Map<String, dynamic> toJson() => _$LeagueStatsToJson(this);
}

@JsonSerializable()
class LeagueDetailsResponseDetails {
  final int id;
  final String type;
  final String name;
  final String selectedSeason;
  final String latestSeason;
  final String shortName;
  final String country;

  LeagueDetailsResponseDetails({
    required this.id,
    required this.type,
    required this.name,
    required this.selectedSeason,
    required this.latestSeason,
    required this.shortName,
    required this.country,
  });

  factory LeagueDetailsResponseDetails.fromJson(Map<String, dynamic> json) => _$LeagueDetailsResponseDetailsFromJson(json);
  Map<String, dynamic> toJson() => _$LeagueDetailsResponseDetailsToJson(this);
}

@JsonSerializable()
class LeagueDetailsResponse {
  final List<String> tabs;
  final List<String> allAvailableSeasons;
  final LeagueDetailsResponseDetails details;
  final String seostr;
  final LeagueOverview overview;
  final LeagueStats stats;
  final List<LeagueSeason>? seasons;

  LeagueDetailsResponse({
    required this.tabs,
    required this.allAvailableSeasons,
    required this.details,
    required this.seostr,
    required this.overview,
    required this.stats,
    this.seasons,
  });

  factory LeagueDetailsResponse.fromJson(Map<String, dynamic> json) => _$LeagueDetailsResponseFromJson(json);
  Map<String, dynamic> toJson() => _$LeagueDetailsResponseToJson(this);
}
