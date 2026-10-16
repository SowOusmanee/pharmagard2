# PharmaGarde — Application Flutter Native

Application mobile Flutter complète reproduisant l'architecture et l'expérience de la plateforme sénégalaise **PharmaGarde** (Recherche de médicaments & officines de garde à Dakar).

---

## 📱 Structure du Projet Flutter

```text
flutter_pharmagarde/
├── pubspec.yaml                        # Dépendances & configuration Flutter
├── lib/
│   ├── main.dart                       # Point d'entrée & navigation principale
│   ├── core/
│   │   ├── theme/
│   │   │   └── app_theme.dart          # Palette officielle (#005F56, #95ECD8) & styles
│   │   ├── constants/
│   │   │   └── mock_data.dart          # Données réelles : officines de Pikine & Guédiawaye
│   │   └── widgets/
│   │       └── logo_widget.dart        # Logo officiel PharmaGarde (carré menthe + croix + point vert)
│   ├── data/
│   │   └── models/
│   │       ├── pharmacy_model.dart     # Modèle Officine
│   │       ├── medicine_model.dart     # Modèle Médicament & confiance OCR
│   │       └── request_model.dart      # Demande de disponibilité en temps réel
│   ├── services/
│   │   └── state_notifier.dart         # Gestion d'état réactive (classement ordonnance complète)
│   └── ui/
│       ├── screens/
│       │   ├── patient_home_screen.dart        # Accueil (Capture 2)
│       │   ├── medicine_search_screen.dart     # Recherche médicament (Capture 1)
│       │   ├── duty_pharmacies_screen.dart     # Officines de garde 24h/24 (Capture 3)
│       │   ├── scan_screen.dart                # Viseur caméra & lecture IA
│       │   ├── search_results_screen.dart      # Résultats ciblés classés (Capture 4)
│       │   └── pharmacy_home_screen.dart       # Espace Pharmacien (DISPONIBLE / INDISPONIBLE)
│       └── modals/
│           ├── call_modal.dart                 # Simulateur d'appel sécurisé
│           └── itinerary_modal.dart            # Guidage & tracé d'itinéraire
```

---

## 🚀 Comment Lancer l'Application avec Flutter

### 1. Prérequis : Installer le SDK Flutter
Si Flutter n'est pas encore installé sur votre PC Windows :
1. Téléchargez Flutter : [https://docs.flutter.dev/get-started/install/windows/mobile](https://docs.flutter.dev/get-started/install/windows/mobile)
2. Décompressez dans `C:\src\flutter`.
3. Ajoutez `C:\src\flutter\bin` à la variable `PATH` de votre système.
4. Vérifiez dans PowerShell :
   ```powershell
   flutter doctor
   ```

### 2. Récupérer les dépendances
Ouvrez un terminal dans le dossier `flutter_pharmagarde` :
```bash
cd flutter_pharmagarde
flutter pub get
```

### 3. Exécuter l'application

- **Sur Chrome (Visualisation Web instantanée) :**
  ```bash
  flutter run -d chrome
  ```
- **Sur votre téléphone Android connecté en USB (Débogage USB activé) :**
  ```bash
  flutter run
  ```
- **Générer le fichier APK Android installable :**
  ```bash
  flutter build apk --release
  ```
  Le fichier `.apk` généré se trouvera dans : `build/app/outputs/flutter-apk/app-release.apk`.
