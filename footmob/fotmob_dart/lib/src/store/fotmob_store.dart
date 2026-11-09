import 'package:cubepod_state/cubepod_state.dart';
import '../services/fotmob_service.dart';
import '../models/models.dart';

class FotmobStore {
  final FotmobService _service;

  FotmobStore({FotmobService? service}) : _service = service ?? fotmobService;

  final tvListings = StateSignal<TvListingResponse?>(null);
  final trendingNews = StateSignal<List<NewsArticle>?>(null);
  final timelineNews = StateSignal<TimelineNewsResponse?>(null);
  final topTransfers = StateSignal<TopTransfersResponse?>(null);
  final leagueTable = StateSignal<LeagueTableResponse?>(null);
  final matches = StateSignal<MatchesResponse?>(null);
  final leagueDetails = StateSignal<LeagueDetailsResponse?>(null);
  final audioMatches = StateSignal<List<AudioMatchItem>?>(null);
  final allLeagues = StateSignal<AllLeaguesResponse?>(null);
  final topScorers = StateSignal<TopScorersResponse?>(null);
  final teamOfTheWeek = StateSignal<List<TotwPlayer>?>(null);
  final teamOfTheWeekRounds = StateSignal<TeamOfTheWeekRoundsResponse?>(null);
  final liveFixtures = StateSignal<LiveFixturesResponse?>(null);
  final playerDetails = StateSignal<PlayerResponse?>(null);
  final searchData = StateSignal<List<SearchCategory>?>(null);
  final teamDetails = StateSignal<TeamResponse?>(null);
  final matchData = StateSignal<MatchDataResponse?>(null);

  final isLoading = StateSignal<bool>(false);
  final error = StateSignal<String?>(null);

  Future<void> _fetchData<T>(StateSignal<T?> target, Future<T> Function() fetcher) async {
    isLoading.value = true;
    error.value = null;
    try {
      final data = await fetcher();
      target.value = data;
    } catch (e) {
      error.value = e.toString();
    } finally {
      isLoading.value = false;
    }
  }

  Future<void> fetchTvListings({required String countryCode}) =>
      _fetchData(tvListings, () => _service.getTvListings(countryCode: countryCode));

  Future<void> fetchTrendingNews({String? lang, String? ccode3}) =>
      _fetchData(trendingNews, () => _service.getTrendingNews(lang: lang, ccode3: ccode3));

  Future<void> fetchMatches({
    required String date,
    String? timezone,
    String? ccode3,
    bool? includeNextDayLateNight,
  }) =>
      _fetchData(matches, () => _service.getMatches(
        date: date,
        timezone: timezone,
        ccode3: ccode3,
        includeNextDayLateNight: includeNextDayLateNight,
      ));

  Future<void> fetchLeagueDetails({required int id, String? ccode3}) =>
      _fetchData(leagueDetails, () => _service.getLeagueDetails(id: id, ccode3: ccode3));

  Future<void> fetchTimelineNews({required int id, required String type, int? startIndex, String? language}) =>
      _fetchData(timelineNews, () => _service.getTimelineNews(id: id, type: type, startIndex: startIndex, language: language));

  Future<void> fetchTopTransfers({String? minFeeCurrency, int? page}) =>
      _fetchData(topTransfers, () => _service.getTopTransfers(minFeeCurrency: minFeeCurrency, page: page));

  Future<void> fetchLeagueTable({required int leagueId}) =>
      _fetchData(leagueTable, () => _service.getLeagueTable(leagueId: leagueId));

  Future<void> fetchAudioMatches() =>
      _fetchData(audioMatches, () => _service.getAudioMatches());

  Future<void> fetchAllLeagues({String? locale, String? country}) =>
      _fetchData(allLeagues, () => _service.getAllLeagues(locale: locale, country: country));

  Future<void> fetchTopScorers({required int leagueId}) =>
      _fetchData(topScorers, () => _service.getTopScorers(leagueId: leagueId));

  Future<void> fetchTeamOfTheWeek({required int leagueId, required String roundId, required String season}) =>
      _fetchData(teamOfTheWeek, () => _service.getTeamOfTheWeek(leagueId: leagueId, roundId: roundId, season: season));

  Future<void> fetchTeamOfTheWeekRounds({required int leagueId, required String season}) =>
      _fetchData(teamOfTheWeekRounds, () => _service.getTeamOfTheWeekRounds(leagueId: leagueId, season: season));

  Future<void> fetchLiveFixtures({required int leagueId}) =>
      _fetchData(liveFixtures, () => _service.getLiveFixtures(leagueId: leagueId));

  Future<void> fetchPlayerDetails({required int id}) =>
      _fetchData(playerDetails, () => _service.getPlayerDetails(id: id));

  Future<void> fetchSearchData({required String term, int? hits}) =>
      _fetchData(searchData, () => _service.getSearchData(term: term, hits: hits));

  Future<void> fetchTeamDetails({required int id}) =>
      _fetchData(teamDetails, () => _service.getTeamDetails(id: id));

  Future<void> fetchMatch({required int id}) =>
      _fetchData(matchData, () => _service.getMatch(id: id));
}

final fotmobStore = FotmobStore();
