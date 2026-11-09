import 'package:json_annotation/json_annotation.dart';

part 'player.g.dart';

@JsonSerializable()
class PlayerName {
  final String firstName;
  final String lastName;
  final String fullName;

  PlayerName({
    required this.firstName,
    required this.lastName,
    required this.fullName,
  });

  factory PlayerName.fromJson(Map<String, dynamic> json) => _$PlayerNameFromJson(json);
  Map<String, dynamic> toJson() => _$PlayerNameToJson(this);
}

@JsonSerializable()
class PlayerTeam {
  final int teamId;
  final String teamName;

  PlayerTeam({
    required this.teamId,
    required this.teamName,
  });

  factory PlayerTeam.fromJson(Map<String, dynamic> json) => _$PlayerTeamFromJson(json);
  Map<String, dynamic> toJson() => _$PlayerTeamToJson(this);
}

@JsonSerializable()
class PlayerCareerItem {
  final int teamId;
  final String teamName;
  final dynamic appearances; // string | number
  final dynamic goals; // string | number
  final String? season;
  final String? startDate;
  final String? endDate;

  PlayerCareerItem({
    required this.teamId,
    required this.teamName,
    required this.appearances,
    required this.goals,
    this.season,
    this.startDate,
    this.endDate,
  });

  factory PlayerCareerItem.fromJson(Map<String, dynamic> json) => _$PlayerCareerItemFromJson(json);
  Map<String, dynamic> toJson() => _$PlayerCareerItemToJson(this);
}

@JsonSerializable()
class PlayerResponse {
  final int id;
  final String name;
  final bool isCoach;
  final bool isCaptain;
  final String gender;
  final String? status;
  // Skipping some deeply nested properties for brevity based on TypeScript's loose typing for complex trees
  
  PlayerResponse({
    required this.id,
    required this.name,
    required this.isCoach,
    required this.isCaptain,
    required this.gender,
    this.status,
  });

  factory PlayerResponse.fromJson(Map<String, dynamic> json) => _$PlayerResponseFromJson(json);
  Map<String, dynamic> toJson() => _$PlayerResponseToJson(this);
}
