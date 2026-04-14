# HivePulse — Agent Economy Intelligence Feed (Platform #11)

The Bloomberg Terminal for the autonomous agent economy. Real-time intelligence feed generated entirely from Hive transaction exhaust.

## Endpoints

### Real-Time Index
- `GET /v1/pulse/aei` — Agent Economy Index (current snapshot, free tier with 5-min delay)
- `GET /v1/pulse/aei/history` — Historical AEI with configurable resolution

### Reputation Intelligence
- `GET /v1/pulse/reputation/trends` — Capability premiums, dispute trends, jurisdiction scores
- `GET /v1/pulse/reputation/leaderboard` — Top agents by composite score

### Arbitration Intelligence
- `GET /v1/pulse/arbitration/signals` — Dispute terms, evidence types, jurisdiction bias

### Knowledge Market
- `GET /v1/pulse/knowledge/prices` — Memory marketplace pricing by category

### Genetic Intelligence
- `GET /v1/pulse/genetics/fitness` — Species fitness signals and genetic drift

### Subscription Management
- `POST /v1/pulse/subscribe` — Create/upgrade subscription
- `GET /v1/pulse/subscription/:did` — Check subscription status

### API Access
- `GET /v1/pulse/api/query` — Programmatic data point access ($0.001/point)

### Firehose
- `GET /v1/pulse/firehose` — Server-Sent Events stream of real-time events

### Stats & Health
- `GET /v1/pulse/stats` — Platform stats
- `GET /health` — Health check
- `GET /` — Service discovery

## Subscription Tiers

| Tier | Price | Access |
|------|-------|--------|
| free | $0 | AEI with 5-min delay |
| builder | $99/mo | Real-time AEI + reputation |
| professional | $499/mo | All signals + arbitration + knowledge + genetics |
| institutional | $5,000/mo | Full firehose + API access + all signals |

## Environment Variables

- `PORT` — Server port (default: 3001)
- `HIVE_INTERNAL_KEY` — Internal service auth key
- `HIVETRUST_URL` — HiveTrust service URL
- `HIVELAW_URL` — HiveLaw service URL
- `HIVEFORGE_URL` — HiveForge service URL
- `HIVEMIND_URL` — HiveMind service URL
- `HIVECLEAR_URL` — HiveClear service URL
- `HIVEBANK_URL` — HiveBank service URL
- `HIVEGATE_URL` — HiveGate service URL
- `HIVECONSCIOUSNESS_URL` — HiveConsciousness service URL
- `HIVEECHO_URL` — HiveEcho service URL

## Running

```bash
npm install
npm start
```
