import 'package:fotmob/fotmob.dart';

void main() async {
  print('=============================================');
  print('       FOTMOB DART - FULL ENDPOINT TEST      ');
  print('=============================================');

  // 1. Trending News
  try {
    print('\n--- 1. Trending News ---');
    final news = await fotmobService.getTrendingNews(lang: 'en');
    print('✅ Trending News! Total articles: ${news.length}');
    if (news.isNotEmpty) print('   -> First: ${news.first.title}');
  } catch (e) {
    print('❌ Trending News: $e');
  }

  // 2. Timeline News
  try {
    print('\n--- 2. Timeline News (League ID 47, type=league) ---');
    final timeline = await fotmobService.getTimelineNews(id: 47, type: 'league');
    print('✅ Timeline News! Total articles: ${timeline.data.length}');
  } catch (e) {
    print('❌ Timeline News: $e');
  }

  // 3. League Table
  try {
    print('\n--- 3. League Table (Premier League - ID 47) ---');
    final table = await fotmobService.getLeagueTable(leagueId: 47);
    print('✅ League Table! League: ${table.leagueName}');
    print('   -> Teams in table: ${table.table?.all.length ?? 0}');
    final all = table.table?.all ?? [];
    if (all.isNotEmpty) {
      final top = all.first;
      print('   -> #1: ${top.name} — ${top.pts} pts');
    }
  } catch (e) {
    print('❌ League Table: $e');
  }

  // 4. All Leagues
  try {
    print('\n--- 4. All Leagues ---');
    final allLeagues = await fotmobService.getAllLeagues();
    print('✅ All Leagues! Total leagues: ${allLeagues.popular.length} popular');
  } catch (e) {
    print('❌ All Leagues: $e');
  }

  // 5. Top Scorers
  try {
    print('\n--- 5. Top Scorers (Premier League - ID 47) ---');
    final scorers = await fotmobService.getTopScorers(leagueId: 47);
    print('✅ Top Scorers! Total entries: ${scorers.rows.length}');
    if (scorers.rows.isNotEmpty) {
      final top = scorers.rows.first;
      print('   -> #1: ${top.name} — ${top.statValue?.value} goals');
    }
  } catch (e) {
    print('❌ Top Scorers: $e');
  }

  // 6. Player Details
  try {
    print('\n--- 6. Player Details (Lionel Messi - ID 30981) ---');
    final player = await fotmobService.getPlayerDetails(id: 30981);
    print('✅ Player! Name: ${player.name}, Gender: ${player.gender}');
  } catch (e) {
    print('❌ Player Details: $e');
  }

  // 7. Search
  try {
    print('\n--- 7. Search ("Ronaldo") ---');
    final results = await fotmobService.getSearchData(term: 'Ronaldo');
    print('✅ Search! Total categories: ${results.length}');
    if (results.isNotEmpty && results.first.suggestions.isNotEmpty) {
      print('   -> First result: ${results.first.suggestions.first.name}');
    }
  } catch (e) {
    print('❌ Search: $e');
  }

  // 8. Match Data
  try {
    print('\n--- 8. Match Data (Match ID 4193650) ---');
    final match = await fotmobService.getMatch(id: 4193650);
    print('✅ Match! Home: ${match.home?.name} vs Away: ${match.away?.name}');
    print('   -> Score: ${match.homeScore ?? "N/A"} - ${match.awayScore ?? "N/A"}');
  } catch (e) {
    print('❌ Match Data: $e');
  }

  print('\n=============================================');
  print('                   DONE                     ');
  print('=============================================');
}
