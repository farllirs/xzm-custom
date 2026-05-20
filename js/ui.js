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

    // Agregar ripple effect al botón
    ui.searchBtn.addEventListener('mousedown', createRipple);

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
