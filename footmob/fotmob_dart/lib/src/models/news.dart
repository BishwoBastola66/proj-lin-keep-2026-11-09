import 'package:json_annotation/json_annotation.dart';

part 'news.g.dart';

@JsonSerializable()
class NewsArticlePage {
  final String url;

  NewsArticlePage({required this.url});

  factory NewsArticlePage.fromJson(Map<String, dynamic> json) => _$NewsArticlePageFromJson(json);
  Map<String, dynamic> toJson() => _$NewsArticlePageToJson(this);
}

@JsonSerializable()
class NewsArticle {
  final String id;
  final String imageUrl;
  final String title;
  final String gmtTime;
  final String sourceStr;
  final String sourceIconUrl;
  final NewsArticlePage page;
  final String? language;
  final String? lead;

  NewsArticle({
    required this.id,
    required this.imageUrl,
    required this.title,
    required this.gmtTime,
    required this.sourceStr,
    required this.sourceIconUrl,
    required this.page,
    this.language,
    this.lead,
  });

  factory NewsArticle.fromJson(Map<String, dynamic> json) => _$NewsArticleFromJson(json);
  Map<String, dynamic> toJson() => _$NewsArticleToJson(this);
}

@JsonSerializable()
class TimelineNewsResponse {
  final List<NewsArticle> data;
  final int totalItems;

  TimelineNewsResponse({
    required this.data,
    required this.totalItems,
  });

  factory TimelineNewsResponse.fromJson(Map<String, dynamic> json) => _$TimelineNewsResponseFromJson(json);
  Map<String, dynamic> toJson() => _$TimelineNewsResponseToJson(this);
}
