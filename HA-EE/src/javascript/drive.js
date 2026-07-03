import { supabase, fromAgence, insertAgence, withAgence } from './sp.js';

document.addEventListener("DOMContentLoaded", async () => {
    // === CONFIGURATION ===
    let BASE_PATH = null;
    const OWNER = "PKYT-Service";
    const REPO = "database_dev";
    const BRANCH = "main";
    let TOKEN = null;
    let currentUser = null;

    // === DOM ELEMENTS ===
    const contentUl = document.getElementById("content-ul");
    const currentFolderName = document.getElementById("current-folder-name");
    const btnBackFolder = document.getElementById("btn-back-folder");
    const btnCreateFolder = document.getElementById("btn-create-folder");
    const btnCreateFile = document.getElementById("btn-create-file");
    const btnImport = document.getElementById("btn-import");
    const fileInput = document.getElementById("file-input");

    const userFullNameEl = document.getElementById('user_full_name');
    const userAvatarEl = document.getElementById('user_avatar');

    // === STATE ===
    let filesByFolder = {};
    let foldersByFolder = {};
    let currentFolder = null; // null = root
    let hasAdminPerm = false; // User has perm '2'?
    let customPerms = []; // Custom permissions for modal

    // === WINDOW MANAGER ===
    const windows = [];
    let zIndexCounter = 1000;

    class FileWindow {
        constructor(file, folder, content, canEdit = false) {
            this.file = file;
            this.folder = folder;
            this.content = content;
            this.originalContent = content;
            this.canEdit = canEdit;
            this.isEditing = false;
            this.id = `win-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            this.element = null;
            this.isDragging = false;
            this.dragOffset = { x: 0, y: 0 };

            this.create();
        }

        create() {
            const win = document.createElement('div');
            const isMobile = window.innerWidth < 768;
            win.id = this.id;
            win.className = 'file-window';

            if (isMobile) {
                win.style.cssText = `
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgb(23, 23, 23);
                    z-index: ${++zIndexCounter};
                    overflow: hidden;
                    display: flex;
                    flex-direction: column;
                `;
            } else {
                win.style.cssText = `
                    position: fixed;
                    top: ${100 + windows.length * 30}px;
                    left: ${400 + windows.length * 30}px;
                    width: 900px;
                    height: 600px;
                    background: rgb(23, 23, 23);
                    border: 1px solid rgb(64, 64, 64);
                    border-radius: 8px;
                    box-shadow: 0 10px 40px rgba(0,0,0,0.5);
                    z-index: ${++zIndexCounter};
                    overflow: hidden;
                    display: flex;
                    flex-direction: column;
                `;
            }

            // Header
            const header = document.createElement('div');
            header.className = 'window-header';
            header.style.cssText = `
                background: rgb(10,10,10);
                padding: 12px 16px;
                border-bottom: 1px solid rgb(64,64,64);
                display: flex;
                justify-content: space-between;
                align-items: center;
                cursor: move;
                user-select: none;
            `;

            header.innerHTML = `
                <div style="display: flex; align-items: center; gap: 8px;">
                    <i class="fas fa-file-alt" style="color: #9ca3af;"></i>
                    <span style="font-weight: 600; color: white;">${this.file.name.replace(/\.md$/i, '')}</span>
                    ${this.canEdit ? '<span style="color: #10b981; font-size: 11px; margin-left: 8px;">ÉDITABLE</span>' : '<span style="color: #6b7280; font-size: 11px; margin-left: 8px;">LECTURE SEULE</span>'}
                </div>
                <div style="display: flex; gap: 8px;">
                    ${this.canEdit ? `
                        <button class="win-btn-toggle" style="color: #3b82f6; background: transparent; border: none; cursor: pointer; padding: 4px 8px; border-radius: 4px; transition: background 0.2s;">
                            <i class="fas fa-edit"></i> Éditer
                        </button>
                        <button class="win-btn-save hidden" style="color: #10b981; background: transparent; border: none; cursor: pointer; padding: 4px 8px; border-radius: 4px; transition: background 0.2s;">
                            <i class="fas fa-save"></i> Sauvegarder
                        </button>
                    ` : ''}
                    <button class="win-btn-close" style="color: #ef4444; background: transparent; border: none; cursor: pointer; padding: 4px 8px; border-radius: 4px; transition: background 0.2s;">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `;

            // Content container
            const contentContainer = document.createElement('div');
            contentContainer.className = 'window-content-container';
            contentContainer.style.cssText = `
                flex: 1;
                overflow: hidden;
                display: flex;
                position: relative;
            `;

            // Editor (hidden by default)
            const editorEl = document.createElement('textarea');
            editorEl.className = 'window-editor dark-scrollbar';
            editorEl.style.cssText = `
                flex: 1;
                padding: 24px;
                background: rgb(10, 10, 10);
                color: rgb(229, 231, 235);
                border: none;
                border-right: 1px solid rgb(64, 64, 64);
                resize: none;
                font-family: 'Courier New', monospace;
                font-size: 14px;
                line-height: 1.6;
                outline: none;
                display: none;
            `;
            editorEl.value = this.content;

            // Preview (always visible)
            const previewEl = document.createElement('div');
            previewEl.className = 'window-preview dark-scrollbar';
            previewEl.style.cssText = `
                flex: 1;
                overflow-y: auto;
                padding: 0;
                background: rgb(23, 23, 23);
                color: rgb(229, 231, 235);
                display: flex;
                flex-direction: column;
            `;

            const isHtml = this.file.name.toLowerCase().endsWith('.html');
            const isPdf = this.file.name.toLowerCase().endsWith('.pdf');
            const isImage = [".png", ".jpg", ".jpeg", ".gif", ".webp"].some(ext => this.file.name.toLowerCase().endsWith(ext));

            if (isHtml) {
                const iframe = document.createElement('iframe');
                iframe.style.cssText = 'flex: 1; border: none; width: 100%; height: 100%; background: white;';
                iframe.srcdoc = this.content;
                previewEl.appendChild(iframe);
            } else if (isPdf) {
                const embed = document.createElement('embed');
                embed.style.cssText = 'flex: 1; border: none; width: 100%; height: 100%;';
                // Ajout de paramètres pour forcer l'affichage interne du navigateur
                embed.src = this.content + '#toolbar=0&navpanes=0&scrollbar=0&view=FitH';
                embed.type = 'application/pdf';
                previewEl.appendChild(embed);
            } else if (isImage) {
                const img = document.createElement('img');
                img.style.cssText = 'max-width: 100%; max-height: 100%; object-fit: contain; margin: auto;';
                img.src = this.content;
                previewEl.appendChild(img);
            } else {
                previewEl.style.padding = '24px';
                previewEl.innerHTML = customMarkdownRender(this.content);
            }

            if (this.canEdit) {
                editorEl.addEventListener('input', () => {
                    this.content = editorEl.value;
                    previewEl.innerHTML = customMarkdownRender(this.content);
                });
            }

            contentContainer.appendChild(editorEl);
            contentContainer.appendChild(previewEl);

            win.appendChild(header);
            win.appendChild(contentContainer);
            document.body.appendChild(win);

            this.element = win;
            this.editorEl = editorEl;
            this.previewEl = previewEl;

            // Event listeners
            header.addEventListener('mousedown', (e) => this.startDrag(e));
            header.querySelector('.win-btn-close').addEventListener('click', () => this.close());
            win.addEventListener('mousedown', () => this.focus());

            if (this.canEdit) {
                const toggleBtn = header.querySelector('.win-btn-toggle');
                const saveBtn = header.querySelector('.win-btn-save');

                toggleBtn.addEventListener('click', () => this.toggleEditMode());
                saveBtn.addEventListener('click', () => this.save());
            }

            windows.push(this);
            this.focus();
        }

        startDrag(e) {
            if (e.target.closest('.win-btn-close')) return;
            if (window.innerWidth < 768) return; // Disable drag on mobile

            this.isDragging = true;
            const rect = this.element.getBoundingClientRect();
            this.dragOffset = {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            };

            const onMouseMove = (e) => {
                if (!this.isDragging) return;
                this.element.style.left = `${e.clientX - this.dragOffset.x}px`;
                this.element.style.top = `${e.clientY - this.dragOffset.y}px`;
            };

            const onMouseUp = () => {
                this.isDragging = false;
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
            };

            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        }

        focus() {
            this.element.style.zIndex = ++zIndexCounter;
        }

        close() {
            if (this.content.startsWith('blob:')) {
                URL.revokeObjectURL(this.content);
            }
            this.element.remove();
            const index = windows.indexOf(this);
            if (index > -1) {
                windows.splice(index, 1);
            }
        }

        toggleEditMode() {
            this.isEditing = !this.isEditing;
            const toggleBtn = this.element.querySelector('.win-btn-toggle');
            const saveBtn = this.element.querySelector('.win-btn-save');

            if (this.isEditing) {
                this.editorEl.style.display = 'block';
                toggleBtn.innerHTML = '<i class="fas fa-eye"></i> Preview';
                saveBtn.classList.remove('hidden');
            } else {
                this.editorEl.style.display = 'none';
                toggleBtn.innerHTML = '<i class="fas fa-edit"></i> Éditer';
                saveBtn.classList.add('hidden');
            }
        }

        async save() {
            if (!this.canEdit) return;

            const path = this.folder === null ? `${BASE_PATH}/${this.file.name}` : `${BASE_PATH}/${this.folder}/${this.file.name}`;
            const isText = this.file.name.toLowerCase().endsWith('.md') || this.file.name.toLowerCase().endsWith('.html');

            try {
                console.log('💾 Saving file:', path);
                if (!isText) {
                    alert('❌ Edition non supportée pour ce type de fichier.');
                    return;
                }
                await createFile(path, this.content, `Update ${this.file.name}`);
                this.originalContent = this.content;
                alert('✅ Fichier sauvegardé !');
            } catch (e) {
                console.error('Save error:', e);
                alert('❌ Erreur lors de la sauvegarde: ' + e.message);
            }
        }
    }

    // === CUSTOM MARKDOWN RENDERER ===
    function customMarkdownRender(md) {
        if (!md) return "";

        const escapeHtml = (text) => {
            return text
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#039;");
        };

        function inlineReplacements(text) {
            text = text.replace(/`([^`\n]+)`/g, '<code class="bg-gray-100 dark:bg-gray-900 rounded px-1 font-mono text-sm">$1</code>');
            text = text.replace(/\*\*(.+?)\*\*/g, '<strong class="font-bold">$1</strong>');
            text = text.replace(/__(.+?)__/g, '<strong class="font-bold">$1</strong>');
            text = text.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em class="italic">$1</em>');
            text = text.replace(/(?<!_)_(?!_)(.+?)(?<!_)_(?!_)/g, '<em class="italic">$1</em>');
            text = text.replace(/~~(.+?)~~/g, '<s class="line-through">$1</s>');
            text = text.replace(/::(.*?)::/g, '<mark class="bg-yellow-200 dark:bg-yellow-500 dark:text-gray-900">$1</mark>');
            text = text.replace(/\$(.+?)\$/g, '<span class="font-mono bg-gray-200 dark:bg-gray-700 px-1 rounded">$1</span>');
            text = text.replace(/\[\^([^\]]+)\]/g, '<sup class="text-xs align-super text-blue-600">$1</sup>');
            text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" class="text-blue-600 underline hover:text-blue-800">$1</a>');
            text = text.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="max-w-full my-2 rounded shadow-md"/>');
            return text;
        }

        function generateTableHTML(rows) {
            if (rows.length < 3) return rows.join('<br>');
            const parseRow = (row) => row.replace(/^\||\ |$/g, '').split('|').map(c => c.trim());
            const headerRow = parseRow(rows[0]);
            const bodyRows = rows.slice(2);
            let html = '<div class="overflow-x-auto my-4 rounded-lg shadow border border-gray-700"><table class="min-w-full divide-y divide-gray-700 bg-gray-800 text-sm">';
            html += '<thead class="bg-gray-900"><tr>';
            headerRow.forEach(cell => {
                html += `<th class="px-4 py-3 text-left font-semibold text-gray-200 uppercase">${inlineReplacements(cell)}</th>`;
            });
            html += '</tr></thead><tbody class="divide-y divide-gray-700">';
            bodyRows.forEach(rowString => {
                if (!rowString.trim()) return;
                const cells = parseRow(rowString);
                html += '<tr class="hover:bg-gray-700">';
                cells.forEach(cell => {
                    html += `<td class="px-4 py-3 text-gray-300">${inlineReplacements(cell)}</td>`;
                });
                html += '</tr>';
            });
            html += '</tbody></table></div>';
            return html;
        }

        const lines = md.split(/\r?\n/);
        let htmlBuffer = "";
        let inCodeBlock = false;
        let inList = false;
        let listType = null;
        let listBuffer = [];

        function flushList() {
            if (!inList) return;
            htmlBuffer += `<${listType} class="pl-6 mb-4 list-${listType === "ul" ? "disc" : "decimal"}">`;
            listBuffer.forEach(item => htmlBuffer += `<li>${item}</li>`);
            htmlBuffer += `</${listType}>`;
            listBuffer = [];
            inList = false;
            listType = null;
        }

        for (let i = 0; i < lines.length; i++) {
            let line = lines[i];
            const trimmedLine = line.trim();

            if (/^```/.test(line)) {
                if (!inCodeBlock) {
                    flushList();
                    inCodeBlock = true;
                    htmlBuffer += '<pre class="bg-gray-900 text-gray-100 p-4 rounded mb-4 overflow-x-auto"><code>';
                } else {
                    inCodeBlock = false;
                    htmlBuffer += '</code></pre>';
                }
                continue;
            }
            if (inCodeBlock) {
                htmlBuffer += escapeHtml(line) + "\n";
                continue;
            }

            let headerMatch = line.match(/^(\#{1,6})\s+(.*)$/);
            if (headerMatch) {
                flushList();
                const level = headerMatch[1].length;
                const content = inlineReplacements(headerMatch[2]);
                const sizeClasses = ['text-4xl', 'text-3xl', 'text-2xl', 'text-xl', 'text-lg', 'text-base'];
                htmlBuffer += `<h${level} class="font-extrabold ${sizeClasses[level - 1]} mt-6 mb-2 text-gray-100">${content}</h${level}>`;
                continue;
            }

            if (/^(\*\s*){3,}$/.test(line) || /^(-\s*){3,}$/.test(line)) {
                flushList();
                htmlBuffer += '<hr class="my-6 border-gray-700">';
                continue;
            }

            if (trimmedLine.startsWith('|') && trimmedLine.includes('|', 1)) {
                let tableRows = [line];
                let separatorFound = false;
                let tempIndex = i + 1;
                while (tempIndex < lines.length) {
                    const nextLine = lines[tempIndex];
                    const trimmedNext = nextLine.trim();
                    if (trimmedNext === '') { tempIndex++; continue; }
                    if (/^\s*\|.*[:\-]+.*\|/i.test(trimmedNext) && !/[a-zA-Z]/.test(trimmedNext)) {
                        tableRows.push(nextLine);
                        separatorFound = true;
                        tempIndex++;
                        break;
                    }
                    break;
                }
                if (separatorFound) {
                    while (tempIndex < lines.length) {
                        const nextLine = lines[tempIndex];
                        const trimmedNext = nextLine.trim();
                        if (trimmedNext === '') { tempIndex++; continue; }
                        if (trimmedNext.startsWith('|') && trimmedNext.includes('|', 1)) {
                            tableRows.push(nextLine);
                            tempIndex++;
                            continue;
                        }
                        break;
                    }
                    if (tableRows.length > 2) {
                        flushList();
                        htmlBuffer += generateTableHTML(tableRows);
                        i = tempIndex - 1;
                        continue;
                    }
                }
            }

            let ulMatch = line.match(/^\s*([-*+])\s+(.*)$/);
            let olMatch = line.match(/^\s*(\d+)\.\s+(.*)$/);
            if (ulMatch || olMatch) {
                const match = ulMatch || olMatch;
                const type = ulMatch ? "ul" : "ol";
                const content = inlineReplacements(match[2].trim());
                if (!inList) {
                    inList = true;
                    listType = type;
                    listBuffer.push(content);
                } else if (listType === type) {
                    listBuffer.push(content);
                } else {
                    flushList();
                    inList = true;
                    listType = type;
                    listBuffer.push(content);
                }
                const nextLine = lines[i + 1] || '';
                const continuesList = (type === "ul" && /^\s*([-*+])\s+/.test(nextLine)) ||
                    (type === "ol" && /^\s*\d+\.\s+/.test(nextLine));
                if (i + 1 >= lines.length || (!continuesList && nextLine.trim() !== '')) {
                    flushList();
                }
                continue;
            }
            flushList();

            if (/^\s*$/.test(line)) {
                if (i > 0 && !/^\s*$/.test(lines[i - 1])) {
                    htmlBuffer += '<br>';
                }
                continue;
            }

            const inline = inlineReplacements(line.trim());
            htmlBuffer += `<p class="mb-2 leading-relaxed text-gray-100">${inline}</p>`;
        }
        return `<div class="prose prose-invert max-w-none">${htmlBuffer}</div>`;
    }

    // === DATABASE SYNC & PERMISSIONS ===

    // Vérifier l'accès GLOBAL au Drive (table existante acces.perms.key)
    async function checkGlobalAccess() {
        if (!currentUser) {
            return { allowed: false, reason: 'not_authenticated' };
        }

        try {
            const { data, error } = await supabase
                .from('acces.perms.key')
                .select('*')
                .eq('email', currentUser.email)
                .eq('type', 'accepter')
                .maybeSingle();

            if (!data) {
                console.warn('🚫 User not in ACL or type != accepter');
                return { allowed: false, reason: 'no_global_access' };
            }

            console.log('✅ Global access granted:', data.perms);
            // Check if user has admin perm (2)
            const perms = (data.perms || '').split(';');
            hasAdminPerm = perms.includes('2');
            return { allowed: true, globalPerms: data.perms };
        } catch (err) {
            console.error('Global access check error:', err);
            return { allowed: false, reason: 'error' };
        }
    }
    async function syncFileToDb(filePath, fileName, isFolder = false) {
        try {
            // Vérifier si le fichier existe déjà
            const { data, error } = await fromAgence('drive_files')
                .select('*')
                .eq('path', filePath)
                .maybeSingle();

            if (!data) {
                console.log(`📝 Auto-registering ${isFolder ? 'folder' : 'file'}:`, filePath);
                const { error: insertError } = await insertAgence('drive_files', [{
                        path: filePath,
                        name: fileName,
                        owner_email: currentUser?.email || null,
                        permissions: '1' // Lecture par défaut
                    }]);

                if (insertError) {
                    console.error('Auto-register error:', insertError);
                }
            }
        } catch (err) {
            console.error('Sync error:', err);
        }
    }

    async function checkFilePermission(filePath, isFolder = false) {
        try {
            // 0. VÉRIFIER SI UN PARTAGE EST ACTIF POUR CE CHEMIN
            const activeShare = window.driveAPI?.activeShare;
            if (activeShare) {
                const isMatch = activeShare.share_type === 'file'
                    ? filePath === activeShare.path
                    : filePath.startsWith(activeShare.path);

                // Autoriser aussi l'accès aux dossiers parents pour permettre la navigation vers le fichier partagé
                const isParent = activeShare.share_type === 'file' &&
                    activeShare.path.startsWith(filePath + '/');

                if (isMatch || isParent) {
                    console.log('🔓 Access granted via active share:', activeShare.id);
                    return {
                        allowed: true,
                        perms: ['1'],
                        canAdmin: false,
                        isOwner: false
                    };
                }
            }

            // 1. VÉRIFIER L'ACCÈS GLOBAL D'ABORD
            const globalCheck = await checkGlobalAccess();
            if (!globalCheck.allowed) {
                if (globalCheck.reason === 'not_authenticated') {
                    return { allowed: false, reason: 'not_auth', message: '⛔ Impossible d\'accéder ici - Connexion requise' };
                } else {
                    return { allowed: false, reason: 'no_access', message: '🚫 Vous ne pouvez pas accéder ici' };
                }
            }

            // Get user's permissions from global check
            const userPerms = (globalCheck.globalPerms || '1').split(';').filter(p => p);
            console.log('👤 User has perms:', userPerms);

            // 2. Vérifier le fichier/dossier spécifique dans drive_files
            const { data: fileData } = await fromAgence('drive_files')
                .select('permissions, owner_email')
                .eq('path', filePath)
                .maybeSingle();

            if (!fileData) {
                // Fichier pas encore enregistré → sera auto-créé avec perm '1'
                console.warn('📄 File/folder not in DB yet:', filePath);
                if (isFolder) {
                    // Folders without DB entry are accessible by default
                    return { allowed: true, perms: ['1'], canAdmin: userPerms.includes('2'), isOwner: false };
                } else {
                    return { allowed: false, reason: 'not_registered' };
                }
            }

            // 3. Vérifier si l'utilisateur a AU MOINS UNE des permissions du fichier/dossier
            const filePerms = (fileData.permissions || '1').split(';').filter(p => p);
            console.log('📄 File/folder requires perms:', filePerms, 'for path:', filePath);

            // Check if user has at least one matching permission
            const hasMatchingPerm = filePerms.some(filePerm => userPerms.includes(filePerm));

            if (!hasMatchingPerm) {
                console.warn('❌ User perms:', userPerms, 'do not match file perms:', filePerms);
                return {
                    allowed: false,
                    reason: 'no_matching_perm',
                    message: `🔒 Permissions insuffisantes (requis: ${filePerms.join(', ')})`
                };
            }

            return {
                allowed: true,
                perms: filePerms,
                canAdmin: userPerms.includes('2'),
                isOwner: fileData.owner_email === currentUser?.email
            };

        } catch (err) {
            console.error('Permission check error:', err);
            return { allowed: false, reason: 'error', message: '❌ Erreur de vérification' };
        }
    }

    // === AUTH ===
    async function getHash(text) {
        const utf8 = new TextEncoder().encode(text.toLowerCase().trim());
        const hashBuffer = await crypto.subtle.digest('SHA-256', utf8);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    async function initAuth() {
        console.log("🔐 Initializing Auth...");

        // 1. Priorité à la session native Supabase (Auth GoTrue)
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
            currentUser = session.user;
            console.log("✅ Logged via Supabase:", currentUser.email);
            updateProfileUI(currentUser);
            return;
        }

        // 2. Vérification SessionStorage (Ta méthode personnalisée)
        const token = sessionStorage.getItem('session_token');
        const isAuth = sessionStorage.getItem('isAuth');

        if (!token || isAuth !== 'true') {
            console.warn("👤 Guest mode (no auth)");
            updateProfileUI(null);
            return;
        }

        // Fonction de hachage locale (doit être identique à celle du login)
        const internalHash = async (str) => {
            const utf8 = new TextEncoder().encode(str.toLowerCase().trim());
            const hashBuffer = await crypto.subtle.digest('SHA-256', utf8);
            return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
        };

        try {
            const { data: employes, error } = await fromAgence('employes')
                .select('email, nom, prenom');

            if (error) throw error;

            let userFound = false;

            for (const emp of employes) {
                const h = await internalHash(emp.email);
                if (h === token) {
                    currentUser = {
                        email: emp.email,
                        user_metadata: { full_name: `${emp.nom} ${emp.prenom}` }
                    };
                    console.log("✅ Logged via Token Match:", currentUser.email);
                    updateProfileUI(currentUser);
                    userFound = true;
                    break;
                }
            }

            if (!userFound) {
                console.warn("❌ No matching employee for token");
                updateProfileUI(null);
            }

        } catch (err) {
            console.error("Auth error:", err);
            updateProfileUI(null);
        }
    }

    function updateProfileUI(user) {
        if (user) {
            const name = user.user_metadata?.full_name || user.email.split('@')[0];
            userFullNameEl.textContent = name;
            userAvatarEl.textContent = name.substring(0, 2).toUpperCase();
        } else {
            userFullNameEl.textContent = "Invité";
            userAvatarEl.textContent = "??";
        }
    }

    // === GITHUB API ===
    async function loadToken() {
        try {
            const res = await fetch("https://pkyt-database-up.vercel.app/code-source/E-CDE/Secure-token.js", { cache: "no-store" });
            const json = await res.json();
            TOKEN = json.GITHUB_TOKEN;
        } catch (e) {
            console.error("Token error:", e);
            alert("Impossible de charger le token GitHub");
        }
    }

    async function githubApi(path, method = "GET", body = null) {
        if (!TOKEN) throw new Error("Token non chargé");
        const url = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${encodeURIComponent(path)}?ref=${BRANCH}`;
        const options = {
            method,
            headers: {
                Authorization: `token ${TOKEN}`,
                Accept: "application/vnd.github.v3+json"
            }
        };
        if (body) options.body = JSON.stringify(body);

        const res = await fetch(url, options);
        if (!res.ok && res.status !== 404) throw new Error(`GitHub API error: ${res.status}`);
        if (method === "GET" || method === "PUT") return res.json();
        return res;
    }

    async function getFileSha(path) {
        try {
            const data = await githubApi(path);
            return data.sha;
        } catch {
            return null;
        }
    }

    async function createFile(path, content, message = "Update file") {
        const sha = await getFileSha(path);
        const body = {
            message,
            content: btoa(unescape(encodeURIComponent(content))),
            branch: BRANCH
        };
        if (sha) body.sha = sha;
        await githubApi(path, "PUT", body);
    }

    async function deleteFile(path, message = "Delete file") {
        const sha = await getFileSha(path);
        if (!sha) return;
        await githubApi(path, "DELETE", { message, sha, branch: BRANCH });
    }

    async function renameFile(oldPath, newPath, message = "Rename file") {
        try {
            // 1. Get content of old file
            const oldData = await githubApi(oldPath);
            if (!oldData.content) throw new Error("Impossible de lire le contenu du fichier");

            // 2. Create new file with same content
            const body = {
                message,
                content: oldData.content,
                branch: BRANCH
            };
            await githubApi(newPath, "PUT", body);

            // 3. Delete old file
            await deleteFile(oldPath, `Delete old file after rename to ${newPath}`);

            // 4. Update Supabase
            await fromAgence('drive_files')
                .update({ path: newPath, name: newPath.split('/').pop() })
                .eq('path', oldPath);

            // 5. Update any shares pointing to this file
            await fromAgence('drive_shares')
                .update({ path: newPath })
                .eq('path', oldPath);

            console.log(`✅ File renamed from ${oldPath} to ${newPath}`);
        } catch (e) {
            console.error("Rename error:", e);
            throw e;
        }
    }

    async function getRecursiveFiles(path) {
        let results = [];
        const content = await githubApi(path);

        if (Array.isArray(content)) {
            for (const item of content) {
                if (item.type === "dir") {
                    const subFiles = await getRecursiveFiles(item.path);
                    results = results.concat(subFiles);
                } else {
                    results.push(item);
                }
            }
        } else {
            // It's a file
            results.push(content);
        }
        return results;
    }

    async function renameFolder(oldPath, newPath, message = "Rename folder") {
        try {
            const files = await getRecursiveFiles(oldPath);
            console.log(`📦 Moving ${files.length} files from ${oldPath} to ${newPath}`);

            for (const file of files) {
                const relativePath = file.path.substring(oldPath.length);
                const targetPath = newPath + relativePath;

                // Create new file
                await githubApi(targetPath, "PUT", {
                    message: `Move ${file.name} to ${newPath}`,
                    content: file.content || (await githubApi(file.path)).content,
                    branch: BRANCH
                });

                // Delete old file
                await deleteFile(file.path, `Delete old ${file.name} after move`);
            }

            // Update Supabase records for the folder itself and all its contents

            // Update the folder record itself
            await fromAgence('drive_files')
                .update({ path: newPath, name: newPath.split('/').pop() })
                .eq('path', oldPath);

            // Update all children
            const { data: children } = await fromAgence('drive_files')
                .select('path')
                .like('path', `${oldPath}/%`);

            if (children) {
                for (const child of children) {
                    const childNewPath = child.path.replace(oldPath, newPath);
                    await supabase
                        .from('drive_files')
                        .update({ path: childNewPath })
                        .eq('path', child.path);
                }
            }

            // Update shares
            const { data: sharedChildren } = await fromAgence('drive_shares')
                .select('path')
                .like('path', `${oldPath}%`);

            if (sharedChildren) {
                for (const share of sharedChildren) {
                    const shareNewPath = share.path.replace(oldPath, newPath);
                    await supabase
                        .from('drive_shares')
                        .update({ path: shareNewPath })
                        .eq('path', share.path);
                }
            }

            console.log(`✅ Folder renamed from ${oldPath} to ${newPath}`);
        } catch (e) {
            console.error("Folder rename error:", e);
            throw e;
        }
    }

    async function deleteFolder(path, message = "Delete folder") {
        try {
            const files = await getRecursiveFiles(path);
            console.log(`🗑️ Deleting ${files.length} files in ${path}`);

            for (const file of files) {
                await deleteFile(file.path, `Part of folder delete: ${path}`);
            }

            // Delete from Supabase
            await fromAgence('drive_files')
                .delete()
                .or(`path.eq.${path},path.like.${path}/%`);

            // Delete shares
            await fromAgence('drive_shares')
                .delete()
                .or(`path.eq.${path},path.like.${path}/%`);

            console.log(`✅ Folder ${path} deleted`);
        } catch (e) {
            console.error("Folder delete error:", e);
            throw e;
        }
    }

    // === FILE OPERATIONS ===
    async function loadContent(folder) {
        const key = folder === null ? "root" : folder;
        let path = BASE_PATH;
        if (folder !== null) path += "/" + folder;

        try {
            const content = await githubApi(path);
            if (Array.isArray(content)) {
                const folders = content.filter(i => i.type === "dir").map(d => d.name);
                foldersByFolder[key] = folders;

                const imageExtensions = [".png", ".jpg", ".jpeg", ".gif", ".webp"];
                const allowedExtensions = [".md", ".pdf", ".html", ...imageExtensions];
                const validFiles = content.filter(i => i.type === "file" && allowedExtensions.some(ext => i.name.toLowerCase().endsWith(ext)));
                filesByFolder[key] = validFiles;

                // Sync folders to DB (auto-register)
                for (const folderName of folders) {
                    const fullPath = folder ? `${BASE_PATH}/${folder}/${folderName}` : `${BASE_PATH}/${folderName}`;
                    await syncFileToDb(fullPath, folderName, true); // true = isFolder
                }

                // Sync files to DB (auto-register)
                for (const file of validFiles) {
                    const fullPath = folder ? `${BASE_PATH}/${folder}/${file.name}` : `${BASE_PATH}/${file.name}`;
                    await syncFileToDb(fullPath, file.name, false);
                }
            } else {
                foldersByFolder[key] = [];
                filesByFolder[key] = [];
            }
        } catch (e) {
            console.error("Load error:", e);
            foldersByFolder[key] = [];
            filesByFolder[key] = [];
        }
    }

    async function openFolder(folder) {
        currentFolder = folder;
        currentFolderName.textContent = folder === null ? "Racine" : folder;
        btnBackFolder.disabled = currentFolder === null;

        contentUl.innerHTML = '<li class="p-4 text-gray-500">Chargement...</li>';

        try {
            // Check folder permissions if not root
            if (folder !== null) {
                const folderPath = `${BASE_PATH}/${folder}`;
                const folderCheck = await checkFilePermission(folderPath, true);

                if (!folderCheck.allowed) {
                    contentUl.innerHTML = `<li class="p-8 text-center">
                        <div class="text-red-400 space-y-3">
                            <i class="fas fa-lock text-4xl text-red-600"></i>
                            <p class="text-lg font-semibold">Accès refusé</p>
                            <p class="text-sm">${folderCheck.message || 'Vous n\'avez pas les permissions pour accéder à ce dossier'}</p>
                        </div>
                    </li>`;
                    return;
                }
                console.log('✅ Folder access granted:', folder);
            }

            await loadContent(folder);
            renderContent(folder);

            // Show/hide create buttons based on perm '2'
            if (btnCreateFile) {
                btnCreateFile.style.display = hasAdminPerm ? 'block' : 'none';
            }
            if (btnCreateFolder) {
                btnCreateFolder.style.display = hasAdminPerm ? 'block' : 'none';
            }
        } catch (e) {
            contentUl.innerHTML = '<li class="p-4 text-red-500">Erreur de chargement.</li>';
        }
    }

    function renderContent(folder) {
        const key = folder === null ? "root" : folder;
        let folders = foldersByFolder[key] || [];
        let files = filesByFolder[key] || [];

        contentUl.innerHTML = "";

        // Filter results for guests with active share (Privacy)
        const activeShare = window.driveAPI?.activeShare;
        if (!currentUser && activeShare) {
            const currentPath = folder === null ? BASE_PATH : `${BASE_PATH}/${folder}`;

            // Filter folders: only show if they are parents or children of the shared path
            folders = folders.filter(fName => {
                const fPath = `${currentPath}/${fName}`;
                return activeShare.path === fPath ||
                    activeShare.path.startsWith(fPath + '/') ||
                    fPath.startsWith(activeShare.path + '/');
            });

            // Filter files: only show if they match the shared path or are inside a shared folder
            files = files.filter(f => {
                const fPath = `${currentPath}/${f.name}`;
                return fPath === activeShare.path ||
                    fPath.startsWith(activeShare.path + '/');
            });
        }

        // Show message for non-authenticated users (unless a share is active)
        if (!currentUser && !window.driveAPI?.activeShare) {
            contentUl.innerHTML = `
                <li class="p-8 text-center">
                    <div class="text-neutral-400 space-y-3">
                        <i class="fas fa-lock text-4xl text-neutral-600"></i>
                        <p class="text-lg font-semibold">Connexion requise</p>
                        <p class="text-sm">Vous devez être connecté pour accéder aux fichiers du Drive.</p>
                    </div>
                </li>
            `;
            return;
        }

        if (folders.length === 0 && files.length === 0) {
            contentUl.innerHTML = '<li class="p-4 text-gray-500 italic">Dossier vide.</li>';
            return;
        }

        // Folders
        folders.forEach(folderName => {
            const li = document.createElement("li");
            li.className = "group cursor-pointer hover:bg-neutral-800 px-4 py-3 flex items-center justify-between gap-3 border-b border-neutral-800";

            const leftDiv = document.createElement('div');
            leftDiv.className = "flex items-center gap-3 flex-1";
            leftDiv.innerHTML = `<i class="fas fa-folder text-yellow-500 text-xl"></i> <span class="font-medium">${folderName}</span>`;
            leftDiv.onclick = () => {
                const newPath = folder === null ? folderName : folder + "/" + folderName;
                openFolder(newPath);
            };

            li.appendChild(leftDiv);

            // Action buttons container
            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'flex gap-2';

            // Share button (always visible for admins)
            if (hasAdminPerm) {
                const shareBtn = document.createElement('button');
                shareBtn.className = 'opacity-0 group-hover:opacity-100 text-blue-500 hover:text-blue-400 transition';
                shareBtn.innerHTML = '<i class="fas fa-share-alt"></i>';
                shareBtn.title = 'Partager';
                shareBtn.onclick = (e) => {
                    e.stopPropagation();
                    window.openShareModal('folder', folderName, folder);
                };
                actionsDiv.appendChild(shareBtn);
            }

            // Gear icon for admin
            if (hasAdminPerm) {
                const gearBtn = document.createElement('button');
                gearBtn.className = 'opacity-0 group-hover:opacity-100 text-neutral-500 hover:text-white transition';
                gearBtn.innerHTML = '<i class="fas fa-cog"></i>';
                gearBtn.onclick = (e) => {
                    e.stopPropagation();
                    window.openEditModal('folder', folderName, folder);
                };
                actionsDiv.appendChild(gearBtn);
            }

            if (actionsDiv.children.length > 0) {
                li.appendChild(actionsDiv);
            }
            contentUl.appendChild(li);
        });

        // Files
        files.forEach(file => {
            const li = document.createElement("li");
            li.className = "group cursor-pointer hover:bg-neutral-800 px-4 py-3 flex items-center justify-between gap-3 border-b border-neutral-800";

            const leftDiv = document.createElement('div');
            leftDiv.className = "flex items-center gap-3 flex-1";

            let iconClass = "fa-file-alt text-gray-400";
            let displayName = file.name;

            if (file.name.toLowerCase().endsWith(".md")) {
                iconClass = "fa-file-alt text-blue-400";
                displayName = file.name.replace(/\.md$/i, "");
            } else if (file.name.toLowerCase().endsWith(".pdf")) {
                iconClass = "fa-file-pdf text-red-500";
            } else if (file.name.toLowerCase().endsWith(".html")) {
                iconClass = "fa-file-code text-orange-400";
            } else if ([".png", ".jpg", ".jpeg", ".gif", ".webp"].some(ext => file.name.toLowerCase().endsWith(ext))) {
                iconClass = "fa-file-image text-purple-400";
            }

            leftDiv.innerHTML = `<i class="fas ${iconClass} text-xl w-6 text-center"></i> <span>${displayName}</span>`;
            leftDiv.onclick = () => openFile(folder, file);

            li.appendChild(leftDiv);

            // Action buttons container
            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'flex gap-2';

            // Share button
            if (hasAdminPerm) {
                const shareBtn = document.createElement('button');
                shareBtn.className = 'opacity-0 group-hover:opacity-100 text-blue-500 hover:text-blue-400 transition';
                shareBtn.innerHTML = '<i class="fas fa-share-alt"></i>';
                shareBtn.title = 'Partager';
                shareBtn.onclick = (e) => {
                    e.stopPropagation();
                    window.openShareModal('file', file.name, folder);
                };
                actionsDiv.appendChild(shareBtn);
            }

            // Gear icon for admin
            if (hasAdminPerm) {
                const gearBtn = document.createElement('button');
                gearBtn.className = 'opacity-0 group-hover:opacity-100 text-neutral-500 hover:text-white transition';
                gearBtn.innerHTML = '<i class="fas fa-cog"></i>';
                gearBtn.onclick = (e) => {
                    e.stopPropagation();
                    window.openEditModal('file', file.name, folder);
                };
                actionsDiv.appendChild(gearBtn);
            }

            if (actionsDiv.children.length > 0) {
                li.appendChild(actionsDiv);
            }
            contentUl.appendChild(li);
        });
    }

    async function openFile(folder, file) {
        try {
            const path = folder === null ? `${BASE_PATH}/${file.name}` : `${BASE_PATH}/${folder}/${file.name}`;

            // Check permissions
            const permCheck = await checkFilePermission(path);
            if (!permCheck.allowed) {
                if (permCheck.reason === 'not_registered') {
                    // Auto-register le fichier lors de la première ouverture
                    console.log('🔓 First-time access, registering file...');
                    await syncFileToDb(path, file.name);

                    // Re-vérifier les permissions après enregistrement
                    const recheckPerm = await checkFilePermission(path);
                    if (!recheckPerm.allowed) {
                        alert("🚫 Accès refusé");
                        return;
                    }
                } else {
                    alert(`🚫 Accès refusé${currentUser ? '' : ' - Connexion requise'}`);
                    return;
                }
            }

            // 1. Toujours récupérer les métadonnées pour avoir le SHA et le download_url
            const res = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/${encodeURIComponent(path)}?ref=${BRANCH}`, {
                headers: { Authorization: `token ${TOKEN}` }
            });
            if (!res.ok) throw new Error("Erreur chargement métadonnées");
            const json = await res.json();

            const isText = file.name.toLowerCase().endsWith('.md') || file.name.toLowerCase().endsWith('.html');
            let content;

            // Si c'est du texte et qu'il fait moins de 1Mo, GitHub l'envoie directement en base64 dans le JSON
            if (isText && json.content) {
                content = decodeURIComponent(escape(atob(json.content.replace(/\n/g, ""))));
            } else {
                // Pour les fichiers binaires OU les fichiers texte > 1Mo
                // On utilise l'API Git Blobs (via le SHA) qui est plus robuste pour le contenu brut
                console.log(`📦 Fetching raw blob content for SHA: ${json.sha}`);
                const blobRes = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/git/blobs/${json.sha}`, {
                    headers: {
                        Authorization: `token ${TOKEN}`,
                        Accept: "application/vnd.github.v3.raw"
                    }
                });

                if (!blobRes.ok) {
                    const errorText = await blobRes.text();
                    console.error("Blob fetch failed:", blobRes.status, errorText);
                    throw new Error(`Erreur téléchargement blob (${blobRes.status})`);
                }

                if (isText) {
                    content = await blobRes.text();
                } else {
                    let blob = await blobRes.blob();
                    // Forcer le type MIME pour les PDF pour assurer la prévisualisation
                    if (file.name.toLowerCase().endsWith('.pdf')) {
                        blob = new Blob([blob], { type: 'application/pdf' });
                    }
                    content = URL.createObjectURL(blob);
                }
            }

            // Check if user can edit (has perm 2)
            const finalCheck = await checkFilePermission(path);
            const canEdit = finalCheck.canAdmin || false;

            // Create window
            new FileWindow(file, folder, content, canEdit);

        } catch (e) {
            alert("Erreur ouverture: " + e.message);
        }
    }

    // === EVENT HANDLERS ===
    if (btnBackFolder) {
        btnBackFolder.addEventListener("click", () => {
            if (currentFolder === null) return;
            const parts = currentFolder.split("/");
            parts.pop();
            openFolder(parts.length === 0 ? null : parts.join("/"));
        });
    }

    if (btnCreateFile) {
        btnCreateFile.addEventListener("click", () => {
            if (!hasAdminPerm) return;
            window.openCreateModal('file');
        });
    }

    if (btnCreateFolder) {
        btnCreateFolder.addEventListener("click", () => {
            if (!hasAdminPerm) return;
            window.openCreateModal('folder');
        });
    }

    if (btnImport && fileInput) {
        btnImport.classList.remove('hidden');
        btnImport.style.display = 'inline-block';
        btnImport.innerHTML = '<i class="fas fa-upload mr-2"></i> Import';
        btnImport.className = "hover:text-white p-1 ml-2 text-neutral-400";
        btnImport.title = "Importer MD, PDF, HTML ou Image";

        btnImport.addEventListener("click", () => {
            fileInput.click();
        });

        fileInput.accept = ".md,.pdf,.html,.png,.jpg,.jpeg,.gif,.webp";
        fileInput.addEventListener("change", async (e) => {
            const files = e.target.files;
            if (!files || files.length === 0) return;

            for (const file of files) {
                const reader = new FileReader();
                reader.onload = async (event) => {
                    const content = event.target.result;
                    const path = currentFolder ? `${BASE_PATH}/${currentFolder}/${file.name}` : `${BASE_PATH}/${file.name}`;

                    try {
                        let uploadContent;
                        const isPdf = file.name.toLowerCase().endsWith('.pdf');
                        const isImage = [".png", ".jpg", ".jpeg", ".gif", ".webp"].some(ext => file.name.toLowerCase().endsWith(ext));

                        if (isPdf || isImage) {
                            // Convert ArrayBuffer to base64 for PDF or Image
                            const bytes = new Uint8Array(content);
                            let binary = '';
                            for (let i = 0; i < bytes.byteLength; i++) {
                                binary += String.fromCharCode(bytes[i]);
                            }
                            uploadContent = binary;
                        } else {
                            uploadContent = content;
                        }

                        console.log('🚀 Importing:', file.name, 'to', path);
                        await createFile(path, uploadContent, `Import ${file.name}`);
                        await syncFileToDb(path, file.name, false);
                        alert(`✅ ${file.name} importé !`);
                        await openFolder(currentFolder);
                    } catch (err) {
                        console.error('Import error:', err);
                        alert(`❌ Erreur d'importation (${file.name}): ` + err.message);
                    }
                };

                const isPdf = file.name.toLowerCase().endsWith('.pdf');
                const isImage = [".png", ".jpg", ".jpeg", ".gif", ".webp"].some(ext => file.name.toLowerCase().endsWith(ext));

                if (isPdf || isImage) {
                    reader.readAsArrayBuffer(file);
                } else {
                    reader.readAsText(file);
                }
            }
            // Reset input
            fileInput.value = '';
        });
    }

    // === INITIALIZATION ===
    const repoDiv = document.querySelector('[id^="repo/"]');
    if (repoDiv) {
        const drive = repoDiv.id.split("/")[1];
        BASE_PATH = `NEW*DRIVE/${drive}`;
    }
    if (!BASE_PATH) BASE_PATH = "NEW*DRIVE/Forum";

    await loadToken();
    await initAuth();

    // Check global access to set hasAdminPerm
    if (currentUser) {
        const globalCheck = await checkGlobalAccess();
        console.log('🔑 Admin permissions:', hasAdminPerm ? 'YES' : 'NO');

        // Initialize button visibility
        if (btnCreateFile) {
            btnCreateFile.style.display = hasAdminPerm ? 'inline-block' : 'none';
            btnCreateFile.disabled = false;
        }
        if (btnCreateFolder) {
            btnCreateFolder.style.display = hasAdminPerm ? 'inline-block' : 'none';
            btnCreateFolder.disabled = false;
        }
    } else {
        // Hide buttons for non-authenticated users
        if (btnCreateFile) btnCreateFile.style.display = 'none';
        if (btnCreateFolder) btnCreateFolder.style.display = 'none';
    }

    // === EXPOSE FUNCTIONS FOR MODAL ===
    window.driveAPI = {
        createFile,
        deleteFile,
        renameFile,
        renameFolder,
        deleteFolder,
        getFileSha,
        syncFileToDb,
        supabase,
        fromAgence,
        insertAgence,
        withAgence,
        BASE_PATH: BASE_PATH,
        currentFolder: () => currentFolder,
        openFolder,
        openFile,
        activeShare: null, // Tracked active share for guest access
        get currentUser() { return currentUser; },
        get hasAdminPerm() { return hasAdminPerm; }
    };

    // Check for share URL
    const isShared = await window.handleShareFromURL();
    if (!isShared) {
        await openFolder(null);
    }
});
