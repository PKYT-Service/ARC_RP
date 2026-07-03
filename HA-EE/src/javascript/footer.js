// 🎯 Importation de l'instance sécurisée depuis ton fichier sp.js
import { supabase } from '/HA-EE/src/javascript/sp.js';

document.addEventListener("DOMContentLoaded", function () {
  const year = new Date().getFullYear();
  const STORAGE_KEY = "ha_dashboard_authorized";

  // ==========================================
  // 1. MODULE DE SÉCURITÉ & ACCREDITATION (THEME A.R.C.)
  // ==========================================
  const checkAccess = () => {
    const isAuthorized = sessionStorage.getItem(STORAGE_KEY);

    if (!isAuthorized) {
      const popupOverlay = document.createElement("div");
      popupOverlay.id = "tactical-auth-popup";
      popupOverlay.className = "fixed inset-0 z-[10000] bg-[#FAF8F5]/80 backdrop-blur-md flex items-center justify-center p-4 transition-opacity duration-500";
      
      popupOverlay.innerHTML = `
        <div class="bg-white/90 w-full max-w-md border border-dark-700/30 shadow-xl shadow-champagne-500/10 flex flex-col rounded-2xl overflow-hidden font-sans relative backdrop-blur-2xl">
          <div class="bg-gradient-to-r from-[#FDFCFB] to-[#F5F1EB] px-6 py-4 border-b border-dark-700/20 flex items-center gap-3">
            <div class="h-8 w-8 rounded-lg gold-gradient flex items-center justify-center text-white font-bold text-xs shadow-md animate-pulse">▲</div>
            <div class="flex flex-col">
              <span class="text-sm font-serif tracking-widest text-champagne-100 uppercase">A.R.C. Security</span>
              <span class="text-[9px] font-mono text-[#AA823C] tracking-[0.2em] uppercase font-bold">Contrôle d'Accès Matrice</span>
            </div>
          </div>
          <div class="p-6 space-y-4 text-[#1A140E]">
            <p class="text-xs text-neutral-600 leading-relaxed">
              Vous tentez d'initialiser le panel de commandement <span class="font-bold text-champagne-100">EnesCDE V4</span>.<br>
              Une liaison sécurisée est requise pour synchroniser vos accréditations de filiale.
            </p>
            <div class="bg-[#FAF8F5] border border-dark-700/30 p-3 rounded-xl font-mono text-[10px] text-neutral-500 space-y-1">
              <div class="flex justify-between"><span>REQUÊTE :</span> <span class="text-[#AA823C] font-semibold">INITIALISATION_SYS</span></div>
              <div class="flex justify-between"><span>STATUT :</span> <span class="text-red-600 font-bold">ACCÈS VERROUILLÉ</span></div>
            </div>
            <p class="text-[9px] text-neutral-400 leading-normal italic">
              En validant ce terminal, vous certifiez être un agent actif enregistré sous l'autorité d'A.R.C. Systems. Toutes vos requêtes réseau seront loggées.
            </p>
          </div>
          <div class="px-6 py-4 bg-[#F5F1EB]/50 border-t border-dark-700/20">
            <button id="btn-validate-access" class="w-full gold-gradient text-white text-[11px] uppercase tracking-widest font-bold py-3.5 rounded-xl transition shadow-md hover:opacity-90 active:scale-[0.98] cursor-pointer">
              Autoriser ce terminal
            </button>
          </div>
        </div>
      `;
      
      document.body.appendChild(popupOverlay);

      document.getElementById("btn-validate-access").addEventListener("click", function () {
        sessionStorage.setItem(STORAGE_KEY, "true");
        popupOverlay.classList.add("opacity-0");
        setTimeout(() => {
          popupOverlay.remove();
        }, 500);
      });
    }
  };

  // ==========================================
  // 2. MODULE INTERFACE FOOTER & VISIONNEUSE (THEME A.R.C.)
  // ==========================================
  const initFooter = () => {
    const footerElement = document.getElementById("footer");

    if (footerElement) {
      footerElement.className = "";
      footerElement.classList.add("w-full");

      footerElement.innerHTML = `
      <footer class="w-full bg-white/80 border-t border-dark-700/30 backdrop-blur-md mt-12 relative z-10 font-sans">
        <div class="max-w-[85rem] py-10 px-4 sm:px-6 lg:px-8 mx-auto">
          <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6 mb-10">
            
            <div class="col-span-full lg:col-span-1 flex flex-col justify-between gap-4">
              <a class="flex items-center gap-x-3 text-lg font-serif tracking-widest text-champagne-100 focus:outline-none" href="#">
                <div class="h-7 w-7 rounded-lg gold-gradient flex items-center justify-center text-white font-bold text-xs shadow-md">▲</div>
                <div>
                  <span class="bg-gradient-to-r from-champagne-200 to-champagne-500 bg-clip-text text-transparent font-bold">A.R.C.</span>
                </div>
              </a>
              <p class="text-[9px] font-mono text-neutral-400 uppercase tracking-[0.15em] leading-relaxed">
                Ressources Centralisées<br>
                <span class="text-amber-600 font-bold"><i class="fa-solid fa-shield mr-1 text-[8px]"></i> Espace Sécurisé</span>
              </p>
            </div>

            <!--<div>
              <h4 class="text-[10px] font-bold text-[#AA823C] uppercase tracking-[0.2em] mb-4 border-l-2 border-[#D4AF37] ps-2">Gestion</h4>
              <div class="grid space-y-1 text-xs">
                <p><a class="text-neutral-500 hover:text-champagne-100 transition-colors duration-200 py-1 inline-block" href="https://howardarmory.vercel.app/compte/panel/unit-personnel/profil.html">Mon Profil E-CDE</a></p>
                <p><a class="doc-link text-neutral-500 hover:text-champagne-100 transition-colors duration-200 py-1 inline-block cursor-pointer" data-href="https://howardarmory.vercel.app/compte/panel/unit-personnel/data/DP/Modul.ES.html?code=howard#R%C3%A9pertoire%20Membre%2FConsigne%2FSecurity%20-%2016.12.2025.md">Règles de sécurité</a></p>
                <p><a class="doc-link text-neutral-500 hover:text-champagne-100 transition-colors duration-200 py-1 inline-block cursor-pointer" data-href="https://howardarmory.vercel.app/compte/panel/unit-personnel/data/DP/Modul.ES.html?code=howard#R%C3%A9pertoire%20Membre%2FSalaire%20par%20emplois.md">Grille Salariale</a></p>
              </div>
            </div>

            <div>
              <h4 class="text-[10px] font-bold text-[#AA823C] uppercase tracking-[0.2em] mb-4 border-l-2 border-[#D4AF37] ps-2">Protocoles</h4>
              <div class="grid space-y-1 text-xs">
                <p><a class="text-neutral-500 hover:text-champagne-100 transition-colors duration-200 py-1 inline-block" href="https://howardarmory.vercel.app/compte/panel/unit-personnel/fp.html">Docs & Consignes</a></p>
                <p><a class="doc-link text-neutral-500 hover:text-champagne-100 transition-colors duration-200 py-1 inline-block cursor-pointer" data-href="https://howardarmory.vercel.app/compte/panel/unit-personnel/data/DP/Modul.ES.html?code=howard#R%C3%A9pertoire%20Membre%2FArsenal%20par%20hi%C3%A9rarchies.md">Arsenal Autorisé</a></p>
                <p><a class="doc-link text-neutral-500 hover:text-champagne-100 transition-colors duration-200 py-1 inline-block cursor-pointer" data-href="https://howardarmory.vercel.app/compte/panel/unit-personnel/data/DP/Modul.ES.html?code=howard#R%C3%A9pertoire%20Membre%2FConsigne%2FGunShop%20-%2021.08.2023.md">Règles du Shop</a></p>
              </div>
            </div>

            <div>
              <h4 class="text-[10px] font-bold text-[#AA823C] uppercase tracking-[0.2em] mb-4 border-l-2 border-[#D4AF37] ps-2">Liaison</h4>
              <div class="grid space-y-1 text-xs">
                <p><a class="text-neutral-500 hover:text-champagne-100 transition-colors duration-200 py-1 inline-block" href="https://howardarmory.vercel.app/compte/panel/unit-personnel/mail.html">Messagerie Interne</a></p>
                <p><a class="text-neutral-500 hover:text-champagne-100 transition-colors duration-200 py-1 inline-block" href="https://howardarmory.vercel.app/compte/panel/unit-personnel/AS.html">AS & Salaire (Decl.)</a></p>
                <p><a class="text-neutral-500 hover:text-champagne-100 transition-colors duration-200 py-1 inline-block" href="https://howardarmory.vercel.app/compte/panel/unit-personnel/personnel.html">Effectifs HA</a></p>
              </div>
            </div>-->

            <div>
              <h4 class="text-[10px] font-bold text-[#AA823C] uppercase tracking-[0.2em] mb-4 border-l-2 border-[#D4AF37] ps-2">Réseau A.R.C.</h4>
              <div id="supabase-api-status-container" class="flex flex-col gap-2 font-mono text-[9px] tracking-wider">
                <span class="text-neutral-400 italic animate-pulse">Synchronisation matrice...</span>
              </div>
            </div>
          </div>

          <div class="pt-6 border-t border-dark-700/20 flex flex-col md:flex-row justify-between items-center gap-4">
            <p class="text-[10px] text-neutral-400 text-center md:text-left leading-relaxed">
              © ${year} <span class="text-champagne-100 font-semibold tracking-wide">A.R.C. Systems Corporate</span>. Tous droits réservés.<br>
              Panel sécurisé, <b> ceci est destiné a un usage <span class="text-[#AA823C] font-mono">RolePlay, fondée par PikaYut ( discord : EnesGP )</span></b>.
            </p>
            <div class="flex items-center">
               <span class="text-[9px] font-mono font-bold text-[#AA823C] uppercase tracking-[0.2em] bg-amber-500/5 px-3 py-1 border border-amber-500/10 rounded-lg italic">
               
               <div class="flex gap-8 text-gray-500">
                <a href="https://discord.gg/Fh2znMGU9j" class="hover:text-[#c5a059] transition-colors transform hover:-translate-y-1 duration-300">
                    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028 14.09 14.09 0 001.226-1.994.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"></path></svg>
                </a>
                <a href="https://yelpler.com/howardarmory" class="hover:text-[#c5a059] transition-colors transform hover:-translate-y-1 duration-300">
                    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"></path></svg>
                </a>
                <a href="https://gtacityrp.fr/index.php" class="hover:text-[#c5a059] transition-colors transform hover:-translate-y-1 duration-300 group">
    <img class="w-5 h-5 grayscale group-hover:grayscale-0 transition-all" src="https://dunb17ur4ymx4.cloudfront.net/webstore/logos/d1128236d4dd0761a5af3749c4f78eaaad48188f.png"> 
</a>
            </div>
            
            </span>
            </div>
          </div>
        </div>
      </footer>

      <div id="tactical-modal" class="hidden fixed inset-0 z-[9999] bg-[#FAF8F5]/80 backdrop-blur-md flex items-center justify-center p-4 transition-all duration-300">
        <div id="tactical-window" class="bg-white w-full max-w-5xl h-[85vh] border border-dark-700/30 shadow-2xl shadow-champagne-500/10 flex flex-col rounded-2xl overflow-hidden relative transition-all duration-300">
          <div class="bg-gradient-to-r from-[#FDFCFB] to-[#F5F1EB] px-4 py-3 flex justify-between items-center border-b border-dark-700/20 select-none">
            <div class="flex items-center gap-2">
              <span class="size-1.5 rounded-full bg-red-400/60"></span>
              <span class="size-1.5 rounded-full bg-amber-400/60"></span>
              <span class="size-1.5 rounded-full bg-emerald-400/60"></span>
              <span class="ml-2 text-[10px] font-mono text-[#AA823C] tracking-widest uppercase flex items-center gap-2 font-bold">
                <i class="fa-solid fa-shield text-[8px] opacity-70"></i> A.R.C. SECURE VIEWER
                <span class="text-neutral-300">|</span> 
                <span id="modal-title" class="text-champagne-100 normal-case font-sans font-semibold">Chargement...</span>
              </span>
            </div>
            <div class="flex items-center gap-4">
              <button id="modal-resize-btn" class="text-neutral-400 hover:text-[#AA823C] transition-colors duration-150 cursor-pointer" title="Redimensionner">
                <i class="fa-solid fa-expand text-xs"></i>
              </button>
              <button id="modal-close-btn" class="text-neutral-400 hover:text-red-500 transition-colors duration-150 cursor-pointer" title="Fermer le terminal">
                <i class="fa-solid fa-xmark text-sm"></i>
              </button>
            </div>
          </div>
          <div class="flex-1 bg-[#FAF8F5] relative w-full h-full">
            <div id="modal-loader" class="absolute inset-0 flex items-center justify-center bg-[#FAF8F5] z-0">
              <div class="w-6 h-6 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin"></div>
            </div>
            <iframe id="modal-iframe" src="" class="w-full h-full border-none relative z-10 opacity-0 transition-opacity duration-300" allowfullscreen></iframe>
          </div>
        </div>
      </div>
      `;

      // Logique opérationnelle du Modal
      const modal = document.getElementById('tactical-modal');
      const modalWindow = document.getElementById('tactical-window');
      const iframe = document.getElementById('modal-iframe');
      const loader = document.getElementById('modal-loader');
      const closeBtn = document.getElementById('modal-close-btn');
      const resizeBtn = document.getElementById('modal-resize-btn');
      const modalTitle = document.getElementById('modal-title');
      let isFullscreen = false;

      footerElement.addEventListener('click', function(e) {
          const link = e.target.closest('.doc-link, a');
          if (!link) return;
          const targetHref = link.getAttribute('data-href') || link.href;
          
          if (targetHref && targetHref.includes('Modul.ES.html')) {
              e.preventDefault();
              iframe.style.opacity = '0';
              if (loader) loader.style.display = 'flex';
              iframe.src = targetHref;
              modalTitle.innerText = link.innerText.trim();
              modal.classList.remove('hidden');
          }
      });

      iframe.addEventListener('load', function() {
          iframe.style.opacity = '1';
          if (loader) loader.style.display = 'none';
      });

      const closeModal = () => {
          modal.classList.add('hidden');
          iframe.style.opacity = '0';
          iframe.src = '';
      };

      closeBtn.addEventListener('click', closeModal);
      modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

      resizeBtn.addEventListener('click', () => {
          isFullscreen = !isFullscreen;
          const icon = resizeBtn.querySelector('i');
          if (isFullscreen) {
              modalWindow.classList.remove('max-w-5xl', 'h-[85vh]', 'rounded-2xl');
              modalWindow.classList.add('w-full', 'h-full', 'rounded-none');
              if (icon) icon.className = "fa-solid fa-compress text-xs";
          } else {
              modalWindow.classList.add('max-w-5xl', 'h-[85vh]', 'rounded-2xl');
              modalWindow.classList.remove('w-full', 'h-full', 'rounded-none');
              if (icon) icon.className = "fa-solid fa-expand text-xs";
          }
      });

      // 🛠️ Lance le fetch des statuts dès que le footer HTML est injecté !
      fetchArcStatus();
    }
  };

  // ==========================================
  // 3. FONCTION DE RÉCUPÉRATION DES STATUTS SUPABASE
  // ==========================================
  async function fetchArcStatus() {
    const container = document.getElementById("supabase-api-status-container");
    if (!container) return;

    try {
      // Lecture sécurisée via ton RLS actif (Le SELECT passera à 100%)
      const { data, error } = await supabase
        .from('arc_statut')
        .select('api_name, status');

      if (error) throw error;

      if (data && data.length > 0) {
        container.innerHTML = ""; // On nettoie le loader
        
        data.forEach(api => {
          let badgeColorClass = "";
          let dotColorClass = "";
          let iconHTML = "";

          // Attribution des classes Tailwind selon le statut de l'énumération SQL
          switch (api.status) {
            case 'Normal':
              badgeColorClass = "text-emerald-600 bg-emerald-500/5 border-emerald-500/20";
              dotColorClass = "bg-emerald-500 animate-pulse";
              iconHTML = `<span class="size-1.5 ${dotColorClass} rounded-full"></span>`;
              break;
            case 'Degradé':
            case 'Correction en cours':
              badgeColorClass = "text-amber-600 bg-amber-500/5 border-amber-500/20";
              iconHTML = `<i class="fa-solid fa-triangle-exclamation text-[9px]"></i>`;
              break;
            case 'Maintenanute':
              badgeColorClass = "text-blue-600 bg-blue-500/5 border-blue-500/20";
              iconHTML = `<i class="fa-solid fa-wrench text-[9px]"></i>`;
              break;
            case 'Bloqué':
            case 'close':
            default:
              badgeColorClass = "text-red-600 bg-red-500/5 border-red-500/20";
              iconHTML = `<i class="fa-solid fa-ban text-[9px]"></i>`;
              break;
          }

          // Remplacement des caractères spéciaux du nom pour l'affichage propre
          const cleanName = api.api_name.replace('&', ' & ');

          // Injection propre du composant d'état
          container.innerHTML += `
            <span class="flex items-center gap-2 font-bold px-2 py-1.5 border w-fit uppercase rounded-md ${badgeColorClass}">
              ${iconHTML} ${cleanName} : ${api.status}
            </span>
          `;
        });
      }
    } catch (err) {
      console.error("Erreur de liaison A.R.C. Status:", err.message);
      container.innerHTML = `
        <span class="flex items-center gap-2 text-red-600 font-bold bg-red-500/5 px-2 py-1.5 border border-red-500/20 w-fit uppercase rounded-md">
          <i class="fa-solid fa-circle-xmark"></i> Erreur Matrice Sync
        </span>
      `;
    }
  }

  checkAccess();
  initFooter();
});