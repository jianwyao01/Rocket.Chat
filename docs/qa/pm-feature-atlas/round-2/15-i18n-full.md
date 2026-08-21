# 15 — i18n VERB 反查（FULL，无抽样）

文档-only。不改产品代码。Round 2 Volume 15。

对照：**冻结** `e519470d35b6caf5b228d81aef41c86aab3051f4` 上的英文 i18n。HIT 的 atlas id 仅作参考，取自 `cursor/pm-atlas-merge-12-16-1b5b`（round-1 00–16）；**不**把那棵树的代码当本提交事实。

诚实标记：`[读]` = 源码/三列字符串；`[待渲染实测]` = 未挂真实 UI。HIT 必须写出匹配 id。MISS **不**在本文件发明 8 列功能行，只列「必须补行」+ `file:line`（本树 e519470）。

与 round-1 `15-i18n-chat-room-account.md` 的差：那份是 CRA 域过滤后的 258；本份是 **同一 VERB 定义、去掉域过滤与抽样** 的全量。

---

## 1. 路径核实

```bash
git rev-parse HEAD
# e519470d35b6caf5b228d81aef41c86aab3051f4

ls -la packages/i18n/src/locales/en.i18n.json
# -rw-r--r-- ... 520371 ... packages/i18n/src/locales/en.i18n.json

ls -la apps/meteor/packages/rocketchat-i18n
# i18n -> ../../../../packages/i18n/dist/resources   （Meteor 包装；源在 packages/i18n）

python3 -c "import json; print(len(json.load(open('packages/i18n/src/locales/en.i18n.json'))))"
# 7385
```

`docs/i18n.md`：`en.i18n.json` 是基语言。本提交 **7385** keys（round-1 基线曾是 7392；评审只复跑本 SHA）。

没有第二份英文源。`packages/livechat/src/i18n/en.json` 不并入（08 已单独处理 widget）。

---

## 2. 精确过滤（可复跑，不是 30 抽样）

05 的 30 样是 `CANDIDATES` 上 `random.Random(20260820).sample(..., 30)`。本文件是 **同一 VERB 定义的全量**：英文 1–4 词且首词 ∈ VERB；扁平化复数对象；**不**再套 05 的「key 不含 `.` 且 `_` < 4」（那是为了把集合压成可抽样）；**不**再套 CRA 域词。

VERB 集 = 05 原集 ∪ vol.15 额外：`Translate` `Favorite` `Unfavorite` `Mark` `Jump` `Reveal` `Enter`。

### 2.1 权威抽取（python；评审复跑这一段）

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
# TOTAL 7385 EXTRACTED 929
```

### 2.2 同规则的 jq（评审可对拍）

```bash
# $wr 用 --arg，避免 bash 单引号吃掉 apostrophe
jq -r --arg wr "[A-Za-z']+" --argjson verbs '[
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
"Translate","Favorite","Unfavorite","Mark","Jump","Reveal","Enter"
]' '
  to_entries[]
  | .value as $raw
  | (if ($raw|type)=="string" then $raw
     elif ($raw|type)=="object" then ($raw.other // $raw.one // $raw.zero // "")
     else empty end) as $v
  | ($v | [scan($wr)]) as $w
  | select(($w|length) >= 1 and ($w|length) <= 4)
  | (($w[0][0:1]|ascii_upcase) + $w[0][1:]) as $first
  | select($verbs | index($first))
  | .key
' packages/i18n/src/locales/en.i18n.json | wc -l
# 929
```

### 2.3 05 抽样宇宙（交叉核对，不是本表 EXTRACTED）

05 原命令去掉 `.sample`，并保留「`_` ≥ 4 或含 `.` 则排除」：

```bash
python3 - <<'PY'
import json, re
data = json.load(open('packages/i18n/src/locales/en.i18n.json'))
VERBS = {  # 仅 05 原集，无 Translate/Mark/…
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
}
def is_actiony(k, v):
    if not isinstance(v, str): return False
    words = re.findall(r"[A-Za-z']+", v)
    if not (1 <= len(words) <= 4): return False
    first = words[0][:1].upper() + words[0][1:]
    if first not in VERBS: return False
    if k.count('_') >= 4 or '.' in k: return False
    return True
print(sum(1 for k,v in data.items() if is_actiony(k,v)), len(data))
PY
# 822 7385   （round-1 同规则曾是 826 / 7392）
```

`822` ⊂ `929`。差集 = 05 过滤掉的长设置/点分 key + 15 额外动词（`Mark_unread` `Jump_to_message` `Translate` `Favorite` …）。本表用 **929**。

### 2.4 HIT 规则

对照 round-1 `00-blueprint.md` 全部 8 列功能行的 **前三列**（稳定 id + 功能一句话 + 入口序列）。

- 单词语 English（`Edit` / `Join` / `Enable` / `Allow`）**单独不算 HIT**，必须 **key 出现在三列**，或 **≥2 词 English 整句**出现。
- 例外：round-1 16 的 6 条必须补行已有 canonical id（`fill.*` / `account.gap.*` / `room.chrome.*`）→ HIT。
- 再例外：本树 `t('Key')` 绑定的控件，其入口已被 00–16 某行写明（标题/同文件同动作）→ HIT，id 见 §4。
- 设置 id 只出现在「门控」列 ≠ HIT（那是字段级 OOS）。

```text
atlas ref: cursor/pm-atlas-merge-12-16-1b5b
ATLAS_8COL_ROWS 1876  UNIQUE_IDS 1709
```

---

## 3. 计数与验算

| 桶 | N | 命令 |
| --- | --- | --- |
| en keys | 7385 | `python3 -c "import json; print(len(json.load(open('packages/i18n/src/locales/en.i18n.json'))))"` |
| EXTRACTED | 929 | §2.1 / §2.2 |
| HIT | 423 | 下框 python（只切 §4） |
| MISS | 24 | 同上；= §5 必须补行 |
| OOS | 482 | 同上 |
| 必须补行 | 24 | §5 表体 `^\| \`` |

```bash
python3 - <<'PY'
from pathlib import Path
t = Path("docs/qa/pm-feature-atlas/round-2/15-i18n-full.md").read_text()
h4, h5, h6 = "## 4. 全量表", "## 5. 必须补行", "## 6. OOS 说明"
s4 = t[t.rfind(h4):t.rfind(h5)]
s5 = t[t.rfind(h5):t.rfind(h6)]
hit = sum(1 for ln in s4.splitlines() if "| HIT `" in ln)
miss = sum(1 for ln in s4.splitlines() if "| MISS |" in ln)
oos = sum(1 for ln in s4.splitlines() if "| OOS |" in ln)
must = sum(1 for ln in s5.splitlines() if ln.startswith("| `"))
print(f"HIT {hit} MISS {miss} OOS {oos} SUM {hit+miss+oos} MUST {must}")
PY
# HIT 423 MISS 24 OOS 482 SUM 929 MUST 24
```

```text
423 + 24 + 482 = 929
929 = EXTRACTED
```

---

## 4. 全量表（key | English | HIT id 或 MISS/OOS | candidate surface）

列 3：`HIT <id>` = 三列或语义命中；`MISS` = 用户可点且 00–16 无该入口；`OOS` = 管理设置 / 权限 kebab / 错误名词 / toast / 未绑定 / 已有动作的标题或字段。

| key | English | HIT id 或 MISS | candidate surface |
| --- | --- | --- | --- |
| `ABAC_Classification_Banners_Enabled` | Enable classification banners | HIT `page.admin.abac.setting.banners-enabled` | 3col |
| `ABAC_Delete_room_attribute` | Delete attribute | OOS | admin-prefix |
| `ABAC_Edit_attribute` | Edit attribute | OOS | admin-prefix |
| `ABAC_Search_attributes` | Search attributes | HIT `page.admin.abac.attr.search` | 3col |
| `ABAC_Remove_attribute` | Delete attribute value | HIT `page.admin.abac.attr.remove-value` | 3col |
| `ABAC_Add_Attribute` | Add Attribute | HIT `page.admin.abac.rooms.add-attr` | 3col |
| `ABAC_Edit_Room` | Edit Room | HIT `implicit.editRoomInfo.save` | 3col |
| `ABAC_Add_room` | Add Room | OOS | admin-prefix |
| `ABAC_Search_Attribute` | Search attribute | OOS | admin-prefix |
| `ABAC_Select_Attribute_Values` | Select attribute values | OOS | admin-prefix |
| `ABAC_Update_room_confirmation_modal_title` | Update ABAC room | OOS | admin-prefix |
| `AI_Intelligent_Search_Enabled` | Enable AI Search | OOS | settings.add |
| `AI_Intelligent_Search_Answer_System_Prompt` | Answer generation system prompt | OOS | settings.add |
| `Enable_AI_Search` | Enable AI Search | OOS | unbound |
| `Disable_AI_Search` | Disable AI Search | OOS | unbound |
| `API_Allow_Infinite_Count` | Allow Getting Everything | OOS | settings.add |
| `API_EmbedDisabledFor` | Disable Embed for Users | OOS | admin-prefix |
| `API_Enable_CORS` | Enable CORS | OOS | settings.add |
| `API_Enable_Rate_Limiter` | Enable Rate Limiter | OOS | settings.add |
| `API_Enable_Shields` | Enable Shields | OOS | settings.add |
| `Accept` | Accept | HIT `chat.micro.invite.accept` | 3col |
| `Accept_Call` | Accept Call | OOS | unbound |
| `Accept_without_mic` | Accept without mic | MISS | packages/ui-voip/src/views/PermissionFlow/PermissionFlowModal.tsx:46 |
| `Accounts_AllowAnonymousRead` | Allow Anonymous Read | OOS | settings.add |
| `Accounts_AllowAnonymousWrite` | Allow Anonymous Write | OOS | settings.add |
| `Accounts_AllowEmailChange` | Allow Email Change | OOS | settings.add |
| `Accounts_AllowEmailNotifications` | Allow Email Notifications | OOS | settings.add |
| `Accounts_AllowFeaturePreview` | Allow Feature Preview | HIT `page.admin.feature-preview.allow` | 3col |
| `Accounts_AllowInvisibleStatusOption` | Allow Invisible status option | OOS | settings.add |
| `Accounts_AllowPasswordChange` | Allow Password Change | OOS | settings.add |
| `Accounts_AllowRealNameChange` | Allow Name Change | OOS | settings.add |
| `Accounts_AllowUserAvatarChange` | Allow User Avatar Change | OOS | settings.add |
| `Accounts_AllowUserProfileChange` | Allow User Profile Change | OOS | settings.add |
| `Accounts_AllowUserStatusMessageChange` | Allow Custom Status Message | OOS | settings.add |
| `Accounts_AllowUsernameChange` | Allow Username Change | OOS | settings.add |
| `Accounts_LoginExpiration` | Login Expiration in Days | OOS | settings.add |
| `Accounts_OAuth_Custom_Enable` | Enable | OOS | admin-prefix |
| `Accounts_OAuth_Custom_Login_Style` | Login Style | OOS | admin-prefix |
| `Accounts_OAuth_Custom_Merge_Roles` | Merge Roles from SSO | OOS | admin-prefix |
| `Accounts_OAuth_Custom_Merge_Users` | Merge users | OOS | admin-prefix |
| `Accounts_OAuth_Gitlab_merge_users` | Merge Users | OOS | settings.add |
| `Accounts_Password_Policy_Enabled` | Enable Password Policy | OOS | settings.add |
| `Accounts_Registration_InviteUrlType` | Invite URL Type | OOS | settings.add |
| `Accounts_SetDefaultAvatar` | Set Default Avatar | HIT `page.account.profile.avatar.reset` | 3col |
| `Accounts_ShowFormLogin` | Show Default Login Form | OOS | settings.add |
| `Accounts_TwoFactorAuthentication_Enabled` | Enable Two Factor Authentication | OOS | settings.add |
| `Accounts_denyUnverifiedEmail` | Deny unverified email | OOS | admin-prefix |
| `Add` | Add | HIT `composer.format.link` | 3col |
| `Add_Value` | Add Value | HIT `page.admin.abac.attr.value` | 3col |
| `Add_room` | Add Room | HIT `page.admin.abac.rooms.add` | 3col |
| `Add-on` | Add-on | HIT `mkt.app.subscribe` | semantic-r1 |
| `Add-on_required` | Add-on required | HIT `mkt.app.subscribe` | semantic-r1 |
| `Add_Domain` | Add Domain | OOS | unbound |
| `Add_Reaction` | Add reaction | HIT `msg.reaction.add` | 3col |
| `Add_Role` | Add Role | OOS | unbound |
| `Add_Server` | Add Server | HIT `composer.action.webdav-add` | 3col |
| `Add_URL` | Add URL | HIT `page.account.profile.avatar.add-url` | 3col |
| `Add_User` | Add User | OOS | unbound |
| `Add_a_Message` | Add a Message | OOS | unbound |
| `Add_agent` | Add agent | HIT `omni.manager.agents.add` | 3col |
| `Add_contact` | Add contact | HIT `omni.agent.unknown-contact` | 3col |
| `Add_custom_oauth` | Add custom OAuth | HIT `page.admin.settings.oauth.add-custom` | 3col |
| `Add_email` | Add email | HIT `omni.agent.directory.contact.edit` | semantic-r1 |
| `Add_emoji` | Add emoji | HIT `omni.widget.emoji` | 3col |
| `Add_files_from` | Add files from | OOS | unbound |
| `Add_link` | Add link | HIT `composer.format.link` | semantic-r1 |
| `Add_manager` | Add manager | HIT `omni.manager.managers.add` | 3col |
| `Add_members` | Add Members | OOS | unbound |
| `Add_monitor` | Add monitor | HIT `omni.manager.monitors.add` | 3col |
| `Add_more_users` | Add more users | MISS | apps/meteor/client/views/admin/users/AdminUserCreated.tsx:18 |
| `Add_people` | Add people | HIT `page.create.channel.members` | 3col |
| `Add_phone` | Add phone | HIT `omni.agent.directory.contact.edit` | semantic-r1 |
| `Add_them` | Add them | HIT `composer.popup.mention.not-in-channel` | semantic-r1 |
| `Add_topic` | Add topic | HIT `room.header.topic-add` | 3col |
| `Add_user` | Add user | HIT `page.admin.users.form.save` | 3col |
| `Add_users` | Add users | HIT `room.members.add.back` | 3col |
| `Allow` | Allow | MISS | packages/ui-voip/src/views/PermissionFlow/PermissionFlowModal.tsx:67 |
| `allow-external-voice-calls` | Allow External Voice Calls | OOS | perm-kebab |
| `allow-internal-voice-calls` | Allow Internal Voice Calls | OOS | perm-kebab |
| `Allow_Marketing_Emails` | Allow Marketing Emails | OOS | settings.add |
| `Answer_call` | Answer Call | OOS | unbound |
| `App_Url_to_Install_From` | Install from URL | OOS | unbound |
| `App_Url_to_Install_From_File` | Install from file | HIT `mkt.installed.upload` | semantic-r1 |
| `Apply` | Apply | HIT `page.admin.settings.saml.import-metadata` | 3col |
| `Apply_community_license` | Apply community license | HIT `page.admin.subscription.apply` | semantic-r1 |
| `Apply_license` | Apply license | HIT `page.admin.subscription.apply` | 3col |
| `Apply_filters` | Apply filters | HIT `page.audit.security.apply` | 3col |
| `Apps_Framework_Development_Mode` | Enable development mode | OOS | admin-prefix |
| `Apps_Framework_enabled` | Enable the App Framework | OOS | admin-prefix |
| `Apps_Marketplace_Uninstall_Subscribed_App_Anyway` | Uninstall it anyway | HIT `mkt.app.uninstall` | semantic-r1 |
| `Apps_Permissions_api` | Register new HTTP endpoints | OOS | unbound |
| `Apps_Permissions_message_write` | Send and modify messages | OOS | unbound |
| `Apps_Permissions_room_write` | Create and modify rooms | OOS | unbound |
| `Apps_Permissions_slashcommand` | Register new slash commands | OOS | unbound |
| `Archive` | Archive | HIT `omni.manager.departments.archive` | 3col |
| `Assign_extension` | Assign extension | OOS | unbound |
| `AutoTranslate_Enabled` | Enable Auto-Translate | OOS | settings.add |
| `BBB_Enable_Teams` | Enable for Teams | OOS | unbound |
| `BBB_Join_Meeting` | Join Meeting | OOS | unbound |
| `BBB_Start_Meeting` | Start Meeting | OOS | unbound |
| `Backup_codes` | Backup codes | HIT `page.account.security.totp.toggle` | semantic-r1 |
| `Block` | Block | HIT `user.action.block` | 3col |
| `Block_IP_Address` | Block IP Address | OOS | unbound |
| `Block_User` | Block User | OOS | unbound |
| `Block_channel` | Block channel | HIT `omni.agent.directory.contact.block` | semantic-r1 |
| `CAS_Creation_User_Enabled` | Allow user creation | OOS | settings.add |
| `CAS_button_color` | Login Button Background Color | OOS | settings.add |
| `CAS_button_label_color` | Login Button Text Color | OOS | settings.add |
| `CAS_button_label_text` | Login Button Label | OOS | settings.add |
| `CAS_popup_height` | Login Popup Height | OOS | settings.add |
| `CAS_popup_width` | Login Popup Width | OOS | settings.add |
| `CROWD_Reject_Unauthorized` | Reject Unauthorized | OOS | settings.add |
| `Call` | Call | HIT `nav.voip.history` | semantic-r1 |
| `Call_Already_Ended` | Call Already Ended | OOS | unbound |
| `Call_ID` | Call ID | OOS | noun-column |
| `Call_in_progress` | Call in progress | OOS | status-noun |
| `Call_info` | Call info | HIT `nav.voip.history` | semantic-r1 |
| `Call_Information` | Call Information | OOS | unbound |
| `Call_again` | Call again | MISS | packages/fuselage-ui-kit/src/blocks/VideoConferenceBlock/VideoConferenceBlock.tsx:155 |
| `Call_back` | Call back | MISS | packages/fuselage-ui-kit/src/blocks/VideoConferenceBlock/VideoConferenceBlock.tsx:155 |
| `Call_declined` | Call Declined! | OOS | unbound |
| `Call_ended` | Call ended | OOS | status-noun |
| `Call_history` | Call history | HIT `nav.voip.history` | 3col |
| `Call_not_found` | Call not found | OOS | error-toast-desc |
| `Call_ongoing` | Call ongoing | OOS | status-noun |
| `Call_provider` | Call Provider | OOS | unbound |
| `Call_ringer_volume` | Call ringer volume | HIT `page.account.preferences.ringer-volume` | 3col |
| `Call_started` | Call started | OOS | toast-system |
| `Call_terminated` | Call terminated | OOS | unbound |
| `Call_transfered_to__name__` | Call transfered to {{name}} | OOS | status-noun |
| `Call_was_not_answered` | Call was not answered | OOS | status-noun |
| `Call_without_mic` | Call without mic | MISS | packages/ui-voip/src/views/PermissionFlow/PermissionFlowModal.tsx:55 |
| `Call_window` | Call window | OOS | unbound |
| `Cancel` | Cancel | HIT `composer.edit.cancel` | 3col |
| `Cancel__planName__subscription` | Cancel {{planName}} subscription | HIT `page.admin.subscription.sync` | semantic-r1 |
| `Cancel_message_input` | Cancel | OOS | unbound |
| `Cancel_recording` | Cancel recording | HIT `implicit.recording.cancel` | 3col |
| `Cancel_subscription` | Cancel subscription | HIT `page.admin.subscription.cancel` | 3col |
| `Canned_Responses_Enable` | Enable Canned Responses | OOS | settings.add |
| `Chatops_Enabled` | Enable Chatops | OOS | unbound |
| `Check_All` | Check All | OOS | unbound |
| `Check_Progress` | Check Progress | OOS | unbound |
| `Check_back_later` | Check back later | OOS | empty-title |
| `Check_device_activity` | Check device activity | OOS | unbound |
| `Check_support_availability` | Check <1>support</1> availability | OOS | workspace-card-label |
| `Clean_Usernames` | Clear usernames | OOS | unbound |
| `Clear_all_unreads_question` | Clear all unreads? | HIT `fill.unread.clear-all.confirm` | semantic-r1 |
| `Clear_filters` | Clear filters | HIT `page.audit.security.clear` | 3col |
| `Clear_selection` | Clear selection | HIT `implicit.select.clear` | 3col |
| `Close` | Close | HIT `thread.panel.close` | 3col |
| `Close_Dialpad` | Close Dialpad | OOS | unbound |
| `Close_dialpad` | Close dialpad | MISS | packages/ui-voip/src/views/MediaCallWidget/OngoingCall.tsx:80 |
| `Close_Window` | Close Window | OOS | unbound |
| `Close_chat` | Close chat | OOS | unbound |
| `Close_gallery` | Close gallery | HIT `tl.gallery.close` | 3col |
| `Close_sidebar` | Close sidebar | MISS | apps/meteor/client/components/SidebarToggler/SidebarTogglerButton.tsx:18 |
| `Cloud_Apply_Offline_License` | Apply Offline License | OOS | unbound |
| `Cloud_Apply_license` | Apply license | OOS | unbound |
| `Cloud_Change_Offline_License` | Change Offline License | OOS | unbound |
| `Cloud_Register_manually` | Register Offline | OOS | unbound |
| `Cloud_update_email` | Update Email | OOS | unbound |
| `Collapse` | Collapse | HIT `thread.panel.toggleExpand` | 3col |
| `Collapse_all` | Collapse All | HIT `mkt.app.logs` | semantic-r1 |
| `Collapse_group` | Collapse {{group}} | HIT `sidebar.group.collapse` | semantic-r1 |
| `Conference_call_has_ended` | _Call has ended._ | OOS | unbound |
| `Confirm` | Confirm | HIT `room.quick.moveQueue.confirm` | 3col |
| `Confirm_configuration_update` | Confirm configuration update | MISS | apps/meteor/client/components/FingerprintChangeModalConfirmation.tsx:19 |
| `Confirm_new_password` | Confirm New Password | OOS | unbound |
| `Confirm_new_workspace` | Confirm new workspace | MISS | apps/meteor/client/components/FingerprintChangeModalConfirmation.tsx:19 |
| `Confirm_password` | Confirm password | HIT `page.account.security.password-confirm` | 3col |
| `Confirm_your_password` | Confirm your password | OOS | unbound |
| `Confirm_contact_removal` | Confirm Contact Removal | HIT `omni.agent.directory.contact.delete` | semantic-r1 |
| `Confirm_settings_change` | Confirm settings change | OOS | settings-alert-title |
| `Connect` | Connect | MISS | apps/meteor/client/components/connectionStatus/ConnectionStatusBar.tsx:67 |
| `ConnectWorkspace_Button` | Connect workspace | OOS | unbound |
| `Connect_SSL_TLS` | Connect with SSL/TLS | HIT `page.admin.email-inbox.smtp-secure` | 3col |
| `Convert` | Convert | HIT `implicit.roomInfo.action.convertToTeam` | 3col |
| `Convert_Ascii_Emojis` | Convert ASCII to Emoji | HIT `page.account.preferences.ascii-emoji` | 3col |
| `Convert_to_channel` | Convert to Channel | HIT `room.info.team.action.convert-to-channel` | 3col |
| `Copy` | Copy | HIT `room.contact.phone.copy` | 3col |
| `Copy_Link` | Copy Link | HIT `msg.forward` | 3col |
| `Copy_link` | Copy link | HIT `msg.permalink.copy` | 3col |
| `Copy_password` | Copy password | OOS | unbound |
| `Copy_phone_number` | Copy phone number | OOS | unbound |
| `Copy_text` | Copy text | HIT `msg.copy.text` | 3col |
| `Copy_to_clipboard` | Copy to clipboard | OOS | unbound |
| `Create` | Create | HIT `composer.action.audio-message` | 3col |
| `Create_A_New_Channel` | Create a New Channel | OOS | unbound |
| `Create_SLA_policy` | Create SLA policy | HIT `omni.manager.sla.create` | 3col |
| `Create_a_password` | Create a password | HIT `route.register` | semantic-r1 |
| `Create_an_account` | Create an account | HIT `route.register` | 3col |
| `Create_canned_response` | Create canned response | HIT `omni.manager.canned.create` | 3col |
| `Create_channel` | Create channel | HIT `page.create.channel.name` | 3col |
| `Create_channels` | Create channels | HIT `page.home.create-channel` | 3col |
| `Create_custom_field` | Create custom field | HIT `omni.manager.customfields.create` | 3col |
| `Create_department` | Create department | HIT `omni.manager.departments.create` | 3col |
| `Create_new` | Create new | HIT `nav.create.dm` | 3col |
| `Create_new_members` | Create New Members | OOS | unbound |
| `Create_tag` | Create tag | HIT `omni.manager.tags.create` | 3col |
| `Create_trigger` | Create trigger | HIT `omni.manager.triggers.create` | 3col |
| `Create_unit` | Create unit | HIT `omni.manager.units.create` | 3col |
| `Crowd_Remove_Orphaned_Users` | Remove Orphaned Users | OOS | admin-prefix |
| `Custom_Emoji_Add` | Add New Emoji | HIT `page.admin.emoji.new` | semantic-r1 |
| `Custom_Sound_Add` | Add Custom Sound | HIT `page.admin.sounds.new` | semantic-r1 |
| `Custom_Sound_Edit` | Edit Custom Sound | HIT `page.admin.sounds.row` | semantic-r1 |
| `Custom_User_Status_Add` | Add Custom User Status | HIT `page.admin.user-status.new` | semantic-r1 |
| `Custom_User_Status_Edit` | Edit Custom User Status | HIT `page.admin.user-status.row` | semantic-r1 |
| `Decline` | Decline | HIT `room.chrome.call.incoming.decline` | 3col |
| `Delete` | Delete | HIT `msg.delete` | 3col |
| `Delete_Department?` | Delete Department? | HIT `omni.manager.departments.delete` | semantic-r1 |
| `Delete_Contact` | Delete Contact | HIT `omni.agent.directory.contact.delete` | semantic-r1 |
| `Delete_account` | Delete account | HIT `page.account.profile.delete` | 3col |
| `Delete_account?` | Delete account? | HIT `page.account.profile.delete` | 3col |
| `Delete_all_closed_chats` | Delete all closed chats | HIT `omni.agent.directory.chats.remove-all-closed` | semantic-r1 |
| `Delete_message` | Delete message | OOS | unbound |
| `Delete_my_account` | Delete my account | HIT `page.account.profile.delete` | 3col |
| `Delete_roomType` | Delete {{roomType}} | HIT `implicit.roomInfo.action.delete` | semantic-r1 |
| `Device_Management_Enable_Login_Emails` | Enable login detection emails | OOS | settings.add |
| `Direct_Reply_Delete` | Delete Emails | OOS | settings.add |
| `Direct_Reply_Enable` | Enable Direct Reply | OOS | settings.add |
| `Disable` | Disable | HIT `room.info.e2ee.reset-accordion` | 3col |
| `Disable_E2E_encryption` | Disable E2E encryption | HIT `room.toolbox.e2e` | 3col |
| `Disable_Facebook_integration` | Disable Facebook integration | OOS | unbound |
| `Disable_Notifications` | Disable Notifications | OOS | unbound |
| `Disable_voice_calling` | Disable voice calling | OOS | unbound |
| `Disconnect` | Disconnect | OOS | unbound |
| `Disconnect_workspace` | Disconnect workspace | OOS | unbound |
| `Discussion_start` | Start a Discussion | HIT `msg.discussion.start` | 3col |
| `Discussion_title` | Create discussion | HIT `page.create.discussion.submit` | semantic-r1 |
| `Download` | Download | HIT `room.files.file-menu-download` | 3col |
| `Download_Destkop_App` | Download Desktop App | OOS | unbound |
| `Download_Disabled` | Download disabled | HIT `tl.attach.download` | 3col |
| `Download_Info` | Download info | HIT `page.admin.workspace.download-info` | 3col |
| `Download_My_Data` | Download My Data (HTML) | HIT `page.account.preferences.download-my-data` | 3col |
| `Download_Pending_Avatars` | Download Pending Avatars | HIT `page.admin.import.download-avatars` | 3col |
| `Download_Pending_Files` | Download Pending Files | HIT `page.admin.import.download-files` | 3col |
| `Download_Snippet` | Download | OOS | unbound |
| `Download_file` | Download file | HIT `tl.select.export.download` | 3col |
| `E2E_Enable_Encrypt_Files` | Encrypt files | HIT `composer.state.upload.e2ee.blocked` | 3col |
| `E2E_Enabled_Default_DirectRooms` | Encrypt direct messages | OOS | settings.add |
| `E2E_Enabled_Default_PrivateRooms` | Encrypt private rooms | OOS | settings.add |
| `E2E_disable_encryption` | Disable encryption | HIT `room.info.e2ee.disable.confirm` | semantic-r1 |
| `E2E_enable` | Enable E2E | OOS | unbound |
| `E2E_enable_encryption` | Enable encryption | HIT `room.info.e2ee.enable.confirm` | semantic-r1 |
| `E2E_reset_encryption_keys` | Reset encryption keys | HIT `room.info.e2ee.reset-accordion` | 3col |
| `E2E_reset_encryption_keys_button` | Reset {{roomType}} encryption keys | HIT `room.info.e2ee.reset-open` | 3col |
| `Edit` | Edit | HIT `msg.edit` | 3col |
| `Edit_Business_Hour` | Edit Business Hour | OOS | unbound |
| `Edit_Canned_Response` | Edit Canned Response | HIT `omni.agent.canned.edit` | semantic-r1 |
| `Edit_Canned_Responses` | Edit canned responses | OOS | unbound |
| `Edit_Contact_Profile` | Edit Contact Profile | HIT `omni.agent.directory.contact.edit` | semantic-r1 |
| `Edit_Custom_Field` | Edit Custom Field | HIT `omni.manager.appearance.open` | semantic-r1 |
| `Edit_Department` | Edit Department | HIT `omni.manager.departments.edit` | semantic-r1 |
| `Edit_Invite` | Edit Invite | HIT `room.members.invite.edit` | 3col |
| `Edit_Priority` | Edit Priority | HIT `omni.manager.priorities.edit` | semantic-r1 |
| `Edit_SLA_Policy` | Edit SLA policy | HIT `omni.manager.sla.edit` | semantic-r1 |
| `Edit_Status` | Edit Status | OOS | unbound |
| `Edit_Tag` | Edit Tag | HIT `omni.manager.tags.edit` | semantic-r1 |
| `Edit_Trigger` | Edit Trigger | HIT `omni.manager.triggers.edit` | semantic-r1 |
| `Edit_Unit` | Edit Unit | HIT `omni.manager.units.edit` | semantic-r1 |
| `Edit_User` | Edit User | HIT `page.admin.users.row` | semantic-r1 |
| `Edit_channel` | Edit channel | OOS | unbound |
| `Edit_discussion` | Edit discussion | OOS | unbound |
| `Edit_team` | Edit team | OOS | unbound |
| `Enable` | Enable | HIT `mkt.app.enable` | 3col |
| `Enable_Auto_Away` | Enable Auto Away | HIT `page.account.preferences.auto-away` | 3col |
| `Enable_CSP` | Enable Content-Security-Policy | OOS | settings.add |
| `Enable_Desktop_Notifications` | Enable Desktop Notifications | HIT `page.account.preferences.desktop-permission` | semantic-r1 |
| `Enable_E2E_encryption` | Enable E2E encryption | HIT `room.toolbox.e2e` | 3col |
| `Enable_Password_History` | Enable Password History | OOS | unbound |
| `Enable_Svg_Favicon` | Enable SVG favicon | OOS | unbound |
| `Enable_business_hours` | Enable business hours | HIT `omni.manager.businesshours.open` | semantic-r1 |
| `Enable_encryption` | Enable encryption | HIT `account.gap.security.e2e-enter-submit` | 3col |
| `Enable_two-factor_authentication` | Enable two-factor authentication | HIT `page.account.security.totp.toggle` | semantic-r1 |
| `Enable_unlimited_apps` | Enable unlimited apps | HIT `mkt.installed.unlimited` | 3col |
| `Enable_voice_calling` | Enable voice calling | OOS | unbound |
| `Enter` | Enter | HIT `composer.send.enter-behavior` | 3col |
| `Enter_Behaviour` | Enter key Behaviour | HIT `page.account.preferences.send-on-enter` | 3col |
| `Enter_E2E_password` | Enter E2EE password | HIT `account.gap.security.e2e-enter-password` | 3col |
| `Enter_TOTP_password` | Enter TOTP password | HIT `page.account.security.totp.verify` | semantic-r1 |
| `Enter_a_custom_message` | Enter a custom message | OOS | noun-placeholder |
| `Enter_a_department_name` | Enter a department name | OOS | noun-placeholder |
| `Enter_a_name` | Enter a name | OOS | noun-placeholder |
| `Enter_a_regex` | Enter a regex | OOS | noun-placeholder |
| `Enter_a_room_name` | Enter a room name | OOS | noun-placeholder |
| `Enter_a_tag` | Enter a tag | OOS | noun-placeholder |
| `Enter_a_username` | Enter a username | OOS | noun-placeholder |
| `Enter_authentication_code` | Enter authentication code | OOS | noun-placeholder |
| `Enter_code_here` | Enter code here | OOS | noun-placeholder |
| `Enter_name_here` | Enter name here | OOS | noun-placeholder |
| `Enter_to` | Enter to | OOS | unbound |
| `Enter_username_or_number` | Enter username or number | OOS | noun-placeholder |
| `Expand` | Expand | HIT `thread.panel.toggleExpand` | 3col |
| `Expand_group` | Expand {{group}} | HIT `sidebar.group.collapse` | semantic-r1 |
| `Expand_all` | Expand all | HIT `mkt.app.logs` | semantic-r1 |
| `Expand_view` | Expand view | OOS | unbound |
| `Export` | Export | HIT `implicit.select.composerReplace` | 3col |
| `Export_Messages` | Export messages | HIT `room.toolbox.export-messages` | 3col |
| `Export_My_Data` | Export My Data (JSON) | HIT `page.account.preferences.export-my-data` | 3col |
| `export-messages-as-pdf` | Export Messages as PDF | OOS | perm-kebab |
| `Export_most_recent_logs` | Export most recent logs | HIT `mkt.app.logs` | semantic-r1 |
| `Export_as_PDF` | Export as PDF | HIT `room.quick.transcript.pdf` | 3col |
| `Export_as_file` | Export as file | OOS | unbound |
| `Favorite` | Favorite | HIT `room.header.favorite` | 3col |
| `Favorite_Rooms` | Enable Favorite Rooms | OOS | settings.add |
| `Federation_Enable` | Enable Federation | OOS | admin-prefix |
| `Federation_Matrix_check_configuration` | Verify configuration | OOS | admin-prefix |
| `Federation_Matrix_enable_ephemeral_events` | Enable Matrix ephemeral events | OOS | settings.add |
| `Federation_Search_federated_rooms` | Search federated rooms | OOS | admin-prefix |
| `Federation_Service_Enabled` | Enable native federation | HIT `composer.state.constraint.federation.disabled` | 3col |
| `FileUpload_Canceled` | Upload canceled | OOS | admin-prefix |
| `FileUpload_Webdav_Upload_Folder_Path` | Upload Folder Path | OOS | settings.add |
| `File_name_Placeholder` | Search files... | OOS | unbound |
| `Filter` | Filter | HIT `omni.agent.directory.contact.history` | 3col |
| `Filter_By_Price` | Filter by price | HIT `mkt.explore.filter` | 3col |
| `Filter_By_Status` | Filter by status | HIT `mkt.explore.filter` | 3col |
| `Filter_by_Custom_Fields` | Filter by Custom Fields | OOS | unbound |
| `Filter_by_category` | Filter by Category | HIT `mkt.explore.filter` | semantic-r1 |
| `Filter_by_role` | Filter by role | HIT `page.admin.users.filter.role` | 3col |
| `Filter_by_room` | Filter by room type | HIT `page.admin.rooms.filter.type` | 3col |
| `Filter_by_visibility` | Filter by visibility | OOS | unbound |
| `Follow_message` | Follow message | HIT `msg.thread.follow` | 3col |
| `Forgot_password` | Forgot your password? | HIT `route.forgot-password` | 3col |
| `Forgot_password_section` | Forgot password | OOS | unbound |
| `Forgot_E2EE_Password` | Forgot E2EE password? | HIT `account.gap.security.e2e-forgot` | semantic-r1 |
| `Forward` | Forward | HIT `msg.forward` | 3col |
| `Forward_chat` | Forward chat | HIT `room.quick.chatForward` | 3col |
| `Forward_in_history` | Forward in history | HIT `nav.history.forward` | 3col |
| `Forward_message` | Forward message | HIT `msg.forward` | 3col |
| `Forward_to_department` | Forward to department | HIT `room.quick.chatForward.department` | 3col |
| `Forward_to_user` | Forward to user | HIT `room.quick.chatForward.username` | 3col |
| `Hide` | Hide | HIT `implicit.roomInfo.action.hide` | 3col |
| `Hide_On_Workspace` | Hide on workspace | HIT `page.home.custom.visibility` | 3col |
| `Hide_System_Messages` | Hide system messages | HIT `room.info.field.hide-sys-mes` | 3col |
| `Hide_Unread_Room_Status` | Hide Unread Room Status | OOS | unbound |
| `Hide_additional_fields` | Hide additional fields | HIT `page.admin.users.form.show-additional` | 3col |
| `Hide_counter` | Hide counter | OOS | unbound |
| `Hide_chat` | Hide chat | HIT `room.chrome.voip.toggle-chat` | semantic-r1 |
| `Hide_roles` | Hide Roles | HIT `page.account.preferences.link-roles` | 3col |
| `Hide_room` | Hide | HIT `sidebar.roomMenu.hide` | semantic-r1 |
| `Hide_usernames` | Hide Usernames | HIT `page.account.preferences.link-usernames` | 3col |
| `Hide_video` | Hide video | OOS | unbound |
| `Hold` | Hold | HIT `room.chrome.voip.hold` | 3col |
| `Hold_Call` | Hold Call | OOS | unbound |
| `Hold_EE_only` | Hold (Enterprise Edition only) | OOS | unbound |
| `Iframe_Integration_receive_enable` | Enable Receive | OOS | settings.add |
| `Iframe_Integration_send_enable` | Enable Send | OOS | settings.add |
| `Iframe_Integration_send_target_origin` | Send Target Origin | OOS | settings.add |
| `Ignore` | Ignore | HIT `user.action.ignore` | 3col |
| `Ignore_Two_Factor_Authentication` | Ignore Two Factor Authentication | HIT `page.account.tokens.bypass-2fa` | 3col |
| `Import` | Import | HIT `route.admin.import` | 3col |
| `Import_New_File` | Import New File | HIT `page.admin.import.new` | 3col |
| `Import_Operation_Failed` | Import operation failed | OOS | error-toast-desc |
| `Import_Type` | Import Type | HIT `page.admin.import.type` | 3col |
| `Import_requested_successfully` | Import Requested Successfully | OOS | error-toast-desc |
| `Importer_Prepare_Start_Import` | Start Importing | HIT `page.admin.import.prepare.start` | 3col |
| `Importer_import_cancelled` | Import cancelled. | OOS | unbound |
| `Install` | Install | HIT `mkt.installed.upload` | 3col |
| `Install_Extension` | Install Extension | OOS | unbound |
| `Install_anyway` | Install anyway | HIT `mkt.app.install` | semantic-r1 |
| `Install_package` | Install package | OOS | unbound |
| `Intelligent_Search_upsell_title` | Add AI Search | HIT `nav.search.ai` | semantic-r1 |
| `InternalHubot_EnableForChannels` | Enable for Public Channels | OOS | unbound |
| `InternalHubot_EnableForDirectMessages` | Enable for Direct Messages | OOS | unbound |
| `InternalHubot_EnableForPrivateGroups` | Enable for Private Channels | OOS | unbound |
| `InternalHubot_reload` | Reload the scripts | OOS | unbound |
| `Invite` | Invite | HIT `room.members.add-users.denied` | 3col |
| `Invite_Link` | Invite Link | HIT `room.members.invite-link` | 3col |
| `Invite_Users` | Invite Members | HIT `room.members.invite-link` | semantic-r1 |
| `Invite_removed` | Invite removed successfully | OOS | toast-system |
| `Join` | Join | HIT `composer.join` | 3col |
| `Join_Chat` | Join Chat | OOS | unbound |
| `Join_audio_call` | Join audio call | OOS | unbound |
| `Join_call` | Join call | HIT `room.calls.join` | 3col |
| `Join_channel` | Join channel | HIT `fill.join.channel.fullpage` | semantic-r1 |
| `Join_conference` | Join conference | OOS | unbound |
| `Join_default_channels` | Join default channels | HIT `page.admin.users.form.join-default` | 3col |
| `Join_discussion` | Join discussion | HIT `room.calls.join-discussion` | 3col |
| `Join_rooms` | Join rooms | HIT `page.home.open-directory` | 3col |
| `Join_the_Community` | Join the Community | OOS | unbound |
| `Join_the_given_channel` | Join the given channel | OOS | unbound |
| `Join_video_call` | Join video call | OOS | unbound |
| `Join_with_password` | Join with password | HIT `composer.variant.join-password` | 3col |
| `Join_your_team` | Join your team | OOS | unbound |
| `Jump` | Jump | HIT `msg.jump` | 3col |
| `Jump_to_first_unread` | Jump to first unread | OOS | unbound |
| `Jump_to_message` | Jump to message | HIT `msg.jump` | 3col |
| `Jump_to_recent_messages` | Jump to recent messages | HIT `implicit.scroll.jumpToRecent` | 3col |
| `Katex_Dollar_Syntax` | Allow Dollar Syntax | OOS | settings.add |
| `Katex_Parenthesis_Syntax` | Allow Parenthesis Syntax | OOS | settings.add |
| `Keyboard_Shortcut_Key_Enter` | Enter | OOS | unbound |
| `Keyboard_Shortcuts_Edit_Previous_Message` | Edit previous message | OOS | unbound |
| `Keyboard_Shortcuts_Open_Channel_Slash_User_Search` | Open Channel / User search | OOS | unbound |
| `Keyboard_Shortcuts_Show_Keyboard_Shortcuts` | Show keyboard shortcuts | OOS | unbound |
| `LDAP_Authentication` | Enable | OOS | settings.add |
| `LDAP_Enable` | Enable | OOS | settings.add |
| `LDAP_Login_Fallback` | Login Fallback | OOS | settings.add |
| `LDAP_Merge_Existing_Users` | Merge Existing Users | OOS | settings.add |
| `LDAP_Reject_Unauthorized` | Reject Unauthorized | OOS | settings.add |
| `LDAP_Search_Page_Size` | Search Page Size | OOS | settings.add |
| `LDAP_Search_Size_Limit` | Search Size Limit | OOS | settings.add |
| `LDAP_Sync_AutoLogout_Enabled` | Enable Auto Logout | OOS | settings.add |
| `LDAP_Sync_User_Active_State_Both` | Enable and Disable Users | OOS | admin-prefix |
| `LDAP_Sync_User_Active_State_Disable` | Disable Users | OOS | admin-prefix |
| `LDAP_Sync_User_Active_State_Enable` | Enable Users | OOS | admin-prefix |
| `LDAP_UserSearch_Filter` | Search Filter | OOS | admin-prefix |
| `LDAP_User_Search_Field` | Search Field | OOS | settings.add |
| `LDAP_User_Search_Filter` | Filter | OOS | settings.add |
| `Layout_Custom_Body_Only` | Show custom content only | OOS | settings.add |
| `Layout_Login_Hide_Logo` | Hide Logo | OOS | settings.add |
| `Layout_Login_Hide_Powered_By` | Hide "Powered by" | OOS | settings.add |
| `Layout_Login_Hide_Title` | Hide Title | OOS | settings.add |
| `Layout_Login_Template` | Login Template | OOS | settings.add |
| `Layout_Login_Terms` | Login Terms | OOS | settings.add |
| `Leave` | Leave | HIT `implicit.roomInfo.action.leave` | 3col |
| `Leave_a_comment` | Leave a comment | HIT `room.quick.chatForward.comment` | 3col |
| `Leave_room` | Leave | HIT `implicit.roomInfo.action.leave` | 3col |
| `Leave_the_current_channel` | Leave the current channel | OOS | unbound |
| `Livechat_Block_Unknown_Contacts` | Block unknown contacts | HIT `omni.manager.security.save` | 3col |
| `Livechat_Block_Unverified_Contacts` | Block unverified contacts | HIT `omni.manager.security.save` | 3col |
| `Livechat_close_chat` | Close chat | OOS | admin-prefix |
| `Livechat_enable_message_character_limit` | Enable message character limit | OOS | settings.add |
| `Livechat_forward_open_chats` | Forward open chats | OOS | admin-prefix |
| `Livechat_hide_system_messages` | Hide system messages | OOS | settings.add |
| `Livechat_hide_expand_chat` | Hide "Expand chat" | OOS | settings.add |
| `Livestream_close` | Close Livestream | OOS | unbound |
| `Livestream_enable_audio_only` | Enable only audio mode | OOS | unbound |
| `Livestream_popout` | Open Livestream | OOS | unbound |
| `Log_File` | Show File and Line | OOS | admin-prefix |
| `Log_Package` | Show Package | OOS | admin-prefix |
| `Login` | Login | HIT `nav.user.login` | 3col |
| `Login_Detected` | Login detected | OOS | unbound |
| `Login_Logs` | Login Logs | OOS | unbound |
| `Login_with` | Login with %s | OOS | unbound |
| `Logout` | Logout | HIT `nav.user.logout` | 3col |
| `MapView_Enabled` | Enable Mapview | OOS | settings.add |
| `Mark_as_read` | Mark as read | HIT `implicit.unread.markAllRead` | 3col |
| `Mark_as_unread` | Mark as unread | OOS | unbound |
| `Mark_email_as_verified` | Mark email as verified | HIT `page.admin.users.form.verified` | 3col |
| `Mark_read` | Mark Read | HIT `sidebar.roomMenu.toggleRead` | 3col |
| `Mark_unread` | Mark Unread | HIT `msg.unread.mark` | 3col |
| `Markdown_Marked_Breaks` | Enable Marked Breaks | OOS | admin-prefix |
| `Markdown_Marked_GFM` | Enable Marked GFM | OOS | admin-prefix |
| `Markdown_Marked_Pedantic` | Enable Marked Pedantic | OOS | admin-prefix |
| `Markdown_Marked_SmartLists` | Enable Marked Smart Lists | OOS | admin-prefix |
| `Markdown_Marked_Smartypants` | Enable Marked Smartypants | OOS | admin-prefix |
| `Markdown_Marked_Tables` | Enable Marked Tables | OOS | admin-prefix |
| `Merge_Channels` | Merge Channels | OOS | unbound |
| `Message_AllowDeleting` | Allow Message Deleting | OOS | settings.add |
| `Message_AllowDeleting_BlockDeleteInMinutes_Description` | Enter 0 to disable blocking. | OOS | admin-prefix |
| `Message_AllowEditing` | Allow Message Editing | OOS | settings.add |
| `Message_AllowEditing_BlockEditInMinutesDescription` | Enter 0 to disable blocking. | OOS | admin-prefix |
| `Message_AllowPinning` | Allow Message Pinning | OOS | settings.add |
| `Message_AllowSnippeting` | Allow Message Snippeting | OOS | admin-prefix |
| `Message_AllowStarring` | Allow Message Starring | OOS | settings.add |
| `Message_AllowUnrecognizedSlashCommand` | Allow Unrecognized Slash Commands | HIT `composer.state.slash.invalid` | 3col |
| `Message_ErasureType_Delete` | Delete All Messages | OOS | unbound |
| `Message_HideType_livechat_closed` | Hide "Conversation finished" messages | HIT `omni.manager.appearance.open` | semantic-r1 |
| `Message_HideType_livechat_started` | Hide "Conversation started" messages | HIT `omni.manager.appearance.open` | semantic-r1 |
| `Message_HideType_livechat_transfer_history` | Hide "Conversation transfered" messages | HIT `omni.manager.appearance.open` | semantic-r1 |
| `Message_Read_Receipt_Enabled` | Show Read Receipts | OOS | settings.add |
| `Message_Read_Receipt_Archive_Enabled` | Enable Read Receipts Archive | OOS | settings.add |
| `Message_Read_Receipt_Archive_Retention_Days` | Archive Retention Days | OOS | settings.add |
| `Message_Read_Receipt_Archive_Cron` | Archive Cron Schedule | OOS | settings.add |
| `Message_Read_Receipt_Archive_Batch_Size` | Archive Batch Size | OOS | settings.add |
| `Message_ShowDeletedStatus` | Show Deleted Status | OOS | settings.add |
| `Message_ShowEditedStatus` | Show Edited Status | OOS | unbound |
| `Message_ShowFormattingTips` | Show Formatting Tips | OOS | unbound |
| `Meta_Description` | Set custom Meta properties. | OOS | error-toast-desc |
| `Moderation_Delete_all_messages` | Delete all messages | HIT `page.admin.moderation.delete-all-messages` | 3col |
| `Moderation_Delete_message` | Delete message | HIT `page.admin.moderation.delete-message` | 3col |
| `Moderation_Delete_this_message` | Delete this message | HIT `page.admin.moderation.delete-all-messages` | semantic-r1 |
| `Moderation_Hide_reports` | Hide reports | HIT `page.admin.moderation.see-messages` | semantic-r1 |
| `Moderation_Report_date` | Report date | HIT `page.admin.moderation.row` | semantic-r1 |
| `Moderation_Reset_user_avatar` | Reset user avatar | HIT `page.admin.moderation.reset-avatar` | semantic-r1 |
| `Moderation_Show_reports` | Show reports | HIT `page.admin.moderation.see-messages` | semantic-r1 |
| `Move_queue` | Move to the queue | HIT `room.quick.moveQueue` | 3col |
| `Mute` | Mute | HIT `room.chrome.voip.mute` | 3col |
| `Mute_Focused_Conversations` | Mute Focused Conversations | HIT `page.account.preferences.mute-focused` | 3col |
| `Mute_all_notifications` | Mute all notifications | OOS | unbound |
| `Mute_and_dismiss` | Mute and dismiss | HIT `room.chrome.call.incoming.mute` | semantic-r1 |
| `Mute_microphone` | Mute Microphone | OOS | unbound |
| `Mute_user` | Mute user | HIT `user.action.mute` | 3col |
| `NPS_survey_enabled` | Enable NPS Survey | OOS | settings.add |
| `Nickname_Placeholder` | Enter your nickname... | OOS | noun-placeholder |
| `Notification_Desktop_Default_For` | Show Desktop Notifications For | HIT `page.account.preferences.desktop-default` | 3col |
| `Notification_Push_Default_For` | Send Push Notifications For | HIT `page.account.preferences.push-default` | 3col |
| `Offline_Mention_All_Email` | Mention All Email Subject | OOS | settings.add |
| `Offline_Mention_Email` | Mention Email Subject | OOS | settings.add |
| `Omnichannel_Reports_Status_Open` | Open | OOS | admin-prefix |
| `Omnichannel_enable_department_removal` | Enable department removal | OOS | settings.add |
| `Omnichannel_hide_conversation_after_closing` | Hide conversation after closing | HIT `page.account.omnichannel.hide-after-close` | 3col |
| `Open` | Open | HIT `route.directory` | 3col |
| `Open_Days` | Open days | HIT `omni.manager.businesshours.save` | semantic-r1 |
| `Open_Dialpad` | Open Dialpad | OOS | unbound |
| `Open_dialpad` | Open dialpad | MISS | packages/ui-voip/src/views/MediaCallWidget/OngoingCall.tsx:80 |
| `Open_in_new_window` | Open in new window | HIT `room.chrome.voip.popout` | 3col |
| `Open_Outlook` | Open Outlook | HIT `room.outlook.open-outlook` | 3col |
| `Open_call` | Open call | MISS | apps/meteor/client/views/room/contextualBar/VideoConference/VideoConfBlockModal.tsx:13 |
| `Open_chat` | Open chat | HIT `omni.agent.directory.chats.open` | 3col |
| `Open_conversations` | Open Conversations | OOS | unbound |
| `Open_directory` | Open directory | HIT `route.directory` | 3col |
| `Open_in_room` | Open in room | MISS | packages/ui-voip/src/components/Cards/StreamCard/StreamCardOpenInRoom.tsx:16 |
| `Open_settings` | Open settings | MISS | apps/meteor/client/views/room/contextualBar/VideoConference/VideoConfConfigModal.tsx:78 |
| `Open_sidebar` | Open sidebar | MISS | apps/meteor/client/components/SidebarToggler/SidebarTogglerButton.tsx:18 |
| `Open_thread` | Open Thread | OOS | unbound |
| `Pause` | Pause | HIT `page.admin.sounds.row` | semantic-r1 |
| `Pin` | Pin | HIT `msg.pin` | 3col |
| `Pin_Message` | Pin Message | HIT `msg.pin` | 3col |
| `PiwikAnalytics_domains` | Hide Outgoing Links | OOS | settings.add |
| `Play` | Play | HIT `room.notif.play-sound` | 3col |
| `Private_app_install_modal_title` | Upload disabled private app | HIT `mkt.installed.upload` | semantic-r1 |
| `Prometheus_Reset_Interval` | Reset Interval (ms) | OOS | settings.add |
| `Prune` | Prune | HIT `room.info.edit.accordion.prune` | 3col |
| `Prune_Messages` | Prune Messages | HIT `room.toolbox.clean-history` | 3col |
| `Prune_finished` | Prune finished | OOS | unbound |
| `Purchase_for_free` | Purchase for FREE | OOS | unbound |
| `Purchase_for_price` | Purchase for $%s | OOS | unbound |
| `Push_enable` | Enable | OOS | settings.add |
| `Push_enable_gateway` | Enable Gateway | OOS | settings.add |
| `Push_show_message` | Show Message in Notification | OOS | settings.add |
| `Quote` | Quote | HIT `msg.quote` | 3col |
| `React_when_read_only` | Allow reacting | HIT `room.info.field.react-when-readonly` | 3col |
| `Record` | Record | HIT `composer.state.video.start` | 3col |
| `Refresh` | Refresh | HIT `page.account.tokens.regenerate` | 3col |
| `Refresh_keys` | Refresh keys | OOS | unbound |
| `Refresh_logs` | Refresh logs | HIT `mkt.app.logs.filter` | 3col |
| `Refresh_oauth_services` | Refresh OAuth Services | HIT `page.admin.settings.oauth.refresh` | 3col |
| `Register` | Register | HIT `route.register` | semantic-r1 |
| `RegisterWorkspace_Button` | Register workspace | HIT `page.admin.workspace.register` | 3col |
| `RegisterWorkspace_Token_Title` | Register workspace with token | HIT `page.admin.workspace.register.token` | semantic-r1 |
| `RegisterWorkspace_with_email` | Register workspace with email | HIT `page.admin.workspace.register.intent` | semantic-r1 |
| `Register_Server` | Register Server | OOS | settings.add |
| `Register_Server_Registered` | Register to access | OOS | unbound |
| `Register_Server_Standalone_Update_Settings` | Update the preconfigured settings | OOS | unbound |
| `Register_new_account` | Register a new account | OOS | unbound |
| `Reject` | Reject | HIT `chat.micro.invite.reject` | 3col |
| `Reject_call` | Reject call | OOS | unbound |
| `Reject_invitation` | Reject invitation | HIT `chat.micro.invite.reject.confirm` | 3col |
| `Reload` | Reload | HIT `chat.micro.list.reload` | 3col |
| `Reload_Pages` | Reload Pages | OOS | unbound |
| `Reload_page` | Reload Page | HIT `page.directory.channels.error` | 3col |
| `Reload_to_update` | Reload to update | MISS | apps/meteor/client/components/AutoupdateToastMessage.tsx:23 |
| `Remove` | Remove | HIT `composer.upload.remove` | 3col |
| `Remove_Admin` | Remove Admin | HIT `page.admin.users.action.admin` | semantic-r1 |
| `Remove_Channel_Links` | Remove channel links | OOS | unbound |
| `Remove_RocketChat_Watermark` | Remove Rocket.Chat watermark | OOS | unbound |
| `Remove_as_leader` | Remove as leader | HIT `user.action.change-leader` | 3col |
| `Remove_as_moderator` | Remove as moderator | HIT `user.action.change-moderator` | 3col |
| `Remove_as_owner` | Remove as owner | HIT `user.action.change-owner` | 3col |
| `Remove_custom_oauth` | Remove custom OAuth | OOS | admin-settings-ui |
| `Remove_email` | Remove email | HIT `omni.agent.directory.contact.edit` | semantic-r1 |
| `Remove_extension` | Remove extension | OOS | unbound |
| `Remove_file` | Remove file | HIT `page.admin.subscription.upload` | semantic-r1 |
| `Remove_filter` | Remove filter {{filter}} | MISS | apps/meteor/client/navbar/NavBarSearch/NavBarSearchInputAddon.tsx:38 |
| `Remove_from_room` | Remove from room | HIT `user.action.remove` | 3col |
| `Remove_from_team` | Remove from team | HIT `user.action.remove` | 3col |
| `Remove_license` | Remove license | HIT `page.admin.subscription.remove` | semantic-r1 |
| `Remove_license_key` | Remove license key | HIT `page.admin.subscription.remove` | 3col |
| `Remove_last_character` | Remove last character | OOS | unbound |
| `Remove_phone` | Remove phone | HIT `omni.agent.directory.contact.edit` | semantic-r1 |
| `Reply` | Reply | HIT `implicit.quote.barDisplay` | 3col |
| `ReplyTo` | Reply-To | OOS | unbound |
| `Reply_in_direct_message` | Reply in direct message | HIT `msg.reply.dm` | 3col |
| `Reply_in_thread` | Reply in thread | HIT `msg.thread.reply` | 3col |
| `Reply_via_Email` | Reply via email | OOS | unbound |
| `Report` | Report | HIT `msg.report` | 3col |
| `Report_Abuse` | Report Abuse | OOS | unbound |
| `Report_User` | Report user | HIT `user.action.report` | semantic-r1 |
| `Report_message` | Report message | HIT `msg.report` | semantic-r1 |
| `Report_has_been_sent` | Report has been sent | OOS | error-toast-desc |
| `Report_reason` | Report reason | HIT `msg.report` | 3col |
| `Report_sent` | Report sent | OOS | unbound |
| `Request` | Request | HIT `room.quick.transcript.modal.request` | 3col |
| `Reset` | Reset | HIT `implicit.editRoomInfo.reset` | 3col |
| `Reset_Connection` | Reset Connection | OOS | unbound |
| `Reset_E2EE_password` | Reset E2EE password | HIT `page.account.security.e2e-reset` | 3col |
| `Reset_TOTP` | Reset TOTP | HIT `page.admin.users.action.reset-totp` | 3col |
| `Reset_password` | Reset password | HIT `room.info.field.join-code` | 3col |
| `Reset_priorities` | Reset priorities | HIT `omni.manager.priorities.reset` | 3col |
| `Reset_section_settings` | Restore defaults | OOS | admin-settings-ui |
| `Resume` | Resume | HIT `room.quick.resume` | 3col |
| `RetentionPolicy_AppliesToChannels` | Prune in public rooms | OOS | settings.add |
| `RetentionPolicy_AppliesToDMs` | Prune in direct messages | OOS | settings.add |
| `RetentionPolicy_AppliesToGroups` | Prune in private rooms | OOS | settings.add |
| `RetentionPolicy_TTL_Channels` | Prune messages older than | OOS | settings.add |
| `RetentionPolicy_TTL_DMs` | Prune messages older than | OOS | settings.add |
| `RetentionPolicy_TTL_Groups` | Prune messages older than | OOS | settings.add |
| `Review` | Review | HIT `nav.create.outbound` | semantic-r1 |
| `Review_contact` | Review contact | HIT `omni.agent.directory.contact.details` | semantic-r1 |
| `Revoke_invitation` | Revoke invitation | HIT `user.action.remove` | 3col |
| `Room_Status_Open` | Open | HIT `omni.agent.directory.chats.filter` | semantic-r1 |
| `SAML_Custom_Debug` | Enable Debug | OOS | admin-prefix |
| `SAML_Custom_Logout_Behaviour` | Logout Behaviour | OOS | admin-prefix |
| `SAML_Custom_validate_logout_request_signature` | Verify Logout Request Signature | OOS | admin-prefix |
| `SAML_Custom_validate_logout_response_signature` | Verify Logout Response Signature | OOS | admin-prefix |
| `SAML_LogoutRequest_Template` | Logout Request Template | OOS | admin-prefix |
| `SAML_LogoutResponse_Template` | Logout Response Template | OOS | admin-prefix |
| `Save` | Save | HIT `implicit.editRoomInfo.save` | 3col |
| `Save_E2EE_password` | Save E2EE password | HIT `tl.e2ee.save-password` | 3col |
| `Save_Mobile_Bandwidth` | Save Mobile Bandwidth | HIT `page.account.preferences.mobile-bandwidth` | 3col |
| `Save_To_Webdav` | Save to WebDAV | HIT `msg.webdav.save` | 3col |
| `Save_changes` | Save changes | HIT `page.account.profile.save` | 3col |
| `Save_user` | Save user | HIT `page.admin.users.form.save` | 3col |
| `Search` | Search | HIT `room.teamChannels.filter-search` | 3col |
| `Search_Apps` | Search apps | HIT `mkt.explore.search` | semantic-r1 |
| `Search_Channels` | Search Channels | HIT `page.directory.channels.search` | 3col |
| `Search_calls` | Search calls | HIT `nav.voip.history` | semantic-r1 |
| `Search_Chat_History` | Search Chat History | OOS | unbound |
| `Search_Devices_Users` | Search devices or users | HIT `page.admin.devices.search` | 3col |
| `Search_Enterprise_Apps` | Search Enterprise apps | OOS | unbound |
| `Search_Files` | Search Files | HIT `room.files.search` | 3col |
| `Search_Installed_Apps` | Search installed apps | HIT `mkt.explore.search` | semantic-r1 |
| `Search_Integrations` | Search Integrations | HIT `page.admin.integrations.search` | semantic-r1 |
| `Search_Messages` | Search Messages | HIT `msg.jump` | 3col |
| `Search_Premium_Apps` | Search Premium apps | HIT `mkt.explore.search` | semantic-r1 |
| `Search_Private_Groups` | Search Private Groups | OOS | unbound |
| `Search_Private_apps` | Search private apps | HIT `mkt.explore.search` | semantic-r1 |
| `Search_Provider` | Search Provider | OOS | unbound |
| `Search_Requested_Apps` | Search requested apps | HIT `mkt.explore.search` | semantic-r1 |
| `Search_Rooms` | Search Rooms | OOS | unbound |
| `Search_Users` | Search Users | HIT `page.directory.users.search` | 3col |
| `Search_by_category` | Search by category | HIT `mkt.explore.search` | semantic-r1 |
| `Search_by_file_name` | Search by file name | OOS | unbound |
| `Search_by_username` | Search by username | HIT `room.members.search` | 3col |
| `Search_message_search_failed` | Search request failed | OOS | error-toast-desc |
| `Search_on_marketplace` | Search on Marketplace | HIT `mkt.explore.search` | semantic-r1 |
| `Search_options` | Search options | HIT `page.create.discussion.parent` | 3col |
| `Search_roles` | Search roles | OOS | unbound |
| `Search_rooms` | Search rooms | HIT `nav.search.rooms` | 3col |
| `Search_in_this_room` | Search in this room | HIT `nav.search.ai` | semantic-r1 |
| `Select` | Select | HIT `room.members.filter-status` | 3col |
| `Select__count__messages` | Select {{count}} messages | HIT `implicit.select.selectAll` | 3col |
| `Select_a_department` | Select a department | OOS | unbound |
| `Select_a_room` | Select a room | HIT `page.admin.permissions.users-in-role` | semantic-r1 |
| `Select_a_user` | Select a user | OOS | unbound |
| `Select_a_webdav_server` | Select a WebDAV server | HIT `msg.webdav.save` | semantic-r1 |
| `Select_an_avatar` | Select an avatar | OOS | unbound |
| `Select_an_option` | Select an option | HIT `page.account.integrations.select` | semantic-r1 |
| `Select_agent` | Select agent | HIT `nav.create.outbound` | semantic-r1 |
| `Select_channel` | Select channel | HIT `nav.create.outbound` | semantic-r1 |
| `Select_department` | Select a department | HIT `nav.create.outbound` | semantic-r1 |
| `Select_file` | Select file | OOS | admin-settings-ui |
| `Select_messages_to_hide` | Select messages to hide | HIT `room.info.field.system-messages` | 3col |
| `Select_period` | Select period | HIT `page.admin.engagement.users.new.period` | 3col |
| `Select_recipient` | Select recipient | HIT `nav.create.outbound` | semantic-r1 |
| `Select_role` | Select a Role | HIT `page.admin.users.form.roles` | semantic-r1 |
| `Select_tag` | Select a tag | OOS | unbound |
| `Select_template` | Select template | HIT `nav.create.outbound` | semantic-r1 |
| `Select_user` | Select user | OOS | unbound |
| `Select_users` | Select users | OOS | unbound |
| `Send` | Send | HIT `composer.send` | 3col |
| `Send_anyway` | Send anyway | HIT `composer.state.upload.partial-send` | 3col |
| `Send_Test` | Send Test | HIT `omni.manager.triggers.test` | 3col |
| `Send_Test_Email` | Send test email | HIT `page.admin.email-inbox.send-test` | 3col |
| `Send_a_message` | Send a message | HIT `omni.manager.triggers.edit` | 3col |
| `Send_confirmation_email` | Send confirmation email | OOS | unbound |
| `Send_email` | Send email | HIT `page.admin.mailer.send` | 3col |
| `Send_file_via_email` | Send file via email | HIT `tl.select.enter` | 3col |
| `Send_invitation_email` | Send invitation email | HIT `page.admin.users.invite.send` | semantic-r1 |
| `Send_request_on` | Send Request on | HIT `omni.manager.webhooks.open` | semantic-r1 |
| `Send_request_on_forwarding` | Send Request on Forwarding | OOS | unbound |
| `Send_transcript` | Send transcript | HIT `room.quick.transcript.toggle` | 3col |
| `Send_via_email` | Send via email | HIT `room.quick.transcript.email` | 3col |
| `Send_welcome_email` | Send welcome email | HIT `page.admin.users.form.send-welcome` | 3col |
| `Set_as_favorite` | Set as favorite | OOS | unbound |
| `Set_as_leader` | Set as leader | HIT `user.action.change-leader` | 3col |
| `Set_as_moderator` | Set as moderator | HIT `user.action.change-moderator` | 3col |
| `Set_as_owner` | Set as owner | HIT `user.action.change-owner` | 3col |
| `Set_manually` | Set manually | HIT `page.admin.users.form.set-manual-pwd` | 3col |
| `Set_up_2FA` | Set up 2FA | MISS | apps/meteor/client/views/root/MainLayout/TwoFactorRequiredModal.tsx:23 |
| `Setup_SMTP` | Set up SMTP | HIT `page.admin.users.invite.setup-smtp` | 3col |
| `Share` | Share | HIT `composer.action.share-location` | 3col |
| `Share_Location_Title` | Share Location? | HIT `composer.action.share-location` | semantic-r1 |
| `Share_screen` | Share screen | HIT `room.chrome.voip.share-screen` | 3col |
| `Show_Avatars` | Show Avatars | OOS | unbound |
| `Show_Only_This_Content` | Show only this content | HIT `page.home.custom.only` | 3col |
| `Show_Setup_Wizard` | Show Setup Wizard | HIT `route.setup-wizard` | 3col |
| `Show_To_Workspace` | Show to workspace | HIT `page.home.custom.visibility` | 3col |
| `Show_additional_fields` | Show additional fields | HIT `page.admin.users.form.show-additional` | semantic-r1 |
| `Show_agent_email` | Show agent email | HIT `omni.manager.appearance.open` | semantic-r1 |
| `Show_agent_info` | Show agent information | HIT `omni.manager.appearance.open` | semantic-r1 |
| `Show_all` | Show All | OOS | unbound |
| `Show_call_here` | Show call here | HIT `room.chrome.voip.popout` | semantic-r1 |
| `Show_counter` | Mark as unread | HIT `room.notif.show-counter` | 3col |
| `Show_default_content` | Show default content | HIT `page.home.custom.only` | 3col |
| `Show_email_field` | Show email field | HIT `omni.manager.appearance.open` | semantic-r1 |
| `Show_chat` | Show chat | HIT `room.chrome.voip.toggle-chat` | semantic-r1 |
| `Show_mentions` | Show badge for mentions | HIT `room.notif.show-mentions` | 3col |
| `Show_more` | Show more | HIT `nav.search.rooms` | semantic-r1 |
| `Show_name_field` | Show name field | HIT `omni.manager.appearance.open` | semantic-r1 |
| `Show_on_offline_page` | Show on offline page | HIT `omni.manager.departments.edit` | semantic-r1 |
| `Show_on_registration_page` | Show on registration page | HIT `omni.manager.departments.edit` | semantic-r1 |
| `Show_only_online` | Show Online Only | OOS | unbound |
| `Show_preregistration_form` | Show Pre-registration Form | OOS | unbound |
| `Show_roles` | Show roles | HIT `page.account.accessibility.show-roles` | 3col |
| `Show_usernames` | Show usernames | HIT `page.account.accessibility.show-usernames` | 3col |
| `Show_video` | Show video | OOS | unbound |
| `Slash_Status_Description` | Set your status message | OOS | error-toast-desc |
| `Slash_Topic_Description` | Set topic | OOS | error-toast-desc |
| `Sort` | Sort | OOS | unbound |
| `Sort_By` | Sort by | HIT `nav.sort.by.activity` | 3col |
| `Sort_by_activity` | Sort by Activity | OOS | unbound |
| `Sound_Call_Ended` | Call Ended | OOS | unbound |
| `Star` | Star | HIT `msg.star` | 3col |
| `Star_Message` | Star Message | OOS | unbound |
| `Start` | Start | HIT `room.chrome.call.start.toggle-cam` | 3col |
| `Start_Time` | Start Time | OOS | noun-placeholder |
| `Start_Date` | Start Date | OOS | noun-placeholder |
| `Start_Chat` | Start Chat | OOS | unbound |
| `Start_a_call` | Start a call | HIT `room.chrome.call.start.confirm` | 3col |
| `Start_a_free_trial` | Start a free trial | OOS | unbound |
| `Start_audio_call` | Start audio call | OOS | unbound |
| `Start_call` | Start call | HIT `room.chrome.call.start.confirm` | semantic-r1 |
| `Start_conference_call` | Start conference call | OOS | unbound |
| `Start_free_trial` | Start free trial | OOS | unbound |
| `Start_of_conversation` | Start of conversation | HIT `tl.foreword.dm-user` | semantic-r1 |
| `Start_video_call` | Start video call | OOS | unbound |
| `Start_video_conference` | Start conference call? | OOS | unbound |
| `Status_set_your_status` | Set your status | HIT `nav.user.status.custom-edit` | semantic-r1 |
| `Status_clear_after` | Clear status after | HIT `page.account.profile.status-duration` | 3col |
| `Stop_Recording` | Stop Recording | HIT `composer.state.video.finish` | 3col |
| `Stop_call` | Stop call | OOS | unbound |
| `Stop_sharing` | Stop sharing | MISS | packages/ui-voip/src/components/Cards/StreamCard/StreamCardStopSharingButton.tsx:16 |
| `Stop_sharing_screen` | Stop sharing screen | HIT `room.chrome.voip.share-screen` | 3col |
| `Submit` | Submit | HIT `nav.create.outbound` | semantic-r1 |
| `Subscribe` | Subscribe | HIT `mkt.app.subscribe` | 3col |
| `Team_Add_existing` | Add Existing | HIT `room.teamChannels.add-existing` | 3col |
| `Team_Add_existing_channels` | Add Existing Channels | HIT `room.teamChannels.add-existing` | semantic-r1 |
| `Team_Remove_from_team` | Remove from team | HIT `room.teamChannels.remove-from-team` | 3col |
| `Teams_New_Title` | Create team | HIT `page.create.team.submit` | semantic-r1 |
| `Teams_Search_teams` | Search Teams | HIT `page.directory.teams.search` | 3col |
| `Teams_Select_a_team` | Select a team | HIT `room.info.action.move-to-team` | semantic-r1 |
| `Teams_convert_channel_to_team` | Convert to Team | HIT `room.info.action.convert-to-team` | 3col |
| `Teams_leave` | Leave Team | HIT `sidebar.roomMenu.leave` | semantic-r1 |
| `Teams_move_channel_to_team` | Move to Team | HIT `implicit.roomInfo.action.moveToTeam` | 3col |
| `Toggle_original_translated` | Toggle original/translated | OOS | unbound |
| `Transfer_call` | Transfer call | HIT `room.chrome.voip.forward` | semantic-r1 |
| `Transfer_to` | Transfer to | OOS | unbound |
| `Translate` | Translate | HIT `msg.translate` | 3col |
| `Translate_to` | Translate to | HIT `room.autotranslate.language` | 3col |
| `Troubleshoot_Disable_Data_Exporter_Processor` | Disable Data Exporter Processor | OOS | settings.add |
| `Troubleshoot_Disable_Instance_Broadcast` | Disable Instance Broadcast | OOS | settings.add |
| `Troubleshoot_Disable_Livechat_Activity_Monitor` | Disable Livechat Activity Monitor | OOS | settings.add |
| `Troubleshoot_Disable_Notifications` | Disable Notifications | OOS | settings.add |
| `Troubleshoot_Disable_Presence_Broadcast` | Disable Presence Broadcast | OOS | settings.add |
| `Troubleshoot_Disable_Sessions_Monitor` | Disable Sessions Monitor | OOS | settings.add |
| `Troubleshoot_Disable_Teams_Mention` | Disable Teams mention | OOS | settings.add |
| `Unarchive` | Unarchive | HIT `omni.manager.departments.archive` | 3col |
| `Unblock` | Unblock | HIT `user.action.block` | 3col |
| `Unblock_User` | Unblock User | OOS | unbound |
| `Unfavorite` | Unfavorite | HIT `room.header.favorite` | 3col |
| `Unfollow_message` | Unfollow message | HIT `msg.thread.unfollow` | 3col |
| `Uninstall` | Uninstall | HIT `mkt.app.uninstall` | 3col |
| `Uninstall_grandfathered_app` | Uninstall {{appName}}? | HIT `mkt.app.uninstall` | semantic-r1 |
| `Unlock_premium_capabilities` | Unlock premium capabilities | HIT `page.admin.subscription.sync` | semantic-r1 |
| `Unmute` | Unmute | HIT `room.chrome.voip.mute` | 3col |
| `Unmute_microphone` | Unmute Microphone | OOS | unbound |
| `Unmute_user` | Unmute user | HIT `user.action.mute` | 3col |
| `Unpin` | Unpin | HIT `msg.unpin` | 3col |
| `Unpin_Message` | Unpin Message | OOS | unbound |
| `Unstar_Message` | Remove star | HIT `msg.unstar` | 3col |
| `Update` | Update | HIT `composer.upload.edit` | 3col |
| `Update_EnableChecker` | Enable the Update Checker | OOS | settings.add |
| `Update_LatestAvailableVersion` | Update Latest Available Version | OOS | settings.add |
| `Update_anyway` | Update anyway | HIT `mkt.app.update` | semantic-r1 |
| `Update_every` | Update every | HIT `omni.manager.realtime.filter` | 3col |
| `Update_to_access_marketplace` | Update to access marketplace | HIT `mkt.installed.update-server` | semantic-r1 |
| `Update_to_version` | Update to {{version}} | OOS | unbound |
| `Update_version` | Update version | HIT `page.admin.workspace.update` | 3col |
| `Update_your_RocketChat` | Update your Rocket.Chat | OOS | unbound |
| `Upload` | Upload | HIT `room.info.edit.avatar.upload` | 3col |
| `Upload_failed` | Upload failed | OOS | error-toast-desc |
| `Upload_Folder_Path` | Upload Folder Path | OOS | unbound |
| `Upload_From` | Upload from {{name}} | HIT `composer.state.webdav.pick` | semantic-r1 |
| `Upload_license_file` | Upload license file | HIT `page.admin.subscription.upload` | semantic-r1 |
| `Upload_anyway` | Upload anyway | HIT `mkt.installed.upload` | semantic-r1 |
| `Upload_app` | Upload App | OOS | unbound |
| `Upload_file` | Upload file | HIT `omni.agent.file.send` | 3col |
| `Upload_file_question` | Upload file? | OOS | unbound |
| `Upload_private_app` | Upload private app | HIT `mkt.installed.upload` | 3col |
| `Upload_user_avatar` | Upload avatar | HIT `room.info.edit.avatar.upload` | semantic-r1 |
| `UserDataDownload_Requested` | Download File Requested | HIT `page.account.preferences.download-my-data` | semantic-r1 |
| `UserData_EnableDownload` | Enable User Data Download | OOS | settings.add |
| `Username_title` | Register username | HIT `route.register` | semantic-r1 |
| `Verify` | Verify | HIT `page.account.security.totp.verify` | 3col |
| `Verify_your_email` | Verify your email | OOS | unbound |
| `VideoConf_Enable_Channels` | Enable in public channels | OOS | settings.add |
| `VideoConf_Enable_DMs` | Enable in direct messages | OOS | settings.add |
| `VideoConf_Enable_Groups` | Enable in private channels | OOS | settings.add |
| `VideoConf_Enable_Persistent_Chat` | Enable Persistent Chat | OOS | settings.add |
| `VideoConf_Enable_Teams` | Enable in teams | OOS | settings.add |
| `VideoConf_Mobile_Ringing` | Enable mobile ringing | HIT `page.account.preferences.mobile-ringing` | 3col |
| `VoIP_allow_and_call` | Allow and call | MISS | packages/ui-voip/src/views/PermissionFlow/PermissionFlowModal.tsx:58 |
| `VoIP_allow_and_accept` | Allow and accept | MISS | packages/ui-voip/src/views/PermissionFlow/PermissionFlowModal.tsx:49 |
| `Voice_call__user__cancel` | Cancel call with {{user}} | MISS | packages/ui-voip/src/hooks/useMediaCallAction.ts:38 |
| `Voice_call__user__reject` | Reject call from {{user}} | MISS | packages/ui-voip/src/hooks/useMediaCallAction.ts:46 |
| `WebRTC_Enable_Channel` | Enable for Public Channels | OOS | admin-prefix |
| `WebRTC_Enable_Direct` | Enable for Direct Messages | OOS | admin-prefix |
| `WebRTC_Enable_Private` | Enable for Private Channels | OOS | admin-prefix |
| `Webdav_add_new_account` | Add new WebDAV account | OOS | admin-prefix |
| `add-oauth-service` | Add OAuth Service | OOS | perm-kebab |
| `add-team-member` | Add Team Member | OOS | perm-kebab |
| `add-to-room` | Add to room | HIT `user.action.add-to-room` | 3col |
| `add-user` | Add User | OOS | perm-kebab |
| `archive-room` | Archive Room | OOS | perm-kebab |
| `assign-admin-role` | Assign Admin Role | OOS | perm-kebab |
| `assign-roles` | Assign Roles | OOS | perm-kebab |
| `ban-user` | Ban User | OOS | perm-kebab |
| `Ban_user_from_room` | Ban user from room | HIT `user.action.ban` | 3col |
| `block-ip-device-management` | Block IP Device Management | OOS | perm-kebab |
| `block-livechat-contact` | Block Omnichannel Contact Channel | OOS | perm-kebab |
| `call-management` | Call Management | OOS | perm-kebab |
| `Change_E2EE_password` | Change E2EE password | HIT `page.account.security.e2e-passphrase` | semantic-r1 |
| `change-livechat-room-visitor` | Change Livechat Room Visitors | OOS | perm-kebab |
| `clear` | Clear | HIT `implicit.select.clear` | 3col |
| `clear-oembed-cache` | Clear OEmbed Cache | OOS | perm-kebab |
| `clear_cache_now` | Clear Cache Now | OOS | unbound |
| `clear_history` | Clear History | HIT `page.admin.integrations.outgoing.history.clear` | semantic-r1 |
| `close` | close | HIT `thread.panel.close` | 3col |
| `close-livechat-room` | Close Omnichannel Room | OOS | perm-kebab |
| `close-others-livechat-room` | Close Other Omnichannel Room | OOS | perm-kebab |
| `convert-team` | Convert Team | OOS | perm-kebab |
| `create-c` | Create Public Channels | OOS | perm-kebab |
| `create-d` | Create Direct Messages | OOS | perm-kebab |
| `create-invite-links` | Create Invite Links | OOS | perm-kebab |
| `create-livechat-contact` | Create Omnichannel Contacts | OOS | perm-kebab |
| `create-p` | Create Private Channels | OOS | perm-kebab |
| `create-personal-access-tokens` | Create Personal Access Tokens | OOS | perm-kebab |
| `create-team` | Create Team | HIT `page.create.team.submit.permission-denied` | 3col |
| `create-team-channel` | Create Channel within Team | OOS | perm-kebab |
| `create-team-group` | Create Group within Team | OOS | perm-kebab |
| `create-user` | Create User | OOS | perm-kebab |
| `delete-c` | Delete Public Channels | OOS | perm-kebab |
| `delete-d` | Delete Direct Messages | OOS | perm-kebab |
| `delete-message` | Delete Message | HIT `page.admin.moderation.delete-message` | 3col |
| `delete-own-message` | Delete Own Message | OOS | perm-kebab |
| `delete-p` | Delete Private Channels | OOS | perm-kebab |
| `delete-team` | Delete Team | OOS | perm-kebab |
| `delete-team-channel` | Delete Channel within Team | OOS | perm-kebab |
| `delete-team-group` | Delete Group within Team | OOS | perm-kebab |
| `delete-user` | Delete User | OOS | perm-kebab |
| `delete-livechat-contact` | Delete Omnichannel Contact | OOS | perm-kebab |
| `edit-message` | Edit Message | OOS | perm-kebab |
| `edit-omnichannel-contact` | Edit Omnichannel Contact | OOS | perm-kebab |
| `edit-other-user-avatar` | Edit Other User Avatar | OOS | perm-kebab |
| `edit-other-user-info` | Edit Other User Information | OOS | perm-kebab |
| `edit-other-user-password` | Edit Other User Password | OOS | perm-kebab |
| `edit-privileged-setting` | Edit Privileged Setting | OOS | perm-kebab |
| `edit-room` | Edit Room | HIT `implicit.editRoomInfo.save` | 3col |
| `edit-room-avatar` | Edit Room Avatar | OOS | perm-kebab |
| `edit-room-retention-policy` | Edit Room's Retention Policy | OOS | perm-kebab |
| `edit-team` | Edit Team | OOS | perm-kebab |
| `edit-team-channel` | Edit Team Channel | OOS | perm-kebab |
| `edit-team-member` | Edit Team Member | OOS | perm-kebab |
| `join-without-join-code` | Join Without Join Code | HIT `composer.variant.join-password` | 3col |
| `leave-c` | Leave Channels | OOS | perm-kebab |
| `leave-p` | Leave Private Groups | OOS | perm-kebab |
| `logout-device-management` | Logout Device Management | OOS | perm-kebab |
| `logout-other-user` | Logout Other User | OOS | perm-kebab |
| `manage-selected-settings` | Change Some Settings | OOS | perm-kebab |
| `mention-all` | Mention All | OOS | perm-kebab |
| `mention-here` | Mention Here | OOS | perm-kebab |
| `meteor_status_try_now_offline` | Connect again | OOS | unbound |
| `move-room-to-team` | Move Room within Team | OOS | perm-kebab |
| `mute-user` | Mute User | OOS | perm-kebab |
| `onboarding.component.form.action.confirm` | Confirm | OOS | admin-prefix |
| `onboarding.component.form.action.register` | Register | OOS | admin-prefix |
| `onboarding.component.form.action.registerNow` | Register now | OOS | admin-prefix |
| `onboarding.component.form.action.registerOffline` | Register offline | OOS | admin-prefix |
| `onboarding.component.form.action.registerWorkspace` | Register workspace | OOS | admin-prefix |
| `onboarding.form.adminInfoForm.fields.password.placeholder` | Create password | OOS | admin-prefix |
| `onboarding.form.organizationInfoForm.fields.country.placeholder` | Select | OOS | admin-prefix |
| `onboarding.form.organizationInfoForm.fields.organizationIndustry.placeholder` | Select | OOS | admin-prefix |
| `onboarding.form.organizationInfoForm.fields.organizationSize.placeholder` | Select | OOS | admin-prefix |
| `onboarding.form.organizationInfoForm.fields.organizationType.placeholder` | Select | OOS | admin-prefix |
| `onboarding.form.registerOfflineForm.title` | Register Offline | OOS | admin-prefix |
| `onboarding.form.registeredServerForm.registerLater` | Register later | OOS | admin-prefix |
| `onboarding.form.registeredServerForm.title` | Register your workspace | OOS | admin-prefix |
| `onboarding.page.checkYourEmail.title` | Check your email | OOS | admin-prefix |
| `onboarding.page.invalidLink.button.text` | Request new link | OOS | admin-prefix |
| `onboarding.page.requestTrial.title` | Request a <1>30-day Trial</1> | OOS | admin-prefix |
| `outbound.send-messages` | Send Outbound Messages | OOS | unbound |
| `pin-message` | Pin Message | HIT `msg.jump` | 3col |
| `quote` | quote | HIT `msg.quote` | 3col |
| `register-on-cloud` | Register On Cloud | OOS | perm-kebab |
| `registration.component.form.confirmPassword` | Confirm your password | OOS | admin-prefix |
| `registration.component.form.createAnAccount` | Create an account | HIT `route.register` | 3col |
| `registration.component.form.joinYourTeam` | Join your team | OOS | admin-prefix |
| `registration.component.form.register` | Register | OOS | admin-prefix |
| `registration.component.form.sendConfirmationEmail` | Send confirmation email | OOS | admin-prefix |
| `registration.component.form.submit` | Submit | OOS | admin-prefix |
| `registration.component.login` | Login | OOS | admin-prefix |
| `registration.component.login.onWeb` | Login on web | OOS | admin-prefix |
| `registration.component.resetPassword` | Reset password | OOS | admin-prefix |
| `registration.component.switchLanguage` | Change to <2>{{name}}</2> | OOS | admin-prefix |
| `registration.page.guest.loginWithRocketChat` | Login with Rocket.Chat | OOS | admin-prefix |
| `registration.page.login.forgot` | Forgot your password? | HIT `route.forgot-password` | 3col |
| `registration.page.resetPassword.sendInstructions` | Send instructions | OOS | admin-prefix |
| `remove-canned-responses` | Remove Canned Responses | OOS | perm-kebab |
| `remove-closed-livechat-room` | Remove Closed Omnichannel Room | OOS | perm-kebab |
| `remove-livechat-department` | Remove Omnichannel Departments | OOS | perm-kebab |
| `remove-slackbridge-links` | Remove Slackbridge Links | OOS | perm-kebab |
| `remove-team-channel` | Remove Team Channel | OOS | perm-kebab |
| `remove-user` | Remove User | OOS | perm-kebab |
| `request` | request | HIT `room.quick.transcript.modal.request` | 3col |
| `request-pdf-transcript` | Request PDF Transcript | OOS | perm-kebab |
| `save-all-canned-responses` | Save All Canned Responses | OOS | perm-kebab |
| `save-canned-responses` | Save Canned Responses | OOS | perm-kebab |
| `save-department-canned-responses` | Save Department Canned Responses | OOS | perm-kebab |
| `send-mail` | Send Emails | OOS | perm-kebab |
| `send-many-messages` | Send Many Messages | OOS | perm-kebab |
| `send-omnichannel-chat-transcript` | Send Omnichannel Conversation Transcript | OOS | perm-kebab |
| `set-leader` | Set Leader | HIT `room.members.action.set-leader` | 3col |
| `set-moderator` | Set Moderator | HIT `room.members.action.set-moderator` | 3col |
| `set-owner` | Set Owner | HIT `room.members.action.set-owner` | 3col |
| `set-react-when-readonly` | Set React When ReadOnly | OOS | perm-kebab |
| `set-readonly` | Set ReadOnly | OOS | perm-kebab |
| `set__username__as__role_` | set {{username}} as {{role}} | OOS | system-message |
| `show_offline_users` | show offline users | OOS | unbound |
| `start-discussion` | Start Discussion | OOS | perm-kebab |
| `start-discussion-other-user` | Start Discussion (Other-User) | OOS | perm-kebab |
| `transfer-livechat-guest` | Transfer Livechat Guests | OOS | perm-kebab |
| `unarchive-room` | Unarchive Room | OOS | perm-kebab |
| `unblock-livechat-contact` | Unblock Omnichannel Contact Channel | OOS | perm-kebab |
| `update-livechat-contact` | Update Omnichannel Contacts | OOS | perm-kebab |
| `video_conference_ended` | _Call has ended._ | OOS | unbound |
| `video_direct_ended` | _Call has ended._ | OOS | unbound |
| `Select_message_from_user` | Select message from {{username}} | HIT `tl.select.enter` | semantic-r1 |

本节表体 **929**（不含表头）。用 §3 python 按标题切片计数，不要对全文 `rg`（会把 §2/§3/§5 命令列算进去）。

---

## 5. 必须补行清单

下列 MISS **确有用户可点控件**，且 round-1 00–16 **没有**覆盖该入口（弱命中标题 / 已有「打开弹层」行不够）。**不**在此发明 8 列行。只给 key + 按钮 `file:line`（e519470）。

| key | English | 按钮 file:line | 为何现有行不够 |
| --- | --- | --- | --- |
| `Accept_without_mic` | Accept without mic | `packages/ui-voip/src/views/PermissionFlow/PermissionFlowModal.tsx:46` | 来电权限流「无麦接听」。13 `room.chrome.call.incoming.accept` 是 videoconf 弹层 `Accept`，不是 Voip PermissionFlow |
| `VoIP_allow_and_accept` | Allow and accept | `packages/ui-voip/src/views/PermissionFlow/PermissionFlowModal.tsx:49` | 来电权限流「授权并接听」。同文件 `incomingPrompt`；atlas 无 PermissionFlow |
| `Call_without_mic` | Call without mic | `packages/ui-voip/src/views/PermissionFlow/PermissionFlowModal.tsx:55` | 呼出权限流「无麦呼叫」。13 只写 Start_call / Mic_on，不写此入口 |
| `VoIP_allow_and_call` | Allow and call | `packages/ui-voip/src/views/PermissionFlow/PermissionFlowModal.tsx:58` | 呼出权限流「授权并呼叫」。同 `outgoingPrompt` |
| `Allow` | Allow | `packages/ui-voip/src/views/PermissionFlow/PermissionFlowModal.tsx:67` | 换设备权限流确认钮。单词语 `Allow` 三列弱命中不算同一入口 |
| `Open_sidebar` | Open sidebar | `apps/meteor/client/components/SidebarToggler/SidebarTogglerButton.tsx:18` | 壳层 burger `title=Open_sidebar`。00–16 无侧栏开合行 |
| `Close_sidebar` | Close sidebar | `apps/meteor/client/components/SidebarToggler/SidebarTogglerButton.tsx:18` | 同一 IconButton 的 pressed 态 `title=Close_sidebar` |
| `Remove_filter` | Remove filter {{filter}} | `apps/meteor/client/navbar/NavBarSearch/NavBarSearchInputAddon.tsx:38` | 顶栏搜索已选 chip 的 `aria-label=Remove_filter`。无独立 atlas 行 |
| `Connect` | Connect | `apps/meteor/client/components/connectionStatus/ConnectionStatusBar.tsx:67` | 断线条主键 `Connect`。03/04 无 connection-status 行 |
| `Confirm_new_workspace` | Confirm new workspace | `apps/meteor/client/components/FingerprintChangeModalConfirmation.tsx:19` | 指纹/Unique ID 变更确认（新工作区）。07 workspace 只写 RegisterWorkspace，无 fingerprint 模态 |
| `Confirm_configuration_update` | Confirm configuration update | `apps/meteor/client/components/FingerprintChangeModalConfirmation.tsx:19` | 同一模态的「配置更新」标题+确认钮 |
| `Open_dialpad` | Open dialpad | `packages/ui-voip/src/views/MediaCallWidget/OngoingCall.tsx:80` | 通话中拨号盘开。13 voip 条写 Mute/Hold/Forward/Hangup，不写 Dialpad title |
| `Close_dialpad` | Close dialpad | `packages/ui-voip/src/views/MediaCallWidget/OngoingCall.tsx:80` | 同一钮的关闭 title |
| `Open_in_room` | Open in room | `packages/ui-voip/src/components/Cards/StreamCard/StreamCardOpenInRoom.tsx:16` | widget 共享流卡片「在房间打开」。13 popout 用的是 `Open_in_new_window` |
| `Stop_sharing` | Stop sharing | `packages/ui-voip/src/components/Cards/StreamCard/StreamCardStopSharingButton.tsx:16` | widget StreamCard 停共享。13 `room.chrome.voip.share-screen` 文案是 `Stop_sharing_screen` |
| `Voice_call__user__cancel` | Cancel call with {{user}} | `packages/ui-voip/src/hooks/useMediaCallAction.ts:38` | 顶栏/动作 calling 态取消。13 outgoing.cancel 文案是弹层 `Cancel`，不是此 title |
| `Voice_call__user__reject` | Reject call from {{user}} | `packages/ui-voip/src/hooks/useMediaCallAction.ts:46` | ringing 态拒接 title。13 incoming.decline 是弹层 `Decline` |
| `Call_again` | Call again | `packages/fuselage-ui-kit/src/blocks/VideoConferenceBlock/VideoConferenceBlock.tsx:155` | 已结束 1:1 videoconf 块 `Call_again`。10 `tl.uikit.videoconf.join` 只覆盖 join |
| `Call_back` | Call back | `packages/fuselage-ui-kit/src/blocks/VideoConferenceBlock/VideoConferenceBlock.tsx:155` | 同一块给被叫侧的 `Call_back` |
| `Open_call` | Open call | `apps/meteor/client/views/room/contextualBar/VideoConference/VideoConfBlockModal.tsx:13` | videoconf 块打开外窗确认钮。join 行不够 |
| `Set_up_2FA` | Set up 2FA | `apps/meteor/client/views/root/MainLayout/TwoFactorRequiredModal.tsx:23` | 强制 2FA 门闩模态主键。`route.2fa` / Security 页内 toggle 不是这个入口 |
| `Add_more_users` | Add more users | `apps/meteor/client/views/admin/users/AdminUserCreated.tsx:18` | 刚建用户后的空态「再加用户」。07 `page.admin.users.new` 是列表头 New_user |
| `Reload_to_update` | Reload to update | `apps/meteor/client/components/AutoupdateToastMessage.tsx:23` | 客户端热更新 toast 内按钮。atlas 无 autoupdate 行 |
| `Open_settings` | Open settings | `apps/meteor/client/views/room/contextualBar/VideoConference/VideoConfConfigModal.tsx:78` | 未配会议应用时，房间配置模态给管理员的主键。07 `page.admin.settings.open.video-conference` 是 Settings 索引卡，入口不同 |

本节表体 **24**。

未列入（已从 MISS 降为 HIT 或 OOS，故不占必须补行）：

- 已有动作的标题/确认文案：`Transfer_call`（13 `room.chrome.voip.forward` 确认钮是 `Hang_up_and_transfer_call`）`Send_invitation_email`（h2；钮 `Send` = `page.admin.users.invite.send`）`Share_Location_Title` `Discussion_title` `Teams_New_Title` `Delete_roomType` `Hide_room` `E2E_enable_encryption` `E2E_disable_encryption` `Enable_two-factor_authentication` `Change_E2EE_password`（h3）`Enter_TOTP_password` `Show_chat`（`Hide_chat` 双态，16 已覆盖）。
- 07/08/09 页内已有行：`Custom_*_Add/Edit` `clear_history` `Moderation_*` `RegisterWorkspace_*` 许可证钮 全渠道 Edit/Delete/Block 市集 Search/Install/Uninstall。
- toast / 系统句 / 名词列：`Call_started` `Call_ended` `Call_ID` `Invite_removed` `Start_of_conversation` `Check_back_later`（WAITING_KEYS 标题，不是钮）。
- 登录壳 placeholder：`Create_a_password`（04 `route.register`）。
- 无现行用户可点入口或仅门控设置：见 §6。

---

## 6. OOS 说明

EXTRACTED 里 **482** 条：`settings.add` 字段、权限 kebab、排障/布局/LDAP/SAML、错误/toast 名词、未绑定 key、已有动作的标题或筛选项。表 §4 列 3 为 `OOS`。

字段级设置仍按 05：本树 `this.add` / `settingsRegistry.add` 约 **1030** 次，不按 key 建行。

权限 kebab（`archive-room` `delete-user` `create-c`）进 OOS：它们是权限 id，按钮文案是另一把 key（`Archive` / `Delete` / `Create`）。

---

## 7. 停条件 / CLOSURE

```text
EXTRACTED = HIT + MISS + OOS
929 = 423 + 24 + 482
```

**必须补行清单 = 24 ≠ 0。** 本卷是反查输入，不写 8 列。评审在 e519470 复跑 §2.1，数字必须仍是 `TOTAL 7385 EXTRACTED 929`。

---

## 8. 边界

- 只覆盖主包 `packages/i18n/src/locales/en.i18n.json`。
- HIT 只证明 atlas 有稳定 id 与入口，不证明 role+name 已实测。
- 不把 13 `room.chrome.voip.share-screen`（`Stop_sharing_screen`）冒充 widget `Stop_sharing`。
- 不把 13 videoconf `Accept` 冒充 Voip `Accept_without_mic`。
- 不把 07 `page.admin.users.new` 冒充建用户后的 `Add_more_users`。
- 单词语 HIT 必须 key 在三列或语义映射写明。

调查日：2026-08-21。冻结：`e519470d35b6caf5b228d81aef41c86aab3051f4`。atlas 参考：`cursor/pm-atlas-merge-12-16-1b5b`。
