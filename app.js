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
          <span class="text-xs text-indigo-600 font-bold">Öffnen →</span>
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

function closeModal() {
  document.getElementById('coin-modal').classList.add('hidden');
  currentCountryId = null;
}

// Münze speichern
async function saveCoin() {
  const value = document.getElementById('coin-value').value;
  const owned = document.getElementById('coin-owned').checked;

  const coinRef = db.collection('countries').doc(currentCountryId).collection('coins').doc(value);
  
  await coinRef.set({
    value: value,
    owned: owned,
    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
  }, { merge: true });
}

// Münzen laden
function loadCoins(countryId) {
  const coinList = document.getElementById('coin-list');

  db.collection('countries').doc(countryId).collection('coins')
    .onSnapshot({ includeMetadataChanges: true }, snapshot => {
      coinList.innerHTML = '';
      
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
        `;
        coinList.appendChild(item);
      });
    });
}

// Initialer Start
loadCountries();
