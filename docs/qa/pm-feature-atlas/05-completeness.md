# 分册 05 — 完备性自查 / i18n 反查 / Out of scope

本文件回答：哪些 `views/` 子树已经在 **本册作者写下的** 04 行里，哪些交给其他表面，哪些明确排除。禁止沉默跳过。未渲染 UI。

**现行 atlas：** `baseline: empty`。他册（消息工具条 / 房间 toolbox / composer+隐式 / navbar）在本调查时 **尚未入库**。凡「应有行」一律标 `待合并反查`，不假装他册已有 id。

04 已写入的 id 只以 `docs/qa/pm-feature-atlas/04-routes-and-shell.md` 表体为准（写作时 `^\| \`id\``：`route.*` 50、`account.*` 9、`directory.*` 4、`team.*` 1）。

---

## 1. `apps/meteor/client/views/` 子目录立场

命令：

```bash
ls -1 /workspace/apps/meteor/client/views/
```

输出（27 项，2026-08-20 工作区）：

```text
account
admin
audit
banners
cloud
composer
conference
directory
e2e
home
hooks
invite
mailer
marketplace
mediaCallHistory
modal
navigation
notAuthorized
notFound
oauth
OAuthTwoFactorAuthentication
omnichannel
outlookCalendar
room
root
search
teams
```

每目录文件数：

```bash
for d in /workspace/apps/meteor/client/views/*/; do
  echo "$(basename "$d") $(find "$d" -type f | wc -l)"
done
```

```text
account 54
admin 466
audit 36
banners 5
cloud 2
composer 18
conference 3
directory 16
e2e 6
home 13
hooks 10
invite 5
mailer 1
marketplace 195
mediaCallHistory 11
modal 3
navigation 67
notAuthorized 2
notFound 3
oauth 7
OAuthTwoFactorAuthentication 1
omnichannel 480
outlookCalendar 14
room 509
root 88
search 7
teams 49
```

| 目录 | 立场 |
|---|---|
| `account` | 已入行 — see booklet 04, ids: `account.profile` `account.preferences` `account.security` `account.integrations` `account.tokens` `account.omnichannel` `account.feature-preview` `account.accessibility-and-appearance` `account.manage-devices` |
| `admin` | 已入行 — see booklet 04, ids: `route.admin.home` 及 22 个侧栏 id（`route.admin.workspace` … `route.admin.settings`）。**不**展开设置字段、import 子步、用户/房间 CRUD。字段级见 §3。 |
| `audit` | 已入行 — see booklet 04, ids: `route.audit` `route.audit-log` `route.security-logs` |
| `banners` | out of scope — 全页横幅/UiKit banner 覆盖层，不是路由目的地。magnitude: `find` 5 files。`ls`: `BannerRegion.tsx` `hooks/` `LegacyBanner.tsx` `UiKitBanner.tsx` |
| `cloud` | out of scope — Cloud 公告覆盖层，不是路由目的地。magnitude: 2 files。`ls`: `CloudAnnouncementHandler.tsx` `CloudAnnouncementsRegion.tsx` |
| `composer` | 已交其他分册 — composer+implicit；本树是录音/emoji picker 等输入控件，不是独立路由页。不臆造他册行数。 |
| `conference` | 已入行 — see booklet 04, ids: `route.conference` |
| `directory` | 已入行 — see booklet 04, ids: `route.directory` `directory.channels` `directory.users` `directory.teams` `directory.external` |
| `e2e` | 已交其他分册 — composer+implicit / 房间 E2E（口令模态）。`ls`: `EnterE2EPasswordModal/` `SaveE2EPasswordModal.tsx`。无独立 route。 |
| `home` | 已入行 — see booklet 04, ids: `route.home`（Home 卡只作为进入 Directory 的入口写在该行关联里，不按卡拆行） |
| `hooks` | out of scope — 跨页 hooks，不是用户目的地。magnitude: 10 files。 |
| `invite` | 已入行 — see booklet 04, ids: `route.invite` `route.register-secret-url` |
| `mailer` | 已入行 — see booklet 04, ids: `route.mailer-unsubscribe` |
| `marketplace` | 已入行 — see booklet 04, ids: `route.marketplace`（仅入口）。Explore/Installed/Requested/Private/App 详情见 §3。magnitude 未展开部分: 195 files。 |
| `mediaCallHistory` | 已入行 — see booklet 04, ids: `route.call-history` |
| `modal` | out of scope — UiKit modal 挂载区，不是路由目的地。magnitude: 3 files。`ls`: `uikit/` |
| `navigation` | 已交其他分册 — navbar / implicit room（房间列表、筛选、sidepanel）。`ls`: `contexts/` `hooks/` `NavigationRegion.tsx` `providers/` `sidebar/` `sidepanel/`。顶栏控件他册；本册只在 **路由本身是功能** 时写了 Home/Directory 等。 |
| `notAuthorized` | out of scope — 内嵌未授权页，被 Directory tab / 审计 PermissionGuard 等复用，不是独立目的地。magnitude: 2 files。 |
| `notFound` | 已入行 — see booklet 04, ids: `route.not-found` |
| `oauth` | 已入行 — see booklet 04, ids: `route.oauth-authorize` `route.oauth-error` |
| `OAuthTwoFactorAuthentication` | 已入行 — see booklet 04, ids: `route.2fa` |
| `omnichannel` | 已入行 — see booklet 04, ids: `route.omnichannel`（仅管理入口）。坐席控制台与侧栏子页见 §3。magnitude 未展开: 480 files。 |
| `outlookCalendar` | 已交其他分册 — room toolbox / contextual bar（Outlook 事件列表与设置）。`ls`: `hooks/` `lib/` `OutlookCalendarEventModal.tsx` `OutlookEventsList/` `OutlookEventsRoute.tsx` `OutlookSettingsList/`。无顶层 `defineRoutes`。 |
| `room` | 已交其他分册 — message toolbar / room toolbox / composer+implicit（含 `UserCard/`、`composer/`、`contextualBar/`、`MessageList/`）。magnitude: 509 files。房间 path 由 `roomCoordinator` 注册，本册不展开。 |
| `root` | 已入行 — see booklet 04, ids: `route.login` `route.setup-wizard`（重定向钩）`route.token-login` `route.saml`。其余为 layout/error/loading 壳。 |
| `search` | 已入行 — see booklet 04, ids: `route.search` |
| `teams` | 已入行 — see booklet 04, ids: `directory.teams` `team.create`。`contextualBar/`（info/channels/leave/delete/convert）已交其他分册 — room toolbox。magnitude 未写入 toolbox 部分: 49 files 中的 contextualBar。 |

**27/27 有立场。** 无静默跳过。

---

## 2. 已确认挂载的兄弟 views 树

```bash
find /workspace -type d -name 'views' | sort
ls -1 /workspace/packages/livechat/src/routes/
ls -1 /workspace/packages/web-ui-registration/src/
```

`find` 输出：

```text
/workspace/apps/meteor/app/livechat/client/views
/workspace/apps/meteor/app/livechat-enterprise/client/views
/workspace/apps/meteor/app/ui/client/views
/workspace/apps/meteor/client/views
/workspace/packages/ui-client/src/views
/workspace/packages/ui-voip/src/views
```

另：`packages/livechat/src/routes/`（widget 用 `routes/` 不用 `views/`）；`packages/web-ui-registration/src/`（无 `views/` 目录名，但是登录壳）。

| 树 | `ls`（摘要） | 立场 |
|---|---|---|
| `packages/ui-client/src/views/` | `index.ts` `setupWizard/`（`SetupWizardPage.tsx` `SetupWizardRoute.tsx` `steps/` `hooks/` …）；`find` 13 files | 已入行 — see booklet 04, ids: `route.setup-wizard` |
| `packages/ui-voip/src/views/` | `CallHistoryContextualbar/` `MediaCallWidget/` `MediaCallPopout*` `MediaCallRoomSection/` `TransferModal.tsx` …；`find` 55 files | 历史页已入行 `route.call-history`。widget/popout/房间内通话条：已交其他分册 — implicit room / 通话控件。不臆造行数。 |
| `packages/livechat/src/routes/` | `Chat` `ChatFinished` `GDPRAgreement` `LeaveMessage` `Register` `SwitchDepartment` `TriggerMessage`（挂在 `App.tsx:176-184`） | out of scope — 访客 widget，独立 bundle，不是 Meteor 主 SPA 路由。magnitude: 7 route 目录。 |
| `packages/web-ui-registration/src/` | `LoginForm.tsx` `RegistrationPageRouter.tsx` `RegisterForm.tsx` `ResetPassword*` `CMSPage.tsx` …；`find` 30 files | 已入行 — see booklet 04, ids: `route.login` `route.register` `route.forgot-password` `route.reset-password` 及 CMS 三页 |
| `apps/meteor/app/livechat/client/views/` | `app/` | out of scope — 遗留 livechat 客户端碎片。magnitude: `ls` 1 子目录。 |
| `apps/meteor/app/livechat-enterprise/client/views/` | `business-hours/` `livechatSideNavItems.ts` | out of scope — EE 全渠道侧栏 7 项的注册，超出本册「只写入口一行」。magnitude: 2 顶层条目。 |
| `apps/meteor/app/ui/client/views/` | `app/` | out of scope — 遗留 UI。magnitude: 1 子目录。 |
| `apps/meteor/ee/client/` | **不存在**（`ls` 无此路径） | 无树可列。EE UI 住在 `client/views/` 内用许可证门控。 |
| `ee/apps/` | 微服务（account-service 等），无 UI | out of scope — 无页面。 |

---

## 3. Out of scope 台账（必须带数量级）

未展开又未排除 = 缺陷。下列均 **明确排除**。

### 3.1 管理设置字段级

04 只写 `route.admin.settings`（打开组列表）。

```bash
rg "this\.add\('" /workspace/apps/meteor/server/settings --glob '*.ts' | wc -l
# 791

rg "settingsRegistry\.add\(" /workspace/apps/meteor/server/settings --glob '*.ts' | wc -l
# 18

rg "this\.add\('" /workspace/apps/meteor/ee/server --glob '*.ts' --glob '!**/tests/**' | wc -l
# 97

rg "settingsRegistry\.add\(" /workspace/apps/meteor/ee/server --glob '*.ts' --glob '!**/tests/**' | wc -l
# 19

rg "this\.add\('|settingsRegistry\.add\(" \
  /workspace/apps/meteor/server /workspace/apps/meteor/ee/server \
  --glob '*.ts' --glob '!**/tests/**' | wc -l
# 972

find /workspace/apps/meteor/server/settings -maxdepth 1 -name '*.ts' -type f | wc -l
# 47

find /workspace/apps/meteor/ee/server/settings -name '*.ts' -type f | wc -l
# 11

rg "addGroup\(" /workspace/apps/meteor/server/settings --glob '*.ts' | wc -l
# 37
```

量级：**约 10³ 条 setting 注册**（972 次 `add` 调用，含 OAuth/联邦/AI/EE；核心 `server/settings` 的 `this.add` 为 791）。`apps/meteor/client/views/admin/settings` 随组渲染这些字段，本册不逐字段建行。

### 3.2 全渠道（超出侧栏入口）

04 只写 `route.omnichannel`。

```bash
find /workspace/apps/meteor/client/views/omnichannel -type f | wc -l
# 480

rg -c "registerOmnichannelRoute\(" /workspace/apps/meteor/client/views/omnichannel/routes.ts
# 20

rg -c "i18nLabel:" /workspace/apps/meteor/client/views/omnichannel/sidebarItems.tsx
# 13

rg -c "i18nLabel:" /workspace/apps/meteor/app/livechat-enterprise/client/views/livechatSideNavItems.ts
# 7
```

排除内容（量级：20 条子路由 + 480 文件 + 2 条坐席顶栏路由）：

- 管理侧栏 13：Contact Center / Analytics / Real-Time / Managers / Agents / Departments / Custom Fields / Triggers / Installation / Appearance / Webhooks / Business Hours / Security & privacy
- EE 7（`livechat-enterprise`）：Reports / Monitors / Units / Canned Responses / Tags / SLA / Priorities
- 坐席控制台路由：`/omnichannel-directory`、`/livechat-queue`（`startup/routes.tsx:168-183`）
- 房间类型 `live`（`/live/:id`）— 隐式房间

### 3.3 市场（超出入口）

04 只写 `route.marketplace`。

```bash
find /workspace/apps/meteor/client/views/marketplace -type f | wc -l
# 195

rg -c "i18nLabel:" /workspace/apps/meteor/client/views/marketplace/sidebarItems.tsx
# 8   （6 个可点项含 Documentation + 2 divider）
```

排除：Explore / Premium / Installed / Requested / Private Apps / Documentation 外链、App 详情 tabs、安装/权限/更新模态。量级：195 files，1 条 catch-all `registerMarketplaceRoute`。

### 3.4 房间与消息表面

```bash
find /workspace/apps/meteor/client/views/room -type f | wc -l
# 509
```

`roomCoordinator` 为 `channel` `/channel/:name/:tab?/:context?`、`group` `/group/:name/...`、`direct` `/direct/:rid/...`、`live` `/live/:id/...` 注册路由。本册不写。消息工具条、toolbox、UserCard、composer 交对应分册。`待合并反查`。

### 3.5 Livechat 访客 widget

`packages/livechat` 7 条 widget 路由（§2）。独立 i18n：`packages/livechat/src/i18n/en.json`（嵌套 `translation`，103 keys）。不并入主 SPA atlas 行。

### 3.6 其他已点名排除

| 项 | 命令/数字 | 理由 |
|---|---|---|
| 顶栏 Sort / 前进后退 / 在线状态 | 组件在 `client/navbar/`，非 `views/` 子目录 | navbar 他册 |
| `/meet/:rid` | `startup/routes.tsx` 仅有 `IRouterPaths`，`defineRoutes` 无此项 | 未注册 |
| `index` `/` | 1 个 id | 纯跳转 |
| 联邦 External 目录 | `federationEnabled = false` 写死 | 04 已写 `directory.external` 标明不渲染，不另开联邦分册 |
| `apps/meteor/ee/` UI | 0 `.tsx` | 无独立 EE views 树 |

---

## 4. i18n 反向抽查（30 条动词样）

### 4.1 路径核实

```bash
ls -la /workspace/packages/i18n/src/locales/en.i18n.json
# -rw-r--r-- ... 522594 ... packages/i18n/src/locales/en.i18n.json

ls -la /workspace/apps/meteor/packages/rocketchat-i18n
# i18n -> ../../../../packages/i18n/dist/resources   （Meteor 包装；源文件在 packages/i18n）

python3 -c "import json; print(len(json.load(open('/workspace/packages/i18n/src/locales/en.i18n.json'))))"
# 7392
```

权威英文文件：**`packages/i18n/src/locales/en.i18n.json`**（扁平 `key → string`，7392 keys）。`docs/i18n.md` 确认 `en.i18n.json` 为基语言。

### 4.2 抽样方法（可复现）

```bash
python3 - <<'PY'
import json, random, re
data = json.load(open("/workspace/packages/i18n/src/locales/en.i18n.json"))
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
}
def is_actiony(k, v):
    if not isinstance(v, str): return False
    words = re.findall(r"[A-Za-z']+", v)
    if not (1 <= len(words) <= 4): return False
    first = words[0][:1].upper() + words[0][1:]
    if first not in VERBS: return False
    if k.count("_") >= 4 or "." in k: return False
    return True
cands = [(k,v) for k,v in data.items() if is_actiony(k,v)]
print("CANDIDATES", len(cands), "TOTAL", len(data))
for k,v in random.Random(20260820).sample(cands, 30):
    print(f"{k}\t{v}")
PY
```

实测：`CANDIDATES=826` `TOTAL=7392` `SEED=20260820`。过滤：英文 1–4 词且首词在 VERB 集合；排除 key 含 ≥4 个 `_` 或 `.`（去掉一长串设置 id）。**不是**纯工具条动词表——会抽到设置标签与权限 id，下面如实标。

### 4.3 30 条

| # | key | English | 应有 atlas 行？ | 候选分册 | 代码 file:line | 反查 |
|---|---|---|---|---|---|---|
| 1 | `Report_has_been_sent` | Report has been sent | 是（成功 toast，附着于 Report 动作） | message toolbar / user-card | `apps/meteor/client/views/room/modals/ReportMessageModal/ReportMessageModal.tsx:50`；`.../useReportUser.tsx:28` | 待合并反查 |
| 2 | `Send_anyway` | Send anyway | 是（上传确认） | composer+implicit | `apps/meteor/client/lib/chats/flows/processMessageUploads.ts:202` | 待合并反查 |
| 3 | `Upload` | Upload | 是（多处；管理导入也用） | admin 字段级 OOS；composer 上传 | `apps/meteor/client/views/admin/import/NewImportPage.tsx:259` | 待合并反查 |
| 4 | `Enable` | Enable | 视表面：市场 App 菜单是 | marketplace OOS（超出入口） | `apps/meteor/client/views/marketplace/hooks/useAppMenu.tsx:430` | 待合并反查 |
| 5 | `VideoConf_Enable_Groups` | Enable in private channels | 否（设置 id，不是用户点击动词） | admin settings OOS | `apps/meteor/ee/server/settings/video-conference.ts:23`；读取：`useVideoCallRoomAction.ts:37` | 待合并反查 |
| 6 | `Open_in_new_window` | Open in new window | 是（通话弹出） | implicit / voip widget | `packages/ui-voip/src/views/MediaCallWidget/OngoingCallWithScreen.tsx:68` | 待合并反查 |
| 7 | `Show_mentions` | Show badge for mentions | 是（房间通知偏好字段） | room toolbox | `apps/meteor/client/views/room/contextualBar/NotificationPreferences/NotificationPreferencesForm.tsx:52` | 待合并反查 |
| 8 | `Troubleshoot_Disable_Presence_Broadcast` | Disable Presence Broadcast | 否（排障设置） | admin settings OOS | `apps/meteor/server/settings/troubleshoot.ts:17` | 待合并反查 |
| 9 | `Register` | Register | 是 | 04 已写 `route.register`（登录壳） | `packages/web-ui-registration/src/RegisterSecretPageRouter.tsx:35` | 待合并反查（对 04 行） |
| 10 | `Start_Date` | Start Date | 否（名词日期字段，虽以 Start 开头） | marketplace OOS | `apps/meteor/client/views/marketplace/AppDetailsPage/tabs/AppLogs/Filters/DateTimeFilter.tsx:24` | 待合并反查 |
| 11 | `delete-user` | Delete User | 是（权限 id + 管理删用户） | admin users CRUD（04 只打开列表） | `apps/meteor/client/views/admin/users/hooks/useDeleteUserAction.tsx:23` | 待合并反查 |
| 12 | `delete-livechat-contact` | Delete Omnichannel Contact | 是 | omnichannel OOS | 权限：`apps/meteor/server/lib/authorization/constant/permissions.ts`；API `omnichannel/contact.ts:244` | 待合并反查 |
| 13 | `Markdown_Marked_SmartLists` | Enable Marked Smart Lists | 否（设置） | admin settings OOS | 设置注册（`server/settings` Markdown 组） | 待合并反查 |
| 14 | `Select_period` | Select period | 是（Engagement 控件，04 只打开页） | admin engagement 页内 | `apps/meteor/client/views/admin/engagementDashboard/users/BusiestChatTimesSection.tsx:51` | 待合并反查 |
| 15 | `Save_Mobile_Bandwidth` | Save Mobile Bandwidth | 是（偏好字段；04 只写整页 `account.preferences`） | 04 页级已覆盖；字段级可选 | `apps/meteor/client/views/account/preferences/PreferencesMessagesSection.tsx:107` | 待合并反查 |
| 16 | `Add_users` | Add users | 是 | 04 `route.home` 卡片；亦 admin 角色加用户 | `apps/meteor/client/views/home/cards/AddUsersCard.tsx:17`；`admin/permissions/UsersInRole/UsersInRolePage.tsx:123` | 待合并反查 |
| 17 | `Mute_Focused_Conversations` | Mute Focused Conversations | 是（偏好字段） | 同 #15，挂 `account.preferences` | `apps/meteor/client/views/account/preferences/PreferencesSoundSection.tsx:116` | 待合并反查 |
| 18 | `create-c` | Create Public Channels | 是（权限；顶栏新建频道） | navbar / 04 `team.create` 的并列门控 | `apps/meteor/client/navbar/NavBarPagesGroup/hooks/useCreateNewItems.ts:12` | 待合并反查 |
| 19 | `save-all-canned-responses` | Save All Canned Responses | 是 | omnichannel OOS | `apps/meteor/client/views/omnichannel/cannedResponses/modals/CannedResponsesTable.tsx:34` | 待合并反查 |
| 20 | `Teams_Select_a_team` | Select a team | 是 | room toolbox（频道移入团队） | `apps/meteor/client/views/room/contextualBar/Info/ChannelToTeamModal/ChannelToTeamSelection.tsx:23` | 待合并反查 |
| 21 | `archive-room` | Archive Room | 是 | room toolbox | 权限 `permissions.ts:16`；方法 `server/meteor-methods/rooms/archiveRoom.ts:37` | 待合并反查 |
| 22 | `Troubleshoot_Disable_Notifications` | Disable Notifications | 否（排障设置） | admin settings OOS | `apps/meteor/server/hooks/messages/sendNotificationsOnMessage.ts:70` | 待合并反查 |
| 23 | `Custom_User_Status_Add` | Add Custom User Status | 是 | 04 只打开 `route.admin.user-status` | `apps/meteor/client/views/admin/customUserStatus/CustomUserStatusRoute.tsx:82` | 待合并反查 |
| 24 | `Markdown_Marked_Tables` | Enable Marked Tables | 否（设置） | admin settings OOS | `server/settings` Markdown 组 | 待合并反查 |
| 25 | `Send_Test_Email` | Send test email | 是 | 04 只打开 `route.admin.email-inboxes` | `apps/meteor/client/views/admin/emailInbox/SendTestButton.tsx:36` | 待合并反查 |
| 26 | `Join` | Join | 是 | composer+implicit（加入房间/会议） | `apps/meteor/client/views/room/composer/ComposerReadOnly.tsx:30`；`MessageBox.tsx:508`；`fuselage-ui-kit VideoConferenceBlock.tsx:205` | 待合并反查 |
| 27 | `Remove_custom_oauth` | Remove custom OAuth | 是 | admin settings OOS（OAuth 组） | `apps/meteor/client/views/admin/settings/groups/OAuthGroupPage/OAuthGroupPage.tsx:130` | 待合并反查 |
| 28 | `Moderation_Hide_reports` | Hide reports | 是 | 04 只打开 `route.admin.moderation` | `apps/meteor/client/views/admin/moderation/helpers/ReportReasonCollapsible.tsx:18` | 待合并反查 |
| 29 | `clear_history` | Clear History | 是 | 04 只打开 `route.admin.integrations` | `apps/meteor/client/views/admin/integrations/outgoing/history/OutgoingWebhookHistoryPage.tsx:111` | 待合并反查 |
| 30 | `Add_them` | Add them | 是（提及不在房用户时的动作） | composer+implicit | `apps/meteor/server/hooks/messages/mentionUserNotInChannel.ts:26` | 待合并反查 |

**诚实说明：** 30 条里有 6 条（#5 #8 #10 #13 #22 #24）是设置/名词，不是工具条动词；过滤按「首词是动词」会收入。不把它们改写成假的用户动作。#9 对应 04 已有行，仍标 `待合并反查`（需人工核对文案是否同一入口）。

---

## 验算

### views/ 立场覆盖

```bash
ls -1 apps/meteor/client/views/ | wc -l
# 27
```

本文件 §1 表行数必须 = 27。

```bash
# 立场表行（目录列）
rg -c '^\| `' docs/qa/pm-feature-atlas/05-completeness.md
```

§1 表应有 27 行目录；§2 兄弟树另表，不计入这 27。

### 禁止项

- 无「稍后补」空立场。
- 无伪造他册行数。
- Out of scope 三条必选项（设置 / 全渠道 / 市场）均有命令+数字。
- i18n 30 行齐全，方法可复跑。

### 04 对照

```bash
rg -c '^\| `route\.' docs/qa/pm-feature-atlas/04-routes-and-shell.md   # 50
rg -c '^\| `account\.' docs/qa/pm-feature-atlas/04-routes-and-shell.md # 9
rg -c '^\| `directory\.' docs/qa/pm-feature-atlas/04-routes-and-shell.md # 4
rg -c '^\| `team\.' docs/qa/pm-feature-atlas/04-routes-and-shell.md    # 1
```

---

## [待渲染实测] 汇总

1. §1 每个「已入行」目录：04 所写入口在默认工作区是否真的可点到。
2. `navigation` 在 `secondarySidebar` 开/关两种壳下是否仍只是房间列表（无漏网独立页）。
3. `outlookCalendar` 是否仅以房间 tab 出现。
4. Livechat widget 7 路由在嵌入脚本下的可达性（本仓库未跑 widget）。
5. i18n #9 `Register` 与 04 `route.register` 是否同一按钮文案（登录页脚 vs 模板 aria-label）。
6. 管理设置 972 条 add 与 UI 组数 37 的对应（字段级未做）。
7. 全渠道 13+7 侧栏在缺许可证时是否少 7 项。
8. 市场无 `access-marketplace`/`manage-apps` 时是否 404 而非空壳。

---

## 计数证据

见上文每节粘贴的 `ls`/`find`/`rg | wc`。调查日：2026-08-20，分支基线 `develop`。

补充：

```bash
rg -l -i 'feature.?atlas|pm-feature-atlas|booklet' docs packages apps ee 2>/dev/null
# 本工作写入前：无匹配（baseline empty）
# 本工作写入后：docs/qa/pm-feature-atlas/04-routes-and-shell.md
#               docs/qa/pm-feature-atlas/05-completeness.md
```

---

## id 列表

本文件 **不新建** 功能 id。引用的 04 id 见 04「id 列表」。

---

## 边界

- 完备性只覆盖 **已挂载的 views 树**。服务端方法、REST、移动端原生 UI 不在本表。
- 「已交其他分册」不证明他册已写行；只指定表面。
- 权限 id 当 i18n key（`delete-user`、`create-c`）出现在抽查里，不升格为 04 路由行。

---

## 与现行 atlas

`baseline: empty`。04+05 是本仓库第一批 atlas 文件。合并窗口内若他册先合入，用 04 id 列表与本节 27 目录表做差，禁止靠记忆补行。

---

## 附录：每个 `views/` 子目录的 `ls`（命令+输出）

```bash
for d in account admin audit banners cloud composer conference directory e2e home hooks invite mailer marketplace mediaCallHistory modal navigation notAuthorized notFound oauth OAuthTwoFactorAuthentication omnichannel outlookCalendar room root search teams; do
  echo "===== ls apps/meteor/client/views/$d ====="
  ls -1 "apps/meteor/client/views/$d"
done
```

```text
===== ls apps/meteor/client/views/account =====
accessibility
AccountRouter.tsx
AccountSidebar.tsx
deviceManagement
featurePreview
index.ts
integrations
omnichannel
preferences
profile
routes.tsx
security
sidebarItems.tsx
tokens

===== ls apps/meteor/client/views/admin =====
ABAC
AdministrationLayout.tsx
AdministrationRouter.tsx
aiCenter
customEmoji
customSounds
customUserStatus
deviceManagement
EditableSettingsContext.spec.tsx
EditableSettingsContext.ts
emailInbox
engagementDashboard
featurePreview
import
index.ts
integrations
invites
mailer
moderation
oauthApps
permissions
rooms
routes.tsx
settings
sidebar
sidebarItems.ts
subscription
users
viewLogs
workspace

===== ls apps/meteor/client/views/audit =====
AuditLogPage.tsx
AuditPage.tsx
components
hooks
SecurityLogsPage.tsx
utils

===== ls apps/meteor/client/views/banners =====
BannerRegion.tsx
hooks
LegacyBanner.tsx
UiKitBanner.tsx

===== ls apps/meteor/client/views/cloud =====
CloudAnnouncementHandler.tsx
CloudAnnouncementsRegion.tsx

===== ls apps/meteor/client/views/composer =====
AudioMessageRecorder
EmojiPicker
VideoMessageRecorder

===== ls apps/meteor/client/views/conference =====
ConferencePageError.tsx
ConferencePage.tsx
ConferenceRoute.tsx

===== ls apps/meteor/client/views/directory =====
DirectoryPage.tsx
hooks
index.ts
RoomTags.tsx
tabs

===== ls apps/meteor/client/views/e2e =====
EnterE2EPasswordModal
SaveE2EPasswordModal.tsx

===== ls apps/meteor/client/views/home =====
cards
CustomHomePageContent.tsx
CustomHomePage.tsx
DefaultHomePage.tsx
HomePageHeader.tsx
HomePage.tsx
HomeSkeleton.tsx

===== ls apps/meteor/client/views/hooks =====
roomActions
useActiveConnections.ts
useMemberExists.ts
useMemberList.spec.ts
useMembersList.ts
useRequire2faSetup.ts
useResetE2EPasswordMutation.ts
useRoomBannedUsers.ts
useStatistics.ts

===== ls apps/meteor/client/views/invite =====
hooks
InvitePage.tsx
SecretURLPage.tsx

===== ls apps/meteor/client/views/mailer =====
MailerUnsubscriptionPage.tsx

===== ls apps/meteor/client/views/marketplace =====
AppDetailsPage
AppExemptModal.tsx
AppInstallPage.tsx
AppMenu.spec.tsx
AppMenu.tsx
AppPermissionsReviewModal.tsx
AppsList
AppsPage
AppsRoute.tsx
AppUpdateModal.tsx
BundleChips.tsx
components
definitions
helpers
helpers.ts
hooks
IframeModal.tsx
index.ts
lib
MarketplaceRouter.tsx
MarketplaceSidebar.tsx
routes.tsx
sidebarItems.tsx
types.ts
UnlimitedAppsUpsellModal.tsx

===== ls apps/meteor/client/views/mediaCallHistory =====
CallHistoryPageFilters.tsx
CallHistoryPageLayout.tsx
CallHistoryPage.tsx
CallHistoryRowExternalUser.tsx
CallHistoryRowInternalUser.tsx
CallHistoryRowUnknownUser.tsx
MediaCallHistoryContextualbarRoom.tsx
MediaCallHistoryContextualbar.tsx
MediaCallHistoryExternal.tsx
MediaCallHistoryInternal.tsx
useMediaCallInternalHistoryActions.ts

===== ls apps/meteor/client/views/modal =====
uikit

===== ls apps/meteor/client/views/navigation =====
contexts
hooks
index.ts
NavigationRegion.tsx
providers
sidebar
sidepanel

===== ls apps/meteor/client/views/notAuthorized =====
NotAuthorizedPage.stories.tsx
NotAuthorizedPage.tsx

===== ls apps/meteor/client/views/notFound =====
NotFoundPage.spec.tsx
NotFoundPage.stories.tsx
NotFoundPage.tsx

===== ls apps/meteor/client/views/oauth =====
components
hooks
OAuthAuthorizationPage.tsx
OAuthErrorPage.tsx

===== ls apps/meteor/client/views/OAuthTwoFactorAuthentication =====
OAuthTwoFactorAuthenticationRouter.tsx

===== ls apps/meteor/client/views/omnichannel =====
additionalForms
additionalForms.tsx
agents
analytics
appearance
businessHours
cannedResponses
components
contactHistory
contactInfo
customFields
departments
directory
ExternalFrameContainer.tsx
hooks
index.ts
installation
managers
modals
monitors
OmnichannelRouter.tsx
priorities
queueList
realTimeMonitoring
reports
routes.ts
securityPrivacy
sidebar
sidebarItems.tsx
slaPolicies
tags
triggers
types
units
webhooks

===== ls apps/meteor/client/views/outlookCalendar =====
hooks
lib
OutlookCalendarEventModal.tsx
OutlookEventsList
OutlookEventsRoute.tsx
OutlookSettingsList

===== ls apps/meteor/client/views/room =====
body
BubbleDate
ClassificationBanner
composer
contexts
contextualBar
E2EESetup
Header
hooks
ImageGallery
index.ts
layout
lib
MemberListRouter.tsx
MessageList
modals
NotSubscribedRoom.tsx
providers
RoomAnnouncement
RoomInvite.tsx
RoomNotFound.tsx
RoomOpenerEmbedded.tsx
RoomOpener.tsx
RoomRoute.tsx
RoomSkeleton.tsx
Room.tsx
ShareLocation
UserCard
webdav

===== ls apps/meteor/client/views/root =====
AppErrorPage.tsx
AppLayout.tsx
AppRoot.tsx
DocumentTitleWrapper.tsx
hooks
IndexRoute.tsx
lib
LoginTokenRoute.tsx
MainLayout
OutermostErrorBoundary.tsx
PageLoading.tsx
SAMLLoginRoute.spec.tsx
SAMLLoginRoute.tsx

===== ls apps/meteor/client/views/search =====
hooks
SearchAnswerPanel.spec.tsx
SearchAnswerPanel.tsx
SearchPage.tsx
SearchSourceResult.spec.tsx
SearchSourceResult.tsx

===== ls apps/meteor/client/views/teams =====
ChannelDesertionTable
contextualBar
```

兄弟树：

```bash
ls -1 packages/ui-client/src/views
ls -1 packages/ui-voip/src/views
ls -1 packages/livechat/src/routes
ls -1 packages/web-ui-registration/src
ls -1 apps/meteor/app/livechat/client/views
ls -1 apps/meteor/app/livechat-enterprise/client/views
ls -1 apps/meteor/app/ui/client/views
```

```text
===== packages/ui-client/src/views =====
index.ts
setupWizard

===== packages/ui-voip/src/views =====
CallHistoryContextualbar
index.ts
MediaCallCardList.tsx
MediaCallHistoryTable
MediaCallPopout.tsx
MediaCallPopoutView.tsx
MediaCallPopoutWindow.tsx
MediaCallRoomSection
MediaCallWidget
PermissionFlow
PopoutDockPrompt.tsx
TransferModal.tsx
useFullscreenToggle.spec.tsx
useFullscreenToggle.ts
usePopoutWindow.ts

===== packages/livechat/src/routes =====
Chat
ChatFinished
GDPRAgreement
LeaveMessage
Register
SwitchDepartment
TriggerMessage

===== packages/web-ui-registration/src =====
CMSPage.tsx
components
EmailConfirmationForm.tsx
GuestForm.tsx
hooks
index.ts
LoginForm.tsx
LoginServicesButton.tsx
LoginServices.tsx
RegisterFormDisabled.tsx
RegisterForm.tsx
RegisterSecretPageRouter.tsx
RegisterTemplate.tsx
RegistrationPageRouter.tsx
ResetPassword
ResetPasswordForm.tsx
SecretRegisterForm.tsx
SecretRegisterInvalidForm.tsx
template

===== apps/meteor/app/livechat/client/views =====
app

===== apps/meteor/app/livechat-enterprise/client/views =====
business-hours
livechatSideNavItems.ts

===== apps/meteor/app/ui/client/views =====
app
```

