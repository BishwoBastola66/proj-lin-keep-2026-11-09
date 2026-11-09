import '../api_client.dart';
import '../endpoints.dart';

class MatchesOptions {
  final String date;
  final String? timezone;
  final String? ccode3;
  final bool? includeNextDayLateNight;

  MatchesOptions({
    required this.date,
    this.timezone,
    this.ccode3,
    this.includeNextDayLateNight,
  });

  Map<String, String> toQueryParameters() {
    final params = {'date': date};
    if (timezone != null) params['timezone'] = timezone!;
    if (ccode3 != null) params['ccode3'] = ccode3!;
    if (includeNextDayLateNight != null) {
      params['includeNextDayLateNight'] = includeNextDayLateNight.toString();
    }
    return params;
  }
}

class MatchesService {
  Future<dynamic> getMatches(MatchesOptions options) async {
    return await fotmobApiClient.get(
      Endpoints.matches,
      queryParameters: options.toQueryParameters(),
    );
  }
}
