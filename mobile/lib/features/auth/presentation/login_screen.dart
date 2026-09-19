import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../../app/theme/app_colors.dart';
import 'package:restaurant_mobile/features/auth/presentation/auth_provider.dart';
import '../domain/user_model.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _emailController = TextEditingController(text: 'customer@kingsofwings.com');
  final _passwordController = TextEditingController(text: 'SecretPass123!');
  bool _isSignUp = false;
  final _nameController = TextEditingController(text: 'Alex Reynolds');

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    _nameController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final auth = context.read<AuthProvider>();
    bool success;
    if (_isSignUp) {
      success = await auth.signUpWithEmail(
        _emailController.text.trim(),
        _passwordController.text.trim(),
        _nameController.text.trim(),
      );
    } else {
      success = await auth.signInWithEmail(
        _emailController.text.trim(),
        _passwordController.text.trim(),
      );
    }

    if (success && mounted) {
      final role = auth.currentUser?.role ?? UserRole.customer;
      switch (role) {
        case UserRole.staff:
          context.go('/staff');
          break;
        case UserRole.kitchen:
          context.go('/kds');
          break;
        case UserRole.manager:
        case UserRole.admin:
        case UserRole.owner:
          context.go('/manager');
          break;
        case UserRole.customer:
          context.go('/home');
          break;
      }
    }
  }

  void _quickFillPersona(String email, UserRole role) {
    setState(() {
      _emailController.text = email;
    });
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SizedBox(height: 20),
              // Brand Mark
              Center(
                child: Container(
                  width: 64,
                  height: 64,
                  decoration: BoxDecoration(
                    color: AppColors.primary,
                    borderRadius: BorderRadius.circular(20),
                    boxShadow: AppShadows.glowPrimary,
                  ),
                  child: const Center(
                    child: Text('🔥', style: TextStyle(fontSize: 32)),
                  ),
                ),
              ),
              const SizedBox(height: 24),
              Text(
                _isSignUp ? 'Create Account' : 'Welcome Back',
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.displayMedium,
              ),
              const SizedBox(height: 8),
              Text(
                _isSignUp
                    ? 'Join Kings of Wings for exclusive deals & instant pickup'
                    : 'Sign in to access your table sessions, orders & rewards',
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.bodyMedium,
              ),
              const SizedBox(height: 36),

              if (auth.errorMessage != null)
                Container(
                  padding: const EdgeInsets.all(12),
                  margin: const EdgeInsets.only(bottom: 20),
                  decoration: BoxDecoration(
                    color: AppColors.error.withOpacity(0.15),
                    borderRadius: BorderRadius.circular(AppRadius.md),
                    border: const Border(left: BorderSide(color: AppColors.error, width: 3)),
                  ),
                  child: Row(
                    children: [
                      const Icon(LucideIcons.alertCircle, color: AppColors.error, size: 20),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Text(
                          auth.errorMessage!,
                          style: const TextStyle(color: AppColors.error, fontSize: 13),
                        ),
                      ),
                    ],
                  ),
                ),

              if (_isSignUp) ...[
                TextField(
                  controller: _nameController,
                  decoration: const InputDecoration(
                    labelText: 'Full Name',
                    prefixIcon: Icon(LucideIcons.user, size: 20),
                  ),
                ),
                const SizedBox(height: 16),
              ],

              TextField(
                controller: _emailController,
                keyboardType: TextInputType.emailAddress,
                decoration: const InputDecoration(
                  labelText: 'Email Address',
                  prefixIcon: Icon(LucideIcons.mail, size: 20),
                ),
              ),
              const SizedBox(height: 16),

              TextField(
                controller: _passwordController,
                obscureText: true,
                decoration: const InputDecoration(
                  labelText: 'Password',
                  prefixIcon: Icon(LucideIcons.lock, size: 20),
                ),
              ),
              const SizedBox(height: 24),

              ElevatedButton(
                onPressed: auth.isLoading ? null : _submit,
                child: auth.isLoading
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                      )
                    : Text(_isSignUp ? 'REGISTER ACCOUNT' : 'SIGN IN'),
              ),
              const SizedBox(height: 16),

              TextButton(
                onPressed: () {
                  setState(() {
                    _isSignUp = !_isSignUp;
                  });
                },
                child: Text(
                  _isSignUp
                      ? 'Already have an account? Sign In'
                      : "Don't have an account? Register Now",
                  style: const TextStyle(color: AppColors.textBrand),
                ),
              ),

              const SizedBox(height: 32),
              const Divider(),
              const SizedBox(height: 20),

              Text(
                'QUICK DEMO PERSONAS',
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.labelSmall?.copyWith(
                      color: AppColors.textTertiary,
                      letterSpacing: 1.5,
                    ),
              ),
              const SizedBox(height: 12),

              Wrap(
                spacing: 8,
                runSpacing: 8,
                alignment: WrapAlignment.center,
                children: [
                  _personaChip('Customer', 'customer@kow.com', UserRole.customer),
                  _personaChip('Staff / Server', 'staff@kow.com', UserRole.staff),
                  _personaChip('Kitchen / KDS', 'kitchen@kow.com', UserRole.kitchen),
                  _personaChip('Floor Manager', 'manager@kow.com', UserRole.manager),
                  _personaChip('Owner / Admin', 'owner@kow.com', UserRole.owner),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _personaChip(String label, String email, UserRole role) {
    return ActionChip(
      label: Text(label, style: const TextStyle(fontSize: 12)),
      backgroundColor: AppColors.surfaceElevated,
      side: const BorderSide(color: AppColors.border),
      onPressed: () => _quickFillPersona(email, role),
    );
  }
}
