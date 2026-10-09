// VERSIONSNUMMER
const APP_VERSION = "1.0.3";

// Version auf der Webseite anzeigen
document.addEventListener("DOMContentLoaded", () => {
  const versionElem = document.getElementById("app-version");
  if (versionElem) versionElem.innerText = `v${APP_VERSION}`;
});

// Hilfsfunktion: Wandelt den Ländernamen automatisch in ein Flaggen-Emoji um
function getFlagEmoji(countryName) {
  if (!countryName) return '🪙';
  const name = countryName.trim().toLowerCase();

  const flags = {
    'deutschland': '🇩🇪',
    'italien': '🇮🇹',
    'frankreich': '🇫🇷',
    'spanien': '🇪🇸',
    'österreich': '🇦🇹',
    'oesterreich': '🇦🇹',
    'niederlande': '🇳🇱',
    'belgien': '🇧🇪',
    'griechenland': '🇬🇷',
    'portugal': '🇵🇹',
    'finnland': '🇫🇮',
    'irland': '🇮🇪',
    'slowakei': '🇸🇰',
    'slowenien': '🇸🇮',
    'kroatien': '🇭🇷',
    'estland': '🇪🇪',
    'lettland': '🇱🇻',
    'litauen': '🇱🇹',
    'luxemburg': '🇱🇺',
    'malta': '🇲🇹',
    'zypern': '🇨🇾',
    'monaco': '🇲🇨',
    'san marino': '🇸🇲',
    'vatikan': '🇻🇦',
    'vatikanstadt': '🇻🇦',
    'andorra': '🇦🇩',
    'bulgarien': '🇧🇬',
    'rumänien': '🇷🇴',
    'rumaenien': '🇷🇴'
  };

  return flags[name] || '🌍';
}

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

// Kategorie wechseln
function selectCategory(cat) {
  currentCategory = cat;
  
  const btnLaender = document.getElementById('btn-laender');
  const btnGedenk = document.getElementById('btn-gedenk');

  if (cat === 'laender') {
    btnLaender.className = 'p-4 bg-slate-800 rounded-2xl border-2 border-indigo-500 font-medium text-left transition shadow-md text-white';
    btnGedenk.className = 'p-4 bg-slate-800 rounded-2xl border-2 border-transparent font-medium text-left transition shadow-md text-slate-400';
  } else {
    btnGedenk.className = 'p-4 bg-slate-800 rounded-2xl border-2 border-indigo-500 font-medium text-left transition shadow-md text-white';
    btnLaender.className = 'p-4 bg-slate-800 rounded-2xl border-2 border-transparent font-medium text-left transition shadow-md text-slate-400';
  }
  
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
  event.stopPropagation();

  if (confirm(`Möchtest du "${countryName}" wirklich komplett löschen?`)) {
    try {
      await db.collection('countries').doc(countryId).delete();
    } catch (error) {
      alert("Fehler beim Löschen des Landes: " + error.message);
    }
  }
}

// Länder als Blöcke/Kacheln laden
function loadCountries() {
  const list = document.getElementById('country-list');
  
  db.collection('countries')
    .where('category', '==', currentCategory)
    .onSnapshot({ includeMetadataChanges: true }, snapshot => {
      list.innerHTML = '';
      if (snapshot.empty) {
        list.innerHTML = `<p class="text-sm text-slate-500 italic col-span-2 sm:col-span-3 text-center py-6">Noch keine Einträge vorhanden.</p>`;
        return;
      }

      snapshot.forEach(doc => {
        const data = doc.data();
        const card = document.createElement('div');
        
        // Flaggen-Emoji für das Land ermitteln
        const flag = getFlagEmoji(data.name);

        // Styling als abgerundeter Block / Karte
        card.className = "relative group bg-slate-800 border border-slate-700/80 hover:border-indigo-500/50 p-5 rounded-2xl shadow-lg flex flex-col items-center justify-center text-center cursor-pointer transition transform active:scale-95 min-h-[130px]";
        card.onclick = () => openCountryModal(doc.id, data.name);
        
        card.innerHTML = `
          <!-- Mülleimer-Button oben rechts am Block -->
          <button onclick="deleteCountry('${doc.id}', '${data.name}', event)" class="absolute top-2.5 right-2.5 text-xs text-rose-400 hover:text-rose-300 bg-slate-900/60 hover:bg-rose-900/40 p-1.5 rounded-lg transition opacity-80 group-hover:opacity-100">
            🗑️
          </button>
          
          <!-- Flagge im Kreis -->
          <div class="w-12 h-12 rounded-full bg-slate-900 border border-slate-700/80 flex items-center justify-center text-2xl mb-3 shadow-inner">
            ${flag}
          </div>
          
          <!-- Land Name -->
          <span class="font-semibold text-sm text-slate-100 line-clamp-1">${data.name}</span>
          <span class="text-[10px] text-indigo-400 mt-1 font-medium">Tippen zum Öffnen</span>
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
  const flag = getFlagEmoji(countryName);
  document.getElementById('modal-title').innerText = `${flag} ${countryName} (${currentCategory === 'laender' ? 'Kursmünzen' : '2€ Gedenk'})`;
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
        coinList.innerHTML = `<p class="text-xs text-slate-500 italic p-2 text-center">Noch keine Münzen eingetragen.</p>`;
        return;
      }

      snapshot.forEach(doc => {
        const coin = doc.data();
        const item = document.createElement('div');
        item.className = `p-3 rounded-xl border flex items-center justify-between ${coin.owned ? 'bg-emerald-950/40 border-emerald-700/50 text-emerald-200' : 'bg-slate-900 border-slate-700 text-slate-300'}`;
        
        item.innerHTML = `
          <div class="flex items-center gap-3">
            <div>
              <div class="font-bold text-sm text-white">${coin.value}</div>
              <div class="text-xs ${coin.owned ? 'text-emerald-400 font-semibold' : 'text-slate-500'}">
                ${coin.owned ? '✓ Vorhanden' : '✗ Fehlt'}
              </div>
            </div>
          </div>
          <button onclick="deleteCoin('${doc.id}')" class="text-xs text-rose-400 hover:text-rose-300 bg-rose-950/50 hover:bg-rose-900/60 p-2 rounded-lg font-bold transition">
            🗑️
          </button>
        `;
        coinList.appendChild(item);
      });
    });
}

// Initialer Start der Anwendung
loadCountries();
