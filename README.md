# Marktplaner

Browser-App zum Planen von Marktständen auf einer Karte. Läuft komplett lokal im Browser (localStorage + IndexedDB), kein Server.

- Projekt anlegen: Name + Kartenbild wählen, dann zwei Referenzpunkte anklicken und die reale Entfernung in Metern eingeben.
- Marktstände (Name, Notizen, Breite × Tiefe in m) in der Seitenleiste anlegen, per Drag & Drop oder „Platzieren“ maßstabsgetreu auf die Karte legen, verschieben und drehen (Griff, ⇧ rastet in 15°).
- Tasten: `Esc` Auswahl aufheben, `Entf`/`⌫` von Karte entfernen, `[` / `]` drehen.

## Entwicklung

```sh
pnpm install
pnpm dev        # Dev-Server
pnpm test       # Unit-Tests (vitest)
pnpm build      # Typecheck + Production-Build nach dist/
```

## Deployment

Push auf `main` baut und veröffentlicht via GitHub Actions auf GitHub Pages (`base: /marktplaner/`). In den Repo-Einstellungen muss die Pages-Quelle einmalig auf „GitHub Actions“ gesetzt werden. Die Custom Domain `sebastianstenzel.de` gehört in das User-Site-Repo (`overheadhunter.github.io`); Projekt-Seiten erscheinen dann automatisch unter `sebastianstenzel.de/marktplaner`.
