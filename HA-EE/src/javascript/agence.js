import { supabase } from './sp.js';

/** Tables sans filtre id_agence (référentiels globaux). */
export const NO_AGENCE_FILTER = new Set([
    'agence_liste',
    'acces.perms.key',
]);

/** Tables métier filtrées par id_agence. */
export const AGENCE_TABLES = new Set([
    'employes',
    'employe_categories',
    'assurance_sante',
    'primes_exceptionnelles',
    'html_includes',
    'inf_rh',
    'inf_rh_rapports',
    'inf_documents',
    'hdp',
    'tableur_pages',
    'tableur_cells',
    'tableur_perms',
    'ha_stories',
    'stories',
    'news',
    'faq',
    'contrats',
    'clients',
    'ha_candidatures',
    'modeles_personnels',
    'modeles_contrats',
    'system_audit',
    'weapons',
    'armes',
    'calendrier',
    'calendrier_events',
    'declarations_sas',
    'primes',
    'remunerations',
    'fiches_paie',
    'certifications_sr',
    'credits',
    'drive_files',
    'drive_shares',
]);

export function getIdAgence() {
    return sessionStorage.getItem('id_agence') || null;
}

export function setAgenceSession(idAgence, email = null) {
    if (idAgence) sessionStorage.setItem('id_agence', String(idAgence));
    if (email) sessionStorage.setItem('user_email', email);
}

export function withAgence(data) {
    const id = getIdAgence();
    if (!id || data == null) return data;

    if (Array.isArray(data)) {
        return data.map((row) => withAgence(row));
    }

    if (typeof data === 'object') {
        return { ...data, id_agence: data.id_agence ?? id };
    }

    return data;
}

function shouldFilter(table) {
    if (NO_AGENCE_FILTER.has(table)) return false;
    if (AGENCE_TABLES.has(table)) return true;
    // Par défaut, on filtre les tables inconnues (multi-tenant).
    return true;
}

/** Requête SELECT / UPDATE / DELETE scopée à l'agence de l'utilisateur. */
export function fromAgence(table) {
    const id = getIdAgence();
    const filterActive = id && shouldFilter(table);

    return {
        select(...args) {
            const req = supabase.from(table).select(...args);
            return filterActive ? req.eq('id_agence', id) : req;
        },
        update(...args) {
            const req = supabase.from(table).update(...args);
            return filterActive ? req.eq('id_agence', id) : req;
        },
        delete(...args) {
            const req = supabase.from(table).delete(...args);
            return filterActive ? req.eq('id_agence', id) : req;
        }
    };
}

/** INSERT avec id_agence injecté automatiquement. */
export function insertAgence(table, records) {
    return supabase.from(table).insert(withAgence(records));
}

export async function hashEmail(string) {
    const utf8 = new TextEncoder().encode(String(string).toLowerCase().trim());
    const hashBuffer = await crypto.subtle.digest('SHA-256', utf8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** Résout l'utilisateur courant et initialise la session agence. */
export async function resolveUserAgence() {
    const token = sessionStorage.getItem('session_token');
    const isAuth = sessionStorage.getItem('isAuth');
    if (!isAuth || !token) return null;

    const cached = getIdAgence();
    const cachedEmail = sessionStorage.getItem('user_email');
    if (cached && cachedEmail) {
        return { id_agence: cached, email: cachedEmail };
    }

    const { data: employes, error } = await supabase.from('employes').select('email, id_agence, nom, prenom');
    if (error || !employes) return null;

    for (const emp of employes) {
        if (await hashEmail(emp.email) === token) {
            const { data: permsData } = await supabase
                .from('acces.perms.key')
                .select('id_agence')
                .eq('email', emp.email)
                .maybeSingle();

            const idAgence = permsData?.id_agence || emp.id_agence;
            if (idAgence) setAgenceSession(idAgence, emp.email);
            return { ...emp, id_agence: idAgence };
        }
    }

    return null;
}
