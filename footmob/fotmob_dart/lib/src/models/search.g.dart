// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'search.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

SearchStatusReason _$SearchStatusReasonFromJson(Map<String, dynamic> json) =>
    SearchStatusReason(
      short: json['short'] as String,
      shortKey: json['shortKey'] as String,
      long: json['long'] as String,
      longKey: json['longKey'] as String,
    );

Map<String, dynamic> _$SearchStatusReasonToJson(SearchStatusReason instance) =>
    <String, dynamic>{
      'short': instance.short,
      'shortKey': instance.shortKey,
      'long': instance.long,
      'longKey': instance.longKey,
    };

SearchStatus _$SearchStatusFromJson(Map<String, dynamic> json) => SearchStatus(
      utcTime: json['utcTime'] as String,
      finished: json['finished'] as bool,
      started: json['started'] as bool,
      cancelled: json['cancelled'] as bool,
      awarded: json['awarded'] as bool,
      scoreStr: json['scoreStr'] as String,
      reason:
          SearchStatusReason.fromJson(json['reason'] as Map<String, dynamic>),
    );

Map<String, dynamic> _$SearchStatusToJson(SearchStatus instance) =>
    <String, dynamic>{
      'utcTime': instance.utcTime,
      'finished': instance.finished,
      'started': instance.started,
      'cancelled': instance.cancelled,
      'awarded': instance.awarded,
      'scoreStr': instance.scoreStr,
      'reason': instance.reason,
    };

SearchSuggestion _$SearchSuggestionFromJson(Map<String, dynamic> json) =>
    SearchSuggestion(
      type: json['type'] as String?,
      id: json['id'],
      score: (json['score'] as num?)?.toDouble(),
      name: json['name'] as String?,
      isCoach: json['isCoach'] as bool?,
      teamId: (json['teamId'] as num?)?.toInt(),
      teamName: json['teamName'] as String?,
      leagueId: (json['leagueId'] as num?)?.toInt(),
      leagueName: json['leagueName'] as String?,
      countryCode: json['countryCode'] as String?,
      matchDate: json['matchDate'] as String?,
      status: json['status'] == null
          ? null
          : SearchStatus.fromJson(json['status'] as Map<String, dynamic>),
      homeTeamId: json['homeTeamId'] as String?,
      homeTeamName: json['homeTeamName'] as String?,
      homeTeamScore: (json['homeTeamScore'] as num?)?.toInt(),
      awayTeamId: json['awayTeamId'] as String?,
      awayTeamName: json['awayTeamName'] as String?,
      awayTeamScore: (json['awayTeamScore'] as num?)?.toInt(),
    );

Map<String, dynamic> _$SearchSuggestionToJson(SearchSuggestion instance) =>
    <String, dynamic>{
      'type': instance.type,
      'id': instance.id,
      'score': instance.score,
      'name': instance.name,
      'isCoach': instance.isCoach,
      'teamId': instance.teamId,
      'teamName': instance.teamName,
      'leagueId': instance.leagueId,
      'leagueName': instance.leagueName,
      'countryCode': instance.countryCode,
      'matchDate': instance.matchDate,
      'status': instance.status,
      'homeTeamId': instance.homeTeamId,
      'homeTeamName': instance.homeTeamName,
      'homeTeamScore': instance.homeTeamScore,
      'awayTeamId': instance.awayTeamId,
      'awayTeamName': instance.awayTeamName,
      'awayTeamScore': instance.awayTeamScore,
    };

SearchCategoryTitle _$SearchCategoryTitleFromJson(Map<String, dynamic> json) =>
    SearchCategoryTitle(
      key: json['key'] as String?,
      value: json['value'] as String?,
    );

Map<String, dynamic> _$SearchCategoryTitleToJson(
        SearchCategoryTitle instance) =>
    <String, dynamic>{
      'key': instance.key,
      'value': instance.value,
    };

SearchCategory _$SearchCategoryFromJson(Map<String, dynamic> json) =>
    SearchCategory(
      title:
          SearchCategoryTitle.fromJson(json['title'] as Map<String, dynamic>),
      suggestions: (json['suggestions'] as List<dynamic>)
          .map((e) => SearchSuggestion.fromJson(e as Map<String, dynamic>))
          .toList(),
    );

Map<String, dynamic> _$SearchCategoryToJson(SearchCategory instance) =>
    <String, dynamic>{
      'title': instance.title,
      'suggestions': instance.suggestions,
    };
