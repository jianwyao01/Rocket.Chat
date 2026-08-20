# 分册 14 — Account 缺口猎捕

本册只回答一件事：账号域（Account 侧栏 + 顶栏用户菜单 Account 项 + 由账号安全页打开的 E2E/2FA 模态）里，用户能点的控件是否已经有稳定 id。07 已写成独立行的 **不重写**，只列在「确认已覆盖」。没有 id 的才给 `acct.gap.*`。不改产品代码。未开浏览器；界面可见性与 accessible name 标 `[待渲染实测]`；源码读到的 i18n / 权限 / 设置 / endpoint 标 `[读]`。

**基线：** `cursor/pm-atlas-merge-06-11-f8ed`（已含 00–11）。  
**NEW 命名空间：** `acct.gap.*`（仅本册新增）。禁止复用 `page.account.*` / `account.*` / `nav.user.account.*`。  
**入口缩写：** `顶栏头像` = 用户菜单；`账号侧栏` = `/account` 左侧 `AccountSidebar`。

## 列约定

与 07 相同 8 列：稳定语义 id / 功能一句话 / 完整入口点击序列 / 门控 / 触发后果三件套 / 供给 / 关联 / 出处。

---

## 1. 04 / 07 / 02 既有 id dump

命令：`rg -o '^\| `?(page\.account\.|account\.|nav\.user\.account\.)[^`| ]+' docs/qa/pm-feature-atlas/{02,04,07}-*.md`。下表是 **去重后的稳定 id**（07 末尾验算表的 `page.account.profile.*` 通配行不算独立功能 id）。

### 1.1 `nav.user.account.*`（02，4）

`nav.user.account.profile`  
`nav.user.account.preferences`  
`nav.user.account.accessibility`  
`nav.user.account.feature-preview`

顶栏用户菜单 **只直达这 4 项**。Security / Integrations / Tokens / Omnichannel / Manage Devices 不在用户菜单，只走账号侧栏。`useAccountItems.tsx:41-61` `[读]`。

### 1.2 `account.*`（04，9）

`account.profile`  
`account.preferences`  
`account.security`  
`account.integrations`  
`account.tokens`  
`account.omnichannel`  
`account.feature-preview`  
`account.accessibility-and-appearance`  
`account.manage-devices`

这 9 个是 **打开页** 入口，不是页内控件。侧栏注册：`sidebarItems.tsx` 8 项 + EE `startup/deviceManagement.ts` 的 `Manage_Devices`。没有第 10 个 AccountSidebar 项。

### 1.3 `page.account.*`（07 表体叶 id，121）

**profile 28：**  
`page.account.profile.avatar.upload` `page.account.profile.avatar.url` `page.account.profile.avatar.add-url` `page.account.profile.avatar.reset` `page.account.profile.avatar.suggest` `page.account.profile.name` `page.account.profile.name.required` `page.account.profile.username` `page.account.profile.username.invalid` `page.account.profile.username.taken` `page.account.profile.status-type` `page.account.profile.status-text` `page.account.profile.status-duration` `page.account.profile.status-custom-date` `page.account.profile.status-custom-time` `page.account.profile.status-visibility` `page.account.profile.nickname` `page.account.profile.bio` `page.account.profile.email` `page.account.profile.email.invalid` `page.account.profile.resend-verification` `page.account.profile.custom-fields` `page.account.profile.cancel` `page.account.profile.save` `page.account.profile.logout-others` `page.account.profile.delete` `page.account.profile.delete.invalid-password` `page.account.profile.delete.last-owner`

**preferences 38：**  
`page.account.preferences.language` `page.account.preferences.dont-ask-again` `page.account.preferences.auto-away` `page.account.preferences.idle-time` `page.account.preferences.desktop-permission` `page.account.preferences.desktop-require-interaction` `page.account.preferences.desktop-default` `page.account.preferences.desktop-voice` `page.account.preferences.push-default` `page.account.preferences.email-mode` `page.account.preferences.login-email` `page.account.preferences.calendar-notify` `page.account.preferences.mobile-ringing` `page.account.preferences.unread-alert` `page.account.preferences.threads-in-main` `page.account.preferences.thread-to-channel` `page.account.preferences.link-clock` `page.account.preferences.use-emojis` `page.account.preferences.ascii-emoji` `page.account.preferences.auto-images` `page.account.preferences.mobile-bandwidth` `page.account.preferences.collapse-media` `page.account.preferences.link-usernames` `page.account.preferences.link-roles` `page.account.preferences.hide-flextab` `page.account.preferences.display-avatars` `page.account.preferences.send-on-enter` `page.account.preferences.highlights` `page.account.preferences.master-volume` `page.account.preferences.notification-volume` `page.account.preferences.ringer-volume` `page.account.preferences.new-room-sound` `page.account.preferences.new-message-sound` `page.account.preferences.mute-focused` `page.account.preferences.download-my-data` `page.account.preferences.export-my-data` `page.account.preferences.cancel` `page.account.preferences.save`

**security 14：**  
`page.account.security.password` `page.account.security.password-confirm` `page.account.security.password.cancel` `page.account.security.password.save` `page.account.security.totp.toggle` `page.account.security.totp.secret` `page.account.security.totp.verify` `page.account.security.totp.regenerate` `page.account.security.email-2fa` `page.account.security.e2e-passphrase` `page.account.security.e2e-passphrase-confirm` `page.account.security.e2e-enter-current` `page.account.security.e2e-save` `page.account.security.e2e-reset`

**accessibility 14：**  
`page.account.accessibility.link-statement` `page.account.accessibility.link-glossary` `page.account.accessibility.link-docs` `page.account.accessibility.theme.light` `page.account.accessibility.theme.dark` `page.account.accessibility.theme.high-contrast` `page.account.accessibility.theme.auto` `page.account.accessibility.font-size` `page.account.accessibility.mentions-symbol` `page.account.accessibility.clock-mode` `page.account.accessibility.show-usernames` `page.account.accessibility.show-roles` `page.account.accessibility.cancel` `page.account.accessibility.save`

**feature-preview 5：**  
`page.account.feature-preview.empty` `page.account.feature-preview.secondary-sidebar` `page.account.feature-preview.ai-search` `page.account.feature-preview.cancel` `page.account.feature-preview.save`

**integrations 2：**  
`page.account.integrations.select` `page.account.integrations.remove`

**tokens 9：**  
`page.account.tokens.name` `page.account.tokens.name.required` `page.account.tokens.bypass-2fa` `page.account.tokens.add` `page.account.tokens.regenerate` `page.account.tokens.remove` `page.account.tokens.pagination` `page.account.tokens.empty` `page.account.tokens.retry`

**sessions 5：**  
`page.account.sessions.sort.client` `page.account.sessions.sort.os` `page.account.sessions.sort.login-at` `page.account.sessions.pagination` `page.account.sessions.logout`

**omnichannel 5：**  
`page.account.omnichannel.hide-after-close` `page.account.omnichannel.transcript-pdf` `page.account.omnichannel.transcript-email` `page.account.omnichannel.cancel` `page.account.omnichannel.save`

**keyboard 1（账号菜单旁路，不是 AccountSidebar 页）：**  
`page.account.keyboard.display`

`28+38+14+14+5+2+9+5+5+1 = 121`。

---

## 2. 07 计数证明（Profile 28 / Preferences 30 / admin）

### 2.1 Profile 28 — **成立**

07 J 节写 `page.account.profile`（28）。表体 L133–160 正好 28 行。对照 `AccountProfileForm.tsx` + `UserAvatarEditor.tsx` + `AccountProfilePage.tsx`：

| 源码控件 | 07 id | 判定 |
|---|---|---|
| 上传本地图 | `page.account.profile.avatar.upload` | 已覆盖 |
| 头像 URL 输入 | `page.account.profile.avatar.url` | 已覆盖 |
| Add URL / Enter | `page.account.profile.avatar.add-url` | 已覆盖 |
| 重置默认头像 | `page.account.profile.avatar.reset` | 已覆盖 |
| OAuth 建议头像 | `page.account.profile.avatar.suggest` | 已覆盖 |
| Name | `page.account.profile.name` + `.required` | 已覆盖 |
| Username + 正则/占用 | `page.account.profile.username` + `.invalid` + `.taken` | 已覆盖 |
| 状态点 / 文案 / 时长 / 自定义日期时间 / 可见性 | `status-type` `status-text` `status-duration` `status-custom-date` `status-custom-time` `status-visibility` | 已覆盖 |
| Nickname / Bio | `page.account.profile.nickname` `page.account.profile.bio` | 已覆盖 |
| Email + 非法 + 重发验证 | `email` `email.invalid` `resend-verification` | 已覆盖 |
| CustomFieldsForm | `page.account.profile.custom-fields` | 已覆盖（运行时字段集不拆） |
| Cancel / Save | `cancel` `save` | 已覆盖 |
| Logout_Others | `page.account.profile.logout-others` | 已覆盖 |
| Delete_my_account + 错密 + 末位房主 | `delete` `delete.invalid-password` `delete.last-owner` | 已覆盖 |
| **Gravatar 按钮** | — | **absent-in-product**（全 client 无 `gravatar`/`Gravatar` 符号） |

RHF `name=`：`avatar` `name` `username` `statusText` `statusType` `statusDuration` `statusCustomDate` `statusCustomTime` `statusVisibilityDenied` `nickname` `bio` `email` + `CustomFieldsForm`。与 07 字段行一一对应。

### 2.2 Preferences 30 `name=` — **成立**

07 B2 写「Controller name = **30**」。源码 `name=`（Preferences*Section，排除 Icon `name=`）：

1. `language` 2. `dontAskAgainList` 3. `enableAutoAway` 4. `idleTimeLimit` 5. `desktopNotificationRequireInteraction` 6. `desktopNotifications` 7. `desktopNotificationVoiceCalls` 8. `pushNotifications` 9. `emailNotificationMode` 10. `receiveLoginDetectionEmail` 11. `notifyCalendarEvents` 12. `enableMobileRinging` 13. `unreadAlert` 14. `showThreadsInMainChannel` 15. `alsoSendThreadToChannel` 16. `useEmojis` 17. `convertAsciiEmoji` 18. `autoImageLoad` 19. `saveMobileBandwidth` 20. `collapseMediaByDefault` 21. `hideFlexTab` 22. `displayAvatars` 23. `sendOnEnter` 24. `highlights` 25. `masterVolume` 26. `notificationsSoundVolume` 27. `voipRingerVolume` 28. `newRoomNotification` 29. `newMessageNotification` 30. `muteFocusedConversations`

**没有第 31 个 `name=`。** 07 另有 8 个非 `name=` 行（桌面权限按钮、3 条 FieldLink、My Data×2、cancel/save）→ 表体 38。手风琴分区：Localization / Global / User_Presence / Notifications / Messages / Highlights / Sound / 条件 My Data。全部 `name=` 已有 `page.account.preferences.*`。

### 2.3 Admin 页 — **07 已写，本册不补**

07 声称并把 Admin 22 个侧栏页炸开为 `page.admin.*`（workspace / subscription / engagement / moderation / rooms / users / ai-center / invites / user-status / permissions / abac / devices / email-inbox / mailer / oauth-apps / integrations / import / reports / sounds / emoji / feature-preview / settings）。那是管理壳，不是 Account。本册不重写、不另开 `acct.gap.admin.*`。

---

## 3. 确认已覆盖

07 已有独立行的控件，**不重写**。按用户点名清单对照：

### Profile（必须项）

| 控件 | 已有 id |
|---|---|
| 显示名 | `page.account.profile.name` |
| 用户名 | `page.account.profile.username` |
| 邮箱 | `page.account.profile.email` |
| 重发验证邮件 | `page.account.profile.resend-verification` |
| 简介 | `page.account.profile.bio` |
| 昵称 | `page.account.profile.nickname` |
| 自定义字段 | `page.account.profile.custom-fields` |
| 头像上传 | `page.account.profile.avatar.upload` |
| 头像重置 | `page.account.profile.avatar.reset` |
| 头像 URL | `page.account.profile.avatar.url` + `page.account.profile.avatar.add-url` |
| 登出其他客户端 | `page.account.profile.logout-others` |
| 删号 + 确认 | `page.account.profile.delete`（错密/末位房主变体已有） |

### Preferences（每个 `name=`）

| `name=` | 已有 id |
|---|---|
| `language` | `page.account.preferences.language` |
| `dontAskAgainList` | `page.account.preferences.dont-ask-again` |
| `enableAutoAway` | `page.account.preferences.auto-away` |
| `idleTimeLimit` | `page.account.preferences.idle-time` |
| `desktopNotificationRequireInteraction` | `page.account.preferences.desktop-require-interaction` |
| `desktopNotifications` | `page.account.preferences.desktop-default` |
| `desktopNotificationVoiceCalls` | `page.account.preferences.desktop-voice` |
| `pushNotifications` | `page.account.preferences.push-default` |
| `emailNotificationMode` | `page.account.preferences.email-mode` |
| `receiveLoginDetectionEmail` | `page.account.preferences.login-email` |
| `notifyCalendarEvents` | `page.account.preferences.calendar-notify` |
| `enableMobileRinging` | `page.account.preferences.mobile-ringing` |
| `unreadAlert` | `page.account.preferences.unread-alert` |
| `showThreadsInMainChannel` | `page.account.preferences.threads-in-main` |
| `alsoSendThreadToChannel` | `page.account.preferences.thread-to-channel` |
| `useEmojis` | `page.account.preferences.use-emojis` |
| `convertAsciiEmoji` | `page.account.preferences.ascii-emoji` |
| `autoImageLoad` | `page.account.preferences.auto-images` |
| `saveMobileBandwidth` | `page.account.preferences.mobile-bandwidth` |
| `collapseMediaByDefault` | `page.account.preferences.collapse-media` |
| `hideFlexTab` | `page.account.preferences.hide-flextab` |
| `displayAvatars` | `page.account.preferences.display-avatars` |
| `sendOnEnter` | `page.account.preferences.send-on-enter` |
| `highlights` | `page.account.preferences.highlights` |
| `masterVolume` | `page.account.preferences.master-volume` |
| `notificationsSoundVolume` | `page.account.preferences.notification-volume` |
| `voipRingerVolume` | `page.account.preferences.ringer-volume` |
| `newRoomNotification` | `page.account.preferences.new-room-sound` |
| `newMessageNotification` | `page.account.preferences.new-message-sound` |
| `muteFocusedConversations` | `page.account.preferences.mute-focused` |

另：桌面通知权限/试听 `page.account.preferences.desktop-permission`；导出 `download-my-data` / `export-my-data`；三条跳外观 FieldLink；cancel/save。

### Security（必须项里 07 已有的）

| 控件 | 已有 id |
|---|---|
| 改密（新密 + 确认 + 页脚 Save/Cancel） | `page.account.security.password` `password-confirm` `password.cancel` `password.save` |
| 开/关 TOTP | `page.account.security.totp.toggle` |
| 复制 TOTP 密钥 | `page.account.security.totp.secret` |
| 用应用码完成启用（随后弹出备份码模态） | `page.account.security.totp.verify` |
| 重新生成备份码 | `page.account.security.totp.regenerate` |
| 邮件 2FA 开/关 | `page.account.security.email-2fa` |
| 输入/确认新 E2E 口令 + 段内保存 | `page.account.security.e2e-passphrase` `e2e-passphrase-confirm` `e2e-save` |
| 先输入当前口令（hint 链） | `page.account.security.e2e-enter-current` |
| 重置 E2E 并登出账号 | `page.account.security.e2e-reset` |

### Accessibility（必须项里 07 已有的）

| 控件 | 已有 id |
|---|---|
| 浅/深/高对比/跟随系统 | `page.account.accessibility.theme.light` `.dark` `.high-contrast` `.auto` |
| 字号（Small/Default/Medium/Large/Extra large 同一 select） | `page.account.accessibility.font-size` |
| @ 提及符号 / 时间格式 / 用户名 / 角色 | `mentions-symbol` `clock-mode` `show-usernames` `show-roles` |
| 三条外链 + cancel/save | `link-statement` `link-glossary` `link-docs` `cancel` `save` |

### Feature preview

| 控件 | 已有 id |
|---|---|
| `secondarySidebar` | `page.account.feature-preview.secondary-sidebar` |
| `aiSearch` | `page.account.feature-preview.ai-search` |
| 空态 / cancel / save | `empty` `cancel` `save` |

`defaultFeaturesPreview` 只有这 2 个（`useFeaturePreviewList.ts:21-38`）。没有第三个预览开关。

### Integrations / Tokens / Sessions / Omnichannel / 侧栏

| 控件 | 已有 id |
|---|---|
| WebDAV 选择 / 移除 | `page.account.integrations.select` `page.account.integrations.remove` |
| PAT 名 / 必填 / 绕过 2FA 选项 / Add / 再生 / 撤销 / 分页 / 空 / 重试 | `page.account.tokens.*`（9） |
| 会话排序×3 / 分页 / 行 Logout | `page.account.sessions.*`（5） |
| 坐席三偏好 + cancel/save | `page.account.omnichannel.*`（5） |
| 打开各账号页 | 04 `account.*` + 02 `nav.user.account.*` |

---

## 4. 每页源码控件清单（对照用）

打开的路由组件：`account/routes.tsx` 8 条 + EE `registerAccountRoute('/manage-devices')`。侧栏：`sidebarItems.tsx` 8 + `deviceManagement.ts` 1。

| 页 | 用户可操作控件 | 07 是否已有独立 id |
|---|---|---|
| Profile | 头像 5 + 名/用户名/状态族/昵称/bio/邮箱/重发/自定义字段/cancel/save/logout-others/delete 族 | 是（28） |
| Preferences | 30 个 `name=` + 桌面权限 + 3 FieldLink + My Data×2 + cancel/save | 是（38） |
| Security 页内 | 改密 4 + TOTP toggle/secret/verify/regenerate + email-2fa + E2E 口令 5 | 是（14） |
| Security → BackupCodesModal | **Copy** 备份码 | **否 → NEW** |
| Security → EnterE2EPasswordModal | 口令框 / Enable_encryption / Do_It_Later / Forgot / 二次 Reset | 07 只写了打开链 `e2e-enter-current` → **NEW 拆模态内** |
| 全局 SaveE2EPasswordModal | Copy / I_Saved_My_Password / Do_It_Later | 不在 `/account/security` DOM；用户点名「copy」→ **NEW** |
| Reset E2E 的 REST 2FA 挑战 | `users.resetE2EKey` `twoFactorRequired` | 07 `e2e-reset` 未写挑战框 → **NEW** |
| Accessibility | 4 theme radio + font + 4 布局 + 3 外链 + cancel/save | 是。**无 motion / reduced-motion 控件** |
| Feature preview | 2 switch + empty + cancel/save | 是。无其它 preview |
| Integrations | select + Remove。**页内无 Add** | 是。Add 在 composer（已有 `composer.action.webdav-add`） |
| Tokens | 名/bypass/Add/再生/撤销/分页/空/重试 | 是。**三次 mutation 的 2FA 挑战未拆** → **NEW** |
| Sessions | 排序×3 / 分页 / Logout | 是。**空态 / Retry 未拆**（tokens 有，sessions 无）→ **NEW** |
| Omnichannel | 3 switch + cancel/save | 是 |
| AccountSidebar 项 | 9（含 EE devices） | 04 入口全有 |
| 顶栏 Account 项 | 4 | 02 全有 |
| 侧栏 Header 关闭 | 通用 `Sidebar.Header onClose` | 不单开（壳层，非账号业务） |

---

## 5. NEW 行（`acct.gap.*`）

只写 07 没有独立 id、且源码里存在的用户可操作控件。

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
|---|---|---|---|---|---|---|---|
| `acct.gap.totp.backup-copy` | 把刚展示的 TOTP 备份码复制到剪贴板 | 账号侧栏 `Security` → 启用 TOTP 并 `Verify`，或已启用后 `Regenerate_codes` → 模态 `Backup_codes` → `Copy` | TOTP 已启用或刚 verify；模态由 `page.account.security.totp.verify` / `.regenerate` 打开 `[读]` | 界面: `[待渲染实测]` 按钮文案变 `Copied`，`CodeSnippet` 展示空格拼接的 codes ／ 导航: 模态仍开 `[读]` ／ 持久化: **无 HTTP**；`useClipboard` 本地剪贴板 `[读]` | core | `page.account.security.totp.verify` `page.account.security.totp.regenerate` | `BackupCodesModal.tsx:16-25` `[读]` |
| `acct.gap.e2e.enter.password` | 在「输入当前 E2E 口令」模态里填写口令 | 账号侧栏 `Security` → E2E 段 hint「enter your current E2EE password」（`page.account.security.e2e-enter-current`）→ 模态 `Enter_E2E_password` → `Please_enter_E2EE_password` | `E2E_Enable`；本地密钥未 READY（`keysExist=false`）`[读]` | 界面: `[待渲染实测]` PasswordInput；空提交 `Invalid_pass`；错口令 `Incorrect_encryption_password` ／ 导航: 模态仍开 `[读]` ／ 持久化: 仅本地，确认才 `keychain.decryptKey` `[读]` | core | `page.account.security.e2e-enter-current` | `EnterE2EPasswordModal.tsx:86-100` `rocketchat.e2e.ts:586-609` `[读]` |
| `acct.gap.e2e.enter.enable` | 用当前口令解开私钥并启用加密 | 同上模态 → `Enable_encryption` | 口令非空 `[读]` | 界面: `[待渲染实测]` 成功 toast `E2E_encryption_enabled`，模态关；失败见上 ／ 导航: 仍在 security `[读]` ／ 持久化: 本地导入私钥，状态 `READY`；**无** reset REST `[读]` | core | `acct.gap.e2e.enter.password` | `EnterE2EPasswordModal.tsx:72-80` `rocketchat.e2e.ts:593-604` `[读]` |
| `acct.gap.e2e.enter.later` | 推迟输入当前 E2E 口令 | 同上模态 → `Do_It_Later` | 无 | 界面: `[待渲染实测]` 模态关 ／ 导航: 仍在 security；E2E 仍未 READY `[读]` ／ 持久化: 无 `[读]` | core | `acct.gap.e2e.enter.enable` | `EnterE2EPasswordModal.tsx:77` `[读]` |
| `acct.gap.e2e.enter.forgot` | 从输入口令模态改走「忘记口令」 | 同上模态 → 链 `Forgot_E2EE_Password` | 无 | 界面: `[待渲染实测]` 换成 warning 模态 `Reset_E2EE_password` ／ 导航: 仍叠在 security `[读]` ／ 持久化: 尚未 POST `[读]` | core | `page.account.security.e2e-reset` | `EnterE2EPasswordModal.tsx:107-117` `[读]` |
| `acct.gap.e2e.enter.reset-confirm` | 在忘记口令确认框里真正重置 | Forgot 后 → `Reset_E2EE_password` | 同 `users.resetE2EKey`（见下一行 2FA）`[读]` | 界面: `[待渲染实测]` toast `E2EE_password_reset` ／ 导航: `logout()` `[读]` ／ 持久化: `POST /v1/users.resetE2EKey` `{}` `[读]` | core | `page.account.security.e2e-reset` `acct.gap.e2e.reset.2fa` | `EnterE2EPasswordModal.tsx:55-68` `useResetE2EPasswordMutation.ts:10-17` `[读]` |
| `acct.gap.e2e.save-modal.copy` | 复制系统刚生成的 E2E 口令 | **不在** Account Security 页。加密房 `SAVE_PASSWORD` 或顶栏钥匙 banner `Click_here_to_view_and_save_your_new_E2EE_password` → 模态 `Save_your_new_E2EE_password` → `Copy` | 本地存有 `E2EE_RANDOM_PASSWORD` `[读]` | 界面: `[待渲染实测]` 按钮变 `Copied`；`CodeSnippet` 显示 randomPassword ／ 导航: 模态仍开 `[读]` ／ 持久化: **无 HTTP**；剪贴板 `[读]` | core | `page.account.security.e2e-passphrase` | `SaveE2EPasswordModal.tsx:18-52` `rocketchat.e2e.ts:324-342,403-413` `[读]` |
| `acct.gap.e2e.save-modal.confirm` | 确认已保存生成的 E2E 口令 | 同上模态 → `I_Saved_My_Password` | 同上 | 界面: `[待渲染实测]` toast `E2E_encryption_enabled`，banner 关 ／ 导航: 回当前房/页 `[读]` ／ 持久化: 删 `E2EE_RANDOM_PASSWORD`，状态 `READY`；无 REST `[读]` | core | `acct.gap.e2e.save-modal.copy` | `SaveE2EPasswordModal.tsx:29` `rocketchat.e2e.ts:334-340` `[读]` |
| `acct.gap.e2e.save-modal.later` | 推迟保存生成的 E2E 口令 | 同上模态 → `Do_It_Later` | 同上 | 界面: `[待渲染实测]` 模态关，banner 可仍在 `[读]` ／ 导航: 回前页 `[读]` ／ 持久化: 口令仍在 local storage `[读]` | core | `acct.gap.e2e.save-modal.copy` | `SaveE2EPasswordModal.tsx:28` `rocketchat.e2e.ts:330-332` `[读]` |
| `acct.gap.e2e.reset.2fa` | 重置 E2E 前通过 REST 2FA 挑战 | 账号侧栏 `Security` → `Reset_E2EE_password`（或 Forgot 确认）→ `TwoFactorModal` 填码 | `E2E_Enable`；`users.resetE2EKey` `twoFactorRequired: true` `disableRememberMe` `[读]` | 界面: `[待渲染实测]` 2FA 模态；通过后才 reset ／ 导航: 成功后 `logout()` `[读]` ／ 持久化: 挑战过 → `POST /v1/users.resetE2EKey` `[读]` | core | `page.account.security.e2e-reset` `route.2fa` | `users.ts:1767-1771` `process2faReturn.ts:125-141` `ResetPassphrase.tsx:8-17` `[读]` |
| `acct.gap.sessions.empty` | 无登录设备时看空态 | 账号侧栏 `Manage_Devices` → 列表 `sessions.length===0` | EE `device-management`；`GET /v1/sessions/list` 成功且空 `[读]` | 界面: `[待渲染实测]` `GenericNoResults` ／ 导航: 仍在 `/account/manage-devices` `[读]` ／ 持久化: 只读 `[读]` | EE:device-management | `account.manage-devices` `page.account.tokens.empty` | `DeviceManagementTable.tsx:59` `[读]` |
| `acct.gap.sessions.retry` | 设备列表加载失败后重试 | Manage_Devices 查询 error → `Retry` | 同上；`isError` `[读]` | 界面: `[待渲染实测]` States `Something_went_wrong` / `We_Could_not_retrive_any_data` ／ 导航: 仍在页 `[读]` ／ 持久化: `refetch` `GET /v1/sessions/list` `[读]` | EE:device-management | `page.account.tokens.retry` | `DeviceManagementTable.tsx:41-54` `[读]` |
| `acct.gap.tokens.add.2fa` | 创建 PAT 前通过 2FA 挑战 | 账号侧栏 `Personal_Access_Tokens` → 填名 → `Add` → `TwoFactorModal` | `create-personal-access-tokens`；`users.generatePersonalAccessToken` `twoFactorRequired: true` `[读]` | 界面: `[待渲染实测]` 2FA 模态；通过后才出 Generated 模态 ／ 导航: 仍在 tokens `[读]` ／ 持久化: 挑战过 → `POST /v1/users.generatePersonalAccessToken` `[读]` | core | `page.account.tokens.add` | `users.ts:1278-1281` `AddToken.tsx:42-45` `process2faReturn.ts` `[读]` |
| `acct.gap.tokens.regenerate.2fa` | 再生 PAT 前通过 2FA 挑战 | 行 `Refresh` → 警告确认 → `TwoFactorModal` | 同上；`users.regeneratePersonalAccessToken` `twoFactorRequired` `[读]` | 界面: `[待渲染实测]` 2FA 后 Generated 模态出新 token ／ 导航: 仍在页 `[读]` ／ 持久化: `POST /v1/users.regeneratePersonalAccessToken` `[读]` | core | `page.account.tokens.regenerate` | `users.ts:1297-1300` `AccountTokensTable.tsx:66-71` `[读]` |
| `acct.gap.tokens.remove.2fa` | 撤销 PAT 前通过 2FA 挑战 | 行 `Remove` → danger 确认 → `TwoFactorModal` | 同上；`users.removePersonalAccessToken` `twoFactorRequired` `[读]` | 界面: `[待渲染实测]` 2FA 后 toast `Token_has_been_removed` ／ 导航: 仍在页 `[读]` ／ 持久化: `POST /v1/users.removePersonalAccessToken` `[读]` | core | `page.account.tokens.remove` | `users.ts:1371-1374` `AccountTokensTable.tsx:103-107` `[读]` |

**NEW 15。** 不把 PasswordInput 内建显隐、手风琴展开、只读「剩余 n 条备份码」文案、Feature preview 打开时自动 mark-seen、Account 侧栏关闭做成独立 id。

---

## 6. 覆盖矩阵

列：账号控件 → 已有 id / 新 id / absent-in-product。

| 账号控件 | 判定 | id |
|---|---|---|
| Profile 显示名 | 已有 | `page.account.profile.name` |
| Profile 用户名 | 已有 | `page.account.profile.username` |
| Profile 邮箱 | 已有 | `page.account.profile.email` |
| Profile 邮箱重验证 | 已有 | `page.account.profile.resend-verification` |
| Profile 简介 | 已有 | `page.account.profile.bio` |
| Profile 昵称 | 已有 | `page.account.profile.nickname` |
| Profile 自定义字段 | 已有 | `page.account.profile.custom-fields` |
| 头像上传 | 已有 | `page.account.profile.avatar.upload` |
| 头像重置 | 已有 | `page.account.profile.avatar.reset` |
| 头像 URL | 已有 | `page.account.profile.avatar.url` / `.add-url` |
| 头像 Gravatar 专用钮 | **absent-in-product** | —（无符号；用户可把 Gravatar URL 填进 URL 框，仍走 `avatar.url`） |
| 登出其他客户端 | 已有 | `page.account.profile.logout-others` |
| 删号 + 确认 | 已有 | `page.account.profile.delete` |
| Preferences 全部 30 个 `name=` | 已有 | 见 §3 表；无漏 `name=` |
| 改密 | 已有 | `page.account.security.password` + confirm/save/cancel |
| TOTP 开/关 | 已有 | `page.account.security.totp.toggle` |
| 备份码「查看」独立按钮 | **absent-in-product** | 无 View；只在 verify/regenerate 后弹模态（入口已有） |
| 备份码复制 | **NEW** | `acct.gap.totp.backup-copy` |
| 备份码重新生成 | 已有 | `page.account.security.totp.regenerate` |
| 邮件 2FA 开/关 | 已有 | `page.account.security.email-2fa` |
| E2E 口令输入（页内新口令） | 已有 | `page.account.security.e2e-passphrase` |
| E2E 当前口令（hint → 模态） | 已有打开链 + **NEW 模态内** | `page.account.security.e2e-enter-current`；`acct.gap.e2e.enter.*` |
| E2E 口令重置 | 已有 | `page.account.security.e2e-reset` |
| E2E 口令复制 | **NEW**（不在 Account 页 DOM） | `acct.gap.e2e.save-modal.copy` |
| E2E 保存确认 / 稍后 | **NEW** | `acct.gap.e2e.save-modal.confirm` `acct.gap.e2e.save-modal.later` |
| 「登出加密」独立按钮（不停账号） | **absent-in-product** | 无。`e2e.stopClient` 只挂在账号 `onLogout`。重置口令会 `logout()` 整账号，走 `page.account.security.e2e-reset` |
| 重置 E2E 的 2FA 挑战 | **NEW** | `acct.gap.e2e.reset.2fa` |
| 主题 light/dark/high-contrast/auto | 已有 | `page.account.accessibility.theme.*` |
| 字号 | 已有 | `page.account.accessibility.font-size` |
| Motion / reduced-motion 开关 | **absent-in-product** | Accessibility 页无此控件（`rg` 无 `reducedMotion`/`prefersReducedMotion`） |
| Feature `secondarySidebar` | 已有 | `page.account.feature-preview.secondary-sidebar` |
| Feature `aiSearch` | 已有 | `page.account.feature-preview.ai-search` |
| 其它 feature preview toggle | **absent-in-product** | `FeaturesAvailable` 只有这两个 |
| WebDAV 添加 | 已有（**非 Account 页**） | `composer.action.webdav-add` / `composer.state.webdav.add`；Account Integrations **无** Add |
| WebDAV 移除 | 已有 | `page.account.integrations.remove` |
| PAT 创建（含 2FA 选项） | 已有表单 | `page.account.tokens.name` `bypass-2fa` `add` |
| PAT 创建时的 2FA 挑战 | **NEW** | `acct.gap.tokens.add.2fa` |
| PAT 列表 | 已有（表+分页+空） | `page.account.tokens.pagination` `empty` |
| PAT 再生 / 撤销 | 已有按钮 | `page.account.tokens.regenerate` `remove` |
| PAT 再生/撤销的 2FA 挑战 | **NEW** | `acct.gap.tokens.regenerate.2fa` `acct.gap.tokens.remove.2fa` |
| 登录设备列表 | 已有（表+排序+分页） | `page.account.sessions.sort.*` `pagination` |
| 登录设备撤销 | 已有 | `page.account.sessions.logout` |
| 设备空态 / 失败重试 | **NEW** | `acct.gap.sessions.empty` `acct.gap.sessions.retry` |
| AccountSidebar 额外项 | 无漏项 | 9 项均有 04 `account.*` |
| 顶栏 Account 额外项 | 无漏项 | 4 项均有 02 `nav.user.account.*` |

---

## 7. 摘要

| 项 | 数 |
|---|---|
| 02 `nav.user.account.*` dump | 4 |
| 04 `account.*` dump | 9 |
| 07 `page.account.*` 叶 id | 121 |
| 07 Profile 28 | **证明成立**（表体 28；源码无第 29 个 Gravater 控件） |
| 07 Preferences 30 `name=` | **证明成立**（源码恰好 30；表体另加 8 个非 name 行 = 38） |
| 07 Admin 页 | **证明已写**（`page.admin.*`，本册不补） |
| **NEW `acct.gap.*`** | **15** |
| absent-in-product（点名项） | Gravater 专用钮；独立「查看备份码」；独立「登出加密」；motion 开关；第 3 个 feature preview；Account 页内 WebDAV Add |

NEW id 清单：

`acct.gap.totp.backup-copy`  
`acct.gap.e2e.enter.password`  
`acct.gap.e2e.enter.enable`  
`acct.gap.e2e.enter.later`  
`acct.gap.e2e.enter.forgot`  
`acct.gap.e2e.enter.reset-confirm`  
`acct.gap.e2e.save-modal.copy`  
`acct.gap.e2e.save-modal.confirm`  
`acct.gap.e2e.save-modal.later`  
`acct.gap.e2e.reset.2fa`  
`acct.gap.sessions.empty`  
`acct.gap.sessions.retry`  
`acct.gap.tokens.add.2fa`  
`acct.gap.tokens.regenerate.2fa`  
`acct.gap.tokens.remove.2fa`

机械碰撞：`acct.gap.*` 与现行 `page.*` `account.*` `nav.*` `composer.*` 前缀不交。相对 07 全部 NEW。
