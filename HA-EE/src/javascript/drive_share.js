// share.js - Système de partage pour Drive
// Fonctions globales exposées pour les onclick handlers

let shareTargetPath = null;
let shareTargetType = null;
let shareTargetName = null;

// Ouvrir le modal de partage
window.openShareModal = function (type, name, folder) {
    const modal = document.getElementById('share-modal');
    const itemNameEl = document.getElementById('share-item-name');
    const linkContainer = document.getElementById('share-link-container');
    const generateBtn = document.getElementById('share-generate-btn');

    shareTargetType = type;
    shareTargetName = name;

    // Build path
    const basePath = window.driveAPI.BASE_PATH;
    shareTargetPath = folder ? `${basePath}/${folder}/${name}` : `${basePath}/${name}`;

    itemNameEl.textContent = name;
    linkContainer.classList.add('hidden');
    generateBtn.disabled = false;

    // Reset form
    document.querySelector('input[name="share-access"][value="guest"]').checked = true;
    document.getElementById('share-expires').value = '';

    modal.classList.remove('hidden');
};

// Fermer le modal de partage
window.closeShareModal = function () {
    document.getElementById('share-modal').classList.add('hidden');
};

// Générer le lien de partage
window.generateShareLink = async function () {
    const driveAPI = window.driveAPI;
    const accessType = document.querySelector('input[name="share-access"]:checked').value;
    const expiresSelect = document.getElementById('share-expires');
    const expiresDays = expiresSelect.value ? parseInt(expiresSelect.value) : null;
    const generateBtn = document.getElementById('share-generate-btn');

    try {
        generateBtn.disabled = true;
        generateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Génération...';

        console.log('📤 Creating share for:', shareTargetPath);
        console.log('  Type:', shareTargetType);
        console.log('  Access:', accessType);
        console.log('  Expires:', expiresDays);

        // Créer le partage dans la DB
        const { data, error } = await driveAPI.supabase
            .rpc('create_share', {
                p_path: shareTargetPath,
                p_share_type: shareTargetType,
                p_shared_by: driveAPI.currentUser?.email || null,
                p_require_auth: accessType === 'auth',
                p_expires_days: expiresDays
            });

        if (error) {
            console.error('Share creation error:', error);
            throw error;
        }

        const shareId = data[0].new_share_id;
        const accessCode = data[0].new_access_code;

        console.log('✅ Share created:', { shareId, accessCode });

        // Construire l'URL de partage
        const baseUrl = window.location.origin + window.location.pathname;
        const shareUrl = accessType === 'guest'
            ? `${baseUrl}?share=${shareId}&code=${accessCode}`
            : `${baseUrl}?share=${shareId}`;

        // Afficher le lien
        const linkInput = document.getElementById('share-link-input');
        const linkContainer = document.getElementById('share-link-container');

        linkInput.value = shareUrl;
        linkContainer.classList.remove('hidden');
        generateBtn.textContent = '✅ Lien généré';

    } catch (e) {
        console.error('Share error:', e);
        alert('❌ Erreur lors de la création du partage: ' + e.message);
        generateBtn.disabled = false;
        generateBtn.textContent = 'Générer le lien';
    }
};

// Copier le lien de partage
window.copyShareLink = function () {
    const linkInput = document.getElementById('share-link-input');
    linkInput.select();
    document.execCommand('copy');

    // Feedback visuel
    const copyBtn = event.target.closest('button');
    const originalHTML = copyBtn.innerHTML;
    copyBtn.innerHTML = '<i class="fas fa-check"></i>';
    setTimeout(() => {
        copyBtn.innerHTML = originalHTML;
    }, 2000);
};

// Valider et charger un partage depuis l'URL
window.handleShareFromURL = async function () {
    const params = new URLSearchParams(window.location.search);
    const shareId = params.get('share');
    const accessCode = params.get('code');

    if (!shareId) return false;

    const api = window.driveAPI;

    try {
        console.log('🔗 Loading share:', shareId, 'with code:', accessCode);

        // Récupérer les infos du partage
        let query = api.fromAgence('drive_shares')
            .select('*')
            .eq('id', shareId)
            .maybeSingle();

        const { data: share, error } = await query;

        if (error || !share) {
            alert('❌ Lien de partage invalide ou expiré');
            return false;
        }

        // Vérifier l'expiration
        if (share.expires_at && new Date(share.expires_at) < new Date()) {
            alert('⏰ Ce lien de partage a expiré');
            return false;
        }

        // Vérifier l'accès
        const isAuthUser = !!api.currentUser;

        if (share.require_auth) {
            if (!isAuthUser) {
                alert('🔐 Vous devez être authentifié pour accéder à ce partage');
                return false;
            }
            // If authenticated and share requires auth, we don't necessarily need the access code
            console.log('🔓 Authenticated user accessing auth-required share');
        } else if (share.access_code) {
            // Guest share with code
            if (share.access_code !== accessCode) {
                alert('🔑 Code d\'accès invalide');
                return false;
            }
        }


        console.log('✅ Share validated:', share);
        window.driveAPI.activeShare = share; // Activer le bypass pour les permissions
        const fullPath = share.path;
        let relativePath = fullPath;

        // Calculer le chemin relatif par rapport à BASE_PATH
        if (fullPath.startsWith(api.BASE_PATH + '/')) {
            relativePath = fullPath.substring(api.BASE_PATH.length + 1);
        } else if (fullPath === api.BASE_PATH) {
            relativePath = '';
        }

        // Ouvrir le fichier/dossier partagé
        if (share.share_type === 'file') {
            const pathParts = relativePath.split('/');
            const fileName = pathParts.pop();
            const folder = pathParts.join('/') || null;

            console.log('📂 Navigating to folder:', folder, 'to open file:', fileName);
            await api.openFolder(folder);
            await api.openFile(folder, { name: fileName });
        } else {
            // Naviguer vers le dossier
            const folder = relativePath;
            console.log('📂 Navigating to shared folder:', folder);
            await api.openFolder(folder || null);
        }

        return true;

    } catch (e) {
        console.error('Share load error:', e);
        alert('❌ Erreur lors du chargement du partage');
        return false;
    }
};
