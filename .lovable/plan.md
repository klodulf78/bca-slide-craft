

# Auth temporär entfernen

## Übersicht
Authentifizierung wird deaktiviert, aber alle Auth-Dateien bleiben im Projekt. Die App ist ohne Login nutzbar.

## Änderungen

### 1. Routes ohne AuthGuard (src/App.tsx)
- `AuthGuard`-Wrapper von allen Routes entfernen
- `/login`-Route behalten aber nicht mehr als Redirect-Ziel
- Startseite `/` zeigt direkt Dashboard

### 2. RLS-Policies anpassen (DB-Migration)
- `presentations`-Tabelle: RLS-Policies temporär auf `true` setzen (SELECT, INSERT, UPDATE, DELETE) damit Queries ohne Auth funktionieren
- `user_id` in `presentations` nullable machen, damit Einträge ohne eingeloggten User möglich sind
- `templates`-Tabelle: SELECT-Policy von `authenticated` auf `public` ändern

### 3. Sidebar anpassen (src/components/AppSidebar.tsx)
- Logout-Button ausblenden

### 4. Dashboard anpassen (src/pages/Dashboard.tsx)
- Begrüßung ohne User-Namen (z.B. "Willkommen bei BCA Slide Studio")

### Dateien die erhalten bleiben (unverändert)
- `src/pages/Login.tsx`
- `src/components/AuthGuard.tsx`

### Später bei Re-Aktivierung
- AuthGuard wieder in Routes einfügen
- RLS-Policies auf `auth.uid() = user_id` zurücksetzen
- `user_id` wieder required machen

