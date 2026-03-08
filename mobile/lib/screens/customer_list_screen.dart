import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/providers.dart';

class CustomerListScreen extends ConsumerWidget {
  const CustomerListScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final customers = ref.watch(customersProvider(1));

    return Scaffold(
      backgroundColor: const Color(0xFF1A1A2E),
      appBar: AppBar(
        backgroundColor: Colors.transparent, elevation: 0,
        title: const Text('Customers', style: TextStyle(fontWeight: FontWeight.bold)),
      ),
      body: customers.when(
        data: (data) {
          final list = (data['customers'] as List?) ?? [];
          if (list.isEmpty) {
            return const Center(child: Text('No customers yet', style: TextStyle(color: Colors.white54)));
          }
          return RefreshIndicator(
            onRefresh: () async => ref.invalidate(customersProvider(1)),
            child: ListView.builder(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              itemCount: list.length,
              itemBuilder: (ctx, i) => _customerCard(list[i]),
            ),
          );
        },
        loading: () => const Center(child: CircularProgressIndicator(color: Color(0xFF00D2FF))),
        error: (e, _) => Center(child: Text('Error: $e', style: const TextStyle(color: Colors.redAccent))),
      ),
      floatingActionButton: FloatingActionButton(
        backgroundColor: const Color(0xFF00D2FF),
        child: const Icon(Icons.person_add, color: Color(0xFF1A1A2E)),
        onPressed: () {}, // TODO: navigate to create customer
      ),
    );
  }

  Widget _customerCard(dynamic customer) {
    final channel = customer['preferredChannel'] ?? 'NONE';
    final channelIcon = switch (channel) {
      'WHATSAPP' => Icons.chat,
      'SMS' => Icons.sms,
      'VIBER' => Icons.message,
      _ => Icons.do_not_disturb,
    };
    final channelColor = switch (channel) {
      'WHATSAPP' => const Color(0xFF25D366),
      'SMS' => const Color(0xFF00D2FF),
      'VIBER' => const Color(0xFF665CAC),
      _ => Colors.white24,
    };

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.05),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Colors.white.withOpacity(0.08)),
      ),
      child: Row(
        children: [
          CircleAvatar(
            backgroundColor: const Color(0xFF00D2FF).withOpacity(0.2),
            child: Text(
              (customer['name'] ?? 'U')[0].toUpperCase(),
              style: const TextStyle(color: Color(0xFF00D2FF), fontWeight: FontWeight.bold),
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(customer['name'] ?? '', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600)),
                const SizedBox(height: 4),
                Text(customer['phone'] ?? '', style: const TextStyle(color: Colors.white38, fontSize: 13)),
              ],
            ),
          ),
          Icon(channelIcon, color: channelColor, size: 20),
        ],
      ),
    );
  }
}
