import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../../../core/api/api_client.dart';
import '../../../../core/security/encryption_service.dart';
import '../../../sync/data/repositories/sync_repository.dart';
import '../../../authenticator/presentation/providers/auth_provider.dart';

final syncRepositoryProvider = Provider<SyncRepository>((ref) {
  final localAuthRepo = ref.watch(localAuthRepositoryProvider);
  return SyncRepository(ApiClient(), EncryptionService(), localAuthRepo);
});

class SettingsPage extends ConsumerStatefulWidget {
  const SettingsPage({super.key});

  @override
  ConsumerState<SettingsPage> createState() => _SettingsPageState();
}

class _SettingsPageState extends ConsumerState<SettingsPage> {
  bool isSyncing = false;
  bool isCloudSyncEnabled = false;

  Future<void> _toggleCloudSync(bool value) async {
    setState(() => isSyncing = true);
    
    if (value) {
      try {
        final syncRepo = ref.read(syncRepositoryProvider);
        // Simulate login by setting a fake token
        // In real app, user logs in first
        syncRepo.apiClient.setToken('fake-jwt-token-for-testing');
        await syncRepo.pushSync();
        
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('E2EE Sync to Cloud Successful!', style: TextStyle(color: Colors.white)), backgroundColor: Colors.green),
          );
        }
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Sync failed: backend not running', style: TextStyle(color: Colors.white)), backgroundColor: Colors.red),
          );
          value = false;
        }
      }
    }
    
    if (mounted) {
      setState(() {
        isCloudSyncEnabled = value;
        isSyncing = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Settings'),
        backgroundColor: Colors.transparent,
      ),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(24),
          children: [
            // User Profile Section
            Row(
              children: [
                const CircleAvatar(
                  radius: 32,
                  backgroundColor: Colors.blueAccent,
                  child: Text('U', style: TextStyle(color: Colors.white, fontSize: 24)),
                ),
                const SizedBox(width: 16),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('User', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 4),
                    Text('Free Plan', style: TextStyle(color: Theme.of(context).colorScheme.primary)),
                  ],
                ),
                const Spacer(),
                ElevatedButton(
                  onPressed: () {},
                  style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  ),
                  child: const Text('Upgrade'),
                ),
              ],
            ).animate().fade().slideY(begin: 0.1),
            const SizedBox(height: 32),
            
            _buildSectionHeader(context, 'Security'),
            _buildSettingTile(context, Icons.fingerprint, 'Biometric Lock', 'Require FaceID/TouchID to open', trailing: Switch(value: true, onChanged: (v){})),
            _buildSettingTile(context, Icons.visibility_off, 'Hide OTP Codes', 'Tap to reveal codes', trailing: Switch(value: false, onChanged: (v){})),
            
            const SizedBox(height: 24),
            _buildSectionHeader(context, 'Sync & Backup'),
            _buildSettingTile(
              context, 
              Icons.cloud_sync, 
              'Cloud Sync', 
              isSyncing ? 'Syncing...' : 'Sync accounts across devices', 
              trailing: Switch(
                value: isCloudSyncEnabled, 
                onChanged: isSyncing ? null : _toggleCloudSync,
              ),
            ),
            _buildSettingTile(context, Icons.download, 'Export Accounts', 'Backup to encrypted file'),
            
            const SizedBox(height: 24),
            _buildSectionHeader(context, 'General'),
            _buildSettingTile(context, Icons.dark_mode, 'Dark Mode', 'System Default'),
            _buildSettingTile(context, Icons.business, 'Business Workspace', 'Switch to enterprise mode'),
            _buildSettingTile(context, Icons.info_outline, 'About Vault X', 'Version 1.0.0'),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionHeader(BuildContext context, String title) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8.0, left: 8.0),
      child: Text(
        title,
        style: TextStyle(
          fontWeight: FontWeight.bold,
          color: Theme.of(context).colorScheme.primary,
        ),
      ),
    ).animate().fade();
  }

  Widget _buildSettingTile(BuildContext context, IconData icon, String title, String subtitle, {Widget? trailing}) {
    return ListTile(
      leading: Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: Theme.of(context).colorScheme.primary.withOpacity(0.1),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Icon(icon, color: Theme.of(context).colorScheme.primary),
      ),
      title: Text(title, style: const TextStyle(fontWeight: FontWeight.bold)),
      subtitle: Text(subtitle, style: const TextStyle(fontSize: 12)),
      trailing: trailing ?? const Icon(Icons.chevron_right),
      onTap: trailing == null ? () {} : null,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
    ).animate().fade().slideX(begin: 0.05);
  }
}
