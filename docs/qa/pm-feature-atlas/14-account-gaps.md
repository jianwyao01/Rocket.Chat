# 分册 14 — 账号操作缺口（GAP HUNT）

对照 04 `account.*` 入口 + 07 全部 `page.account.*`，把 `apps/meteor/client/views/account/**` 每个已注册路由页上的 **每一个** input / button / toggle / link 再走一遍。07 已有 id **不改写**。页上有、07 没拆成行的 = **NEW**（`account.gap.*`）。产品里没有的控件 = **确认不存在** + `file:line`，不发明行。

本合并文件：canonical = [PR #12](https://github.com/jianwyao01/Rocket.Chat/pull/12) `cursor/pm-atlas-account-gaps-c5d3`（12 个 `account.gap.*`）。再并入 [PR #16](https://github.com/jianwyao01/Rocket.Chat/pull/16) `cursor/account-gaps-78a0` **仅 unique**：`e2e.save-modal.*`、`e2e.reset.2fa`、`tokens.*.2fa`（7 行，仍用原文 `acct.gap.*` 前缀）。同控件两套 id（`acct.gap.e2e.enter.forgot` 等）不复行，见 00 alias。

**基线：** `cursor/pm-atlas-merge-06-11-f8ed` @ `9a0eab0287`（其上 `develop` `e10bd504b9`）。不改产品代码。未开浏览器；界面 role+name 标 `[待渲染实测]`；源码读到的 i18n / 设置 / 权限 / endpoint 标 `[读]`。

**方法：**

1. 打开 `account/routes.tsx` 8 条 `registerAccountRoute` + EE `startup/deviceManagement.ts` 的 `/manage-devices`。
2. 打开 `sidebarItems.tsx` 8 项 + EE `Manage_Devices`。
3. 每页列出控件，匹配 07 B1–B9 + F。
4. 用户点名的 Profile / Preferences / Security / Sessions / Tokens / WebDAV / Feature preview / Accessibility / Keyboard / sidebar 必须给出 **present 或 absent** 裁决。

**列约定（8 列，与 07 相同）：** 稳定语义 id / 功能一句话 / 完整入口点击序列 / 门控 / 触发后果三件套 / 供给 / 关联 / 出处。

---

## 1. 必查项裁决（present / absent）

| 必查项 | 裁决 | 07 对照或 absent 证明 |
| --- | --- | --- |
| Profile 显示名 | **present** | `page.account.profile.name` |
| Profile 用户名 | **present** | `page.account.profile.username`（空必填 07 漏 → NEW `account.gap.profile.username.required`） |
| Profile 邮箱 + 验证 | **present** | `page.account.profile.email` + `resend-verification`（空必填 07 漏 → NEW `account.gap.profile.email.required`） |
| Profile bio | **present** | `page.account.profile.bio` |
| Profile nickname | **present** | `page.account.profile.nickname` |
| Profile custom fields | **present** | `page.account.profile.custom-fields` |
| Avatar 上传 | **present** | `page.account.profile.avatar.upload` |
| Avatar URL | **present** | `page.account.profile.avatar.url` + `add-url` |
| Avatar reset | **present** | `page.account.profile.avatar.reset` |
| Avatar **Gravatar 独立钮** | **确认不存在** | `UserAvatarEditor.tsx:99-157` 只有 Upload / reset / URL / `UserAvatarSuggestions`。Gravatar 只作为 suggestion `service:'gravatar'`（`getAvatarSuggestionForUser.ts:117-134`），走 `page.account.profile.avatar.suggest`。无 title=`Gravatar` 按钮。 |
| Logout other clients | **present** | `page.account.profile.logout-others`（`AccountProfilePage.tsx:128-130`） |
| Delete account + confirm | **present** | `page.account.profile.delete` + `delete.invalid-password` + `delete.last-owner`（空确认框 07 漏 → NEW `account.gap.profile.delete.confirm.required`） |
| Preferences `name=` mute focused | **present** | `page.account.preferences.mute-focused` ← `name='muteFocusedConversations'` |
| Preferences `name=` mobile bandwidth | **present** | `page.account.preferences.mobile-bandwidth` ← `name='saveMobileBandwidth'` |
| Highlights **add/remove 芯片钮** | **确认不存在** | `PreferencesHighlightsSection.tsx:11-21` 只有 `name='highlights'` textarea 4 行 + hint `Highlights_How_To`（逗号/换行拆数组）。无 Add / Remove chip。对照 `page.account.preferences.highlights`。 |
| Clock | **present（跳转）** | Preferences 无 `name=clockMode`；`page.account.preferences.link-clock` → 外观 `#clockMode`。真正 select = `page.account.accessibility.clock-mode`。 |
| Language | **present** | `page.account.preferences.language` |
| Send-on-enter | **present** | `page.account.preferences.send-on-enter` |
| Also-send-thread default | **present** | `page.account.preferences.thread-to-channel` ← `name='alsoSendThreadToChannel'` |
| Notifications **总开关** | **确认不存在** | `PreferencesNotificationsSection.tsx:96-207` 无 master on/off。通道级：`desktop-default` / `push-default` / `email-mode`。浏览器权限钮 = `desktop-permission`。 |
| Sounds | **present** | `master-volume` `notification-volume` `ringer-volume` `new-room-sound` `new-message-sound` `mute-focused` |
| Security 改密 | **present** | `page.account.security.password` + `password-confirm` + `password.save` + `password.cancel` |
| TOTP enable/disable | **present** | `page.account.security.totp.toggle` |
| Backup codes **独立查看** | **确认不存在** | TOTP 已启用时只有剩余数 + `Regenerate_codes`（`TwoFactorTOTP.tsx:173-180`）。无 View。码只在 verify/regenerate 后的 `BackupCodesModal` 出现（07 `totp.verify` / `totp.regenerate`）。 |
| Backup codes regenerate | **present** | `page.account.security.totp.regenerate` |
| Backup codes **download** | **确认不存在** | `BackupCodesModal.tsx:12-30` 只有 `CodeSnippet` Copy + Close。无 Download。Copy 07 漏 → NEW `account.gap.security.totp.backup-copy`。 |
| Email 2FA enable/disable | **present** | `page.account.security.email-2fa` |
| E2E set | **present** | `page.account.security.e2e-passphrase` + `e2e-passphrase-confirm` + `e2e-save` |
| E2E enter | **present（链）+ 07 漏模态内部** | 07 `e2e-enter-current` 只写 hint 链。链打开 `EnterE2EPasswordModal`（`ChangePassphrase.tsx:145-157` → `rocketchat.e2e.ts:586`）。模态内 password / Enable_encryption / Do_It_Later / 错密 / Forgot = NEW。 |
| E2E reset | **present** | `page.account.security.e2e-reset`（页内钮）。Enter 模态 Forgot 是第二条入口 → NEW。 |
| E2E **copy（安全页）** | **确认不存在** | `ChangePassphrase.tsx` / `ResetPassphrase.tsx` / `EndToEnd.tsx` 无 Copy。Copy 在房间首次 `SAVE_PASSWORD` 的 `SaveE2EPasswordModal.tsx:44-52`，**不是** `/account/security`。 |
| Security 页登出其他会话 | **确认不存在** | `AccountSecurityPage.tsx:43-91` 只有 Password / 2FA / E2E 手风琴 + 改密页脚。无 `Logout_Others`。登出其他端只在 Profile；按设备登出在 Manage_Devices。 |
| Sessions / logged-in devices | **present** | 页存在：EE `device-management` → `/account/manage-devices`（`startup/deviceManagement.ts:15-27`）。07 B8 `page.account.sessions.*`。空态/重试 07 漏 → NEW。 |
| PAT create | **present** | `page.account.tokens.add` |
| PAT show once | **present（捆在 add/regenerate）** | `AddToken.tsx:53-58` / `AccountTokensTable.tsx:73-78` 模态 `API_Personal_Access_Token_Generated` 展示 token+userId，关后不再显示。07 写在 add/regenerate 后果，不另拆。 |
| PAT regenerate | **present** | `page.account.tokens.regenerate` |
| PAT delete | **present** | `page.account.tokens.remove` |
| WebDAV **add（账号页）** | **确认不存在** | `AccountIntegrationsPage.tsx:44-66` 只有 select `WebDAV_Accounts` + danger `Remove`。Add 在 composer `useWebdavActions.tsx:20-33` `id:'webdav-add'` → `AddWebdavAccountModal`，不在 `views/account/**`。 |
| WebDAV remove | **present** | `page.account.integrations.remove` |
| Feature preview `secondarySidebar` | **present** | `page.account.feature-preview.secondary-sidebar` |
| Feature preview `aiSearch` | **present** | `page.account.feature-preview.ai-search` |
| Feature preview **其它 toggle** | **确认不存在** | `useFeaturePreviewList.ts:3,21-38`：`FeaturesAvailable = 'secondarySidebar' \| 'aiSearch'`，`defaultFeaturesPreview.length===2`。 |
| Accessibility 主题 | **present** | `theme.light` / `dark` / `high-contrast` / `auto`（`themeItems.ts:9-28` 仅这 4 个） |
| Accessibility 字号 | **present** | `page.account.accessibility.font-size`（`fontSizes.ts:6-12` 五档） |
| Accessibility **motion / reduce-motion** | **确认不存在** | `AccessibilityPage.tsx:111-208` 手风琴只有 Theme + Adjustable_layout（font / mentions / clock / usernames / roles）。`rg` 无 `reducedMotion` / `prefers-reduced-motion` 控件。 |
| Keyboard shortcuts modal | **present（只显示）** | `page.account.keyboard.display`。9 条 `dt/dd` 文案，无绑定。绑定留 03 `shortcut.*`。 |
| Sidebar 未炸开项 | **无** | 静态 8 + EE `Manage_Devices` = 9，04+07 均已炸。键盘在顶栏用户菜单，不在账号侧栏。 |

---

## 2. 确认不存在（产品无此控件）

每条必须能指到源码行。不写 NEW。

| 用户点名 / 假设控件 | 裁决 | 证明 `file:line` |
| --- | --- | --- |
| Profile 独立 Gravatar 钮 | 确认不存在 | `UserAvatarEditor.tsx:117-123`（Upload / reset / suggestions）；`UserAvatarSuggestions.tsx:19-26` 按 `suggestion.service` 渲染，gravatar 只是其中一项 |
| Highlights Add / Remove 芯片 | 确认不存在 | `PreferencesHighlightsSection.tsx:16` 单 textarea `name='highlights'` |
| 通知总开关（master notifications） | 确认不存在 | `PreferencesNotificationsSection.tsx:96-207` 无总 ToggleSwitch |
| Preferences 页内 clock select | 确认不存在 | `PreferencesMessagesSection.tsx:69-74` 只有 FieldLink；select 在 `AccessibilityPage.tsx:169-178` |
| Backup codes 独立 View | 确认不存在 | `TwoFactorTOTP.tsx:173-180` 已启用态无 View |
| Backup codes Download | 确认不存在 | `BackupCodesModal.tsx:19-28` Copy + Close only |
| Security 页 Logout other sessions | 确认不存在 | `AccountSecurityPage.tsx:43-91` |
| `/account/integrations` 上 WebDAV Add | 确认不存在 | `AccountIntegrationsPage.tsx:48-61` |
| 第三条 feature preview toggle | 确认不存在 | `useFeaturePreviewList.ts:3,21-38` |
| Accessibility motion / reduce-motion | 确认不存在 | `AccessibilityPage.tsx:111-208` |
| 账号侧栏未登记项 | 确认不存在 | `sidebarItems.tsx:13-62` + `deviceManagement.ts:22-26` |
| 非 EE 的「登录设备」第二页 | 确认不存在 | 仅 `/account/manage-devices`（EE）；core 只有 Profile `Logout_Others` |
| Security 页 E2E Copy | 确认不存在 | `ChangePassphrase.tsx:99-200`；Copy 在 `SaveE2EPasswordModal.tsx:44-52`（非 account 路由） |
| Preferences 未渲染的 type 字段（`enableNewMessageTemplate` / `sidebarShowFavorites` / `sidebarShowUnread` / `sidebarSortby` / `sidebarViewMode` / `sidebarDisplayAvatar` / `sidebarGroupByType`） | 确认不存在（本页） | `useAccountPreferencesValues.ts:30-37` 类型有；`return` 块 `:83-114` **不返回**；Preferences 各 Section 无对应 `name=`。侧栏排序在 02，不在本页。 |

Composer WebDAV Add（`useWebdavActions.tsx:29`）与房间 E2E Copy（`SaveE2EPasswordModal.tsx:44`）是**别的入口**，本册不新建 id。

---

## 3. NEW 行（07 漏的、账号页或从账号页打开的模态上真实存在的控件）

不复用 07 id。`account.gap.*`。

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `account.gap.profile.username.required` | 用户名为空被拦（Username 始终 required） | 顶栏头像→`Profile` → 清空 `Username` → `Save_changes` | `Accounts_AllowUserProfileChange` 才能进页；字段 `required: t('Required_field', { field: t('Username') })` `[读]` | 界面: `[待渲染实测]` `Required_field(Username)` ／ 导航: 不离开 `[读]` ／ 持久化: 无 `updateOwnBasicInfo` `[读]` | core | `page.account.profile.username` `page.account.profile.name.required` | `AccountProfileForm.tsx:236-239` `[读]` |
| `account.gap.profile.email.required` | 邮箱为空被拦（Email 始终 required） | Profile → 清空 `Email` → Save | 同上；`required: t('Required_field', { field: t('Email') })` `[读]` | 界面: `[待渲染实测]` `Required_field(Email)` ／ 导航: 不离开 `[读]` ／ 持久化: 无 `[读]` | core | `page.account.profile.email` `page.account.profile.email.invalid` | `AccountProfileForm.tsx:415-416` `[读]` |
| `account.gap.profile.delete.confirm.required` | 删号确认框空密码/空用户名被拦 | Profile → `Delete_my_account` → 确认框不填 → `Delete_account` | `Accounts_AllowDeleteOwnAccount`；有本地密码则密码框否则用户名框 `[读]` | 界面: `[待渲染实测]` `error-the-field-is-required`（Password 或 Username）／ 导航: 仍在模态 `[读]` ／ 持久化: 无 `deleteOwnAccount` `[读]` | core | `page.account.profile.delete` | `ActionConfirmModal.tsx:53-55,80-84` `[读]` |
| `account.gap.security.totp.backup-copy` | 把备份码复制到剪贴板 | Security → 开 TOTP 并 `Verify`（或已启用→`Regenerate_codes`）→ `BackupCodesModal` → `Copy` | TOTP 设置开；刚 verify 或 regenerate 才出模态 `[读]` | 界面: `[待渲染实测]` 按钮文案变 `Copied` 且 disabled ／ 导航: 模态仍开；`Close` 才关 `[读]` ／ 持久化: **无** HTTP；`useClipboard` 本地复制空格拼接的 codes `[读]` | core | `page.account.security.totp.verify` `page.account.security.totp.regenerate` | `BackupCodesModal.tsx:15-25` `[读]` |
| `account.gap.security.e2e-enter-password` | 在「输入当前 E2E 口令」模态里填口令 | Security → E2E → 密钥未 READY → hint「enter your current E2EE password」→ 模态 `Enter_E2E_password` → `Please_enter_E2EE_password` | `E2E_Enable`；`keysExist===false` 才出链；`decodePrivateKeyFlow` 要求 `db_private_key` `[读]` | 界面: `[待渲染实测]` PasswordInput ／ 导航: 模态叠在 security `[读]` ／ 持久化: 仅本地至确认 `[读]` | core | `page.account.security.e2e-enter-current` | `EnterE2EPasswordModal.tsx:71-119` `ChangePassphrase.tsx:145-157` `[读]` |
| `account.gap.security.e2e-enter-submit` | 提交当前 E2E 口令并解码私钥 | 同上 → `Enable_encryption` | 口令非空 `[读]` | 界面: `[待渲染实测]` toast `E2E_encryption_enabled`；链消失，改口令框解除 disabled `[待渲染实测]` ／ 导航: 关模态仍在 security `[读]` ／ 持久化: 本地 `keychain.decryptKey`；无 REST 改密 `[读]` | core | `account.gap.security.e2e-enter-password` `page.account.security.e2e-save` | `EnterE2EPasswordModal.tsx:36-47,78` `rocketchat.e2e.ts:539-542,586` `[读]` |
| `account.gap.security.e2e-enter-later` | 推迟输入当前 E2E 口令 | 同上模态 → `Do_It_Later` | 模态开着 `[读]` | 界面: `[待渲染实测]` toast `End_To_End_Encryption_Not_Enabled`；模态关；改口令仍 disabled `[读]` ／ 导航: 仍在 security `[读]` ／ 持久化: 无；`failedToDecodeKey=false` `[读]` | core | `account.gap.security.e2e-enter-password` | `EnterE2EPasswordModal.tsx:77,80` `rocketchat.e2e.ts:534-538` `[读]` |
| `account.gap.security.e2e-enter-invalid` | 当前 E2E 口令错误被拦 | 模态填错口令 → `Enable_encryption` | `decryptKey` 抛 `DOMException` `OperationError` `[读]` | 界面: `[待渲染实测]` `Incorrect_encryption_password`（不关模态）／ 导航: 仍在模态 `[读]` ／ 持久化: 无私钥解码 `[读]` | core | `account.gap.security.e2e-enter-password` | `EnterE2EPasswordModal.tsx:10,39-42` `[读]` |
| `account.gap.security.e2e-forgot` | 从输入口令模态走「忘记 E2E 口令」 | 模态 → `Forgot_E2EE_Password` | 模态开着 `[读]` | 界面: `[待渲染实测]` 切到 warning 模态 `Reset_E2EE_password` ／ 导航: 仍叠在 security `[读]` ／ 持久化: 尚未 POST `[读]` | core | `page.account.security.e2e-reset` | `EnterE2EPasswordModal.tsx:108-117,55-68` `[读]` |
| `account.gap.security.e2e-forgot-confirm` | 在忘记口令二次确认里重置并登出 | Forgot 后的模态 → `Reset_E2EE_password` | 同上 | 界面: `[待渲染实测]` toast `E2EE_password_reset` ／ 导航: `logout()` `[读]` ／ 持久化: `POST /v1/users.resetE2EKey`（与页内 reset **同一 mutation**）`[读]` | core | `page.account.security.e2e-reset` | `EnterE2EPasswordModal.tsx:22,64` `ResetPassphrase.tsx:8,17` `[读]` |
| `account.gap.sessions.empty` | 无登录设备时看空态 | 账号侧栏 `Manage_Devices` 且 `sessions.length===0` | EE `device-management` `[读]` | 界面: `[待渲染实测]` `GenericNoResults` ／ 导航: 仍在 `/account/manage-devices` `[读]` ／ 持久化: `GET /v1/sessions/list` 只读 `[读]` | EE:device-management | `page.account.sessions.pagination` `page.account.tokens.empty` | `DeviceManagementTable.tsx:59` `[读]` |
| `account.gap.sessions.retry` | 设备列表加载失败后重试 | Manage_Devices → 查询 error → `Retry` | EE；`isError` `[读]` | 界面: `[待渲染实测]` `Something_went_wrong` / `We_Could_not_retrive_any_data` ／ 导航: 仍在页 `[读]` ／ 持久化: `refetch` `GET /v1/sessions/list` `[读]` | EE:device-management | `page.account.tokens.retry` | `DeviceManagementTable.tsx:41-54` `[读]` |

本表 NEW **12**（PR #12 canonical）。计数：`rg -c '^\| `account\.gap\.' docs/qa/pm-feature-atlas/14-account-gaps.md`。

---

## 3b. PR #16 unique（`acct.gap.*`）

只并入 [PR #16](https://github.com/jianwyao01/Rocket.Chat/pull/16) 里、PR #12 **没有**的 id：`e2e.save-modal.*`、`e2e.reset.2fa`、`tokens.*.2fa`。其余 PR #16 行（`totp.backup-copy`、`e2e.enter.*`、`sessions.*`）与 canonical `account.gap.*` 同控件，不复行。

PR #12 §2 曾把 `SaveE2EPasswordModal` 标成「别的入口、本册不新建」。本合并按任务把该模态 3 行 + Reset 2FA + PAT 三次 2FA 挑战收进来。

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `acct.gap.e2e.save-modal.copy` | 复制系统刚生成的 E2E 口令 | **不在** Account Security 页。加密房 `SAVE_PASSWORD` 或顶栏钥匙 banner `Click_here_to_view_and_save_your_new_E2EE_password` → 模态 `Save_your_new_E2EE_password` → `Copy` | 本地存有 `E2EE_RANDOM_PASSWORD` `[读]` | 界面: `[待渲染实测]` 按钮变 `Copied`；`CodeSnippet` 显示 randomPassword ／ 导航: 模态仍开 `[读]` ／ 持久化: **无 HTTP**；剪贴板 `[读]` | core | `page.account.security.e2e-passphrase` | `SaveE2EPasswordModal.tsx:18-52` `rocketchat.e2e.ts:324-342,403-413` `[读]` |
| `acct.gap.e2e.save-modal.confirm` | 确认已保存生成的 E2E 口令 | 同上模态 → `I_Saved_My_Password` | 同上 | 界面: `[待渲染实测]` toast `E2E_encryption_enabled`，banner 关 ／ 导航: 回当前房/页 `[读]` ／ 持久化: 删 `E2EE_RANDOM_PASSWORD`，状态 `READY`；无 REST `[读]` | core | `acct.gap.e2e.save-modal.copy` | `SaveE2EPasswordModal.tsx:29` `rocketchat.e2e.ts:334-340` `[读]` |
| `acct.gap.e2e.save-modal.later` | 推迟保存生成的 E2E 口令 | 同上模态 → `Do_It_Later` | 同上 | 界面: `[待渲染实测]` 模态关，banner 可仍在 `[读]` ／ 导航: 回前页 `[读]` ／ 持久化: 口令仍在 local storage `[读]` | core | `acct.gap.e2e.save-modal.copy` | `SaveE2EPasswordModal.tsx:28` `rocketchat.e2e.ts:330-332` `[读]` |
| `acct.gap.e2e.reset.2fa` | 重置 E2E 前通过 REST 2FA 挑战 | 账号侧栏 `Security` → `Reset_E2EE_password`（或 Forgot 确认）→ `TwoFactorModal` 填码 | `E2E_Enable`；`users.resetE2EKey` `twoFactorRequired: true` `disableRememberMe` `[读]` | 界面: `[待渲染实测]` 2FA 模态；通过后才 reset ／ 导航: 成功后 `logout()` `[读]` ／ 持久化: 挑战过 → `POST /v1/users.resetE2EKey` `[读]` | core | `page.account.security.e2e-reset` `route.2fa` | `users.ts:1767-1771` `process2faReturn.ts:125-141` `ResetPassphrase.tsx:8-17` `[读]` |
| `acct.gap.tokens.add.2fa` | 创建 PAT 前通过 2FA 挑战 | 账号侧栏 `Personal_Access_Tokens` → 填名 → `Add` → `TwoFactorModal` | `create-personal-access-tokens`；`users.generatePersonalAccessToken` `twoFactorRequired: true` `[读]` | 界面: `[待渲染实测]` 2FA 模态；通过后才出 Generated 模态 ／ 导航: 仍在 tokens `[读]` ／ 持久化: 挑战过 → `POST /v1/users.generatePersonalAccessToken` `[读]` | core | `page.account.tokens.add` | `users.ts:1278-1281` `AddToken.tsx:42-45` `process2faReturn.ts` `[读]` |
| `acct.gap.tokens.regenerate.2fa` | 再生 PAT 前通过 2FA 挑战 | 行 `Refresh` → 警告确认 → `TwoFactorModal` | 同上；`users.regeneratePersonalAccessToken` `twoFactorRequired` `[读]` | 界面: `[待渲染实测]` 2FA 后 Generated 模态出新 token ／ 导航: 仍在页 `[读]` ／ 持久化: `POST /v1/users.regeneratePersonalAccessToken` `[读]` | core | `page.account.tokens.regenerate` | `users.ts:1297-1300` `AccountTokensTable.tsx:66-71` `[读]` |
| `acct.gap.tokens.remove.2fa` | 撤销 PAT 前通过 2FA 挑战 | 行 `Remove` → danger 确认 → `TwoFactorModal` | 同上；`users.removePersonalAccessToken` `twoFactorRequired` `[读]` | 界面: `[待渲染实测]` 2FA 后 toast `Token_has_been_removed` ／ 导航: 仍在页 `[读]` ／ 持久化: `POST /v1/users.removePersonalAccessToken` `[读]` | core | `page.account.tokens.remove` | `users.ts:1371-1374` `AccountTokensTable.tsx:103-107` `[读]` |

本表 unique **7**。计数：`rg -c '^\| `acct\.gap\.' docs/qa/pm-feature-atlas/14-account-gaps.md`。

---

## 4. 已覆盖对照（读过的每一条 07 `page.account.*`）

下面 **121** 个 07 id 都对过源码。`对照完整` = 页上控件与 07 行一一对应，本册不另建。`对照+本册 NEW` = 主控件在 07，本册只补漏掉的校验/模态子控件。

### 4.1 B1 Profile（28）— 主控件对照完整；缺 3 条校验

`page.account.profile.avatar.upload` `avatar.url` `avatar.add-url` `avatar.reset` `avatar.suggest` `name` `name.required` `username` `username.invalid` `username.taken` `status-type` `status-text` `status-duration` `status-custom-date` `status-custom-time` `status-visibility` `nickname` `bio` `email` `email.invalid` `resend-verification` `custom-fields` `cancel` `save` `logout-others` `delete` `delete.invalid-password` `delete.last-owner`

- 头像 5 + 名/用户名 + 状态 6 + 昵称/简介/邮箱/重发/自定义字段 + cancel/save + logout-others + delete 族 = 07 自称 24 主控件 + 6 校验/二次，对得上 `AccountProfileForm.tsx` + `AccountProfilePage.tsx` + `UserAvatarEditor.tsx`。
- **本册 NEW：** `username.required` `email.required` `delete.confirm.required`。
- Gravater 不另建（见 §2）。

### 4.2 B2 Preferences（38）— **对照完整**

`language` `dont-ask-again` `auto-away` `idle-time` `desktop-permission` `desktop-require-interaction` `desktop-default` `desktop-voice` `push-default` `email-mode` `login-email` `calendar-notify` `mobile-ringing` `unread-alert` `threads-in-main` `thread-to-channel` `link-clock` `use-emojis` `ascii-emoji` `auto-images` `mobile-bandwidth` `collapse-media` `link-usernames` `link-roles` `hide-flextab` `display-avatars` `send-on-enter` `highlights` `master-volume` `notification-volume` `ringer-volume` `new-room-sound` `new-message-sound` `mute-focused` `download-my-data` `export-my-data` `cancel` `save`

`name=` 可保存 30 个（07 已列）全部有行：

`language` `dontAskAgainList` `enableAutoAway` `idleTimeLimit` `desktopNotificationRequireInteraction` `desktopNotifications` `desktopNotificationVoiceCalls` `pushNotifications` `emailNotificationMode` `receiveLoginDetectionEmail` `notifyCalendarEvents` `enableMobileRinging` `unreadAlert` `showThreadsInMainChannel` `alsoSendThreadToChannel` `useEmojis` `convertAsciiEmoji` `autoImageLoad` `saveMobileBandwidth` `collapseMediaByDefault` `hideFlexTab` `displayAvatars` `sendOnEnter` `highlights` `masterVolume` `notificationsSoundVolume` `voipRingerVolume` `newRoomNotification` `newMessageNotification` `muteFocusedConversations`。

另：桌面权限钮 1 + FieldLink 3 + My Data 2 + cancel/save 2 = 8；`30+8=38`。无 NEW。

### 4.3 B3 Security（14）— 页内主控件对照完整；缺备份码 Copy + Enter 模态内部

`password` `password-confirm` `password.cancel` `password.save` `totp.toggle` `totp.secret` `totp.verify` `totp.regenerate` `email-2fa` `e2e-passphrase` `e2e-passphrase-confirm` `e2e-enter-current` `e2e-save` `e2e-reset`

- 改密 / TOTP 开关键+密钥+Verify+Regenerate / 邮件 2FA / E2E 设+确认+链+段内 Save+页内 Reset 都在。
- **本册 NEW：** `totp.backup-copy` + Enter 模态 5 行 + Forgot 确认 1 行。
- 无 Security 页登出其他会话。无页内 E2E Copy。无独立 View/Download 备份码。

### 4.4 B4 Accessibility（14）— **对照完整**

`link-statement` `link-glossary` `link-docs` `theme.light` `theme.dark` `theme.high-contrast` `theme.auto` `font-size` `mentions-symbol` `clock-mode` `show-usernames` `show-roles` `cancel` `save`

主题 4 + 字号 1 + mentions/clock/usernames/roles + 3 外链 + cancel/save。无 motion 可补。无 NEW。

### 4.5 B5 Feature preview（5）— **对照完整**

`empty` `secondary-sidebar` `ai-search` `cancel` `save`

`defaultFeaturesPreview` 只有这 2 个 toggle。无第三条。无 NEW。

### 4.6 B6 Integrations（2）— **对照完整（账号页）**

`select` `remove`

账号页无 Add。无 NEW。

### 4.7 B7 Tokens（9）— 表单对照完整；缺三次 mutation 的 2FA 挑战

`name` `name.required` `bypass-2fa` `add` `regenerate` `remove` `pagination` `empty` `retry`

create / show-once（捆在 add+regenerate 后果）/ regenerate / delete 齐。**本册 unique（PR #16）：** `acct.gap.tokens.add.2fa` `regenerate.2fa` `remove.2fa`。

### 4.8 B8 Sessions（5）— 表头/分页/登出对照完整；缺空态与重试

`sort.client` `sort.os` `sort.login-at` `pagination` `logout`

Device_ID 列只读、不可点（`DeviceManagementAccountTable.tsx:51`），07 不拆与 Directory `col.belongs-to` 同策略，本册也不拆。**本册 NEW：** `sessions.empty` `sessions.retry`。

### 4.9 B9 Account Omnichannel（5）— **对照完整**

`hide-after-close` `transcript-pdf` `transcript-email` `cancel` `save`

无 NEW。

### 4.10 F Keyboard（1）— **对照完整（只显示）**

`page.account.keyboard.display`

9 条文案 id 不新建：`openKeyboardShortcuts` `openSearch` `markAllAsRead` `editPreviousMessage` `moveToBeginningHorizontal` `moveToBeginningVertical` `moveToEndHorizontal` `moveToEndVertical` `newLine`。绑定见 03 `shortcut.*`。无 NEW。

---

## 5. 04 `account.*` 入口对照（9）

04 只写「打开页」。07 已炸内部。本册不改这些 id。

| 04 id | 路由 | 侧栏 | 07 内部 | 本册 |
| --- | --- | --- | --- | --- |
| `account.profile` | `/account/profile` `routes.tsx:57-59` | `sidebarItems.tsx:13-17` | B1 28 | +3 NEW 校验 |
| `account.preferences` | `/account/preferences` `:52-54` | `:19-22` | B2 38 | 完整 |
| `account.security` | `/account/security` `:62-64` | `:24-31` | B3 14 | +7 NEW（Copy+Enter 模态） |
| `account.integrations` | `/account/integrations` `:67-69` | `:33-37` | B6 2 | 完整；Add 不存在于本页 |
| `account.tokens` | `/account/tokens` `:72-74` | `:39-43` | B7 9 | +3 unique 2FA 挑战 |
| `account.omnichannel` | `/account/omnichannel` `:77-79` | `:45-49` | B9 5 | 完整 |
| `account.feature-preview` | `/account/feature-preview` `:82-84` | `:51-56` | B5 5 | 完整 |
| `account.accessibility-and-appearance` | `/account/accessibility-and-appearance` `:87-89` | `:58-61` | B4 14 | 完整 |
| `account.manage-devices` | `/account/manage-devices` `deviceManagement.ts:15-18` | `:22-26` | B8 5 | +2 NEW 空态/重试 |

`/account` index → replace `/account/profile`（`AccountRouter.tsx:18-24`）。不是第三入口，不建 id。

侧栏 9 项（8 静态 + EE）全部对应上表。键盘 **不在** 侧栏：`nav.user.keyboard` + `page.account.keyboard.display`。

---

## 6. 每页控件清单（核对用）

### `/account/profile` — `AccountProfilePage` + `AccountProfileForm` + `UserAvatarEditor`

Upload / reset / suggestions / URL text + Add_URL；Name；Username；Status 点 + 文案 + duration + custom date/time；statusVisibilityDenied 多选；Nickname；Bio；Email + Resend；CustomFieldsForm；Logout_Others；Delete_my_account（密码/用户名 + Cancel/Delete_account + last-owner）；Cancel；Save_changes。

### `/account/preferences` — 一手风琴 + 页脚

Localization `language`；Global `dontAskAgainList`；Presence `enableAutoAway` `idleTimeLimit`；Notifications 权限钮 + 8 个条件字段；Messages 11 个开关/select + 3 FieldLink；Highlights textarea；Sound 6 个；My Data 2 钮 + 模态；Cancel；Save。

### `/account/security` — `AccountSecurityPage`

Password 新手风琴：New_password / Confirm / PasswordVerifier / 页脚 Cancel+Save。2FA：TOTP 开关 + QR/TextCopy/Verify + Backup 文案/Regenerate + Email 开关。E2E：New/Confirm/段内 Save + Reset 钮 + 未解码 hint 链 → Enter 模态。`require2faSetup` Callout 只读，不建 id。

### `/account/accessibility-and-appearance`

3 外链；4 theme radio；fontSize；mentionsWithSymbol；clockMode；hideUsernames（UI Show）；hideRoles（条件）；Cancel；Save。

### `/account/feature-preview`

空态 或 2 switch（id=`secondarySidebar` / `aiSearch`）+ Cancel/Save。打开若 unseen 先 `setPreferences` 记已读（07 已写，不是第三开关）。

### `/account/integrations`

Select + Remove。无 Add。

### `/account/tokens`

Name + 2FA select + Add；行 Refresh/Remove；分页；空态；Retry。生成模态只展示一次。

### `/account/manage-devices`（EE）

表头 Client/OS/Last_login 排序；只读 Device_ID；行 Logout（含 current）；分页；空态；Retry。

### `/account/omnichannel`

hide-after-close；transcript PDF/Email；Cancel；Save。

### 键盘说明（非 `/account/*` 路由）

用户菜单或 `Shift+?` → 只读 9 条 + Close。

---

## 7. 计数 + 验算

### 07 `page.account.*` 表体（本册读过、不改）

| 组 | 07 自称（表体） | 验算（排除 H 节 `page.account.*.*` 汇总行） |
| --- | --- | --- |
| profile | 28 | `rg -c '^\| `page\.account\.profile\.[^`*]+`' …/07-page-interiors.md` → 28 |
| preferences | 38 | `page.account.preferences.[^`*]+` → 38 |
| security | 14 | `page.account.security.[^`*]+` → 14 |
| accessibility | 14 | `page.account.accessibility.[^`*]+` → 14 |
| feature-preview | 5 | `page.account.feature-preview.[^`*]+` → 5 |
| integrations | 2 | `page.account.integrations.[^`*]+` → 2 |
| tokens | 9 | `page.account.tokens.[^`*]+` → 9 |
| sessions | 5 | `page.account.sessions.[^`*]+` → 5 |
| omnichannel | 5 | `page.account.omnichannel.[^`*]+` → 5 |
| keyboard | 1 | `page.account.keyboard.[^`*]+` → 1 |
| **合计** | **121** | `28+38=66`；`66+14=80`；`80+14=94`；`94+5=99`；`99+2=101`；`101+9=110`；`110+5=115`；`115+5=120`；`120+1=121` |

总命令（与 07 README 同一过滤）：`rg -c '^\| `page\.account\.[^`*]+\`' docs/qa/pm-feature-atlas/07-page-interiors.md` → **121**。

裸 `^\| \`page.account.` 会把 H 验算表 10 条 `page.account.*.*` 算进去 → 131；**不要用裸命令当表体数**（07 自称 623 也因此写成「裸会把验算表算进去」）。

### 04 `account.*` 入口

`rg -c '^\| `account\.' docs/qa/pm-feature-atlas/04-routes-and-shell.md` → 9。与 §5 表 9 行一致。

### 本册 NEW

| 组 | NEW |
| --- | --- |
| profile 校验（PR #12） | 3 |
| security 备份码 Copy + E2E enter/forgot（PR #12） | 7 |
| sessions 空态/重试（PR #12） | 2 |
| E2E save-modal + reset 2FA + PAT 2FA（PR #16 unique） | 7 |
| **合计** | **19** |

`3+7=10`；`10+2=12`；`12+7=19`。

命令：`rg -c '^\| `account\.gap\.' docs/qa/pm-feature-atlas/14-account-gaps.md` → 12。

`rg -c '^\| `acct\.gap\.' docs/qa/pm-feature-atlas/14-account-gaps.md` → 7。

`12+7=19`。去重：两前缀合计 `sort -u` → 19。

### 与现行 atlas 的 id 碰撞

`account.gap.*` 前缀 01–11 / 07 `page.account.*` / 04 `account.*` 均未用。本册 **不改** 任何已有 id。精确碰撞目标 0。

### 路由登记 vs 侧栏

`registerAccountRoute`：preferences profile security integrations tokens omnichannel feature-preview accessibility-and-appearance = **8**（`routes.tsx:52-90`）。EE +1 manage-devices = **9**。侧栏静态 8 + EE 1 = **9**。无未炸侧栏项。

---

## 8. 哪些 07 行组可以当「完整」用

抽测时这些组 **不必再补 id**（本册无 NEW，且源码无额外可操作控件）：

- **B2 Preferences 38**（含全部 `name=`、clock 跳转、通知通道、声音）
- **B4 Accessibility 14**（4 主题 + 字号 + 其余 layout；无 motion）
- **B5 Feature preview 5**（仅 secondarySidebar / aiSearch）
- **B6 Integrations 2**（账号页只有选+删）
- **B7 Tokens 9**（create / show-once / regenerate / delete）
- **B9 Omnichannel 5**
- **F Keyboard 1**（只显示；绑定在 03）

仍要带上本册 NEW 才能称「账号操作完备」的组：

- **B1 Profile** + `account.gap.profile.username.required` `email.required` `delete.confirm.required`
- **B3 Security** + `totp.backup-copy` + 5 条 enter + `e2e-forgot` `e2e-forgot-confirm` + `acct.gap.e2e.save-modal.*` + `acct.gap.e2e.reset.2fa`
- **B7 Tokens** + `acct.gap.tokens.*.2fa`
- **B8 Sessions** + `sessions.empty` `sessions.retry`

---

## 9. 诚实标记 / 不做

`[读]` 源码推断。`[待渲染实测]` 未挂真实 UI。不改 07/04 原文。不把 composer WebDAV Add 写成账号页控件。`SaveE2EPasswordModal` 三行按 PR #16 unique 收在 §3b（不在 `/account/security` DOM，但仍是账号安全链）。不把 03 的 9 条 shortcut 绑定再写一遍。
