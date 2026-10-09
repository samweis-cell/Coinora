// VERSIONSNUMMER
const APP_VERSION = "1.1.4";

let isEditMode = localStorage.getItem("coinora_edit_mode") !== "false";

document.addEventListener("DOMContentLoaded", () => {
  const versionElem = document.getElementById("app-version");
  if (versionElem) versionElem.innerText = `v${APP_VERSION}`;
  updateUiForMode();
});

function openLightbox(imageUrl, title, event) {
  event.stopPropagation();
  const modal = document.getElementById("lightbox-modal");
  const img = document.getElementById("lightbox-image");
  const caption = document.getElementById("lightbox-caption");

  if (modal && img && caption) {
    img.src = imageUrl;
    caption.innerText = title || "Münzmotiv";
    modal.classList.remove("hidden");
  }
}

function closeLightbox() {
  const modal = document.getElementById("lightbox-modal");
  if (modal) modal.classList.add("hidden");
}

function toggleEditMode() {
  isEditMode = !isEditMode;
  localStorage.setItem("coinora_edit_mode", isEditMode);
  updateUiForMode();
  loadCountries();
  if (currentCountryId) {
    loadCoins(currentCountryId);
  }
}

function updateUiForMode() {
  const btn = document.getElementById("toggle-edit-btn");
  const modeIcon = document.getElementById("mode-icon");
  const modeLabel = document.getElementById("mode-label");
  const addCountryBox = document.getElementById("add-country-box");
  const addCoinBox = document.getElementById("add-coin-box");

  if (isEditMode) {
    btn.className = "text-xs px-3 py-1.5 rounded-xl border transition font-medium flex items-center gap-1.5 bg-indigo-600 border-indigo-500 text-white shadow-md";
    modeIcon.innerText = "✏️";
    modeLabel.innerText = "Bearbeiten";
    if (addCountryBox) addCountryBox.classList.remove("hidden");
    if (addCoinBox) addCoinBox.classList.remove("hidden");
  } else {
    btn.className = "text-xs px-3 py-1.5 rounded-xl border transition font-medium flex items-center gap-1.5 bg-emerald-600/30 border-emerald-500/40 text-emerald-300 shadow-md";
    modeIcon.innerText = "👁️";
    modeLabel.innerText = "Beobachten";
    if (addCountryBox) addCountryBox.classList.add("hidden");
    if (addCoinBox) addCoinBox.classList.add("hidden");
  }
}

let selectedImageBase64 = "";

function handleImageSelect(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    const img = new Image();
    img.onload = function() {
      const canvas = document.createElement('canvas');
      const MAX_WIDTH = 400;
      const MAX_HEIGHT = 400;
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > MAX_WIDTH) {
          height *= MAX_WIDTH / width;
          width = MAX_WIDTH;
        }
      } else {
        if (height > MAX_HEIGHT) {
          width *= MAX_HEIGHT / height;
          height = MAX_HEIGHT;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      selectedImageBase64 = canvas.toDataURL('image/jpeg', 0.7);

      document.getElementById('image-preview').src = selectedImageBase64;
      document.getElementById('image-preview-container').classList.remove('hidden');
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function removeSelectedImage() {
  selectedImageBase64 = "";
  document.getElementById('coin-image-file').value = "";
  document.getElementById('image-preview-container').classList.add('hidden');
}

function setCoinValue(val) {
  const input = document.getElementById('coin-value');
  if (input) input.value = val;
}

function parseCoinValueToCent(valStr) {
  if (!valStr) return 0;
  const str = valStr.trim().toLowerCase();

  const match = str.match(/(\d+([.,]\d+)?)/);
  if (!match) return 999999;

  let num = parseFloat(match[1].replace(',', '.'));

  if (str.includes('euro') || str.includes('€') || str.includes('eur')) {
    return Math.round(num * 100);
  } else if (str.includes('cent') || str.includes('ct')) {
    return Math.round(num);
  }

  return num <= 2 ? Math.round(num * 100) : Math.round(num);
}

function getFlagEmoji(countryName) {
  if (!countryName) return '🪙';
  const name = countryName.trim().toLowerCase();

  const flags = [
    { key: 'deutschland', flag: '🇩🇪' },
    { key: 'italien', flag: '🇮🇹' },
    { key: 'frankreich', flag: '🇫🇷' },
    { key: 'spanien', flag: '🇪🇸' },
    { key: 'österreich', flag: '🇦🇹' },
    { key: 'oesterreich', flag: '🇦🇹' },
    { key: 'niederlande', flag: '🇳🇱' },
    { key: 'belgien', flag: '🇧🇪' },
    { key: 'griechenland', flag: '🇬🇷' },
    { key: 'portugal', flag: '🇵🇹' },
    { key: 'finnland', flag: '🇫🇮' },
    { key: 'irland', flag: '🇮🇪' },
    { key: 'slowakei', flag: '🇸🇰' },
    { key: 'slowenien', flag: '🇸🇮' },
    { key: 'kroatien', flag: '🇭🇷' },
    { key: 'estland', flag: '🇪🇪' },
    { key: 'lettland', flag: '🇱🇻' },
    { key: 'litauen', flag: '🇱🇹' },
    { key: 'luxemburg', flag: '🇱🇺' },
    { key: 'malta', flag: '🇲🇹' },
    { key: 'zypern', flag: '🇨🇾' },
    { key: 'monaco', flag: '🇲🇨' },
    { key: 'san marino', flag: '🇸🇲' },
    { key: 'vatikan', flag: '🇻🇦' },
    { key: 'andorra', flag: '🇦🇩' },
    { key: 'bulgarien', flag: '🇧🇬' },
    { key: 'rumänien', flag: '🇷🇴' },
    { key: 'rumaenien', flag: '🇷🇴' }
  ];

  const found = flags.find(item => name.includes(item.key));
  return found ? found.flag : '🌍';
}

const firebaseConfig = {
  apiKey: "AIzaSyAKbAGnQ-yyt-sCKNLy4vtlArHk91752wg",
  authDomain: "coinora-d6fff.firebaseapp.com",
  projectId: "coinora-d6fff",
  storageBucket: "coinora-d6fff.firebasestorage.app",
  messagingSenderId: "154896515786",
  appId: "1:154896515786:web:e3212be0b8fb757b332a33"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

db.enablePersistence({ synchronizeTabs: true })
  .then(() => {
    console.log("Lokale Speicherung aktiv!");
  })
  .catch((err) => {
    console.warn("Offline-Speicher Warnung:", err.code);
  });

let currentCategory = 'laender';
let currentCountryId = null;

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

async function addCountry() {
  if (!isEditMode) return;
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

async function deleteCountry(countryId, countryName, event) {
  event.stopPropagation();
  if (!isEditMode) return;

  if (confirm(`Möchtest du "${countryName}" wirklich komplett löschen?`)) {
    try {
      await db.collection('countries').doc(countryId).delete();
    } catch (error) {
      alert("Fehler beim Löschen des Landes: " + error.message);
    }
  }
}

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

      let countries = [];
      snapshot.forEach(doc => {
        countries.push({
          id: doc.id,
          ...doc.data()
        });
      });

      countries.sort((a, b) => a.name.localeCompare(b.name, 'de', { sensitivity: 'base' }));

      countries.forEach(data => {
        const card = document.createElement('div');
        const flag = getFlagEmoji(data.name);

        card.className = "relative group bg-slate-800 border border-slate-700/80 hover:border-indigo-500/50 p-4 rounded-2xl shadow-lg flex flex-col items-center justify-between text-center cursor-pointer transition transform active:scale-95 min-h-[145px]";
        card.onclick = () => openCountryModal(data.id, data.name);
        
        const deleteBtnHtml = isEditMode ? `
          <button onclick="deleteCountry('${data.id}', '${data.name}', event)" class="absolute top-2.5 right-2.5 text-xs text-rose-400 hover:text-rose-300 bg-slate-900/60 hover:bg-rose-900/40 p-1.5 rounded-lg transition opacity-80 group-hover:opacity-100 z-10">
            🗑️
          </button>
        ` : '';

        card.innerHTML = `
          ${deleteBtnHtml}
          
          <div class="w-11 h-11 rounded-full bg-slate-900 border border-slate-700/80 flex items-center justify-center text-2xl mb-1 shadow-inner">
            ${flag}
          </div>
          
          <span class="font-semibold text-sm text-slate-100 line-clamp-1 mb-2">${data.name}</span>
          
          <div class="w-full space-y-1">
            <div class="flex justify-between items-center text-[10px] font-medium text-slate-400">
              <span id="progress-text-${data.id}">0/0 Münzen</span>
              <span id="progress-percent-${data.id}">0%</span>
            </div>
            <div class="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-700/50">
              <div id="progress-bar-${data.id}" class="bg-indigo-500 h-full rounded-full transition-all duration-500" style="width: 0%"></div>
            </div>
          </div>
        `;
        list.appendChild(card);

        db.collection('countries').doc(data.id).collection('coins').onSnapshot(coinsSnapshot => {
          const totalCoins = coinsSnapshot.size;
          let ownedCoins = 0;
          
          coinsSnapshot.forEach(coinDoc => {
            if (coinDoc.data().owned) ownedCoins++;
          });

          const percent = totalCoins > 0 ? Math.round((ownedCoins / totalCoins) * 100) : 0;

          const textElem = document.getElementById(`progress-text-${data.id}`);
          const percentElem = document.getElementById(`progress-percent-${data.id}`);
          const barElem = document.getElementById(`progress-bar-${data.id}`);

          if (textElem) textElem.innerText = `${ownedCoins}/${totalCoins} Münzen`;
          if (percentElem) percentElem.innerText = `${percent}%`;
          if (barElem) {
            barElem.style.width = `${percent}%`;
            if (percent === 100 && totalCoins > 0) {
              barElem.className = "bg-emerald-500 h-full rounded-full transition-all duration-500";
            } else {
              barElem.className = "bg-indigo-500 h-full rounded-full transition-all duration-500";
            }
          }
        });
      });
    }, error => {
      console.error("Fehler beim Laden:", error);
    });
}

function openCountryModal(countryId, countryName) {
  currentCountryId = countryId;
  const flag = getFlagEmoji(countryName);
  document.getElementById('modal-title').innerText = `${flag} ${countryName} (${currentCategory === 'laender' ? 'Kursmünzen' : '2€ Gedenk'})`;
  document.getElementById('coin-modal').classList.remove('hidden');
  loadCoins(countryId);
}

function closeModal() {
  document.getElementById('coin-modal').classList.add('hidden');
  currentCountryId = null;
  removeSelectedImage();
}

async function saveCoin() {
  if (!isEditMode) return;
  const valueInput = document.getElementById('coin-value');
  const titleInput = document.getElementById('coin-title');
  const urlInput = document.getElementById('coin-image-url');

  const value = valueInput.value.trim();
  const title = titleInput.value.trim();
  const imageUrl = selectedImageBase64 || urlInput.value.trim();
  const owned = document.getElementById('coin-owned').checked;

  if (!value) return;

  try {
    await db.collection('countries').doc(currentCountryId).collection('coins').add({
      value: value,
      title: title || '',
      imageUrl: imageUrl || '',
      owned: owned,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    valueInput.value = '';
    titleInput.value = '';
    urlInput.value = '';
    removeSelectedImage();
    document.getElementById('coin-owned').checked = false;
  } catch (error) {
    alert("Fehler beim Speichern der Münze: " + error.message);
  }
}

async function toggleCoinOwned(coinId, currentStatus, event) {
  event.stopPropagation();
  try {
    await db.collection('countries').doc(currentCountryId).collection('coins').doc(coinId).update({
      owned: !currentStatus
    });
  } catch (error) {
    console.error("Fehler beim Ändern des Status:", error);
  }
}

async function deleteCoin(coinId, event) {
  event.stopPropagation();
  if (!isEditMode) return;

  try {
    await db.collection('countries').doc(currentCountryId).collection('coins').doc(coinId).delete();
  } catch (error) {
    alert("Fehler beim Löschen der Münze: " + error.message);
  }
}

function loadCoins(countryId) {
  const coinList = document.getElementById('coin-list');

  db.collection('countries').doc(countryId).collection('coins')
    .onSnapshot({ includeMetadataChanges: true }, snapshot => {
      coinList.innerHTML = '';
      
      if (snapshot.empty) {
        coinList.innerHTML = `<p class="text-xs text-slate-500 italic p-4 text-center col-span-2 sm:col-span-3">Noch keine Münzen eingetragen.</p>`;
        return;
      }

      let coins = [];
      snapshot.forEach(doc => {
        coins.push({
          id: doc.id,
          ...doc.data()
        });
      });

      coins.sort((a, b) => {
        const valA = parseCoinValueToCent(a.value);
        const valB = parseCoinValueToCent(b.value);
        if (valA !== valB) return valA - valB;
        return (a.title || '').localeCompare(b.title || '');
      });

      coins.forEach(coin => {
        const card = document.createElement('div');
        
        const isOwned = coin.owned;
        const bgClass = isOwned 
          ? 'bg-emerald-950/40 border-emerald-600/60 hover:border-emerald-500' 
          : 'bg-slate-900 border-slate-700/80 hover:border-slate-500';
        
        const badgeClass = isOwned 
          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' 
          : 'bg-slate-800 text-slate-400 border-slate-700';

        card.className = `relative group border ${bgClass} p-3 rounded-2xl flex flex-col justify-between transition cursor-pointer shadow min-h-[175px]`;
        card.onclick = (e) => toggleCoinOwned(coin.id, coin.owned, e);

        const deleteBtnHtml = isEditMode ? `
          <button onclick="deleteCoin('${coin.id}', event)" class="absolute top-2 right-2 text-xs text-rose-400 hover:text-rose-300 bg-slate-800/80 hover:bg-rose-950/60 p-1 rounded-lg transition opacity-70 group-hover:opacity-100 z-10">
            🗑️
          </button>
        ` : '';

        const imageHtml = coin.imageUrl ? `
          <div onclick="openLightbox('${coin.imageUrl}', '${coin.value}${coin.title ? ' - ' + coin.title : ''}', event)" class="w-full h-24 flex-shrink-0 mb-2 rounded-xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center group/img relative cursor-zoom-in">
            <img src="${coin.imageUrl}" class="w-full h-full object-cover transition transform group-hover/img:scale-105" alt="${coin.value}">
            <div class="absolute inset-0 bg-black/20 opacity-0 group-hover/img:opacity-100 transition flex items-center justify-center text-xs text-white font-medium">🔍 Vergrößern</div>
          </div>
        ` : '';

        card.innerHTML = `
          ${deleteBtnHtml}
          ${imageHtml}

          <div class="pr-5 space-y-0.5 flex-1 flex flex-col justify-center">
            <span class="font-bold text-base text-white block leading-tight">${coin.value}</span>
            ${coin.title ? `<span class="text-xs text-slate-300 block line-clamp-2 leading-snug">${coin.title}</span>` : ''}
          </div>

          <div class="mt-2 flex items-center justify-between flex-shrink-0">
            <span class="text-[10px] px-2 py-0.5 rounded-md border font-semibold ${badgeClass}">
              ${isOwned ? '✓ Vorhanden' : 'Fehlt'}
            </span>
          </div>
        `;

        coinList.appendChild(card);
      });
    });
}

loadCountries();
