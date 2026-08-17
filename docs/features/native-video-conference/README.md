# LiveKit group calls

Ported from [#40726](https://github.com/RocketChat/Rocket.Chat/pull/40726) minus that PR's persistent-chat
work, which this branch already carries from
[the persistent-chat feature](../video-conference-persistent-chat/README.md). The two are **not yet wired
together**: a LiveKit call renders inline in its room and follows the user as a floating widget, rather than in
the `/conference/:id` window. Joining them up is the next step.


LiveKit ships as a **native provider of the Video Conference feature** — not as a parallel "VoIP TeamCollab" thing. The room-sidebar camera button starts a LiveKit-backed call exactly the way it starts a Jitsi/Google Meet call today; the only difference is the embedded provider returns control to a React context that owns the LK session.

What that integration provides:

1. **LiveKit group calls.** Channel-scoped multi-party calls routed through a LiveKit SFU. Grid + spotlight, screen sharing, hand-raise / reactions, floating widget when navigating away from the call's room.

---

## 1. Deployment topology

```
┌────────────────────────────────────────────────────────────────────┐
│ Rocket.Chat monolith (Meteor)                                      │
│                                                                    │
│   ┌──────────────────────────┐   ┌─────────────────────────────┐   │
│   │ Video Conference service │   │ ee/server/lib/livekit/*     │   │
│   │   (existing)             │   │   config / token            │   │
│   │   + LiveKit provider     │◀──│   roomService / presence    │   │
│   │     (embedded)           │   │                             │   │
│   └──────────────────────────┘   └─────────────────────────────┘   │
│                                                                    │
│   ┌──────────────────────────┐                                    │
│   │ REST                     │                                    │
│   │   /transport.config      │                                    │
│   │   /leave                 │                                    │
│   └──────────────────────────┘                                    │
│                                                                    │
│   ┌──────────────────────────┐                                    │
│   │ Client (React)           │                                    │
│   │   VideoConfButton →      │                                    │
│   │   VideoConfManager →     │                                    │
│   │   LiveKitVideoConf       │                                    │
│   │     Context              │                                    │
│   └──────────────────────────┘                                    │
└─────────┬──────────────────────────────────────────────────┬───────┘
          │ Twirp HTTPS (RoomService)                        │
          │ HS256 JWT                                        │ wss
          ▼                                                  ▼
┌────────────────────────────────────────────────────────────────────┐
│ LiveKit (Cloud or self-hosted)                                     │
│   - SFU media routing                                              │
└────────────────────────────────────────────────────────────────────┘
```

Beyond the Meteor monolith this needs a **LiveKit** deployment — Cloud or self-hosted — reachable over `wss`. Point the settings below at it.


---

## 2. Settings

All settings live in `apps/meteor/ee/server/settings/video-conference.ts`, under the `Video_Conference` group, `VideoConf_LiveKit` subsection.

### Core

| Setting | Type | Default | Purpose |
|---|---|---|---|
| `VideoConf_LiveKit_Enabled` | boolean | `false` | Master toggle. Gates the embedded provider registration. |
| `VideoConf_LiveKit_Mode` | select | `self_hosted` | Doc hint (`self_hosted` / `cloud`). No runtime effect. |
| `VideoConf_LiveKit_Url` | string | — | Full `wss://` URL the client connects to. |
| `VideoConf_LiveKit_Api_Key` | string (secret) | — | LK API key. Mints participant tokens + Twirp calls. |
| `VideoConf_LiveKit_Api_Secret` | password | — | Paired with the key. |

## 3. Data model

The LK feature persists state on the existing **`VideoConference`** collection (`packages/models/src/models/VideoConference.ts`, `packages/core-typings/src/IVideoConference.ts`). The discriminator is `providerName === 'livekit'`.

Fields the LK flow uses:

| Field | Purpose |
|---|---|
| `providerName` | `'livekit'` for our calls. |
| `type` | `'direct'` / `'videoconference'` / `'livechat'` (existing field, untouched). |
| `status` | `CALLING` / `STARTED` / `EXPIRED` / `ENDED` / `DECLINED`. |
| `rid` | Room the call belongs to. Drives "active call in room" lookup. |
| `participants[]` | Per-participant join/leave tracking: `{ identity, joinedAt, leftAt? }`. |
| `messages.started` | ID of the "call ongoing" block message. Threaded replies about the call hang off it. |

Notes:
- The legacy `IMediaCall` model (with `kind: 'direct'\|'group'` and `service: 'webrtc'\|'livekit'` discriminators) still exists for legacy P2P calls but **is not used by the LK path** anymore.
- Existing `isDirectVideoConference()` / `isGroupVideoConference()` type guards work as-is — LK calls are just one provider among many to `VideoConferenceModel`.

---

## 4. Provider invocation flow

LK is wired in as an **embedded** Video Conference provider — the same shape the built-in "free" Jitsi provider uses, except its UI lives in the Meteor client instead of a popup.

```
User clicks camera button on room sidebar
   │
   ▼
VideoConfButton (packages/ui-video-conf/src/VideoConfButton/VideoConfButton.tsx)
   │
   ▼
VideoConfManager.startCall(rid)          ← apps/meteor/client/lib/VideoConfManager.ts
   │   • mints a VideoConference doc with providerName='livekit'
   │   • returns { url: '', callId, rid } — empty url signals embedded
   │
   ▼ emits 'call/joinEmbedded' { callId, rid, providerName, preferences }
   │
   ▼
VideoConfProvider                         ← apps/meteor/client/providers/VideoConfProvider.tsx
   │   subscribes to the event, dispatches to the matching context
   │
   ▼
useLiveKitVideoConf().joinCall({ callId, rid, preferences })
   │   ← apps/meteor/client/views/videoConference/livekit/LiveKitVideoConfContext.tsx
   │
   ▼
Fetches /transport.config → mounts <LiveKitRoom> in a portal
```

Two interface bits make this work:

- **`IVideoConfProvider.capabilities.embedded: boolean`** (`packages/core-typings/src/VideoConferenceCapabilities.ts`). The LK provider sets this to `true`; the embedded code path looks for it.
- **`VideoConfService.validateProvider`** was gated to skip the apps-engine validation pass when the provider declares `embedded: true` — built-in embedded providers don't go through the apps-engine handshake.

The result: zero new UI surface in the room header. Users start LK calls the same way they start any other VC.

---

## 5. Server-side architecture

### `apps/meteor/ee/server/lib/livekit/`

Self-contained module for everything that talks to LK or AWS. Files largely unchanged from the original implementation, just consumed by the VideoConf integration instead of the old MediaCalls path.

- **`config.ts`** — `getLiveKitConfig()` reads all `VideoConf_LiveKit_*` settings; `isLiveKitFullyConfigured()` validates them. Cached per setting-change tick.
- **`token.ts`** — `createLiveKitAccessToken({ identity, roomName, ttl })` for client participants; `createLiveKitApiToken()` for server→LK admin calls. Both use `signHS256` from `@rocket.chat/jwt`.
- **`roomService.ts`** — `listRoomParticipantIdentities(roomName)` via LK's Twirp `ListParticipants`. Identities are Rocket.Chat user ids, because that is what tokens are minted with. Returns `undefined` on error, so a transient API blip reads as "no answer" rather than "nobody is there".
- **`presence.ts`** — registers that call as a **presence probe** for the `livekit` provider, which the provider-agnostic presence sweep asks when judging a call. It is an accelerator, not a dependency: presence is held by leases every conference window renews, and LiveKit's answer renews the same leases from the server side — where a throttled background tab can't be. See [presence leases](../video-conference-persistent-chat/README.md#knowing-who-is-still-in-the-call).

### REST APIs

All endpoints live in `apps/meteor/ee/server/api/videoConferenceLiveKit.ts`, rate-limited per user. Authorization is `canAccessConference` — conference membership **or** access to the call's room — the same rule every conference endpoint uses, and deliberately not room access alone: a call member added from outside the room (the third person in a DM call) has no subscription to check, and checking for one refuses them their own call. See [Access Control](../video-conference-persistent-chat/README.md#access-control).

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/v1/video-conference.livekit.transport.config?callId=…` | Returns `{ serverUrl, token, roomName }` for the client. |
| `POST` | `/v1/video-conference.livekit.leave` | Marks the user left. Supports `keepalive` for `beforeunload`. |

---

## 6. Client-side architecture

### Provider tree

```
VideoConfManager (singleton, apps/meteor/client/lib/VideoConfManager.ts)
   │   emits 'call/joinEmbedded'
   ▼
VideoConfProvider (apps/meteor/client/providers/VideoConfProvider.tsx)
   │   subscribes; routes to per-provider context
   ▼
LiveKitVideoConfProvider
   └─ exposes LiveKitVideoConfContext
        (apps/meteor/client/views/videoConference/livekit/LiveKitVideoConfContext.tsx)
        useLiveKitVideoConf() → { activeCall, joinCall, leaveCall }
```

`LiveKitVideoConfProvider` mounts a hidden `<LiveKitRoom>` via `createPortal` to a sibling DOM node, so the LK connection persists across React route changes — navigating between channels does not disconnect the call.

Inside `<LiveKitRoom>`, an inner provider reads LK hooks (`useParticipants`, `useTracks`, `useLocalParticipant`) and pushes the computed value into `MediaCallViewContext` (shared with the legacy P2P UI). `MediaCallRoomSection` consumes that context unchanged.

### Which devices a call uses

The preflight is the only place devices are chosen, and it remembers the choice in `localStorage`
(`videoconf-call-preferences`, via `useCallPreferences`). Two rules keep that choice and the call in agreement:

- **Applied as capture *defaults*, not capture options.** `audio` and `video` on `<LiveKitRoom>` describe the track
  published on the way in, so a call joined muted — the normal way to join — used to throw the chosen microphone away
  along with the `false`, and unmuting later opened whichever device the browser preferred. `audioCaptureDefaults` /
  `videoCaptureDefaults` are read every time a track is created, including that one. LiveKit merges them over its own
  audio defaults (echo cancellation and friends survive) and seeds the room's active-device map from them.
- **The room is asked which device is in use — nothing else is trusted to know.** The app's own device store
  (`DeviceProvider`) is only ever written from inside a call, so on arrival it answers with its own fallback, the first
  device the browser happened to enumerate, and the device chosen in the preflight reads as unselected in the in-call
  menu. `LiveKitVideoConfProvider` instead listens for `RoomEvent.ActiveDeviceChanged`, reads
  `room.getActiveDevice(kind)`, and corrects the store from it. That value is the device *obtained* rather than the one
  requested, so a device that cannot actually capture shows the one the browser fell back to.

Picking a device in the in-call menu therefore only calls `room.switchActiveDevice`; the record follows from the event.
Matching a recorded device against a menu entry goes through `isSameDevice` (`packages/ui-voip/src/utils/deviceLabels.ts`),
because browsers list the system default twice — as the `default` alias and under its own id — and the two halves of that
pair are held by different parts of the app.

### Data-channel messages

All inter-client and worker↔client comms ride the LK data channel. Current message types:

| Type | Direction | Reliable? | Purpose |
|---|---|---|---|
| `hand` | client ↔ all | yes | `{ raised, raisedAt }`. Hand-raise aggregation. |
| `reaction` | client ↔ all | no | `{ emoji, reactionId? }`. Floating reactions. 3.5s TTL on receivers. |
## 7. Runtime flows

### Starting a call

1. User clicks the camera button on the room sidebar.
2. `VideoConfButton` → `VideoConfManager.startCall(rid)` — mints a `VideoConference` doc with `providerName: 'livekit'` and returns `{ url: '', callId, rid }`. Empty `url` signals embedded.
3. `VideoConfManager` emits `'call/joinEmbedded'` with `{ callId, rid, providerName, preferences }` (preferences = whether to arrive with mic/cam on, plus which mic, camera and speaker, all from the preflight).
4. `VideoConfProvider` routes to `useLiveKitVideoConf().joinCall(...)`.
5. `LiveKitVideoConfContext` fetches `/transport.config` and mounts `<LiveKitRoom>` in the portal: `audio`/`video` say whether to publish each track, and the chosen devices go in the room's `audioCaptureDefaults` / `videoCaptureDefaults` — see below.
6. LK connects.

## 8. Who gets rung

Ringing is for the people a call is actually aimed at:

| Room | Rings | Why |
|---|---|---|
| Direct message (2 people) | yes | `direct` type; rung when the caller arrives, not when the call is created. |
| Multi-person direct message | yes | Exactly the set of people meant, which is what makes ringing them right. |
| Channel, team | **no** | A call there is an invitation to whoever is around, not a summons. |
| Added to a call in progress | yes | They are being called *now*. Capped at `VIDEO_CONF_RINGING_LIMIT`. |

A channel call is not silent, it is *announced*: a message in the room, and a row in the ongoing-calls list for
every member who could join it. Ringing a roomful of people who were not being called is the thing being avoided —
the more so because a channel is somewhere someone joined once, not a group they assembled to talk to.

The room decides whether ringing is possible; the caller decides whether it happens. The preflight carries a
**Ring participants** switch (default on, remembered in `videoconf-call-preferences` — see `useCallRingPreference`),
and it is shown only on the screen where confirming *creates* the call, since a call that already exists was created
with its answer and a switch wired to nothing is worse than no switch. Adding people to a call in progress asks the
same question, and remembers the same answer: it is one habit, not two.

## 9. Known limitations

- **Single-process worker**. Supervisor only respawns one. No horizontal scaling story yet — for many concurrent rooms in a single workspace, you'd want multiple worker processes or external workers.

---

End.
