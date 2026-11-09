import 'package:json_annotation/json_annotation.dart';

part 'tvlistings.g.dart';

@JsonSerializable()
class TvListingStation {
  final String? callSign;
  final String? stationId;
  final String? affiliateId;
  final String? affiliateCallSign;
  final String? name;
  final String? type;
  final List<String>? blockedCountryCodes;

  TvListingStation({
    this.callSign,
    this.stationId,
    this.affiliateId,
    this.affiliateCallSign,
    this.name,
    this.type,
    this.blockedCountryCodes,
  });

  factory TvListingStation.fromJson(Map<String, dynamic> json) => _$TvListingStationFromJson(json);
  Map<String, dynamic> toJson() => _$TvListingStationToJson(this);
}

@JsonSerializable()
class TvListingTeam {
  final String? name;
  final bool? isHome;
  final String? teamBrandId;

  TvListingTeam({
    this.name,
    this.isHome,
    this.teamBrandId,
  });

  factory TvListingTeam.fromJson(Map<String, dynamic> json) => _$TvListingTeamFromJson(json);
  Map<String, dynamic> toJson() => _$TvListingTeamToJson(this);
}

@JsonSerializable()
class TvListingProgram {
  final String? rootId;
  final List<TvListingTeam>? teams;

  TvListingProgram({
    this.rootId,
    this.teams,
  });

  factory TvListingProgram.fromJson(Map<String, dynamic> json) => _$TvListingProgramFromJson(json);
  Map<String, dynamic> toJson() => _$TvListingProgramToJson(this);
}

@JsonSerializable()
class TvListingAffiliate {
  final String? langCode;
  final String? title;
  final String? url;

  TvListingAffiliate({
    this.langCode,
    this.title,
    this.url,
  });

  factory TvListingAffiliate.fromJson(Map<String, dynamic> json) => _$TvListingAffiliateFromJson(json);
  Map<String, dynamic> toJson() => _$TvListingAffiliateToJson(this);
}

@JsonSerializable()
class TvListingItem {
  final String? startTime;
  final String? endTime;
  final List<String>? qualifiers;
  final TvListingStation? station;
  final String? stationId;
  final int? matchId;
  final int? leagueId;
  final int? parentLeagueId;
  final TvListingProgram? program;
  final int? bet365MatchId;
  final String? externalId;
  final List<TvListingAffiliate>? affiliates;
  final List<String>? tags;

  TvListingItem({
    this.startTime,
    this.endTime,
    this.qualifiers,
    this.station,
    this.stationId,
    this.matchId,
    this.leagueId,
    this.parentLeagueId,
    this.program,
    this.bet365MatchId,
    this.externalId,
    this.affiliates,
    this.tags,
  });

  factory TvListingItem.fromJson(Map<String, dynamic> json) => _$TvListingItemFromJson(json);
  Map<String, dynamic> toJson() => _$TvListingItemToJson(this);
}

class TvListingResponse {
  final Map<String, List<TvListingItem>> data;

  TvListingResponse({required this.data});

  factory TvListingResponse.fromJson(Map<String, dynamic> json) {
    final Map<String, List<TvListingItem>> parsedData = {};
    json.forEach((key, value) {
      if (value is List) {
        parsedData[key] = value.map((e) => TvListingItem.fromJson(e as Map<String, dynamic>)).toList();
      }
    });
    return TvListingResponse(data: parsedData);
  }
}
