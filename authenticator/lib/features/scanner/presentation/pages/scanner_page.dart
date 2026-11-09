import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../authenticator/presentation/providers/auth_provider.dart';

class ScannerPage extends ConsumerStatefulWidget {
  const ScannerPage({super.key});

  @override
  ConsumerState<ScannerPage> createState() => _ScannerPageState();
}

class _ScannerPageState extends ConsumerState<ScannerPage> {
  final MobileScannerController controller = MobileScannerController();
  bool isScanCompleted = false;

  void closeScreen() {
    isScanCompleted = false;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        title: const Text('Scan QR Code', style: TextStyle(color: Colors.white)),
        iconTheme: const IconThemeData(color: Colors.white),
        actions: [
          IconButton(
            color: Colors.white,
            icon: ValueListenableBuilder(
              valueListenable: controller.torchState,
              builder: (context, state, child) {
                switch (state) {
                  case TorchState.off:
                    return const Icon(Icons.flash_off, color: Colors.grey);
                  case TorchState.on:
                    return const Icon(Icons.flash_on, color: Colors.yellow);
                }
              },
            ),
            iconSize: 32.0,
            onPressed: () => controller.toggleTorch(),
          ),
          IconButton(
            color: Colors.white,
            icon: ValueListenableBuilder(
              valueListenable: controller.cameraFacingState,
              builder: (context, state, child) {
                return const Icon(Icons.flip_camera_ios);
              },
            ),
            iconSize: 32.0,
            onPressed: () => controller.switchCamera(),
          ),
        ],
      ),
      body: Stack(
        alignment: Alignment.center,
        children: [
          MobileScanner(
            controller: controller,
            onDetect: (capture) {
              if (!isScanCompleted) {
                final List<Barcode> barcodes = capture.barcodes;
                for (final barcode in barcodes) {
                  final String? rawValue = barcode.rawValue;
                  if (rawValue != null && rawValue.startsWith('otpauth://')) {
                    isScanCompleted = true;
                    _processOtpUri(rawValue);
                    break;
                  }
                }
              }
            },
          ),
          // Beautiful Animated Scanner Frame
          Container(
            width: 250,
            height: 250,
            decoration: BoxDecoration(
              border: Border.all(color: Theme.of(context).colorScheme.primary, width: 3),
              borderRadius: BorderRadius.circular(24),
              boxShadow: [
                BoxShadow(
                  color: Theme.of(context).colorScheme.primary.withOpacity(0.2),
                  blurRadius: 20,
                  spreadRadius: 5,
                )
              ],
            ),
          ),
        ],
      ),
    );
  }

  void _processOtpUri(String uriString) {
    try {
      final uri = Uri.parse(uriString);
      if (uri.scheme == 'otpauth' && uri.authority == 'totp') {
        final pathSegments = uri.path.split('/');
        String accountName = pathSegments.length > 1 ? pathSegments[1] : 'Unknown';
        
        final queryParams = uri.queryParameters;
        final secret = queryParams['secret'] ?? '';
        final issuer = queryParams['issuer'] ?? accountName.split(':').first;

        if (secret.isNotEmpty) {
           ref.read(authAccountsProvider.notifier).addAccount(
            issuer: issuer,
            accountName: accountName,
            secret: secret,
          );
          
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Account $issuer added successfully!')),
          );
          context.pop();
        } else {
          _showError('Invalid QR Code: No secret found');
        }
      } else {
        _showError('Invalid QR Code format. Please scan a valid TOTP QR.');
      }
    } catch (e) {
      _showError('Failed to parse QR code.');
    }
  }

  void _showError(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message, style: const TextStyle(color: Colors.white)), backgroundColor: Colors.red),
    );
    Future.delayed(const Duration(seconds: 2), () {
      if (mounted) {
        setState(() {
          isScanCompleted = false;
        });
      }
    });
  }
}
