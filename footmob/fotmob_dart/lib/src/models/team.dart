import 'package:json_annotation/json_annotation.dart';

part 'team.g.dart';

@JsonSerializable()
class TeamMemberRole {
  final String key;
  final String fallback;

  TeamMemberRole({
    required this.key,
    required this.fallback,
  });

  factory TeamMemberRole.fromJson(Map<String, dynamic> json) => _$TeamMemberRoleFromJson(json);
  Map<String, dynamic> toJson() => _$TeamMemberRoleToJson(this);
}

@JsonSerializable()
class TeamMember {
  final int id;
  final int? height;
  final int age;
  final String dateOfBirth;
  final String name;
  final String ccode;
  final String cname;
  final TeamMemberRole role;
  final bool? excludeFromRanking;
  final int? shirtNumber;
  final num? rating;
  final int? goals;
  final int? assists;
  final bool? injured;

  TeamMember({
    required this.id,
    this.height,
    required this.age,
    required this.dateOfBirth,
    required this.name,
    required this.ccode,
    required this.cname,
    required this.role,
    this.excludeFromRanking,
    this.shirtNumber,
    this.rating,
    this.goals,
    this.assists,
    this.injured,
  });

  factory TeamMember.fromJson(Map<String, dynamic> json) => _$TeamMemberFromJson(json);
  Map<String, dynamic> toJson() => _$TeamMemberToJson(this);
}

@JsonSerializable()
class TeamSquadPosition {
  final String title;
  final List<TeamMember> members;

  TeamSquadPosition({
    required this.title,
    required this.members,
  });

  factory TeamSquadPosition.fromJson(Map<String, dynamic> json) => _$TeamSquadPositionFromJson(json);
  Map<String, dynamic> toJson() => _$TeamSquadPositionToJson(this);
}

@JsonSerializable()
class TeamSquad {
  final List<TeamSquadPosition>? squad;
  final bool? isNationalTeam;

  TeamSquad({
    this.squad,
    this.isNationalTeam,
  });

  factory TeamSquad.fromJson(Map<String, dynamic> json) => _$TeamSquadFromJson(json);
  Map<String, dynamic> toJson() => _$TeamSquadToJson(this);
}

@JsonSerializable()
class TeamResponseDetails {
  final int id;
  final String type;
  final String name;
  final String latestSeason;
  final String shortName;
  final String country;
  final int primaryLeagueId;
  final String primaryLeagueName;

  TeamResponseDetails({
    required this.id,
    required this.type,
    required this.name,
    required this.latestSeason,
    required this.shortName,
    required this.country,
    required this.primaryLeagueId,
    required this.primaryLeagueName,
  });

  factory TeamResponseDetails.fromJson(Map<String, dynamic> json) => _$TeamResponseDetailsFromJson(json);
  Map<String, dynamic> toJson() => _$TeamResponseDetailsToJson(this);
}

@JsonSerializable()
class TeamResponse {
  final List<String>? tabs;
  final List<String>? allAvailableSeasons;
  final TeamResponseDetails? details;
  final String? seostr;
  final TeamSquad? squad;
  // Ignoring the complex dynamically-typed overview, history, fixtures and table properties
  // due to their deeply nested structure (mapped to dynamic internally).

  TeamResponse({
    this.tabs,
    this.allAvailableSeasons,
    this.details,
    this.seostr,
    this.squad,
  });

  factory TeamResponse.fromJson(Map<String, dynamic> json) => _$TeamResponseFromJson(json);
  Map<String, dynamic> toJson() => _$TeamResponseToJson(this);
}
