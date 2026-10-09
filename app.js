// VERSIONSNUMMER (Bei jedem Update anpassen, um den Cache auf Geräten zu überprüfen)
const APP_VERSION = "1.0.1";

// Version auf der Webseite anzeigen
document.addEventListener("DOMContentLoaded", () => {
  const versionElem = document.getElementById("app-version");
  if (versionElem) versionElem.innerText = `v${APP_VERSION}`;
});

// Deine Firebase-Konfiguration
const firebaseConfig = {
  apiKey: "AIzaSyAKbAGnQ-yyt-sCKNLy4vtlArHk91752wg",
  authDomain: "coinora-d6fff.firebaseapp.com",
  projectId: "coinora-d6fff",
  storageBucket: "coinora-d6fff.firebasestorage.app",
  messagingSenderId: "154896515786",
  appId: "1:154896515786:web:e3212be0b8fb757b332a33"
};

// Firebase Initialisierung
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// LOKALE SPEICHERUNG AKTIVIEREN (Offline Persistence)
db.enablePersistence({ synchronizeTabs: true })
  .then(() => {
    console.log("Lokale Speicherung aktiv!");
  })
  .catch((err) => {
    console.warn("Offline-Speicher Warnung:", err.code);
  });

let currentCategory = 'laender';
let currentCountryId = null;

// Kategorie wechseln (Kursmünzen / Gedenkmünzen)
function selectCategory(cat) {
  currentCategory = cat;
  document.getElementById('btn-laender').className = `p-4 bg-white rounded-xl shadow border-2 font-medium text-left transition ${cat === 'laender' ? 'border-indigo-500' : 'border-transparent'}`;
  document.getElementById('btn-gedenk').className = `p-4 bg-white rounded-xl shadow border-2 font-medium text-left transition ${cat === 'gedenk' ? 'border-indigo-500' : 'border-transparent'}`;
  loadCountries();
}

// Neues Land hinzufügen
async function addCountry() {
  const nameInput = document.getElementById('new-country-name');
  const name = nameInput.value.trim();
  if (!name) return;

  try {
    await db.collection('countries').add({
      name: name,
      category: currentCategory,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    nameInput.value = '';
  } catch (error) {
    alert("Fehler beim Speichern: " + error.message);
  }
}

// Land löschen
async function deleteCountry(countryId, countryName, event) {
  // Verhindert, dass beim Klick auf Löschen direkt das Modal geöffnet wird
  event.stopPropagation();

  if (confirm(`Möchtest du "${countryName}" wirklich komplett löschen?`)) {
    try {
      await db.collection('countries').doc(countryId).delete();
    } catch (error) {
      alert("Fehler beim Löschen des Landes: " + error.message);
    }
  }
}

// Länder laden (Echtzeit & Lokal)
function loadCountries() {
  const list = document.getElementById('country-list');
  
  db.collection('countries')
    .where('category', '==', currentCategory)
    .onSnapshot({ includeMetadataChanges: true }, snapshot => {
      list.innerHTML = '';
      if (snapshot.empty) {
        list.innerHTML = `<p class="text-sm text-slate-400 italic">Noch keine Einträge vorhanden.</p>`;
        return;
      }

      snapshot.forEach(doc => {
        const data = doc.data();
        const card = document.createElement('div');
        card.className = "bg-white p-4 rounded-xl shadow flex justify-between items-center cursor-pointer hover:bg-slate-50 transition";
        card.onclick = () => openCountryModal(doc.id, data.name);
        
        card.innerHTML = `
          <span class="font-medium">${data.name}</span>
          <div class="flex items-center gap-3">
            <span class="text-xs text-indigo-600 font-bold">Öffnen →</span>
            <button onclick="deleteCountry('${doc.id}', '${data.name}', event)" class="text-xs text-rose-500 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 p-2 rounded-lg font-bold transition">
              🗑️
            </button>
          </div>
        `;
        list.appendChild(card);
      });
    }, error => {
      console.error("Fehler beim Laden:", error);
    });
}

// Modal öffnen
function openCountryModal(countryId, countryName) {
  currentCountryId = countryId;
  document.getElementById('modal-title').innerText = `${countryName} (${currentCategory === 'laender' ? 'Kursmünzen' : '2€ Gedenk'})`;
  document.getElementById('coin-modal').classList.remove('hidden');
  loadCoins(countryId);
}

// Modal schließen
function closeModal() {
  document.getElementById('coin-modal').classList.add('hidden');
  currentCountryId = null;
}

// Münze speichern
async function saveCoin() {
  const valueInput = document.getElementById('coin-value');
  const value = valueInput.value.trim();
  const owned = document.getElementById('coin-owned').checked;

  if (!value) return;

  const coinRef = db.collection('countries').doc(currentCountryId).collection('coins').doc(value);
  
  await coinRef.set({
    value: value,
    owned: owned,
    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
  }, { merge: true });

  valueInput.value = '';
  document.getElementById('coin-owned').checked = false;
}

// Einzelne Münze löschen
async function deleteCoin(coinId) {
  try {
    await db.collection('countries').doc(currentCountryId).collection('coins').doc(coinId).delete();
  } catch (error) {
    alert("Fehler beim Löschen der Münze: " + error.message);
  }
}

// Münzen laden
function loadCoins(countryId) {
  const coinList = document.getElementById('coin-list');

  db.collection('countries').doc(countryId).collection('coins')
    .onSnapshot({ includeMetadataChanges: true }, snapshot => {
      coinList.innerHTML = '';
      
      if (snapshot.empty) {
        coinList.innerHTML = `<p class="text-xs text-slate-400 italic p-2">Noch keine Münzen eingetragen.</p>`;
        return;
      }

      snapshot.forEach(doc => {
        const coin = doc.data();
        const item = document.createElement('div');
        item.className = `p-3 rounded-lg border flex items-center justify-between ${coin.owned ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`;
        
        item.innerHTML = `
          <div class="flex items-center gap-3">
            <div>
              <div class="font-bold text-sm">${coin.value}</div>
              <div class="text-xs ${coin.owned ? 'text-emerald-700 font-semibold' : 'text-slate-400'}">
                ${coin.owned ? '✓ Vorhanden' : '✗ Fehlt'}
              </div>
            </div>
          </div>
          <button onclick="deleteCoin('${doc.id}')" class="text-xs text-rose-500 hover:text-rose-700 bg-rose-100 p-2 rounded-lg font-bold transition">
            🗑️
          </button>
        `;
        coinList.appendChild(item);
      });
    });
}

// Initialer Start der Anwendung
loadCountries();
