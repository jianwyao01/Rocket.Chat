# Round 2 总账 (e519470)

冻结提交 **`e519470d35b6caf5b228d81aef41c86aab3051f4`**（短 SHA `e519470`）。本文是分层覆盖账本，**只索引已落地的闭集卷，并披露剩余空洞**。不是功能清单。

源 PR（均保持 draft）：[#20](https://github.com/jianwyao01/Rocket.Chat/pull/20) [#21](https://github.com/jianwyao01/Rocket.Chat/pull/21) [#22](https://github.com/jianwyao01/Rocket.Chat/pull/22) [#23](https://github.com/jianwyao01/Rocket.Chat/pull/23) [#24](https://github.com/jianwyao01/Rocket.Chat/pull/24)。本文件是索引，不替代各卷正文。

---

## 0. What this ledger can claim

- Closed-set volumes **6 / 7 / 13 / 14 / 15** are **`[读]`** inventories with replayable commands. Counts below are those inventories’ closed-set sizes, **not** features.
- Behavior volumes **5 / 8 / 9 / 10 / 11 / 12** are **NOT done**. Vol 5 instance still running as of **2026-08-21**. This ledger invents **no** live results for them.
- Round-1 atlas ([PR #19](https://github.com/jianwyao01/Rocket.Chat/pull/19), develop `e10bd504b9`) is **structural**, not this freeze’s live truth. Vol 5’s checklist source is that atlas’s `[待渲染实测]` tags; an operator-mentioned “~1117” is **recount pending** and is **not** written here as a verified freeze count.
- Nothing in this ledger is **`[实测]`**. Tags stay `[读]` (closed-set vols) or unset (not-started vols) unless vol 5 later upgrades tags after a successful live boot.

---

## 1. Volume status table

| Vol | Status | PR | File | Closed-set size | Honesty | Remaining hole |
| --- | --- | --- | --- | --- | --- | --- |
| 5 | **RUNNING** (as of 2026-08-21). No PR yet. | — | — | Checklist = PR #19 `[待渲染实测]` tags. Operator-mentioned ~1117 is **recount pending**, not verified on this freeze. | Checklist tags only. No live upgrade in this ledger. | Live replay of `[待渲染实测]`. **If boot fails → STOP.** Do not invent pass/fail. |
| 6 | Closed-set `[读]` inventory (draft) | [#23](https://github.com/jianwyao01/Rocket.Chat/pull/23) | `docs/qa/pm-feature-atlas/round-2/06-settings-impact.md` | **243** client-read keys (235 same-line + 8 multiline) | all `[读]` | **32** high-impact keys still need `[实测]` |
| 7 | Closed-set `[读]` inventory (draft) | [#22](https://github.com/jianwyao01/Rocket.Chat/pull/22) | `docs/qa/pm-feature-atlas/round-2/07-permissions-impact.md` | **148** client-checked permission keys | all `[读]` | Excluded: server-only fixtures, Apps runtime keys, commented `leave-team`. No `[实测]`. |
| 8 | **NOT STARTED** | — | — | — | — | Gated on live instance (vol 5). |
| 9 | **NOT STARTED** | — | — | — | — | Gated on live instance (vol 5). |
| 10 | **NOT STARTED** | — | — | — | — | Gated on live instance (vol 5). |
| 11 | **NOT STARTED** | — | — | — | — | Gated on live instance (vol 5). |
| 12 | **NOT STARTED** | — | — | — | — | Gated on live instance (vol 5). |
| 13 | Closed-set `[读]` inventory (draft) | [#21](https://github.com/jianwyao01/Rocket.Chat/pull/21) | `docs/qa/pm-feature-atlas/round-2/13-admin-settings-fields.md` + `export-13-admin-settings-fields.mjs` | **1044** admin fields (973 static/expanded + 71 templates; 430 public) | all `[读]` | Vol 13’s own client-read grep = **229** (narrower than vol 6). Leftovers: `Chatops_Username`, `PageSize` vs `Search.defaultProvider.PageSize`. |
| 14 | Closed-set `[读]` reverse-diff (draft) | [#20](https://github.com/jianwyao01/Rocket.Chat/pull/20) | `docs/qa/pm-feature-atlas/round-2/14-pin-reverse-diff.md` | freeze vs develop `e10bd504b9`: registry / settings / perms `only_freeze = 0`; i18n `only_freeze = 29` (interpolation rename); **3** `[读]` CHANGED rows | all `[读]` | MatrixFederation file moves sit **outside** vol 14’s three closed sets. No `[实测]`. |
| 15 | Closed-set `[读]` i18n reverse-check (draft) | [#24](https://github.com/jianwyao01/Rocket.Chat/pull/24) | `docs/qa/pm-feature-atlas/round-2/15-i18n-full.md` | en keys **7385**; EXTRACTED **929** = HIT **423** + MISS **24** + OOS **482** | all `[读]` | **24 must-fill keys still open** (list in §3.2). HIT ids refer to round-1 atlas, not this freeze’s live UI. |

Do **not** add these rows. There is no grand-total of features.

---

## 2. Closed-set arithmetic (no feature total)

Replay **on `e519470`**. A mismatch means reject that volume, not “close the hole by inventing a number.”

### 2.1 Settings (vol 6) — `235 + 8 = 243`

```bash
git rev-parse HEAD
# expect e519470d35b6caf5b228d81aef41c86aab3051f4

# 命令 A — 同行字面量（235）
rg -n --no-heading \
  -o "(?:useSetting(?:<[^>]+>)?|settings\.peek(?:<[^>]+>)?|settings\.observe|useSettingStructure)\(\s*['\"]([A-Za-z0-9_.-]+)['\"]" \
  -r '$1' \
  --glob '*.{ts,tsx,js,jsx}' --glob '!**/*.spec.*' --glob '!**/*.test.*' --glob '!**/tests/**' --glob '!**/server/**' \
  apps/meteor/client apps/meteor/app \
  packages/ui-client packages/ui-contexts packages/web-ui-registration \
  packages/ui-voip packages/ui-video-conf packages/fuselage-ui-kit \
  | sed 's/.*://' | sort -u | wc -l
# expect 235

# 表体 / 去重 id
rg -c '^\| `set\.' docs/qa/pm-feature-atlas/round-2/06-settings-impact.md
rg -o '^\| `set\.[^`]+' docs/qa/pm-feature-atlas/round-2/06-settings-impact.md | sort -u | wc -l
# expect 243 and 243
```

Equality: **`235 + 8 = 243`**. The 8 are multiline / ternary / CMSPage union / `FORGET_SESSION_SETTING_ID` (vol 6 命令 B). Split-table check in that file: `51+30+25+16+19+20+13+13+5+5+5+5+4+9+23 = 243`.

### 2.2 Permissions (vol 7) — `rg perm. = 148` / `SYMDIFF []`

```bash
git rev-parse HEAD
# expect e519470d35b6caf5b228d81aef41c86aab3051f4

rg -c '^\| `perm\.' docs/qa/pm-feature-atlas/round-2/07-permissions-impact.md
rg -o '^\| `perm\.[^`]+`' docs/qa/pm-feature-atlas/round-2/07-permissions-impact.md | sort | uniq | wc -l
# expect 148 and 148
```

Full key-extract python (direct args + named arrays; skip `//` comments) lives in [PR #22](https://github.com/jianwyao01/Rocket.Chat/pull/22) `07-permissions-impact.md` §闭合判据 #4. Expect:

```
COUNT 148
TABLE 148
SYMDIFF []
```

Equality: **`148 = 148 = 148`**.

### 2.3 Admin fields (vol 13) — `1044 = 973 + 71`

Exporter: `docs/qa/pm-feature-atlas/round-2/export-13-admin-settings-fields.mjs` (lives on the vol 13 branch / [PR #21](https://github.com/jianwyao01/Rocket.Chat/pull/21)).

```bash
git rev-parse HEAD
# expect e519470d35b6caf5b228d81aef41c86aab3051f4

node docs/qa/pm-feature-atlas/round-2/export-13-admin-settings-fields.mjs --count
node docs/qa/pm-feature-atlas/round-2/export-13-admin-settings-fields.mjs --verify
node docs/qa/pm-feature-atlas/round-2/export-13-admin-settings-fields.mjs --client-read | wc -l

python3 -c "from pathlib import Path; t=Path('docs/qa/pm-feature-atlas/round-2/13-admin-settings-fields.md').read_text().splitlines(); print(sum(1 for l in t if l.startswith('| ') and not l.startswith('| key') and not l.startswith('| ---')))"
```

Vol 13 `--count` / `--verify` (that PR’s environment; replay on e519470):

```
fields.total              1044
fields.static_or_expanded  973
fields.template             71
fields.public_yes          430
client_read.keys           229
```

Equality: **`1044 = 973 + 71`**. These are export/reconciliation counts, not feature counts.

### 2.4 Reverse diff (vol 14)

Freeze vs `origin/develop` at `e10bd504b9` (read-only counterpart, not this freeze’s live UI).

```bash
# i18n key set-diff
python3 -c "import json,subprocess; f=json.loads(subprocess.check_output(['git','show','e519470d35:packages/i18n/src/locales/en.i18n.json'])); d=json.loads(subprocess.check_output(['git','show','origin/develop:packages/i18n/src/locales/en.i18n.json'])); print(len(f),len(d),len(set(f)-set(d)),len(set(d)-set(f)))"
# expect: 7385 7392 29 36

# 8-col CHANGED rows on the vol 14 file
rg -c '^\| `rev\.' docs/qa/pm-feature-atlas/round-2/14-pin-reverse-diff.md
# expect 3
```

Equalities:

```
7385 - 29 = 7356
7392 - 36 = 7356
1009 + 3  = 1012     # settings.add freeze + only_develop
199  + 1  = 200      # permission ids freeze + only_develop
only_freeze (registry / settings.add / permission) = 0
8-col rev.* = 3      # 1 composer + 0 i18n CRA + 2 LDAP/SAML alert
```

### 2.5 i18n full reverse-check (vol 15) — `929 = 423 + 24 + 482`

Authoritative extract (replay on e519470; same VERB set as [PR #24](https://github.com/jianwyao01/Rocket.Chat/pull/24) §2.1):

```bash
python3 - <<'PY'
import json, re
data = json.load(open('packages/i18n/src/locales/en.i18n.json'))
VERBS = {
  "Pin","Unpin","Star","Unstar","Edit","Delete","Invite","Join","Leave","Create",
  "Remove","Add","Save","Send","Reply","Forward","Share","Copy","Upload",
  "Download","Import","Export","Archive","Unarchive","Mute","Unmute","Block","Unblock",
  "Report","Search","Enable","Disable","Update","Cancel","Accept","Decline","Reject",
  "Approve","Assign","Transfer","Close","Open","Hide","Show","Follow","Unfollow",
  "Ignore","Mention","React","Quote","Prune","Reset","Restore","Ban","Kick",
  "Register","Login","Logout","Subscribe","Unsubscribe","Connect","Disconnect",
  "Install","Uninstall","Purchase","Request","Review","Publish",
  "Convert","Move","Start","Stop","Pause","Resume","Record","Play","Call",
  "Answer","Hold","Merge","Split","Lock","Unlock","Verify","Confirm","Submit",
  "Apply","Clear","Filter","Sort","Refresh","Reload","Expand","Collapse",
  "Select","Toggle","Change","Set","Grant","Revoke","Allow","Deny","Promote",
  "Encrypt","Decrypt","Backup","Wipe","Purge","Scan","Check","Forgot",
  "Translate","Favorite","Unfavorite","Mark","Jump","Reveal","Enter",
}
def flat(v):
    if isinstance(v, str): return v
    if isinstance(v, dict):
        for k in ("other", "one", "zero"):
            if isinstance(v.get(k), str): return v[k]
        for x in v.values():
            if isinstance(x, str): return x
    return None
n = 0
for k, raw in data.items():
    v = flat(raw)
    if not v: continue
    words = re.findall(r"[A-Za-z']+", v)
    if not (1 <= len(words) <= 4): continue
    first = words[0][:1].upper() + words[0][1:]
    if first not in VERBS: continue
    n += 1
print("TOTAL", len(data), "EXTRACTED", n)
PY
# expect: TOTAL 7385 EXTRACTED 929
```

Slice (PR #24 §3): **`HIT 423  MISS 24  OOS 482  SUM 929  MUST 24`**.

Equality: **`929 = 423 + 24 + 482`**.

### 2.6 `6 ≤ 13` (do not collapse the two sets)

- **Vol 6 `243` is the authoritative client-read closed set** (same-line 235 + multiline 8).
- Vol 13’s own exporter grep was **`229`** — a **narrower** literal-first-arg scan (`useSetting` / `useSettingStructure` / `useSettingSetValue` / `settings.peek` / `settings.observe` / `settings.get`). It is not a second 243.
- Leftovers that client-read but do **not** line up with a vol 13 registry row:
  - `Chatops_Username` — client reads it; this freeze has **no** `settingsRegistry.add` for that id.
  - `PageSize` — client literal; registry id is `Search.defaultProvider.PageSize`.

`243` and `1044` are different closed sets (client-read keys vs admin registry fields). Do not add them.

---

## 3. Remaining holes (must stay visible)

### 3.1 Not started volumes (5, 8–12)

| Vol | Why it is still a hole |
| --- | --- |
| 5 | Behavior replay of `[待渲染实测]` against a **live** e519470 instance. Agent still **RUNNING** as of 2026-08-21. **No PR.** If the instance does not boot, the assigned rule is **STOP** — do not paper over a failed boot with `[读]` rows or invented `[实测]`. Checklist source = [PR #19](https://github.com/jianwyao01/Rocket.Chat/pull/19) atlas tags (develop `e10bd504b9`, structural). Tag **recount is pending**; do not treat any unofficial ~N as this freeze’s verified checklist size. |
| 8 | Not started. Gated on a live instance (vol 5). |
| 9 | Not started. Gated on a live instance (vol 5). |
| 10 | Not started. Gated on a live instance (vol 5). |
| 11 | Not started. Gated on a live instance (vol 5). |
| 12 | Not started. Gated on a live instance (vol 5). |

Also still open on **finished** `[读]` volumes (not “done” in the live sense):

- Vol 6: **32** high-impact keys listed at the end of `06-settings-impact.md` still require `[实测]`.
- Vol 7 / 13 / 14 / 15: inventories only. No live upgrade.

### 3.2 i18n 24 must-fill (from [PR #24](https://github.com/jianwyao01/Rocket.Chat/pull/24) §5)

MISS keys that have a user-clickable control on **e519470** and are **not** covered by round-1 00–16. This ledger does **not** invent 8-column rows. Freeze `file:line` copied from that §5 (do not retarget develop).

| # | key | freeze `file:line` (e519470, via PR #24 §5) |
| --- | --- | --- |
| 1 | `Accept_without_mic` | `packages/ui-voip/src/views/PermissionFlow/PermissionFlowModal.tsx:46` |
| 2 | `VoIP_allow_and_accept` | `packages/ui-voip/src/views/PermissionFlow/PermissionFlowModal.tsx:49` |
| 3 | `Call_without_mic` | `packages/ui-voip/src/views/PermissionFlow/PermissionFlowModal.tsx:55` |
| 4 | `VoIP_allow_and_call` | `packages/ui-voip/src/views/PermissionFlow/PermissionFlowModal.tsx:58` |
| 5 | `Allow` | `packages/ui-voip/src/views/PermissionFlow/PermissionFlowModal.tsx:67` |
| 6 | `Open_sidebar` | `apps/meteor/client/components/SidebarToggler/SidebarTogglerButton.tsx:18` |
| 7 | `Close_sidebar` | `apps/meteor/client/components/SidebarToggler/SidebarTogglerButton.tsx:18` |
| 8 | `Remove_filter` | `apps/meteor/client/navbar/NavBarSearch/NavBarSearchInputAddon.tsx:38` |
| 9 | `Connect` | `apps/meteor/client/components/connectionStatus/ConnectionStatusBar.tsx:67` |
| 10 | `Confirm_new_workspace` | `apps/meteor/client/components/FingerprintChangeModalConfirmation.tsx:19` |
| 11 | `Confirm_configuration_update` | `apps/meteor/client/components/FingerprintChangeModalConfirmation.tsx:19` |
| 12 | `Open_dialpad` | `packages/ui-voip/src/views/MediaCallWidget/OngoingCall.tsx:80` |
| 13 | `Close_dialpad` | `packages/ui-voip/src/views/MediaCallWidget/OngoingCall.tsx:80` |
| 14 | `Open_in_room` | `packages/ui-voip/src/components/Cards/StreamCard/StreamCardOpenInRoom.tsx:16` |
| 15 | `Stop_sharing` | `packages/ui-voip/src/components/Cards/StreamCard/StreamCardStopSharingButton.tsx:16` |
| 16 | `Voice_call__user__cancel` | `packages/ui-voip/src/hooks/useMediaCallAction.ts:38` |
| 17 | `Voice_call__user__reject` | `packages/ui-voip/src/hooks/useMediaCallAction.ts:46` |
| 18 | `Call_again` | `packages/fuselage-ui-kit/src/blocks/VideoConferenceBlock/VideoConferenceBlock.tsx:155` |
| 19 | `Call_back` | `packages/fuselage-ui-kit/src/blocks/VideoConferenceBlock/VideoConferenceBlock.tsx:155` |
| 20 | `Open_call` | `apps/meteor/client/views/room/contextualBar/VideoConference/VideoConfBlockModal.tsx:13` |
| 21 | `Set_up_2FA` | `apps/meteor/client/views/root/MainLayout/TwoFactorRequiredModal.tsx:23` |
| 22 | `Add_more_users` | `apps/meteor/client/views/admin/users/AdminUserCreated.tsx:18` |
| 23 | `Reload_to_update` | `apps/meteor/client/components/AutoupdateToastMessage.tsx:23` |
| 24 | `Open_settings` | `apps/meteor/client/views/room/contextualBar/VideoConference/VideoConfConfigModal.tsx:78` |

**24 ≠ 0.** Vol 15 is a reverse-check input, not an 8-column fill.

### 3.3 Known exclusions

These are **out of the closed sets on purpose**. Do not silently grow a volume to absorb them.

- **Apps runtime permission keys** — `useApplyButtonFilters` / `/apps/actionButtons` is an open set (vol 7 §4).
- **`manage-selected-settings` per-setting ids** — one permission opens an open set of setting-scoped ids; client does not enumerate them (vol 7).
- **Server-only permission fixtures** — client has zero checks (vol 7). Examples called out there: `mention-all` / `mention-here` / `mobile-upload-file` / `view-p-room` (guest whitelist only) / `manage-moderation-actions` / `on-hold-livechat-room`.
- **Commented `leave-team`** — `useLeaveTeam.tsx:25` is commented; not in the 148.
- **`useUserPreference`** — user preference, not workspace setting (vol 6 exclusion).
- **`settings.watch` / `getSetting` server-only** — not in the vol 6 client-read set.
- **`Accounts_Default_User_Preferences_${effectiveKey}` dynamic family** — preference fallback, not the vol 6 workspace-key set.
- **`packages/livechat` visitor widget** — a different client; not in vol 6.
- **Admin Settings editor `useSettings()`** — pulls the whole table; not a closed key list (vol 6 / vol 13).
- **MatrixFederation file moves** — develop relocated `MatrixFederationSearch/*` / `useMatrixFederationItems.ts` etc. That is **outside** vol 14’s three closed sets (toolbar/composer/routes · i18n verb-like · settings.add / permission id). Vol 14 did not invent a fourth set.
- **Vol 15 OOS 482** — settings/permission/error/noun keys extracted by the VERB filter but not treated as must-fill actions.
- **Vol 15 HIT 423** — string/id hits against **round-1** atlas ids, not a live pass on e519470.

### 3.4 Honesty

- This ledger contains **no `[实测]`**. Closed-set volumes are `[读]`. Behavior volumes are not started (vol 5 running, no results recorded here).
- A later vol 5 PR may upgrade individual `[待渲染实测]` tags to `[实测]` **only after** a live boot and replay. Until that file exists, treat every behavior claim as unfinished.
- Round-1 PR #19 is a structural merge on develop `e10bd504b9`. It is a **checklist source**, not this freeze’s live truth, and not a substitute for vols 5 / 8–12.
- Do not paper over holes by summing 243 + 148 + 1044 + 929 or by quoting an unverified ~1117.

---

## 4. How to merge

1. Keep source PRs **#20 #21 #22 #23 #24 as drafts**. They own the volume files and exporters. This file is the **index**.
2. Branch this ledger from **`e519470d35b6caf5b228d81aef41c86aab3051f4`**. Do not rewrite volume counts against `develop`.
3. When stacking onto one tree, take each volume file from its draft PR; do not re-export or re-count in this PR.
4. Vol 5 / 8–12 stay absent until a live instance exists. A failed boot is a stop, not a merge candidate.
5. After a real `[实测]` upgrade, add a pointer from this ledger to that volume’s PR — do not silently flip honesty tags here.

`file:line` in this ledger is freeze-tree only (copied from the source volume PRs). No product code.
