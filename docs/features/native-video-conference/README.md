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

### Background blur

Two ways of doing it, and which one runs is whichever can — the same arrangement as noise cancelling:

- **The camera's own**, via the `backgroundBlur` constraint. Free: the platform does it before the frames reach us.
  It exists on ChromeOS and on Windows where the hardware provides it, and nowhere else — macOS does not.
- **Ours**, via `@livekit/track-processors`: MediaPipe selfie segmentation over every frame, replacing the published
  track. Works anywhere with the modern APIs, and it is not free — it segments each frame and fetches its WASM and
  model from a CDN (`cdn.jsdelivr.net`, `storage.googleapis.com`) the first time. A workspace with no way out to the
  internet gets the caught failure and blur stays off.

**Ask `getCapabilities()`, never `applyConstraints`.** `applyConstraints({ backgroundBlur: true })` *resolves
happily* on a browser that has never heard of the constraint — an unrecognised non-required constraint is dropped
per spec — and `getSettings().backgroundBlur` stays `undefined`. Trying it and believing the result ships a switch
that reports success and blurs nothing.

The camera menu offers it as **one row per strength** — No blur / Light / Medium / Strong (radii 5, 12, 25) — the
same shape as the camera rows above it, because "how much" is a choice and a switch could only ever say "on". Where
the *camera* is doing the blurring the list is No blur / Medium only: that effect has no strengths to choose from.
`none` by default (it is a deliberate look, and ours costs CPU), remembered, and the row in use says who is doing the
work: *By your camera* or *Processed on this device*. Changing strength reuses the loaded segmenter via `switchTo`,
so only the first choice is slow.

#### Two things a processor changes about a track

Once a processor is attached, `track.mediaStreamTrack` is the **processed** track, and a processed track belongs to
no device. Both of these followed from that, and both are fixed:

- **The local tile showed the raw camera**, so blur went out to the call while the person who switched it on saw
  themselves unblurred. It now renders the processor's `processedTrack`, in a `MediaStream` held in a ref keyed by
  the track so re-renders don't hand the video element a new object.
- **`useStreamHasLiveVideo` reported it as not producing frames.** It gates on `!track.muted`, and a
  generator-backed track reports `muted` until its first frame and does not reliably announce it — so the tile fell
  back to the avatar and looked black. A track with no device behind it is now treated as synthetic, where `live`
  and `enabled` are enough; a real camera track still needs `!muted`, so a paused camera still shows the avatar.
- **The camera stopped being selected in its own menu**, because `currentCameraDeviceId` read the processed track's
  empty `deviceId` — which also made choosing the camera already in use look like a change, restarting the track
  into a black frame. It reads the id from the track's constraints now.

Not yet done: a remembered "blur on" is not applied on join. Starting blur republishes the camera track, which
re-runs the setup effect whose cleanup stops the processor it just started, leaving the switch on with a sharp
background. Applying it on arrival needs that effect keyed off the publication's sid rather than the track object.

### Noise cancelling

Two filters, and which one runs is not a preference — it is whichever can actually work.

**Krisp** (`@livekit/krisp-noise-filter`) is licensed through **LiveKit Cloud**. On a self-hosted server it fails in
the worst possible way: `isKrispNoiseFilterSupported()` returns true, `setProcessor` succeeds, the WASM worklet
starts, models download — and then `setEnabled(true)` calls an authentication endpoint, gets **404**, and leaves
`isEnabled()` false. The result is a filter that is attached, routing every audio sample through a worklet, and
filtering nothing. That is what "noise cancelling seems not to work" was: it had never once been on.

So `useNoiseSuppression` checks the *result* of `setEnabled` rather than assuming it, and a filter that will not
turn on is `destroy()`ed and taken out of the path instead of left there costing latency for nothing.

**The browser's own** (`noiseSuppression` on the mic constraints) is the fallback, and on a self-hosted workspace it
is what everyone gets. It is a property of the microphone rather than a processor, so switching it means
`restartTrack` — a brief gap in the audio, which is why it is not the mechanism where Krisp works.

**RNNoise** sits between them: Xiph's recurrent network (~85KB of weights) in an AudioWorklet, which is what Jitsi
ships. It removes typing, chairs and the road outside, which the browser's own leaves in. Its worklet and WASM are
served from `apps/meteor/public/noise-suppressor/` rather than a CDN — deliberately, since this exists for the
deployments that cannot reach Krisp's licensing server, and those often cannot reach a CDN either. Switching it out
rewires straight through rather than tearing the graph down, so there is no gap and nothing renegotiates.

The mic menu offers all three as **one row per method**, weakest first: Off / Basic (your browser) / Good (RNNoise) /
Best (Krisp). Each is *proven* before being offered rather than taken from a support flag — Krisp reports itself
supported, attaches, starts its worklet and only then fails the entitlement check, so a flag-based list would show a
choice that quietly does nothing. Proving it is also what starts it, so the cost is paid once. The choice is
remembered, and a remembered method that is no longer possible falls back to the best on offer.

(Those assets are copied into `public/` for now; they should be a build step rather than committed binaries.)

Diagnosing it again: `KrispNoiseFilter({ debugLogs: true })` turns on Krisp's own logging.

### What a microphone looks like

`VoiceActivity` (`packages/ui-voip/src/components/VoiceActivity.tsx`) is three bars that rise with how loudly
someone is talking. At rest the three are equal, which reads as a row of dots — a mic that is on and hearing
nothing. Unequal bars at rest would claim a voice that isn't there; nothing at all would read as broken.

It replaces the mic icon wherever the mic is live, rather than sitting next to one, and answers what a static icon
cannot: whether a mic that is *on* is picking anything up.

| Where | Mic on | Mic off |
|---|---|---|
| Tile corner | blue disc, bars | dark disc, crossed mic |
| Members panel | blue disc, bars, and — for anyone but the reader — a button to ask them to mute | *nothing* |
| Mic button in the strip | bars in place of the chevron | the chevron |

The blue is `Palette.stroke['stroke-highlight']`, the same blue the tile's speaking ring uses, so the two agree
about what "someone is talking" looks like.

A muted member's row says nothing on purpose. Everyone in the call already hears the silence, so a crossed-out mic
there would repeat it once per row, for the rows there is least to say about. The reader's own row shows the level
and no button: muting yourself is what the strip's own control is for.

Give the component a level if you already measure one — a tile lighting its speaking ring does — and it uses that;
give it a stream and it measures for itself. That is what keeps two analysers off the same microphone.

The name over a tile is plain text with a shadow rather than text on a plate. A dark pill under every name put a
permanent rectangle over the bottom of everyone's camera, and the shadow keeps the name legible over whatever the
camera is showing without covering any of it. A raised hand is the one thing that gives a name a plate — the green
one — which is what makes that green mean something.

### Data-channel messages

All inter-client and worker↔client comms ride the LK data channel. Current message types:

| Type | Direction | Reliable? | Purpose |
|---|---|---|---|
| `hand` | client ↔ all | yes | `{ raised, raisedAt, rebroadcast? }`. Hand-raise aggregation. |
| `reaction` | client ↔ all | no | `{ emoji, reactionId? }`. Floating reactions. 3.5s TTL on receivers. |
| `mute` | client ↔ all | yes | `{ target }`. Asks one participant to mute themselves. |

**`hand`** carries `rebroadcast: true` when it is a hand being restated for someone who arrived after it went up.
Only a *new* hand chimes (`playHandRaiseChime`), so joining a call where three hands are already up is silent
rather than announcing all three; the chime is otherwise played for everyone, including the raiser, for whom it is
confirmation that the room was told. Whose hand has already been announced is tracked in a ref rather than read
from state, because a decision made inside a state updater is made again every time React re-runs it.

**`mute` is a request, not an act.** Everyone in the call receives it and only its target acts on it, by muting its
own microphone — the only place a microphone can actually be turned off — and telling its owner who asked
(`You_were_muted_by__name__`). A client that ignored the message would stay unmuted, which is the honest shape of
this without server-side moderation: nothing here reaches into anyone's machine. The asking lives in the call's
members panel, where the people in the call are; nobody is offered it against themselves.

### Where a raised hand and a reaction are shown

Neither is drawn on the raiser's own tile any more, and for the same reason: a call can be larger than the tiles it
shows, and both were invisible in exactly the calls where they matter most.

- **Reactions** rise from the bottom-left of the call area (`CallReactions`), each carrying the sender's name —
  which is what keeps them attributable now that position no longer says who sent them. The bottom *left* because
  the controls own the middle of that edge, and rising through them would put an emoji over the hang-up button.
- **Raised hands** are stated next to the participants button (`CallRaisedHands`): the person at the front of the
  queue, with `+N` when others are waiting, and the whole queue in order behind a click. Nothing is rendered when
  nobody has their hand up. The members panel marks who is waiting, without the ordering — that is the header's to
  state.

### UI surfaces (`packages/ui-voip/src/views/MediaCallRoomSection/`)

- **Reactions popover** — stays open for multiple clicks; outside-click to dismiss.
- **Hand-raise** — auto-lowers after 3s of continuous speech (driven by `useAudioLevel`).


Camera tiles fall back to the avatar when `track.enabled && !track.muted && track.readyState === 'live'` is false (`useStreamHasLiveVideo` hook). For remote LK tracks, also check `publication.isMuted`.

---

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
