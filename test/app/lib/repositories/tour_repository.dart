class TourRepository {
  Future<String> fetchFact() async {
    await Future.delayed(const Duration(seconds: 1));
    return 'CubePod makes Flutter development fast and predictable!';
  }
}
