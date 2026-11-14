// Zustände aus dem SRD 5.1 (CC-BY-4.0) – eigene, verkürzte deutsche Zusammenfassungen
export const CONDITIONS = [
  { key: 'blinded', name: 'Blind', icon: '🙈', text: 'Sieht nichts. Angriffe gegen dich haben Vorteil, deine Angriffe Nachteil.' },
  { key: 'charmed', name: 'Bezaubert', icon: '💘', text: 'Kann den Bezauberer nicht angreifen; er hat Vorteil bei sozialen Würfen gegen dich.' },
  { key: 'deafened', name: 'Taub', icon: '🔇', text: 'Hört nichts.' },
  { key: 'exhaustion', name: 'Erschöpft', icon: '😩', text: 'Je nach Erschöpfungsstufe gibt es Nachteile – frag deinen Spielleiter.' },
  { key: 'frightened', name: 'Verängstigt', icon: '😱', text: 'Nachteil, solange die Quelle der Angst sichtbar ist; du kannst nicht näher heran.' },
  { key: 'grappled', name: 'Gepackt', icon: '🤼', text: 'Deine Bewegungsrate ist 0.' },
  { key: 'incapacitated', name: 'Kampfunfähig', icon: '💫', text: 'Keine Aktionen und keine Reaktionen.' },
  { key: 'invisible', name: 'Unsichtbar', icon: '👻', text: 'Deine Angriffe haben Vorteil, Angriffe gegen dich Nachteil.' },
  { key: 'paralyzed', name: 'Gelähmt', icon: '⚡', text: 'Kampfunfähig und reglos; Treffer aus nächster Nähe sind kritisch.' },
  { key: 'petrified', name: 'Versteinert', icon: '🗿', text: 'In Stein verwandelt und kampfunfähig.' },
  { key: 'poisoned', name: 'Vergiftet', icon: '🤢', text: 'Nachteil bei Angriffs- und Attributswürfen.' },
  { key: 'prone', name: 'Liegend', icon: '🛌', text: 'Nur kriechen; Nahkampf gegen dich hat Vorteil, Fernkampf Nachteil.' },
  { key: 'restrained', name: 'Festgesetzt', icon: '⛓️', text: 'Bewegungsrate 0; Angriffe gegen dich mit Vorteil, deine mit Nachteil.' },
  { key: 'stunned', name: 'Betäubt', icon: '😵', text: 'Kampfunfähig und kann kaum sprechen; Angriffe gegen dich haben Vorteil.' },
  { key: 'unconscious', name: 'Bewusstlos', icon: '💤', text: 'Kampfunfähig, lässt alles fallen; Treffer aus nächster Nähe sind kritisch.' },
]

export const conditionByKey = (key) => CONDITIONS.find((c) => c.key === key)
