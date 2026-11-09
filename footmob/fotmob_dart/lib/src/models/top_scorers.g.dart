// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'top_scorers.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

SeasonGoalStats _$SeasonGoalStatsFromJson(Map<String, dynamic> json) =>
    SeasonGoalStats(
      tournamentId: (json['tournamentId'] as num).toInt(),
      year: (json['year'] as num).toInt(),
      goals: (json['goals'] as num).toInt(),
      penalties: (json['penalties'] as num).toInt(),
    );

Map<String, dynamic> _$SeasonGoalStatsToJson(SeasonGoalStats instance) =>
    <String, dynamic>{
      'tournamentId': instance.tournamentId,
      'year': instance.year,
      'goals': instance.goals,
      'penalties': instance.penalties,
    };

TopScorerSubstatValue _$TopScorerSubstatValueFromJson(
        Map<String, dynamic> json) =>
    TopScorerSubstatValue(
      value: json['value'] as num,
      format: json['format'] as String,
      fractions: (json['fractions'] as num).toInt(),
    );

Map<String, dynamic> _$TopScorerSubstatValueToJson(
        TopScorerSubstatValue instance) =>
    <String, dynamic>{
      'value': instance.value,
      'format': instance.format,
      'fractions': instance.fractions,
    };

TopScorerStatValue _$TopScorerStatValueFromJson(Map<String, dynamic> json) =>
    TopScorerStatValue(
      name: json['name'] as String,
      value: json['value'] as num,
      format: json['format'] as String,
      fractions: (json['fractions'] as num).toInt(),
    );

Map<String, dynamic> _$TopScorerStatValueToJson(TopScorerStatValue instance) =>
    <String, dynamic>{
      'name': instance.name,
      'value': instance.value,
      'format': instance.format,
      'fractions': instance.fractions,
    };

TopScorerRow _$TopScorerRowFromJson(Map<String, dynamic> json) => TopScorerRow(
      id: (json['id'] as num?)?.toInt(),
      teamId: (json['teamId'] as num?)?.toInt(),
      name: json['name'] as String?,
      position: json['position'] as String?,
      rank: (json['rank'] as num?)?.toInt(),
      type: json['type'] as String?,
      substatValue: json['substatValue'] == null
          ? null
          : TopScorerSubstatValue.fromJson(
              json['substatValue'] as Map<String, dynamic>),
      statValue: json['statValue'] == null
          ? null
          : TopScorerStatValue.fromJson(
              json['statValue'] as Map<String, dynamic>),
      seasonsWithGoals: (json['seasonsWithGoals'] as List<dynamic>?)
          ?.map((e) => SeasonGoalStats.fromJson(e as Map<String, dynamic>))
          .toList(),
    );

Map<String, dynamic> _$TopScorerRowToJson(TopScorerRow instance) =>
    <String, dynamic>{
      'id': instance.id,
      'teamId': instance.teamId,
      'name': instance.name,
      'position': instance.position,
      'rank': instance.rank,
      'type': instance.type,
      'substatValue': instance.substatValue,
      'statValue': instance.statValue,
      'seasonsWithGoals': instance.seasonsWithGoals,
    };

TopScorersResponse _$TopScorersResponseFromJson(Map<String, dynamic> json) =>
    TopScorersResponse(
      subtitle: json['subtitle'] as String,
      localizedSubtitleId: json['localizedSubtitleId'] as String,
      rows: (json['rows'] as List<dynamic>)
          .map((e) => TopScorerRow.fromJson(e as Map<String, dynamic>))
          .toList(),
    );

Map<String, dynamic> _$TopScorersResponseToJson(TopScorersResponse instance) =>
    <String, dynamic>{
      'subtitle': instance.subtitle,
      'localizedSubtitleId': instance.localizedSubtitleId,
      'rows': instance.rows,
    };
