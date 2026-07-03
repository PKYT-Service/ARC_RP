import { supabase, fromAgence, insertAgence, withAgence } from 'https://howardarmory-ee.vercel.app/HA-EE/src/javascript/sp.js';

window.loadCandidatures = loadCandidatures;

document.addEventListener('DOMContentLoaded', () => {
    loadCandidatures();
});

async function loadCandidatures() {
    const list = document.getElementById('candidaturesList');
    list.innerHTML = `<tr><td colspan="6" class="p-8 text-center text-neutral-500 font-mono italic"><i class="fas fa-circle-notch fa-spin mr-2"></i> Chargement...</td></tr>`;

    try {
        const { data, error } = await fromAgence('ha_candidatures')
            .select('*')
            .order('updated_at', { ascending: false });

        if (error) throw error;

        if (!data || data.length === 0) {
            list.innerHTML = `<tr><td colspan="6" class="p-8 text-center text-neutral-500 font-mono italic">Aucune candidature trouvée.</td></tr>`;
            return;
        }

        let currentCandidates = [];

        list.innerHTML = '';
        currentCandidates = data;
        
        data.forEach(c => {
            const tr = document.createElement('tr');
            tr.className = 'border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer';
            tr.onclick = () => openModal(c); // Clicking the row opens the modal
            
            const dateStr = new Date(c.updated_at || c.created_at).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
            
            let statusBadge = '';
            switch(c.status) {
                case 'en_cours': statusBadge = '<span class="bg-blue-500/10 text-blue-400 border border-blue-500/30 px-2 py-1 rounded text-xs">En cours</span>'; break;
                case 'en_attente': statusBadge = '<span class="bg-yellow-500/10 text-yellow-500 border border-yellow-500/30 px-2 py-1 rounded text-xs font-bold">À évaluer</span>'; break;
                case 'echoue': statusBadge = '<span class="bg-red-500/10 text-red-500 border border-red-500/30 px-2 py-1 rounded text-xs">Échoué</span>'; break;
                case 'accepte': statusBadge = '<span class="bg-green-500/10 text-green-500 border border-green-500/30 px-2 py-1 rounded text-xs font-bold">Accepté</span>'; break;
                default: statusBadge = `<span class="bg-neutral-800 text-neutral-400 border border-white/10 px-2 py-1 rounded text-xs">${c.status}</span>`;
            }

            const actionBtn = `<button onclick="event.stopPropagation(); openModalBySession('${c.session_id}')" class="bg-neutral-800 hover:bg-neutral-700 text-white px-3 py-1.5 rounded uppercase font-bold tracking-widest text-[10px] transition-colors"><i class="fas fa-search mr-1"></i> Détails</button>`;

            tr.innerHTML = `
                <td class="p-4 font-mono text-xs text-neutral-400">${dateStr}</td>
                <td class="p-4 font-mono text-xs text-ha-gold select-all">${c.session_id}</td>
                <td class="p-4 font-bold">${c.nom ? (c.nom.toUpperCase() + ' ' + c.prenom) : '<span class="text-neutral-600 italic">Inconnu</span>'}</td>
                <td class="p-4 text-xs">Étape ${c.current_step}/9</td>
                <td class="p-4">${statusBadge}</td>
                <td class="p-4 text-right">${actionBtn}</td>
            `;
            list.appendChild(tr);
        });
        
        window.allCandidatesData = data; // Store globally for openModalBySession

    } catch (e) {
        console.error("Erreur de chargement", e);
        list.innerHTML = `<tr><td colspan="6" class="p-8 text-center text-red-500 font-mono italic">Erreur de chargement des données.</td></tr>`;
    }
}

window.openModalBySession = function(sessionId) {
    const candidate = window.allCandidatesData.find(c => c.session_id === sessionId);
    if(candidate) openModal(candidate);
}

window.openModal = function(candidate) {
    document.getElementById('modalName').innerText = candidate.nom ? (candidate.nom.toUpperCase() + ' ' + candidate.prenom) : 'CANDIDAT INCONNU';
    document.getElementById('modalSession').innerText = candidate.session_id;
    
    document.getElementById('modalDob').innerText = candidate.dob || 'N/A';
    document.getElementById('modalAge').innerText = candidate.age ? candidate.age + ' ans' : 'N/A';
    document.getElementById('modalPhone').innerText = candidate.phone || 'N/A';
    document.getElementById('modalEmail').innerText = candidate.email || 'N/A';
    
    document.getElementById('modalStep').innerText = candidate.current_step + ' / 9';
    document.getElementById('modalStatus').innerText = candidate.status;
    document.getElementById('modalAttempts').innerText = candidate.exam_attempts || '0';
    
    const logsList = document.getElementById('modalLogs');
    logsList.innerHTML = '';
    if(candidate.logs && candidate.logs.length > 0) {
        candidate.logs.forEach(log => {
            const li = document.createElement('li');
            li.innerText = log;
            logsList.appendChild(li);
        });
    } else {
        logsList.innerHTML = '<li class="italic text-neutral-600">Aucun log disponible</li>';
    }
    
    const btnEval = document.getElementById('btnOpenEval');
    const isEvaluable = candidate.status === 'en_attente' || candidate.status === 'accepte' || candidate.status === 'echoue';
    if(isEvaluable) {
        btnEval.style.display = 'block';
        btnEval.onclick = () => window.open(`https://howardarmory-ee.vercel.app/HA-EE/management/@candidat-eval.html?session=${candidate.session_id}`, '_blank');
    } else {
        btnEval.style.display = 'none';
    }
    
    document.getElementById('candidateModal').classList.remove('hidden');
}

window.closeModal = function() {
    document.getElementById('candidateModal').classList.add('hidden');
}
