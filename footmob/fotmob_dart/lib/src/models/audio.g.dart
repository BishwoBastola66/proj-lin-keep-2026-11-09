// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'audio.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

AudioMatchItem _$AudioMatchItemFromJson(Map<String, dynamic> json) =>
    AudioMatchItem(
      id: json['id'] as String,
      langs: (json['langs'] as List<dynamic>).map((e) => e as String).toList(),
    );

Map<String, dynamic> _$AudioMatchItemToJson(AudioMatchItem instance) =>
    <String, dynamic>{
      'id': instance.id,
      'langs': instance.langs,
    };
