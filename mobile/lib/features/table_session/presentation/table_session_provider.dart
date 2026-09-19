import 'package:flutter/material.dart';

enum SessionStatus { lobby, active, ordering, billing, closed }

class TableSessionProvider extends ChangeNotifier {
  String? _currentSessionId;
  String? _tableNumber;
  String? _section;
  SessionStatus _status = SessionStatus.closed;
  String? _hostName;
  final List<String> _participants = [];

  String? get currentSessionId => _currentSessionId;
  String? get tableNumber => _tableNumber;
  String? get section => _section;
  SessionStatus get status => _status;
  String? get hostName => _hostName;
  List<String> get participants => _participants;
  bool get hasActiveSession => _currentSessionId != null && _status != SessionStatus.closed;

  void joinTable({
    required String tableNumber,
    String section = 'Main Dining Hall',
    String? guestName,
  }) {
    _tableNumber = tableNumber;
    _section = section;
    _currentSessionId = 'sess-tbl-$tableNumber-${DateTime.now().millisecondsSinceEpoch}';
    _status = SessionStatus.active;
    _hostName = guestName ?? 'Lead Guest';
    _participants.clear();
    _participants.add(_hostName!);
    notifyListeners();
  }

  void leaveTable() {
    _currentSessionId = null;
    _tableNumber = null;
    _section = null;
    _status = SessionStatus.closed;
    _participants.clear();
    notifyListeners();
  }
}
