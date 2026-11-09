import 'package:http/http.dart' as http;

void main() async {
  // Test table
  final tableUrl = Uri.parse(
    'https://www.fotmob.com/api/data/table'
    '?url=http%3A%2F%2Fdata.fotmob.com%2Ftables.ext.47.fot.gz'
    '&teams=%5Bnull%2Cnull%5D'
    '&parentLeagueId=47'
    '&parentLeagueName='
    '&selectedSeason='
    '&isCurrentSeason=true'
  );

  final res = await http.get(tableUrl, headers: {
    'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/json',
    'Accept-Language': 'en-US,en;q=0.9',
    'Cache-Control': 'no-cache',
  });
  print('TABLE Status: ${res.statusCode}');
  print('TABLE Body (first 500): ${res.body.substring(0, res.body.length > 500 ? 500 : res.body.length)}');

  // Test top scorers
  final scorersUrl = Uri.parse('https://www.fotmob.com/api/data/allTimeTopScorers?leagueId=47');
  final res2 = await http.get(scorersUrl, headers: {
    'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/json',
    'Accept-Language': 'en-US,en;q=0.9',
  });
  print('\nSCORERS Status: ${res2.statusCode}');
  print('SCORERS Body (first 500): ${res2.body.substring(0, res2.body.length > 500 ? 500 : res2.body.length)}');
}
