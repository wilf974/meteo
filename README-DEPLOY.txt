═══════════════════════════════════════════════════════════════
  🌤️  MÉTÉO PRO v2.0 - GUIDE DÉPLOIEMENT VPS
═══════════════════════════════════════════════════════════════

✅ TOUT EST PRÊT POUR LE DÉPLOIEMENT!

═══════════════════════════════════════════════════════════════
📋 RÉSUMÉ DES CHANGEMENTS
═══════════════════════════════════════════════════════════════

✨ NOUVEAUTÉS:
  🌧️  Animations météo (vent, pluie, neige)
  📊 Système analytics complet
  📧 Email quotidien automatique à 20h
  🐳 Configuration Docker optimisée

📦 COMMITS:
  1. e8fe4b7 - Couches météo + Analytics + Emails
  2. e50da77 - Configuration Docker complète
  3. 88c3048 - Scripts et guides déploiement

═══════════════════════════════════════════════════════════════
🚀 DÉPLOIEMENT EN 2 COMMANDES
═══════════════════════════════════════════════════════════════

Sur votre VPS (root@srv819544):

cd /opt/apps/meteo
./update-vps.sh

⏱️ Temps estimé: 5-10 minutes

Le script fait:
  1. git pull
  2. docker-compose down
  3. docker-compose up -d --build

Ou manuellement:
cd /opt/apps/meteo
git pull origin claude/incomplete-description-011CV12Gzo5TTMZoeimHUiAc
docker-compose down
docker-compose up -d --build

═══════════════════════════════════════════════════════════════
📝 VÉRIFICATIONS POST-DÉPLOIEMENT
═══════════════════════════════════════════════════════════════

1. Services Docker:
   docker-compose ps
   → Tous doivent être "Up (healthy)"

2. Backend Health:
   curl https://meteoproapp.woutils.com/api/v1/health
   → {"status":"OK",...}

3. Analytics:
   curl https://meteoproapp.woutils.com/api/v1/analytics/today
   → Stats du jour

4. Email de test:
   curl -X POST https://meteoproapp.woutils.com/api/v1/analytics/report \
     -H "Content-Type: application/json" \
     -d '{"email":"jean.maillot14@gmail.com"}'
   → Email reçu immédiatement

5. Application:
   https://meteoproapp.woutils.com
   → Interface accessible

═══════════════════════════════════════════════════════════════
📧 CONFIGURATION EMAIL (SI PAS DÉJÀ FAIT)
═══════════════════════════════════════════════════════════════

Fichier: /opt/apps/meteo/.env

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=jean.maillot14@gmail.com
SMTP_PASSWORD=votre_app_password_16_caracteres
SMTP_FROM_EMAIL=jean.maillot14@gmail.com
SMTP_FROM_NAME=Météo Pro

⚠️ Utilisez un "App Password" Gmail, pas le mot de passe principal!

Comment créer un App Password Gmail:
1. https://myaccount.google.com/security
2. Activer "2-Step Verification"
3. "App passwords" → Générer pour "Mail"
4. Copier dans SMTP_PASSWORD

═══════════════════════════════════════════════════════════════
📊 SYSTÈME ANALYTICS
═══════════════════════════════════════════════════════════════

✅ Tracking automatique des connexions
✅ Email quotidien à jean.maillot14@gmail.com à 20:00
✅ Stockage persistant (volume Docker)
✅ Nettoyage auto des données >90 jours

Contenu email:
  - Stats d'hier (visiteurs uniques + connexions)
  - Stats du jour
  - Moyenne des 7 derniers jours

Premier email: Ce soir à 20:00!

═══════════════════════════════════════════════════════════════
🔍 MONITORING
═══════════════════════════════════════════════════════════════

Logs en temps réel:
docker-compose logs -f

Logs backend uniquement:
docker-compose logs -f backend

Chercher "scheduler" dans les logs:
docker-compose logs backend | grep scheduler

Ressources:
docker stats

═══════════════════════════════════════════════════════════════
📚 DOCUMENTATION DISPONIBLE
═══════════════════════════════════════════════════════════════

1. DEPLOY-NOW.md
   → Guide déploiement rapide (commandes essentielles)

2. VPS-UPDATE-GUIDE.md
   → Guide complet mise à jour + troubleshooting

3. DOCKER-GUIDE.md
   → Documentation Docker détaillée

4. CHANGELOG.md
   → Historique complet des modifications

5. DOCKER-QUICKSTART.md
   → Démarrage Docker en 5 minutes

═══════════════════════════════════════════════════════════════
🚨 EN CAS DE PROBLÈME
═══════════════════════════════════════════════════════════════

Redémarrer backend:
docker-compose restart backend

Voir les erreurs:
docker-compose logs backend | grep -i error

Rollback:
cd /opt/apps/meteo
git log --oneline -5
git checkout <commit-précédent>
docker-compose down
docker-compose up -d --build

Support:
Consulter VPS-UPDATE-GUIDE.md section "Résolution de Problèmes"

═══════════════════════════════════════════════════════════════
✅ CHECKLIST FINALE
═══════════════════════════════════════════════════════════════

[ ] Git pull réussi
[ ] Script update-vps.sh exécuté sans erreur
[ ] Tous services Docker "Up (healthy)"
[ ] Health check retourne OK
[ ] Frontend accessible (https://meteoproapp.woutils.com)
[ ] Analytics endpoint répond
[ ] Email de test reçu
[ ] Logs sans erreurs critiques
[ ] Configuration SMTP validée

═══════════════════════════════════════════════════════════════
🎯 ACCÈS RAPIDES
═══════════════════════════════════════════════════════════════

Application:         https://meteoproapp.woutils.com
API:                 https://meteoproapp.woutils.com/api/v1
Health:              https://meteoproapp.woutils.com/api/v1/health
Analytics Today:     https://meteoproapp.woutils.com/api/v1/analytics/today
Analytics Yesterday: https://meteoproapp.woutils.com/api/v1/analytics/yesterday

═══════════════════════════════════════════════════════════════
📞 PROCHAINES ÉTAPES
═══════════════════════════════════════════════════════════════

1. Déployer maintenant avec ./update-vps.sh
2. Vérifier que tout fonctionne
3. Attendre 20:00 pour recevoir le premier email
4. Vérifier les analytics le lendemain matin

═══════════════════════════════════════════════════════════════

Version: 2.0.0
Date: 13 Novembre 2025
Branche: claude/incomplete-description-011CV12Gzo5TTMZoeimHUiAc
Status: ✅ PRÊT POUR PRODUCTION

═══════════════════════════════════════════════════════════════
