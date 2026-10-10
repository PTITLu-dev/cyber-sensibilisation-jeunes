/* Démo « Sarah » · © 2026 PTIT'Lu · 100% FICTIF · NE CAPTURE AUCUNE DONNÉE */
/* =========================================================================
   config.js — Variables de personnalisation centralisées.
   Tout changer d'un seul endroit. Chargé par toutes les scènes AVANT regie.js.
   Personnage ENTIÈREMENT INVENTÉ. Aucune vraie personne, aucun vrai compte.
   ========================================================================= */

const SARAH = {
  prenom:      "Sarah",
  nom:         "M.",            // nom de famille volontairement tronqué
  pseudo:      "sarah_m2009",
  annee:       "2009",
  anniv:       "14 mars",
  chien:       "Nala",
  sport:       "handball",
  club:        "HBC Valence",   // club FICTIF
  ville:       "Valence",       // à adapter
  mamie_ville: "Die",           // "en vacances chez mamie à ..."
};

/* Valeur dérivée utile (club sans espaces) — calculée ici pour les gabarits {{club_nospace}} */
SARAH.club_nospace = SARAH.club.replace(/\s+/g, "");

/* Rendu global accessible même si regie.js charge après (sécurité) */
window.SARAH = SARAH;
