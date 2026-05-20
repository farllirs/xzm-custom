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

    // 1. Prioridad: Detectar token en la URL (Link desde Discord)
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    if (token) {
        ui.userIdInput.value = token;
        handleSearch(true); // Pasar flag de que es un token
        // Limpiar URL para seguridad
        window.history.replaceState({}, document.title, window.location.pathname);
    } else {
        // 2. Cargar si hay ID guardado previamente
        const savedId = localStorage.getItem('xzm_user_id');
        if (savedId) {
            ui.userIdInput.value = savedId;
            handleSearch();
        }
    }
}

async function handleSearch(isToken = false) {
    const input = ui.userIdInput.value.trim();
    if (!input) return alert("Por favor, ingresa un ID o usa el link de Discord.");

    setLoading(true);
    try {
        const data = await getUserProfile(input);
        updateProfileUI(data);

        // Guardar solo si es un ID real (no un token temporal)
        if (!isToken && input.length > 15) {
            localStorage.setItem('xzm_user_id', input);
        } else if (isToken) {
            // Guardar el ID real devuelto por la API para futuras compras
            localStorage.setItem('xzm_user_id', data.id);
        }

        ui.mainContent.style.display = 'block';
    } catch (error) {
...
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
