// 1️⃣ Initialisation de Supabase
import { supabase, setAgenceSession } from './sp.js';
import { initializeAudit } from './audit.js';

// --- FONCTIONS DE SÉCURITÉ ET NETTOYAGE ---

function denyPage(message = "🚫 Accès refusé – Permission insuffisante") {
    document.body.innerHTML = `
        <div class="h-screen w-screen flex flex-col items-center justify-center bg-neutral-950 text-red-500 text-2xl font-bold p-4 text-center">
            <div>${message}</div>
            <a href="../" class="mt-6 text-sm text-neutral-500 underline uppercase tracking-widest">Retour au Terminal</a>
        </div>`;
    window.stop();
}

function hashText(element) {
    element.childNodes.forEach(node => {
        if (node.nodeType === Node.TEXT_NODE && node.nodeValue.trim() !== "") {
            node.nodeValue = node.nodeValue.replace(/[a-zA-Z0-9]/g, "#");
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            hashText(node);
        }
    });
}

function sanitizeElement(element) {
    const forbidden = ['src', 'href', 'title', 'info', 'onclick', 'alt'];
    forbidden.forEach(attr => element.removeAttribute(attr));
    Object.keys(element.dataset).forEach(key => delete element.dataset[key]);
    if (element.tagName === "A" || element.tagName === "BUTTON") {
        element.style.pointerEvents = "none";
        element.style.cursor = "default";
        if (element.tagName === "A") element.href = "javascript:void(0)";
    }
    element.querySelectorAll("*").forEach(child => sanitizeElement(child));
}

async function getHash(string) {
    const utf8 = new TextEncoder().encode(string.toLowerCase().trim());
    const hashBuffer = await crypto.subtle.digest('SHA-256', utf8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// --- LOGIQUE DE VÉRIFICATION PRINCIPALE ---

async function initializeSecurity() {
    const token = sessionStorage.getItem('session_token');
    const isAuth = sessionStorage.getItem('isAuth');

    // 1. Check session locale
    if (!isAuth || !token) {
        window.location.href = "https://howardarmory-ee.vercel.app/HA-EE/src/err/oauth";
        return;
    }

    try {
        // 2. Identification via Hash (sans filtre agence — l'id n'est pas encore connu)
        const { data: employes, error: empError } = await supabase.from('employes').select('*');
        
        if (empError) {
            console.warn("📡 Liaison Supabase instable, mode dégradé activé.");
            return;
        }

        let currentUser = null;
        for (const emp of employes) {
            if (await getHash(emp.email) === token) {
                currentUser = emp;
                break;
            }
        }

        if (!currentUser) {
            sessionStorage.clear();
            return denyPage("🚫 Empreinte numérique non reconnue.");
        }

        // Persistance id_agence + email pour le filtrage multi-tenant
        const userAgenceInit = currentUser.id_agence || null;
        setAgenceSession(userAgenceInit, currentUser.email);

        // 3. Vérification des permissions de l'utilisateur (Table perms)
        const { data: permsData } = await supabase
            .from('acces.perms.key')
            .select('*')
            .eq('email', currentUser.email)
            .single();

        if (permsData) {
            if (permsData.type === 'unauthorized') return denyPage("🚫 Accès révoqué par la direction.");
            if (permsData.type === 'attente') return denyPage("⌛ Accès en cours de validation.");
            
            const userPerms = permsData.perms ? permsData.perms.split(";").map(p => p.trim()) : [];

/// ---------------------------------------------------------
// 🆕 ENCORE PLUS NOUVEAU : VÉRIFICATION MULTI-AGENCE (URL + ID AGENCE)
// ---------------------------------------------------------
const currentPath = window.location.pathname; 
const userAgence = permsData.id_agence || currentUser.id_agence;
setAgenceSession(userAgence, currentUser.email);

if (!userAgence) {
    console.error("🚨 Impossible de valider la page : L'utilisateur n'est rattaché à aucune agence.");
    return denyPage("🚫 Erreur de configuration de votre compte agence.");
}

// On cherche si cette page a des restrictions SPÉCIFIQUES à l'agence de l'utilisateur
const { data: pageRules, error: rulesErr } = await supabase
    .from('pages_rules') 
    .select('required_perms')
    .ilike('url_path', `%${currentPath}%`) 
    .eq('id_agence', userAgence) // 🎯 ICI : On cible uniquement la ligne qui appartient à SON entreprise
    .maybeSingle(); 

// Si une erreur survient (problème réseau ou requête SQL invalide)
if (rulesErr) {
    console.error("🚨 Erreur lors de la récupération des règles de la page:", rulesErr);
}

// Si la page est configurée pour CETTE agence et possède des restrictions
if (pageRules && pageRules.required_perms) {
    const required = pageRules.required_perms.split(";").map(p => p.trim());
    
    // Si l'utilisateur n'a AUCUNE des permissions requises configurées par son agence
    if (!required.some(r => userPerms.includes(r))) {
        return denyPage("🚫 Accréditation insuffisante pour cette zone.");
    }
}

// ---------------------------------------------------------

            // Si la page est autorisée, on applique le floutage sur les éléments restreints du DOM
            applyDOMRestrictions(userPerms);
            console.log("✅ Système Howard Armory opérationnel pour:", currentUser.email);
            initializeAudit();
            
        } else {
            // Création automatique si fiche manquante
            await supabase.from('acces.perms.key').insert([{ email: currentUser.email, perms: '', type: 'attente' }]);
            denyPage("⌛ Inscription au registre de sécurité en cours...");
        }

    } catch (err) {
        console.error("🚨 Échec critique du système de sécurité:", err);
    }
}

function applyDOMRestrictions(userPerms) {
    // On ne cherche plus que les éléments avec l'attribut "perms" (floutage partiel)
    const elements = document.querySelectorAll("[perms]");

    elements.forEach(element => {
        const req = element.getAttribute("perms").split(";").map(p => p.trim());
        if (!req.some(r => userPerms.includes(r))) {
            element.style.filter = "blur(7px)";
            element.style.pointerEvents = "none";
            element.style.userSelect = "none";
            hashText(element);
            sanitizeElement(element);
        }
    });
}

