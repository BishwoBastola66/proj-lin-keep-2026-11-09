import 'package:flutter/widgets.dart';
import 'package:cubepod/cubepod.dart';
import '../repositories/tour_repository.dart';

CubeQuery<String> getFactQuery(BuildContext context) {
  return CubeQuery<String>(
    queryFn: () async {
      final repo = context.get<TourRepository>();
      return await repo.fetchFact();
    },
  );
}
