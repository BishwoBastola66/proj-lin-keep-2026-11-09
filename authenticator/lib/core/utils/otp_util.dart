import 'package:otp/otp.dart';

class OTPUtil {
  static String generateTOTP(String secret, {int digits = 6, int period = 30, String algorithm = 'SHA1'}) {
    try {
      Algorithm algo = Algorithm.SHA1;
      if (algorithm.toUpperCase() == 'SHA256') algo = Algorithm.SHA256;
      if (algorithm.toUpperCase() == 'SHA512') algo = Algorithm.SHA512;
      
      return OTP.generateTOTPCodeString(
        secret,
        DateTime.now().millisecondsSinceEpoch,
        length: digits,
        interval: period,
        algorithm: algo,
        isGoogle: true,
      );
    } catch (e) {
      return '------';
    }
  }

  static int getRemainingSeconds({int period = 30}) {
    return period - ((DateTime.now().millisecondsSinceEpoch ~/ 1000) % period);
  }
}
