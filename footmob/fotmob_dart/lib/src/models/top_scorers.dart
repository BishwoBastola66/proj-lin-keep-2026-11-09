import 'package:json_annotation/json_annotation.dart';

part 'top_scorers.g.dart';

@JsonSerializable()
class SeasonGoalStats {
  final int tournamentId;
  final int year;
  final int goals;
  final int penalties;

  SeasonGoalStats({
    required this.tournamentId,
    required this.year,
    required this.goals,
    required this.penalties,
  });

  factory SeasonGoalStats.fromJson(Map<String, dynamic> json) => _$SeasonGoalStatsFromJson(json);
  Map<String, dynamic> toJson() => _$SeasonGoalStatsToJson(this);
}

@JsonSerializable()
class TopScorerSubstatValue {
  final num value;
  final String format;
  final int fractions;

  TopScorerSubstatValue({
    required this.value,
    required this.format,
    required this.fractions,
  });

  factory TopScorerSubstatValue.fromJson(Map<String, dynamic> json) => _$TopScorerSubstatValueFromJson(json);
  Map<String, dynamic> toJson() => _$TopScorerSubstatValueToJson(this);
}

@JsonSerializable()
class TopScorerStatValue {
  final String name;
  final num value;
  final String format;
  final int fractions;

  TopScorerStatValue({
    required this.name,
    required this.value,
    required this.format,
    required this.fractions,
  });

  factory TopScorerStatValue.fromJson(Map<String, dynamic> json) => _$TopScorerStatValueFromJson(json);
  Map<String, dynamic> toJson() => _$TopScorerStatValueToJson(this);
}

@JsonSerializable()
class TopScorerRow {
  final int? id;
  final int? teamId;
  final String? name;
  final String? position;
  final int? rank;
  final String? type;
  final TopScorerSubstatValue? substatValue;
  final TopScorerStatValue? statValue;
  final List<SeasonGoalStats>? seasonsWithGoals;

  TopScorerRow({
    this.id,
    this.teamId,
    this.name,
    this.position,
    this.rank,
    this.type,
    this.substatValue,
    this.statValue,
    this.seasonsWithGoals,
  });

  factory TopScorerRow.fromJson(Map<String, dynamic> json) => _$TopScorerRowFromJson(json);
  Map<String, dynamic> toJson() => _$TopScorerRowToJson(this);
}

@JsonSerializable()
class TopScorersResponse {
  final String subtitle;
  final String localizedSubtitleId;
  final List<TopScorerRow> rows;

  TopScorersResponse({
    required this.subtitle,
    required this.localizedSubtitleId,
    required this.rows,
  });

  factory TopScorersResponse.fromJson(Map<String, dynamic> json) => _$TopScorersResponseFromJson(json);
  Map<String, dynamic> toJson() => _$TopScorersResponseToJson(this);
}
