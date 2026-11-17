# Torn — reserves per a negocis locals

App separada de Quedem (viu en aquesta carpeta `reserves/`).

- El negoci es registra, posa serveis (durada, preu) i horari setmanal.
- Comparteix l'enllaç `/r/<nom-del-negoci>` i els clients reserven una hora lliure.
- Al panell (`/panell`) veu l'agenda i pot anul·lar reserves.
- El client rep un enllaç `/reserva/<codi>` per veure-la, afegir-la al calendari o anul·lar-la.

Base de dades: taules `rs_*` al projecte Supabase compartit (vegeu `supabase/migrations`).
