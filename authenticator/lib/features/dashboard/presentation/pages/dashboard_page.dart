import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';
import '../../../authenticator/presentation/providers/auth_provider.dart';
import '../../../../core/utils/otp_util.dart';
import '../../../vault/presentation/pages/vault_page.dart';
import '../../../settings/presentation/pages/settings_page.dart';
import '../../../authentication/presentation/providers/auth_controller.dart';

class DashboardPage extends ConsumerStatefulWidget {
  const DashboardPage({super.key});

  @override
  ConsumerState<DashboardPage> createState() => _DashboardPageState();
}

class _DashboardPageState extends ConsumerState<DashboardPage> {
  int _currentIndex = 0;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (mounted) setState(() {});
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  Widget _buildDashboardTab(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Security Score Card
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(28),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.03),
                  blurRadius: 24,
                  offset: const Offset(0, 8),
                )
              ],
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Security Score', style: TextStyle(color: Colors.grey.shade500, fontWeight: FontWeight.w600, fontSize: 13)),
                    const SizedBox(height: 6),
                    const Text('Excellent', style: TextStyle(color: Color(0xFF00C896), fontSize: 26, fontWeight: FontWeight.w800, letterSpacing: -0.5)),
                    const SizedBox(height: 12),
                    Text('Last scan: Today, 8:30 AM', style: TextStyle(color: Colors.grey.shade400, fontSize: 11)),
                  ],
                ),
                Stack(
                  alignment: Alignment.center,
                  children: [
                    SizedBox(
                      width: 72,
                      height: 72,
                      child: CircularProgressIndicator(
                        value: 0.92,
                        strokeWidth: 6,
                        backgroundColor: Colors.grey.shade100,
                        strokeCap: StrokeCap.round,
                        valueColor: const AlwaysStoppedAnimation<Color>(Color(0xFF00C896)),
                      ),
                    ),
                    const Text('92', style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: Colors.black87)),
                  ],
                ),
              ],
            ),
          ).animate().slideY(begin: 0.1).fade(),
          
          const SizedBox(height: 32),
          const Text('Quick Actions', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: Colors.black87)),
          const SizedBox(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              _buildQuickAction(Icons.qr_code_scanner_rounded, 'Scan QR', () => context.push('/scanner')),
              _buildQuickAction(Icons.add_rounded, 'Add Account', () => context.push('/add-account')),
              _buildQuickAction(Icons.password_rounded, 'Password', () {}),
              _buildQuickAction(Icons.lock_outline_rounded, 'Vault', () => setState(() => _currentIndex = 2)),
            ],
          ).animate().slideY(begin: 0.1, delay: 100.ms).fade(),

          const SizedBox(height: 36),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('My Codes', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: Colors.black87)),
              TextButton(
                onPressed: () {},
                style: TextButton.styleFrom(
                  padding: EdgeInsets.zero,
                  minimumSize: const Size(50, 30),
                  tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                ),
                child: const Text('See All >', style: TextStyle(color: Color(0xFF6C63FF), fontSize: 13, fontWeight: FontWeight.w600)),
              ),
            ],
          ),
          const SizedBox(height: 12),
          ..._buildAccountsList(context, ref),
          const SizedBox(height: 100), // Space for FAB
        ],
      ),
    );
  }

  Widget _buildQuickAction(IconData icon, String label, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        children: [
          Container(
            width: 64,
            height: 64,
            decoration: BoxDecoration(
              color: const Color(0xFF6C63FF).withOpacity(0.08),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Icon(icon, color: const Color(0xFF6C63FF), size: 28),
          ),
          const SizedBox(height: 8),
          Text(label, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: Colors.black54)),
        ],
      ),
    );
  }

  List<Widget> _buildAccountsList(BuildContext context, WidgetRef ref) {
    final accounts = ref.watch(authAccountsProvider);
    if (accounts.isEmpty) {
      return [
        Center(
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 48.0),
            child: Text(
              'No accounts added yet.\nTap + to add one.',
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.grey.shade400, fontSize: 13),
            ),
          ),
        )
      ];
    }
    
    return accounts.map((account) {
      final code = OTPUtil.generateTOTP(account.secret, digits: account.digits ?? 6, period: account.period ?? 30);
      final remaining = OTPUtil.getRemainingSeconds(period: account.period ?? 30);
      final progress = remaining / (account.period ?? 30);
      
      final formattedCode = code.length == 6 
          ? '${code.substring(0, 3)} ${code.substring(3)}' 
          : code;

      return Container(
        margin: const EdgeInsets.only(bottom: 16),
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(24),
          boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.02), blurRadius: 15, offset: const Offset(0, 5))],
        ),
        child: Row(
          children: [
            Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                color: _getColorForIssuer(account.issuer).withOpacity(0.1),
                shape: BoxShape.circle,
              ),
              child: Center(
                child: Text(
                  account.issuer.isNotEmpty ? account.issuer[0].toUpperCase() : '?', 
                  style: TextStyle(color: _getColorForIssuer(account.issuer), fontWeight: FontWeight.bold, fontSize: 20),
                ),
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(account.issuer, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 15, color: Colors.black87)),
                  const SizedBox(height: 2),
                  Text(account.accountName, style: TextStyle(color: Colors.grey.shade500, fontSize: 11, fontWeight: FontWeight.w500)),
                ],
              ),
            ),
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(formattedCode, style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w900, color: Color(0xFF6C63FF), letterSpacing: 1.0)),
                const SizedBox(height: 6),
                Row(
                  children: [
                    Text('${remaining}s', style: TextStyle(fontSize: 10, color: Colors.grey.shade500, fontWeight: FontWeight.w600)),
                    const SizedBox(width: 6),
                    SizedBox(
                      width: 12,
                      height: 12,
                      child: CircularProgressIndicator(
                        value: progress,
                        strokeWidth: 2.5,
                        backgroundColor: Colors.grey.shade200,
                        valueColor: AlwaysStoppedAnimation<Color>(remaining < 5 ? const Color(0xFFFF4C4C) : const Color(0xFF6C63FF)),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ],
        ),
      ).animate().fade().slideX(begin: 0.1);
    }).toList();
  }

  Color _getColorForIssuer(String issuer) {
    final i = issuer.toLowerCase();
    if (i.contains('google')) return const Color(0xFFEA4335);
    if (i.contains('github')) return const Color(0xFF333333);
    if (i.contains('microsoft')) return const Color(0xFF00A4EF);
    if (i.contains('binance')) return const Color(0xFFF3BA2F);
    return const Color(0xFF6C63FF);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8F9FA),
      body: SafeArea(
        child: Column(
          children: [
            // Custom Header
            Padding(
              padding: const EdgeInsets.fromLTRB(24, 16, 24, 16),
              child: Row(
                children: [
                  // Avatar Profile Picture
                  Container(
                    width: 44,
                    height: 44,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      image: const DecorationImage(
                        image: NetworkImage('https://i.pravatar.cc/150?img=11'), // Sample avatar
                        fit: BoxFit.cover,
                      ),
                      boxShadow: [
                        BoxShadow(color: Colors.black.withOpacity(0.1), blurRadius: 10, offset: const Offset(0, 4))
                      ],
                    ),
                  ),
                  const SizedBox(width: 16),
                  // Greeting text
                  Expanded(
                    child: Consumer(
                      builder: (context, ref, _) {
                        final emailAsync = ref.watch(authEmailProvider);
                        final email = emailAsync.valueOrNull ?? 'User';
                        final shortName = email.split('@').first;
                        return Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('Good Morning,', style: TextStyle(fontSize: 12, color: Colors.grey, fontWeight: FontWeight.w500)),
                            Text(shortName, style: const TextStyle(fontSize: 16, color: Colors.black87, fontWeight: FontWeight.w800)),
                          ],
                        );
                      },
                    ),
                  ),
                  // Bell Icon
                  IconButton(
                    icon: const Icon(Icons.notifications_none_rounded, color: Colors.black87, size: 28),
                    onPressed: () {},
                  ),
                ],
              ),
            ),
            // Body Content
            Expanded(
              child: IndexedStack(
                index: _currentIndex,
                children: [
                  _buildDashboardTab(context),
                  _buildDashboardTab(context), // Authenticator Tab placeholder
                  const VaultPage(),
                  const SettingsPage(),
                ],
              ),
            ),
          ],
        ),
      ),
      floatingActionButtonLocation: FloatingActionButtonLocation.centerDocked,
      floatingActionButton: Container(
        margin: const EdgeInsets.only(top: 32),
        height: 64,
        width: 64,
        child: FloatingActionButton(
          onPressed: () {
            showModalBottomSheet(
              context: context,
              backgroundColor: Colors.white,
              shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(32))),
              builder: (context) => SafeArea(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16.0),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const SizedBox(height: 12),
                      Container(width: 48, height: 5, decoration: BoxDecoration(color: Colors.grey.shade300, borderRadius: BorderRadius.circular(10))),
                      const SizedBox(height: 24),
                      ListTile(
                        leading: Container(
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(color: const Color(0xFF6C63FF).withOpacity(0.1), borderRadius: BorderRadius.circular(12)),
                          child: const Icon(Icons.qr_code_scanner_rounded, color: Color(0xFF6C63FF)),
                        ),
                        title: const Text('Scan QR Code', style: TextStyle(fontWeight: FontWeight.w700)),
                        onTap: () {
                          context.pop();
                          context.push('/scanner');
                        },
                      ),
                      const SizedBox(height: 8),
                      ListTile(
                        leading: Container(
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(color: Colors.grey.shade100, borderRadius: BorderRadius.circular(12)),
                          child: Icon(Icons.keyboard_rounded, color: Colors.grey.shade600),
                        ),
                        title: const Text('Enter Manually', style: TextStyle(fontWeight: FontWeight.w700)),
                        onTap: () {
                          context.pop();
                          context.push('/add-account');
                        },
                      ),
                      const SizedBox(height: 32),
                    ],
                  ),
                ),
              ),
            );
          },
          backgroundColor: const Color(0xFF6C63FF),
          elevation: 8,
          highlightElevation: 12,
          shape: const CircleBorder(),
          child: const Icon(Icons.add_rounded, color: Colors.white, size: 36),
        ),
      ),
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 20, offset: const Offset(0, -5))],
        ),
        child: BottomAppBar(
          shape: const CircularNotchedRectangle(),
          notchMargin: 10.0,
          color: Colors.white,
          elevation: 0,
          child: SizedBox(
            height: 60,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _buildNavItem(Icons.home_filled, 0),
                _buildNavItem(Icons.grid_view_rounded, 1),
                const SizedBox(width: 48), // Space for FAB
                _buildNavItem(Icons.lock_outline_rounded, 2),
                _buildNavItem(Icons.person_outline_rounded, 3),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildNavItem(IconData icon, int index) {
    final isSelected = _currentIndex == index;
    return IconButton(
      icon: Icon(
        icon, 
        color: isSelected ? const Color(0xFF6C63FF) : Colors.grey.shade400, 
        size: 28,
      ),
      onPressed: () => setState(() => _currentIndex = index),
    );
  }
}
