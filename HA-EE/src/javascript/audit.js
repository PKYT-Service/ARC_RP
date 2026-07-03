import { insertAgence } from './sp.js';

export async function logSystemAction(action, details = "") {
    // 1. Récupération de l'email via le stockage de session (défini par systeme.js)
    const email = sessionStorage.getItem('user_email') || "ANONYME";
    const page = document.title || window.location.pathname;
    
    try {
        await insertAgence('system_audit', [{
            email: email,
            action: action.toUpperCase(),
            page: page,
            details: details
        }]);
    } catch (err) {
        console.warn("Audit system failed to log action:", err);
    }
}

export function initializeAudit() {
    // 1. Log page visit
    logSystemAction("VISITE", `Navigateur: ${navigator.userAgent}`);

    // 2. Click tracking
    document.addEventListener("click", (e) => {
        const target = e.target.closest("button, a, input[type='submit']");
        if (target) {
            const label = target.innerText || target.value || target.id || target.className || "Inconnu";
            logSystemAction("CLIC", `Élément: ${label.trim()}`);
        }
    });

    // 3. Form submission tracking
    document.addEventListener("submit", (e) => {
        const formId = e.target.id || "Sans ID";
        logSystemAction("SOUMISSION", `Formulaire: ${formId}`);
    });
}
