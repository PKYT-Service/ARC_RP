// Modal management and CRUD operations
// These are exposed globally for HTML onclick handlers

let modalMode = 'create'; // 'create' | 'edit'
let modalType = 'file'; // 'file' | 'folder'
let modalTargetName = null;
let modalTargetFolder = null;
let modalTargetPath = null;

window.openCreateModal = async function (type) {
    const modal = document.getElementById('crud-modal');
    const title = document.getElementById('modal-title');
    const nameInput = document.getElementById('crud-name');
    const extension = document.getElementById('crud-extension');
    const deleteBtn = document.getElementById('modal-delete-btn');
    const confirmBtn = document.getElementById('modal-confirm-btn');
    const permInput = document.getElementById('custom-perm-input');

    modalMode = 'create';
    modalType = type;
    modalTargetName = null;
    modalTargetFolder = window.driveAPI.currentFolder();
    modalTargetPath = null;

    title.textContent = type === 'file' ? 'Créer un fichier' : 'Créer un dossier';
    nameInput.value = '';

    // Inherit permissions from current folder
    let inheritedPerms = '1';
    if (modalTargetFolder) {
        try {
            const folderPath = `${window.driveAPI.BASE_PATH}/${modalTargetFolder}`;
            const { data } = await window.driveAPI.fromAgence('drive_files')
                .select('permissions')
                .eq('path', folderPath)
                .maybeSingle();
            if (data) inheritedPerms = data.permissions;
        } catch (e) { console.warn('Inheritance error:', e); }
    }
    permInput.value = inheritedPerms;

    extension.style.display = type === 'file' ? 'block' : 'none';
    deleteBtn.classList.add('hidden');
    confirmBtn.textContent = 'Créer';

    modal.classList.remove('hidden');
};

window.openEditModal = async function (type, name, folder) {
    const modal = document.getElementById('crud-modal');
    const title = document.getElementById('modal-title');
    const nameInput = document.getElementById('crud-name');
    const extension = document.getElementById('crud-extension');
    const deleteBtn = document.getElementById('modal-delete-btn');
    const confirmBtn = document.getElementById('modal-confirm-btn');
    const permInput = document.getElementById('custom-perm-input');

    modalMode = 'edit';
    modalType = type;
    modalTargetName = name;
    modalTargetFolder = folder;

    // Build path
    const basePath = window.driveAPI.BASE_PATH;
    modalTargetPath = folder ? `${basePath}/${folder}/${name}` : `${basePath}/${name}`;

    title.textContent = type === 'file' ? 'Modifier le fichier' : 'Modifier le dossier';
    nameInput.value = type === 'file' ? name.replace(/\.md$/i, '') : name;
    extension.style.display = type === 'file' ? 'block' : 'none';
    deleteBtn.classList.remove('hidden');
    confirmBtn.textContent = 'Enregistrer';

    // Load current permissions from DB
    try {
        const { data, error } = await window.driveAPI.fromAgence('drive_files')
            .select('permissions')
            .eq('path', modalTargetPath)
            .maybeSingle();

        if (data) {
            permInput.value = data.permissions || '1';
        } else {
            permInput.value = '1';
        }
    } catch (err) {
        console.warn('Could not load permissions:', err);
        permInput.value = '1';
    }

    modal.classList.remove('hidden');
};

window.closeModal = function () {
    document.getElementById('crud-modal').classList.add('hidden');
};

window.confirmCreate = async function () {
    const nameInput = document.getElementById('crud-name').value.trim();
    const permsInput = document.getElementById('custom-perm-input').value.trim() || '1';

    if (!nameInput) {
        alert('Le nom ne peut pas être vide');
        return;
    }

    const driveAPI = window.driveAPI;
    const basePath = driveAPI.BASE_PATH;
    const currentFolder = driveAPI.currentFolder();

    if (modalMode === 'create') {
        // CREATE MODE
        const fileName = modalType === 'file' ? `${nameInput}.md` : nameInput;
        const filePath = currentFolder ? `${basePath}/${currentFolder}/${fileName}` : `${basePath}/${fileName}`;

        try {
            console.log('Creating:', modalType, fileName, 'at', filePath);

            if (modalType === 'file') {
                // Create file on GitHub
                await driveAPI.createFile(filePath, `# ${nameInput}\n\nNouveau document.`, `Create ${fileName}`);

                // Add to DB
                await window.driveAPI.insertAgence('drive_files', [{
                        path: filePath,
                        name: fileName,
                        owner_email: driveAPI.currentUser?.email || null,
                        permissions: permsInput
                    }]);

                alert('✅ Fichier créé !');
            } else {
                // Create folder (GitHub needs at least one file)
                const readmePath = `${filePath}/README.md`;
                await driveAPI.createFile(readmePath, `# ${nameInput}\n\nDossier créé.`, `Create folder ${fileName}`);

                // IMPORTANT: Register the folder itself in DB
                await window.driveAPI.insertAgence('drive_files', [{
                        path: filePath,
                        name: fileName,
                        owner_email: driveAPI.currentUser?.email || null,
                        permissions: permsInput
                    }]);

                console.log('✅ Folder registered in DB:', filePath, 'with perms:', permsInput);
                alert('✅ Dossier créé !');
            }

            // Refresh
            closeModal();
            await driveAPI.openFolder(currentFolder);

        } catch (e) {
            console.error('Create error:', e);
            alert('❌ Erreur lors de la création: ' + e.message);
        }

    } else {
        // EDIT MODE (rename + update perms)
        const newFileName = modalType === 'file' ? `${nameInput}.md` : nameInput;

        try {
            // 1. Update permissions in DB
            await driveAPI.fromAgence('drive_files')
                .update({ permissions: permsInput })
                .eq('path', modalTargetPath);

            // 2. Rename if name changed
            if (newFileName !== modalTargetName) {
                const newPath = modalTargetFolder ?
                    `${basePath}/${modalTargetFolder}/${newFileName}` :
                    `${basePath}/${newFileName}`;

                if (modalType === 'file') {
                    await driveAPI.renameFile(modalTargetPath, newPath, `Rename ${modalTargetName} to ${newFileName}`);
                    alert('✅ Fichier renommé avec succès !');
                } else {
                    await driveAPI.renameFolder(modalTargetPath, newPath, `Rename folder ${modalTargetName} to ${newFileName}`);
                    alert('✅ Dossier renommé avec succès !');
                }
            } else {
                alert('✅ Permissions mises à jour !');
            }

            closeModal();
            await driveAPI.openFolder(modalTargetFolder);

        } catch (e) {
            console.error('Update error:', e);
            alert('❌ Erreur lors de la mise à jour: ' + e.message);
        }
    }
};

window.confirmDelete = async function () {
    if (!confirm(`Voulez-vous vraiment supprimer ce ${modalType} ?\n${modalTargetName}`)) {
        return;
    }

    const driveAPI = window.driveAPI;

    try {
        console.log('Deleting:', modalType, modalTargetPath);

        if (modalType === 'file') {
            // Delete from GitHub
            await driveAPI.deleteFile(modalTargetPath, `Delete ${modalTargetName}`);

            // Delete from DB
            await driveAPI.fromAgence('drive_files')
                .delete()
                .eq('path', modalTargetPath);

            alert('✅ Fichier supprimé !');
        } else {
            // Recursive delete for folders
            await driveAPI.deleteFolder(modalTargetPath, `Delete folder ${modalTargetName}`);
            alert('✅ Dossier supprimé !');
        }

        closeModal();
        await driveAPI.openFolder(modalTargetFolder);

    } catch (e) {
        console.error('Delete error:', e);
        alert('❌ Erreur lors de la suppression: ' + e.message);
    }
};

