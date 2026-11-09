# Quedem (app d'esdeveniments)

Web app per organitzar aniversaris i celebracions sense el soroll del grup de WhatsApp.

## Fase 1 (feta)
- Crear un esdeveniment (data, lloc, detalls, mode sorpresa)
- Pàgina de gestió privada per a l'organitzador (`/gestio/<token>`): qui hi va, avisos, tasques, enviar per WhatsApp
- Invitació pública per enllaç (`/e/<codi>`): respondre si hi vas, acompanyants, apuntar-se a tasques. Sense instal·lar res ni crear compte.

## Pendent
- Recordatoris automàtics per correu
- Comptes compartits
- Comptes d'usuari (ara els esdeveniments de l'organitzador es guarden al navegador)

## Stack
Next.js + Tailwind, Supabase (base de dades), Vercel (publicació).

## Desenvolupament
```bash
cp .env.example .env.local   # i posa-hi les claus de Supabase
npm install
npm run dev
```
L'esquema de la base de dades és a `supabase/migrations/`.
