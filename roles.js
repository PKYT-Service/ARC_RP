export const rolesData = {
    vendeur: {
        title: "Vendeur & Livreur",
        rules: `
            <div>
                <h2 class="text-xl font-bold uppercase text-white mb-4 flex items-center gap-2"><i class="fas fa-bookmark text-ha-gold text-sm"></i> I. Doctrine Vente & GunShop</h2>
                <ul class="space-y-2 text-sm text-neutral-400 list-disc list-inside ml-4">
                    <li>Vous êtes l'image de Howard Armory. Élégance et courtoisie obligatoires.</li>
                    <li>Vérification stricte de l'identité et des permis (PPA) avant toute transaction.</li>
                    <li>Tolérance zéro sur les "blagues" avec les armes ou le manque de professionnalisme.</li>
                </ul>
            </div>
            <div>
                <h2 class="text-xl font-bold uppercase text-white mb-4 flex items-center gap-2"><i class="fas fa-bookmark text-ha-gold text-sm"></i> II. Sécurité au Comptoir</h2>
                <ul class="space-y-2 text-sm text-neutral-400 list-disc list-inside ml-4">
                    <li>Toujours vérifier qu'une arme est déchargée avant de la tendre au client.</li>
                    <li>Ne jamais laisser une arme sans surveillance sur le comptoir.</li>
                </ul>
            </div>
        `,
        exam1: [
            // --- INFOS RP & PROFIL ---
            "Identité RP (Prénom & Nom) :",
            "Contact (Numéro de téléphone & Discord) :",
            "Pourquoi postuler chez Howard Armory plutôt qu'ailleurs (en une phrase) ?",
            // --- THÉORIE ---
            "Quelle est la procédure exacte avant de remettre une arme à un client ?",
            "Un client demande une arme sans PPA valide, prétextant un oubli. Que fais-tu ?",
            "Est-il autorisé de laisser une arme d'exposition sur le comptoir pour aller en réserve ?"
        ],
        exam2: [
            // --- SCÉNARIOS PRATIQUES ---
            "1. Un client fait des blagues douteuses en braquant une arme (déchargée) vers toi. Ta réaction ?",
            "2. Un client s'énerve et hausse le ton car tu refuses une vente. Comment gères-tu la pression ?",
            "3. Un braquage démarre dans la boutique pendant que tu vends des munitions. Quelle est ta priorité absolue ?",
            "4. Tu surprends un client en train de glisser discrètement un chargeur dans sa poche. Comment l'abordez-vous ?",
            "5. L'agent de sécurité (HA-UAP) a un comportement inapproprié avec un client. Comment interviens-tu ?"
        ]
    },
    securite: {
        title: "Agent de Sécurité (HA-UAP)",
        rules: `
            <div>
                <h2 class="text-xl font-bold uppercase text-white mb-4 flex items-center gap-2"><i class="fas fa-bookmark text-ha-gold text-sm"></i> I. Doctrine et Périmètre</h2>
                <ul class="space-y-2 text-sm text-neutral-400 list-disc list-inside ml-4">
                    <li>Opération exclusive dans l'enceinte du GunShop. L'extérieur relève des forces de l'ordre.</li>
                    <li>La sécurité repose sur la discipline. Tout comportement "cow-boy" est proscrit.</li>
                </ul>
            </div>
            <div>
                <h2 class="text-xl font-bold uppercase text-white mb-4 flex items-center gap-2"><i class="fas fa-bookmark text-ha-gold text-sm"></i> II. Protocole d'Engagement (UGF)</h2>
                <p class="text-sm text-neutral-400 mb-3">Sauf danger de mort immédiat, les 3 sommations sont obligatoires :</p>
                <div class="bg-black/40 p-4 rounded-xl border border-white/5 font-mono text-sm space-y-2">
                    <p><span class="text-ha-red font-bold">1.</span> « Howard Armory Security ! Cessez immédiatement. »</p>
                    <p><span class="text-ha-red font-bold">2.</span> « Reculez ou nous ferons usage de la force. »</p>
                    <p><span class="text-ha-red font-bold">3.</span> « Dernière sommation ! »</p>
                </div>
            </div>
        `,
        exam1: [
             // --- INFOS RP & PROFIL ---
             "Identité RP (Prénom & Nom) :",
             "Contact (Numéro de téléphone & Discord) :",
             "As-tu de l'expérience dans la sécurité ou le maintien de l'ordre ?",
             // --- THÉORIE ---
             "Récite-moi exactement le protocole des 3 sommations.",
             "Où s'arrête strictement ta juridiction en tant qu'agent Howard Armory ?",
             "Dans quel cas précis es-tu autorisé à faire usage de ton 9mm ?"
        ],
        exam2: [
            // --- SCÉNARIOS PRATIQUES ---
            "1. Un client te pousse violemment au torse sans sortir d'arme. Comment ripostes-tu en respectant la gradation ?",
            "2. Un suspect armé sort du magasin en courant après un vol. Le poursuis-tu dans la rue ?",
            "3. Tu entends des coups de feu anormaux provenant du stand de tir de Peterson. Que fais-tu ?",
            "4. Un individu cagoulé refuse d'enlever son masque à l'entrée. Quelle est la procédure ?",
            "5. Un client te provoque verbalement en te filmant avec son téléphone. Comment gardes-tu ton sang-froid ?"
        ]
    },
    stand: {
        title: "Opérateur Stand de Tir",
        rules: `
            <div>
                <h2 class="text-xl font-bold uppercase text-white mb-4 flex items-center gap-2"><i class="fas fa-bookmark text-ha-gold text-sm"></i> I. Sécurité Pas de Tir</h2>
                <ul class="space-y-2 text-sm text-neutral-400 list-disc list-inside ml-4">
                    <li>Muzzle Awareness : Canon toujours orienté vers la cible.</li>
                    <li>Protection auditive et visuelle obligatoires avant d'approcher la ligne.</li>
                </ul>
            </div>
            <div>
                <h2 class="text-xl font-bold uppercase text-white mb-4 flex items-center gap-2"><i class="fas fa-bookmark text-ha-gold text-sm"></i> II. Protocole d'Urgence</h2>
                <ul class="space-y-2 text-sm text-neutral-400 list-disc list-inside ml-4">
                    <li>Autorité absolue de l'opérateur pour expulser un tireur dangereux.</li>
                    <li>En cas d'enrayement, l'arme reste pointée vers la cible avant toute manipulation.</li>
                </ul>
            </div>
        `,
        exam1: [
             // --- INFOS RP & PROFIL ---
             "Identité RP (Prénom & Nom) :",
             "Contact (Numéro de téléphone & Discord) :",
             "Quel est ton niveau de connaissance théorique sur l'armement ?",
             // --- THÉORIE ---
             "Explique la règle du 'Muzzle Awareness' de façon simple pour un novice.",
             "Quelles sont les vérifications obligatoires avant qu'un client ne commence à tirer ?",
             "Un client souhaite utiliser un calibre lourd non autorisé sur ton pas de tir. Que lui dis-tu ?"
        ],
        exam2: [
            // --- SCÉNARIOS PRATIQUES ---
            "1. L'arme d'un client s'enraye, il panique et se retourne vers toi avec l'arme en main. Ton action immédiate ?",
            "2. Un client enlève son casque anti-bruit pour te parler pendant que les autres tirent. Ta réaction ?",
            "3. Un 'expert' autoproclamé conteste tes consignes de sécurité devant d'autres clients. Comment t'imposes-tu ?",
            "4. Un tireur lève son arme trop haut et tire dans le plafond. Que fais-tu ?",
            "5. Un client fait tomber son arme chargée au sol. Comment sécurises-tu le périmètre ?"
        ]
    }
};
