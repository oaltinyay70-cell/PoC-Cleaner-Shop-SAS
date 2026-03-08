# Mobile App — Service Business Platform

## Status: Scaffold Only (Sprint 3)

The Flutter mobile app will be built in Sprint 4. This directory contains the initial planning.

## Planned Structure

```
mobile/
├── lib/
│   ├── main.dart
│   ├── app.dart
│   ├── config/
│   │   └── api_config.dart
│   ├── models/
│   │   ├── customer.dart
│   │   ├── job.dart
│   │   ├── expense.dart
│   │   └── user.dart
│   ├── providers/
│   │   ├── auth_provider.dart
│   │   ├── customer_provider.dart
│   │   └── job_provider.dart
│   ├── screens/
│   │   ├── login_screen.dart
│   │   ├── dashboard_screen.dart
│   │   ├── customer_list_screen.dart
│   │   ├── job_list_screen.dart
│   │   └── reports_screen.dart
│   ├── services/
│   │   ├── api_service.dart
│   │   ├── auth_service.dart
│   │   └── sync_service.dart     # Offline-first sync (FR-090/091)
│   └── widgets/
│       ├── job_card.dart
│       └── status_badge.dart
├── pubspec.yaml
└── README.md
```

## Key Requirements (from spec)

- **FR-090**: Offline mode — view and create jobs, customers, expenses offline
- **FR-091**: Auto-sync local data when connection restored
- **FR-092**: Indicate offline mode to user
- **FR-093**: Pagination and lazy loading for long lists

## Dependencies (planned)

- `flutter_riverpod` — State management
- `dio` — HTTP client
- `sqflite` — Local SQLite for offline storage
- `connectivity_plus` — Network state detection
- `shared_preferences` — Token storage
- `image_picker` — Camera / gallery for job photos
