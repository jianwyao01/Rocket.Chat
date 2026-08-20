# 15 — i18n VERB 反查（chat + room + account，过滤全量）

文档-only。不改产品代码。本文件是 atlas **停条件输入**：若「必须补行清单」非空，PM **不能**停。

对照域：`docs/qa/pm-feature-atlas/00`–`11` 功能行的 **稳定语义 id + 功能一句话 + 完整入口点击序列** UNION。本分支 **无** `12`–`14`（`ls docs/qa/pm-feature-atlas/1[2-4]-*.md` → absent），故不并入。

基线分支：`cursor/pm-atlas-merge-06-11-f8ed`。权威英文：`packages/i18n/src/locales/en.i18n.json`。

诚实标记：`[读]` = 源码/三列字符串；`[待渲染实测]` = 未挂真实 UI。HIT 必须写出匹配 id。MISS 保持 MISS，**不**在本文件发明 8 列功能行。

---

## 1. 路径核实

```bash
ls -la packages/i18n/src/locales/en.i18n.json
# -rw-r--r-- 1 ubuntu ubuntu 522594 ... packages/i18n/src/locales/en.i18n.json

ls -la apps/meteor/packages/rocketchat-i18n
# i18n -> ../../../../packages/i18n/dist/resources   （Meteor 包装；源在 packages/i18n）

python3 -c "import json; print(len(json.load(open('packages/i18n/src/locales/en.i18n.json'))))"
# 7392

ls docs/qa/pm-feature-atlas/1[2-4]-*.md
# 12-14 absent
```

`docs/i18n.md`：`en.i18n.json` 是基语言。与 05 抽样同一文件（7392 keys）。

---

## 2. 精确过滤（可复跑，不是 30 抽样）

05 的 30 样是 `826 candidates` 上 `random.Random(20260820).sample(..., 30)`。本文件是 **同一 VERB 定义 + chat/room/account 域过滤后的全量**。

### 2.1 域词（rg / jq 体）

任务列出的 token。对 **key 或 English value** 做不区分大小写匹配：

```text
Message_|Quote|Reply|Pin|Star|Edit|Delete|Forward|Copy|Upload|Record|
Join|Leave|Hide|Favorite|Ignore|Mute|Invite|Archive|Unread|Translate|
Thread|Discussion|Preference|Password|Two[-_ ]?factor|TwoFactor|
E2E|Token|Avatar|Logout
```

```bash
# 仅域词、未加 VERB 约束（量级；含设置长句）
rg -c -i 'Message_|Quote|Reply|Pin|Star|Edit|Delete|Forward|Copy|Upload|Record|Join|Leave|Hide|Favorite|Ignore|Mute|Invite|Archive|Unread|Translate|Thread|Discussion|Preference|Password|Two-factor|Two_factor|TwoFactor|E2E|Token|Avatar|Logout' \
  packages/i18n/src/locales/en.i18n.json
# 1631（rg 按行）。jq 按 entry 约 1682（复数对象 + 同行值）
```

jq 等价（扁平 string value；复数对象取 `other`）：

```bash
jq -r --arg re 'Message_|Quote|Reply|Pin|Star|Edit|Delete|Forward|Copy|Upload|Record|Join|Leave|Hide|Favorite|Ignore|Mute|Invite|Archive|Unread|Translate|Thread|Discussion|Preference|Password|Two[-_ ]?factor|TwoFactor|E2E|Token|Avatar|Logout' '
  to_entries[]
  | .value as $raw
  | (if ($raw|type)=="string" then $raw
     elif ($raw|type)=="object" then ($raw.other // $raw.one // "")
     else empty end) as $v
  | select((.key + " " + $v) | test($re; "i"))
  | "\(.key)\t\($v)"
' packages/i18n/src/locales/en.i18n.json | wc -l
# 1682
```

### 2.2 VERB-like（与 05 同一套 + 少量 chat 祈使）

英文 1–4 词，首词 ∈ VERB 集合。05 原集保留；本过滤额外承认：`Translate` `Favorite` `Unfavorite` `Mark` `Jump` `Reveal` `Enter`（否则 `Mark_unread` / `Jump_to_message` / `Enter_E2E_password` 会漏）。

短键本身就是按钮文案时，即使值是单词也收入：`Quote Reply Pin Unpin Star Edit Delete Forward Copy Upload Record Join Leave Hide Favorite Ignore Mute Invite Archive Translate Logout Report Unstar`。

另要求 key 或 value 带 chat/room/account 上下文（`message|composer|room|channel|…|e2e|password|avatar|…`），避免裸 `Enable`/`Edit` 把管理台灌进来。**不**再套 05 的「key 不含 `.` 且 `_` < 4」——那是为了把 826 压成可抽样；本文件用域词替代。

### 2.3 抽取命令（权威；本表由此生成）

VERB-like ∧ 域词 ∧ CRA 上下文。与 §4 同一规则：

```bash
python3 - <<'PY'
import json, re
data = json.load(open("packages/i18n/src/locales/en.i18n.json"))
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
DOMAIN = re.compile(
  r"(?i)(Message_|Quote|Reply|Pin|Star|Edit|Delete|Forward|Copy|Upload|Record|"
  r"Join|Leave|Hide|Favorite|Ignore|Mute|Invite|Archive|Unread|Translate|"
  r"Thread|Discussion|Preference|Password|Two[-_ ]?factor|TwoFactor|"
  r"E2E|Token|Avatar|Logout)")
CRA = re.compile(
  r"(?i)(message|composer|room|channel|group|discussion|thread|chat|account|"
  r"profile|avatar|password|preference|e2e|e2ee|token|logout|unread|translate|"
  r"favorite|ignore|mute|invite|archive|quote|reply|pin|star|forward|upload|"
  r"record|join|leave|hide|permalink|webdav|receipt|two.?factor|2fa|"
  r"encryption|encrypted|personal.access|direct.?message|\bdm\b|mention|"
  r"reaction|follow|unstar|unpin|unarchive|unmute|unfollow)")
SHORT = {"Quote","Reply","Pin","Unpin","Star","Edit","Delete","Forward","Copy",
         "Upload","Record","Join","Leave","Hide","Favorite","Ignore","Mute",
         "Invite","Archive","Translate","Logout","Report","Unstar"}
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
    if k in SHORT or ((DOMAIN.search(k) or DOMAIN.search(v)) and (
        CRA.search(k) or CRA.search(v) or
        re.search(r"(?i)^(Message_|Room_|Chat_|E2E_|Thread_|Discussion_|Preference)", k))):
        n += 1
print("TOTAL", len(data), "EXTRACTED", n)
PY
# TOTAL 7392 EXTRACTED 258
```

### 2.4 对照 UNION（00–11 三列）

只搜功能表前三列。单词语 English（`Edit` / `Join` / `Enable`）**单独不算 HIT**，必须 **key 出现在三列**，或 **≥2 词 English 整句**出现。

```text
atlas files: 00-blueprint.md … 11-composer-states.md（12 个；05 几乎无功能 id）
ATLAS_UNION_ROWS 3689
12-14 absent
```

OOS 前缀（设置 / 权限 kebab / 管理·市场·全渠道经理）：`Troubleshoot_` `Markdown_Marked_` `VideoConf_Enable_` `Accounts_` `Message_Allow*` `Message_Read_Receipt_*` `FileUpload_` `Layout_` `LDAP_` `SAML_` `Omnichannel_` `Livechat_` `ABAC_` `registration.` 以及 kebab `archive-room` `delete-user` 等。**例外**：key **本身**已写进三列（如 `Accounts_SetDefaultAvatar`）仍算 HIT。

`Troubleshoot_*` / `Markdown_Marked_*` 的英文是「Disable Notifications」「Enable Marked Tables」——**没有** §2.1 域词，故 **未进入 EXTRACTED**。不是漏判；见 §6。

---

## 3. 计数与验算

| 桶 | N | 命令 |
| --- | --- | --- |
| en keys | 7392 | `python3 -c "import json; print(len(json.load(open('packages/i18n/src/locales/en.i18n.json'))))"` |
| 域词 rg | 1631 | 见 §2.1（jq entry 约 1682） |
| EXTRACTED | 258 | §2.3 |
| HIT | 90 | 下框 python（只切 §4，避免把本表命令列算进去） |
| MISS | 60 | 同上 |
| OOS | 108 | 同上 |
| 必须补行 | 6 | 下框 `MUST`（§5 表体） |
| 12–14 | 0 | absent |

```bash
python3 - <<'PY'
from pathlib import Path
t = Path("docs/qa/pm-feature-atlas/15-i18n-chat-room-account.md").read_text()
h4, h5, h6 = "## " + "4. 全量表", "## " + "5. 必须补行", "## " + "6. 仍属管理"
s4 = t[t.rfind(h4):t.rfind(h5)]
s5 = t[t.rfind(h5):t.rfind(h6)]
hit = sum(1 for ln in s4.splitlines() if "| HIT `" in ln)
miss = sum(1 for ln in s4.splitlines() if "| MISS |" in ln)
oos = sum(1 for ln in s4.splitlines() if "| OOS |" in ln)
must = sum(1 for ln in s5.splitlines() if ln.startswith("| `"))
print(f"HIT {hit} MISS {miss} OOS {oos} SUM {hit+miss+oos} MUST {must}")
PY
# HIT 90 MISS 60 OOS 108 SUM 258 MUST 6
```

```text
90 + 60 + 108 = 258
258 = EXTRACTED
```

---

## 4. 全量表（key | English | HIT id 或 MISS/OOS | candidate surface）

列 3：`HIT <id>` = 三列命中（优先 CRA 前缀 id）；`MISS` = 三列无 key / 多词语；`OOS` = 管理设置 / 权限 id / 市场·经理面（仍计入 EXTRACTED）。

| key | English | HIT id 或 MISS | candidate surface |
| --- | --- | --- | --- |
| `Accounts_SetDefaultAvatar` | Set Default Avatar | HIT `page.account.profile.avatar.reset` | chat/room/account（三列命中） |
| `Accounts_StatusVisibility_HideStatus` | Hide status | HIT `page.account.profile.status-visibility` | chat/room/account（三列命中） |
| `Accounts_StatusVisibility_HideStatusFromUsers` | Hide status from users | HIT `page.account.profile.status-visibility` | chat/room/account（三列命中） |
| `Archive` | Archive | HIT `omni.manager.departments.open` | chat/room/account（三列命中） |
| `Cancel_recording` | Cancel recording | HIT `implicit.recording.cancel` | chat/room/account（三列命中） |
| `Confirm_password` | Confirm password | HIT `page.account.security.password-confirm` | chat/room/account（三列命中） |
| `Copy` | Copy | HIT `msg.copy.text` | chat/room/account（三列命中） |
| `Delete` | Delete | HIT `msg.delete` | chat/room/account（三列命中） |
| `delete-message` | Delete Message | HIT `page.admin.moderation.delete-message` | chat/room/account（三列命中） |
| `Delete_account` | Delete account | HIT `page.account.profile.delete` | chat/room/account（三列命中） |
| `Delete_account?` | Delete account? | HIT `page.account.profile.delete` | chat/room/account（三列命中） |
| `Delete_message` | Delete message | HIT `page.admin.moderation.delete-message` | chat/room/account（三列命中） |
| `Delete_my_account` | Delete my account | HIT `page.account.profile.delete` | chat/room/account（三列命中） |
| `Disable_E2E_encryption` | Disable E2E encryption | HIT `room.toolbox.e2e` | chat/room/account（三列命中） |
| `Discussion_start` | Start a Discussion | HIT `msg.discussion.start` | chat/room/account（三列命中） |
| `Download_Pending_Avatars` | Download Pending Avatars | HIT `page.admin.import.download-avatars` | chat/room/account（三列命中） |
| `E2E_Enable_Encrypt_Files` | Encrypt files | HIT `composer.state.upload.e2ee.blocked` | chat/room/account（三列命中） |
| `E2E_reset_encryption_keys` | Reset encryption keys | HIT `room.info.e2ee.reset-accordion` | chat/room/account（三列命中） |
| `E2E_reset_encryption_keys_button` | Reset {{roomType}} encryption keys | HIT `room.info.e2ee.reset-open` | chat/room/account（三列命中） |
| `Edit` | Edit | HIT `msg.edit` | chat/room/account（三列命中） |
| `edit-room` | Edit Room | HIT `room.info.live.field.topic` | chat/room/account（三列命中） |
| `Edit_Invite` | Edit Invite | HIT `room.members.invite.edit` | chat/room/account（三列命中） |
| `Enable_E2E_encryption` | Enable E2E encryption | HIT `room.toolbox.e2e` | chat/room/account（三列命中） |
| `Favorite` | Favorite | HIT `room.header.favorite` | chat/room/account（三列命中） |
| `Forgot_password` | Forgot your password? | HIT `route.forgot-password` | chat/room/account（三列命中） |
| `Forward` | Forward | HIT `msg.forward` | chat/room/account（三列命中） |
| `Forward_chat` | Forward chat | HIT `room.quick.chatForward` | chat/room/account（三列命中） |
| `Forward_in_history` | Forward in history | HIT `nav.history.forward` | chat/room/account（三列命中） |
| `Forward_message` | Forward message | HIT `msg.forward` | chat/room/account（三列命中） |
| `Forward_to_department` | Forward to department | HIT `room.quick.chatForward.department` | chat/room/account（三列命中） |
| `Forward_to_user` | Forward to user | HIT `room.quick.chatForward.username` | chat/room/account（三列命中） |
| `Hide` | Hide | HIT `sidebar.roomMenu.hide` | chat/room/account（三列命中） |
| `Hide_additional_fields` | Hide additional fields | HIT `page.admin.users.form.show-additional` | chat/room/account（三列命中） |
| `Hide_On_Workspace` | Hide on workspace | HIT `page.home.custom.visibility` | chat/room/account（三列命中） |
| `Hide_roles` | Hide Roles | HIT `page.account.preferences.link-roles` | chat/room/account（三列命中） |
| `Hide_System_Messages` | Hide system messages | HIT `room.info.field.hide-sys-mes` | chat/room/account（三列命中） |
| `Hide_usernames` | Hide Usernames | HIT `page.account.preferences.link-usernames` | chat/room/account（三列命中） |
| `Ignore` | Ignore | HIT `user.action.ignore` | chat/room/account（三列命中） |
| `Ignore_Two_Factor_Authentication` | Ignore Two Factor Authentication | HIT `page.account.tokens.bypass-2fa` | chat/room/account（三列命中） |
| `Importer_Prepare_Start_Import` | Start Importing | HIT `page.admin.import.prepare.start` | chat/room/account（三列命中） |
| `Invite` | Invite | HIT `room.members.invite-link` | chat/room/account（三列命中） |
| `Invite_Link` | Invite Link | HIT `room.members.invite-link` | chat/room/account（三列命中） |
| `Join` | Join | HIT `composer.join` | chat/room/account（三列命中） |
| `join-without-join-code` | Join Without Join Code | HIT `composer.variant.join-password` | chat/room/account（三列命中） |
| `Join_call` | Join call | HIT `room.calls.join` | chat/room/account（三列命中） |
| `Join_default_channels` | Join default channels | HIT `page.admin.users.form.join-default` | chat/room/account（三列命中） |
| `Join_discussion` | Join discussion | HIT `room.calls.join-discussion` | chat/room/account（三列命中） |
| `Join_rooms` | Join rooms | HIT `page.home.open-directory` | chat/room/account（三列命中） |
| `Join_with_password` | Join with password | HIT `composer.variant.join-password` | chat/room/account（三列命中） |
| `Leave` | Leave | HIT `sidebar.roomMenu.leave` | chat/room/account（三列命中） |
| `Leave_a_comment` | Leave a comment | HIT `room.quick.chatForward.comment` | chat/room/account（三列命中） |
| `Leave_room` | Leave | HIT `sidebar.roomMenu.leave` | chat/room/account（三列命中） |
| `Logout` | Logout | HIT `nav.user.logout` | chat/room/account（三列命中） |
| `Mark_unread` | Mark Unread | HIT `msg.unread.mark` | chat/room/account（三列命中） |
| `Message_AllowUnrecognizedSlashCommand` | Allow Unrecognized Slash Commands | HIT `composer.state.slash.invalid` | chat/room/account（三列命中） |
| `Moderation_Delete_all_messages` | Delete all messages | HIT `page.admin.moderation.delete-all-messages` | chat/room/account（三列命中） |
| `Moderation_Delete_message` | Delete message | HIT `page.admin.moderation.delete-message` | chat/room/account（三列命中） |
| `Mute` | Mute | HIT `user.action.mute` | chat/room/account（三列命中） |
| `Mute_Focused_Conversations` | Mute Focused Conversations | HIT `page.account.preferences.mute-focused` | chat/room/account（三列命中） |
| `Mute_user` | Mute user | HIT `user.action.mute` | chat/room/account（三列命中） |
| `Omnichannel_hide_conversation_after_closing` | Hide conversation after closing | HIT `page.account.omnichannel.hide-after-close` | chat/room/account（三列命中） |
| `Pin` | Pin | HIT `msg.pin` | chat/room/account（三列命中） |
| `pin-message` | Pin Message | HIT `msg.jump` | chat/room/account（三列命中） |
| `Pin_Message` | Pin Message | HIT `msg.pin` | chat/room/account（三列命中） |
| `Quote` | Quote | HIT `msg.quote` | chat/room/account（三列命中） |
| `quote` | quote | HIT `msg.quote` | chat/room/account（三列命中） |
| `Record` | Record | HIT `composer.state.video.start` | chat/room/account（三列命中） |
| `Reply` | Reply | HIT `msg.thread.reply` | chat/room/account（三列命中） |
| `Reply_in_direct_message` | Reply in direct message | HIT `msg.reply.dm` | chat/room/account（三列命中） |
| `Reply_in_thread` | Reply in thread | HIT `msg.thread.reply` | chat/room/account（三列命中） |
| `Report` | Report | HIT `msg.report` | chat/room/account（三列命中） |
| `Reset_E2EE_password` | Reset E2EE password | HIT `page.account.security.e2e-reset` | chat/room/account（三列命中） |
| `Reset_password` | Reset password | HIT `room.info.field.join-code` | chat/room/account（三列命中） |
| `Save_E2EE_password` | Save E2EE password | HIT `tl.e2ee.save-password` | chat/room/account（三列命中） |
| `Select_messages_to_hide` | Select messages to hide | HIT `room.info.field.system-messages` | chat/room/account（三列命中） |
| `Show_counter` | Mark as unread | HIT `room.notif.show-counter` | chat/room/account（三列命中） |
| `Star` | Star | HIT `msg.star` | chat/room/account（三列命中） |
| `Start` | Start | HIT `page.admin.import.prepare.start` | chat/room/account（三列命中） |
| `Stop_Recording` | Stop Recording | HIT `composer.state.video.finish` | chat/room/account（三列命中） |
| `Translate` | Translate | HIT `msg.translate` | chat/room/account（三列命中） |
| `Translate_to` | Translate to | HIT `room.autotranslate.language` | chat/room/account（三列命中） |
| `Unarchive` | Unarchive | HIT `omni.manager.departments.archive` | chat/room/account（三列命中） |
| `Unfavorite` | Unfavorite | HIT `sidebar.roomMenu.toggleFavorite` | chat/room/account（三列命中） |
| `Unmute` | Unmute | HIT `user.action.mute` | chat/room/account（三列命中） |
| `Unmute_user` | Unmute user | HIT `user.action.mute` | chat/room/account（三列命中） |
| `Unpin` | Unpin | HIT `msg.unpin` | chat/room/account（三列命中） |
| `Unstar_Message` | Remove star | HIT `msg.unstar` | chat/room/account（三列命中） |
| `Upload` | Upload | HIT `composer.upload.edit` | chat/room/account（三列命中） |
| `Upload_file` | Upload file | HIT `composer.state.upload.button` | chat/room/account（三列命中） |
| `Upload_private_app` | Upload private app | HIT `mkt.installed.upload` | chat/room/account（三列命中） |
| `Call_started` | Call started | MISS | 系统消息预览，非按钮 |
| `Cancel_message_input` | Cancel | MISS | 无现行 client 绑定（composer.edit.cancel 用 Cancel） |
| `Change_E2EE_password` | Change E2EE password | MISS | Security 页 E2E 段 h3，非按钮 |
| `Clear_all_unreads_question` | Clear all unreads? | MISS | Shift/Ctrl+Esc 清全部未读确认框 |
| `Confirm_new_password` | Confirm New Password | MISS | 无现行 client 绑定 |
| `Confirm_your_password` | Confirm your password | MISS | 无现行 client 绑定 |
| `Copy_password` | Copy password | MISS | 无现行 client 绑定 |
| `Create_a_password` | Create a password | MISS | 注册/重置密码 placeholder（登录壳，非 account 页） |
| `Delete_roomType` | Delete {{roomType}} | MISS | 删房/团队确认标题（room.info.action.delete）；弱命中 `implicit.roomInfo.action.delete`, `implicit.roomInfo.action.delete` |
| `Discussion_title` | Create discussion | MISS | 创建讨论模态标题（msg.discussion.start / page.create.discussion）；弱命中 `composer.state.discussion.open`, `composer.state.discussion.open` |
| `E2E_disable_encryption` | Disable encryption | MISS | 关加密确认钮（06 room.info.e2ee.reset/disable） |
| `E2E_enable` | Enable E2E | MISS | 无现行 client 绑定；弱命中 `room.info.e2ee.enable.confirm`, `room.info.e2ee.enable.confirm` |
| `E2E_enable_encryption` | Enable encryption | MISS | 开加密确认钮（06 room.info.e2ee.enable.confirm）；弱命中 `room.info.e2ee.enable.confirm`, `room.info.e2ee.enable.confirm` |
| `Edit_channel` | Edit channel | MISS | EditRoomInfo 标题（动作 room.info.action.edit）；弱命中 `implicit.roomInfo.action.edit`, `room.info.action.edit` |
| `Edit_discussion` | Edit discussion | MISS | 同上 discussion 变体；弱命中 `implicit.roomInfo.action.edit`, `room.info.action.edit` |
| `Enable_two-factor_authentication` | Enable two-factor authentication | MISS | Security 页 Callout 标题，非按钮 |
| `Enter_E2E_password` | Enter E2EE password | MISS | 输入 E2EE 口令模态标题（动作见 tl.e2ee.enter-password） |
| `Enter_TOTP_password` | Enter TOTP password | MISS | 全局 TOTP 挑战模态标题（钮 Verify） |
| `Forgot_E2EE_Password` | Forgot E2EE password? | MISS | 输入 E2EE 口令模态内「忘记口令」链 |
| `Forgot_password_section` | Forgot password | MISS | 无现行 client 绑定 |
| `Hide_chat` | Hide chat | MISS | VoIP widget 收起通话内聊天 |
| `Hide_room` | Hide | MISS | Hide 房间（room.info.action.hide）；弱命中 `room.info.action.hide`, `sidebar.roomMenu.hide` |
| `Hide_video` | Hide video | MISS | 无现行 client 绑定 |
| `Invite_Users` | Invite Members | MISS | 邀请面板标题（room.members.invite-link）；弱命中 `room.members.invite-link`, `room.members.invite-link` |
| `Join_audio_call` | Join audio call | MISS | 无现行 client 绑定 |
| `Join_channel` | Join channel | MISS | 未订阅房间整页 Join（异于 composer 栏 Join） |
| `Join_Chat` | Join Chat | MISS | 无现行 client 绑定 |
| `Join_conference` | Join conference | MISS | 无现行 client 绑定 |
| `Join_the_given_channel` | Join the given channel | MISS | 斜杠 /join 描述，非按钮 |
| `Join_video_call` | Join video call | MISS | 无现行 client 绑定 |
| `Jump_to_first_unread` | Jump to first unread | MISS | 无现行 client 绑定（03 implicit.unread.jumpToFirst） |
| `Keyboard_Shortcuts_Edit_Previous_Message` | Edit previous message | MISS | 快捷键说明文案（03 shortcut） |
| `Leave_the_current_channel` | Leave the current channel | MISS | 无现行 client 绑定（斜杠 /leave 描述） |
| `Mark_as_unread` | Mark as unread | MISS | 无现行 client 绑定（工具栏用 Mark_unread） |
| `Mute_all_notifications` | Mute all notifications | MISS | 无现行 client 绑定 |
| `Mute_and_dismiss` | Mute and dismiss | MISS | 来电视频会议弹层：静音并关掉 |
| `Mute_microphone` | Mute Microphone | MISS | 无现行 client 绑定（弹层用 Mic_on/off） |
| `Open_thread` | Open Thread | MISS | 无现行 client 绑定 |
| `Search_message_search_failed` | Search request failed | MISS | 搜索失败 toast |
| `Select_an_avatar` | Select an avatar | MISS | 无现行 client 绑定 |
| `Select_message_from_user` | Select message from {{username}} | MISS | 多选 checkbox 名（tl.select.enter）；弱命中 `tl.select.enter`, `tl.select.enter` |
| `Set_as_favorite` | Set as favorite | MISS | 无现行 client 绑定（用 Favorite） |
| `Show_Avatars` | Show Avatars | MISS | 无现行 client 绑定（偏好用 Display_avatars） |
| `Star_Message` | Star Message | MISS | 无现行 client 绑定（工具栏用 Star） |
| `Start_a_call` | Start a call | MISS | 同上弹层标题（钮是 Start_call） |
| `Start_audio_call` | Start audio call | MISS | 无现行 client 绑定 |
| `Start_call` | Start call | MISS | 视频会议 outgoing 弹层确认开呼 |
| `Start_Chat` | Start Chat | MISS | 无现行 client 绑定 |
| `Start_conference_call` | Start conference call | MISS | 无现行 client 绑定 |
| `Start_of_conversation` | Start of conversation | MISS | 时间线前言文案（tl.foreword.*）；弱命中 `tl.foreword.dm-user`, `tl.foreword.dm-user` |
| `Start_video_call` | Start video call | MISS | 无现行 client 绑定 |
| `Start_video_conference` | Start conference call? | MISS | 无现行 client 绑定 |
| `Teams_leave` | Leave Team | MISS | 离开团队模态标题 |
| `Toggle_original_translated` | Toggle original/translated | MISS | 无现行 client 绑定（工具栏 Translate/View_original） |
| `Unmute_microphone` | Unmute Microphone | MISS | 无现行 client 绑定 |
| `Unpin_Message` | Unpin Message | MISS | 无现行 client 绑定（工具栏用 Unpin） |
| `Upload_failed` | Upload failed | MISS | 上传失败 toast；弱命中 `composer.state.upload.reject.size`, `composer.state.upload.reject.size` |
| `Upload_file_question` | Upload file? | MISS | 无现行 client 绑定 |
| `Upload_From` | Upload from {{name}} | MISS | WebDAV picker 标题（composer.state.webdav.pick） |
| `Upload_user_avatar` | Upload avatar | MISS | 房间头像上传 title（room.info.edit.avatar.upload）；弱命中 `room.info.edit.avatar.upload`, `room.info.edit.avatar.upload` |
| `ABAC_Delete_room_attribute` | Delete attribute | OOS | admin-prefix/perm |
| `ABAC_Edit_Room` | Edit Room | OOS | admin-prefix/perm |
| `Accounts_AllowPasswordChange` | Allow Password Change | OOS | admin-prefix/perm |
| `Accounts_AllowUserAvatarChange` | Allow User Avatar Change | OOS | admin-prefix/perm |
| `Accounts_Password_Policy_Enabled` | Enable Password Policy | OOS | admin-prefix/perm |
| `Accounts_Registration_InviteUrlType` | Invite URL Type | OOS | admin-prefix/perm |
| `Accounts_StatusVisibility_HideFrom` | Hide from... | OOS | admin-prefix/perm |
| `Accounts_StatusVisibility_HideFromUsers` | Hide from users | OOS | admin-prefix/perm |
| `Accounts_TwoFactorAuthentication_Enabled` | Enable Two Factor Authentication | OOS | admin-prefix/perm |
| `Apps_Permissions_message_write` | Send and modify messages | OOS | admin-prefix/perm |
| `archive-room` | Archive Room | OOS | admin-prefix/perm |
| `AutoTranslate_Enabled` | Enable Auto-Translate | OOS | admin-prefix/perm |
| `BBB_Join_Meeting` | Join Meeting | OOS | admin-prefix/perm |
| `BBB_Start_Meeting` | Start Meeting | OOS | admin-prefix/perm |
| `create-invite-links` | Create Invite Links | OOS | admin-prefix/perm |
| `create-personal-access-tokens` | Create Personal Access Tokens | OOS | admin-prefix/perm |
| `delete-c` | Delete Public Channels | OOS | admin-prefix/perm |
| `delete-d` | Delete Direct Messages | OOS | admin-prefix/perm |
| `delete-livechat-contact` | Delete Omnichannel Contact | OOS | admin-prefix/perm |
| `delete-own-message` | Delete Own Message | OOS | admin-prefix/perm |
| `delete-p` | Delete Private Channels | OOS | admin-prefix/perm |
| `delete-team-channel` | Delete Channel within Team | OOS | admin-prefix/perm |
| `delete-team-group` | Delete Group within Team | OOS | admin-prefix/perm |
| `Delete_all_closed_chats` | Delete all closed chats | OOS | admin/mkt/omni-OOS |
| `Direct_Reply_Delete` | Delete Emails | OOS | admin-prefix/perm |
| `Direct_Reply_Enable` | Enable Direct Reply | OOS | admin-prefix/perm |
| `E2E_Enabled_Default_DirectRooms` | Encrypt direct messages | OOS | admin-prefix/perm |
| `E2E_Enabled_Default_PrivateRooms` | Encrypt private rooms | OOS | admin-prefix/perm |
| `edit-message` | Edit Message | OOS | admin-prefix/perm |
| `edit-omnichannel-contact` | Edit Omnichannel Contact | OOS | admin-prefix/perm |
| `edit-other-user-avatar` | Edit Other User Avatar | OOS | admin-prefix/perm |
| `edit-other-user-password` | Edit Other User Password | OOS | admin-prefix/perm |
| `edit-room-avatar` | Edit Room Avatar | OOS | admin-prefix/perm |
| `edit-room-retention-policy` | Edit Room's Retention Policy | OOS | admin-prefix/perm |
| `edit-team-channel` | Edit Team Channel | OOS | admin-prefix/perm |
| `Edit_Contact_Profile` | Edit Contact Profile | OOS | admin/mkt/omni-OOS |
| `Enable_Password_History` | Enable Password History | OOS | admin-prefix/perm |
| `Favorite_Rooms` | Enable Favorite Rooms | OOS | admin-prefix/perm |
| `FileUpload_Canceled` | Upload canceled | OOS | admin-prefix/perm |
| `FileUpload_Webdav_Upload_Folder_Path` | Upload Folder Path | OOS | admin-prefix/perm |
| `Hide_counter` | Hide counter | OOS | admin/mkt/omni-OOS |
| `Hide_Unread_Room_Status` | Hide Unread Room Status | OOS | admin-prefix/perm |
| `Invite_removed` | Invite removed successfully | OOS | admin/mkt/omni-OOS |
| `Join_the_Community` | Join the Community | OOS | admin/mkt/omni-OOS |
| `Join_your_team` | Join your team | OOS | admin/mkt/omni-OOS |
| `Layout_Login_Hide_Logo` | Hide Logo | OOS | admin-prefix/perm |
| `Layout_Login_Hide_Powered_By` | Hide "Powered by" | OOS | admin-prefix/perm |
| `Layout_Login_Hide_Title` | Hide Title | OOS | admin-prefix/perm |
| `LDAP_Sync_AutoLogout_Enabled` | Enable Auto Logout | OOS | admin-prefix/perm |
| `leave-c` | Leave Channels | OOS | admin-prefix/perm |
| `leave-p` | Leave Private Groups | OOS | admin-prefix/perm |
| `Livechat_enable_message_character_limit` | Enable message character limit | OOS | admin-prefix/perm |
| `Livechat_forward_open_chats` | Forward open chats | OOS | admin-prefix/perm |
| `Livechat_hide_expand_chat` | Hide "Expand chat" | OOS | admin-prefix/perm |
| `Livechat_hide_system_messages` | Hide system messages | OOS | admin-prefix/perm |
| `logout-device-management` | Logout Device Management | OOS | admin-prefix/perm |
| `logout-other-user` | Logout Other User | OOS | admin-prefix/perm |
| `Message_AllowDeleting` | Allow Message Deleting | OOS | admin-prefix/perm |
| `Message_AllowDeleting_BlockDeleteInMinutes_Description` | Enter 0 to disable blocking. | OOS | admin-prefix/perm |
| `Message_AllowEditing` | Allow Message Editing | OOS | admin-prefix/perm |
| `Message_AllowEditing_BlockEditInMinutesDescription` | Enter 0 to disable blocking. | OOS | admin-prefix/perm |
| `Message_AllowPinning` | Allow Message Pinning | OOS | admin-prefix/perm |
| `Message_AllowSnippeting` | Allow Message Snippeting | OOS | admin-prefix/perm |
| `Message_AllowStarring` | Allow Message Starring | OOS | admin-prefix/perm |
| `Message_ErasureType_Delete` | Delete All Messages | OOS | admin-prefix/perm |
| `Message_HideType_livechat_closed` | Hide "Conversation finished" messages | OOS | admin-prefix/perm |
| `Message_HideType_livechat_started` | Hide "Conversation started" messages | OOS | admin-prefix/perm |
| `Message_HideType_livechat_transfer_history` | Hide "Conversation transfered" messages | OOS | admin-prefix/perm |
| `Message_Read_Receipt_Archive_Batch_Size` | Archive Batch Size | OOS | admin-prefix/perm |
| `Message_Read_Receipt_Archive_Cron` | Archive Cron Schedule | OOS | admin-prefix/perm |
| `Message_Read_Receipt_Archive_Enabled` | Enable Read Receipts Archive | OOS | admin-prefix/perm |
| `Message_Read_Receipt_Archive_Retention_Days` | Archive Retention Days | OOS | admin-prefix/perm |
| `Message_Read_Receipt_Enabled` | Show Read Receipts | OOS | admin-prefix/perm |
| `Message_ShowDeletedStatus` | Show Deleted Status | OOS | admin-prefix/perm |
| `Message_ShowEditedStatus` | Show Edited Status | OOS | admin-prefix/perm |
| `Message_ShowFormattingTips` | Show Formatting Tips | OOS | admin-prefix/perm |
| `Moderation_Delete_this_message` | Delete this message | OOS | admin-prefix/perm |
| `Moderation_Hide_reports` | Hide reports | OOS | admin-prefix/perm |
| `Moderation_Reset_user_avatar` | Reset user avatar | OOS | admin-prefix/perm |
| `mute-user` | Mute User | OOS | admin-prefix/perm |
| `onboarding.form.adminInfoForm.fields.password.placeholder` | Create password | OOS | admin-prefix/perm |
| `PiwikAnalytics_domains` | Hide Outgoing Links | OOS | admin-prefix/perm |
| `Private_app_install_modal_title` | Upload disabled private app | OOS | admin-prefix/perm |
| `RegisterWorkspace_Token_Title` | Register workspace with token | OOS | admin-prefix/perm |
| `registration.component.form.confirmPassword` | Confirm your password | OOS | admin-prefix/perm |
| `registration.component.form.joinYourTeam` | Join your team | OOS | admin-prefix/perm |
| `registration.component.resetPassword` | Reset password | OOS | admin-prefix/perm |
| `registration.page.login.forgot` | Forgot your password? | OOS | admin-prefix/perm |
| `registration.page.resetPassword.sendInstructions` | Send instructions | OOS | admin-prefix/perm |
| `Reply_via_Email` | Reply via email | OOS | admin/mkt/omni-OOS |
| `ReplyTo` | Reply-To | OOS | admin/mkt/omni-OOS |
| `SAML_Custom_Logout_Behaviour` | Logout Behaviour | OOS | admin-prefix/perm |
| `SAML_Custom_validate_logout_request_signature` | Verify Logout Request Signature | OOS | admin-prefix/perm |
| `SAML_Custom_validate_logout_response_signature` | Verify Logout Response Signature | OOS | admin-prefix/perm |
| `SAML_LogoutRequest_Template` | Logout Request Template | OOS | admin-prefix/perm |
| `SAML_LogoutResponse_Template` | Logout Response Template | OOS | admin-prefix/perm |
| `Send_request_on_forwarding` | Send Request on Forwarding | OOS | admin/mkt/omni-OOS |
| `start-discussion` | Start Discussion | OOS | admin-prefix/perm |
| `start-discussion-other-user` | Start Discussion (Other-User) | OOS | admin-prefix/perm |
| `Start_a_free_trial` | Start a free trial | OOS | admin/mkt/omni-OOS |
| `Start_Date` | Start Date | OOS | admin/mkt/omni-OOS |
| `Start_free_trial` | Start free trial | OOS | admin/mkt/omni-OOS |
| `Start_Time` | Start Time | OOS | admin/mkt/omni-OOS |
| `unarchive-room` | Unarchive Room | OOS | admin-prefix/perm |
| `Upload_anyway` | Upload anyway | OOS | admin/mkt/omni-OOS |
| `Upload_app` | Upload App | OOS | admin/mkt/omni-OOS |
| `Upload_Folder_Path` | Upload Folder Path | OOS | admin/mkt/omni-OOS |
| `Upload_license_file` | Upload license file | OOS | admin/mkt/omni-OOS |

本节表体 **258**（不含表头）。用 §3 python 按标题切片计数，不要对全文 `rg`（会把 §3/§5/§6 算进去）。

---

## 5. 必须补行清单

下列 MISS **确有用户可点控件**，且 00–11 **没有**覆盖该入口（弱命中标题 / 已有「打开弹层」行不够）。**不**在此发明 8 列行。只给 key + 按钮 `file:line`。

| key | English | 按钮 file:line | 为何现有行不够 |
| --- | --- | --- | --- |
| `Join_channel` | Join channel | `apps/meteor/client/views/room/NotSubscribedRoom.tsx:37` | 未订阅时整页 `StatesAction`。`composer.join` 是发送栏 Join（`MessageBox.tsx`），入口不同 |
| `Clear_all_unreads_question` | Clear all unreads? | 确认钮 `Yes_clear_all`：`apps/meteor/client/views/root/hooks/useEscapeKeyStroke.ts:36`（标题 :35）。`AppLayout.tsx:56` 挂载 | 03 `shortcut.global.markAllAsRead.documented-unbound` 写「client 无绑定」。`useEscapeKeyStroke` **已**绑 Shift/Ctrl+Esc 并弹出确认。缺「确认后清全部未读」行 |
| `Forgot_E2EE_Password` | Forgot E2EE password? | `apps/meteor/client/views/e2e/EnterE2EPasswordModal/EnterE2EPasswordModal.tsx:116`（`FieldLink`） | `page.account.security.e2e-reset` 是 Security 页 `Reset_E2EE_password`。本链在进房口令模态内，入口不同 |
| `Start_call` | Start call | `apps/meteor/client/views/room/contextualBar/VideoConference/VideoConfPopups/VideoConfPopup/StartCallPopup.tsx:101` | 02 `room.toolbox.start-video-call` 写到「outgoing 弹层出现」。真正开呼在此钮。弹层内 Cam/Mic 也未拆行 |
| `Mute_and_dismiss` | Mute and dismiss | `apps/meteor/client/views/room/contextualBar/VideoConference/VideoConfPopups/VideoConfPopup/IncomingPopup.tsx:92` | 来电弹层。06 `room.calls.*` 只覆盖 Calls 历史列表。同弹层 `Accept`/`Decline` 未过域过滤（无 Message_/Room_ 等），但同属此缺口 |
| `Hide_chat` | Hide chat | `packages/ui-voip/src/components/Actions/ActionToggleChat.tsx:12` | 05 把 `ui-voip` widget 交给 implicit。03 **无** 通话中收起聊天行 |

本节表体 **6**。

未列入（MISS 但不是「必须补行」）：

- 已有动作的标题/确认文案：`Edit_channel` `Edit_discussion` `Invite_Users` `Delete_roomType` `Discussion_title` `Teams_leave` `Hide_room` `E2E_enable_encryption` `E2E_disable_encryption` `Enter_E2E_password`（`tl.e2ee.enter-password`）`Upload_From` `Upload_user_avatar` `Change_E2EE_password`（h3）`Enable_two-factor_authentication`（Callout）`Start_a_call`（弹层标题）`Enter_TOTP_password`（标题；钮 `Verify`，附着 `page.account.security.totp.*` / `route.2fa`）。
- 无现行 `t('Key')` 绑定：`Star_Message` `Unpin_Message` `Mark_as_unread` `Jump_to_first_unread` `Join_audio_call` `Join_video_call` 等（UI 用了更短的 `Star`/`Unpin`/`Mark_unread`/`Join_call`）。
- toast / 系统句：`Call_started` `Upload_failed` `Search_message_search_failed` `Start_of_conversation`。
- 登录壳 placeholder：`Create_a_password`（04 只打开 `route.register` / `route.reset-password`）。

---

## 6. 仍属管理字段 OOS

EXTRACTED 里 **108** 条：设置 id、权限 kebab、排障/布局/LDAP/SAML、全渠道经理、市场上传、ABAC。表 §4 列 3 为 `OOS`。

本过滤 **未收入**（无 §2.1 域词）但仍属管理、05 抽样曾抽到的：

| key | English | 为何不在 EXTRACTED |
| --- | --- | --- |
| `Troubleshoot_Disable_Presence_Broadcast` | Disable Presence Broadcast | 无 Message_/E2E/… 域词 |
| `Troubleshoot_Disable_Notifications` | Disable Notifications | 同上 |
| `Markdown_Marked_SmartLists` | Enable Marked Smart Lists | 同上 |
| `Markdown_Marked_Tables` | Enable Marked Tables | 同上 |
| `VideoConf_Enable_Groups` | Enable in private channels | key/value 无 §2.1 域词（「messages」≠ `Message_`） |

它们继续 OOS，不升格为必须补行。字段级设置仍按 05：约 972 次 `settings.add`，不按 key 建行。

---

## 7. 停条件

**必须补行清单 = 6 ≠ 0。PM 不能停。**

补行时建议新 id 落在现有分册（不要在本文件编 8 列）：

- `Join_channel` → 03 房间隐式 / 未订阅空态
- `Clear_all_unreads_question` → 03 shortcut（并修正 documented-unbound）
- `Forgot_E2EE_Password` → 10 `tl.e2ee.*` 或 03 E2E 模态
- `Start_call` / `Mute_and_dismiss` → 06 VideoConf 弹层内部
- `Hide_chat` → 03 implicit voip widget

---

## 8. 边界

- 只覆盖主包 `en.i18n.json`。`packages/livechat/src/i18n/en.json` 不并入（08 已单独处理 widget）。
- HIT 只证明三列出现过该 key/多词语，不证明 role+name 已实测。
- `Archive` 三列命中的是 08 部门归档，不是 06 `room.info.field.archived`（后者入口是 `Room_archivation_state_true`）。不把部门 HIT 冒充房间归档。
- 权限 kebab（`archive-room` `edit-message`）进 OOS，即使 00 的 30 样曾把 `archive-room` 标 HIT。

调查日：2026-08-20。基线：`cursor/pm-atlas-merge-06-11-f8ed`。
