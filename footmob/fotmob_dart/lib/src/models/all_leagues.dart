import 'package:json_annotation/json_annotation.dart';

part 'all_leagues.g.dart';

@JsonSerializable()
class BaseLeague {
  final int id;
  final String name;
  final String localizedName;
  final String pageUrl;
  final String ccode;

  BaseLeague({
    required this.id,
    required this.name,
    required this.localizedName,
    required this.pageUrl,
    required this.ccode,
  });

  factory BaseLeague.fromJson(Map<String, dynamic> json) => _$BaseLeagueFromJson(json);
  Map<String, dynamic> toJson() => _$BaseLeagueToJson(this);
}

@JsonSerializable()
class CountryLeagueGroup {
  final String ccode;
  final String name;
  final String localizedName;
  final List<BaseLeague> leagues;

  CountryLeagueGroup({
    required this.ccode,
    required this.name,
    required this.localizedName,
    required this.leagues,
  });

  factory CountryLeagueGroup.fromJson(Map<String, dynamic> json) => _$CountryLeagueGroupFromJson(json);
  Map<String, dynamic> toJson() => _$CountryLeagueGroupToJson(this);
}

@JsonSerializable()
class AllLeaguesResponse {
  final List<BaseLeague> popular;
  final List<CountryLeagueGroup> international;
  final List<CountryLeagueGroup> countries;

  AllLeaguesResponse({
    required this.popular,
    required this.international,
    required this.countries,
  });

  factory AllLeaguesResponse.fromJson(Map<String, dynamic> json) => _$AllLeaguesResponseFromJson(json);
  Map<String, dynamic> toJson() => _$AllLeaguesResponseToJson(this);
}
