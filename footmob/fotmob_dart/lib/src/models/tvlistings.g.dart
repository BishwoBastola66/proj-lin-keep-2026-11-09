// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'tvlistings.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

TvListingStation _$TvListingStationFromJson(Map<String, dynamic> json) =>
    TvListingStation(
      callSign: json['callSign'] as String?,
      stationId: json['stationId'] as String?,
      affiliateId: json['affiliateId'] as String?,
      affiliateCallSign: json['affiliateCallSign'] as String?,
      name: json['name'] as String?,
      type: json['type'] as String?,
      blockedCountryCodes: (json['blockedCountryCodes'] as List<dynamic>?)
          ?.map((e) => e as String)
          .toList(),
    );

Map<String, dynamic> _$TvListingStationToJson(TvListingStation instance) =>
    <String, dynamic>{
      'callSign': instance.callSign,
      'stationId': instance.stationId,
      'affiliateId': instance.affiliateId,
      'affiliateCallSign': instance.affiliateCallSign,
      'name': instance.name,
      'type': instance.type,
      'blockedCountryCodes': instance.blockedCountryCodes,
    };

TvListingTeam _$TvListingTeamFromJson(Map<String, dynamic> json) =>
    TvListingTeam(
      name: json['name'] as String?,
      isHome: json['isHome'] as bool?,
      teamBrandId: json['teamBrandId'] as String?,
    );

Map<String, dynamic> _$TvListingTeamToJson(TvListingTeam instance) =>
    <String, dynamic>{
      'name': instance.name,
      'isHome': instance.isHome,
      'teamBrandId': instance.teamBrandId,
    };

TvListingProgram _$TvListingProgramFromJson(Map<String, dynamic> json) =>
    TvListingProgram(
      rootId: json['rootId'] as String?,
      teams: (json['teams'] as List<dynamic>?)
          ?.map((e) => TvListingTeam.fromJson(e as Map<String, dynamic>))
          .toList(),
    );

Map<String, dynamic> _$TvListingProgramToJson(TvListingProgram instance) =>
    <String, dynamic>{
      'rootId': instance.rootId,
      'teams': instance.teams,
    };

TvListingAffiliate _$TvListingAffiliateFromJson(Map<String, dynamic> json) =>
    TvListingAffiliate(
      langCode: json['langCode'] as String?,
      title: json['title'] as String?,
      url: json['url'] as String?,
    );

Map<String, dynamic> _$TvListingAffiliateToJson(TvListingAffiliate instance) =>
    <String, dynamic>{
      'langCode': instance.langCode,
      'title': instance.title,
      'url': instance.url,
    };

TvListingItem _$TvListingItemFromJson(Map<String, dynamic> json) =>
    TvListingItem(
      startTime: json['startTime'] as String?,
      endTime: json['endTime'] as String?,
      qualifiers: (json['qualifiers'] as List<dynamic>?)
          ?.map((e) => e as String)
          .toList(),
      station: json['station'] == null
          ? null
          : TvListingStation.fromJson(json['station'] as Map<String, dynamic>),
      stationId: json['stationId'] as String?,
      matchId: (json['matchId'] as num?)?.toInt(),
      leagueId: (json['leagueId'] as num?)?.toInt(),
      parentLeagueId: (json['parentLeagueId'] as num?)?.toInt(),
      program: json['program'] == null
          ? null
          : TvListingProgram.fromJson(json['program'] as Map<String, dynamic>),
      bet365MatchId: (json['bet365MatchId'] as num?)?.toInt(),
      externalId: json['externalId'] as String?,
      affiliates: (json['affiliates'] as List<dynamic>?)
          ?.map((e) => TvListingAffiliate.fromJson(e as Map<String, dynamic>))
          .toList(),
      tags: (json['tags'] as List<dynamic>?)?.map((e) => e as String).toList(),
    );

Map<String, dynamic> _$TvListingItemToJson(TvListingItem instance) =>
    <String, dynamic>{
      'startTime': instance.startTime,
      'endTime': instance.endTime,
      'qualifiers': instance.qualifiers,
      'station': instance.station,
      'stationId': instance.stationId,
      'matchId': instance.matchId,
      'leagueId': instance.leagueId,
      'parentLeagueId': instance.parentLeagueId,
      'program': instance.program,
      'bet365MatchId': instance.bet365MatchId,
      'externalId': instance.externalId,
      'affiliates': instance.affiliates,
      'tags': instance.tags,
    };
