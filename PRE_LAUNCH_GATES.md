# Pre-launch gates (Ray — do not ship without these)

**Last updated:** 2026-05-22

## 1. Rename (required)

- **Product** and **company** need new customer-facing names — not “Nova” / not “Nova Elite” (Amazon Nova AI is live; trademark risk).
- Internal codename `nova-elite` in repo can stay until rename pass.
- `getsystemscale.com` exists — still run USPTO/Google clearance on **System Scale** as company mark (industrial scale company uses same name).

## 2. Voice / infra (before selling)

- Droplet voice stable (currently Deepgram Aura-1, `NOVA_TTS=deepgram`).
- Watchdog + Pushover when worker down / import crash / Cartesia 402.
- Break-glass: `NOVA_TTS=openai` if Deepgram fails.

## 3. Trials (before receptionist)

- Book + artwork = **DFW / social** proof, not phone receptionist yet.
- Receptionist + triple seamless failover = **later phase**.

## 4. Per client (when live)

- One short AI disclosure at call start — wording from **client’s** script; never repeated unless asked.

## 5. Open decisions

- **Territory exclusivity** (ZIP / radius) — TBD; not required for nationwide remote DFW offer.
- **Study cadence** — hold 2×/day until voice + archive trustworthy.
- **Commercial name brainstorm** — Ray + advisors; pick before site/contracts/traction.

## 6. Ladder / autonomy

- Follows **reliability**, not calendar or hype.
