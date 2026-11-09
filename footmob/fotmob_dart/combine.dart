import 'dart:io';

void main() {
  final dir = Directory('lib/src/models');
  final files = dir.listSync().whereType<File>().toList();

  for (final file in files) {
    if (!file.path.endsWith('.g.dart') && file.path.endsWith('.dart') && !file.path.endsWith('models.dart')) {
      final mainPath = file.path;
      final gPath = mainPath.replaceFirst('.dart', '.g.dart');
      
      final gFile = File(gPath);
      if (gFile.existsSync()) {
        print('Combining \$gPath into \$mainPath');
        
        // Read main file
        String mainContent = file.readAsStringSync();
        mainContent = mainContent.replaceAll(RegExp(r"part '[^']+';\n"), '');
        // We can optionally remove @JsonSerializable() but it doesn't hurt to leave them if json_annotation is kept.
        // Actually, let's remove it so we can drop the dependency.
        mainContent = mainContent.replaceAll('@JsonSerializable()\n', '');
        
        // Read generated file
        String gContent = gFile.readAsStringSync();
        // Remove the `part of` line and headers
        gContent = gContent.replaceFirst(RegExp(r"// GENERATED CODE - DO NOT MODIFY BY HAND\n+"), '');
        gContent = gContent.replaceFirst(RegExp(r"// \*{70}\n// JsonSerializableGenerator\n// \*{70}\n+"), '');
        gContent = gContent.replaceAll(RegExp(r"part of '[^']+';\n+"), '');
        
        // Combine
        file.writeAsStringSync('\$mainContent\n\$gContent');
        
        // Delete generated file
        gFile.deleteSync();
      }
    }
  }
  print('Done combining!');
}
