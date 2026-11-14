// Übersetzt häufige Supabase-Fehlermeldungen ins Deutsche
export function translateError(message = '') {
  const m = message.toLowerCase()
  if (m.includes('invalid login credentials')) return 'E-Mail oder Passwort ist falsch.'
  if (m.includes('email not confirmed')) return 'Bitte bestätige zuerst deine E-Mail-Adresse.'
  if (m.includes('already registered')) return 'Diese E-Mail-Adresse ist bereits registriert.'
  if (m.includes('password should be at least')) return 'Das Passwort muss mindestens 6 Zeichen lang sein.'
  if (m.includes('unable to validate email')) return 'Bitte gib eine gültige E-Mail-Adresse ein.'
  if (m.includes('rate limit')) return 'Zu viele Versuche. Bitte warte kurz und versuche es erneut.'
  if (m.includes('could not find the function') || m.includes('schema cache')) {
    return 'Die Datenbank ist noch nicht eingerichtet. Bitte die SQL-Dateien aus supabase/migrations in Supabase ausführen.'
  }
  if (m.includes('bucket not found')) {
    return 'Der Speicherplatz für Bilder fehlt noch. Bitte die Datei supabase/migrations/002_charaktere.sql in Supabase ausführen.'
  }
  if (m.includes('relation') && m.includes('does not exist')) {
    return 'Eine Datenbank-Tabelle fehlt noch. Bitte die neueste SQL-Datei aus supabase/migrations in Supabase ausführen.'
  }
  if (m.includes('failed to fetch')) return 'Keine Verbindung zum Server. Bist du online?'
  return message || 'Unbekannter Fehler.'
}
