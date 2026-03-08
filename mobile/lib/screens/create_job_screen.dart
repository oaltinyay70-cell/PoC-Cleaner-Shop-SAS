import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/providers.dart';

class CreateJobScreen extends ConsumerStatefulWidget {
  const CreateJobScreen({super.key});

  @override
  ConsumerState<CreateJobScreen> createState() => _CreateJobScreenState();
}

class _CreateJobScreenState extends ConsumerState<CreateJobScreen> {
  final _formKey = GlobalKey<FormState>();
  final _qtyCtrl = TextEditingController();
  final _notesCtrl = TextEditingController();
  DateTime _deliveryDate = DateTime.now().add(const Duration(days: 3));
  String? _selectedCustomerId;
  String? _selectedCustomerName;
  double _customerRate = 0;
  bool _saving = false;
  List<dynamic> _customers = [];

  @override
  void initState() {
    super.initState();
    _loadCustomers();
  }

  Future<void> _loadCustomers() async {
    try {
      final api = ref.read(apiServiceProvider);
      final data = await api.getCustomers(limit: 100);
      if (mounted) setState(() => _customers = data['customers'] ?? []);
    } catch (_) {}
  }

  double get _estimatedPrice {
    final qty = double.tryParse(_qtyCtrl.text) ?? 0;
    return (qty * _customerRate * 100).floorToDouble() / 100;
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    if (_selectedCustomerId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select a customer'), backgroundColor: Colors.redAccent),
      );
      return;
    }
    setState(() => _saving = true);
    try {
      final api = ref.read(apiServiceProvider);
      await api.createJob({
        'customerId': _selectedCustomerId,
        'quantity': double.tryParse(_qtyCtrl.text) ?? 0,
        'expectedDeliveryDate': _deliveryDate.toIso8601String(),
        'notes': _notesCtrl.text.trim().isEmpty ? null : _notesCtrl.text.trim(),
      });
      if (mounted) {
        ref.invalidate(jobsProvider(1));
        Navigator.of(context).pop(true);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Job created ✅'), backgroundColor: Color(0xFF4ADE80)),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e'), backgroundColor: Colors.redAccent),
        );
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  void dispose() {
    _qtyCtrl.dispose();
    _notesCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF1A1A2E),
      appBar: AppBar(
        backgroundColor: Colors.transparent, elevation: 0,
        title: const Text('New Job', style: TextStyle(fontWeight: FontWeight.bold)),
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            // Customer picker
            Text('Customer *', style: TextStyle(color: Colors.white54, fontSize: 13)),
            const SizedBox(height: 8),
            GestureDetector(
              onTap: () => _showCustomerPicker(),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.08),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: _selectedCustomerId != null ? const Color(0xFF00D2FF) : Colors.white12),
                ),
                child: Row(
                  children: [
                    Icon(Icons.person_outline, color: _selectedCustomerId != null ? const Color(0xFF00D2FF) : Colors.white38),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        _selectedCustomerName ?? 'Select customer...',
                        style: TextStyle(
                          color: _selectedCustomerName != null ? Colors.white : Colors.white38,
                          fontSize: 15,
                        ),
                      ),
                    ),
                    if (_customerRate > 0)
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: const Color(0xFF00D2FF).withOpacity(0.15),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text('€${_customerRate.toStringAsFixed(2)}/m²',
                            style: const TextStyle(color: Color(0xFF00D2FF), fontSize: 11, fontWeight: FontWeight.bold)),
                      ),
                    const Icon(Icons.chevron_right, color: Colors.white38),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 14),
            // Quantity
            TextFormField(
              controller: _qtyCtrl,
              keyboardType: TextInputType.number,
              validator: (v) => (double.tryParse(v ?? '') ?? 0) <= 0 ? 'Enter quantity' : null,
              onChanged: (_) => setState(() {}),
              style: const TextStyle(color: Colors.white),
              decoration: _inputDecoration('Quantity (m²) *', Icons.straighten),
            ),

            // Auto-pricing preview
            if (_customerRate > 0 && _qtyCtrl.text.isNotEmpty) ...[
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: const Color(0xFF4ADE80).withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: const Color(0xFF4ADE80).withOpacity(0.2)),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('Estimated Price', style: TextStyle(color: Color(0xFF4ADE80), fontSize: 13)),
                    Text('€${_estimatedPrice.toStringAsFixed(2)}',
                        style: const TextStyle(color: Color(0xFF4ADE80), fontSize: 20, fontWeight: FontWeight.bold)),
                  ],
                ),
              ),
            ],

            const SizedBox(height: 14),
            // Delivery date
            Text('Expected Delivery', style: TextStyle(color: Colors.white54, fontSize: 13)),
            const SizedBox(height: 8),
            GestureDetector(
              onTap: () async {
                final picked = await showDatePicker(
                  context: context,
                  initialDate: _deliveryDate,
                  firstDate: DateTime.now(),
                  lastDate: DateTime.now().add(const Duration(days: 90)),
                );
                if (picked != null) setState(() => _deliveryDate = picked);
              },
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.08),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: Colors.white12),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.calendar_today, color: Colors.white38, size: 20),
                    const SizedBox(width: 12),
                    Text(
                      '${_deliveryDate.day}/${_deliveryDate.month}/${_deliveryDate.year}',
                      style: const TextStyle(color: Colors.white, fontSize: 15),
                    ),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 14),
            TextFormField(
              controller: _notesCtrl,
              maxLines: 2,
              style: const TextStyle(color: Colors.white),
              decoration: _inputDecoration('Notes', Icons.note_outlined),
            ),

            const SizedBox(height: 28),
            SizedBox(
              width: double.infinity, height: 52,
              child: ElevatedButton(
                onPressed: _saving ? null : _save,
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF00D2FF),
                  foregroundColor: const Color(0xFF1A1A2E),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                ),
                child: _saving
                    ? const SizedBox(width: 22, height: 22, child: CircularProgressIndicator(strokeWidth: 2))
                    : const Text('Create Job', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showCustomerPicker() {
    showModalBottomSheet(
      context: context,
      backgroundColor: const Color(0xFF16213E),
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) => ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: _customers.length,
        itemBuilder: (ctx, i) {
          final c = _customers[i];
          return ListTile(
            leading: CircleAvatar(
              backgroundColor: const Color(0xFF00D2FF).withOpacity(0.2),
              child: Text((c['name'] ?? 'U')[0], style: const TextStyle(color: Color(0xFF00D2FF))),
            ),
            title: Text(c['name'] ?? '', style: const TextStyle(color: Colors.white)),
            subtitle: Text('€${(c['ratePerUnit'] ?? 0).toStringAsFixed(2)}/m²', style: const TextStyle(color: Colors.white38)),
            selected: c['id'] == _selectedCustomerId,
            selectedTileColor: const Color(0xFF00D2FF).withOpacity(0.1),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            onTap: () {
              setState(() {
                _selectedCustomerId = c['id'];
                _selectedCustomerName = c['name'];
                _customerRate = (c['ratePerUnit'] ?? 0).toDouble();
              });
              Navigator.pop(ctx);
            },
          );
        },
      ),
    );
  }

  InputDecoration _inputDecoration(String label, IconData icon) {
    return InputDecoration(
      labelText: label,
      labelStyle: const TextStyle(color: Colors.white54),
      prefixIcon: Icon(icon, color: Colors.white38),
      filled: true,
      fillColor: Colors.white.withOpacity(0.08),
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide.none),
      enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: const BorderSide(color: Colors.white12)),
      focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: const BorderSide(color: Color(0xFF00D2FF))),
      errorBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: const BorderSide(color: Colors.redAccent)),
    );
  }
}
