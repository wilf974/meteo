/**
 * Script de diagnostic pour identifier pourquoi les zones météo ne s'affichent pas
 * À exécuter dans la console navigateur (F12) sur https://meteoproapp.woutils.com
 */

console.log('=== DIAGNOSTIC MÉTÉO ===\n');

// 1. Vérifier le store Zustand (accès via window.__ZUSTAND_STORE__ si exposé, sinon via React DevTools)
// Méthode alternative: lire directement depuis le DOM
const mapStorage = localStorage.getItem('map-storage');
console.log('1️⃣ LocalStorage map-storage:', mapStorage ? 'Present' : 'NULL (using defaults)');

// 2. Chercher le canvas de précipitation
const canvases = document.querySelectorAll('canvas');
console.log(`\n2️⃣ Nombre de canvas sur la page: ${canvases.length}`);
canvases.forEach((canvas, i) => {
  const style = window.getComputedStyle(canvas);
  console.log(`   Canvas ${i}:`, {
    width: canvas.width,
    height: canvas.height,
    zIndex: style.zIndex,
    position: style.position,
    display: style.display,
    pointerEvents: style.pointerEvents
  });
});

// 3. Vérifier le LayerControl panel
const layerControl = document.querySelector('[class*="LayerControl"]') ||
                     document.querySelector('[class*="layer-control"]');
console.log('\n3️⃣ LayerControl panel:', layerControl ? 'FOUND' : 'NOT FOUND');
if (layerControl) {
  console.log('   Position:', window.getComputedStyle(layerControl).position);
  console.log('   Display:', window.getComputedStyle(layerControl).display);
  console.log('   Z-Index:', window.getComputedStyle(layerControl).zIndex);
}

// 4. Vérifier les boutons de mode
const buttons = Array.from(document.querySelectorAll('button')).filter(btn =>
  btn.textContent.includes('Radar') ||
  btn.textContent.includes('Vent') ||
  btn.textContent.includes('Température')
);
console.log('\n4️⃣ Boutons de mode trouvés:', buttons.length);
buttons.forEach(btn => {
  console.log(`   - ${btn.textContent.trim()}`);
});

// 5. Chercher dans React Fiber (structure interne React)
console.log('\n5️⃣ Recherche dans React Fiber...');
const mapContainer = document.querySelector('.leaflet-container');
if (mapContainer && mapContainer._reactRootContainer) {
  console.log('   React root trouvé');
} else if (mapContainer) {
  // Essayer de trouver la clé React fiber
  const reactKey = Object.keys(mapContainer).find(key =>
    key.startsWith('__reactFiber') || key.startsWith('__reactProps')
  );
  if (reactKey) {
    console.log('   React fiber key:', reactKey);
  }
}

// 6. Instructions pour l'utilisateur
console.log('\n📋 PROCHAINES ÉTAPES:');
console.log('   1. Partagez cette sortie console complète');
console.log('   2. Faites une capture d\'écran de la page entière');
console.log('   3. Essayez de cliquer sur les boutons de mode si vous les voyez');
console.log('   4. Notez si vous voyez un panneau de contrôle en haut à droite\n');

// 7. Tentative d'accès au store via React DevTools API
setTimeout(() => {
  console.log('7️⃣ Tentative d\'accès aux données React...');
  // Cette partie nécessite React DevTools installé
  if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
    console.log('   React DevTools détecté!');
    console.log('   Utilisez React DevTools pour inspecter le composant MapPage');
    console.log('   Cherchez le state "weatherGrid" dans useMapStore');
  } else {
    console.log('   React DevTools non détecté');
    console.log('   Installez l\'extension React DevTools pour plus d\'infos');
  }
}, 1000);

console.log('\n=== FIN DU DIAGNOSTIC ===');
