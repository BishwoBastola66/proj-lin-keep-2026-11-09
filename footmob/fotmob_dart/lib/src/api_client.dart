import 'dart:math';
import 'package:http/http.dart' as http;
import 'package:cubepod_network/cubepod_network.dart';
import 'endpoints.dart';

String _getRandomUserAgent() {
  final osList = [
    'Windows NT 10.0; Win64; x64',
    'Macintosh; Intel Mac OS X 10_15_7',
    'X11; Linux x86_64',
    'Windows NT 11.0; Win64; x64'
  ];
  
  final browsers = [
    {'name': 'Chrome', 'ver': Random().nextInt(20) + 100},
    {'name': 'Firefox', 'ver': Random().nextInt(20) + 110},
    {'name': 'Safari', 'ver': '16.5'},
    {'name': 'Edge', 'ver': Random().nextInt(20) + 110},
  ];

  final os = osList[Random().nextInt(osList.length)];
  final browser = browsers[Random().nextInt(browsers.length)];
  const webkitVer = '537.36';

  if (browser['name'] == 'Firefox') {
    return 'Mozilla/5.0 ($os; rv:${browser['ver']}.0) Gecko/20100101 Firefox/${browser['ver']}.0';
  } else if (browser['name'] == 'Safari') {
    return 'Mozilla/5.0 ($os) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/${browser['ver']} Safari/605.1.15';
  } else if (browser['name'] == 'Edge') {
    return 'Mozilla/5.0 ($os) AppleWebKit/$webkitVer (KHTML, like Gecko) Chrome/${browser['ver']}.0.0.0 Safari/$webkitVer Edg/${browser['ver']}.0.0.0';
  } else {
    // Default Chrome
    return 'Mozilla/5.0 ($os) AppleWebKit/$webkitVer (KHTML, like Gecko) Chrome/${browser['ver']}.0.0.0 Safari/$webkitVer';
  }
}

class UserAgentInterceptor extends Interceptor {
  @override
  Future<http.Request> onRequest(http.Request request) async {
    request.headers['User-Agent'] = _getRandomUserAgent();
    request.headers['Accept'] = 'application/json, text/plain, */*';
    request.headers['Accept-Language'] = 'en-US,en;q=0.9';
    request.headers['Cache-Control'] = 'no-cache';
    return request;
  }

  @override
  Future<http.Response> onResponse(http.Response response) async => response;

  @override
  Future<dynamic> onError(dynamic error) async => error;
}

final fotmobApiClient = HttpApiClient(
  baseUrl: Endpoints.baseUrl,
  interceptors: [
    UserAgentInterceptor(),
  ],
);
