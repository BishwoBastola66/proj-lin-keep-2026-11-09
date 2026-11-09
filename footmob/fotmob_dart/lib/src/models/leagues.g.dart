// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'leagues.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

LeagueSeasonWinner _$LeagueSeasonWinnerFromJson(Map<String, dynamic> json) =>
    LeagueSeasonWinner(
      id: (json['id'] as num).toInt(),
      name: json['name'] as String,
      winner: json['winner'] as bool?,
    );

Map<String, dynamic> _$LeagueSeasonWinnerToJson(LeagueSeasonWinner instance) =>
    <String, dynamic>{
      'id': instance.id,
      'name': instance.name,
      'winner': instance.winner,
    };

LeagueSeason _$LeagueSeasonFromJson(Map<String, dynamic> json) => LeagueSeason(
      seasonName: json['seasonName'] as String,
      winner: json['winner'] == null
          ? null
          : LeagueSeasonWinner.fromJson(json['winner'] as Map<String, dynamic>),
      loser: json['loser'] == null
          ? null
          : LeagueSeasonWinner.fromJson(json['loser'] as Map<String, dynamic>),
    );

Map<String, dynamic> _$LeagueSeasonToJson(LeagueSeason instance) =>
    <String, dynamic>{
      'seasonName': instance.seasonName,
      'winner': instance.winner,
      'loser': instance.loser,
    };

LeagueOverview _$LeagueOverviewFromJson(Map<String, dynamic> json) =>
    LeagueOverview(
      season: json['season'] as String,
      selectedSeason: json['selectedSeason'] as String,
      hasTotw: json['hasTotw'] as bool?,
      hasOngoingMatch: json['hasOngoingMatch'] as bool?,
      shotMap: json['shotMap'] as bool?,
    );

Map<String, dynamic> _$LeagueOverviewToJson(LeagueOverview instance) =>
    <String, dynamic>{
      'season': instance.season,
      'selectedSeason': instance.selectedSeason,
      'hasTotw': instance.hasTotw,
      'hasOngoingMatch': instance.hasOngoingMatch,
      'shotMap': instance.shotMap,
    };

LeagueStats _$LeagueStatsFromJson(Map<String, dynamic> json) => LeagueStats(
      seasonsWithLinks: (json['seasonsWithLinks'] as List<dynamic>)
          .map((e) => e as String)
          .toList(),
    );

Map<String, dynamic> _$LeagueStatsToJson(LeagueStats instance) =>
    <String, dynamic>{
      'seasonsWithLinks': instance.seasonsWithLinks,
    };

LeagueDetailsResponseDetails _$LeagueDetailsResponseDetailsFromJson(
        Map<String, dynamic> json) =>
    LeagueDetailsResponseDetails(
      id: (json['id'] as num).toInt(),
      type: json['type'] as String,
      name: json['name'] as String,
      selectedSeason: json['selectedSeason'] as String,
      latestSeason: json['latestSeason'] as String,
      shortName: json['shortName'] as String,
      country: json['country'] as String,
    );

Map<String, dynamic> _$LeagueDetailsResponseDetailsToJson(
        LeagueDetailsResponseDetails instance) =>
    <String, dynamic>{
      'id': instance.id,
      'type': instance.type,
      'name': instance.name,
      'selectedSeason': instance.selectedSeason,
      'latestSeason': instance.latestSeason,
      'shortName': instance.shortName,
      'country': instance.country,
    };

LeagueDetailsResponse _$LeagueDetailsResponseFromJson(
        Map<String, dynamic> json) =>
    LeagueDetailsResponse(
      tabs: (json['tabs'] as List<dynamic>).map((e) => e as String).toList(),
      allAvailableSeasons: (json['allAvailableSeasons'] as List<dynamic>)
          .map((e) => e as String)
          .toList(),
      details: LeagueDetailsResponseDetails.fromJson(
          json['details'] as Map<String, dynamic>),
      seostr: json['seostr'] as String,
      overview:
          LeagueOverview.fromJson(json['overview'] as Map<String, dynamic>),
      stats: LeagueStats.fromJson(json['stats'] as Map<String, dynamic>),
      seasons: (json['seasons'] as List<dynamic>?)
          ?.map((e) => LeagueSeason.fromJson(e as Map<String, dynamic>))
          .toList(),
    );

Map<String, dynamic> _$LeagueDetailsResponseToJson(
        LeagueDetailsResponse instance) =>
    <String, dynamic>{
      'tabs': instance.tabs,
      'allAvailableSeasons': instance.allAvailableSeasons,
      'details': instance.details,
      'seostr': instance.seostr,
      'overview': instance.overview,
      'stats': instance.stats,
      'seasons': instance.seasons,
    };
