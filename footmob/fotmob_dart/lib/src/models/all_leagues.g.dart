// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'all_leagues.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

BaseLeague _$BaseLeagueFromJson(Map<String, dynamic> json) => BaseLeague(
      id: (json['id'] as num).toInt(),
      name: json['name'] as String,
      localizedName: json['localizedName'] as String,
      pageUrl: json['pageUrl'] as String,
      ccode: json['ccode'] as String,
    );

Map<String, dynamic> _$BaseLeagueToJson(BaseLeague instance) =>
    <String, dynamic>{
      'id': instance.id,
      'name': instance.name,
      'localizedName': instance.localizedName,
      'pageUrl': instance.pageUrl,
      'ccode': instance.ccode,
    };

CountryLeagueGroup _$CountryLeagueGroupFromJson(Map<String, dynamic> json) =>
    CountryLeagueGroup(
      ccode: json['ccode'] as String,
      name: json['name'] as String,
      localizedName: json['localizedName'] as String,
      leagues: (json['leagues'] as List<dynamic>)
          .map((e) => BaseLeague.fromJson(e as Map<String, dynamic>))
          .toList(),
    );

Map<String, dynamic> _$CountryLeagueGroupToJson(CountryLeagueGroup instance) =>
    <String, dynamic>{
      'ccode': instance.ccode,
      'name': instance.name,
      'localizedName': instance.localizedName,
      'leagues': instance.leagues,
    };

AllLeaguesResponse _$AllLeaguesResponseFromJson(Map<String, dynamic> json) =>
    AllLeaguesResponse(
      popular: (json['popular'] as List<dynamic>)
          .map((e) => BaseLeague.fromJson(e as Map<String, dynamic>))
          .toList(),
      international: (json['international'] as List<dynamic>)
          .map((e) => CountryLeagueGroup.fromJson(e as Map<String, dynamic>))
          .toList(),
      countries: (json['countries'] as List<dynamic>)
          .map((e) => CountryLeagueGroup.fromJson(e as Map<String, dynamic>))
          .toList(),
    );

Map<String, dynamic> _$AllLeaguesResponseToJson(AllLeaguesResponse instance) =>
    <String, dynamic>{
      'popular': instance.popular,
      'international': instance.international,
      'countries': instance.countries,
    };
