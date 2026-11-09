import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/auth_controller.dart';
import 'package:flutter_animate/flutter_animate.dart';

class PinLockPage extends ConsumerStatefulWidget {
  final bool isSetup;
  
  const PinLockPage({super.key, this.isSetup = false});

  @override
  ConsumerState<PinLockPage> createState() => _PinLockPageState();
}

class _PinLockPageState extends ConsumerState<PinLockPage> {
  String _pin = '';
  String _confirmPin = '';
  bool _isConfirming = false;
  bool _hasError = false;

  void _onKeyPress(String key) {
    if (_hasError) setState(() => _hasError = false);
    
    if (key == '<') {
      if (_pin.isNotEmpty) {
        setState(() => _pin = _pin.substring(0, _pin.length - 1));
      }
    } else if (_pin.length < 6) {
      setState(() => _pin += key);
      if (_pin.length == 6) {
        _processPin();
      }
    }
  }

  Future<void> _processPin() async {
    final authController = ref.read(authControllerProvider.notifier);

    if (widget.isSetup) {
      if (!_isConfirming) {
        // First entry done, ask for confirm
        setState(() {
          _confirmPin = _pin;
          _pin = '';
          _isConfirming = true;
        });
      } else {
        // Confirming
        if (_pin == _confirmPin) {
          await authController.setPin(_pin);
        } else {
          // Error mismatch
          setState(() {
            _hasError = true;
            _pin = '';
            _confirmPin = '';
            _isConfirming = false;
          });
        }
      }
    } else {
      // Verifying
      final isValid = await authController.verifyPin(_pin);
      if (!isValid) {
        setState(() {
          _hasError = true;
          _pin = '';
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    String title = widget.isSetup 
        ? (_isConfirming ? 'Confirm PIN' : 'Create Master PIN') 
        : 'Enter Master PIN';
    String subtitle = widget.isSetup
        ? 'This PIN encrypts your vault locally.'
        : 'Unlock your vault';

    if (_hasError) {
      subtitle = widget.isSetup ? 'PINs do not match. Try again.' : 'Incorrect PIN. Try again.';
    }

    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: Column(
          children: [
            const Spacer(flex: 2),
            Icon(Icons.lock_outline_rounded, size: 48, color: _hasError ? Colors.redAccent : const Color(0xFF6C63FF))
                .animate(target: _hasError ? 1 : 0)
                .shake(hz: 8, curve: Curves.easeInOutCubic),
            const SizedBox(height: 24),
            Text(
              title,
              style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w800, color: Colors.black87),
            ),
            const SizedBox(height: 8),
            Text(
              subtitle,
              style: TextStyle(fontSize: 14, color: _hasError ? Colors.redAccent : Colors.grey.shade500),
            ),
            const Spacer(),
            _buildPinDots(),
            const Spacer(flex: 2),
            _buildNumpad(),
            const SizedBox(height: 48),
          ],
        ),
      ),
    );
  }

  Widget _buildPinDots() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: List.generate(6, (index) {
        bool isFilled = index < _pin.length;
        return Container(
          margin: const EdgeInsets.symmetric(horizontal: 10),
          width: 16,
          height: 16,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: isFilled ? const Color(0xFF6C63FF) : Colors.grey.shade200,
            border: isFilled ? null : Border.all(color: Colors.grey.shade300, width: 1.5),
          ),
        ).animate(target: isFilled ? 1 : 0).scale(begin: const Offset(1, 1), end: const Offset(1.2, 1.2), duration: 100.ms).then().scale(begin: const Offset(1.2, 1.2), end: const Offset(1, 1));
      }),
    );
  }

  Widget _buildNumpad() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 48.0),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            children: ['1', '2', '3'].map((k) => _buildKey(k)).toList(),
          ),
          const SizedBox(height: 24),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            children: ['4', '5', '6'].map((k) => _buildKey(k)).toList(),
          ),
          const SizedBox(height: 24),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            children: ['7', '8', '9'].map((k) => _buildKey(k)).toList(),
          ),
          const SizedBox(height: 24),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            children: [
              const SizedBox(width: 72, height: 72),
              _buildKey('0'),
              _buildKey('<', icon: Icons.backspace_outlined),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildKey(String value, {IconData? icon}) {
    return GestureDetector(
      onTap: () => _onKeyPress(value),
      child: Container(
        width: 72,
        height: 72,
        decoration: BoxDecoration(
          color: Colors.grey.shade50,
          shape: BoxShape.circle,
        ),
        child: Center(
          child: icon != null
              ? Icon(icon, size: 28, color: Colors.black87)
              : Text(value, style: const TextStyle(fontSize: 28, fontWeight: FontWeight.w500, color: Colors.black87)),
        ),
      ),
    );
  }
}
