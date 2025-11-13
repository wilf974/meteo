# Service d'Email - Météo Pro

Ce service permet d'envoyer des emails via SMTP, notamment pour les alertes météo.

## Configuration

Les credentials SMTP sont configurés dans le fichier `.env` :

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=smtp.meteo@gmail.com
SMTP_PASSWORD=yuzuajbboyfj ieug
SMTP_FROM_NAME=Météo Pro
SMTP_FROM_EMAIL=smtp.meteo@gmail.com
```

### Gmail App Password

Le mot de passe utilisé est un **App Password** de Gmail. Pour en générer un :

1. Allez dans les paramètres de votre compte Google
2. Sécurité → Validation en deux étapes
3. App Passwords → Générer un nouveau mot de passe
4. Copiez le mot de passe (format: xxxx xxxx xxxx xxxx)

## Utilisation de l'API

### Endpoints disponibles

#### 1. Vérifier le statut du service
```bash
GET /api/email/status
```

Réponse :
```json
{
  "success": true,
  "configured": true,
  "connected": true
}
```

#### 2. Envoyer un email de test
```bash
POST /api/email/test
Authorization: Bearer <token>

{
  "email": "destinataire@example.com"
}
```

#### 3. Envoyer une alerte météo
```bash
POST /api/email/alert
Authorization: Bearer <token>

{
  "email": "destinataire@example.com",
  "location": "Paris",
  "alertType": "Tempête",
  "message": "Des vents violents sont attendus",
  "temperature": 15,
  "precipitation": 25,
  "windSpeed": 80
}
```

#### 4. Envoyer un email personnalisé
```bash
POST /api/email/send
Authorization: Bearer <token>

{
  "to": "destinataire@example.com",
  "subject": "Sujet de l'email",
  "text": "Contenu en texte brut",
  "html": "<h1>Contenu HTML</h1>"
}
```

## Exemples d'utilisation avec curl

### Test de configuration
```bash
curl -X POST http://localhost:3001/api/email/test \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"email": "votre-email@example.com"}'
```

### Envoyer une alerte météo
```bash
curl -X POST http://localhost:3001/api/email/alert \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "email": "destinataire@example.com",
    "location": "Lyon",
    "alertType": "Fortes pluies",
    "message": "Des précipitations importantes sont prévues dans les prochaines heures",
    "temperature": 18,
    "precipitation": 35,
    "windSpeed": 45
  }'
```

## Fonctionnalités

- ✅ Envoi d'emails via SMTP (Gmail)
- ✅ Templates HTML professionnels pour les alertes météo
- ✅ Email de test pour vérifier la configuration
- ✅ Vérification de la connexion SMTP
- ✅ Support des alertes avec données météo
- ✅ Gestion des erreurs et logging

## Sécurité

- Les credentials SMTP sont stockés dans `.env` (ignoré par Git)
- Toutes les routes (sauf `/status`) nécessitent une authentification
- Le fichier `.env.example` contient un template sans credentials réels

## Templates d'email

### Email de test
Email simple confirmant que la configuration SMTP fonctionne.

### Alerte météo
Email structuré avec :
- En-tête coloré avec gradient
- Boîte d'alerte jaune/orange
- Données météo dans un tableau
- Bouton CTA vers la carte
- Footer informatif

## Dépannage

### L'email n'est pas envoyé
1. Vérifiez que le service est configuré : `GET /api/email/status`
2. Vérifiez les credentials dans `.env`
3. Vérifiez que l'App Password Gmail est valide
4. Consultez les logs du backend

### Erreur de connexion SMTP
- Vérifiez que le port 587 n'est pas bloqué par un firewall
- Vérifiez que l'authentification à deux facteurs est activée sur Gmail
- Régénérez l'App Password si nécessaire

## Intégration future

Ce service peut être étendu pour :
- Envoyer des alertes automatiques basées sur des seuils météo
- Notifications quotidiennes/hebdomadaires
- Résumés météo personnalisés
- Alertes pour les lieux favoris
