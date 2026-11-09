import 'package:json_annotation/json_annotation.dart';

part 'totw.g.dart';

@JsonSerializable()
class TotwPlayerName {
  final String firstName;
  final String lastName;
  final String fullName;

  TotwPlayerName({
    required this.firstName,
    required this.lastName,
    required this.fullName,
  });

  factory TotwPlayerName.fromJson(Map<String, dynamic> json) => _$TotwPlayerNameFromJson(json);
  Map<String, dynamic> toJson() => _$TotwPlayerNameToJson(this);
}

@JsonSerializable()
class TotwTopRating {
  final bool isTopRating;

  TotwTopRating({required this.isTopRating});

  factory TotwTopRating.fromJson(Map<String, dynamic> json) => _$TotwTopRatingFromJson(json);
  Map<String, dynamic> toJson() => _$TotwTopRatingToJson(this);
}

@JsonSerializable()
class TotwRating {
  final String num;
  final String bgcolor;
  final TotwTopRating isTop;

  TotwRating({
    required this.num,
    required this.bgcolor,
    required this.isTop,
  });

  factory TotwRating.fromJson(Map<String, dynamic> json) => _$TotwRatingFromJson(json);
  Map<String, dynamic> toJson() => _$TotwRatingToJson(this);
}

@JsonSerializable()
class TotwVerticalLayout {
  final num width;
  final num height;
  final num x;
  final num y;

  TotwVerticalLayout({
    required this.width,
    required this.height,
    required this.x,
    required this.y,
  });

  factory TotwVerticalLayout.fromJson(Map<String, dynamic> json) => _$TotwVerticalLayoutFromJson(json);
  Map<String, dynamic> toJson() => _$TotwVerticalLayoutToJson(this);
}

@JsonSerializable()
class TotwPlayer {
  final int id;
  final TotwPlayerName name;
  final TotwRating rating;
  final int matchId;
  final int teamId;
  final TotwVerticalLayout verticalLayout;
  final bool isTots;

  TotwPlayer({
    required this.id,
    required this.name,
    required this.rating,
    required this.matchId,
    required this.teamId,
    required this.verticalLayout,
    required this.isTots,
  });

  factory TotwPlayer.fromJson(Map<String, dynamic> json) => _$TotwPlayerFromJson(json);
  Map<String, dynamic> toJson() => _$TotwPlayerToJson(this);
}

@JsonSerializable()
class TotwRound {
  final String? localizedKey;
  final String roundId;
  final bool isCompleted;

  TotwRound({
    this.localizedKey,
    required this.roundId,
    required this.isCompleted,
  });

  factory TotwRound.fromJson(Map<String, dynamic> json) => _$TotwRoundFromJson(json);
  Map<String, dynamic> toJson() => _$TotwRoundToJson(this);
}

@JsonSerializable()
class TeamOfTheWeekRoundsResponse {
  final TotwRound last;
  final List<TotwRound> rounds;

  TeamOfTheWeekRoundsResponse({
    required this.last,
    required this.rounds,
  });

  factory TeamOfTheWeekRoundsResponse.fromJson(Map<String, dynamic> json) => _$TeamOfTheWeekRoundsResponseFromJson(json);
  Map<String, dynamic> toJson() => _$TeamOfTheWeekRoundsResponseToJson(this);
}
