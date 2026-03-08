import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/providers.dart';
import 'create_customer_screen.dart';
import 'create_job_screen.dart';
import 'create_expense_screen.dart';

class DashboardScreen extends ConsumerWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profile = ref.watch(profileProvider);
    final report = ref.watch(monthlyReportProvider);

    return Scaffold(
      backgroundColor: const Color(0xFF1A1A2E),
      appBar: AppBar(
        backgroundColor: Colors.transparent, elevation: 0,
        title: profile.when(
          data: (p) => Text(p['businessName'] ?? 'Dashboard', style: const TextStyle(fontWeight: FontWeight.bold)),
          loading: () => const Text('Loading...'),
          error: (_, __) => const Text('Dashboard'),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () => ref.read(authStateProvider.notifier).logout(),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(profileProvider);
          ref.invalidate(monthlyReportProvider);
        },
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            // Monthly Stats
            report.when(
              data: (r) => _buildStatsGrid(r),
              loading: () => const Center(child: Padding(
                padding: EdgeInsets.all(40),
                child: CircularProgressIndicator(color: Color(0xFF00D2FF)),
              )),
              error: (e, _) => _errorCard('Report error: $e'),
            ),

            const SizedBox(height: 24),

            // Quick Actions
            Text('Quick Actions', style: Theme.of(context).textTheme.titleMedium?.copyWith(
              color: Colors.white, fontWeight: FontWeight.bold,
            )),
            const SizedBox(height: 12),
            _buildQuickActions(context),
          ],
        ),
      ),
    );
  }

  Widget _buildStatsGrid(Map<String, dynamic> report) {
    return GridView.count(
      crossAxisCount: 2,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      mainAxisSpacing: 12,
      crossAxisSpacing: 12,
      childAspectRatio: 1.5,
      children: [
        _statCard('Revenue', '€${(report['revenue'] ?? 0).toStringAsFixed(2)}', Icons.trending_up, const Color(0xFF00D2FF)),
        _statCard('Expenses', '€${(report['expenses'] ?? 0).toStringAsFixed(2)}', Icons.receipt_long, const Color(0xFFFF6B6B)),
        _statCard('Profit', '€${(report['profit'] ?? 0).toStringAsFixed(2)}', Icons.account_balance_wallet,
            (report['profit'] ?? 0) >= 0 ? const Color(0xFF4ADE80) : const Color(0xFFFF6B6B)),
        _statCard('Jobs', '${report['jobCount'] ?? 0}', Icons.work_outline, const Color(0xFFFBBF24)),
      ],
    );
  }

  Widget _statCard(String label, String value, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: color.withOpacity(0.2)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Icon(icon, color: color, size: 24),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(value, style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
              Text(label, style: TextStyle(color: Colors.white54, fontSize: 12)),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildQuickActions(BuildContext context) {
    return Row(
      children: [
        Expanded(child: _actionButton('New Job', Icons.add_circle_outline, const Color(0xFF00D2FF), () {
          Navigator.of(context).push(MaterialPageRoute(builder: (_) => const CreateJobScreen()));
        })),
        const SizedBox(width: 12),
        Expanded(child: _actionButton('Add Customer', Icons.person_add_outlined, const Color(0xFF4ADE80), () {
          Navigator.of(context).push(MaterialPageRoute(builder: (_) => const CreateCustomerScreen()));
        })),
        const SizedBox(width: 12),
        Expanded(child: _actionButton('Add Expense', Icons.receipt_outlined, const Color(0xFFFBBF24), () {
          Navigator.of(context).push(MaterialPageRoute(builder: (_) => const CreateExpenseScreen()));
        })),
      ],
    );
  }

  Widget _actionButton(String label, IconData icon, Color color, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 16),
        decoration: BoxDecoration(
          color: color.withOpacity(0.1),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: color.withOpacity(0.3)),
        ),
        child: Column(
          children: [
            Icon(icon, color: color, size: 28),
            const SizedBox(height: 6),
            Text(label, style: TextStyle(color: color, fontSize: 11, fontWeight: FontWeight.w600), textAlign: TextAlign.center),
          ],
        ),
      ),
    );
  }

  Widget _errorCard(String msg) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(color: Colors.redAccent.withOpacity(0.1), borderRadius: BorderRadius.circular(12)),
      child: Text(msg, style: const TextStyle(color: Colors.redAccent)),
    );
  }

}
