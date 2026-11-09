import 'package:json_annotation/json_annotation.dart';

part 'search.g.dart';

@JsonSerializable()
class SearchStatusReason {
  final String short;
  final String shortKey;
  final String long;
  final String longKey;

  SearchStatusReason({
    required this.short,
    required this.shortKey,
    required this.long,
    required this.longKey,
  });

  factory SearchStatusReason.fromJson(Map<String, dynamic> json) => _$SearchStatusReasonFromJson(json);
  Map<String, dynamic> toJson() => _$SearchStatusReasonToJson(this);
}

@JsonSerializable()
class SearchStatus {
  final String utcTime;
  final bool finished;
  final bool started;
  final bool cancelled;
  final bool awarded;
  final String scoreStr;
  final SearchStatusReason reason;

  SearchStatus({
    required this.utcTime,
    required this.finished,
    required this.started,
    required this.cancelled,
    required this.awarded,
    required this.scoreStr,
    required this.reason,
  });

  factory SearchStatus.fromJson(Map<String, dynamic> json) => _$SearchStatusFromJson(json);
  Map<String, dynamic> toJson() => _$SearchStatusToJson(this);
}

@JsonSerializable()
class SearchSuggestion {
  final String? type;
  final dynamic id;
  final double? score;
  final String? name;

  // Player specifics
  final bool? isCoach;
  final int? teamId;
  final String? teamName;

  // Team specifics
  final int? leagueId;
  final String? leagueName;

  // League specifics
  final String? countryCode;

  // Match specifics
  final String? matchDate;
  final SearchStatus? status;
  final String? homeTeamId;
  final String? homeTeamName;
  final int? homeTeamScore;
  final String? awayTeamId;
  final String? awayTeamName;
  final int? awayTeamScore;

  SearchSuggestion({
    this.type,
    this.id,
    this.score,
    this.name,
    this.isCoach,
    this.teamId,
    this.teamName,
    this.leagueId,
    this.leagueName,
    this.countryCode,
    this.matchDate,
    this.status,
    this.homeTeamId,
    this.homeTeamName,
    this.homeTeamScore,
    this.awayTeamId,
    this.awayTeamName,
    this.awayTeamScore,
  });

  factory SearchSuggestion.fromJson(Map<String, dynamic> json) => _$SearchSuggestionFromJson(json);
  Map<String, dynamic> toJson() => _$SearchSuggestionToJson(this);
}

@JsonSerializable()
class SearchCategoryTitle {
  final String? key;
  final String? value;

  SearchCategoryTitle({
    this.key,
    this.value,
  });

  factory SearchCategoryTitle.fromJson(Map<String, dynamic> json) => _$SearchCategoryTitleFromJson(json);
  Map<String, dynamic> toJson() => _$SearchCategoryTitleToJson(this);
}

@JsonSerializable()
class SearchCategory {
  final SearchCategoryTitle title;
  final List<SearchSuggestion> suggestions;

  SearchCategory({
    required this.title,
    required this.suggestions,
  });

  factory SearchCategory.fromJson(Map<String, dynamic> json) => _$SearchCategoryFromJson(json);
  Map<String, dynamic> toJson() => _$SearchCategoryToJson(this);
}
