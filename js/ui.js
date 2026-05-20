import { getUserProfile, getSavedApiBase, setApiBase, updateUserProfile, getShopItems, purchaseItem, equipItem, getPanelUrl } from './api.js';

const ui = {
    searchBtn: document.getElementById('searchBtn'),
    userIdInput: document.getElementById('userId'),
    apiBaseInput: document.getElementById('apiBase'),
    saveApiBtn: document.getElementById('saveApiBtn'),
    navItems: document.querySelectorAll('.nav-item'),
    mainContent: document.getElementById('mainContent'),
    profileTab: document.getElementById('profileTab'),
    settingsTab: document.getElementById('settingsTab'),
    storeTab: document.getElementById('storeTab'),
    avatar: document.getElementById('userAvatar'),
    name: document.getElementById('userName'),
    tag: document.getElementById('userTag'),
    level: document.getElementById('userLevel'),
    xp: document.getElementById('userXP'),
    activeTheme: document.getElementById('activeTheme'),
    activeContour: document.getElementById('activeContour'),
    panelPreview: document.getElementById('profilePanelPreview'),
    descriptionInput: document.getElementById('profileDescription'),
    accentColorInput: document.getElementById('accentColor'),
    backgroundUrlInput: document.getElementById('backgroundUrl'),
    saveProfileBtn: document.getElementById('saveProfileBtn'),
    themeSelect: document.getElementById('themeSelect'),
    contourSelect: document.getElementById('contourSelect'),
    shopGrid: document.getElementById('shopGrid'),
    inventoryNotice: document.getElementById('inventoryNotice')
};

// Animación de entrada suave
function animateIn(element) {
    element.style.opacity = '0';
    element.style.transform = 'translateY(20px)';
    element.offsetHeight; // Trigger reflow
    element.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
    element.style.opacity = '1';
    element.style.transform = 'translateY(0)';
}

// Animación de salida suave
function animateOut(element, callback) {
    element.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
    element.style.opacity = '0';
    element.style.transform = 'translateY(-10px)';
    setTimeout(callback, 300);
}

export function init() {
    ui.searchBtn.addEventListener('click', handleSearch);
    ui.userIdInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    });

    ui.saveApiBtn.addEventListener('click', handleSaveApiBase);
    ui.saveProfileBtn.addEventListener('click', handleSaveProfile);
    ui.apiBaseInput.value = getSavedApiBase() || "";

    ui.navItems.forEach(item => {
        item.addEventListener('click', () => {
            ui.navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
            showTab(item.dataset.target);
        });
    });

    // Agregar ripple effect al botón
    ui.searchBtn.addEventListener('mousedown', createRipple);
    ui.saveApiBtn.addEventListener('mousedown', createRipple);
    ui.saveProfileBtn.addEventListener('mousedown', createRipple);

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

    // Detectar preferencia de modo oscuro/claro
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
        document.documentElement.style.colorScheme = 'light';
    }

    // Escuchar cambios en preferencia de tema
    window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', (e) => {
        document.documentElement.style.colorScheme = e.matches ? 'light' : 'dark';
    });
}

async function handleSearch(isToken = false) {
    const input = ui.userIdInput.value.trim();
    if (!input) return alert("Por favor, ingresa un ID o usa el link de Discord.");

    setLoading(true);
    try {
        const data = await getUserProfile(input);
        
        // Animar salida del contenido anterior si existe
        if (ui.mainContent.style.display !== 'none') {
            animateOut(ui.mainContent, () => {
                updateProfileUI(data);
                ui.mainContent.style.display = 'block';
                animateIn(ui.mainContent);
            });
        } else {
            updateProfileUI(data);
            ui.mainContent.style.display = 'block';
            animateIn(ui.mainContent);
        }

        // Guardar solo si es un ID real (no un token temporal)
        if (!isToken && input.length > 15) {
            localStorage.setItem('xzm_user_id', input);
        } else if (isToken) {
            // Guardar el ID real devuelto por la API para futuras compras
            localStorage.setItem('xzm_user_id', data.id);
        }
    } catch (error) {
        console.error('Error:', error);
        alert(error.message);
        
        // Animar salida del contenido en caso de error
        if (ui.mainContent.style.display !== 'none') {
            animateOut(ui.mainContent, () => {
                ui.mainContent.style.display = 'none';
            });
        }
    } finally {
        setLoading(false);
    }
}

function handleSaveApiBase() {
    const base = ui.apiBaseInput.value.trim();
    if (!base) {
        alert("Ingresa la URL de la API pública para continuar.");
        return;
    }
    setApiBase(base);
    alert("API pública guardada. Ahora puedes sincronizar tu usuario con esa URL.");
}

function showTab(target) {
    ui.profileTab.style.display = target === 'profileTab' ? 'block' : 'none';
    ui.settingsTab.style.display = target === 'settingsTab' ? 'block' : 'none';
    ui.storeTab.style.display = target === 'storeTab' ? 'block' : 'none';
}

async function handleSaveProfile() {
    const userId = ui.userIdInput.value.trim();
    if (!userId) return alert("Sincroniza tu perfil antes de guardar cambios.");

    const changes = {
        description: ui.descriptionInput.value.trim(),
        accentColor: ui.accentColorInput.value.trim() || 'auto',
        backgroundUrl: ui.backgroundUrlInput.value.trim() || 'default-1',
        activeTheme: ui.themeSelect.value,
        activeContour: ui.contourSelect.value
    };

    try {
        const result = await updateUserProfile(userId, changes);
        if (result.error) throw new Error(result.error);
        updateProfileUI(result);
        setPanelPreview(result.id);
        alert("Perfil actualizado correctamente.");
    } catch (error) {
        console.error('Update Error:', error);
        alert(error.message || 'No se pudo actualizar el perfil.');
    }
}

async function loadShop(userId) {
    try {
        const shopData = await getShopItems();
        const profileData = await getUserProfile(userId);
        renderShop(shopData.shop, profileData);
    } catch (error) {
        console.error('Shop load error:', error);
        ui.shopGrid.innerHTML = '<p style="color:#f55">No se pudo cargar la tienda.</p>';
    }
}

function renderShop(shop, profileData) {
    const inventory = profileData.inventory || { themes: ['macos'], contours: [] };
    const activeTheme = profileData.activeTheme;
    const activeContour = profileData.activeContour;

    const renderItems = (category, items) => Object.entries(items).map(([key, item]) => {
        const owned = category === 'themes' ? inventory.themes.includes(key) : inventory.contours.includes(key);
        const equipped = category === 'themes' ? activeTheme === key : activeContour === key;
        return `
            <div class="item-card">
                <div class="item-icon-placeholder"></div>
                <div class="item-name">${item.name}</div>
                <span class="rarity">${item.rarity}</span>
                <span class="item-price">${item.price.toLocaleString()} XP</span>
                <div class="item-actions">
                    ${owned ? (equipped ? `<button class="btn-buy disabled" disabled>Equipado</button>` : `<button class="btn-buy" data-category="${category}" data-item="${key}">Equipar</button>`) : `<button class="btn-buy" data-category="${category}" data-item="${key}">Comprar</button>`}
                </div>
            </div>
        `;
    }).join('');

    ui.shopGrid.innerHTML = `
        <div class="shop-section-title">Temas</div>
        ${renderItems('themes', shop.themes)}
        <div class="shop-section-title">Contornos</div>
        ${renderItems('contours', shop.contours)}
    `;

    ui.shopGrid.querySelectorAll('.btn-buy').forEach(btn => {
        btn.addEventListener('click', async () => {
            const category = btn.dataset.category;
            const itemId = btn.dataset.item;
            if (btn.innerText === 'Comprar') {
                await handlePurchase(profileData.id, itemId, category);
            } else {
                await handleEquip(profileData.id, itemId, category);
            }
        });
    });
}

async function handlePurchase(userId, itemId, category) {
    try {
        const result = await purchaseItem(userId, itemId, category);
        if (result.error) throw new Error(result.error);
        const updated = await getUserProfile(userId);
        updateProfileUI(updated);
        await loadShop(userId);
        setPanelPreview(userId);
        alert('Compra completada. Inventario actualizado.');
    } catch (error) {
        console.error('Purchase Error:', error);
        alert(error.message || 'No se pudo completar la compra.');
    }
}

async function handleEquip(userId, itemId, category) {
    try {
        const result = await equipItem(userId, category, itemId);
        if (result.error) throw new Error(result.error);
        const updated = await getUserProfile(userId);
        updateProfileUI(updated);
        await loadShop(userId);
        setPanelPreview(userId);
        alert('Item equipado correctamente.');
    } catch (error) {
        console.error('Equip Error:', error);
        alert(error.message || 'No se pudo equipar este item.');
    }
}

async function setPanelPreview(userId) {
    const panelUrl = await getPanelUrl(userId);
    ui.panelPreview.src = `${panelUrl}?t=${Date.now()}`;
}

function updateProfileUI(data) {
    // Animar avatar
    ui.avatar.style.opacity = '0';
    ui.avatar.style.transform = 'scale(0.9)';
    
    ui.avatar.src = data.avatar;
    ui.avatar.onload = () => {
        ui.avatar.style.transition = 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
        ui.avatar.style.opacity = '1';
        ui.avatar.style.transform = 'scale(1)';
    };

    // Animar nombre
    ui.name.style.opacity = '0';
    ui.name.style.transform = 'translateX(-10px)';
    setTimeout(() => {
        ui.name.innerText = data.globalName || data.username;
        ui.name.style.transition = 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
        ui.name.style.opacity = '1';
        ui.name.style.transform = 'translateX(0)';
    }, 100);

    // Animar tag
    ui.tag.style.opacity = '0';
    setTimeout(() => {
        ui.tag.innerText = `@${data.username}`;
        ui.tag.style.transition = 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
        ui.tag.style.opacity = '1';
    }, 150);

    // Animar nivel
    ui.level.style.opacity = '0';
    setTimeout(() => {
        ui.level.innerText = data.level;
        ui.level.style.transition = 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
        ui.level.style.opacity = '1';
    }, 200);

    // Animar XP con contador
    animateCounter(ui.xp, parseInt(data.xp));

    ui.activeTheme.innerText = data.activeTheme || 'macos';
    ui.activeContour.innerText = data.activeContour || 'none';

    ui.descriptionInput.value = data.customization.description || '';
    ui.accentColorInput.value = data.customization.accentColor === 'auto' ? '' : data.customization.accentColor;
    ui.backgroundUrlInput.value = data.customization.backgroundUrl && data.customization.backgroundUrl !== 'default-1' ? data.customization.backgroundUrl : '';
    ui.themeSelect.value = data.activeTheme || 'macos';
    ui.contourSelect.value = data.activeContour || 'none';

    setPanelPreview(data.id);
    loadShop(data.id);
}

function animateCounter(element, finalValue) {
    const duration = 1000;
    const startTime = Date.now();
    const startValue = 0;

    element.style.opacity = '0';
    setTimeout(() => {
        element.style.transition = 'opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
        element.style.opacity = '1';
    }, 250);

    function update() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const currentValue = Math.floor(startValue + (finalValue - startValue) * progress);
        element.innerText = currentValue.toLocaleString();

        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }

    update();
}

function setLoading(isLoading) {
    ui.searchBtn.disabled = isLoading;
    
    if (isLoading) {
        ui.searchBtn.style.opacity = '0.7';
        ui.searchBtn.innerText = "Sincronizando...";
        ui.searchBtn.style.pointerEvents = 'none';
    } else {
        ui.searchBtn.style.opacity = '1';
        ui.searchBtn.innerText = "Sincronizar";
        ui.searchBtn.style.pointerEvents = 'auto';
    }
}

// Efecto ripple para botones
function createRipple(event) {
    const button = event.currentTarget;
    const ripple = document.createElement('span');
    
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;

    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = x + 'px';
    ripple.style.top = y + 'px';
    ripple.classList.add('ripple');

    // Limpiar ripples anteriores
    const ripples = button.querySelectorAll('.ripple');
    ripples.forEach(r => r.remove());

    button.appendChild(ripple);
}
