// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'news.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

NewsArticlePage _$NewsArticlePageFromJson(Map<String, dynamic> json) =>
    NewsArticlePage(
      url: json['url'] as String,
    );

Map<String, dynamic> _$NewsArticlePageToJson(NewsArticlePage instance) =>
    <String, dynamic>{
      'url': instance.url,
    };

NewsArticle _$NewsArticleFromJson(Map<String, dynamic> json) => NewsArticle(
      id: json['id'] as String,
      imageUrl: json['imageUrl'] as String,
      title: json['title'] as String,
      gmtTime: json['gmtTime'] as String,
      sourceStr: json['sourceStr'] as String,
      sourceIconUrl: json['sourceIconUrl'] as String,
      page: NewsArticlePage.fromJson(json['page'] as Map<String, dynamic>),
      language: json['language'] as String?,
      lead: json['lead'] as String?,
    );

Map<String, dynamic> _$NewsArticleToJson(NewsArticle instance) =>
    <String, dynamic>{
      'id': instance.id,
      'imageUrl': instance.imageUrl,
      'title': instance.title,
      'gmtTime': instance.gmtTime,
      'sourceStr': instance.sourceStr,
      'sourceIconUrl': instance.sourceIconUrl,
      'page': instance.page,
      'language': instance.language,
      'lead': instance.lead,
    };

TimelineNewsResponse _$TimelineNewsResponseFromJson(
        Map<String, dynamic> json) =>
    TimelineNewsResponse(
      data: (json['data'] as List<dynamic>)
          .map((e) => NewsArticle.fromJson(e as Map<String, dynamic>))
          .toList(),
      totalItems: (json['totalItems'] as num).toInt(),
    );

Map<String, dynamic> _$TimelineNewsResponseToJson(
        TimelineNewsResponse instance) =>
    <String, dynamic>{
      'data': instance.data,
      'totalItems': instance.totalItems,
    };
