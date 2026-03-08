import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/providers.dart';

class JobListScreen extends ConsumerWidget {
  const JobListScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final jobs = ref.watch(jobsProvider(1));

    return Scaffold(
      backgroundColor: const Color(0xFF1A1A2E),
      appBar: AppBar(
        backgroundColor: Colors.transparent, elevation: 0,
        title: const Text('Jobs', style: TextStyle(fontWeight: FontWeight.bold)),
      ),
      body: jobs.when(
        data: (data) {
          final list = (data['jobs'] as List?) ?? [];
          if (list.isEmpty) {
            return const Center(child: Text('No jobs yet', style: TextStyle(color: Colors.white54)));
          }
          return RefreshIndicator(
            onRefresh: () async => ref.invalidate(jobsProvider(1)),
            child: ListView.builder(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              itemCount: list.length,
              itemBuilder: (ctx, i) => _jobCard(list[i], ref),
            ),
          );
        },
        loading: () => const Center(child: CircularProgressIndicator(color: Color(0xFF00D2FF))),
        error: (e, _) => Center(child: Text('Error: $e', style: const TextStyle(color: Colors.redAccent))),
      ),
      floatingActionButton: FloatingActionButton(
        backgroundColor: const Color(0xFF00D2FF),
        child: const Icon(Icons.add, color: Color(0xFF1A1A2E)),
        onPressed: () {}, // TODO: navigate to create job
      ),
    );
  }

  Widget _jobCard(dynamic job, WidgetRef ref) {
    final status = job['status'] ?? 'RECEIVED';
    final statusColor = switch (status) {
      'RECEIVED' => const Color(0xFFFBBF24),
      'PROCESSING' => const Color(0xFF00D2FF),
      'COMPLETED' => const Color(0xFF4ADE80),
      'DELIVERED' => Colors.white54,
      _ => Colors.white24,
    };
    final statusIcon = switch (status) {
      'RECEIVED' => Icons.inbox,
      'PROCESSING' => Icons.autorenew,
      'COMPLETED' => Icons.check_circle_outline,
      'DELIVERED' => Icons.local_shipping,
      _ => Icons.help_outline,
    };

    final nextStatus = switch (status) {
      'RECEIVED' => 'PROCESSING',
      'PROCESSING' => 'COMPLETED',
      'COMPLETED' => 'DELIVERED',
      _ => null,
    };

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.05),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: statusColor.withOpacity(0.2)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(statusIcon, color: statusColor, size: 20),
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
                decoration: BoxDecoration(
                  color: statusColor.withOpacity(0.15),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(status, style: TextStyle(color: statusColor, fontSize: 11, fontWeight: FontWeight.bold)),
              ),
              const Spacer(),
              Text('€${(job['totalPrice'] ?? 0).toStringAsFixed(2)}',
                  style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
            ],
          ),
          const SizedBox(height: 10),
          Text(job['customer']?['name'] ?? 'Unknown', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w500)),
          const SizedBox(height: 4),
          Text('${job['quantity']} ${job['unit']} × €${(job['rate'] ?? 0).toStringAsFixed(2)}',
              style: const TextStyle(color: Colors.white38, fontSize: 13)),

          if (nextStatus != null) ...[
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              child: OutlinedButton.icon(
                icon: const Icon(Icons.arrow_forward, size: 16),
                label: Text('Advance to $nextStatus'),
                style: OutlinedButton.styleFrom(
                  foregroundColor: statusColor,
                  side: BorderSide(color: statusColor.withOpacity(0.5)),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                ),
                onPressed: () async {
                  try {
                    final api = ref.read(apiServiceProvider);
                    await api.updateJobStatus(job['id'], nextStatus);
                    ref.invalidate(jobsProvider(1));
                  } catch (e) {
                    // Error handling would show a snackbar in production
                  }
                },
              ),
            ),
          ],
        ],
      ),
    );
  }
}
