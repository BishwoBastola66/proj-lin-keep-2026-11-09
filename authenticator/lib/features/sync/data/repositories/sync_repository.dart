import '../../../../core/api/api_client.dart';
import '../../../../core/security/encryption_service.dart';
import '../../../authenticator/data/repositories/local_auth_repository.dart';
import '../../../authenticator/domain/models/authenticator_account.dart';

class SyncRepository {
  final ApiClient apiClient;
  final EncryptionService _encryptionService;
  final LocalAuthRepository _localAuthRepository;

  SyncRepository(this.apiClient, this._encryptionService, this._localAuthRepository);

  /// Pushes all locally stored, E2E encrypted secrets to the cloud
  Future<void> pushSync() async {
    try {
      final List<AuthenticatorAccount> localAccounts = _localAuthRepository.getAccounts();
      
      final List<Map<String, dynamic>> encryptedAccountsPayload = localAccounts.map((acc) {
        // Here we do End-to-End Encryption before sending over network
        final encryptedSecret = _encryptionService.encryptData(acc.secret);
        
        return {
          'id': acc.id,
          'encryptedSecret': encryptedSecret,
          'accountName': acc.accountName,
          'issuer': acc.issuer,
        };
      }).toList();

      // Send to Vercel Backend
      await apiClient.post('/sync/push', {
        'authenticatorAccounts': encryptedAccountsPayload,
        'vaultItems': [], // Vault items sync logic would go here
      });
      
      print("Sync pushed to cloud successfully.");
    } catch (e) {
      print("Sync failed: \$e");
      rethrow;
    }
  }
}
