// =====================================================================
//  Zauber (Zaubertricks und Grade 1–3) und Zauberregeln je Klasse
//  Grundlage: SRD 5.1 (CC-BY-4.0). Die Texte sind eigene, verkürzte
//  deutsche Zusammenfassungen. Entfernungen in Metern (1,5 m = 5 Fuß).
// =====================================================================

export const SCHOOLS = {
  A: 'Bannmagie', C: 'Beschwörung', D: 'Erkenntnismagie', E: 'Verzauberung',
  V: 'Hervorrufung', I: 'Illusion', N: 'Nekromantie', T: 'Verwandlung',
}

// Klassenkürzel → Schlüssel aus srd.js
const CLASS_CODES = { B: 'bard', C: 'cleric', D: 'druid', P: 'paladin', R: 'ranger', S: 'sorcerer', K: 'warlock', W: 'wizard' }

const A = '1 Aktion', BA = '1 Bonusaktion', RE = '1 Reaktion', H = '1 Stunde'

// [Schlüssel, Name, Grad, Schule, Klassen, Zeitaufwand, Reichweite, Komponenten, Dauer, Flags (K=Konzentration, R=Ritual), Wirkung, höherer Grad / Zaubertrick-Würfel]
const RAW = [
  // ---------------------------- Zaubertricks ----------------------------
  ['acid_splash', 'Säurespritzer', 0, 'C', 'SW', A, '18 m', 'V, G', 'sofort', '', 'Eine oder zwei Kreaturen nebeneinander: GES-Rettungswurf, sonst Säureschaden.', '1W6'],
  ['chill_touch', 'Kalte Hand', 0, 'N', 'SKW', A, '36 m', 'V, G', '1 Runde', '', 'Fernkampf-Zauberangriff, nekrotischer Schaden. Das Ziel kann bis zu deinem nächsten Zug keine TP zurückerhalten.', '1W8'],
  ['dancing_lights', 'Tanzende Lichter', 0, 'V', 'BSW', A, '36 m', 'V, G, M', '1 Minute', 'K', 'Bis zu vier schwebende Lichter (je 3 m dämmriges Licht), die du als Bonusaktion bewegst.', ''],
  ['druidcraft', 'Druidenkunst', 0, 'T', 'D', A, '9 m', 'V, G', 'sofort', '', 'Kleine Naturzauber: Wetter vorhersagen, Blume erblühen lassen, harmlose Sinneseffekte.', ''],
  ['eldritch_blast', 'Schauriger Strahl', 0, 'V', 'K', A, '36 m', 'V, G', 'sofort', '', 'Fernkampf-Zauberangriff, 1W10 Energieschaden. Ab Stufe 5, 11 und 17 je ein zusätzlicher Strahl.', ''],
  ['fire_bolt', 'Feuerpfeil', 0, 'V', 'SW', A, '36 m', 'V, G', 'sofort', '', 'Fernkampf-Zauberangriff, Feuerschaden. Entzündet brennbare Gegenstände.', '1W10'],
  ['guidance', 'Göttliche Führung', 0, 'D', 'CD', A, 'Berührung', 'V, G', '1 Minute', 'K', 'Das Ziel addiert einmal 1W4 zu einem Attributswurf seiner Wahl.', ''],
  ['light', 'Licht', 0, 'V', 'BCSW', A, 'Berührung', 'V, M', '1 Stunde', '', 'Ein Gegenstand leuchtet: 6 m helles und weitere 6 m dämmriges Licht.', ''],
  ['mage_hand', 'Magierhand', 0, 'C', 'BSKW', A, '9 m', 'V, G', '1 Minute', '', 'Eine geisterhafte Hand bewegt Dinge bis 5 kg, öffnet Türen, holt Gegenstände.', ''],
  ['mending', 'Ausbessern', 0, 'T', 'BCDSW', '1 Minute', 'Berührung', 'V, G, M', 'sofort', '', 'Repariert einen kleinen Riss oder Bruch in einem Gegenstand.', ''],
  ['message', 'Botschaft', 0, 'T', 'BSW', A, '36 m', 'V, G, M', '1 Runde', '', 'Du flüsterst einer Kreatur eine Nachricht zu, sie kann leise antworten.', ''],
  ['minor_illusion', 'Kleine Illusion', 0, 'I', 'BSKW', A, '9 m', 'G, M', '1 Minute', '', 'Ein Geräusch oder ein Bild (bis 1,5 m Würfel). Nachforschung kann es entlarven.', ''],
  ['poison_spray', 'Giftspritzer', 0, 'C', 'DSKW', A, '3 m', 'V, G', 'sofort', '', 'Eine Kreatur: KON-Rettungswurf, sonst Giftschaden.', '1W12'],
  ['prestidigitation', 'Taschenspielerei', 0, 'T', 'BSKW', A, '3 m', 'V, G', 'bis zu 1 Stunde', '', 'Kleine Zaubertricks: säubern, wärmen, würzen, Kerze anzünden, kleines Zeichen erscheinen lassen.', ''],
  ['produce_flame', 'Flamme erzeugen', 0, 'C', 'D', A, 'selbst', 'V, G', '10 Minuten', '', 'Eine Flamme in der Hand spendet Licht und kann geworfen werden (Fernkampf-Zauberangriff, 9 m, Feuerschaden).', '1W8'],
  ['ray_of_frost', 'Froststrahl', 0, 'V', 'SW', A, '18 m', 'V, G', 'sofort', '', 'Fernkampf-Zauberangriff, Kälteschaden, Bewegung des Ziels −3 m bis zu deinem nächsten Zug.', '1W8'],
  ['resistance', 'Widerstand', 0, 'A', 'CD', A, 'Berührung', 'V, G, M', '1 Minute', 'K', 'Das Ziel addiert einmal 1W4 zu einem Rettungswurf seiner Wahl.', ''],
  ['sacred_flame', 'Heilige Flamme', 0, 'V', 'C', A, '18 m', 'V, G', 'sofort', '', 'GES-Rettungswurf, sonst gleißender Schaden. Deckung hilft nicht.', '1W8'],
  ['shillelagh', 'Shillelagh', 0, 'T', 'D', BA, 'Berührung', 'V, G, M', '1 Minute', '', 'Dein Knüppel oder Kampfstab macht 1W8 Schaden und nutzt dein Zauberattribut für Angriff und Schaden.', ''],
  ['shocking_grasp', 'Schockgriff', 0, 'V', 'SW', A, 'Berührung', 'V, G', 'sofort', '', 'Nahkampf-Zauberangriff (Vorteil gegen Metallrüstung), Blitzschaden; Ziel kann keine Reaktionen nutzen.', '1W8'],
  ['spare_the_dying', 'Verschonung der Sterbenden', 0, 'N', 'C', A, 'Berührung', 'V, G', 'sofort', '', 'Eine lebende Kreatur mit 0 TP ist sofort stabil.', ''],
  ['thaumaturgy', 'Thaumaturgie', 0, 'T', 'C', A, '9 m', 'V', 'bis zu 1 Minute', '', 'Kleine Wunderzeichen: donnernde Stimme, flackernde Flammen, Beben, Türen springen auf.', ''],
  ['true_strike', 'Gezielter Schlag', 0, 'D', 'BSKW', A, '9 m', 'G', '1 Runde', 'K', 'Dein erster Angriff gegen das Ziel im nächsten Zug hat Vorteil.', ''],
  ['vicious_mockery', 'Gehässiger Spott', 0, 'E', 'B', A, '18 m', 'V', 'sofort', '', 'WEI-Rettungswurf, sonst psychischer Schaden und Nachteil auf den nächsten Angriff des Ziels.', '1W4'],

  // ------------------------------- Grad 1 -------------------------------
  ['alarm', 'Alarm', 1, 'A', 'RW', '1 Minute', '9 m', 'V, G, M', '8 Stunden', 'R', 'Ein Bereich (bis 6 m Würfel) meldet dir jeden Eindringling – lautlos im Kopf oder per Glocke.', ''],
  ['animal_friendship', 'Tierfreundschaft', 1, 'E', 'BDR', A, '9 m', 'V, G, M', '24 Stunden', '', 'Ein Tier (INT unter 4): WEI-Rettungswurf, sonst ist es dir freundlich gesinnt.', 'Je Grad ein weiteres Tier.'],
  ['bane', 'Unheil', 1, 'E', 'BC', A, '9 m', 'V, G, M', '1 Minute', 'K', 'Bis zu drei Kreaturen: CHA-Rettungswurf, sonst −1W4 auf Angriffe und Rettungswürfe.', 'Je Grad ein weiteres Ziel.'],
  ['bless', 'Segen', 1, 'E', 'CP', A, '9 m', 'V, G, M', '1 Minute', 'K', 'Bis zu drei Kreaturen addieren 1W4 zu Angriffs- und Rettungswürfen.', 'Je Grad ein weiteres Ziel.'],
  ['burning_hands', 'Brennende Hände', 1, 'V', 'SW', A, 'selbst (4,5-m-Kegel)', 'V, G', 'sofort', '', 'GES-Rettungswurf, 3W6 Feuerschaden (halb bei Erfolg).', '+1W6 je Grad über 1.'],
  ['charm_person', 'Person bezaubern', 1, 'E', 'BDSKW', A, '9 m', 'V, G', '1 Stunde', '', 'Ein Humanoider: WEI-Rettungswurf (Vorteil im Kampf), sonst ist er dir freundlich gesinnt.', 'Je Grad ein weiteres Ziel.'],
  ['color_spray', 'Farbenspiel', 1, 'I', 'SW', A, 'selbst (4,5-m-Kegel)', 'V, G, M', '1 Runde', '', 'Würfle 6W10: So viele TP an Kreaturen (die schwächsten zuerst) sind geblendet.', '+2W10 je Grad über 1.'],
  ['command', 'Befehl', 1, 'E', 'CP', A, '18 m', 'V', '1 Runde', '', 'Ein Wort-Befehl (z. B. „Flieh!“, „Hinlegen!“): WEI-Rettungswurf, sonst gehorcht das Ziel.', 'Je Grad ein weiteres Ziel.'],
  ['comprehend_languages', 'Sprachen verstehen', 1, 'D', 'BSKW', A, 'selbst', 'V, G, M', '1 Stunde', 'R', 'Du verstehst jede gesprochene und geschriebene Sprache.', ''],
  ['create_destroy_water', 'Wasser erschaffen oder vernichten', 1, 'T', 'CD', A, '9 m', 'V, G, M', 'sofort', '', 'Bis zu 40 Liter Wasser erschaffen oder vernichten (auch Nebel).', 'Mehr Wasser je Grad.'],
  ['cure_wounds', 'Wunden heilen', 1, 'V', 'BCDPR', A, 'Berührung', 'V, G', 'sofort', '', 'Heilt 1W8 + Zaubermodifikator TP.', '+1W8 je Grad über 1.'],
  ['detect_evil_good', 'Gutes und Böses entdecken', 1, 'D', 'CP', A, 'selbst', 'V, G', '10 Minuten', 'K', 'Du spürst Aberrationen, Himmlische, Elementare, Feenwesen, Unholde und Untote in 9 m.', ''],
  ['detect_magic', 'Magie entdecken', 1, 'D', 'BCDPRSW', A, 'selbst', 'V, G', '10 Minuten', 'KR', 'Du spürst Magie in 9 m und siehst ihre Aura und Schule.', ''],
  ['detect_poison', 'Gift und Krankheit entdecken', 1, 'D', 'CDPR', A, 'selbst', 'V, G, M', '10 Minuten', 'KR', 'Du spürst Gifte, giftige Kreaturen und Krankheiten in 9 m.', ''],
  ['disguise_self', 'Selbstverkleidung', 1, 'I', 'BSW', A, 'selbst', 'V, G', '1 Stunde', '', 'Du siehst anders aus (Kleidung, Größe ±30 cm). Nachforschung kann es entlarven.', ''],
  ['divine_favor', 'Göttliche Gunst', 1, 'V', 'P', BA, 'selbst', 'V, G', '1 Minute', 'K', 'Deine Waffenangriffe machen +1W4 gleißenden Schaden.', ''],
  ['entangle', 'Verstricken', 1, 'C', 'D', A, '27 m', 'V, G', '1 Minute', 'K', 'Ranken in 6 × 6 m: STÄ-Rettungswurf, sonst festgesetzt. Schwieriges Gelände.', ''],
  ['expeditious_retreat', 'Schneller Rückzug', 1, 'T', 'SKW', BA, 'selbst', 'V, G', '10 Minuten', 'K', 'Du kannst jeden Zug als Bonusaktion spurten.', ''],
  ['faerie_fire', 'Feenfeuer', 1, 'V', 'BD', A, '18 m', 'V', '1 Minute', 'K', 'Würfel von 6 m: GES-Rettungswurf, sonst leuchten die Ziele – Angriffe gegen sie haben Vorteil, Unsichtbarkeit hilft nicht.', ''],
  ['false_life', 'Falsches Leben', 1, 'N', 'SW', A, 'selbst', 'V, G, M', '1 Stunde', '', 'Du erhältst 1W4 + 4 temporäre TP.', '+5 temporäre TP je Grad über 1.'],
  ['feather_fall', 'Federfall', 1, 'T', 'BSW', RE, '18 m', 'V, M', '1 Minute', '', 'Bis zu fünf fallende Kreaturen sinken langsam und nehmen keinen Fallschaden.', ''],
  ['find_familiar', 'Vertrauten finden', 1, 'C', 'W', '1 Stunde', '3 m', 'V, G, M', 'sofort', 'R', 'Du rufst einen Vertrauten (z. B. Eule, Katze, Rabe), der dir dient und durch dessen Sinne du schauen kannst.', ''],
  ['floating_disk', 'Schwebende Scheibe', 1, 'C', 'W', A, '9 m', 'V, G, M', '1 Stunde', 'R', 'Eine schwebende Scheibe trägt bis 250 kg und folgt dir.', ''],
  ['fog_cloud', 'Nebelwolke', 1, 'C', 'DRSW', A, '36 m', 'V, G', '1 Stunde', 'K', 'Eine Nebelkugel mit 6 m Radius verdeckt die Sicht vollständig.', '+6 m Radius je Grad über 1.'],
  ['goodberry', 'Gute Beeren', 1, 'T', 'DR', A, 'Berührung', 'V, G, M', 'sofort', '', 'Zehn Beeren, jede heilt 1 TP und ersetzt eine Tagesration.', ''],
  ['grease', 'Schmieren', 1, 'C', 'W', A, '18 m', 'V, G, M', '1 Minute', '', '3 × 3 m rutschiger Boden: GES-Rettungswurf, sonst liegend. Schwieriges Gelände.', ''],
  ['guiding_bolt', 'Lenkendes Geschoss', 1, 'V', 'C', A, '36 m', 'V, G', '1 Runde', '', 'Fernkampf-Zauberangriff, 4W6 gleißender Schaden; der nächste Angriff gegen das Ziel hat Vorteil.', '+1W6 je Grad über 1.'],
  ['healing_word', 'Heilendes Wort', 1, 'V', 'BCD', BA, '18 m', 'V', 'sofort', '', 'Heilt 1W4 + Zaubermodifikator TP – auf Entfernung und als Bonusaktion.', '+1W4 je Grad über 1.'],
  ['hellish_rebuke', 'Höllischer Tadel', 1, 'V', 'K', RE, '18 m', 'V, G', 'sofort', '', 'Wenn dich jemand verletzt: GES-Rettungswurf, 2W10 Feuerschaden (halb bei Erfolg).', '+1W10 je Grad über 1.'],
  ['heroism', 'Heldenmut', 1, 'E', 'BP', A, 'Berührung', 'V, G', '1 Minute', 'K', 'Immun gegen Verängstigung, zu Beginn jedes Zuges temporäre TP = Zaubermodifikator.', 'Je Grad ein weiteres Ziel.'],
  ['hideous_laughter', 'Fürchterliches Gelächter', 1, 'E', 'BW', A, '9 m', 'V, G, M', '1 Minute', 'K', 'WEI-Rettungswurf, sonst liegt das Ziel lachend am Boden und ist kampfunfähig.', ''],
  ['hunters_mark', 'Mal des Jägers', 1, 'D', 'R', BA, '27 m', 'V', '1 Stunde', 'K', 'Deine Waffentreffer gegen das Ziel machen +1W6 Schaden; Vorteil beim Aufspüren.', 'Längere Dauer bei Grad 3+ (8 Std.).'],
  ['identify', 'Identifizieren', 1, 'D', 'BW', '1 Minute', 'Berührung', 'V, G, M', 'sofort', 'R', 'Du erfährst die Eigenschaften eines magischen Gegenstands.', ''],
  ['illusory_script', 'Illusionsschrift', 1, 'I', 'BKW', '1 Minute', 'Berührung', 'G, M', '10 Tage', 'R', 'Eine geheime Nachricht, die nur bestimmte Personen lesen können.', ''],
  ['inflict_wounds', 'Wunden verursachen', 1, 'N', 'C', A, 'Berührung', 'V, G', 'sofort', '', 'Nahkampf-Zauberangriff, 3W10 nekrotischer Schaden.', '+1W10 je Grad über 1.'],
  ['jump', 'Springen', 1, 'T', 'DRSW', BA, 'Berührung', 'V, G, M', '1 Minute', '', 'Die Sprungweite des Ziels verdreifacht sich.', ''],
  ['longstrider', 'Weiter Schritt', 1, 'T', 'BDRW', A, 'Berührung', 'V, G, M', '1 Stunde', '', 'Die Bewegungsrate des Ziels steigt um 3 m.', 'Je Grad ein weiteres Ziel.'],
  ['mage_armor', 'Magierrüstung', 1, 'A', 'SW', A, 'Berührung', 'V, G, M', '8 Stunden', '', 'Ohne Rüstung beträgt die RK des Ziels 13 + GES-Modifikator.', ''],
  ['magic_missile', 'Magisches Geschoss', 1, 'V', 'SW', A, '36 m', 'V, G', 'sofort', '', 'Drei Geschosse treffen automatisch, je 1W4 + 1 Energieschaden.', '+1 Geschoss je Grad über 1.'],
  ['protection_evil_good', 'Schutz vor Gut und Böse', 1, 'A', 'CPKW', A, 'Berührung', 'V, G, M', '10 Minuten', 'K', 'Bestimmte Kreaturen (Unholde, Untote …) haben Nachteil gegen das Ziel und können es nicht bezaubern.', ''],
  ['purify_food', 'Speise und Trank reinigen', 1, 'T', 'CDP', A, '3 m', 'V, G', 'sofort', 'R', 'Entfernt Gift und Krankheit aus Essen und Trinken.', ''],
  ['sanctuary', 'Heiligtum', 1, 'A', 'C', BA, '9 m', 'V, G, M', '1 Minute', '', 'Wer das Ziel angreifen will, muss erst einen WEI-Rettungswurf schaffen.', ''],
  ['shield', 'Schild', 1, 'A', 'SW', RE, 'selbst', 'V, G', '1 Runde', '', 'Als Reaktion auf einen Treffer: +5 RK bis zu deinem nächsten Zug, kein Schaden durch Magisches Geschoss.', ''],
  ['shield_of_faith', 'Schild des Glaubens', 1, 'A', 'CP', BA, '18 m', 'V, G, M', '10 Minuten', 'K', 'Das Ziel erhält +2 RK.', ''],
  ['silent_image', 'Lautloses Trugbild', 1, 'I', 'BSW', A, '18 m', 'V, G, M', '10 Minuten', 'K', 'Ein bewegliches Bild (bis 4,5 m Würfel) ohne Geräusch oder Geruch.', ''],
  ['sleep', 'Schlaf', 1, 'E', 'BSW', A, '27 m', 'V, G, M', '1 Minute', '', 'Würfle 5W8: So viele TP an Kreaturen (die schwächsten zuerst) schlafen ein.', '+2W8 je Grad über 1.'],
  ['speak_with_animals', 'Mit Tieren sprechen', 1, 'D', 'BDR', A, 'selbst', 'V, G', '10 Minuten', 'R', 'Du kannst mit Tieren sprechen und sie verstehen.', ''],
  ['thunderwave', 'Donnerwoge', 1, 'V', 'BDSW', A, 'selbst (4,5-m-Würfel)', 'V, G', 'sofort', '', 'KON-Rettungswurf, 2W8 Schallschaden und 3 m weggestoßen (halb, kein Stoß bei Erfolg). Laut!', '+1W8 je Grad über 1.'],
  ['unseen_servant', 'Unsichtbarer Diener', 1, 'C', 'BKW', A, '18 m', 'V, G, M', '1 Stunde', 'R', 'Eine unsichtbare Kraft erledigt einfache Aufgaben für dich.', ''],

  // ------------------------------- Grad 2 -------------------------------
  ['acid_arrow', 'Säurepfeil', 2, 'V', 'W', A, '27 m', 'V, G, M', 'sofort', '', 'Fernkampf-Zauberangriff, 4W4 Säureschaden sofort und 2W4 am Ende des nächsten Zuges.', '+1W4 (beide Teile) je Grad über 2.'],
  ['aid', 'Hilfe', 2, 'A', 'CP', A, '9 m', 'V, G, M', '8 Stunden', '', 'Bis zu drei Kreaturen: maximale und aktuelle TP +5.', '+5 TP je Grad über 2.'],
  ['alter_self', 'Selbstveränderung', 2, 'T', 'SW', A, 'selbst', 'V, G', '1 Stunde', 'K', 'Kiemen und Schwimmen, anderes Aussehen oder natürliche Waffen (1W6).', ''],
  ['animal_messenger', 'Tierbote', 2, 'E', 'BDR', A, '9 m', 'V, G, M', '24 Stunden', 'R', 'Ein kleines Tier überbringt eine kurze Nachricht an einen Ort.', ''],
  ['arcane_lock', 'Arkanes Schloss', 2, 'A', 'W', A, 'Berührung', 'V, G, M', 'permanent', '', 'Eine Tür oder Truhe ist magisch verschlossen.', ''],
  ['augury', 'Weissagung', 2, 'D', 'C', '1 Minute', 'selbst', 'V, G, M', 'sofort', 'R', 'Du erfährst, ob eine Handlung in den nächsten 30 Minuten Wohl, Weh, beides oder nichts bringt.', ''],
  ['barkskin', 'Rindenhaut', 2, 'T', 'DR', A, 'Berührung', 'V, G, M', '1 Stunde', 'K', 'Die RK des Ziels beträgt mindestens 16.', ''],
  ['blindness_deafness', 'Blindheit/Taubheit', 2, 'N', 'BCSW', A, '9 m', 'V', '1 Minute', '', 'KON-Rettungswurf, sonst blind oder taub (Wiederholung am Ende jedes Zuges).', 'Je Grad ein weiteres Ziel.'],
  ['blur', 'Verschwimmen', 2, 'I', 'SW', A, 'selbst', 'V', '1 Minute', 'K', 'Angriffe gegen dich haben Nachteil.', ''],
  ['calm_emotions', 'Gefühle besänftigen', 2, 'E', 'BC', A, '18 m', 'V, G', '1 Minute', 'K', 'Kreaturen in 6 m: CHA-Rettungswurf, sonst keine Verängstigung/Bezauberung oder keine Feindseligkeit.', ''],
  ['continual_flame', 'Immerwährende Flamme', 2, 'V', 'CW', A, 'Berührung', 'V, G, M', 'bis gebannt', '', 'Eine Flamme ohne Hitze, die ewig leuchtet.', ''],
  ['darkness', 'Dunkelheit', 2, 'V', 'SKW', A, '18 m', 'V, M', '10 Minuten', 'K', 'Magische Dunkelheit (4,5 m Radius), selbst Dunkelsicht hilft nicht.', ''],
  ['darkvision', 'Dunkelsicht', 2, 'T', 'DRSW', A, 'Berührung', 'V, G, M', '8 Stunden', '', 'Das Ziel sieht im Dunkeln bis 18 m weit.', ''],
  ['detect_thoughts', 'Gedanken wahrnehmen', 2, 'D', 'BSW', A, 'selbst', 'V, G, M', '1 Minute', 'K', 'Du liest oberflächliche Gedanken von Kreaturen in 9 m.', ''],
  ['enhance_ability', 'Attribut verbessern', 2, 'T', 'BCDS', A, 'Berührung', 'V, G, M', '1 Stunde', 'K', 'Vorteil auf Würfe eines Attributs (z. B. Stärke des Bären: plus Traglast).', 'Je Grad ein weiteres Ziel.'],
  ['enlarge_reduce', 'Vergrößern/Verkleinern', 2, 'T', 'SW', A, '9 m', 'V, G, M', '1 Minute', 'K', 'Doppelte Größe (+1W4 Waffenschaden, Vorteil STÄ) oder halbe Größe (−1W4, Nachteil STÄ).', ''],
  ['enthrall', 'Bannen', 2, 'E', 'BK', A, '18 m', 'V, G', '1 Minute', '', 'Kreaturen, die dich hören: WEI-Rettungswurf, sonst Nachteil darauf, etwas anderes zu bemerken.', ''],
  ['find_steed', 'Reittier finden', 2, 'C', 'P', '10 Minuten', '9 m', 'V, G', 'sofort', '', 'Ein treues, kluges Reittier (z. B. Kriegspferd) erscheint.', ''],
  ['find_traps', 'Fallen finden', 2, 'D', 'CDR', A, '36 m', 'V, G', 'sofort', '', 'Du spürst, ob es in Sichtweite Fallen gibt (nicht genau wo).', ''],
  ['flame_blade', 'Flammenklinge', 2, 'V', 'D', BA, 'selbst', 'V, G, M', '10 Minuten', 'K', 'Eine Feuerklinge: Nahkampf-Zauberangriff, 3W6 Feuerschaden.', '+1W6 je zwei Grade über 2.'],
  ['flaming_sphere', 'Flammenkugel', 2, 'C', 'DW', A, '18 m', 'V, G, M', '1 Minute', 'K', 'Eine Feuerkugel, die du bewegst: GES-Rettungswurf, 2W6 Feuerschaden.', '+1W6 je Grad über 2.'],
  ['gentle_repose', 'Sanfte Ruhe', 2, 'N', 'CW', A, 'Berührung', 'V, G, M', '10 Tage', 'R', 'Ein Leichnam verwest nicht und kann nicht zum Untoten werden.', ''],
  ['gust_of_wind', 'Windstoß', 2, 'V', 'DSW', A, 'selbst (18-m-Linie)', 'V, G, M', '1 Minute', 'K', 'Starker Wind: STÄ-Rettungswurf, sonst 4,5 m weggeweht. Löscht Flammen.', ''],
  ['heat_metal', 'Metall erhitzen', 2, 'T', 'BD', A, '18 m', 'V, G, M', '1 Minute', 'K', 'Ein Metallgegenstand glüht: 2W8 Feuerschaden, wer ihn hält, hat Nachteil.', '+1W8 je Grad über 2.'],
  ['hold_person', 'Person festhalten', 2, 'E', 'BCDSKW', A, '18 m', 'V, G, M', '1 Minute', 'K', 'Ein Humanoider: WEI-Rettungswurf, sonst gelähmt (Wiederholung am Ende jedes Zuges).', 'Je Grad ein weiteres Ziel.'],
  ['invisibility', 'Unsichtbarkeit', 2, 'I', 'BSKW', A, 'Berührung', 'V, G, M', '1 Stunde', 'K', 'Das Ziel ist unsichtbar, bis es angreift oder zaubert.', 'Je Grad ein weiteres Ziel.'],
  ['knock', 'Klopfen', 2, 'T', 'BSW', A, '18 m', 'V', 'sofort', '', 'Ein Schloss oder Riegel springt auf – mit lautem Klopfen.', ''],
  ['lesser_restoration', 'Schwache Genesung', 2, 'A', 'BCDPR', A, 'Berührung', 'V, G', 'sofort', '', 'Beendet Blindheit, Taubheit, Lähmung, Vergiftung oder eine Krankheit.', ''],
  ['levitate', 'Schweben', 2, 'T', 'SW', A, '18 m', 'V, G, M', '10 Minuten', 'K', 'Eine Kreatur oder ein Gegenstand schwebt bis 6 m hoch.', ''],
  ['locate_animals_plants', 'Tiere oder Pflanzen aufspüren', 2, 'D', 'BDR', A, 'selbst', 'V, G, M', 'sofort', 'R', 'Du findest die nächste Tier- oder Pflanzenart deiner Wahl in 7,5 km.', ''],
  ['locate_object', 'Gegenstand aufspüren', 2, 'D', 'BCDPRW', A, 'selbst', 'V, G, M', '10 Minuten', 'K', 'Du spürst die Richtung zu einem bekannten Gegenstand in 300 m.', ''],
  ['magic_mouth', 'Magischer Mund', 2, 'I', 'BW', '1 Minute', '9 m', 'V, G, M', 'bis ausgelöst', 'R', 'Ein Gegenstand spricht eine Nachricht, wenn eine Bedingung eintritt.', ''],
  ['magic_weapon', 'Magische Waffe', 2, 'T', 'PW', BA, 'Berührung', 'V, G', '1 Stunde', 'K', 'Eine Waffe wird magisch: +1 auf Angriff und Schaden.', '+2 ab Grad 4, +3 ab Grad 6.'],
  ['mirror_image', 'Spiegelbilder', 2, 'I', 'SKW', A, 'selbst', 'V, G', '1 Minute', '', 'Drei Trugbilder von dir lenken Angriffe ab.', ''],
  ['misty_step', 'Nebelschritt', 2, 'C', 'SKW', BA, 'selbst', 'V', 'sofort', '', 'Du teleportierst dich bis zu 9 m an eine Stelle, die du siehst.', ''],
  ['moonbeam', 'Mondstrahl', 2, 'V', 'D', A, '36 m', 'V, G, M', '1 Minute', 'K', 'Ein Lichtzylinder: KON-Rettungswurf, 2W10 gleißender Schaden. Als Aktion verschiebbar.', '+1W10 je Grad über 2.'],
  ['pass_without_trace', 'Spurloses Gehen', 2, 'A', 'DR', A, 'selbst', 'V, G, M', '1 Stunde', 'K', 'Du und Verbündete in 9 m erhalten +10 auf Heimlichkeit und hinterlassen keine Spuren.', ''],
  ['prayer_of_healing', 'Heilendes Gebet', 2, 'V', 'C', '10 Minuten', '9 m', 'V', 'sofort', '', 'Bis zu sechs Kreaturen heilen je 2W8 + Zaubermodifikator TP.', '+1W8 je Grad über 2.'],
  ['protection_from_poison', 'Schutz vor Gift', 2, 'A', 'CDPR', A, 'Berührung', 'V, G', '1 Stunde', '', 'Neutralisiert ein Gift; danach Vorteil gegen Vergiftung und Resistenz gegen Giftschaden.', ''],
  ['ray_of_enfeeblement', 'Strahl der Schwächung', 2, 'N', 'KW', A, '18 m', 'V, G', '1 Minute', 'K', 'Fernkampf-Zauberangriff: Das Ziel macht mit STÄ-Waffen nur halben Schaden.', ''],
  ['rope_trick', 'Seiltrick', 2, 'T', 'W', A, 'Berührung', 'V, G, M', '1 Stunde', '', 'Ein Seil führt in einen verborgenen Raum für bis zu acht Kreaturen.', ''],
  ['scorching_ray', 'Sengender Strahl', 2, 'V', 'SW', A, '36 m', 'V, G', 'sofort', '', 'Drei Strahlen, je Fernkampf-Zauberangriff mit 2W6 Feuerschaden.', '+1 Strahl je Grad über 2.'],
  ['see_invisibility', 'Unsichtbares sehen', 2, 'D', 'BSW', A, 'selbst', 'V, G, M', '1 Stunde', '', 'Du siehst unsichtbare Kreaturen und Gegenstände.', ''],
  ['shatter', 'Zerschmettern', 2, 'V', 'BSKW', A, '18 m', 'V, G, M', 'sofort', '', 'Ohrenbetäubender Klang (3 m Radius): KON-Rettungswurf, 3W8 Schallschaden.', '+1W8 je Grad über 2.'],
  ['silence', 'Stille', 2, 'I', 'BCR', A, '36 m', 'V, G', '10 Minuten', 'KR', 'Kugel (6 m Radius) ohne jedes Geräusch – darin kann man nicht mit Worten zaubern.', ''],
  ['spider_climb', 'Spinnenklettern', 2, 'T', 'SKW', A, 'Berührung', 'V, G, M', '1 Stunde', 'K', 'Das Ziel klettert an Wänden und Decken wie eine Spinne.', ''],
  ['spiritual_weapon', 'Spirituelle Waffe', 2, 'V', 'C', BA, '18 m', 'V, G', '1 Minute', '', 'Eine schwebende Waffe greift als Bonusaktion an: 1W8 + Zaubermodifikator Energieschaden.', '+1W8 je zwei Grade über 2.'],
  ['suggestion', 'Einflüsterung', 2, 'E', 'BSKW', A, '9 m', 'V, M', '8 Stunden', 'K', 'WEI-Rettungswurf, sonst folgt das Ziel einem vernünftig klingenden Vorschlag.', ''],
  ['warding_bond', 'Schutzbund', 2, 'A', 'C', A, 'Berührung', 'V, G, M', '1 Stunde', '', 'Das Ziel erhält +1 RK, +1 auf Rettungswürfe und Resistenz – du nimmst den gleichen Schaden.', ''],
  ['web', 'Netz', 2, 'C', 'SW', A, '18 m', 'V, G, M', '1 Stunde', 'K', 'Klebrige Netze (6 m Würfel): GES-Rettungswurf, sonst festgesetzt.', ''],
  ['zone_of_truth', 'Zone der Wahrheit', 2, 'E', 'BCP', A, '18 m', 'V, G', '10 Minuten', '', 'Wer in der Zone den Rettungswurf nicht schafft, kann nicht bewusst lügen.', ''],

  // ------------------------------- Grad 3 -------------------------------
  ['animate_dead', 'Tote beleben', 3, 'N', 'CW', '1 Minute', '3 m', 'V, G, M', 'sofort', '', 'Ein Skelett oder Zombie erhebt sich und gehorcht dir 24 Stunden.', '+2 Untote je Grad über 3.'],
  ['beacon_of_hope', 'Leuchtfeuer der Hoffnung', 3, 'A', 'C', A, '9 m', 'V, G', '1 Minute', 'K', 'Ziele haben Vorteil auf WEI- und Todesrettungswürfe und heilen immer den Höchstwert.', ''],
  ['bestow_curse', 'Fluch', 3, 'N', 'BCW', A, 'Berührung', 'V, G', '1 Minute', 'K', 'WEI-Rettungswurf, sonst verflucht (z. B. Nachteil, verlorene Züge oder +1W8 nekrotischer Schaden).', 'Längere Dauer bei höherem Grad.'],
  ['blink', 'Blinzeln', 3, 'T', 'SW', A, 'selbst', 'V, G', '1 Minute', '', 'Am Ende jedes Zuges: Bei 11+ auf 1W20 verschwindest du bis zu deinem nächsten Zug in die Ätherebene.', ''],
  ['call_lightning', 'Blitze herbeirufen', 3, 'C', 'D', A, '36 m', 'V, G', '10 Minuten', 'K', 'Eine Gewitterwolke: Jeder Zug ein Blitz, GES-Rettungswurf, 3W10 Blitzschaden.', '+1W10 je Grad über 3.'],
  ['clairvoyance', 'Hellsehen', 3, 'D', 'BCSW', '10 Minuten', '1,5 km', 'V, G, M', '10 Minuten', 'K', 'Ein unsichtbarer Sensor an einem bekannten Ort – du siehst oder hörst dort.', ''],
  ['conjure_animals', 'Tiere herbeirufen', 3, 'C', 'DR', A, '18 m', 'V, G', '1 Stunde', 'K', 'Feengeister in Tiergestalt kämpfen für dich (z. B. acht Wölfe mit HG ¼).', 'Mehr Tiere bei höherem Grad.'],
  ['counterspell', 'Gegenzauber', 3, 'A', 'SKW', RE, '18 m', 'G', 'sofort', '', 'Unterbricht einen Zauber bis Grad 3; höhere Grade mit Attributswurf.', 'Bricht automatisch Zauber bis zum genutzten Grad.'],
  ['create_food_water', 'Nahrung und Wasser erschaffen', 3, 'C', 'CP', A, '9 m', 'V, G', 'sofort', '', 'Essen und Wasser für 15 Personen oder 5 Reittiere für einen Tag.', ''],
  ['daylight', 'Tageslicht', 3, 'V', 'CDPRS', A, '18 m', 'V, G', '1 Stunde', '', 'Helles Licht im Radius von 18 m, vertreibt magische Dunkelheit bis Grad 3.', ''],
  ['dispel_magic', 'Magie bannen', 3, 'A', 'BCDPSKW', A, '36 m', 'V, G', 'sofort', '', 'Beendet Zauber bis Grad 3 auf einem Ziel; höhere Grade mit Attributswurf.', 'Bannt automatisch bis zum genutzten Grad.'],
  ['fear', 'Furcht', 3, 'I', 'BSKW', A, 'selbst (9-m-Kegel)', 'V, G, M', '1 Minute', 'K', 'WEI-Rettungswurf, sonst verängstigt, lässt alles fallen und flieht.', ''],
  ['fireball', 'Feuerball', 3, 'V', 'SW', A, '45 m', 'V, G, M', 'sofort', '', 'Explosion mit 6 m Radius: GES-Rettungswurf, 8W6 Feuerschaden (halb bei Erfolg).', '+1W6 je Grad über 3.'],
  ['fly', 'Fliegen', 3, 'T', 'SKW', A, 'Berührung', 'V, G, M', '10 Minuten', 'K', 'Das Ziel kann mit 18 m fliegen.', 'Je Grad ein weiteres Ziel.'],
  ['gaseous_form', 'Gasförmige Gestalt', 3, 'T', 'SKW', A, 'Berührung', 'V, G, M', '1 Stunde', 'K', 'Das Ziel wird zu Nebel: fliegt langsam, passt durch Ritzen, Resistenz gegen Waffenschaden.', ''],
  ['glyph_of_warding', 'Glyphe des Schutzes', 3, 'A', 'BCW', H, 'Berührung', 'V, G, M', 'bis ausgelöst', '', 'Eine versteckte Glyphe explodiert (5W8) oder löst einen gespeicherten Zauber aus.', '+1W8 je Grad über 3.'],
  ['haste', 'Hast', 3, 'T', 'SW', A, '9 m', 'V, G, M', '1 Minute', 'K', 'Doppelte Bewegung, +2 RK, Vorteil auf GES-Rettungswürfe, eine zusätzliche Aktion. Danach eine Runde gelähmt vor Müdigkeit.', ''],
  ['hypnotic_pattern', 'Hypnotisches Muster', 3, 'I', 'BSKW', A, '36 m', 'G, M', '1 Minute', 'K', 'Bunte Muster (9 m Würfel): WEI-Rettungswurf, sonst bezaubert und kampfunfähig.', ''],
  ['lightning_bolt', 'Blitz', 3, 'V', 'SW', A, 'selbst (30-m-Linie)', 'V, G, M', 'sofort', '', 'GES-Rettungswurf, 8W6 Blitzschaden (halb bei Erfolg).', '+1W6 je Grad über 3.'],
  ['magic_circle', 'Magischer Zirkel', 3, 'A', 'CPKW', '1 Minute', '3 m', 'V, G, M', '1 Stunde', '', 'Ein Zylinder hält bestimmte Kreaturen (z. B. Unholde) fern oder gefangen.', 'Längere Dauer bei höherem Grad.'],
  ['major_image', 'Großes Trugbild', 3, 'I', 'BSKW', A, '36 m', 'V, G, M', '10 Minuten', 'K', 'Ein Trugbild mit Geräusch, Geruch und Temperatur (bis 6 m Würfel).', 'Ab Grad 6 dauerhaft.'],
  ['mass_healing_word', 'Massenheilendes Wort', 3, 'V', 'C', BA, '18 m', 'V', 'sofort', '', 'Bis zu sechs Kreaturen heilen je 1W4 + Zaubermodifikator TP.', '+1W4 je Grad über 3.'],
  ['meld_into_stone', 'Mit Stein verschmelzen', 3, 'T', 'CD', A, 'Berührung', 'V, G', '8 Stunden', 'R', 'Du verschmilzt mit einer Steinfläche und bist darin verborgen.', ''],
  ['nondetection', 'Unauffindbarkeit', 3, 'A', 'BRW', A, 'Berührung', 'V, G, M', '8 Stunden', '', 'Das Ziel kann nicht durch Erkenntnismagie aufgespürt werden.', ''],
  ['plant_growth', 'Pflanzenwachstum', 3, 'T', 'BDR', A, '45 m', 'V, G', 'sofort', '', 'Pflanzen wuchern (Bewegung kostet vierfach) oder werden 8 Stunden lang fruchtbar.', ''],
  ['protection_from_energy', 'Schutz vor Energie', 3, 'A', 'CDRSW', A, 'Berührung', 'V, G', '1 Stunde', 'K', 'Resistenz gegen Säure, Kälte, Feuer, Blitz oder Schall.', ''],
  ['remove_curse', 'Fluch brechen', 3, 'A', 'CPKW', A, 'Berührung', 'V, G', 'sofort', '', 'Beendet alle Flüche auf einer Kreatur oder einem Gegenstand.', ''],
  ['revivify', 'Wiederbeleben', 3, 'N', 'CP', A, 'Berührung', 'V, G, M', 'sofort', '', 'Eine Kreatur, die vor höchstens 1 Minute starb, lebt mit 1 TP wieder (Diamant 300 GM).', ''],
  ['sending', 'Nachricht senden', 3, 'V', 'BCW', A, 'unbegrenzt', 'V, G, M', '1 Runde', '', 'Eine kurze Nachricht (25 Wörter) an eine bekannte Kreatur, sie kann antworten.', ''],
  ['sleet_storm', 'Schneeregensturm', 3, 'C', 'DSW', A, '45 m', 'V, G, M', '1 Minute', 'K', 'Eisregen (12 m Radius): schwieriges Gelände, verdeckt Sicht, GES-Rettungswurf oder liegend.', ''],
  ['slow', 'Verlangsamen', 3, 'T', 'SW', A, '36 m', 'V, G, M', '1 Minute', 'K', 'Bis zu sechs Ziele: WEI-Rettungswurf, sonst −2 RK, halbe Bewegung, keine Reaktionen.', ''],
  ['speak_with_dead', 'Mit Toten sprechen', 3, 'N', 'BC', A, '3 m', 'V, G, M', '10 Minuten', '', 'Ein Leichnam beantwortet bis zu fünf Fragen.', ''],
  ['speak_with_plants', 'Mit Pflanzen sprechen', 3, 'T', 'BDR', A, 'selbst', 'V, G', '10 Minuten', '', 'Pflanzen in 9 m geben Auskunft und machen dir Platz.', ''],
  ['spirit_guardians', 'Geistige Wächter', 3, 'C', 'C', A, 'selbst (4,5 m Radius)', 'V, G, M', '10 Minuten', 'K', 'Geister umkreisen dich: Feinde halbieren ihre Bewegung, WEI-Rettungswurf, 3W8 Schaden.', '+1W8 je Grad über 3.'],
  ['stinking_cloud', 'Stinkende Wolke', 3, 'C', 'BSW', A, '27 m', 'V, G, M', '1 Minute', 'K', 'Übelkeit erregender Nebel (6 m Radius): KON-Rettungswurf, sonst verliert man seine Aktion.', ''],
  ['tongues', 'Zungen', 3, 'D', 'BCSKW', A, 'Berührung', 'V, M', '1 Stunde', '', 'Das Ziel versteht und spricht jede Sprache.', ''],
  ['vampiric_touch', 'Vampirgriff', 3, 'N', 'KW', A, 'selbst', 'V, G', '1 Minute', 'K', 'Nahkampf-Zauberangriff, 3W6 nekrotischer Schaden – du heilst die Hälfte.', '+1W6 je Grad über 3.'],
  ['water_breathing', 'Wasseratmung', 3, 'T', 'DRSW', A, '9 m', 'V, G, M', '24 Stunden', 'R', 'Bis zu zehn Kreaturen können unter Wasser atmen.', ''],
  ['water_walk', 'Wasserwandeln', 3, 'T', 'CDRS', A, '9 m', 'V, G, M', '1 Stunde', 'R', 'Bis zu zehn Kreaturen laufen über Flüssigkeiten wie über Boden.', ''],
  ['wind_wall', 'Windwall', 3, 'V', 'DR', A, '36 m', 'V, G, M', '1 Minute', 'K', 'Eine Wand aus Sturm hält Geschosse und Gase ab. STÄ-Rettungswurf, 3W8 Wuchtschaden.', ''],
]

export const SPELLS = RAW.map(([key, name, level, school, classes, time, range, components, duration, flags, text, extra]) => ({
  key,
  name,
  level,
  school: SCHOOLS[school],
  classes: classes.split('').map((c) => CLASS_CODES[c]),
  time,
  range,
  components,
  duration,
  concentration: flags.includes('K'),
  ritual: flags.includes('R'),
  text,
  // Zaubertricks: Schadenswürfel (steigt mit der Stufe); sonst: Text für höhere Grade
  cantripDie: level === 0 && /^\d+W\d+$/.test(extra) ? extra : null,
  higher: level > 0 ? extra : '',
}))

const BY_KEY = Object.fromEntries(SPELLS.map((s) => [s.key, s]))

/** Zauber nachschlagen – auch eigene Zauber (custom) eines Charakters */
export function spellByKey(key, custom = []) {
  return BY_KEY[key] ?? custom.find((s) => s.key === key) ?? null
}

/** Alle Zauber einer Klasse bis zu einem Grad */
export const spellsForClass = (classKey, maxLevel) =>
  SPELLS.filter((s) => s.classes.includes(classKey) && s.level <= maxLevel)

// =====================================================================
//  Zauberregeln je Klasse
// =====================================================================

// Zauberplätze für Vollzauberer (Stufe → Plätze je Grad 1–9)
const FULL = [
  [], [2], [3], [4, 2], [4, 3], [4, 3, 2], [4, 3, 3], [4, 3, 3, 1], [4, 3, 3, 2], [4, 3, 3, 3, 1], [4, 3, 3, 3, 2],
  [4, 3, 3, 3, 2, 1], [4, 3, 3, 3, 2, 1], [4, 3, 3, 3, 2, 1, 1], [4, 3, 3, 3, 2, 1, 1], [4, 3, 3, 3, 2, 1, 1, 1],
  [4, 3, 3, 3, 2, 1, 1, 1], [4, 3, 3, 3, 2, 1, 1, 1, 1], [4, 3, 3, 3, 3, 1, 1, 1, 1], [4, 3, 3, 3, 3, 2, 1, 1, 1],
  [4, 3, 3, 3, 3, 2, 2, 1, 1],
]
// Halbzauberer (Paladin, Waldläufer)
const HALF = [
  [], [], [2], [3], [3], [4, 2], [4, 2], [4, 3], [4, 3], [4, 3, 2], [4, 3, 2], [4, 3, 3], [4, 3, 3], [4, 3, 3, 1],
  [4, 3, 3, 1], [4, 3, 3, 2], [4, 3, 3, 2], [4, 3, 3, 3, 1], [4, 3, 3, 3, 1], [4, 3, 3, 3, 2], [4, 3, 3, 3, 2],
]
// Hexenmeister: [Anzahl Plätze, Grad der Plätze]
const PACT = [[0, 0], [1, 1], [2, 1], [2, 2], [2, 2], [2, 3], [2, 3], [2, 4], [2, 4], [2, 5], [2, 5],
  [3, 5], [3, 5], [3, 5], [3, 5], [3, 5], [3, 5], [4, 5], [4, 5], [4, 5], [4, 5]]

// Bekannte Zaubertricks: [ab Stufe 1, ab 4, ab 10]
const CANTRIPS = { bard: [2, 3, 4], cleric: [3, 4, 5], druid: [2, 3, 4], sorcerer: [4, 5, 6], warlock: [2, 3, 4], wizard: [3, 4, 5] }

// Bekannte Zauber (Stufe 1–20) für Klassen mit festen Zaubern
const KNOWN = {
  bard: [4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 15, 15, 16, 18, 19, 19, 20, 22, 22, 22],
  sorcerer: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 12, 13, 13, 14, 14, 15, 15, 15, 15],
  warlock: [2, 3, 4, 5, 6, 7, 8, 9, 10, 10, 11, 11, 12, 12, 13, 13, 14, 14, 15, 15],
  ranger: [0, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11],
}

/**
 * Zauber-Regeln für Klasse + Stufe.
 * mode: 'known' (feste Zauber), 'prepared' (aus Klassenliste vorbereiten), 'spellbook' (Magier)
 */
export function spellRules(classKey, level, mods) {
  const lvl = Math.min(20, Math.max(1, level))
  const cantripCounts = CANTRIPS[classKey]
  const cantrips = cantripCounts ? cantripCounts[lvl >= 10 ? 2 : lvl >= 4 ? 1 : 0] : 0

  let slots = [] // Index 0 = Grad 1
  let pact = null
  if (['bard', 'cleric', 'druid', 'sorcerer', 'wizard'].includes(classKey)) slots = FULL[lvl]
  else if (['paladin', 'ranger'].includes(classKey)) slots = HALF[lvl]
  else if (classKey === 'warlock') {
    const [count, slotLevel] = PACT[lvl]
    pact = { count, level: slotLevel }
    slots = Array.from({ length: slotLevel }, (_, i) => (i === slotLevel - 1 ? count : 0))
  } else return null

  const maxSpellLevel = pact ? pact.level : slots.length
  let mode = 'known'
  let limit = KNOWN[classKey]?.[lvl - 1] ?? 0
  let spellbookSize = null
  if (classKey === 'cleric' || classKey === 'druid') {
    mode = 'prepared'
    limit = Math.max(1, mods.wis + lvl)
  } else if (classKey === 'paladin') {
    mode = 'prepared'
    limit = lvl >= 2 ? Math.max(1, mods.cha + Math.floor(lvl / 2)) : 0
  } else if (classKey === 'wizard') {
    mode = 'spellbook'
    limit = Math.max(1, mods.int + lvl)
    spellbookSize = 6 + 2 * (lvl - 1)
  }

  return { cantrips, slots, pact, maxSpellLevel, mode, limit, spellbookSize, shortRestSlots: Boolean(pact) }
}

/** Zaubertrick-Schaden nach Charakterstufe: 1W10 → 2W10 ab Stufe 5 … */
export function cantripDamage(die, level) {
  if (!die) return null
  const count = 1 + (level >= 5) + (level >= 11) + (level >= 17)
  const [n, sides] = die.split('W')
  return `${Number(n) * count}W${sides}`
}

export const GRADE_NAME = (level) => (level === 0 ? 'Zaubertricks' : `Grad ${level}`)
