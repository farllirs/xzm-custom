import { getUserProfile } from './api.js';

const ui = {
    searchBtn: document.getElementById('searchBtn'),
    userIdInput: document.getElementById('userId'),
    mainContent: document.getElementById('mainContent'),
    avatar: document.getElementById('userAvatar'),
    name: document.getElementById('userName'),
    tag: document.getElementById('userTag'),
    level: document.getElementById('userLevel'),
    xp: document.getElementById('userXP'),
    loader: document.getElementById('loader')
};

export function init() {
    ui.searchBtn.addEventListener('click', handleSearch);
    
    // Auto-load if saved
    const savedId = localStorage.getItem('xzm_user_id');
    if (savedId) {
        ui.userIdInput.value = savedId;
        handleSearch();
    }
}

async function handleSearch() {
    const userId = ui.userIdInput.value.trim();
    if (!userId) return alert("Por favor, ingresa un ID de Discord válido.");

    setLoading(true);
    try {
        const data = await getUserProfile(userId);
        updateProfileUI(data);
        localStorage.setItem('xzm_user_id', userId);
        ui.mainContent.style.display = 'block';
    } catch (error) {
        alert(error.message);
        ui.mainContent.style.display = 'none';
    } finally {
        setLoading(false);
    }
}

function updateProfileUI(data) {
    ui.avatar.src = data.avatar;
    ui.name.innerText = data.globalName || data.username;
    ui.tag.innerText = `@${data.username}`;
    ui.level.innerText = data.level;
    ui.xp.innerText = data.xp.toLocaleString();
}

function setLoading(isLoading) {
    ui.searchBtn.disabled = isLoading;
    ui.searchBtn.innerText = isLoading ? "Sincronizando..." : "Sincronizar";
}
