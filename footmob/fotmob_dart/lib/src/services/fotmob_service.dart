import '../api_client.dart';
import '../endpoints.dart';
import '../models/models.dart';

class FotmobService {
  Future<TvListingResponse> getTvListings({required String countryCode, List<String>? ids}) async {
    final params = <String, String>{'countryCode': countryCode};
    if (ids != null && ids.isNotEmpty) params['ids'] = ids.join(',');
    final json = await fotmobApiClient.get(
      Endpoints.tvListings,
      queryParameters: params,
    );
    return TvListingResponse.fromJson(json as Map<String, dynamic>);
  }

  Future<MatchesResponse> getMatches({
    required String date,
    String? timezone,
    String? ccode3,
    bool? includeNextDayLateNight,
  }) async {
    final params = {'date': date};
    if (timezone != null) params['timezone'] = timezone;
    if (ccode3 != null) params['ccode3'] = ccode3;
    if (includeNextDayLateNight != null) {
      params['includeNextDayLateNight'] = includeNextDayLateNight.toString();
    }
    final json = await fotmobApiClient.get(
      Endpoints.matches,
      queryParameters: params,
    );
    return MatchesResponse.fromJson(json as Map<String, dynamic>);
  }

  Future<LeagueDetailsResponse> getLeagueDetails({required int id, String? ccode3}) async {
    final params = {'id': id.toString()};
    if (ccode3 != null) params['ccode3'] = ccode3;
    final json = await fotmobApiClient.get(
      Endpoints.leagueDetails,
      queryParameters: params,
    );
    return LeagueDetailsResponse.fromJson(json as Map<String, dynamic>);
  }

  Future<List<NewsArticle>> getTrendingNews({String? lang, String? ccode3}) async {
    final params = <String, String>{};
    if (lang != null) params['lang'] = lang;
    if (ccode3 != null) params['ccode3'] = ccode3;
    final json = await fotmobApiClient.get(
      Endpoints.trendingNews,
      queryParameters: params,
    );
    return (json as List).map((e) => NewsArticle.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<TimelineNewsResponse> getTimelineNews({
    required int id,
    required String type,
    int? startIndex,
    String? language,
  }) async {
    final params = {
      'id': id.toString(),
      'type': type,
      'startIndex': startIndex?.toString() ?? '0',
    };
    if (language != null) params['language'] = language;
    final json = await fotmobApiClient.get(
      Endpoints.timelineNews,
      queryParameters: params,
    );
    return TimelineNewsResponse.fromJson(json as Map<String, dynamic>);
  }

  Future<TopTransfersResponse> getTopTransfers({String? minFeeCurrency, int? page}) async {
    final params = <String, String>{};
    if (minFeeCurrency != null) params['minFeeCurrency'] = minFeeCurrency;
    if (page != null) params['page'] = page.toString();
    final json = await fotmobApiClient.get(
      Endpoints.topTransfers,
      queryParameters: params,
    );
    return TopTransfersResponse.fromJson(json as Map<String, dynamic>);
  }

  Future<LeagueTableResponse> getLeagueTable({
    required int leagueId,
    String? parentLeagueName,
    String? selectedSeason,
  }) async {
    final json = await fotmobApiClient.get(
      Endpoints.leagueTable,
      queryParameters: {
        'url': 'http://data.fotmob.com/tables.ext.$leagueId.fot.gz',
        'teams': '[null,null]',
        'parentLeagueId': leagueId.toString(),
        'parentLeagueName': parentLeagueName ?? '',
        'selectedSeason': selectedSeason ?? '',
        'isCurrentSeason': 'true',
      },
    );
    return LeagueTableResponse.fromJson(json as Map<String, dynamic>);
  }

  Future<List<AudioMatchItem>> getAudioMatches() async {
    final json = await fotmobApiClient.get(
      Endpoints.audioMatches,
    );
    return (json as List).map((e) => AudioMatchItem.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<AllLeaguesResponse> getAllLeagues({String? locale, String? country}) async {
    final params = <String, String>{};
    if (locale != null) params['locale'] = locale;
    if (country != null) params['country'] = country;
    final json = await fotmobApiClient.get(
      Endpoints.allLeagues,
      queryParameters: params,
    );
    return AllLeaguesResponse.fromJson(json as Map<String, dynamic>);
  }

  Future<TopScorersResponse> getTopScorers({required int leagueId}) async {
    final json = await fotmobApiClient.get(
      Endpoints.topScorers,
      queryParameters: {'leagueId': leagueId.toString()},
    );
    if (json == null) {
      return TopScorersResponse(subtitle: '', localizedSubtitleId: '', rows: []);
    }
    return TopScorersResponse.fromJson(json as Map<String, dynamic>);
  }

  Future<List<TotwPlayer>> getTeamOfTheWeek({required int leagueId, required String roundId, required String season}) async {
    final json = await fotmobApiClient.get(
      Endpoints.teamOfTheWeek,
      queryParameters: {
        'leagueId': leagueId.toString(),
        'roundId': roundId,
        'season': season,
      },
    );
    return (json as List).map((e) => TotwPlayer.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<TeamOfTheWeekRoundsResponse> getTeamOfTheWeekRounds({required int leagueId, required String season}) async {
    final json = await fotmobApiClient.get(
      Endpoints.teamOfTheWeekRounds,
      queryParameters: {
        'leagueId': leagueId.toString(),
        'season': season,
      },
    );
    return TeamOfTheWeekRoundsResponse.fromJson(json as Map<String, dynamic>);
  }

  /// Fetches live fixture data.
  ///
  /// ⚠️ NOTE: This endpoint relies on a FotMob internal proxy (`pub.fotmob.com`)
  /// that may be unavailable or return 404. This is a known FotMob server-side
  /// limitation that also affects the original Node.js package. The Dart code
  /// is correct — the upstream server endpoint has been retired/moved by FotMob.
  Future<LiveFixturesResponse> getLiveFixtures({int? leagueId}) async {
    String internalUrl = 'https://pub.fotmob.com/prod/db/api/fixture/live';
    if (leagueId != null) internalUrl += '?leagueId=$leagueId';
    final json = await fotmobApiClient.get(
      Endpoints.liveFixtures,
      queryParameters: {'url': internalUrl},
    );
    return LiveFixturesResponse.fromJson(json as Map<String, dynamic>);
  }

  Future<PlayerResponse> getPlayerDetails({required int id}) async {
    final json = await fotmobApiClient.get(
      Endpoints.playerData,
      queryParameters: {'id': id.toString()},
    );
    return PlayerResponse.fromJson(json as Map<String, dynamic>);
  }

  Future<List<SearchCategory>> getSearchData({required String term, int? hits}) async {
    final params = {'term': term};
    if (hits != null) params['hits'] = hits.toString();
    final json = await fotmobApiClient.get(
      Endpoints.search,
      queryParameters: params,
    );
    return (json as List).map((e) => SearchCategory.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<TeamResponse> getTeamDetails({required int id}) async {
    final json = await fotmobApiClient.get(
      Endpoints.team,
      queryParameters: {'id': id.toString()},
    );
    return TeamResponse.fromJson(json as Map<String, dynamic>);
  }

  Future<MatchDataResponse> getMatch({required int id}) async {
    final json = await fotmobApiClient.get(
      Endpoints.match,
      queryParameters: {'matchId': id.toString()},
    );
    return MatchDataResponse.fromJson(json as Map<String, dynamic>);
  }
}

final fotmobService = FotmobService();
