/* js/db.js — Local user profile + progress storage */

(function (window) {
    const STORAGE_KEY = 'steno_progress';
    const USER_KEY = 'steno_user_profile';

    // --- UTILITIES ---
    function readJSON(key, fallback = null) {
        try {
            const val = localStorage.getItem(key);
            return val ? JSON.parse(val) : fallback;
        } catch (e) {
            console.error('Failed to parse localStorage key:', key, e);
            return fallback;
        }
    }

    function writeJSON(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (e) {
            console.error('Failed to write localStorage key:', key, e);
        }
    }

    // --- PROFILE HANDLERS ---
    function getUserProfile() {
        let p = readJSON(USER_KEY);
        if (!p) {
            p = {
                id: 'user-' + Date.now().toString(36),
                name: 'Suraj Kadian',
                photo: 'img/surajkadian.jpg',
            };
            writeJSON(USER_KEY, p);
        }
        return p;
    }

    function updateUserProfile(updates) {
        const p = getUserProfile();
        const newP = { ...p, ...updates };
        writeJSON(USER_KEY, newP);
        return newP;
    }

    // --- PROGRESS HANDLERS ---
    function readAllResults() {
        return readJSON(STORAGE_KEY, []);
    }

    function saveResult(resultObj) {
        const all = readAllResults();
        all.push(resultObj);
        writeJSON(STORAGE_KEY, all);
    }

    function clearAllResults() {
        localStorage.removeItem(STORAGE_KEY);
    }

    // --- UI RENDER ---
    function renderProfileHTML() {
        const profile = getUserProfile();

        return `
        <div class="profile-container" style="display:flex; flex-direction:column; align-items:center; text-align:center;">
          <div style="position:relative;">
            <img id="profile-photo" src="${profile.photo}" alt="Profile Photo" onClick="document.getElementById('edit-photo-btn').click();" style="width:100px; height:100px; border-radius:50%; object-fit:cover; border:2px solid var(--accent-color);">
            <input type="file" id="upload-photo" accept="image/*" style="display:none;">
            <button id="edit-photo-btn" class="edit-btn" style="position:absolute; bottom:0; right:0; background:var(--accent-color); color:#fff; border:none; border-radius:50%; width:26px; height:26px; font-size:14px;">✎</button>
          </div>
          <h2 id="profile-name" style="margin:10px 0 5px 0; font-weight:600;">${profile.name}</h2>
          <button id="edit-name-btn" class="edit-btn" style="background:none; border:1px solid var(--accent-color); border-radius:6px; padding:4px 8px; color:var(--accent-color); font-size:12px;">Edit Name</button>
          <hr style="margin:16px 0; width:80%;">
        </div>
      `;
    }

    function renderProgressHTML() {
        const all = readAllResults().slice().reverse();

        let html = `<div style="max-height:50vh; overflow:auto;"><table style="width:100%; border-collapse:collapse; font-size:14px;">
      <thead>
      <tr>
        <th style="text-align:left; padding:8px; border-bottom:1px solid #ddd;">Date</th>
        <th style="text-align:right; padding:8px; border-bottom:1px solid #ddd;">WPM</th>
        <th style="text-align:right; padding:8px; border-bottom:1px solid #ddd;">Error%</th>
        <th style="text-align:right; padding:8px; border-bottom:1px solid #ddd;">Words</th>
      </tr></thead><tbody>`;

        for (const r of all) {
            html += `<tr>
          <td style="padding:8px; border-bottom:1px solid #f5f5f5;">${new Date(r.date).toLocaleString()}</td>
          <td style="text-align:right; border-bottom:1px solid #ddd;">${r.wpm ?? '—'}</td>
          <td style="text-align:right; border-bottom:1px solid #ddd;">${r.errorRate ?? '—'}</td>
          <td style="text-align:right; border-bottom:1px solid #ddd;">${r.wordsTyped ?? '—'}</td>
        </tr>`;
        }

        html += `</tbody></table></div>`;
        return html;
    }

    // --- PROFILE PAGE ---
    function renderProfilePage() {
        const profileHTML = renderProfileHTML();
        const progressHTML = renderProgressHTML();

        return `
        <div style="max-height:70vh; overflow:auto;">
          ${profileHTML}
          <h3 style="margin-bottom:6px;">Your Progress</h3>
          ${progressHTML}
          <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:12px;">
            <button id="clear-progress-btn" class="submit-btn">Clear Data</button>
          </div>
        </div>
      `;
    }

    function bindProfileInteractions() {
        const editNameBtn = document.getElementById('edit-name-btn');
        const nameEl = document.getElementById('profile-name');
        const photoInput = document.getElementById('upload-photo');
        const photoBtn = document.getElementById('edit-photo-btn');
        const photoEl = document.getElementById('profile-photo');

        if (editNameBtn) {
            editNameBtn.addEventListener('click', () => {
                const current = nameEl.textContent.trim();
                const newName = prompt('Enter your name:', current);
                if (newName && newName.trim()) {
                    const updated = updateUserProfile({ name: newName.trim() });
                    nameEl.textContent = updated.name;
                }
            });
        }

        if (photoBtn && photoInput) {
            photoBtn.addEventListener('click', () => photoInput.click());
            photoInput.addEventListener('change', e => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = ev => {
                        const newPhoto = ev.target.result;
                        photoEl.src = newPhoto;
                        updateUserProfile({ photo: newPhoto });
                    };
                    reader.readAsDataURL(file);
                }
            });
        }
    }

    function deleteResultById(id) {
        const all = readAllResults().filter(r => r.id !== id);
        writeJSON(STORAGE_KEY, all);
    }


    window.StenoDB = {
        getUserProfile,
        updateUserProfile,
        saveResult,
        readAllResults,
        clearAllResults,
        renderProfilePage,
        renderProgressHTML,
        deleteResultById,
        bindProfileInteractions
    };

})(window);
