import 'package:json_annotation/json_annotation.dart';

part 'audio.g.dart';

@JsonSerializable()
class AudioMatchItem {
  final String id;
  final List<String> langs;

  AudioMatchItem({
    required this.id,
    required this.langs,
  });

  factory AudioMatchItem.fromJson(Map<String, dynamic> json) => _$AudioMatchItemFromJson(json);
  Map<String, dynamic> toJson() => _$AudioMatchItemToJson(this);
}
