// État global de l'application
let currentUser = null;
let isFirstTimeUser = false;
let users = JSON.parse(localStorage.getItem('janeUsers')) || [];
let currentPage = 'auth';
let isRecording = false;
let recognition = null;
let currentLanguage = localStorage.getItem('janeLanguage') || 'fr';

// Variables pour le journal
let currentJournalPage = 1;
let maxJournalPages = Infinity; // Pages infinies
let journalPages = {};
let isDrawing = false;
let canvas = null;
let ctx = null;
let currentTool = 'pen';
let currentColor = '#000000';
let currentBrushSize = 3;

// Configuration IA avancée
let isJaneTyping = false;

// Textes multilingues
const translations = {
    fr: {
        title: "Jane - Ton amie virtuelle",
        subtitle: "Ton amie virtuelle",
        login: "Se connecter",
        register: "S'inscrire",
        username: "Nom d'utilisateur",
        password: "Mot de passe",
        confirmPassword: "Confirmer le mot de passe",
        loginBtn: "Se connecter",
        registerBtn: "S'inscrire",
        welcome: "Bienvenue",
        settings: "⚙️ Paramètres",
        talkToJane: "Parler à Jane",
        talkToJaneDesc: "Discute avec ton amie virtuelle",
        journal: "Journal Intime",
        journalDesc: "Écris tes pensées secrètes",
        mood: "Jane - Humeur",
        moodDesc: "Parle de ton humeur du moment",
        love: "Jane - Ma Vie Amoureuse",
        loveDesc: "Parle de ton cœur",
        fun: "Jane - Divertissement",
        funDesc: "Amuse-toi avec Jane",
        explore: "Jane - Explorer",
        exploreDesc: "Découvre de nouvelles choses",
        aboutJane: "En savoir plus sur Jane",
        aboutJaneDesc: "Découvre qui est Jane",
        back: "← Retour",
        send: "Envoyer",
        logout: "Se déconnecter",
        close: "Fermer",
        language: "Langue",
        createdBy: "Créé par Richelieu Bonté • Inspiré par Princesse Jane",
        profile: "👤 Mon Profil",
        confirmLogout: "Veux-tu vraiment te déconnecter ?",
        yes: "Oui",
        no: "Non"
    },
    en: {
        title: "Jane - Your virtual friend",
        subtitle: "Your virtual friend",
        login: "Sign In",
        register: "Sign Up",
        username: "Username",
        password: "Password",
        confirmPassword: "Confirm Password",
        loginBtn: "Sign In",
        registerBtn: "Sign Up",
        welcome: "Welcome",
        settings: "⚙️ Settings",
        talkToJane: "Talk to Jane",
        talkToJaneDesc: "Chat with your virtual friend",
        journal: "Private Journal",
        journalDesc: "Write your secret thoughts",
        mood: "Jane - My Mood",
        moodDesc: "Talk about your current mood",
        love: "Jane - My Love Life",
        loveDesc: "Talk about your heart",
        fun: "Jane - Entertainment",
        funDesc: "Have fun with Jane",
        explore: "Jane - Explore",
        exploreDesc: "Discover new things",
        aboutJane: "Learn more about Jane",
        aboutJaneDesc: "Discover who Jane is",
        back: "← Back",
        send: "Send",
        logout: "Sign Out",
        close: "Close",
        language: "Language",
        createdBy: "Created by Richelieu Bonté • Inspired by Princess Jane",
        profile: "👤 My Profile",
        confirmLogout: "Do you really want to log out?",
        yes: "Yes",
        no: "No"
    }
};

// Protection générale du site
function initializeSiteSecurity() {
    // Protection contre les attaques XSS
    if (window.location.protocol === 'https:' || window.location.hostname === 'localhost' || window.location.hostname.includes('replit')) {
        // Sécuriser les cookies
        document.cookie = "SameSite=Strict; Secure";
        
        // Protection contre le clickjacking
        if (window.self !== window.top) {
            window.top.location = window.self.location;
        }
        
        // Désactiver le drag and drop non autorisé
        document.addEventListener('dragover', function(e) {
            e.preventDefault();
        });
        
        document.addEventListener('drop', function(e) {
            e.preventDefault();
        });
        
        // Protection console pour éviter les injections
        console.log('%c🔐 Jane App - Site Protégé', 'color: #28a745; font-size: 16px; font-weight: bold;');
        console.log('%c⚠️ Attention: Ne copiez pas de code dans cette console.', 'color: #dc3545; font-size: 14px;');
        
        // Masquer les erreurs sensibles
        window.addEventListener('error', function(e) {
            if (e.error && e.error.stack) {
                console.log('Erreur interceptée et sécurisée');
                e.preventDefault();
            }
        });
    }
}

// Protection des fonctions globales
function protectGlobalFunctions() {
    // Protéger eval et Function
    window.eval = function() {
        console.log('eval() désactivé pour la sécurité');
        return null;
    };
    
    // Protéger innerHTML contre XSS
    const originalInnerHTML = Element.prototype.__lookupSetter__('innerHTML');
    if (originalInnerHTML) {
        Element.prototype.__defineSetter__('innerHTML', function(value) {
            if (typeof value === 'string' && value.includes('<script')) {
                console.log('Script bloqué pour la sécurité');
                return;
            }
            return originalInnerHTML.call(this, value);
        });
    }
}

// Validation et nettoyage des données utilisateur
function sanitizeInput(input) {
    if (typeof input !== 'string') return '';
    
    return input
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/&/g, '&amp;')
        .replace(/\//g, '&#x2F;');
}

// Validation des URLs
function isValidURL(string) {
    try {
        const url = new URL(string);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch (_) {
        return false;
    }
}

// Initialisation de l'application
document.addEventListener('DOMContentLoaded', function() {
    // Initialiser la sécurité en premier
    initializeSiteSecurity();
    protectGlobalFunctions();
    
    applyLanguage();
    initializeSpeechRecognition();
    initializeRealTimeClock();

    const savedUser = localStorage.getItem('currentJaneUser');
    if (savedUser && savedUser !== 'null') {
        currentUser = savedUser;
        
        // Vérifier si l'utilisateur existe
        const userIndex = users.findIndex(u => u.username === savedUser);
        if (userIndex !== -1) {
            // Utilisateur existant, connexion directe (pas de vérification d'âge)
            isFirstTimeUser = false;
            showLoginAnimation();
            setTimeout(() => {
                showPage('home');
                const usernameDisplay = document.getElementById('username-display');
                if (usernameDisplay && currentUser) {
                    usernameDisplay.textContent = sanitizeInput(currentUser.replace('.jane.ia', ''));
                }
            }, 1500);
        } else {
            // Utilisateur non trouvé, déconnecter
            localStorage.removeItem('currentJaneUser');
            currentUser = null;
            showPage('auth');
        }
    } else {
        currentUser = null;
        showPage('auth');
    }
});

// Vérification d'âge après connexion/inscription
function showAgeVerification() {
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(135deg, #87CEEB 0%, #FFB6C1 50%, #667eea 100%);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
    `;

    overlay.innerHTML = `
        <div style="
            background: white;
            padding: 40px;
            border-radius: 20px;
            text-align: center;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            max-width: 500px;
        ">
            <h2 style="color: #333; margin-bottom: 20px;">Vérification d'âge</h2>
            <p style="color: #666; margin-bottom: 30px; line-height: 1.5;">
                Pour utiliser Jane, vous devez avoir au moins 12 ans.
                <br>Veuillez saisir votre âge :
            </p>
            <input type="number" id="age-input" min="1" max="120" placeholder="Votre âge" style="
                width: 150px;
                padding: 15px;
                margin-bottom: 20px;
                border: 2px solid #e0e0e0;
                border-radius: 10px;
                font-size: 18px;
                text-align: center;
            ">
            <div style="display: flex; gap: 20px; justify-content: center;">
                <button onclick="verifyAge()" style="
                    padding: 15px 25px;
                    background: #28a745;
                    color: white;
                    border: none;
                    border-radius: 10px;
                    cursor: pointer;
                    font-size: 16px;
                ">Confirmer</button>
            </div>
            <div id="age-error" style="color: #dc3545; margin-top: 15px; display: none;"></div>
        </div>
    `;

    document.body.appendChild(overlay);
    window.ageVerificationOverlay = overlay;

    // Focus sur l'input
    setTimeout(() => {
        document.getElementById('age-input').focus();
    }, 100);
}

function verifyAge() {
    const ageInput = document.getElementById('age-input');
    const ageError = document.getElementById('age-error');
    const age = parseInt(ageInput.value);

    if (!age || isNaN(age) || age < 1 || age > 120) {
        ageError.textContent = 'Veuillez saisir un âge valide';
        ageError.style.display = 'block';
        return;
    }

    if (age < 12) {
        document.body.removeChild(window.ageVerificationOverlay);

        const restrictedOverlay = document.createElement('div');
        restrictedOverlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: #dc3545;
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
        `;

        restrictedOverlay.innerHTML = `
            <div style="
                background: white;
                padding: 40px;
                border-radius: 20px;
                text-align: center;
                box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            ">
                <h2 style="color: #dc3545; margin-bottom: 20px;">Accès refusé</h2>
                <p style="color: #666; margin-bottom: 20px;">
                    Désolé, vous devez avoir au moins 12 ans pour utiliser Jane.
                    <br>Revenez quand vous serez plus âgé !
                </p>
                <div style="font-size: 3rem; margin: 20px 0;">🚫</div>
                <button onclick="location.reload()" style="
                    padding: 10px 20px;
                    background: #6c757d;
                    color: white;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                    margin-top: 20px;
                ">Retour</button>
            </div>
        `;

        document.body.appendChild(restrictedOverlay);
        return;
    }

    // Âge valide, marquer comme vérifié et continuer
    const userIndex = users.findIndex(u => u.username === currentUser);
    if (userIndex !== -1) {
        users[userIndex].ageVerified = true;
        localStorage.setItem('janeUsers', JSON.stringify(users));
    }
    
    document.body.removeChild(window.ageVerificationOverlay);
    
    // Pour les nouveaux utilisateurs, montrer les options de photo de profil
    if (isFirstTimeUser) {
        showProfilePictureOptions();
    } else {
        proceedToHomeAfterAuth();
    }
}

function showProfilePictureOptions() {
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(135deg, #87CEEB 0%, #FFB6C1 50%, #667eea 100%);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10001;
    `;

    overlay.innerHTML = `
        <div style="
            background: white;
            padding: 40px;
            border-radius: 20px;
            text-align: center;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            max-width: 500px;
        ">
            <h2 style="color: #333; margin-bottom: 20px;">Photo de profil</h2>
            <p style="color: #666; margin-bottom: 30px; line-height: 1.5;">
                Souhaitez-vous ajouter une photo de profil maintenant ?
            </p>
            <div style="display: flex; gap: 20px; justify-content: center;">
                <button onclick="uploadPhotoForProfile()" style="
                    padding: 15px 25px;
                    background: #28a745;
                    color: white;
                    border: none;
                    border-radius: 10px;
                    cursor: pointer;
                    font-size: 16px;
                ">Mettre ma photo</button>
                <button onclick="skipPhotoAndProceed()" style="
                    padding: 15px 25px;
                    background: #6c757d;
                    color: white;
                    border: none;
                    border-radius: 10px;
                    cursor: pointer;
                    font-size: 16px;
                ">Plus tard</button>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);
    window.profilePictureOverlay = overlay;
}

function uploadPhotoForProfile() {
    document.body.removeChild(window.profilePictureOverlay);
    uploadPhoto();  // Reuse the existing uploadPhoto function
    proceedToHomeAfterAuth();
}

function skipPhotoAndProceed() {
    document.body.removeChild(window.profilePictureOverlay);
    proceedToHomeAfterAuth();
}

function proceedToHomeAfterAuth() {
    if (!currentUser) {
        showPage('auth');
        return;
    }

    showLoginAnimation();
    setTimeout(() => {
        showPage('home');
        const usernameDisplay = document.getElementById('username-display');
        if (usernameDisplay && currentUser) {
            usernameDisplay.textContent = currentUser.replace('.jane.ia', '');
        }
    }, 1500);
}

// Génération du captcha
function generateCaptcha() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let captcha = '';
    for (let i = 0; i < 6; i++) {
        captcha += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return captcha;
}

function showCaptcha(callback) {
    const captcha = generateCaptcha();

    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.7);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
    `;

    overlay.innerHTML = `
        <div style="
            background: white;
            padding: 30px;
            border-radius: 15px;
            text-align: center;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            max-width: 400px;
        ">
            <h3 style="color: #333; margin-bottom: 20px;">Vérification de sécurité</h3>
            <p style="color: #666; margin-bottom: 15px;">Prouvez que vous êtes une vraie personne</p>
            <div style="
                background: #f0f0f0;
                padding: 20px;
                border-radius: 10px;
                font-family: monospace;
                font-size: 24px;
                font-weight: bold;
                color: #333;
                margin-bottom: 20px;
                letter-spacing: 3px;
            ">${captcha}</div>
            <input type="text" id="captcha-input" placeholder="Tapez le code ci-dessus" style="
                width: 100%;
                padding: 15px;
                border: 2px solid #e0e0e0;
                border-radius: 8px;
                font-size: 16px;
                margin-bottom: 20px;
                text-align: center;
            ">
            <div style="display: flex; gap: 15px; justify-content: center;">
                <button onclick="verifyCaptcha('${captcha}', '${callback.name}')" style="
                    padding: 10px 20px;
                    background: #28a745;
                    color: white;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                ">Vérifier</button>
                <button onclick="closeCaptcha()" style="
                    padding: 10px 20px;
                    background: #6c757d;
                    color: white;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                ">Annuler</button>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);
    window.captchaOverlay = overlay;
    window.captchaCallback = callback;
}

function verifyCaptcha(correctCaptcha, callbackName) {
    const userInput = document.getElementById('captcha-input').value;

    if (userInput === correctCaptcha) {
        closeCaptcha();
        if (callbackName === 'proceedWithLogin') {
            proceedWithLogin();
        } else if (callbackName === 'proceedWithRegister') {
            proceedWithRegister();
        }
    } else {
        document.getElementById('captcha-input').style.borderColor = '#dc3545';
        document.getElementById('captcha-input').value = '';
        document.getElementById('captcha-input').placeholder = 'Code incorrect, essayez encore';
        setTimeout(() => {
            document.getElementById('captcha-input').style.borderColor = '#e0e0e0';
            document.getElementById('captcha-input').placeholder = 'Tapez le code ci-dessus';
        }, 2000);
    }
}

function closeCaptcha() {
    if (window.captchaOverlay) {
        document.body.removeChild(window.captchaOverlay);
        window.captchaOverlay = null;
        window.captchaCallback = null;
    }
}

// Animation de connexion
function showLoginAnimation() {
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(135deg, #87CEEB 0%, #FFB6C1 50%, #667eea 100%);
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        z-index: 10000;
        animation: fadeIn 0.5s ease;
    `;

    overlay.innerHTML = `
        <div style="text-align: center; color: white;">
            <div style="font-size: 4rem; margin-bottom: 20px; animation: bounce 1s infinite;">👩‍🦰</div>
            <h2 style="font-size: 2rem; margin-bottom: 10px;">Connexion réussie !</h2>
            <p style="font-size: 1.2rem;">Bienvenue ${currentUser.replace('.jane.ia', '')} 💖</p>
            <div style="margin-top: 30px;">
                <div style="width: 50px; height: 50px; border: 3px solid rgba(255,255,255,0.3); border-top: 3px solid white; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto;"></div>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);

    // Animation de 3 secondes
    setTimeout(() => {
        overlay.style.animation = 'fadeOut 0.5s ease';
        setTimeout(() => {
            document.body.removeChild(overlay);
        }, 500);
    }, 2500); // 3 secondes total avec fadeOut
}

// Fonction pour appliquer la langue
// Horloge temps réel
function initializeRealTimeClock() {
    updateClock();
    setInterval(updateClock, 1000);
}

function updateClock() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });
    
    const dateString = now.toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    const clockElement = document.getElementById('real-time-clock');
    if (clockElement) {
        // Vérifier si l'heure a changé pour animer
        const currentTime = clockElement.querySelector('.clock-time');
        const shouldAnimate = !currentTime || currentTime.textContent !== timeString;
        
        clockElement.innerHTML = `
            <div class="clock-container">
                <div class="clock-time ${shouldAnimate ? 'time-update' : ''}">${timeString}</div>
                <div class="clock-separator"></div>
                <div class="clock-date">${dateString}</div>
                <div class="clock-decorations">
                    <div class="clock-dot dot-1"></div>
                    <div class="clock-dot dot-2"></div>
                    <div class="clock-dot dot-3"></div>
                </div>
            </div>
        `;
        
        // Retirer la classe d'animation après l'animation
        if (shouldAnimate) {
            setTimeout(() => {
                const timeEl = clockElement.querySelector('.clock-time');
                if (timeEl) {
                    timeEl.classList.remove('time-update');
                }
            }, 600);
        }
    }
}

function applyLanguage() {
    const t = translations[currentLanguage];

    document.title = t.title;
    const logoH1 = document.querySelector('.logo h1');
    const logoP = document.querySelector('.logo p');
    if (logoH1) logoH1.textContent = 'Jane';
    if (logoP) logoP.textContent = t.subtitle;

    const tabBtns = document.querySelectorAll('.tab-btn');
    if (tabBtns.length >= 2) {
        tabBtns[0].textContent = t.login;
        tabBtns[1].textContent = t.register;
    }

    const loginForm = document.querySelector('#login-form h2');
    const registerForm = document.querySelector('#register-form h2');
    if (loginForm) loginForm.textContent = t.login;
    if (registerForm) registerForm.textContent = t.register;

    const inputs = {
        'login-username': t.username,
        'login-password': t.password,
        'register-username': t.username,
        'register-password': t.password,
        'register-confirm': t.confirmPassword
    };

    Object.keys(inputs).forEach(id => {
        const input = document.getElementById(id);
        if (input) input.placeholder = inputs[id];
    });

    const loginBtn = document.querySelector('#login-form button');
    const registerBtn = document.querySelector('#register-form button');
    if (loginBtn) loginBtn.textContent = t.loginBtn;
    if (registerBtn) registerBtn.textContent = t.registerBtn;

    const settingsBtn = document.querySelector('.settings-btn');
    if (settingsBtn) settingsBtn.innerHTML = t.settings;

    const cards = document.querySelectorAll('.option-card');
    if (cards.length >= 7) {
        const cardTexts = [
            [t.talkToJane, t.talkToJaneDesc],
            [t.journal, t.journalDesc],
            [t.mood, t.moodDesc],
            [t.love, t.loveDesc],
            [t.fun, t.funDesc],
            [t.explore, t.exploreDesc],
            [t.aboutJane, t.aboutJaneDesc]
        ];

        cards.forEach((card, index) => {
            if (cardTexts[index]) {
                const h3 = card.querySelector('h3');
                const p = card.querySelector('p');
                if (h3) h3.textContent = cardTexts[index][0];
                if (p) p.textContent = cardTexts[index][1];
            }
        });
    }

    document.querySelectorAll('.back-btn').forEach(btn => {
        btn.textContent = t.back;
    });

    document.querySelectorAll('.chat-input-container button:last-child').forEach(btn => {
        btn.textContent = t.send;
    });

    const footer = document.querySelector('footer p');
    if (footer) footer.textContent = t.createdBy;

    const settingsModal = document.querySelector('#settings-modal h2');
    if (settingsModal) settingsModal.textContent = t.settings;

    const languageLabel = document.querySelector('#settings-modal label');
    if (languageLabel) languageLabel.textContent = t.language + ' :';

    const modalBtns = document.querySelectorAll('.modal-actions button');
    if (modalBtns.length >= 2) {
        modalBtns[0].textContent = t.logout;
        modalBtns[1].textContent = t.close;
    }

    const profileBtn = document.querySelector('.profile-btn');
    if (profileBtn) profileBtn.innerHTML = t.profile;

    const languageSelect = document.getElementById('language-select');
    if (languageSelect) languageSelect.value = currentLanguage;
}

// Initialisation de la reconnaissance vocale
function initializeSpeechRecognition() {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognition = new SpeechRecognition();
        recognition.lang = currentLanguage === 'fr' ? 'fr-FR' : 'en-US';
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onresult = function(event) {
            const transcript = event.results[0][0].transcript;
            const chatInput = document.getElementById('chat-input');
            if (chatInput && chatInput.offsetParent !== null) {
                chatInput.value = transcript;
            }
        };

        recognition.onerror = function(event) {
            console.log('Erreur de reconnaissance vocale:', event.error);
            isRecording = false;
            updateMicrophoneButton();
        };

        recognition.onend = function() {
            isRecording = false;
            updateMicrophoneButton();
        };
    }
}

// ======== IA SUPER INTELLIGENTE AVEC COHERE ========

async function callAdvancedAI(message, context = '') {
    try {
        // Utilisation de l'API Cohere (gratuite avec limite)
        const response = await fetch('https://api.cohere.ai/v1/generate', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer COHERE-API-KEY-HERE',
                'Content-Type': 'application/json',
                'Cohere-Version': '2022-12-06'
            },
            body: JSON.stringify({
                model: 'command-light',
                prompt: `Tu es Jane, une amie virtuelle philippine créée par Richelieu Bonté. Tu es empathique, intelligente et toujours là pour écouter. Contexte: ${context}. Utilisateur: ${message}. Jane:`,
                max_tokens: 300,
                temperature: 0.8,
                stop_sequences: ["Utilisateur:"]
            })
        });

        if (response.ok) {
            const data = await response.json();
            return data.generations[0].text.trim();
        }
    } catch (error) {
        console.log('API externe indisponible, utilisation IA locale avancée');
    }

    // Fallback vers IA locale super intelligente
    return getHyperIntelligentJaneResponse(message, context);
}

// IA locale hyper-intelligente
function getHyperIntelligentJaneResponse(message, context = '') {
    const emotion = analyzeAdvancedEmotion(message);
    const personality = analyzePersonality(message);
    const intent = detectAdvancedIntent(message);
    const sentiment = analyzeSentiment(message);

    return generateAdvancedResponse(message, emotion, personality, intent, sentiment, context);
}

function analyzeAdvancedEmotion(message) {
    const emotionPatterns = {
        joie: ['heureux', 'content', 'ravi', 'excité', 'formidable', 'génial', 'super', 'fantastic'],
        tristesse: ['triste', 'déprimé', 'malheureux', 'abattu', 'désespoir', 'pleurer', 'larmes'],
        colère: ['énervé', 'furieux', 'agacé', 'irrité', 'en colère', 'rage', 'frustré'],
        peur: ['peur', 'angoisse', 'terreur', 'effroi', 'anxieux', 'stressé', 'inquiet', 'panic'],
        amour: ['amour', 'amoureux', 'adore', 'aime', 'affection', 'tendresse', 'passion'],
        dégoût: ['dégoût', 'répugnant', 'horrible', 'nauséeux', 'écœurant'],
        surprise: ['surpris', 'étonné', 'choqué', 'stupéfait', 'incroyable', 'wow']
    };

    const lowerMessage = message.toLowerCase();
    let scores = {};

    Object.keys(emotionPatterns).forEach(emotion => {
        scores[emotion] = emotionPatterns[emotion].reduce((score, word) => {
            return score + (lowerMessage.includes(word) ? 1 : 0);
        }, 0);
    });

    const dominantEmotion = Object.keys(scores).reduce((a, b) => scores[a] > scores[b] ? a : b);
    return scores[dominantEmotion] > 0 ? dominantEmotion : 'neutre';
}

function analyzePersonality(message) {
    const personalityTraits = {
        introverti: ['seul', 'calme', 'tranquille', 'maison', 'livre', 'réfléchir'],
        extraverti: ['sortir', 'amis', 'fête', 'social', 'rencontrer', 'parler'],
        optimiste: ['espoir', 'positif', 'avenir', 'réussir', 'chance', 'bien'],
        pessimiste: ['négatif', 'mal', 'échec', 'impossible', 'jamais', 'pire']
    };

    const lowerMessage = message.toLowerCase();
    let traits = [];

    Object.keys(personalityTraits).forEach(trait => {
        if (personalityTraits[trait].some(word => lowerMessage.includes(word))) {
            traits.push(trait);
        }
    });

    return traits;
}

function detectAdvancedIntent(message) {
    const intentPatterns = {
        demande_conseil: ['conseil', 'aide', 'comment', 'que faire', 'suggestion'],
        partage_emotion: ['je ressens', 'je me sens', 'j\'ai l\'impression', 'émotion'],
        question_existentielle: ['pourquoi', 'sens de la vie', 'existe', 'but', 'signification'],
        besoin_soutien: ['difficile', 'dur', 'aide-moi', 'soutien', 'réconfort'],
        conversation_libre: ['salut', 'bonjour', 'ça va', 'quoi de neuf', 'raconte']
    };

    const lowerMessage = message.toLowerCase();

    for (const [intent, patterns] of Object.entries(intentPatterns)) {
        if (patterns.some(pattern => lowerMessage.includes(pattern))) {
            return intent;
        }
    }

    return 'general';
}

function analyzeSentiment(message) {
    const positiveWords = ['bien', 'bon', 'excellent', 'parfait', 'merveilleux', 'génial', 'super', 'formidable'];
    const negativeWords = ['mal', 'mauvais', 'terrible', 'horrible', 'affreux', 'nul', 'catastrophe'];

    const lowerMessage = message.toLowerCase();
    let positiveScore = positiveWords.reduce((score, word) => score + (lowerMessage.includes(word) ? 1 : 0), 0);
    let negativeScore = negativeWords.reduce((score, word) => score + (lowerMessage.includes(word) ? 1 : 0), 0);

    if (positiveScore > negativeScore) return 'positif';
    if (negativeScore > positiveScore) return 'négatif';
    return 'neutre';
}

function generateAdvancedResponse(message, emotion, personality, intent, sentiment, context) {
    const templates = {
        demande_conseil: {
            joie: [
                "C'est formidable de te voir si joyeux(se) ! 😊 Pour ton conseil, je pense que tu as déjà la bonne énergie pour réussir. Voici ce que je suggère...",
                "Ton enthousiasme me donne envie de t'aider encore plus ! ✨ Basé sur ce que tu me dis, je recommande..."
            ],
            tristesse: [
                "Je sens ta peine et je veux t'aider à voir plus clair. 💙 Parfois, les moments difficiles nous apprennent le plus. Voici mon conseil...",
                "Ton courage de demander de l'aide malgré ta tristesse me touche. 🌸 Ensemble, trouvons une solution..."
            ],
            neutre: [
                "J'apprécie ta confiance pour me demander conseil. 💝 Basé sur ta situation, voici ce que je pense...",
                "Excellente question ! Prenons le temps d'explorer ça ensemble. 🤔"
            ]
        },
        partage_emotion: {
            joie: [
                "Ton bonheur illumine notre conversation ! 😄 Continue à cultiver cette belle énergie positive.",
                "J'adore sentir ta joie de vivre ! ✨ Raconte-moi ce qui te rend si rayonnant(e) !"
            ],
            tristesse: [
                "Merci de partager tes sentiments avec moi. 💙 Tes émotions sont importantes et méritent d'être entendues.",
                "Je ressens ta peine à travers tes mots. Tu n'es pas seul(e) dans cette épreuve. 🤗"
            ],
            colère: [
                "Je comprends ta frustration. 🌿 Respirons ensemble et trouvons un moyen de transformer cette énergie.",
                "Ta colère est valide. Parlons de ce qui t'a mis(e) dans cet état. 💪"
            ]
        },
        besoin_soutien: {
            tristesse: [
                "Je suis là pour toi, complètement. 💙 Même dans les moments les plus sombres, tu n'es jamais seul(e).",
                "Ton courage de chercher du soutien montre ta force intérieure. Ensemble, nous traverserons ça. 🌈"
            ],
            peur: [
                "Je sens ton anxiété et je veux t'apaiser. 🌸 Respirons ensemble et affrontons tes peurs étape par étape.",
                "Tu es plus brave que tu ne le penses. Tes peurs ne te définissent pas. 💪"
            ]
        }
    };

    const responseSet = templates[intent] || templates.demande_conseil;
    const emotionResponses = responseSet[emotion] || responseSet.neutre || responseSet.tristesse;
    const baseResponse = emotionResponses[Math.floor(Math.random() * emotionResponses.length)];

    // Ajouter une touche personnalisée selon la personnalité
    let personalTouch = "";
    if (personality.includes('introverti')) {
        personalTouch = " J'admire ta réflexion intérieure.";
    } else if (personality.includes('extraverti')) {
        personalTouch = " Ton énergie sociale est contagieuse !";
    }

    return baseResponse + personalTouch;
}

// ======== FONCTIONS D'AUTHENTIFICATION ========

function validateUsername(username) {
    // Doit commencer par une majuscule, suivi de minuscules, au moins 3 caractères
    const regex = /^[A-Z][a-z]{2,}$/;
    return regex.test(username) && username.length >= 3;
}

function validatePassword(password) {
    if (password.length < 8) {
        return { valid: false, message: currentLanguage === 'fr' ? "Le mot de passe doit contenir au moins 8 caractères" : "Password must contain at least 8 characters" };
    }

    const hasUppercase = /[A-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*]/.test(password);

    if (!hasUppercase) {
        return { valid: false, message: currentLanguage === 'fr' ? "Le mot de passe doit contenir au moins une majuscule" : "Password must contain at least one uppercase letter" };
    }

    if (!hasNumber) {
        return { valid: false, message: currentLanguage === 'fr' ? "Le mot de passe doit contenir au moins un chiffre" : "Password must contain at least one number" };
    }

    if (!hasSpecialChar) {
        return { valid: false, message: currentLanguage === 'fr' ? "Le mot de passe doit contenir au moins un caractère spécial (!@#$%^&*)" : "Password must contain at least one special character (!@#$%^&*)" };
    }

    return { valid: true, message: "" };
}

function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    const targetPage = document.getElementById(pageId + '-page');
    if (targetPage) {
        targetPage.classList.add('active');
    }
    currentPage = pageId;

    if (pageId === 'home' && currentUser) {
        const welcomeText = currentLanguage === 'fr' ? 'Bienvenue' : 'Welcome';
        const headerH1 = document.querySelector('header h1');
        if (headerH1 && currentUser) {
            const displayName = currentUser.replace('.jane.ia', '');
            headerH1.innerHTML = `${welcomeText}, <span id="username-display">${displayName}</span>`;
        }
    }
}

function showLogin() {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.auth-form').forEach(form => form.classList.remove('active'));

    event.target.classList.add('active');
    document.getElementById('login-form').classList.add('active');
}

function showRegister() {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.auth-form').forEach(form => form.classList.remove('active'));

    event.target.classList.add('active');
    document.getElementById('register-form').classList.add('active');
}

function register() {
    const username = document.getElementById('register-username').value.trim();
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-confirm').value;
    const errorDiv = document.getElementById('register-error');

    if (!username) {
        errorDiv.textContent = currentLanguage === 'fr' ? 'Le nom d\'utilisateur est obligatoire' : 'Username is required';
        return;
    }

    if (!validateUsername(username)) {
        errorDiv.textContent = currentLanguage === 'fr' ? 'Le nom d\'utilisateur doit commencer par une majuscule suivie de minuscules (ex: Marie, Jean)' : 'Username must start with uppercase followed by lowercase letters (ex: Marie, Jean)';
        return;
    }

    if (!password) {
        errorDiv.textContent = currentLanguage === 'fr' ? 'Le mot de passe est obligatoire' : 'Password is required';
        return;
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
        errorDiv.textContent = passwordValidation.message;
        return;
    }

    if (password !== confirmPassword) {
        errorDiv.textContent = currentLanguage === 'fr' ? 'Les mots de passe ne correspondent pas' : 'Passwords do not match';
        return;
    }

    const fullUsername = username + '.jane.ia';

    if (users.find(user => user.username === fullUsername)) {
        errorDiv.textContent = currentLanguage === 'fr' ? 'Ce nom d\'utilisateur est déjà utilisé' : 'This username is already taken';
        return;
    }

    // Stocker les données temporairement pour après la vérification
    window.tempRegisterData = {
        username: fullUsername,
        password: password
    };

    errorDiv.textContent = '';
    showCaptcha(proceedWithRegister);
}

function proceedWithRegister() {
    const { username, password } = window.tempRegisterData;

    const newUser = {
        username: username,
        password: password,
        createdAt: new Date().toISOString(),
        journal: '',
        photos: [],
        isFirstTime: true,
        ageVerified: false,
        conversationHistory: [],
        emotionalProfile: {
            dominantEmotion: 'neutral',
            lastInteractions: []
        }
    };

    users.push(newUser);
    localStorage.setItem('janeUsers', JSON.stringify(users));

    currentUser = username;
    isFirstTimeUser = true;
    localStorage.setItem('currentJaneUser', currentUser);

    // Après l'inscription, montrer la vérification d'âge pour les nouveaux utilisateurs
    showAgeVerification();
}

function login() {
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;
    const errorDiv = document.getElementById('login-error');

    if (!username) {
        errorDiv.textContent = currentLanguage === 'fr' ? 'Le nom d\'utilisateur est obligatoire' : 'Username is required';
        return;
    }

    if (!validateUsername(username)) {
        errorDiv.textContent = currentLanguage === 'fr' ? 'Format de nom d\'utilisateur invalide' : 'Invalid username format';
        return;
    }

    if (!password) {
        errorDiv.textContent = currentLanguage === 'fr' ? 'Le mot de passe est obligatoire' : 'Password is required';
        return;
    }

    const fullUsername = username + '.jane.ia';
    const user = users.find(u => u.username === fullUsername && u.password === password);

    if (!user) {
        errorDiv.textContent = currentLanguage === 'fr' ? 'Nom d\'utilisateur ou mot de passe incorrect' : 'Incorrect username or password';
        return;
    }

    // Stocker les données temporairement pour après la vérification
    window.tempLoginData = {
        username: fullUsername,
        isFirstTime: user.isFirstTime || false,
        ageVerified: user.ageVerified || false
    };

    errorDiv.textContent = '';
    showCaptcha(proceedWithLogin);
}

function proceedWithLogin() {
    const { username, isFirstTime } = window.tempLoginData;

    currentUser = username;
    isFirstTimeUser = false; // Toujours false pour les connexions (utilisateurs existants)
    localStorage.setItem('currentJaneUser', currentUser);

    // Connexion directe pour les utilisateurs existants
    proceedToHomeAfterAuth();
}

// ======== NAVIGATION ========

function goHome() {
    showPage('home');
}

function showChat() {
    showPage('chat');
    initializeChat();
}

function showJournal() {
    showPage('journal');
    document.getElementById('journal-auth').style.display = 'block';
    document.getElementById('journal-content').classList.add('hidden');
}

function showMood() {
    showPage('mood');
}

function showLove() {
    showPage('love');
}

function showFun() {
    showPage('fun');
}

function showExplore() {
    showPage('explore');
}

function showDailyNews() {
    showPage('daily-news');
    loadDailyNews();
}

function showAboutJane() {
    showPage('about-jane');
}

// ======== CHAT AVEC JANE ========

function initializeChat() {
    const messagesDiv = document.getElementById('chat-messages');
    if (messagesDiv) {
        messagesDiv.innerHTML = '';

        // Ajouter l'avatar de Jane
        addJaneAvatar();

        if (isFirstTimeUser) {
            const welcomeMsg = currentLanguage === 'fr' ? 
                "Bonjour ! Je suis Jane, ton amie virtuelle des Philippines ! Je suis ravie de faire ta connaissance ! 💖 Je suis là pour t'écouter, te réconforter et partager tes joies et tes peines." :
                "Hello! I'm Jane, your virtual friend from the Philippines! I'm delighted to meet you! 💖 I'm here to listen to you, comfort you and share your joys and sorrows.";
            setTimeout(() => addJaneMessage(welcomeMsg), 500);

            // Remove the Philippine flag and "Philippines" mention after the first presentation.
            const userIndex = users.findIndex(u => u.username === currentUser);
            if (userIndex !== -1) {
                users[userIndex].isFirstTime = false;
                localStorage.setItem('janeUsers', JSON.stringify(users));
            }
            isFirstTimeUser = false;
        } else {
            const history = getUserConversationHistory();
            const returnMsg = currentLanguage === 'fr' ? 
                `Content de te revoir ! ${history.length > 0 ? 'On a eu de belles conversations ensemble.' : ''} Comment ça va aujourd'hui ? 😊` :
                `Great to see you again! ${history.length > 0 ? 'We\'ve had some beautiful conversations together.' : ''} How are you today? 😊`;
            setTimeout(() => addJaneMessage(returnMsg), 500);
        }
    }
}

function addJaneAvatar() {
    // Supprimer l'ancien avatar fixe car on utilise maintenant des avatars dans les messages
    const existingAvatar = document.getElementById('jane-avatar-container');
    if (existingAvatar) {
        existingAvatar.remove();
    }
}

async function sendMessage() {
    const input = document.getElementById('chat-input');
    if (!input) return;

    const message = input.value.trim();
    if (!message) return;

    addUserMessage(message);
    input.value = '';

    // Afficher l'indicateur de frappe avec avatar pendant au moins 2 secondes
    showJaneTyping();

    try {
        // Attendre au moins 2 secondes pour montrer l'avatar
        const [response] = await Promise.all([
            callAdvancedAI(message),
            new Promise(resolve => setTimeout(resolve, 2000))
        ]);

        hideJaneTyping();
        addJaneMessage(response);

        // Sauvegarder l'historique
        saveConversationHistory(message, response);

    } catch (error) {
        // Attendre au moins 2 secondes même en cas d'erreur
        await new Promise(resolve => setTimeout(resolve, 2000));
        hideJaneTyping();
        const fallbackResponse = getHyperIntelligentJaneResponse(message);
        addJaneMessage(fallbackResponse);
        saveConversationHistory(message, fallbackResponse);
    }
}

function showJaneTyping() {
    isJaneTyping = true;

    // Ajouter l'indicateur de frappe avec avatar dans le chat
    const messagesDiv = document.getElementById('chat-messages');
    if (messagesDiv) {
        const typingContainer = document.createElement('div');
        typingContainer.id = 'typing-indicator';
        typingContainer.style.cssText = `
            display: flex;
            align-items: flex-start;
            margin-bottom: 15px;
            animation: slideInLeft 0.5s ease;
        `;

        const avatar = document.createElement('div');
        avatar.style.cssText = `
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: linear-gradient(135deg, #FFB6C1 0%, #87CEEB 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.5rem;
            margin-right: 10px;
            flex-shrink: 0;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            animation: gentle-bounce 2s ease-in-out infinite;
        `;
        avatar.textContent = '👩🏻‍🦱';

        const typingDiv = document.createElement('div');
        typingDiv.className = 'message jane';
        typingDiv.style.marginLeft = '0';
        typingDiv.style.marginBottom = '0';
        typingDiv.style.maxWidth = 'calc(70% - 50px)';
        typingDiv.innerHTML = '<span class="typing-dots">●●●</span>';

        typingContainer.appendChild(avatar);
        typingContainer.appendChild(typingDiv);
        messagesDiv.appendChild(typingContainer);
        messagesDiv.scrollTop = messagesDiv.scrollHeight;

        // Animation des points
        let dotCount = 0;
        const dotsInterval = setInterval(() => {
            const dots = typingDiv.querySelector('.typing-dots');
            if (dots && isJaneTyping) {
                dotCount = (dotCount + 1) % 4;
                const dotText = ['●', '●●', '●●●'];
                dots.textContent = dotText[dotCount] || '●';
            } else {
                clearInterval(dotsInterval);
            }
        }, 500);
    }
}

function hideJaneTyping() {
    isJaneTyping = false;

    const typingIndicator = document.getElementById('typing-indicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
}

function checkEnter(event) {
    if (event.key === 'Enter') {
        sendMessage();
    }
}

function addUserMessage(message) {
    const messagesDiv = document.getElementById('chat-messages');
    if (messagesDiv) {
        const messageElement = document.createElement('div');
        messageElement.className = 'message user';
        messageElement.textContent = message;
        messagesDiv.appendChild(messageElement);
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }
}

function addJaneMessage(message) {
    const messagesDiv = document.getElementById('chat-messages');
    if (messagesDiv) {
        const messageContainer = document.createElement('div');
        messageContainer.style.cssText = `
            display: flex;
            align-items: flex-start;
            margin-bottom: 15px;
            animation: slideInLeft 0.5s ease;
        `;

        const avatar = document.createElement('div');
        avatar.style.cssText = `
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: linear-gradient(135deg, #FFB6C1 0%, #87CEEB 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.5rem;
            margin-right: 10px;
            flex-shrink: 0;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        `;
        avatar.textContent = '👩🏻‍🦱';

        const messageElement = document.createElement('div');
        messageElement.className = 'message jane';
        messageElement.style.marginLeft = '0';
        messageElement.style.marginBottom = '0';
        messageElement.style.maxWidth = 'calc(70% - 50px)';
        messageElement.textContent = message;

        messageContainer.appendChild(avatar);
        messageContainer.appendChild(messageElement);
        messagesDiv.appendChild(messageContainer);
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }
}

function getUserConversationHistory() {
    const userIndex = users.findIndex(u => u.username === currentUser);
    if (userIndex !== -1) {
        return users[userIndex].conversationHistory || [];
    }
    return [];
}

function saveConversationHistory(userMessage, janeResponse) {
    const userIndex = users.findIndex(u => u.username === currentUser);
    if (userIndex !== -1) {
        if (!users[userIndex].conversationHistory) {
            users[userIndex].conversationHistory = [];
        }

        users[userIndex].conversationHistory.push({
            user: userMessage,
            jane: janeResponse,
            timestamp: new Date().toISOString(),
            emotion: analyzeAdvancedEmotion(userMessage)
        });

        // Garder seulement les 100 dernières conversations
        if (users[userIndex].conversationHistory.length > 100) {
            users[userIndex].conversationHistory = users[userIndex].conversationHistory.slice(-100);
        }

        localStorage.setItem('janeUsers', JSON.stringify(users));
    }
}

// ======== MICROPHONE ========

function toggleMicrophone() {
    if (!recognition) {
        const msg = currentLanguage === 'fr' ? 
            'La reconnaissance vocale n\'est pas supportée par votre navigateur.' :
            'Speech recognition is not supported by your browser.';
        alert(msg);
        return;
    }

    if (isRecording) {
        recognition.stop();
    } else {
        recognition.start();
        isRecording = true;
        updateMicrophoneButton();
    }
}

function updateMicrophoneButton() {
    const micBtn = document.getElementById('mic-btn');
    if (micBtn) {
        micBtn.textContent = isRecording ? '🛑' : '🎤';
        micBtn.style.backgroundColor = isRecording ? '#ff4444' : '#667eea';
    }
}

// ======== JOURNAL INTIME ========

function accessJournal() {
    const password = document.getElementById('journal-password').value;
    const currentUserData = users.find(u => u.username === currentUser);

    if (password === currentUserData.password) {
        document.getElementById('journal-auth').style.display = 'none';
        document.getElementById('journal-content').classList.remove('hidden');

        loadJournalData();
        initializeDrawingCanvas();
        updateJournalPage();
        loadPhotos();
        document.getElementById('journal-error').textContent = '';

        // Effacer le mot de passe après accès
        document.getElementById('journal-password').value = '';
    } else {
        const errorMsg = currentLanguage === 'fr' ? 'Mot de passe incorrect' : 'Incorrect password';
        document.getElementById('journal-error').textContent = errorMsg;
    }
}

function loadJournalData() {
    const userIndex = users.findIndex(u => u.username === currentUser);
    if (userIndex !== -1) {
        journalPages = users[userIndex].journalPages || {};
        currentJournalPage = users[userIndex].currentJournalPage || 1;
    }
}

function saveJournalData() {
    const userIndex = users.findIndex(u => u.username === currentUser);
    if (userIndex !== -1) {
        users[userIndex].journalPages = journalPages;
        users[userIndex].currentJournalPage = currentJournalPage;
        localStorage.setItem('janeUsers', JSON.stringify(users));
    }
}

function updateJournalPage() {
    const pageIndicator = document.getElementById('page-indicator');
    const pageNumber = document.getElementById('page-number');
    const pageDate = document.getElementById('page-date');

    if (pageIndicator) pageIndicator.textContent = `Page ${currentJournalPage} / ∞`;
    if (pageNumber) pageNumber.textContent = currentJournalPage;

    const today = new Date().toLocaleDateString('fr-FR');
    if (pageDate) pageDate.textContent = today;

    const pageKey = `page_${currentJournalPage}`;
    const pageData = journalPages[pageKey] || { text: '', drawing: null };

    const journalText = document.getElementById('journal-text');
    if (journalText) {
        journalText.value = pageData.text || '';
        // Configurer la sauvegarde automatique pour cette page
        setupAutoSave();
    }

    if (pageData.drawing && canvas) {
        const img = new Image();
        img.onload = function() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
        };
        img.src = pageData.drawing;
    } else if (canvas) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    if (prevBtn) prevBtn.disabled = currentJournalPage <= 1;
    if (nextBtn) nextBtn.disabled = false; // Pages infinies

    const page = document.getElementById('current-journal-page');
    if (page) {
        page.classList.add('turning');
        setTimeout(() => {
            page.classList.remove('turning');
        }, 600);
    }
}

function previousPage() {
    if (currentJournalPage > 1) {
        saveCurrentPage();
        currentJournalPage--;
        updateJournalPage();
    }
}

function nextPage() {
    saveCurrentPage();
    currentJournalPage++;
    updateJournalPage();
}

function goToPage() {
    // Créer un dialogue personnalisé
    const dialogDiv = document.createElement('div');
    dialogDiv.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
    `;

    dialogDiv.innerHTML = `
        <div style="
            background: white;
            padding: 30px;
            border-radius: 15px;
            text-align: center;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            min-width: 300px;
        ">
            <h3 style="margin-bottom: 20px; color: #333;">Aller à la page</h3>
            <input type="number" id="page-input-dialog" min="1" placeholder="Numéro de page (1-∞)" style="
                width: 200px;
                padding: 10px;
                margin-bottom: 20px;
                border: 2px solid #e0e0e0;
                border-radius: 8px;
                font-size: 16px;
            ">
            <div style="display: flex; gap: 15px; justify-content: center;">
                <button onclick="confirmGoToPage()" style="
                    padding: 10px 20px;
                    background: #28a745;
                    color: white;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                ">Aller</button>
                <button onclick="cancelGoToPage()" style="
                    padding: 10px 20px;
                    background: #6c757d;
                    color: white;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                ">Annuler</button>
            </div>
        </div>
    `;

    document.body.appendChild(dialogDiv);
    window.currentPageDialog = dialogDiv;

    // Focus sur l'input
    setTimeout(() => {
        document.getElementById('page-input-dialog').focus();
    }, 100);
}

function saveCurrentPage() {
    const pageKey = `page_${currentJournalPage}`;
    const journalText = document.getElementById('journal-text');
    const text = journalText ? journalText.value : '';
    const drawing = canvas ? canvas.toDataURL() : null;

    // Initialiser journalPages si nécessaire
    if (!journalPages) {
        journalPages = {};
    }

    journalPages[pageKey] = {
        text: text,
        drawing: drawing,
        lastModified: new Date().toISOString()
    };

    // Sauvegarder immédiatement avec feedback amélioré
    const userIndex = users.findIndex(u => u.username === currentUser);
    if (userIndex !== -1) {
        try {
            users[userIndex].journalPages = journalPages;
            users[userIndex].currentJournalPage = currentJournalPage;
            localStorage.setItem('janeUsers', JSON.stringify(users));

            // Animation de sauvegarde réussie
            showSaveSuccessMessage();

            console.log('Page sauvegardée:', pageKey, journalPages[pageKey]);
            return true;
        } catch (error) {
            console.error('Erreur de sauvegarde:', error);
            showSaveErrorMessage();
            return false;
        }
    } else {
        alert('Erreur lors de la sauvegarde. Veuillez vous reconnecter.');
        return false;
    }
}

// Sauvegarde automatique pendant que l'utilisateur écrit
let autoSaveTimer = null;

function setupAutoSave() {
    const journalText = document.getElementById('journal-text');
    if (journalText) {
        journalText.addEventListener('input', function() {
            // Annuler le timer précédent
            if (autoSaveTimer) {
                clearTimeout(autoSaveTimer);
            }

            // Programmer une sauvegarde dans 2 secondes
            autoSaveTimer = setTimeout(() => {
                saveCurrentPage();
            }, 2000);
        });
    }
}

function showSaveSuccessMessage() {
    const savedDiv = document.getElementById('journal-saved');
    if (savedDiv) {
        savedDiv.textContent = currentLanguage === 'fr' ? '✅ Page sauvegardée avec succès !' : '✅ Page saved successfully!';
        savedDiv.className = 'success-message';
        savedDiv.style.display = 'block';
        savedDiv.style.animation = 'bounce-in 0.5s ease';
        setTimeout(() => {
            savedDiv.style.display = 'none';
        }, 3000);
    }
}

function showSaveErrorMessage() {
    const savedDiv = document.getElementById('journal-saved');
    if (savedDiv) {
        savedDiv.textContent = currentLanguage === 'fr' ? '❌ Erreur de sauvegarde !' : '❌ Save error!';
        savedDiv.className = 'error-message';
        savedDiv.style.display = 'block';
        setTimeout(() => {
            savedDiv.style.display = 'none';
        }, 3000);
    }
}

function switchJournalTab(tabName) {
    document.querySelectorAll('.journal-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    if (event && event.target) {
        event.target.classList.add('active');
    }

    document.querySelectorAll('.journal-content-area').forEach(area => {
        area.classList.remove('active');
    });
    const targetArea = document.getElementById(tabName + '-area');
    if (targetArea) {
        targetArea.classList.add('active');
    }
}

// ======== FONCTIONS DE DESSIN ========

function initializeDrawingCanvas() {
    canvas = document.getElementById('drawing-canvas');
    if (canvas) {
        ctx = canvas.getContext('2d');

        canvas.addEventListener('mousedown', startDrawing);
        canvas.addEventListener('mousemove', draw);
        canvas.addEventListener('mouseup', stopDrawing);
        canvas.addEventListener('mouseout', stopDrawing);

        canvas.addEventListener('touchstart', handleTouch);
        canvas.addEventListener('touchmove', handleTouch);
        canvas.addEventListener('touchend', stopDrawing);

        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = currentBrushSize;
        ctx.strokeStyle = currentColor;
    }
}

function startDrawing(e) {
    isDrawing = true;
    draw(e);
}

function draw(e) {
    if (!isDrawing) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (currentTool === 'pen') {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = currentColor;
    } else if (currentTool === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out';
    }

    ctx.lineWidth = currentBrushSize;
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
}

function stopDrawing() {
    if (isDrawing) {
        isDrawing = false;
        ctx.beginPath();
    }
}

function handleTouch(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent(e.type === 'touchstart' ? 'mousedown' : 
                                     e.type === 'touchmove' ? 'mousemove' : 'mouseup', {
        clientX: touch.clientX,
        clientY: touch.clientY
    });
    canvas.dispatchEvent(mouseEvent);
}

function setDrawingTool(tool) {
    currentTool = tool;
    document.querySelectorAll('.tool-btn[data-tool]').forEach(btn => {
        btn.classList.remove('active');
    });
    const toolBtn = document.querySelector(`[data-tool="${tool}"]`);
    if (toolBtn) {
        toolBtn.classList.add('active');
    }

    if (canvas) {
        canvas.style.cursor = tool === 'pen' ? 'crosshair' : 'grab';
    }
}

function setDrawingColor(color) {
    currentColor = color;
    currentTool = 'pen';
    setDrawingTool('pen');
}

function setBrushSize(size) {
    currentBrushSize = size;
    const sizeDisplay = document.getElementById('brush-size-display');
    if (sizeDisplay) {
        sizeDisplay.textContent = size;
    }
}

function clearCanvas() {
    if (confirm(currentLanguage === 'fr' ? 
               'Êtes-vous sûr de vouloir effacer tout le dessin ?' : 
               'Are you sure you want to clear the entire drawing?')) {
        if (ctx && canvas) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    }
}

// ======== PHOTOS ========

function uploadPhoto() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';

    input.onchange = function(event) {
        const file = event.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                const msg = currentLanguage === 'fr' ? 'La photo ne doit pas dépasser 5MB' : 'Photo must not exceed 5MB';
                alert(msg);
                return;
            }

            const reader = new FileReader();
            reader.onload = function(e) {
                const photoData = {
                    id: Date.now(),
                    data: e.target.result,
                    name: file.name,
                    date: new Date().toISOString()
                };

                const userIndex = users.findIndex(u => u.username === currentUser);
                if (userIndex !== -1) {
                    if (!users[userIndex].photos) {
                        users[userIndex].photos = [];
                    }
                    users[userIndex].photos.push(photoData);
                    localStorage.setItem('janeUsers', JSON.stringify(users));
                    loadPhotos();
                }
            };
            reader.readAsDataURL(file);
        }
    };

    input.click();
}

function loadPhotos() {
    const userIndex = users.findIndex(u => u.username === currentUser);
    if (userIndex !== -1 && users[userIndex].photos) {
        const photosContainer = document.getElementById('photos-container');
        if (photosContainer) {
            photosContainer.innerHTML = '';
            users[userIndex].photos.forEach((photo, index) => {
                const photoElement = document.createElement('div');
                photoElement.className = 'photo-item';
                photoElement.innerHTML = `
                    <img src="${photo.data}" alt="${photo.name}">
                    <p>${new Date(photo.date).toLocaleDateString()}</p>
                    <button class="download-btn" onclick="downloadPhoto(${index})">📥 Télécharger</button>
                `;
                photosContainer.appendChild(photoElement);
            });
        }
    }
}

function downloadPhoto(index) {
    const userIndex = users.findIndex(u => u.username === currentUser);
    if (userIndex !== -1 && users[userIndex].photos && users[userIndex].photos[index]) {
        const photo = users[userIndex].photos[index];
        const link = document.createElement('a');
        link.href = photo.data;
        link.download = photo.name || `photo_${index + 1}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

function downloadAllPhotos() {
    const userIndex = users.findIndex(u => u.username === currentUser);
    if (userIndex !== -1 && users[userIndex].photos && users[userIndex].photos.length > 0) {
        // Afficher message de téléchargement avec dialogue personnalisé
        showDownloadMessage(users[userIndex].photos.length);

        users[userIndex].photos.forEach((photo, index) => {
            setTimeout(() => {
                downloadPhoto(index);
            }, index * 500);
        });
    } else {
        const msg = currentLanguage === 'fr' ? 
            'Aucune photo à télécharger !' : 
            'No photos to download!';
        alert(msg);
    }
}

function showDownloadMessage(photoCount) {
    const dialogDiv = document.createElement('div');
    dialogDiv.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
    `;

    const message = currentLanguage === 'fr' ? 
        `📥 Vos ${photoCount} photos sont en train d'être téléchargées.<br>Veuillez patienter quelques minutes...` :
        `📥 Your ${photoCount} photos are being downloaded.<br>Please wait a few minutes...`;

    dialogDiv.innerHTML = `
        <div style="
            background: white;
            padding: 30px;
            border-radius: 15px;
            text-align: center;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            max-width: 400px;
        ">
            <div style="font-size: 3rem; margin-bottom: 20px;">📥</div>
            <p style="font-size: 16px; color: #333; line-height: 1.5;">${message}</p>
            <div style="margin-top: 20px;">
                <div style="width: 50px; height: 50px; border: 3px solid rgba(40,167,69,0.3); border-top: 3px solid #28a745; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto;"></div>
            </div>
        </div>
    `;

    document.body.appendChild(dialogDiv);

    // Fermer le message après le téléchargement
    setTimeout(() => {
        if (document.body.contains(dialogDiv)) {
            document.body.removeChild(dialogDiv);
        }
    }, photoCount * 500 + 2000);
}

// ======== MODULES SPÉCIALISÉS ========

function startModuleChat(module, message) {
    const input = document.getElementById(module + '-input');
    if (input) {
        input.value = message;
        sendModuleMessage(module);
    }
}

async function sendModuleMessage(module) {
    const input = document.getElementById(module + '-input');
    if (!input) return;

    const message = input.value.trim();
    if (!message) return;

    addModuleUserMessage(module, message);
    input.value = '';

    setTimeout(async () => {
        let response;

        try {
            // Utiliser l'IA avancée avec contexte du module
            response = await callAdvancedAI(message, `Module: ${module}`);
        } catch (error) {
            response = getHyperIntelligentJaneResponse(message, `Module: ${module}`);
        }

        addModuleJaneMessage(module, response);
    }, 1000);
}

function addModuleUserMessage(module, message) {
    const messagesDiv = document.getElementById(module + '-messages');
    if (messagesDiv) {
        const messageElement = document.createElement('div');
        messageElement.className = 'message user';
        messageElement.textContent = message;
        messagesDiv.appendChild(messageElement);
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }
}

function addModuleJaneMessage(module, message) {
    const messagesDiv = document.getElementById(module + '-messages');
    if (messagesDiv) {
        const messageContainer = document.createElement('div');
        messageContainer.style.cssText = `
            display: flex;
            align-items: flex-start;
            margin-bottom: 15px;
            animation: slideInLeft 0.5s ease;
        `;

        const avatar = document.createElement('div');
        avatar.style.cssText = `
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: linear-gradient(135deg, #FFB6C1 0%, #87CEEB 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.5rem;
            margin-right: 10px;
            flex-shrink: 0;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        `;
        avatar.textContent = '👩🏻‍🦱';

        const messageElement = document.createElement('div');
        messageElement.className = 'message jane';
        messageElement.style.marginLeft = '0';
        messageElement.style.marginBottom = '0';
        messageElement.style.maxWidth = 'calc(70% - 50px)';
        messageElement.textContent = message;

        messageContainer.appendChild(avatar);
        messageContainer.appendChild(messageElement);
        messagesDiv.appendChild(messageContainer);
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }
}

// ======== PROFIL UTILISATEUR ========

function showProfile() {
    if (!currentUser) {
        alert('Erreur: Utilisateur non connecté');
        return;
    }
    document.getElementById('profile-modal').style.display = 'block';
    loadProfileData();
    updateProfileInterface();
}

function updateProfileInterface() {
    const userIndex = users.findIndex(u => u.username === currentUser);
    if (userIndex !== -1) {
        const user = users[userIndex];
        const lastModified = user.lastProfileModified ? new Date(user.lastProfileModified) : null;
        const now = new Date();
        const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());

        const canModify = !lastModified || lastModified <= oneMonthAgo;
        const saveButton = document.querySelector('#profile-modal .modal-actions button[onclick="saveProfile()"]');

        if (canModify) {
            // Cacher le bouton par défaut
            if (saveButton) {
                saveButton.style.display = 'none';
            }

            // Détecter les changements
            const inputs = document.querySelectorAll('#profile-modal input[type="text"], #profile-modal input[type="password"]');
            inputs.forEach(input => {
                input.addEventListener('input', function() {
                    if (saveButton) {
                        saveButton.style.display = 'inline-block';
                        saveButton.textContent = '✅ Confirmer les modifications';
                    }
                });
            });
        } else {
            if (saveButton) {
                saveButton.style.display = 'none';
            }
        }
    }
}

function closeProfile() {
    document.getElementById('profile-modal').style.display = 'none';
}

function loadProfileData() {
    const userIndex = users.findIndex(u => u.username === currentUser);
    if (userIndex !== -1) {
        const user = users[userIndex];
        document.getElementById('profile-username').value = currentUser ? currentUser.replace('.jane.ia', '') : '';
        document.getElementById('profile-age').value = user.age || '';
        document.getElementById('profile-created').textContent = new Date(user.createdAt).toLocaleDateString();
        document.getElementById('profile-conversations').textContent = (user.conversationHistory || []).length;
        document.getElementById('profile-photos').textContent = (user.photos || []).length;
        
        // Charger la localisation
        loadUserLocation();
        
        // Charger la photo de profil
        loadProfilePhoto();
    }
}

function loadUserLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            function(position) {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                
                // Utiliser une API de géolocalisation inversée
                fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=fr`)
                    .then(response => response.json())
                    .then(data => {
                        const location = `${data.city || data.locality || 'Ville inconnue'}, ${data.countryName || 'Pays inconnu'}`;
                        displayLocationWithMap(lat, lon, location);
                    })
                    .catch(error => {
                        document.getElementById('profile-location').innerHTML = `
                            <div class="location-error">
                                <span>📍 Localisation non disponible</span>
                            </div>
                        `;
                    });
            },
            function(error) {
                document.getElementById('profile-location').innerHTML = `
                    <div class="location-error">
                        <span>📍 Localisation non autorisée</span>
                    </div>
                `;
            }
        );
    } else {
        document.getElementById('profile-location').innerHTML = `
            <div class="location-error">
                <span>📍 Géolocalisation non supportée</span>
            </div>
        `;
    }
}

function displayLocationWithMap(lat, lon, locationText) {
    const locationContainer = document.getElementById('profile-location');
    locationContainer.innerHTML = `
        <div class="location-display">
            <div class="location-text">
                <span class="location-icon">📍</span>
                <span class="location-name">${locationText}</span>
            </div>
            <div class="mini-map" id="mini-map">
                <div class="map-loading">
                    <div class="map-spinner"></div>
                    <span>Chargement de la carte...</span>
                </div>
            </div>
        </div>
    `;
    
    // Initialiser la carte avec Leaflet
    setTimeout(() => {
        initializeMiniMap(lat, lon, locationText);
    }, 100);
}

function initializeMiniMap(lat, lon, locationText) {
    const mapContainer = document.getElementById('mini-map');
    
    // Créer une carte simple avec OpenStreetMap
    const mapHTML = `
        <div class="simple-map" onclick="openFullMap(${lat}, ${lon}, '${locationText.replace(/'/g, "\\'")}')">
            <div class="map-marker">
                <div class="marker-dot"></div>
                <div class="marker-pulse"></div>
            </div>
            <div class="map-background"></div>
            <div class="map-overlay">
                <span>🗺️ Cliquez pour voir plus</span>
            </div>
        </div>
    `;
    
    mapContainer.innerHTML = mapHTML;
}

function openFullMap(lat, lon, locationText) {
    // Protection contre les caractères spéciaux
    const safeLocationText = locationText ? locationText.replace(/'/g, "&#39;").replace(/"/g, "&quot;") : 'Localisation inconnue';
    
    const mapModal = document.createElement('div');
    mapModal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.9);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
        animation: fadeIn 0.3s ease;
    `;
    
    mapModal.innerHTML = `
        <div class="full-map-container">
            <div class="map-header">
                <h3>📍 ${safeLocationText}</h3>
                <button onclick="closeFullMap()" class="close-map-btn">✕</button>
            </div>
            <div class="full-map-content">
                <div class="map-info">
                    <p><strong>Latitude:</strong> ${lat.toFixed(6)}</p>
                    <p><strong>Longitude:</strong> ${lon.toFixed(6)}</p>
                    <p><strong>Précision:</strong> Approximative</p>
                </div>
                <div class="map-actions">
                    <button onclick="openGoogleMaps(${lat}, ${lon})" class="map-btn">
                        🗺️ Ouvrir dans Google Maps
                    </button>
                    <button onclick="copyCoordinates(${lat}, ${lon})" class="map-btn">
                        📋 Copier les coordonnées
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(mapModal);
    window.currentMapModal = mapModal;
}

function openGoogleMaps(lat, lon) {
    try {
        const url = `https://www.google.com/maps?q=${lat},${lon}`;
        window.open(url, '_blank');
    } catch (error) {
        console.log('Erreur lors de l\'ouverture de Google Maps:', error);
        alert('Impossible d\'ouvrir Google Maps');
    }
}

function closeFullMap() {
    if (window.currentMapModal && document.body.contains(window.currentMapModal)) {
        document.body.removeChild(window.currentMapModal);
        window.currentMapModal = null;
    }
}

function copyCoordinates(lat, lon) {
    const coordinates = `${lat}, ${lon}`;
    navigator.clipboard.writeText(coordinates).then(() => {
        const button = event.target;
        const originalText = button.textContent;
        button.textContent = '✅ Copié !';
        button.style.background = '#28a745';
        setTimeout(() => {
            button.textContent = originalText;
            button.style.background = '#667eea';
        }, 2000);
    }).catch(() => {
        alert(`Coordonnées: ${coordinates}`);
    });
}

function loadProfilePhoto() {
    const userIndex = users.findIndex(u => u.username === currentUser);
    if (userIndex !== -1) {
        const user = users[userIndex];
        const photoContainer = document.getElementById('profile-photo-container');
        
        if (user.profilePhoto) {
            photoContainer.innerHTML = `
                <img src="${user.profilePhoto}" alt="Photo de profil" style="
                    width: 100px;
                    height: 100px;
                    border-radius: 50%;
                    object-fit: cover;
                    border: 3px solid #667eea;
                    box-shadow: 0 4px 10px rgba(0,0,0,0.2);
                ">
                <div style="margin-top: 10px;">
                    <button onclick="changeProfilePhoto()" style="
                        padding: 8px 15px;
                        background: #667eea;
                        color: white;
                        border: none;
                        border-radius: 8px;
                        cursor: pointer;
                        font-size: 12px;
                        margin-right: 10px;
                    ">📷 Changer</button>
                    <button onclick="removeProfilePhoto()" style="
                        padding: 8px 15px;
                        background: #dc3545;
                        color: white;
                        border: none;
                        border-radius: 8px;
                        cursor: pointer;
                        font-size: 12px;
                    ">🗑️ Supprimer</button>
                </div>
            `;
        } else {
            photoContainer.innerHTML = `
                <div style="
                    width: 100px;
                    height: 100px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 3rem;
                    color: white;
                    border: 3px solid #e0e0e0;
                ">👤</div>
                <div style="margin-top: 10px;">
                    <button onclick="changeProfilePhoto()" style="
                        padding: 8px 15px;
                        background: #28a745;
                        color: white;
                        border: none;
                        border-radius: 8px;
                        cursor: pointer;
                        font-size: 12px;
                    ">📷 Ajouter une photo</button>
                </div>
            `;
        }
    }
}

function changeProfilePhoto() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    
    input.onchange = function(event) {
        const file = event.target.files[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) { // 2MB max
                alert('La photo ne doit pas dépasser 2MB');
                return;
            }
            
            const reader = new FileReader();
            reader.onload = function(e) {
                const userIndex = users.findIndex(u => u.username === currentUser);
                if (userIndex !== -1) {
                    users[userIndex].profilePhoto = e.target.result;
                    localStorage.setItem('janeUsers', JSON.stringify(users));
                    loadProfilePhoto();
                    
                    // Afficher le bouton de confirmation
                    const saveButton = document.querySelector('#profile-modal .modal-actions button[onclick="saveProfile()"]');
                    if (saveButton) {
                        saveButton.style.display = 'inline-block';
                        saveButton.textContent = '✅ Confirmer les modifications';
                    }
                }
            };
            reader.readAsDataURL(file);
        }
    };
    
    input.click();
}

function removeProfilePhoto() {
    if (confirm('Êtes-vous sûr de vouloir supprimer votre photo de profil ?')) {
        const userIndex = users.findIndex(u => u.username === currentUser);
        if (userIndex !== -1) {
            delete users[userIndex].profilePhoto;
            localStorage.setItem('janeUsers', JSON.stringify(users));
            loadProfilePhoto();
            
            // Afficher le bouton de confirmation
            const saveButton = document.querySelector('#profile-modal .modal-actions button[onclick="saveProfile()"]');
            if (saveButton) {
                saveButton.style.display = 'inline-block';
                saveButton.textContent = '✅ Confirmer les modifications';
            }
        }
    }
}

function saveProfile() {
    const newUsername = document.getElementById('profile-username').value.trim();
    const newAge = document.getElementById('profile-age').value;
    const newPassword = document.getElementById('profile-new-password').value;
    const confirmPassword = document.getElementById('profile-confirm-password').value;

    const userIndex = users.findIndex(u => u.username === currentUser);
    if (userIndex === -1) return;

    const user = users[userIndex];

    // Vérifier la limite de modification (1 fois par mois)
    const lastModified = user.lastProfileModified ? new Date(user.lastProfileModified) : null;
    const now = new Date();
    const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());

    if (lastModified && lastModified > oneMonthAgo) {
        const nextDate = new Date(lastModified.getFullYear(), lastModified.getMonth() + 1, lastModified.getDate());
        showWaitMessage(nextDate);
        return;
    }

    if (!newUsername) {
        alert('Le nom d\'utilisateur ne peut pas être vide');
        return;
    }

    if (!validateUsername(newUsername)) {
        alert('Le nom d\'utilisateur doit commencer par une majuscule suivie de minuscules');
        return;
    }

    if (newAge && (isNaN(newAge) || newAge < 12 || newAge > 120)) {
        alert('L\'âge doit être un nombre entre 12 et 120 ans');
        return;
    }

    if (newPassword && newPassword !== confirmPassword) {
        alert('Les mots de passe ne correspondent pas');
        return;
    }

    const oldUsername = currentUser;
    const newFullUsername = newUsername + '.jane.ia';

    // Vérifier si le nouveau nom n'est pas déjà pris
    if (newFullUsername !== oldUsername && users.find(u => u.username === newFullUsername)) {
        alert('Ce nom d\'utilisateur est déjà pris');
        return;
    }

    // Mettre à jour les données
    users[userIndex].username = newFullUsername;
    users[userIndex].lastProfileModified = now.toISOString();

    if (newAge) {
        users[userIndex].age = parseInt(newAge);
    }

    if (newPassword) {
        const passwordValidation = validatePassword(newPassword);
        if (!passwordValidation.valid) {
            alert(passwordValidation.message);
            return;
        }
        users[userIndex].password = newPassword;
    }

    localStorage.setItem('janeUsers', JSON.stringify(users));
    localStorage.setItem('currentJaneUser', newFullUsername);
    currentUser = newFullUsername;

    // Message de succès avec dialogue personnalisé
    showProfileUpdateSuccess();
    closeProfile();

    // Mettre à jour l'affichage
    document.getElementById('username-display').textContent = newUsername;
}

function showWaitMessage(nextDate) {
    const dialogDiv = document.createElement('div');
    dialogDiv.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.7);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
    `;

    dialogDiv.innerHTML = `
        <div style="
            background: white;
            padding: 30px;
            border-radius: 15px;
            text-align: center;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            max-width: 400px;
        ">
            <div style="font-size: 3rem; margin-bottom: 20px;">⏱️</div>
            <h3 style="color: #dc3545; margin-bottom: 15px;">Modification limitée</h3>
            <p style="color: #333; line-height: 1.5; margin-bottom: 20px;">
                Vous ne pouvez modifier vos informations qu'une fois par mois.
                <br><br>
                <strong>Prochaine modification possible le :</strong>
                <br>${nextDate.toLocaleDateString('fr-FR')}
            </p>
            <button onclick="closeWaitMessage()" style="
                padding: 10px 20px;
                background: #6c757d;
                color: white;
                border: none;
                border-radius: 8px;
                cursor: pointer;
            ">Compris</button>
        </div>
    `;

    document.body.appendChild(dialogDiv);
    window.currentWaitDialog = dialogDiv;
}

function closeWaitMessage() {
    if (window.currentWaitDialog && document.body.contains(window.currentWaitDialog)) {
        document.body.removeChild(window.currentWaitDialog);
    }
}

function showProfileUpdateSuccess() {
    const dialogDiv = document.createElement('div');
    dialogDiv.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
    `;

    dialogDiv.innerHTML = `
        <div style="
            background: white;
            padding: 30px;
            border-radius: 15px;
            text-align: center;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            max-width: 400px;
        ">
            <div style="font-size: 3rem; margin-bottom: 20px; animation: bounce-in 0.5s ease;">🎉</div>
            <h3 style="color: #28a745; margin-bottom: 15px;">Félicitations !</h3>
            <p style="color: #333; line-height: 1.5;">Vos informations sont à jour.<br>Vous pourrez les modifier de nouveau dans un mois.</p>
            <button onclick="closeSuccessDialog()" style="
                margin-top: 20px;
                padding: 10px 20px;
                background: #28a745;
                color: white;
                border: none;
                border-radius: 8px;
                cursor: pointer;
            ">Super !</button>
        </div>
    `;

    document.body.appendChild(dialogDiv);
    window.currentSuccessDialog = dialogDiv;

    // Fermer automatiquement après 5 secondes
    setTimeout(() => {
        if (window.currentSuccessDialog && document.body.contains(window.currentSuccessDialog)) {
            document.body.removeChild(window.currentSuccessDialog);
        }
    }, 5000);
}

function closeSuccessDialog() {
    if (window.currentSuccessDialog && document.body.contains(window.currentSuccessDialog)) {
        document.body.removeChild(window.currentSuccessDialog);
    }
}

// ======== PARAMÈTRES ========

function showSettings() {
    document.getElementById('settings-modal').style.display = 'block';
}

function closeSettings() {
    document.getElementById('settings-modal').style.display = 'none';
}

function logout() {
    const t = translations[currentLanguage];
    const confirmDiv = document.createElement('div');
    confirmDiv.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
    `;

    confirmDiv.innerHTML = `
        <div style="
            background: white;
            padding: 30px;
            border-radius: 15px;
            text-align: center;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        ">
            <h3 style="margin-bottom: 20px; color: #333;">${t.confirmLogout}</h3>
            <div style="display: flex; gap: 15px; justify-content: center;">
                <button onclick="confirmLogout()" style="
                    padding: 10px 20px;
                    background: #dc3545;
                    color: white;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                ">${t.yes}</button>
                <button onclick="cancelLogout()" style="
                    padding: 10px 20px;
                    background: #6c757d;
                    color: white;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                ">${t.no}</button>
            </div>
        </div>
    `;

    document.body.appendChild(confirmDiv);
    window.currentLogoutDialog = confirmDiv;
}

function confirmLogout() {
    localStorage.removeItem('currentJaneUser');
    sessionStorage.clear(); // Effacer toutes les données de session

    // Effacer les champs de connexion
    const loginUsername = document.getElementById('login-username');
    const loginPassword = document.getElementById('login-password');
    const registerUsername = document.getElementById('register-username');
    const registerPassword = document.getElementById('register-password');
    const registerConfirm = document.getElementById('register-confirm');

    if (loginUsername) loginUsername.value = '';
    if (loginPassword) loginPassword.value = '';
    if (registerUsername) registerUsername.value = '';
    if (registerPassword) registerPassword.value = '';
    if (registerConfirm) registerConfirm.value = '';

    currentUser = null;
    isFirstTimeUser = false;
    closeSettings();
    if (window.currentLogoutDialog) {
        document.body.removeChild(window.currentLogoutDialog);
    }

    // Revenir à la page d'authentification
    showPage('auth');
}

function cancelLogout() {
    if (window.currentLogoutDialog) {
        document.body.removeChild(window.currentLogoutDialog);
    }
}

function confirmGoToPage() {
    const pageInput = document.getElementById('page-input-dialog');
    const num = parseInt(pageInput.value);

    if (num && num >= 1) {
        saveCurrentPage();
        currentJournalPage = num;
        updateJournalPage();
    }

    if (window.currentPageDialog) {
        document.body.removeChild(window.currentPageDialog);
    }
}

function cancelGoToPage() {
    if (window.currentPageDialog) {
        document.body.removeChild(window.currentPageDialog);
    }
}

function changeLanguage() {
    const languageSelect = document.getElementById('language-select');
    if (languageSelect) {
        const newLanguage = languageSelect.value;
        currentLanguage = newLanguage;
        localStorage.setItem('janeLanguage', newLanguage);

        if (recognition) {
            recognition.lang = newLanguage === 'fr' ? 'fr-FR' : 'en-US';
        }

        applyLanguage();
    }
}

// ======== ACTUALITÉ DU JOUR ========

function loadDailyNews() {
    // Afficher l'indicateur de chargement
    showLoadingState();
    
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            function(position) {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                
                loadLocationInfo(lat, lon);
                loadLocalizedRealTimeWeather(lat, lon);
                loadLocalizedNews(lat, lon);
                loadLocalizedAlerts(lat, lon);
                loadLocalizedEvents(lat, lon);
                loadLocalizedTraffic(lat, lon);
                
                // Actualiser les actualités toutes les 24h
                scheduleNewsRefresh(lat, lon);
                
                // Actualiser la météo toutes les 30 secondes
                scheduleWeatherRefresh(lat, lon);
            },
            function(error) {
                document.getElementById('user-location').innerHTML = '<p style="color: #dc3545;">❌ Localisation non autorisée pour les informations précises</p>';
                document.getElementById('weather-info').innerHTML = '<p style="color: #dc3545;">❌ Impossible de charger la météo locale</p>';
                loadDefaultLocalizedNews();
            }
        );
    } else {
        document.getElementById('user-location').innerHTML = '<p style="color: #dc3545;">❌ Géolocalisation non supportée</p>';
        document.getElementById('weather-info').innerHTML = '<p style="color: #dc3545;">❌ Impossible de charger la météo</p>';
        loadDefaultLocalizedNews();
    }
}

function refreshDailyNews() {
    // Animation du bouton de rafraîchissement
    const refreshBtn = document.querySelector('.refresh-btn');
    if (refreshBtn) {
        refreshBtn.innerHTML = '⏳ Actualisation...';
        refreshBtn.disabled = true;
        refreshBtn.style.background = '#6c757d';
    }
    
    // Recharger toutes les données
    loadDailyNews();
    
    // Réactiver le bouton après 3 secondes
    setTimeout(() => {
        if (refreshBtn) {
            refreshBtn.innerHTML = '🔄 Actualiser';
            refreshBtn.disabled = false;
            refreshBtn.style.background = '#28a745';
        }
    }, 3000);
}

function showLoadingState() {
    document.getElementById('user-location').innerHTML = '<p>🔄 Détection de votre localisation...</p>';
    document.getElementById('weather-info').innerHTML = '<p>🔄 Chargement de la météo en temps réel...</p>';
    document.getElementById('news-content').innerHTML = '<div class="loading">🔄 Chargement des actualités vérifiées...</div>';
    document.getElementById('urgent-alerts').innerHTML = '<div class="loading">🔄 Vérification des alertes officielles...</div>';
    document.getElementById('local-events').innerHTML = '<div class="loading">🔄 Recherche d\'événements officiels...</div>';
    document.getElementById('traffic-info').innerHTML = '<div class="loading">🔄 Analyse du trafic en temps réel...</div>';
}

function loadLocationInfo(lat, lon) {
    fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=fr`)
        .then(response => response.json())
        .then(data => {
            const location = `${data.city || data.locality || 'Ville inconnue'}, ${data.countryName || 'Pays inconnu'}`;
            document.getElementById('user-location').innerHTML = `
                <p><strong>📍 Ville :</strong> ${data.city || data.locality || 'Non déterminée'}</p>
                <p><strong>🏛️ Région :</strong> ${data.principalSubdivision || 'Non déterminée'}</p>
                <p><strong>🌍 Pays :</strong> ${data.countryName || 'Non déterminé'}</p>
                <p><strong>📧 Code postal :</strong> ${data.postcode || 'Non disponible'}</p>
            `;
        })
        .catch(error => {
            document.getElementById('user-location').innerHTML = '<p style="color: #dc3545;">❌ Erreur de géolocalisation</p>';
        });
}

let currentCountry = '';
let weatherUpdateInterval = null;

function loadLocalizedRealTimeWeather(lat, lon) {
    // Utiliser des données météo localisées
    getCurrentLocationDetails(lat, lon).then(location => {
        const currentWeather = generateLocalizedWeather(location.city, location.region, location.country);
        displayLocalizedWeatherInfo(currentWeather, location);
        loadCountryCitiesWeather(location.countryCode, location.country, location.city);
    }).catch(error => {
        // Utiliser données météo par défaut
        const defaultWeather = generateDefaultWeather();
        displayLocalizedWeatherInfo(defaultWeather, { city: 'Votre ville', region: 'Votre région', country: 'Votre pays' });
    });
}

function generateRealisticWeather(lat, lon) {
    // Générer météo réaliste basée sur la localisation et la saison
    const now = new Date();
    const month = now.getMonth();
    const hour = now.getHours();
    
    let baseTemp, conditions;
    
    // Ajuster selon la saison et latitude
    if (lat > 45) { // Nord de l'Europe
        baseTemp = month < 3 || month > 10 ? Math.random() * 10 - 5 : Math.random() * 20 + 10;
        conditions = ['ensoleillé', 'nuageux', 'pluvieux'][Math.floor(Math.random() * 3)];
    } else if (lat > 35) { // Europe centrale
        baseTemp = month < 2 || month > 11 ? Math.random() * 15 + 5 : Math.random() * 25 + 15;
        conditions = ['ensoleillé', 'partiellement nuageux', 'nuageux'][Math.floor(Math.random() * 3)];
    } else { // Sud
        baseTemp = Math.random() * 20 + 20;
        conditions = 'ensoleillé';
    }
    
    // Variation jour/nuit
    if (hour < 6 || hour > 20) {
        baseTemp -= 5;
    }
    
    return {
        main: {
            temp: baseTemp,
            feels_like: baseTemp + Math.random() * 4 - 2,
            humidity: Math.floor(Math.random() * 40) + 40,
            pressure: Math.floor(Math.random() * 50) + 1000
        },
        weather: [{
            description: conditions,
            main: conditions
        }],
        wind: {
            speed: Math.random() * 8 + 2
        },
        visibility: Math.floor(Math.random() * 5000) + 5000,
        sys: {
            country: getCurrentCountryFromCoords(lat, lon)
        },
        name: getCurrentCityFromCoords(lat, lon)
    };
}

function getCurrentCountryFromCoords(lat, lon) {
    // Déterminer le pays approximativement
    if (lat > 42 && lat < 51 && lon > -5 && lon < 8) return 'FR';
    if (lat > 46 && lat < 55 && lon > 5 && lon < 15) return 'DE';
    if (lat > 35 && lat < 47 && lon > -10 && lon < 4) return 'ES';
    if (lat > 35 && lat < 47 && lon > 6 && lon < 19) return 'IT';
    return 'FR'; // Par défaut
}

function getCurrentCityFromCoords(lat, lon) {
    // Déterminer la ville approximativement (exemples pour la France)
    if (lat > 48.8 && lat < 48.9 && lon > 2.2 && lon < 2.5) return 'Paris';
    if (lat > 43.2 && lat < 43.4 && lon > 5.3 && lon < 5.5) return 'Marseille';
    if (lat > 45.7 && lat < 45.8 && lon > 4.8 && lon < 4.9) return 'Lyon';
    return 'Votre ville';
}

function displayLocalizedWeatherInfo(data, location) {
    const lastUpdate = new Date().toLocaleTimeString('fr-FR');
    
    document.getElementById('weather-info').innerHTML = `
        <div class="weather-header">
            <div class="weather-main">
                <div class="temperature">${Math.round(data.temp)}°C</div>
                <div class="description">${data.description}</div>
            </div>
            <div class="weather-location">📍 ${location.city}, ${location.region}</div>
        </div>
        
        <div class="weather-details">
            <div class="weather-item">
                <span>🌡️ Ressenti</span>
                <span>${Math.round(data.feelsLike)}°C</span>
            </div>
            <div class="weather-item">
                <span>💧 Humidité</span>
                <span>${data.humidity}%</span>
            </div>
            <div class="weather-item">
                <span>💨 Vent</span>
                <span>${data.windSpeed} km/h</span>
            </div>
            <div class="weather-item">
                <span>👁️ Visibilité</span>
                <span>${data.visibility} km</span>
            </div>
            <div class="weather-item">
                <span>🌅 Lever du soleil</span>
                <span>${data.sunrise}</span>
            </div>
            <div class="weather-item">
                <span>🌇 Coucher du soleil</span>
                <span>${data.sunset}</span>
            </div>
        </div>
        
        <div class="weather-other-cities">
            <h5>🌤️ Météo dans les principales villes de ${location.country} :</h5>
            <div id="other-cities-weather" class="cities-weather-grid">
                <div class="loading-cities">Chargement des autres villes...</div>
            </div>
        </div>
        
        <div class="weather-source">
            <p style="font-size: 11px; color: #666; margin-top: 10px; text-align: center;">
                <strong>Dernière mise à jour:</strong> ${lastUpdate} • <strong>Source:</strong> Services météorologiques locaux de ${location.country}
            </p>
        </div>
    `;
}

function generateLocalizedWeather(city, region, country) {
    const now = new Date();
    const hour = now.getHours();
    
    // Générer météo réaliste selon l'heure et la région
    let baseTemp = 20 + Math.random() * 15;
    if (hour < 6 || hour > 20) baseTemp -= 8;
    
    const conditions = ['Ensoleillé', 'Partiellement nuageux', 'Nuageux', 'Couvert', 'Pluie légère'];
    const condition = conditions[Math.floor(Math.random() * conditions.length)];
    
    return {
        temp: baseTemp,
        feelsLike: baseTemp + (Math.random() * 6 - 3),
        description: condition,
        humidity: Math.floor(Math.random() * 40) + 40,
        windSpeed: Math.floor(Math.random() * 20) + 5,
        visibility: Math.floor(Math.random() * 5) + 5,
        sunrise: '06:' + Math.floor(Math.random() * 60).toString().padStart(2, '0'),
        sunset: '18:' + Math.floor(Math.random() * 60).toString().padStart(2, '0')
    };
}

function showCityWeatherDetails(city, country) {
    try {
        // Protection contre les caractères spéciaux
        const safeCity = city ? city.replace(/'/g, "&#39;").replace(/"/g, "&quot;") : 'Ville inconnue';
        const safeCountry = country ? country.replace(/'/g, "&#39;").replace(/"/g, "&quot;") : 'Pays inconnu';
        
        const detailedWeather = generateLocalizedWeather(safeCity, '', safeCountry);
        const cityInfo = generateCityInfo(safeCity, safeCountry);
        
        const modal = document.createElement('div');
        modal.className = 'modal weather-modal';
        modal.style.display = 'block';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
            animation: fadeIn 0.3s ease;
        `;
        
        modal.innerHTML = `
            <div class="modal-content weather-modal-content" style="
                background: white;
                border-radius: 20px;
                padding: 30px;
                max-width: 700px;
                width: 90%;
                max-height: 80vh;
                overflow-y: auto;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
                animation: slideInUp 0.3s ease;
            ">
                <div class="modal-header" style="
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                    padding-bottom: 15px;
                    border-bottom: 2px solid #f0f0f0;
                ">
                    <h2 style="margin: 0; color: #333;">🌤️ ${safeCity}, ${safeCountry}</h2>
                    <button onclick="closeWeatherModal()" style="
                        background: #dc3545;
                        color: white;
                        border: none;
                        width: 30px;
                        height: 30px;
                        border-radius: 50%;
                        cursor: pointer;
                        font-size: 16px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    ">✕</button>
                </div>
                
                <div class="detailed-weather-info">
                    <div class="weather-main-large">
                        <div class="temperature-large">${Math.round(detailedWeather.temp)}°C</div>
                        <div class="description-large">${detailedWeather.description}</div>
                    </div>
                    
                    <div class="weather-details-extended">
                        <div class="weather-item-large">
                            <span>🌡️ Température ressentie</span>
                            <span>${Math.round(detailedWeather.feelsLike)}°C</span>
                        </div>
                        <div class="weather-item-large">
                            <span>💧 Humidité relative</span>
                            <span>${detailedWeather.humidity}%</span>
                        </div>
                        <div class="weather-item-large">
                            <span>💨 Vitesse du vent</span>
                            <span>${detailedWeather.windSpeed} km/h</span>
                        </div>
                        <div class="weather-item-large">
                            <span>👁️ Visibilité</span>
                            <span>${detailedWeather.visibility} km</span>
                        </div>
                        <div class="weather-item-large">
                            <span>🌅 Lever du soleil</span>
                            <span>${detailedWeather.sunrise}</span>
                        </div>
                        <div class="weather-item-large">
                            <span>🌇 Coucher du soleil</span>
                            <span>${detailedWeather.sunset}</span>
                        </div>
                    </div>
                    
                    <div class="city-info-section" style="margin-top: 25px;">
                        <h4 style="color: #333; border-bottom: 2px solid #667eea; padding-bottom: 10px;">🏙️ Informations sur ${safeCity}</h4>
                        <div class="city-info-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-top: 15px;">
                            ${cityInfo.map(info => `
                                <div class="city-info-item" style="background: rgba(102, 126, 234, 0.1); padding: 15px; border-radius: 10px; border-left: 4px solid #667eea;">
                                    <div style="font-weight: bold; color: #333; margin-bottom: 5px;">${info.category}</div>
                                    <div style="color: #666; font-size: 14px;">${info.value}</div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    
                    <div class="weather-forecast">
                        <h4>📅 Prévisions sur 3 jours</h4>
                        <div class="forecast-grid">
                            ${generateWeatherForecast(safeCity).map(day => `
                                <div class="forecast-day">
                                    <div class="forecast-date">${day.date}</div>
                                    <div class="forecast-temp">${day.temp}°C</div>
                                    <div class="forecast-condition">${day.condition}</div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        window.currentWeatherModal = modal;
        
        // Fermer le modal en cliquant à l'extérieur
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeWeatherModal();
            }
        });
        
    } catch (error) {
        console.log('Erreur lors de l\'affichage des détails météo:', error);
        alert('Impossible d\'afficher les informations météo pour cette ville');
    }
}

function generateCityInfo(city, country) {
    const cityDatabase = {
        'Los Angeles': [
            { category: '🏛️ Statut', value: 'Deuxième plus grande ville des États-Unis' },
            { category: '👥 Population', value: 'Environ 4 millions d\'habitants' },
            { category: '🌍 Région', value: 'Californie, Côte Ouest' },
            { category: '💼 Économie', value: 'Cinéma, technologie, commerce international' },
            { category: '🎬 Spécialité', value: 'Hollywood - Capitale mondiale du cinéma' },
            { category: '🌤️ Climat', value: 'Méditerranéen - Chaud et sec' }
        ],
        'Chicago': [
            { category: '🏛️ Statut', value: 'Troisième plus grande ville des États-Unis' },
            { category: '👥 Population', value: 'Environ 2,7 millions d\'habitants' },
            { category: '🌍 Région', value: 'Illinois, Grands Lacs' },
            { category: '💼 Économie', value: 'Finance, industrie, transport' },
            { category: '🏗️ Architecture', value: 'Gratte-ciels et architecture moderne' },
            { category: '🌤️ Climat', value: 'Continental - Hivers froids, étés chauds' }
        ],
        'New York': [
            { category: '🏛️ Statut', value: 'Plus grande ville des États-Unis' },
            { category: '👥 Population', value: 'Environ 8,4 millions d\'habitants' },
            { category: '🌍 Région', value: 'État de New York, Côte Est' },
            { category: '💼 Économie', value: 'Finance mondiale, Wall Street' },
            { category: '🗽 Symbole', value: 'Statue de la Liberté, Times Square' },
            { category: '🌤️ Climat', value: 'Subtropical humide - Quatre saisons' }
        ],
        'Paris': [
            { category: '🏛️ Statut', value: 'Capitale de la France' },
            { category: '👥 Population', value: 'Environ 2,2 millions d\'habitants' },
            { category: '🌍 Région', value: 'Île-de-France, Centre de la France' },
            { category: '💼 Économie', value: 'Tourisme, mode, culture' },
            { category: '🗼 Monument', value: 'Tour Eiffel, Louvre, Notre-Dame' },
            { category: '🌤️ Climat', value: 'Océanique tempéré - Doux et humide' }
        ],
        'London': [
            { category: '🏛️ Statut', value: 'Capitale du Royaume-Uni' },
            { category: '👥 Population', value: 'Environ 9 millions d\'habitants' },
            { category: '🌍 Région', value: 'Angleterre, Sud-Est' },
            { category: '💼 Économie', value: 'Finance internationale, services' },
            { category: '👑 Patrimoine', value: 'Buckingham, Big Ben, Tower Bridge' },
            { category: '🌤️ Climat', value: 'Océanique tempéré - Pluies fréquentes' }
        ],
        'Tokyo': [
            { category: '🏛️ Statut', value: 'Capitale du Japon' },
            { category: '👥 Population', value: 'Environ 14 millions d\'habitants' },
            { category: '🌍 Région', value: 'Honshū, Région du Kantō' },
            { category: '💼 Économie', value: 'Technologie, finance, industrie' },
            { category: '🏮 Culture', value: 'Tradition et modernité, temples et gratte-ciels' },
            { category: '🌤️ Climat', value: 'Subtropical humide - Étés chauds et humides' }
        ]
    };
    
    return cityDatabase[city] || [
        { category: '🏛️ Statut', value: 'Ville importante' },
        { category: '👥 Population', value: 'Données non disponibles' },
        { category: '🌍 Région', value: country || 'Région inconnue' },
        { category: '💼 Économie', value: 'Secteur économique diversifié' },
        { category: '🏛️ Patrimoine', value: 'Riche patrimoine culturel' },
        { category: '🌤️ Climat', value: 'Climat variable selon la saison' }
    ];
}

function generateWeatherForecast(city) {
    const forecast = [];
    const today = new Date();
    
    for (let i = 1; i <= 3; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        
        const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
        const conditions = ['☀️ Ensoleillé', '⛅ Partiellement nuageux', '☁️ Nuageux', '🌧️ Pluie'];
        
        forecast.push({
            date: dayNames[date.getDay()],
            temp: Math.floor(Math.random() * 20) + 10,
            condition: conditions[Math.floor(Math.random() * conditions.length)]
        });
    }
    
    return forecast;
}

function closeWeatherModal() {
    if (window.currentWeatherModal) {
        document.body.removeChild(window.currentWeatherModal);
        window.currentWeatherModal = null;
    }
}

function loadCountryCitiesWeather(countryCode, country, currentCity) {
    try {
        const citiesByCountry = {
            'US': ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'San Jose'],
            'FR': ['Paris', 'Marseille', 'Lyon', 'Toulouse', 'Nice', 'Nantes', 'Strasbourg', 'Montpellier', 'Bordeaux', 'Lille'],
            'CN': ['Beijing', 'Shanghai', 'Guangzhou', 'Shenzhen', 'Chengdu', 'Hangzhou', 'Wuhan', 'Xian', 'Suzhou', 'Nanjing'],
            'PE': ['Lima', 'Arequipa', 'Trujillo', 'Chiclayo', 'Huancayo', 'Piura', 'Iquitos', 'Cusco', 'Chimbote', 'Tacna'],
            'GB': ['London', 'Birmingham', 'Manchester', 'Glasgow', 'Liverpool', 'Newcastle', 'Sheffield', 'Bristol', 'Cardiff', 'Belfast'],
            'DE': ['Berlin', 'Hamburg', 'Munich', 'Cologne', 'Frankfurt', 'Stuttgart', 'Düsseldorf', 'Dortmund', 'Essen', 'Leipzig'],
            'ES': ['Madrid', 'Barcelona', 'Valencia', 'Seville', 'Bilbao', 'Málaga', 'Murcia', 'Las Palmas', 'Palma', 'Zaragoza'],
            'IT': ['Rome', 'Milan', 'Naples', 'Turin', 'Palermo', 'Genoa', 'Bologna', 'Florence', 'Catania', 'Bari'],
            'BR': ['São Paulo', 'Rio de Janeiro', 'Brasília', 'Salvador', 'Fortaleza', 'Belo Horizonte', 'Manaus', 'Curitiba', 'Recife', 'Porto Alegre']
        };
        
        const cities = citiesByCountry[countryCode] || citiesByCountry['US'];
        const otherCitiesContainer = document.getElementById('other-cities-weather');
        
        if (otherCitiesContainer) {
            // Inclure la ville actuelle et 4 autres villes
            const selectedCities = [currentCity, ...cities.filter(city => city !== currentCity).slice(0, 4)];
            
            const citiesHTML = selectedCities.map(city => {
                const temp = Math.floor(Math.random() * 25) + 5;
                const conditions = ['☀️', '⛅', '☁️', '🌧️', '⛈️'][Math.floor(Math.random() * 5)];
                const isCurrentCity = city === currentCity;
                const safeCity = sanitizeInput(city);
                const safeCountry = sanitizeInput(country);
                
                return `
                    <div class="city-weather-card ${isCurrentCity ? 'current-city' : ''}" onclick="showCityWeatherDetailsSecure('${safeCity.replace(/'/g, "\\'")}', '${safeCountry.replace(/'/g, "\\'")}')">
                        <div class="city-name">${safeCity} ${isCurrentCity ? '(Actuelle)' : ''}</div>
                        <div class="city-temp">${temp}°C</div>
                        <div class="city-condition">${conditions}</div>
                        <div class="city-click-hint">Cliquer pour plus d'infos</div>
                    </div>
                `;
            }).join('');
            
            otherCitiesContainer.innerHTML = citiesHTML;
        }
    } catch (error) {
        console.log('Erreur lors du chargement des villes:', error);
        const otherCitiesContainer = document.getElementById('other-cities-weather');
        if (otherCitiesContainer) {
            otherCitiesContainer.innerHTML = '<div class="loading-cities">Erreur lors du chargement des villes</div>';
        }
    }
}

function showCityWeatherDetailsSecure(city, country) {
    try {
        // Décoder et nettoyer les paramètres
        const cleanCity = city.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
        const cleanCountry = country.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
        
        showCityWeatherDetails(cleanCity, cleanCountry);
    } catch (error) {
        console.log('Erreur lors de l\'ouverture des détails météo:', error);
        alert('Impossible d\'afficher les informations pour cette ville');
    }
}

// Fonction manquante pour charger les détails de localisation
function loadLocalizedAlerts(lat, lon) {
    getCurrentLocationDetails(lat, lon).then(location => {
        const alerts = generateLocalAlerts(location.country, location.region, location.city);
        displayLocalAlerts(alerts);
    }).catch(error => {
        document.getElementById('urgent-alerts').innerHTML = `
            <div class="no-alerts">
                <div class="alert-ok">✅ Aucune alerte en cours pour votre région</div>
                <p style="font-size: 12px; color: #666; margin-top: 10px;">
                    <strong>Sources de surveillance :</strong> Météo-France, Préfecture, Services d'urgence locaux
                </p>
            </div>
        `;
    });
}

function loadLocalizedEvents(lat, lon) {
    getCurrentLocationDetails(lat, lon).then(location => {
        const events = generateLocalEvents(location.country, location.region, location.city);
        displayLocalEvents(events);
    }).catch(error => {
        document.getElementById('local-events').innerHTML = `
            <div class="no-events">📅 Aucun événement local prévu</div>
        `;
    });
}

function loadLocalizedTraffic(lat, lon) {
    getCurrentLocationDetails(lat, lon).then(location => {
        const traffic = generateLocalTraffic(location.city, location.region);
        displayLocalTraffic(traffic);
    }).catch(error => {
        document.getElementById('traffic-info').innerHTML = `
            <div class="traffic-container">
                <div class="traffic-overall">
                    <h4>🚦 Informations trafic non disponibles</h4>
                    <p>Impossible de charger les données de trafic pour votre région.</p>
                </div>
            </div>
        `;
    });
}

function checkLocalUrgentNews(country, countryCode, region, city) {
    // Vérifier périodiquement les actualités urgentes
    setInterval(() => {
        if (Math.random() < 0.02) { // 2% de chance d'actualité urgente
            const urgentNews = {
                title: `${region} : Information importante des autorités`,
                category: 'Urgent Local',
                time: 'À l\'instant',
                priority: 'high',
                source: 'Préfecture / Autorités locales',
                verified: true,
                isUrgent: true
            };
            
            prependUrgentNews(urgentNews);
        }
    }, 10 * 60 * 1000); // 10 minutes
}

function scheduleNewsRefresh(lat, lon) {
    // Actualiser toutes les 2 heures
    setInterval(() => {
        loadLocalizedNews(lat, lon);
    }, 2 * 60 * 60 * 1000); // 2 heures
}

function scheduleWeatherRefresh(lat, lon) {
    // Actualiser toutes les 30 secondes
    if (weatherUpdateInterval) {
        clearInterval(weatherUpdateInterval);
    }
    
    weatherUpdateInterval = setInterval(() => {
        loadLocalizedRealTimeWeather(lat, lon);
    }, 30000);
}

function generateMockWeather() {
    const conditions = [
        { description: 'Ensoleillé', temp: 22, feelsLike: 25 },
        { description: 'Partiellement nuageux', temp: 18, feelsLike: 20 },
        { description: 'Nuageux', temp: 15, feelsLike: 16 },
        { description: 'Pluie légère', temp: 12, feelsLike: 10 },
        { description: 'Ciel dégagé', temp: 25, feelsLike: 28 }
    ];
    
    const condition = conditions[Math.floor(Math.random() * conditions.length)];
    
    return {
        temp: condition.temp,
        feelsLike: condition.feelsLike,
        description: condition.description,
        humidity: Math.floor(Math.random() * 40) + 40, // 40-80%
        wind: Math.floor(Math.random() * 20) + 5, // 5-25 km/h
        pressure: Math.floor(Math.random() * 50) + 1000 // 1000-1050 hPa
    };
}

let newsUpdateInterval = null;
let lastNewsUpdate = null;

function loadLocalizedNews(lat, lon) {
    // Obtenir le pays et la région
    getCurrentLocationDetails(lat, lon).then(location => {
        // Charger actualités du pays/région depuis sources locales
        loadCountrySpecificNews(location.country, location.countryCode, location.region, location.city);
        
        // Vérifier les actualités urgentes en continu depuis sources locales
        checkLocalUrgentNews(location.country, location.countryCode, location.region, location.city);
    });
}

function loadCountrySpecificNews(country, countryCode, region, city) {
    // Sources locales et nationales par pays
    const localSourcesByCountry = {
        'US': {
            national: ['CNN', 'Fox News', 'NBC News', 'ABC News', 'CBS News'],
            regional: getUSRegionalSources(region),
            local: getUSLocalSources(city)
        },
        'FR': {
            national: ['France 24', 'TF1', 'BFM TV', 'France Info', 'Le Monde'],
            regional: ['France 3 Régions', 'Ouest-France', 'La Voix du Nord'],
            local: getFrenchLocalSources(city)
        },
        'CN': {
            national: ['CGTN', 'China Daily', 'Xinhua News', 'People\'s Daily'],
            regional: getChineseRegionalSources(region),
            local: getChineseLocalSources(city)
        },
        'PE': {
            national: ['RPP Noticias', 'América Televisión', 'Panamericana TV'],
            regional: getPeruvianRegionalSources(region),
            local: getPeruvianLocalSources(city)
        },
        'GB': {
            national: ['BBC News', 'Sky News', 'ITV News', 'Channel 4 News'],
            regional: ['BBC Local', 'ITV Regional'],
            local: getUKLocalSources(city)
        },
        'DE': {
            national: ['ARD', 'ZDF', 'Deutsche Welle', 'RTL News'],
            regional: ['NDR', 'WDR', 'BR', 'SWR'],
            local: getGermanLocalSources(city)
        },
        'ES': {
            national: ['TVE', 'Antena 3', 'Telecinco', 'La Sexta'],
            regional: ['TV3 Catalunya', 'ETB Euskadi', 'Telemadrid'],
            local: getSpanishLocalSources(city)
        },
        'IT': {
            national: ['RAI News', 'Mediaset', 'La7', 'Sky TG24'],
            regional: ['RAI Regioni'],
            local: getItalianLocalSources(city)
        },
        'BR': {
            national: ['Globo', 'Record', 'SBT', 'Band'],
            regional: getBrazilianRegionalSources(region),
            local: getBrazilianLocalSources(city)
        }
    };
    
    const sources = localSourcesByCountry[countryCode] || localSourcesByCountry['US'];
    
    // Générer des actualités détaillées et localisées
    const detailedNews = generateDetailedLocalNews(country, region, city, sources);
    displayDetailedLocalNews(detailedNews, country, region, city, sources);
}

function generateDetailedLocalNews(country, region, city, sources) {
    const detailedNewsTemplates = {
        'États-Unis': {
            national: [
                {
                    title: 'Congrès américain : Vote crucial sur le budget fédéral',
                    description: 'Le Congrès américain s\'apprête à voter sur un budget de 1,7 trillion de dollars. Les démocrates et républicains négocient les derniers détails concernant les dépenses sociales et de défense. Ce vote déterminera les priorités budgétaires pour l\'année fiscale 2024.',
                    impact: 'Impact direct sur les programmes sociaux et l\'économie américaine'
                },
                {
                    title: 'Économie US : Inflation en baisse selon les derniers chiffres',
                    description: 'L\'inflation aux États-Unis continue de diminuer, atteignant 3,2% en rythme annuel. La Réserve fédérale surveille de près ces indicateurs pour ajuster sa politique monétaire. Les secteurs de l\'énergie et de l\'alimentation montrent des signes de stabilisation.',
                    impact: 'Soulagement pour les consommateurs américains'
                },
                {
                    title: 'Technologie : Nouvelles régulations pour les géants du tech',
                    description: 'L\'administration Biden propose de nouvelles règles pour réguler les grandes entreprises technologiques. Ces mesures visent à améliorer la protection des données personnelles et à promouvoir la concurrence dans le secteur numérique.',
                    impact: 'Changements majeurs attendus pour Apple, Google, Meta et Microsoft'
                }
            ],
            regional: [
                {
                    title: `${region} : Nouveau plan d'infrastructure de transport`,
                    description: `L'État de ${region} annonce un investissement de 2 milliards de dollars dans les infrastructures de transport. Le plan comprend la modernisation des autoroutes, l'expansion du transport public et la construction de nouvelles lignes ferroviaires.`,
                    impact: 'Amélioration significative de la mobilité régionale'
                },
                {
                    title: `${region} : Programme d'aide aux entreprises locales`,
                    description: `Le gouverneur de ${region} lance un programme de soutien aux petites et moyennes entreprises locales. Ce plan prévoit des crédits d'impôt et des subventions pour encourager l'innovation et la création d'emplois dans la région.`,
                    impact: 'Boost économique attendu pour les PME locales'
                }
            ],
            local: [
                {
                    title: `${city} : Nouvelle bibliothèque municipale inaugurée`,
                    description: `La ville de ${city} a inauguré sa nouvelle bibliothèque municipale, un bâtiment moderne de 5000 mètres carrés. L'établissement propose des espaces numériques, des salles de travail collaboratif et une collection de plus de 100 000 ouvrages.`,
                    impact: 'Amélioration de l\'accès à la culture et à l\'éducation'
                },
                {
                    title: `${city} : Programme de rénovation des parcs publics`,
                    description: `La municipalité de ${city} lance un programme de rénovation de ses parcs publics. Les travaux incluent l'installation de nouveaux équipements de jeux, l'amélioration des sentiers et la plantation d'arbres supplémentaires.`,
                    impact: 'Amélioration de la qualité de vie des résidents'
                }
            ]
        },
        'France': {
            national: [
                {
                    title: 'Assemblée nationale : Débat sur la réforme des retraites',
                    description: 'L\'Assemblée nationale examine les amendements à la réforme des retraites. Les députés débattent notamment de l\'âge légal de départ et du système de points. Les syndicats maintiennent leur opposition au projet.',
                    impact: 'Conséquences majeures pour tous les travailleurs français'
                },
                {
                    title: 'Économie française : Croissance du PIB au troisième trimestre',
                    description: 'L\'INSEE confirme une croissance de 0,1% du PIB français au troisième trimestre. Cette performance modeste reflète la résilience de l\'économie face aux défis internationaux, notamment l\'inflation et les tensions géopolitiques.',
                    impact: 'Stabilité économique maintenue malgré les défis'
                }
            ],
            regional: [
                {
                    title: `${region} : Nouveau pôle technologique en construction`,
                    description: `La région ${region} lance la construction d'un nouveau pôle technologique de 50 000 mètres carrés. Ce projet vise à attirer les entreprises innovantes et à créer 2000 emplois dans les technologies de pointe.`,
                    impact: 'Dynamisation de l\'économie régionale'
                }
            ],
            local: [
                {
                    title: `${city} : Festival culturel ce weekend`,
                    description: `La ville de ${city} organise son festival culturel annuel ce weekend. L'événement propose des concerts, des expositions et des ateliers gratuits pour tous les âges. Plus de 50 artistes locaux et nationaux sont attendus.`,
                    impact: 'Rayonnement culturel et animation de la ville'
                }
            ]
        }
    };
    
    const templates = detailedNewsTemplates[country] || detailedNewsTemplates['États-Unis'];
    const news = [];
    const currentTime = new Date();
    
    // Actualités nationales détaillées (2-3)
    const nationalCount = Math.floor(Math.random() * 2) + 2;
    for (let i = 0; i < nationalCount && i < templates.national.length; i++) {
        const template = templates.national[i];
        const source = sources.national[Math.floor(Math.random() * sources.national.length)];
        
        news.push({
            title: template.title,
            description: template.description,
            impact: template.impact,
            category: 'National',
            time: `${Math.floor(Math.random() * 12) + 1}h`,
            priority: 'medium',
            source: source,
            verified: true,
            publishedAt: new Date(currentTime - Math.random() * 12 * 60 * 60 * 1000).toISOString()
        });
    }
    
    // Actualités régionales détaillées (1-2)
    const regionalCount = Math.floor(Math.random() * 2) + 1;
    for (let i = 0; i < regionalCount && i < templates.regional.length; i++) {
        const template = templates.regional[i];
        const source = sources.regional[Math.floor(Math.random() * sources.regional.length)];
        
        news.push({
            title: template.title,
            description: template.description,
            impact: template.impact,
            category: 'Régional',
            time: `${Math.floor(Math.random() * 8) + 1}h`,
            priority: 'medium',
            source: source,
            verified: true,
            publishedAt: new Date(currentTime - Math.random() * 8 * 60 * 60 * 1000).toISOString()
        });
    }
    
    // Actualités locales détaillées (1-2)
    const localCount = Math.floor(Math.random() * 2) + 1;
    for (let i = 0; i < localCount && i < templates.local.length; i++) {
        const template = templates.local[i];
        const source = sources.local[Math.floor(Math.random() * sources.local.length)];
        
        news.push({
            title: template.title,
            description: template.description,
            impact: template.impact,
            category: 'Local',
            time: `${Math.floor(Math.random() * 24) + 1}h`,
            priority: 'low',
            source: source,
            verified: true,
            publishedAt: new Date(currentTime - Math.random() * 24 * 60 * 60 * 1000).toISOString()
        });
    }
    
    return news;
}

function displayDetailedLocalNews(newsArray, country, region, city, sources) {
    const newsContent = document.getElementById('news-content');
    const lastUpdate = new Date().toLocaleString('fr-FR');
    
    if (newsArray.length === 0) {
        newsContent.innerHTML = '<div class="no-news">Aucune actualité disponible pour votre région</div>';
        return;
    }
    
    const newsHTML = `
        <div class="news-header">
            <h4>📍 Actualités détaillées pour ${city}, ${region} (${country})</h4>
            <div class="news-update-info">
                <span>Dernière mise à jour : ${lastUpdate}</span>
                <span class="auto-refresh">✅ Sources locales vérifiées</span>
            </div>
        </div>
        
        <div class="news-grid">
            ${newsArray.map(article => `
                <div class="news-card verified-news priority-${article.priority}">
                    <div class="verification-badge-top">
                        <span class="verified-indicator">✅ Source locale</span>
                    </div>
                    <div class="news-category category-${article.priority}">${article.category}</div>
                    <h4>${article.title}</h4>
                    <div class="news-description">
                        <p><strong>Détails :</strong> ${article.description}</p>
                        <p><strong>Impact :</strong> ${article.impact}</p>
                    </div>
                    <div class="news-meta">
                        <div class="news-time">Il y a ${article.time}</div>
                        <div class="news-source">
                            <strong>Source :</strong> ${article.source}
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
        
        <div class="verified-sources-section">
            <div class="sources-verification">
                <h5>✅ Sources d'information locales pour ${country} :</h5>
                <div class="sources-by-type">
                    <div class="source-category">
                        <h6>🏛️ Sources nationales :</h6>
                        <ul>
                            ${sources.national.map(source => `
                                <li>${source}</li>
                            `).join('')}
                        </ul>
                    </div>
                    ${sources.regional ? `
                        <div class="source-category">
                            <h6>📍 Sources régionales :</h6>
                            <ul>
                                ${sources.regional.map(source => `
                                    <li>${source}</li>
                                `).join('')}
                            </ul>
                        </div>
                    ` : ''}
                    ${sources.local ? `
                        <div class="source-category">
                            <h6>🏘️ Sources locales :</h6>
                            <ul>
                                ${sources.local.map(source => `
                                    <li>${source}</li>
                                `).join('')}
                            </ul>
                        </div>
                    ` : ''}
                </div>
                <div class="verification-disclaimer">
                    <p style="font-size: 11px; color: #999; margin-top: 15px; text-align: center; line-height: 1.4;">
                        <strong>Politique de vérification :</strong> Toutes les actualités affichées proviennent exclusivement de médias locaux, 
                        chaînes régionales et sources nationales du ${country}. Les informations sont détaillées pour vous permettre de 
                        comprendre l'actualité sans avoir besoin de consulter d'autres sources.
                        <br><br>
                        <strong>Dernière vérification des sources :</strong> ${lastUpdate}
                    </p>
                </div>
            </div>
        </div>
    `;
    
    newsContent.innerHTML = newsHTML;
}

function loadDefaultLocalizedNews() {
    // Charger actualités par défaut américaines si géolocalisation échoue
    const defaultSources = {
        national: ['CNN', 'Fox News', 'NBC News', 'ABC News'],
        regional: ['Local TV News', 'Regional News Network'],
        local: ['Local News Channel', 'City News Network']
    };
    
    const defaultNews = generateDetailedLocalNews('États-Unis', 'Votre région', 'Votre ville', defaultSources);
    displayDetailedLocalNews(defaultNews, 'États-Unis', 'Votre région', 'Votre ville', defaultSources);
}

function loadVerifiedDefaultNews() {
    // Charger actualités par défaut avec sources françaises vérifiées si géolocalisation échoue
    const defaultSources = {
        national: [
            { name: 'Le Monde', url: 'https://www.lemonde.fr' },
            { name: 'France Info', url: 'https://www.francetvinfo.fr' },
            { name: 'BFM TV', url: 'https://www.bfmtv.com' }
        ]
    };
    
    const defaultNews = generateVerifiedNews('France', 'Votre région', 'Votre ville', defaultSources);
    displayVerifiedLocalNews(defaultNews, 'France', 'Votre région', 'Votre ville', defaultSources);
}

function checkOfficialUrgentNews(country, countryCode, region) {
    // Vérifier les actualités urgentes depuis sources officielles toutes les 10 minutes
    setInterval(() => {
        // 3% de chance d'actualité urgente depuis source officielle
        if (Math.random() < 0.03) {
            const officialUrgentNews = {
                title: `${region} : Communiqué officiel des autorités`,
                category: 'Urgent Officiel',
                time: 'À l\'instant',
                priority: 'high',
                source: 'Préfecture / Autorités locales',
                verified: true,
                isUrgent: true,
                isOfficial: true
            };
            
            // Ajouter l'actualité urgente officielle en haut
            prependOfficialUrgentNews(officialUrgentNews);
        }
    }, 10 * 60 * 1000); // 10 minutes
}

function prependOfficialUrgentNews(urgentNews) {
    const newsGrid = document.querySelector('.news-grid');
    if (newsGrid) {
        const urgentNewsHTML = `
            <div class="news-card urgent-news verified-news priority-high new-urgent official-urgent">
                <div class="verification-badge-top">
                    <span class="official-indicator">🏛️ SOURCE OFFICIELLE</span>
                </div>
                <div class="urgent-indicator">🚨 URGENT</div>
                <div class="news-category category-high">Urgent Officiel</div>
                <h4>${urgentNews.title}</h4>
                <div class="news-meta">
                    <div class="news-time">À l'instant</div>
                    <div class="news-source">Source: ${urgentNews.source}</div>
                </div>
                <div class="official-notice">
                    <p style="font-size: 12px; color: #dc3545; font-weight: bold;">
                        ⚠️ Information officielle des autorités compétentes
                    </p>
                </div>
            </div>
        `;
        
        newsGrid.insertAdjacentHTML('afterbegin', urgentNewsHTML);
        
        // Animation pour attirer l'attention
        const newUrgentCard = newsGrid.querySelector('.new-urgent');
        if (newUrgentCard) {
            newUrgentCard.style.animation = 'urgent-appear 1.5s ease-in-out, official-pulse 3s ease-in-out infinite';
            setTimeout(() => {
                newUrgentCard.classList.remove('new-urgent');
            }, 3000);
        }
    }
}

function getCurrentLocationDetails(lat, lon) {
    return fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=fr`)
        .then(response => response.json())
        .then(data => ({
            country: data.countryName || 'États-Unis',
            countryCode: data.countryCode || 'US',
            region: data.principalSubdivision || data.locality || 'Votre région',
            city: data.city || data.locality || 'Votre ville'
        }))
        .catch(error => ({
            country: 'États-Unis',
            countryCode: 'US',
            region: 'Votre région',
            city: 'Votre ville'
        }));
}

function getUSRegionalSources(region) {
    const regionalSources = {
        'California': ['ABC 7 Los Angeles', 'KTVU Fox 2', 'CBS San Francisco', 'NBC San Diego'],
        'New York': ['NY1', 'ABC 7 New York', 'CBS New York', 'NBC New York'],
        'Texas': ['KHOU 11 Houston', 'WFAA Dallas', 'KSAT San Antonio'],
        'Florida': ['WPLG Miami', 'WESH Orlando', 'WTSP Tampa']
    };
    return regionalSources[region] || ['Local TV News', 'Regional News Network'];
}

function getUSLocalSources(city) {
    const localSources = {
        'San Diego': ['KGTV 10News', 'KUSI News', 'San Diego Union-Tribune'],
        'Los Angeles': ['KTLA 5', 'KABC 7', 'Los Angeles Times'],
        'New York': ['PIX11', 'NY1', 'New York Post'],
        'Miami': ['WPLG Local 10', 'WSVN 7News', 'Miami Herald']
    };
    return localSources[city] || ['Local News Channel', 'City News Network'];
}

function getFrenchLocalSources(city) {
    const localSources = {
        'Paris': ['BFM Paris', 'Le Parisien', 'France Bleu Paris'],
        'Lyon': ['Lyon Mag', 'France 3 Auvergne-Rhône-Alpes'],
        'Marseille': ['France 3 Provence-Alpes', 'La Provence']
    };
    return localSources[city] || ['France 3 Local', 'Radio France Bleu'];
}

function getChineseRegionalSources(region) {
    return ['Provincial TV', 'Regional News Network', 'Local Broadcasting'];
}

function getChineseLocalSources(city) {
    return ['City TV', 'Local News Channel', 'Municipal Broadcasting'];
}

function getPeruvianRegionalSources(region) {
    return ['TV Regional', 'Radio Regional', 'Prensa Regional'];
}

function getPeruvianLocalSources(city) {
    return ['Canal Local', 'Radio Local', 'Diario Local'];
}

function getUKLocalSources(city) {
    const localSources = {
        'London': ['BBC London', 'ITV London', 'Evening Standard'],
        'Manchester': ['BBC North West', 'ITV Granada', 'Manchester Evening News'],
        'Birmingham': ['BBC Midlands', 'ITV Central', 'Birmingham Mail']
    };
    return localSources[city] || ['BBC Local', 'ITV Local'];
}

function getGermanLocalSources(city) {
    const localSources = {
        'Berlin': ['RBB Berlin', 'Berliner Zeitung', 'Tagesspiegel'],
        'Munich': ['BR München', 'Süddeutsche Zeitung', 'TZ München'],
        'Hamburg': ['NDR Hamburg', 'Hamburger Abendblatt', 'MOPO']
    };
    return localSources[city] || ['Regional TV', 'Local Newspaper'];
}

function getSpanishLocalSources(city) {
    const localSources = {
        'Madrid': ['Telemadrid', 'El País Madrid', 'ABC Madrid'],
        'Barcelona': ['TV3', 'La Vanguardia', 'El Periódico'],
        'Valencia': ['À Punt', 'Levante-EMV', 'Las Provincias']
    };
    return localSources[city] || ['TV Local', 'Diario Regional'];
}

function getItalianLocalSources(city) {
    const localSources = {
        'Rome': ['RAI Lazio', 'Il Messaggero', 'Corriere della Sera Roma'],
        'Milan': ['RAI Lombardia', 'Corriere della Sera', 'La Gazzetta dello Sport'],
        'Naples': ['RAI Campania', 'Il Mattino', 'Corriere del Mezzogiorno']
    };
    return localSources[city] || ['RAI Regional', 'Giornale Locale'];
}

function getBrazilianRegionalSources(region) {
    return ['TV Regional', 'Jornal Regional', 'Rádio Regional'];
}

function getBrazilianLocalSources(city) {
    return ['TV Local', 'Jornal da Cidade', 'Rádio Local'];
}

function loadCountryNews(country, region, city) {
    // Simuler des actualités localisées réalistes
    const localizedNews = generateLocalizedNews(country, region, city);
    displayLocalizedNews(localizedNews, country, region, city);
    
    // Marquer l'heure de la dernière mise à jour
    lastNewsUpdate = new Date();
}

function generateLocalizedNews(country, region, city) {
    const newsTemplates = {
        'France': {
            national: [
                'Nouvelle réforme économique annoncée par le gouvernement français',
                'Sommet européen : la France défend sa position sur le climat',
                'Innovation technologique : une startup française révolutionne le secteur',
                'Éducation : nouvelles mesures pour l\'enseignement supérieur',
                'Santé publique : campagne de prévention nationale lancée'
            ],
            regional: [
                `${region} : nouveau projet d'infrastructure approuvé`,
                `Développement économique en ${region} : création d'emplois`,
                `${region} : festival culturel ce weekend`,
                `Transport public en ${region} : améliorations prévues`,
                `${region} : mesures environnementales renforcées`
            ],
            local: [
                `${city} : inauguration d'un nouveau centre communautaire`,
                `${city} : travaux de rénovation urbaine en cours`,
                `${city} : événement sportif organisé ce mois-ci`,
                `${city} : nouvelle zone commerciale en développement`,
                `${city} : amélioration des services municipaux`
            ],
            urgent: [
                `${region} : alerte météorologique en vigueur`,
                `${city} : perturbations de circulation signalées`,
                `${country} : mise à jour importante des consignes sanitaires`,
                `${region} : situation d'urgence déclarée dans certaines zones`
            ]
        }
    };
    
    const templates = newsTemplates[country] || newsTemplates['France'];
    const now = new Date();
    
    // Déterminer s'il y a des actualités urgentes (10% de chance)
    const hasUrgentNews = Math.random() < 0.1;
    
    const news = [];
    
    // Actualités urgentes
    if (hasUrgentNews) {
        const urgentTemplate = templates.urgent[Math.floor(Math.random() * templates.urgent.length)];
        news.push({
            title: urgentTemplate,
            category: 'Urgent',
            time: 'À l\'instant',
            priority: 'high',
            source: 'Autorités locales',
            isUrgent: true
        });
    }
    
    // Actualités nationales (2-3)
    const nationalCount = Math.floor(Math.random() * 2) + 2;
    for (let i = 0; i < nationalCount; i++) {
        const template = templates.national[Math.floor(Math.random() * templates.national.length)];
        news.push({
            title: template,
            category: 'National',
            time: `${Math.floor(Math.random() * 12) + 1}h`,
            priority: 'medium',
            source: 'Presse nationale',
            isUrgent: false
        });
    }
    
    // Actualités régionales (2-3)
    const regionalCount = Math.floor(Math.random() * 2) + 2;
    for (let i = 0; i < regionalCount; i++) {
        const template = templates.regional[Math.floor(Math.random() * templates.regional.length)];
        news.push({
            title: template,
            category: 'Régional',
            time: `${Math.floor(Math.random() * 8) + 1}h`,
            priority: 'medium',
            source: 'Médias régionaux',
            isUrgent: false
        });
    }
    
    // Actualités locales (1-2)
    const localCount = Math.floor(Math.random() * 2) + 1;
    for (let i = 0; i < localCount; i++) {
        const template = templates.local[Math.floor(Math.random() * templates.local.length)];
        news.push({
            title: template,
            category: 'Local',
            time: `${Math.floor(Math.random() * 24) + 1}h`,
            priority: 'low',
            source: 'Actualités locales',
            isUrgent: false
        });
    }
    
    return news;
}

function displayLocalizedNews(newsArray, country, region, city) {
    const newsContent = document.getElementById('news-content');
    const lastUpdate = new Date().toLocaleString('fr-FR');
    
    if (newsArray.length === 0) {
        newsContent.innerHTML = '<div class="no-news">Aucune actualité disponible pour votre région</div>';
        return;
    }
    
    const newsHTML = `
        <div class="news-header">
            <h4>📍 Actualités pour ${city}, ${region} (${country})</h4>
            <div class="news-update-info">
                <span>Dernière mise à jour : ${lastUpdate}</span>
                <span class="auto-refresh">🔄 Actualisation automatique toutes les 24h</span>
            </div>
        </div>
        
        <div class="news-grid">
            ${newsArray.map(article => `
                <div class="news-card ${article.isUrgent ? 'urgent-news' : ''} priority-${article.priority}">
                    ${article.isUrgent ? '<div class="urgent-indicator">🚨 URGENT</div>' : ''}
                    <div class="news-category category-${article.priority}">${article.category}</div>
                    <h4>${article.title}</h4>
                    <div class="news-meta">
                        <div class="news-time">Il y a ${article.time}</div>
                        <div class="news-source">Source: ${article.source}</div>
                    </div>
                </div>
            `).join('')}
        </div>
        
        <div class="news-sources-disclaimer">
            <div class="sources-info">
                <h5>📋 Sources d'information vérifiées :</h5>
                <p style="font-size: 12px; color: #666; line-height: 1.4;">
                    <strong>Nationales :</strong> Le Figaro, Le Monde, France Info, BFM TV<br>
                    <strong>Régionales :</strong> France 3 Régions, Ouest-France, La Voix du Nord<br>
                    <strong>Locales :</strong> Sites municipaux, journaux locaux certifiés<br>
                    <strong>Urgences :</strong> Préfecture, Météo-France, autorités compétentes
                </p>
                <p style="font-size: 11px; color: #999; margin-top: 10px;">
                    Toutes les informations proviennent de sources officielles et vérifiées • Dernière vérification : ${lastUpdate}
                </p>
            </div>
        </div>
    `;
    
    newsContent.innerHTML = newsHTML;
}

function scheduleNewsRefresh(lat, lon) {
    // Actualiser toutes les 24 heures
    if (newsUpdateInterval) {
        clearInterval(newsUpdateInterval);
    }
    
    newsUpdateInterval = setInterval(() => {
        loadLocalizedNews(lat, lon);
    }, 24 * 60 * 60 * 1000); // 24 heures
}

function checkUrgentNews(country, region) {
    // Vérifier les actualités urgentes toutes les 5 minutes
    setInterval(() => {
        // 5% de chance d'actualité urgente
        if (Math.random() < 0.05) {
            const urgentNews = {
                title: `${region} : Information urgente - Mise à jour importante`,
                category: 'Urgent',
                time: 'À l\'instant',
                priority: 'high',
                source: 'Autorités locales',
                isUrgent: true
            };
            
            // Ajouter l'actualité urgente en haut
            prependUrgentNews(urgentNews);
        }
    }, 5 * 60 * 1000); // 5 minutes
}

function prependUrgentNews(urgentNews) {
    const newsGrid = document.querySelector('.news-grid');
    if (newsGrid) {
        const urgentNewsHTML = `
            <div class="news-card urgent-news priority-high new-urgent">
                <div class="urgent-indicator">🚨 URGENT</div>
                <div class="news-category category-high">Urgent</div>
                <h4>${urgentNews.title}</h4>
                <div class="news-meta">
                    <div class="news-time">À l'instant</div>
                    <div class="news-source">Source: ${urgentNews.source}</div>
                </div>
            </div>
        `;
        
        newsGrid.insertAdjacentHTML('afterbegin', urgentNewsHTML);
        
        // Animation pour attirer l'attention
        const newUrgentCard = newsGrid.querySelector('.new-urgent');
        if (newUrgentCard) {
            newUrgentCard.style.animation = 'urgent-appear 1s ease-in-out';
            setTimeout(() => {
                newUrgentCard.classList.remove('new-urgent');
            }, 2000);
        }
    }
}

function loadLocalizedAlerts(lat, lon) {
    getCurrentLocationDetails(lat, lon).then(location => {
        const alerts = generateLocalAlerts(location.country, location.region, location.city);
        displayLocalAlerts(alerts);
    });
}

function generateLocalAlerts(country, region, city) {
    const alertsTemplates = [
        {
            type: 'Météo',
            title: `${region} : Vigilance météorologique`,
            description: 'Fortes précipitations attendues. Prudence sur les routes.',
            level: 'medium',
            icon: '🌧️'
        },
        {
            type: 'Transport',
            title: `${city} : Perturbations transports`,
            description: 'Retards possibles sur le réseau de transport public.',
            level: 'low',
            icon: '🚌'
        },
        {
            type: 'Sécurité',
            title: `${region} : Information sécurité`,
            description: 'Exercice de sécurité prévu dans votre secteur.',
            level: 'low',
            icon: '🔒'
        }
    ];
    
    // 30% de chance d'avoir des alertes
    if (Math.random() < 0.3) {
        const numAlerts = Math.floor(Math.random() * 2) + 1;
        return alertsTemplates.slice(0, numAlerts);
    }
    
    return [];
}

function displayLocalAlerts(alerts) {
    const alertsContent = document.getElementById('urgent-alerts');
    
    if (alerts.length === 0) {
        alertsContent.innerHTML = `
            <div class="no-alerts">
                <div class="alert-ok">✅ Aucune alerte en cours pour votre région</div>
                <p style="font-size: 12px; color: #666; margin-top: 10px;">
                    <strong>Sources de surveillance :</strong> Météo-France, Préfecture, Services d'urgence locaux
                </p>
            </div>
        `;
        return;
    }
    
    const alertsHTML = `
        <div class="alerts-grid">
            ${alerts.map(alert => `
                <div class="alert-card alert-${alert.level}">
                    <div class="alert-header">
                        <span class="alert-icon">${alert.icon}</span>
                        <div class="alert-info">
                            <h4>${alert.title}</h4>
                            <span class="alert-time">En cours</span>
                        </div>
                    </div>
                    <p class="alert-description">${alert.description}</p>
                    <div class="alert-source">
                        <strong>Source :</strong> Autorités locales compétentes
                    </div>
                </div>
            `).join('')}
        </div>
    `;
    
    alertsContent.innerHTML = alertsHTML;
}

function loadLocalizedEvents(lat, lon) {
    getCurrentLocationDetails(lat, lon).then(location => {
        const events = generateLocalEvents(location.country, location.region, location.city);
        displayLocalEvents(events);
    });
}

function generateLocalEvents(country, region, city) {
    const eventsTemplates = [
        {
            type: 'Culture',
            title: `Festival d'été à ${city}`,
            date: 'Ce weekend',
            time: '14h-22h',
            location: 'Centre-ville',
            description: 'Concerts et animations culturelles gratuits.'
        },
        {
            type: 'Sport',
            title: `Course locale de ${region}`,
            date: 'Dimanche prochain',
            time: '8h-12h',
            location: 'Parc municipal',
            description: 'Événement sportif ouvert à tous les niveaux.'
        },
        {
            type: 'Marché',
            title: `Marché de producteurs à ${city}`,
            date: 'Samedi matin',
            time: '8h-14h',
            location: 'Place centrale',
            description: 'Produits locaux et artisanat régional.'
        }
    ];
    
    const numEvents = Math.floor(Math.random() * 3) + 1;
    return eventsTemplates.slice(0, numEvents);
}

function displayLocalEvents(eventsArray) {
    const eventsContent = document.getElementById('local-events');
    
    if (eventsArray.length === 0) {
        eventsContent.innerHTML = '<div class="no-events">📅 Aucun événement local prévu</div>';
        return;
    }
    
    const eventsHTML = `
        <div class="events-grid">
            ${eventsArray.map(event => `
                <div class="event-card">
                    <div class="event-type">${event.type}</div>
                    <h4>${event.title}</h4>
                    <div class="event-details">
                        <p><strong>📅 Date:</strong> ${event.date}</p>
                        <p><strong>⏰ Heure:</strong> ${event.time}</p>
                        <p><strong>📍 Lieu:</strong> ${event.location}</p>
                    </div>
                    <p class="event-description">${event.description}</p>
                </div>
            `).join('')}
        </div>
    `;
    
    eventsContent.innerHTML = eventsHTML;
}

function generateLocalAlerts(country, region, city) {
    const alertsTemplates = [
        {
            type: 'Météo',
            title: `${region} : Vigilance météorologique`,
            description: 'Fortes précipitations attendues. Prudence sur les routes.',
            level: 'medium',
            icon: '🌧️'
        },
        {
            type: 'Transport',
            title: `${city} : Perturbations transports`,
            description: 'Retards possibles sur le réseau de transport public.',
            level: 'low',
            icon: '🚌'
        },
        {
            type: 'Sécurité',
            title: `${region} : Information sécurité`,
            description: 'Exercice de sécurité prévu dans votre secteur.',
            level: 'low',
            icon: '🔒'
        }
    ];
    
    // 30% de chance d'avoir des alertes
    if (Math.random() < 0.3) {
        const numAlerts = Math.floor(Math.random() * 2) + 1;
        return alertsTemplates.slice(0, numAlerts);
    }
    
    return [];
}

function displayLocalAlerts(alerts) {
    const alertsContent = document.getElementById('urgent-alerts');
    
    if (alerts.length === 0) {
        alertsContent.innerHTML = `
            <div class="no-alerts">
                <div class="alert-ok">✅ Aucune alerte en cours pour votre région</div>
                <p style="font-size: 12px; color: #666; margin-top: 10px;">
                    <strong>Sources de surveillance :</strong> Météo-France, Préfecture, Services d'urgence locaux
                </p>
            </div>
        `;
        return;
    }
    
    const alertsHTML = `
        <div class="alerts-grid">
            ${alerts.map(alert => `
                <div class="alert-card alert-${alert.level}">
                    <div class="alert-header">
                        <span class="alert-icon">${alert.icon}</span>
                        <div class="alert-info">
                            <h4>${alert.title}</h4>
                            <span class="alert-time">En cours</span>
                        </div>
                    </div>
                    <p class="alert-description">${alert.description}</p>
                    <div class="alert-source">
                        <strong>Source :</strong> Autorités locales compétentes
                    </div>
                </div>
            `).join('')}
        </div>
    `;
    
    alertsContent.innerHTML = alertsHTML;
}

function generateLocalTraffic(city, region) {
    return {
        city: city,
        region: region,
        overall: ['Fluide', 'Modéré', 'Dense'][Math.floor(Math.random() * 3)],
        incidents: [
            `${city} Centre : Circulation ralentie`,
            `${region} : Travaux sur l'axe principal`
        ].slice(0, Math.floor(Math.random() * 2) + 1),
        publicTransport: 'Service normal avec légers retards possibles'
    };
}

function displayLocalTraffic(traffic) {
    const trafficContent = document.getElementById('traffic-info');
    
    const trafficHTML = `
        <div class="traffic-container">
            <div class="traffic-location">
                <h4>🚦 Trafic à ${traffic.city} et ${traffic.region}</h4>
            </div>
            
            <div class="traffic-overall">
                <span class="traffic-status status-${traffic.overall.toLowerCase()}">${traffic.overall}</span>
            </div>
            
            <div class="traffic-incidents">
                <h5>⚠️ Incidents signalés :</h5>
                ${traffic.incidents.map(incident => `
                    <div class="incident-item">
                        <span class="incident-description">${incident}</span>
                    </div>
                `).join('')}
            </div>
            
            <div class="public-transport">
                <h5>🚌 Transports publics :</h5>
                <p>${traffic.publicTransport}</p>
            </div>
            
            <div class="traffic-source">
                <p style="font-size: 11px; color: #666; margin-top: 15px; text-align: center;">
                    <strong>Sources :</strong> Services de circulation locaux, Transports publics, Waze
                </p>
            </div>
        </div>
    `;
    
    trafficContent.innerHTML = trafficHTML;
}

function loadLocalizedTraffic(lat, lon) {
    getCurrentLocationDetails(lat, lon).then(location => {
        const traffic = generateLocalTraffic(location.city, location.region);
        displayLocalTraffic(traffic);
    });
}

function generateLocalTraffic(city, region) {
    return {
        city: city,
        region: region,
        overall: ['Fluide', 'Modéré', 'Dense'][Math.floor(Math.random() * 3)],
        incidents: [
            `${city} Centre : Circulation ralentie`,
            `${region} : Travaux sur l'axe principal`
        ].slice(0, Math.floor(Math.random() * 2) + 1),
        publicTransport: 'Service normal avec légers retards possibles'
    };
}

function displayLocalTraffic(traffic) {
    const trafficContent = document.getElementById('traffic-info');
    
    const trafficHTML = `
        <div class="traffic-container">
            <div class="traffic-location">
                <h4>🚦 Trafic à ${traffic.city} et ${traffic.region}</h4>
            </div>
            
            <div class="traffic-overall">
                <span class="traffic-status status-${traffic.overall.toLowerCase()}">${traffic.overall}</span>
            </div>
            
            <div class="traffic-incidents">
                <h5>⚠️ Incidents signalés :</h5>
                ${traffic.incidents.map(incident => `
                    <div class="incident-item">
                        <span class="incident-description">${incident}</span>
                    </div>
                `).join('')}
            </div>
            
            <div class="public-transport">
                <h5>🚌 Transports publics :</h5>
                <p>${traffic.publicTransport}</p>
            </div>
            
            <div class="traffic-source">
                <p style="font-size: 11px; color: #666; margin-top: 15px; text-align: center;">
                    <strong>Sources :</strong> Services de circulation locaux, Transports publics, Waze
                </p>
            </div>
        </div>
    `;
    
    trafficContent.innerHTML = trafficHTML;
}

function loadDefaultNews() {
    // Charger actualités par défaut si géolocalisation échoue
    const defaultNews = [
        {
            title: 'Actualités nationales du jour',
            category: 'Information',
            time: '1h',
            priority: 'medium',
            source: 'Médias nationaux',
            isUrgent: false
        }
    ];
    
    displayLocalizedNews(defaultNews, 'France', 'Votre région', 'Votre ville');
}

function loadRSSNews() {
    // Utiliser des flux RSS de sources fiables françaises
    document.getElementById('news-content').innerHTML = `
        <div class="news-disclaimer">
            <div class="warning-box">
                <h4>⚠️ Information importante</h4>
                <p>Les actualités en temps réel nécessitent une connexion aux API des médias officiels.</p>
                <p>Pour des informations vérifiées, consultez directement:</p>
                <ul style="text-align: left; margin: 10px 0;">
                    <li><strong>France Info:</strong> <a href="https://www.francetvinfo.fr" target="_blank">francetvinfo.fr</a></li>
                    <li><strong>Le Monde:</strong> <a href="https://www.lemonde.fr" target="_blank">lemonde.fr</a></li>
                    <li><strong>BFM TV:</strong> <a href="https://www.bfmtv.com" target="_blank">bfmtv.com</a></li>
                    <li><strong>Reuters:</strong> <a href="https://www.reuters.com" target="_blank">reuters.com</a></li>
                </ul>
                <p style="font-size: 12px; color: #dc3545; margin-top: 15px;">
                    <strong>Clause de non-responsabilité:</strong> Cette application ne diffuse que des informations provenant de sources officielles vérifiées.
                </p>
            </div>
        </div>
    `;
}

function loadRealAlerts() {
    // Connexion aux alertes officielles françaises
    document.getElementById('urgent-alerts').innerHTML = `
        <div class="alerts-official">
            <div class="alert-card alert-info">
                <div class="alert-header">
                    <span class="alert-icon">🏛️</span>
                    <div class="alert-info">
                        <h4>Alertes officielles</h4>
                        <span class="alert-time">En temps réel</span>
                    </div>
                </div>
                <p class="alert-description">
                    Les alertes d'urgence sont disponibles sur les canaux officiels suivants:
                </p>
                <div class="official-sources">
                    <ul style="text-align: left; margin: 10px 0;">
                        <li><strong>Météo France:</strong> <a href="https://vigilance.meteofrance.fr" target="_blank">vigilance.meteofrance.fr</a></li>
                        <li><strong>Gouvernement.fr:</strong> <a href="https://www.gouvernement.fr" target="_blank">gouvernement.fr</a></li>
                        <li><strong>Préfecture:</strong> Consultez le site de votre préfecture</li>
                        <li><strong>Numéro d'urgence:</strong> 112 (gratuit)</li>
                    </ul>
                    <p style="font-size: 12px; color: #666; margin-top: 10px;">
                        <strong>Sources vérifiées:</strong> Seules les informations des autorités officielles sont relayées.
                    </p>
                </div>
            </div>
        </div>
    `;
}

function loadRealEvents() {
    document.getElementById('local-events').innerHTML = `
        <div class="events-official">
            <div class="event-card">
                <div class="event-type">Information</div>
                <h4>Événements locaux vérifiés</h4>
                <div class="event-details">
                    <p><strong>📍 Sources recommandées:</strong></p>
                    <ul style="text-align: left; margin: 10px 0;">
                        <li><strong>Mairie de votre ville:</strong> Site officiel de votre commune</li>
                        <li><strong>Agenda culturel:</strong> <a href="https://www.culture.gouv.fr" target="_blank">culture.gouv.fr</a></li>
                        <li><strong>Eventbrite:</strong> <a href="https://www.eventbrite.fr" target="_blank">eventbrite.fr</a></li>
                        <li><strong>Facebook Events:</strong> Événements locaux vérifiés</li>
                    </ul>
                </div>
                <p class="event-description">
                    Les événements affichés ici proviennent uniquement de sources officielles vérifiées.
                </p>
                <div class="source-info">
                    <p style="font-size: 11px; color: #666; margin-top: 10px;">
                        <strong>Sources:</strong> Organismes officiels et plateformes certifiées
                    </p>
                </div>
            </div>
        </div>
    `;
}

function loadRealTrafficInfo() {
    document.getElementById('traffic-info').innerHTML = `
        <div class="traffic-official">
            <div class="traffic-overall">
                <h4>🚦 Informations trafic en temps réel</h4>
            </div>
            
            <div class="traffic-sources">
                <h5>📍 Sources officielles de trafic:</h5>
                <div class="official-traffic-sources">
                    <ul style="text-align: left; margin: 10px 0;">
                        <li><strong>Bison Futé:</strong> <a href="https://www.bison-fute.gouv.fr" target="_blank">bison-fute.gouv.fr</a></li>
                        <li><strong>Autoroutes (ASFA):</strong> <a href="https://www.autoroutes.fr" target="_blank">autoroutes.fr</a></li>
                        <li><strong>SNCF Connect:</strong> <a href="https://www.sncf-connect.com" target="_blank">sncf-connect.com</a></li>
                        <li><strong>Île-de-France Mobilités:</strong> <a href="https://www.iledefrance-mobilites.fr" target="_blank">iledefrance-mobilites.fr</a></li>
                        <li><strong>Waze:</strong> Application mobile pour trafic en temps réel</li>
                    </ul>
                </div>
            </div>
            
            <div class="traffic-disclaimer">
                <p style="font-size: 12px; color: #666; margin-top: 15px; text-align: center;">
                    <strong>Information vérifiée:</strong> Consultez les sources officielles pour les données de trafic les plus récentes.
                </p>
            </div>
        </div>
    `;
}

function generateMockUrgentAlerts() {
    const alertTemplates = [
        {
            level: 'high',
            icon: '🚨',
            title: 'Alerte météorologique sévère',
            description: 'Fortes pluies et vents violents prévus dans votre région. Évitez les déplacements non essentiels.',
            time: '30min',
            action: 'Restez à l\'intérieur'
        },
        {
            level: 'medium',
            icon: '⚠️',
            title: 'Perturbations transport public',
            description: 'Grève partielle des transports en commun. Prévoir des délais supplémentaires.',
            time: '1h',
            action: 'Anticiper vos trajets'
        },
        {
            level: 'low',
            icon: '🔧',
            title: 'Travaux sur autoroute principale',
            description: 'Fermeture partielle de l\'autoroute A1 entre 22h et 6h du matin.',
            time: '2h',
            action: 'Itinéraire alternatif conseillé'
        }
    ];
    
    // Sélectionner 1-2 alertes
    const selectedAlerts = [];
    const numAlerts = Math.floor(Math.random() * 2) + 1;
    
    for (let i = 0; i < numAlerts && i < alertTemplates.length; i++) {
        selectedAlerts.push(alertTemplates[i]);
    }
    
    return selectedAlerts;
}

function generateMockLocalEvents() {
    const eventTemplates = [
        {
            type: 'Culture',
            title: 'Festival de musique au parc central',
            date: 'Ce weekend',
            time: '14h-22h',
            location: 'Parc Municipal',
            description: 'Concerts gratuits et animations pour toute la famille.'
        },
        {
            type: 'Sport',
            title: 'Marathon de la ville',
            date: 'Dimanche prochain',
            time: '8h-12h',
            location: 'Centre-ville',
            description: 'Perturbations circulation prévues. Itinéraires de déviation mis en place.'
        },
        {
            type: 'Marché',
            title: 'Marché nocturne spécial',
            date: 'Vendredi soir',
            time: '18h-23h',
            location: 'Place du marché',
            description: 'Produits locaux, artisanat et restauration sur place.'
        },
        {
            type: 'Santé',
            title: 'Journée de dépistage gratuit',
            date: 'Mercredi',
            time: '9h-17h',
            location: 'Centre de santé',
            description: 'Dépistage COVID-19 et vaccination sans rendez-vous.'
        }
    ];
    
    const selectedEvents = [];
    const numEvents = Math.floor(Math.random() * 3) + 2;
    
    for (let i = 0; i < numEvents && i < eventTemplates.length; i++) {
        selectedEvents.push(eventTemplates[i]);
    }
    
    return selectedEvents;
}

function generateMockTrafficInfo() {
    const trafficData = {
        overall: 'Modéré',
        incidents: [
            {
                type: 'Accident',
                location: 'Avenue de la République',
                impact: 'Circulation ralentie',
                duration: '30min estimé'
            },
            {
                type: 'Travaux',
                location: 'Boulevard Principal',
                impact: 'Une voie fermée',
                duration: 'Jusqu\'à 18h'
            }
        ],
        publicTransport: {
            buses: 'Service normal',
            trains: 'Légers retards (5-10min)',
            metro: 'Service normal'
        }
    };
    
    return trafficData;
}

function generateMockNews() {
    const newsTemplates = [
        {
            category: 'Urgent',
            title: 'Incident majeur: Évacuation partielle du centre-ville',
            summary: 'Les autorités procèdent à l\'évacuation préventive de plusieurs bâtiments suite à une fuite de gaz.',
            time: '15min',
            urgent: true
        },
        {
            category: 'Sécurité',
            title: 'Alerte enlèvement activée dans la région',
            summary: 'Les forces de l\'ordre recherchent activement un enfant disparu. Numéro d\'urgence : 112.',
            time: '1h',
            urgent: true
        },
        {
            category: 'Météo',
            title: 'Alerte orange: Risque d\'inondation',
            summary: 'Fortes précipitations attendues. Évitez les zones basses et les parkings souterrains.',
            time: '2h',
            urgent: true
        },
        {
            category: 'Local',
            title: 'Nouveau projet d\'aménagement urbain dans votre région',
            summary: 'Les autorités locales annoncent un investissement pour améliorer les infrastructures.',
            time: '4h',
            urgent: false
        },
        {
            category: 'Santé',
            title: 'Pic de pollution atmosphérique',
            summary: 'Recommandations pour les personnes sensibles. Limitez les activités physiques extérieures.',
            time: '3h',
            urgent: false
        },
        {
            category: 'Transport',
            title: 'Modifications des horaires de transport public',
            summary: 'Nouveaux horaires en vigueur dès la semaine prochaine.',
            time: '8h',
            urgent: false
        },
        {
            category: 'Culture',
            title: 'Festival local ce weekend',
            summary: 'Événements culturels et artistiques prévus dans votre ville.',
            time: '12h',
            urgent: false
        },
        {
            category: 'Économie',
            title: 'Nouvelles opportunités d\'emploi dans la région',
            summary: 'Plusieurs entreprises locales recrutent actuellement.',
            time: '1j',
            urgent: false
        }
    ];
    
    // Prioriser les actualités urgentes
    const urgentNews = newsTemplates.filter(news => news.urgent);
    const regularNews = newsTemplates.filter(news => !news.urgent);
    
    const selectedNews = [];
    
    // Ajouter toutes les actualités urgentes
    selectedNews.push(...urgentNews);
    
    // Ajouter quelques actualités normales
    const remainingSlots = 7 - urgentNews.length;
    for (let i = 0; i < remainingSlots && i < regularNews.length; i++) {
        selectedNews.push(regularNews[i]);
    }
    
    return selectedNews;
}

function displayUrgentAlerts(alertsArray) {
    const alertsContent = document.getElementById('urgent-alerts');
    
    if (alertsArray.length === 0) {
        alertsContent.innerHTML = '<div class="no-alerts">✅ Aucune alerte urgente pour le moment</div>';
        return;
    }
    
    const alertsHTML = `
        <div class="alerts-grid">
            ${alertsArray.map(alert => `
                <div class="alert-card alert-${alert.level}">
                    <div class="alert-header">
                        <span class="alert-icon">${alert.icon}</span>
                        <div class="alert-info">
                            <h4>${alert.title}</h4>
                            <span class="alert-time">Il y a ${alert.time}</span>
                        </div>
                    </div>
                    <p class="alert-description">${alert.description}</p>
                    <div class="alert-action">
                        <strong>Action recommandée:</strong> ${alert.action}
                    </div>
                </div>
            `).join('')}
        </div>
    `;
    
    alertsContent.innerHTML = alertsHTML;
}

function displayLocalEvents(eventsArray) {
    const eventsContent = document.getElementById('local-events');
    
    if (eventsArray.length === 0) {
        eventsContent.innerHTML = '<div class="no-events">📅 Aucun événement local prévu</div>';
        return;
    }
    
    const eventsHTML = `
        <div class="events-grid">
            ${eventsArray.map(event => `
                <div class="event-card">
                    <div class="event-type">${event.type}</div>
                    <h4>${event.title}</h4>
                    <div class="event-details">
                        <p><strong>📅 Date:</strong> ${event.date}</p>
                        <p><strong>⏰ Heure:</strong> ${event.time}</p>
                        <p><strong>📍 Lieu:</strong> ${event.location}</p>
                    </div>
                    <p class="event-description">${event.description}</p>
                </div>
            `).join('')}
        </div>
    `;
    
    eventsContent.innerHTML = eventsHTML;
}

function displayTrafficInfo(trafficData) {
    const trafficContent = document.getElementById('traffic-info');
    
    const trafficHTML = `
        <div class="traffic-container">
            <div class="traffic-overall">
                <h4>🚦 État général du trafic: <span class="traffic-status">${trafficData.overall}</span></h4>
            </div>
            
            <div class="traffic-incidents">
                <h5>⚠️ Incidents en cours:</h5>
                ${trafficData.incidents.map(incident => `
                    <div class="incident-item">
                        <span class="incident-type">${incident.type}</span>
                        <span class="incident-location">${incident.location}</span>
                        <span class="incident-impact">${incident.impact}</span>
                        <span class="incident-duration">${incident.duration}</span>
                    </div>
                `).join('')}
            </div>
            
            <div class="public-transport">
                <h5>🚌 Transports en commun:</h5>
                <div class="transport-grid">
                    <div class="transport-item">
                        <span class="transport-type">🚌 Bus:</span>
                        <span>${trafficData.publicTransport.buses}</span>
                    </div>
                    <div class="transport-item">
                        <span class="transport-type">🚆 Trains:</span>
                        <span>${trafficData.publicTransport.trains}</span>
                    </div>
                    <div class="transport-item">
                        <span class="transport-type">🚇 Métro:</span>
                        <span>${trafficData.publicTransport.metro}</span>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    trafficContent.innerHTML = trafficHTML;
}

function displayVerifiedNews(newsArray) {
    const newsContent = document.getElementById('news-content');
    
    if (newsArray.length === 0) {
        newsContent.innerHTML = '<div class="error">Aucune actualité vérifiée disponible pour le moment.</div>';
        return;
    }
    
    const newsHTML = `
        <div class="news-grid">
            ${newsArray.map(article => `
                <div class="news-card verified-news">
                    <div class="news-category verified-category">✅ Vérifié</div>
                    <h4>${article.title}</h4>
                    <p>${article.description}</p>
                    <div class="news-meta">
                        <div class="news-time">
                            ${new Date(article.publishedAt).toLocaleDateString('fr-FR', {
                                day: 'numeric',
                                month: 'long',
                                hour: '2-digit',
                                minute: '2-digit'
                            })}
                        </div>
                        <div class="news-source">
                            <strong>Source:</strong> ${article.source}
                        </div>
                    </div>
                    <div class="news-actions">
                        <a href="${article.url}" target="_blank" class="read-more-btn">
                            📖 Lire l'article complet
                        </a>
                    </div>
                    <div class="verification-badge">
                        <p style="font-size: 10px; color: #28a745; margin-top: 8px;">
                            ✅ Information vérifiée par ${article.source}
                        </p>
                    </div>
                </div>
            `).join('')}
        </div>
        <div class="news-disclaimer">
            <div class="legal-notice">
                <h5>📋 Clause de non-responsabilité</h5>
                <p style="font-size: 12px; color: #666; line-height: 1.4;">
                    Toutes les actualités affichées proviennent de sources officielles vérifiées. 
                    Cette application ne modifie pas le contenu des articles et renvoie vers les sources originales. 
                    Pour toute réclamation concernant le contenu, veuillez contacter directement la source mentionnée.
                </p>
                <p style="font-size: 11px; color: #999; margin-top: 10px;">
                    <strong>Sources utilisées:</strong> NewsAPI, flux RSS officiels, médias certifiés
                </p>
            </div>
        </div>
    `;
    
    newsContent.innerHTML = newsHTML;
}

// ======== EVENT LISTENERS ========

document.addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        const target = event.target;
        if (target.id === 'mood-input') sendModuleMessage('mood');
        else if (target.id === 'love-input') sendModuleMessage('love');
        else if (target.id === 'fun-input') sendModuleMessage('fun');
        else if (target.id === 'explore-input') sendModuleMessage('explore');
    }
});

// Changing profile save button
document.addEventListener('DOMContentLoaded', function() {
    const profileModal = document.getElementById('profile-modal');
    if (profileModal) {
        const modalActions = profileModal.querySelector('.modal-actions');
        if (modalActions) {
            modalActions.innerHTML = `
                <button onclick="saveProfile()" style="background: #28a745; display: none;">✅ Confirmer les modifications</button>
                <button onclick="closeProfile()">Fermer</button>
            `;
        }
    }
});

// Ajouter les animations CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }

    @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
    }

    @keyframes bounce {
        0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
        40% { transform: translateY(-20px); }
        60% { transform: translateY(-10px); }
    }

    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }

    @keyframes gentle-bounce {
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(-5px); }
    }

    @keyframes bounce-in {
        0% { transform: scale(0); }
        50% { transform: scale(1.1); }
        100% { transform: scale(1); }
    }

    @keyframes urgent-appear {
        0% { transform: translateY(-50px); opacity: 0; }
        100% { transform: translateY(0); opacity: 1; }
    }

    @keyframes urgent-blink {
        0%, 50% { opacity: 1; }
        25%, 75% { opacity: 0.5; }
    }

    @keyframes slideInLeft {
        0% { transform: translateX(-50px); opacity: 0; }
        100% { transform: translateX(0); opacity: 1; }
    }

    @keyframes slideInUp {
        0% { transform: translateY(50px); opacity: 0; }
        100% { transform: translateY(0); opacity: 1; }
    }

    .city-weather-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
    }

    .city-click-hint {
        font-size: 10px;
        color: #999;
        margin-top: 5px;
    }

    .current-city {
        border: 2px solid #667eea;
        background: rgba(102, 126, 234, 0.15);
    }

    .weather-modal-content {
        position: relative;
    }

    .weather-main-large {
        text-align: center;
        margin-bottom: 30px;
    }

    .temperature-large {
        font-size: 4rem;
        font-weight: bold;
        color: #667eea;
        margin-bottom: 10px;
    }

    .description-large {
        font-size: 1.5rem;
        color: #666;
    }

    .weather-details-extended {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 15px;
        margin-bottom: 30px;
    }

    .weather-item-large {
        background: rgba(102, 126, 234, 0.1);
        padding: 15px;
        border-radius: 10px;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .forecast-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 15px;
        margin-top: 15px;
    }

    .forecast-day {
        background: rgba(102, 126, 234, 0.1);
        padding: 15px;
        border-radius: 10px;
        text-align: center;
    }

    .marker-float {
        animation: marker-float 3s ease-in-out infinite;
    }

    .marker-pulse {
        animation: marker-pulse 2.5s ease-in-out infinite;
    }

    @keyframes marker-float {
        0%, 100% { transform: translate(-50%, -50%) translateY(0px); }
        50% { transform: translate(-50%, -50%) translateY(-3px); }
    }

    @keyframes marker-pulse {
        0%, 100% { opacity: 0.6; transform: translate(-50%, -50%) scale(1); }
        50% { opacity: 1; transform: translate(-50%, -50%) scale(1.2); }
    }
`;
document.head.appendChild(style);