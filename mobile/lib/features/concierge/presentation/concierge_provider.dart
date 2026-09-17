import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import '../../../app/config/app_config.dart';
import '../../menu/domain/menu_item_model.dart';

class ConciergeMessage {
  final String text;
  final bool isUser;
  final DateTime timestamp;
  final List<String> suggestions;

  const ConciergeMessage({
    required this.text,
    required this.isUser,
    required this.timestamp,
    this.suggestions = const [],
  });
}

class ConciergeProvider extends ChangeNotifier {
  final List<ConciergeMessage> _messages = [];
  bool _isTyping = false;

  List<ConciergeMessage> get messages => _messages;
  bool get isTyping => _isTyping;

  ConciergeProvider() {
    _messages.add(
      ConciergeMessage(
        text: "Hey! I'm Spark AI, your dedicated wing master & flavor concierge. Are you ordering Dine-In or Takeaway today?",
        isUser: false,
        timestamp: DateTime.now(),
        suggestions: [
          'What is best for takeaway?',
          'Recommend spicy wings under ₹500',
          'I want something boneless & sweet',
        ],
      ),
    );
  }

  Future<void> sendMessage(String text, {required SalesChannel currentChannel}) async {
    if (text.trim().isEmpty) return;

    _messages.add(
      ConciergeMessage(
        text: text,
        isUser: true,
        timestamp: DateTime.now(),
      ),
    );
    _isTyping = true;
    notifyListeners();

    try {
      // Direct integration with backend server AI proxy if running
      final uri = Uri.parse('${AppConfig.backendApiUrl}/api/ai/concierge');
      final response = await http
          .post(
            uri,
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode({
              'prompt': text,
              'channel': currentChannel == SalesChannel.takeaway ? 'TAKEAWAY' : 'DINE_IN',
              'context': {
                'salesChannel': currentChannel.name,
              },
            }),
          )
          .timeout(const Duration(seconds: 4));

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final aiReply = data['reply'] ?? data['text'] ?? 'Here are my top recommendations for you!';
        _messages.add(
          ConciergeMessage(
            text: aiReply,
            isUser: false,
            timestamp: DateTime.now(),
            suggestions: currentChannel == SalesChannel.takeaway
                ? ['Add to Takeaway Cart', 'What is the packaging fee?', 'How long is pickup?']
                : ['Add to Table Order', 'Call Waiter', 'View Full Menu'],
          ),
        );
      } else {
        _respondWithDeterministicAi(text, currentChannel);
      }
    } catch (e) {
      _respondWithDeterministicAi(text, currentChannel);
    } finally {
      _isTyping = false;
      notifyListeners();
    }
  }

  void _respondWithDeterministicAi(String text, SalesChannel channel) {
    final lower = text.toLowerCase();
    String response;
    List<String> suggestions = [];

    if (lower.contains('takeaway') || lower.contains('pickup')) {
      response =
          "For Takeaway, our Classic Buffalo Fire Wings (₹329) and Truffle Mac & Cheese Bombs (₹249) travel exceptionally well! All takeaway orders include vented thermal foil packaging (₹15) to maintain crunch for up to 35 minutes.";
      suggestions = ['Order Buffalo Wings', 'Order Mac & Cheese', 'View Takeaway Menu'];
    } else if (lower.contains('spice') || lower.contains('hot') || lower.contains('reaper')) {
      response =
          "If you dare, the Smoked Honey Reaper Glaze is clocked at 150,000 Scoville Heat Units! We recommend pairing it with a side of Cool Ranch dip and Craft Blood Orange Soda to tame the burn.";
      suggestions = ['Show Reaper Wings', 'Add Blood Orange Soda'];
    } else if (lower.contains('under') || lower.contains('500') || lower.contains('budget')) {
      response =
          "Under ₹500, grab a 10-piece Garlic Parmesan Crisp (${channel == SalesChannel.takeaway ? '₹319' : '₹329'}) plus our Craft Blood Orange Soda (₹149). An unbeatable combo!";
      suggestions = ['Show Garlic Parmesan', 'Show Drinks'];
    } else {
      response =
          "Welcome to Kings of Wings! I can assist with personalized heat pairings, allergen checks, and channel-specific takeaway deals. What flavors are you craving?";
      suggestions = ['What is popular today?', 'Vegetarian options', 'Show spicy combos'];
    }

    _messages.add(
      ConciergeMessage(
        text: response,
        isUser: false,
        timestamp: DateTime.now(),
        suggestions: suggestions,
      ),
    );
  }
}
