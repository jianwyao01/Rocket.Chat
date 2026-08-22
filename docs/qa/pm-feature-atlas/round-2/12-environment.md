# Round 2 / Vol.12 — 浏览器环境 API 调用点闭集

冻结树 **`e519470d35b6caf5b228d81aef41c86aab3051f4`**（短 SHA `e519470`）。只调查 **CLIENT 对浏览器环境 API 的调用点**。不扫 `develop`。无 live 实例：表体一律 **`[读]`**，不发明 `[实测]`。

本卷是 **闭集库存**（与 vol 6 / 7 同类），不是 live behavior。一行一个调用点。id = `env.<族>.<slug>`。

## 1. 方法

- **CLIENT 树（本树存在）**：`apps/meteor/client`、`apps/meteor/app`（排除 `**/server/**`）、`packages/ui-client`、`ui-contexts`、`web-ui-registration`、`ui-voip`、`ui-video-conf`、`fuselage-ui-kit`、`livechat`、`favicon`、`gazzodown`、`desktop-api`。
- **排除目录/后缀**：`**/tests/**`、`**/server/**`、`*.spec.*`、`*.test.*`、`*.stories.*`、`*.d.ts`、`node_modules`、`dist`。另排除 `apps/uikit-playground`（开发玩具，不是 RC 产品客户端）与 `ee/apps/ddp-streamer`（服务端注释）。
- **闭集定义 = 8 族 API 调用点**（字面量 / 本树能唯一展开的包装调用，见各表 rg）：
  1. **Notification** — `new Notification` / `Notification.requestPermission` / `Notification.permission`
  2. **favicon** — `manageFavicon(` / `updateFavicon(` / `setFavicon(` / `setAttribute('href'`（仅 `packages/favicon` 写 href）
  3. **document.title** — **写** `document.title =`（读不进闭集）
  4. **Audio** — 构造 `new Audio` / `new AudioContext`
  5. **clipboard** — `navigator.clipboard.` / `useClipboard(` / `useClipboardWithToast(`（排除函数签名）
  6. **download** — `download(` / `downloadAs(` / `downloadJsonAs(` / `downloadCsvAs(` / `.download =` / `download={title}`
  7. **deep link** — `rocketchat://` / `buildDeepLinkURL(` / `useSearchParameter('msg')` / `setMessageJumpQueryStringParameter(` / `` `?msg=${ `` / `path: '/invite/:hash'`（排除 import 与 `export const` 定义行）
  8. **localStorage / sessionStorage** — 字面量 `localStorage`/`sessionStorage` 的 get/set/remove/clear、`Object.keys(localStorage)`、`window.localStorage`/`window.sessionStorage` 绑定。排除注释、`localStorageKey` 属性名、`.d.ts`
- **8 列**：稳定语义 id / 族 / API / 功能一句话 / 触发入口 / 效果 / 关联 / 出处 `file:line`。
- 诚实标记：每行 `[读]`。

## 2. 算术

| 族 | 行数 | 命令标签 |
| --- | --- | --- |
| Notification | **6** | A |
| favicon | **4** | B |
| document.title 写 | **1** | C |
| Audio | **6** | D |
| clipboard | **16** | E |
| download | **12** | F |
| deep link | **20** | G |
| localStorage/sessionStorage | **28** | H |
| **合计** | **93** | |

等式：**`6 + 4 + 1 + 6 + 16 + 12 + 20 + 28 = 93`**。

表体 `^\| \`env\.` 行数必须 = 93；唯一 id 必须 = 93。数字对不上 = 拒收。

---

## 3. 表 A. Notification（6）

rg A：`new Notification\b|Notification\.requestPermission|Notification\.permission`

| 稳定语义 id | 族 | API | 功能一句话 | 触发入口 | 效果 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `env.notification.useNotification` | Notification | `new Notification` | 桌面消息通知（标题/正文/头像；点击跳房间 `jump=msgId`） | 后台收到桌面通知流；Preferences→Send test 也走同一 notify | 系统通知气泡；onclick focus+router | `env.notification.useNotificationAllowed`；`env.deeplink.useTryToJumpToMessage.msg` | `apps/meteor/client/hooks/notification/useNotification.ts:35` [读] |
| `env.notification.useNotificationAllowed` | Notification | `Notification.permission` | 订阅 notificationManager 时回写是否 granted | boot / 权限 change 事件 | `allowed===false` 则 `useNotification` 直接 return | `env.notification.useNotificationPermission` | `apps/meteor/client/hooks/notification/useNotificationAllowed.ts:10` [读] |
| `env.notification.PreferencesNotificationsSection.permission` | Notification | `Notification.permission` | Preferences 通知页挂载时读当前权限 | 头像→My Account→Preferences→Notifications | 决定「请求权限 / 测试通知」按钮态 | `env.notification.PreferencesNotificationsSection.request` | `apps/meteor/client/views/account/preferences/PreferencesNotificationsSection.tsx:48` [读] |
| `env.notification.PreferencesNotificationsSection.request` | Notification | `Notification.requestPermission` | Preferences 点按钮向浏览器要桌面通知权 | 同上页→Ask / Enable | 浏览器权限条；then 更新本地 permission state | `env.notification.useNotificationPermission` | `apps/meteor/client/views/account/preferences/PreferencesNotificationsSection.tsx:62` [读] |
| `env.notification.useNotificationUserCalendar` | Notification | `new Notification` | Outlook 日历事件桌面通知 | 用户开了 Outlook 日历且非 busy；`notify-user/calendar` | 气泡；onclick 打开 OutlookCalendarEventModal | `env.notification.useNotification` | `apps/meteor/client/views/root/hooks/loggedIn/useNotificationUserCalendar.ts:34` [读] |
| `env.notification.useNotificationPermission` | Notification | `Notification.requestPermission` | 登录后主动请求权限并监听 `permissions.notifications` | MainLayout logged-in boot | 写 `notificationManager.allowed` 并发 `change` | `env.notification.useNotificationAllowed` | `apps/meteor/client/views/root/hooks/useNotificationPermission.ts:7` [读] |

本表 **6**。`navigator.permissions.query({ name: 'notifications' })`（同文件 :11）是 Permissions API，不进本族。

## 4. 表 B. favicon（4）

rg B：`manageFavicon\(|updateFavicon\(|setFavicon\(|setAttribute\('href'`（产品树 + `packages/favicon`）

| 稳定语义 id | 族 | API | 功能一句话 | 触发入口 | 效果 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `env.favicon.manageFavicon` | favicon | `manageFavicon()` | 构造 tab 图标角标管理器 | logged-in `useUnread` 模块初始化 | 返回 `updateFavicon` | `env.favicon.updateFavicon`；`env.favicon.setAttribute.href` | `apps/meteor/client/views/root/hooks/loggedIn/useUnread.ts:9` [读] |
| `env.favicon.updateFavicon` | favicon | `updateFavicon(unread)` | 未读数/• 画到 favicon 角标 | 订阅 unread 变化（session `unread`） | tab 图标出现数字或点 | `env.title.DocumentTitleWrapper` | `apps/meteor/client/views/root/hooks/loggedIn/useUnread.ts:67` [读] |
| `env.favicon.setFavicon` | favicon | `RocketChatDesktop.setFavicon` | 桌面壳换工作区 favicon 资源 | Assets `favicon` URL 变化 | 仅 Desktop 壳；Web 无操作 | `env.favicon.setAttribute.href` | `apps/meteor/client/views/root/hooks/useDesktopFavicon.ts:17` [读] |
| `env.favicon.setAttribute.href` | favicon | `link.setAttribute('href')` | 把 canvas 角标 PNG 写回 `<link rel=icon>` | `manageFavicon` 收到 badge | 浏览器 tab 图标替换 | `env.favicon.manageFavicon` | `packages/favicon/src/index.ts:71` [读] |

本表 **4**。`packages/desktop-api` 的 `setFavicon:` 是类型，不进。`AppRoot` 的 `favicon_512.png` og/twitter meta 是静态资源，不是 API。

## 5. 表 C. document.title 写（1）

rg C：`document\.title\s*=`

| 稳定语义 id | 族 | API | 功能一句话 | 触发入口 | 效果 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `env.title.DocumentTitleWrapper` | document.title | `document.title =` | 把 `useDocumentTitle` 拼好的（未读 + Site_Name + 页标题）写到标签页 | 路由/未读变化 | 浏览器标签文案变 | `env.favicon.updateFavicon`；`useDocumentTitle`（不写 title） | `apps/meteor/client/views/root/DocumentTitleWrapper.tsx:38` [读] |

本表 **1**。读点（不进）：`router/page.ts:29`、`useAnalytics.ts:96`、`packages/livechat/src/widget.ts:275,694`（widget 同步宿主 title，不写 `document.title`）。`useDocumentTitle` 只维护内存 Set，真正写入只有这一行。

## 6. 表 D. Audio 构造（6）

rg D：`new Audio\b|new AudioContext\b`

| 稳定语义 id | 族 | API | 功能一句话 | 触发入口 | 效果 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `env.audio.CustomSoundProvider` | Audio | `new Audio(src)` | 播放自定义/默认通知与铃声 | 新消息/新房间/VoIP ringer/dialer；Admin Sounds | `<audio>` 播 src；loop/volume 按偏好 | 通知偏好 `newMessageNotification` | `apps/meteor/client/providers/CustomSoundProvider/CustomSoundProvider.tsx:59` [读] |
| `env.audio.isSetSinkIdAvailable` | Audio | `new Audio()` | 探测 `HTMLAudioElement.setSinkId` 是否存在 | DeviceProvider 初始化 | 决定输出设备选择器能否用 | DeviceProvider `setSinkId` | `apps/meteor/client/providers/DeviceProvider/lib/isSetSinkIdAvailable.tsx:2` [读] |
| `env.audio.AudioRecorder` | Audio | `new AudioContext()` | 语音消息录音图图/编码 | composer 麦克风录音 | WebAudio 采集 | MediaRecorder 上传 | `apps/meteor/app/ui/client/lib/recorderjs/AudioRecorder.ts:20` [读] |
| `env.audio.useMediaSessionInstance` | Audio | `new AudioContext()` | VoIP 无麦时造假 MediaStream | 媒体通话 micless | 静音占位流，避免中断 | `env.storage.voip.sessionStorage.getItem` | `packages/ui-voip/src/providers/useMediaSessionInstance.ts:45` [读] |
| `env.audio.useTonePlayer.context` | Audio | `new AudioContext()` | DTMF 拨号音上下文 | 拨号盘按键 | 振荡器出声 | `env.audio.useTonePlayer.element` | `packages/ui-voip/src/hooks/useTonePlayer.ts:15` [读] |
| `env.audio.useTonePlayer.element` | Audio | `new Audio()` | DTMF 输出元素（可 setSinkId） | 同上 | 听筒/扬声器出 DTMF | `env.audio.isSetSinkIdAvailable` | `packages/ui-voip/src/hooks/useTonePlayer.ts:16` [读] |

本表 **6**。HTML `<audio>`（livechat `Sound`、`AudioAttachment`）是 markup，不进构造闭集。`HTMLAudioElement` 类型注解不进。

## 7. 表 E. clipboard（16）

rg E：`navigator\.clipboard\.|useClipboard\(|useClipboardWithToast\(`，排除 `function useClipboardWithToast(`。

| 稳定语义 id | 族 | API | 功能一句话 | 触发入口 | 效果 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `env.clipboard.useClipboardWithToast` | clipboard | `useClipboard(` | 包装 fuselage `useClipboard`，成功/失败 toast | 被下面 8 个 `useClipboardWithToast(` 调用 | 写剪贴板 + toast | 各 `env.clipboard.*Toast` 行 | `apps/meteor/client/hooks/useClipboardWithToast.ts:10` [读] |
| `env.clipboard.TextCopy` | clipboard | `useClipboardWithToast(` | 通用文本复制按钮 | 账户 Security→TOTP secret（`<TextCopy>`） | 复制密钥；Copied toast | `TwoFactorTOTP.tsx` | `apps/meteor/client/components/TextCopy.tsx:29` [读] |
| `env.clipboard.useCopyAction` | clipboard | `navigator.clipboard.writeText` | 消息 More→Copy text | 消息工具栏 Copy_text | 复制消息正文；Copied toast | `env.clipboard.usePermalinkAction` | `apps/meteor/client/components/message/toolbar/useCopyAction.ts:33` [读] |
| `env.clipboard.usePermalinkAction` | clipboard | `navigator.clipboard.writeText` | 消息 More→Copy link | 消息工具栏 Copy_link（非 E2E/非 ABAC） | 复制 `roomURL?msg=`；Copied toast | `env.deeplink.getPermaLink` | `apps/meteor/client/components/message/toolbar/usePermalinkAction.ts:40` [读] |
| `env.clipboard.SaveE2EPasswordModal` | clipboard | `useClipboard(` | 复制随机 E2E 密码 | E2E 保存密码弹窗 Copy | 复制 randomPassword | `env.storage` E2EE_RANDOM_PASSWORD 键 | `apps/meteor/client/views/e2e/SaveE2EPasswordModal.tsx:20` [读] |
| `env.clipboard.BackupCodesModal` | clipboard | `useClipboard(` | 复制 2FA 备用码清单 | Security→2FA→Backup codes Copy | 复制多行 codes | `env.clipboard.TextCopy` | `apps/meteor/client/views/account/security/BackupCodesModal.tsx:16` [读] |
| `env.clipboard.IncomingWebhookForm.url` | clipboard | `useClipboardWithToast(` | 复制 Incoming webhook URL | Admin→Integrations→Incoming→Webhook URL | 复制 url | 同表 token/curl | `apps/meteor/client/views/admin/integrations/incoming/IncomingWebhookForm.tsx:60` [读] |
| `env.clipboard.IncomingWebhookForm.token` | clipboard | `useClipboardWithToast(` | 复制 Incoming token | 同上 Token | 复制 `id/token` | 同表 url/curl | `apps/meteor/client/views/admin/integrations/incoming/IncomingWebhookForm.tsx:61` [读] |
| `env.clipboard.IncomingWebhookForm.curl` | clipboard | `useClipboardWithToast(` | 复制 curl 示例 | 同上 curl | 复制 curlData | 同表 url/token | `apps/meteor/client/views/admin/integrations/incoming/IncomingWebhookForm.tsx:62` [读] |
| `env.clipboard.PlanCard.siteURL` | clipboard | `useClipboardWithToast(` | 复制订阅页 Site URL | Admin→Subscription→Plan 卡 | 复制 siteURL | 同表 hashed | `apps/meteor/client/views/admin/subscription/components/cards/PlanCard/PlanCardLicenseDetails.tsx:20` [读] |
| `env.clipboard.PlanCard.hashed` | clipboard | `useClipboardWithToast(` | 复制 hashed Site URL | 同上 | 复制 hashedSiteURL | 同表 siteURL | `apps/meteor/client/views/admin/subscription/components/cards/PlanCard/PlanCardLicenseDetails.tsx:21` [读] |
| `env.clipboard.InviteLink` | clipboard | `useClipboardWithToast(` | 复制房间邀请链接 | 房间成员栏→Invite_Link | 复制 linkText | `env.deeplink.invite.route` | `apps/meteor/client/views/room/contextualBar/RoomMembers/InviteUsers/InviteLink.tsx:15` [读] |
| `env.clipboard.ForwardMessageModal` | clipboard | `useClipboard(` | 转发弹窗复制 permalink | 消息 More→Forward→Copy | 复制 permalink | `env.deeplink.getPermaLink` | `apps/meteor/client/views/room/modals/ForwardMessageModal/ForwardMessageModal.tsx:38` [读] |
| `env.clipboard.Installation` | clipboard | `useClipboard(` | 复制 Livechat 安装脚本 | Omni→Installation | 复制 installString | （无） | `apps/meteor/client/views/omnichannel/installation/Installation.tsx:23` [读] |
| `env.clipboard.ContactInfoPhone` | clipboard | `useClipboardWithToast(` | 复制联系人电话 | Omni 联系人详情电话行 Copy | 复制 phone | （无） | `apps/meteor/client/views/omnichannel/contactInfo/tabs/ContactInfoDetails/ContactInfoPhoneEntry.tsx:17` [读] |
| `env.clipboard.CodeBlock` | clipboard | `navigator.clipboard.writeText` | 代码块复制 | 消息里 fenced code→Copy | 复制 code | （无） | `packages/gazzodown/src/code/CodeBlock.tsx:78` [读] |

本表 **16**。`event.clipboardData` 粘贴（livechat Composer）是 paste，不是 write，不进。import 行不进。

## 8. 表 F. download（12）

rg F：`\bdownload(As|JsonAs|CsvAs)?\(|\.download\s*=|download=\{title\}`

| 稳定语义 id | 族 | API | 功能一句话 | 触发入口 | 效果 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `env.download.anchor.download` | download | `anchorElement.download =` | 通用下载：造 `<a download>` 并 click | 被 `download()` 调用 | 浏览器另存为 | `env.download.download.call` | `apps/meteor/client/lib/download.ts:3` [读] |
| `env.download.download.call` | download | `download(` | blob URL → `download()` | `downloadAs` 非 IE 路径 | 触发 :3 | `env.download.downloadAs.json`；`env.download.downloadAs.csv` | `apps/meteor/client/lib/download.ts:25` [读] |
| `env.download.downloadAs.json` | download | `downloadAs(` | JSON 序列化后走 blob 下载 | `downloadJsonAs` | 得到 `.json` | Workspace / Export JSON | `apps/meteor/client/lib/download.ts:31` [读] |
| `env.download.downloadAs.csv` | download | `downloadAs(` | CSV 序列化后走 blob 下载 | `downloadCsvAs` | 得到 `.csv` | `env.download.DownloadDataButton` | `apps/meteor/client/lib/download.ts:44` [读] |
| `env.download.useDownloadFromServiceWorker` | download | `downloadAs(` | SW 解密附件完成后落盘 | 加密附件点下载（SW 回 `attachment-download-result`） | blob 另存为 | `env.download.FileItemMenu.downloadAs` | `apps/meteor/client/hooks/useDownloadFromServiceWorker.ts:23` [读] |
| `env.download.WorkspaceRoute` | download | `downloadJsonAs(` | 下载工作区统计 JSON | Admin→Workspace→Download info | `statistics.json` | `view-statistics` | `apps/meteor/client/views/admin/workspace/WorkspaceRoute.tsx:34` [读] |
| `env.download.useDownloadExportMutation` | download | `downloadJsonAs(` | 导出选中消息为 JSON 文件 | 房间工具 Export_Messages→Download file | `exportedMessages-*.json` | `perm.mail-messages` | `apps/meteor/client/views/room/contextualBar/ExportMessages/useDownloadExportMutation.ts:60` [读] |
| `env.download.useExportMessagesAsPDFMutation` | download | `link.download =` | 导出选中消息为 PDF | Export_Messages→PDF（`export-messages-as-pdf`） | 点 `<a download>` 存 PDF | `perm.export-messages-as-pdf` | `apps/meteor/client/views/room/contextualBar/ExportMessages/useExportMessagesAsPDFMutation.tsx:171` [读] |
| `env.download.FileItemMenu.downloadAs` | download | `downloadAs(` | 房间文件栏：解密文件经 SW 后下载 | 房间 Files→菜单 Download（`/file-decrypt/`） | blob 另存为原名 | `env.download.useDownloadFromServiceWorker` | `apps/meteor/client/views/room/contextualBar/RoomFiles/components/FileItemMenu.tsx:44` [读] |
| `env.download.FileItemMenu.download` | download | `download(` | 房间文件栏：明文文件直接下载 | 同上菜单（非 decrypt 路径） | `download(href, name)` | `env.download.anchor.download` | `apps/meteor/client/views/room/contextualBar/RoomFiles/components/FileItemMenu.tsx:71` [读] |
| `env.download.DownloadDataButton` | download | `downloadCsvAs(` | 仪表盘表下载 CSV | Omni Analytics 等表头下载钮 | `{attachmentName}.csv` | `env.download.downloadAs.csv` | `apps/meteor/client/components/dashboards/DownloadDataButton.tsx:41` [读] |
| `env.download.AttachmentDownloadBase` | download | `download={title}` | 消息附件下载锚点（`href?download` + HTML download） | 消息附件云箭头 | 浏览器按 title 存文件 | `env.download.useDownloadFromServiceWorker`（加密） | `apps/meteor/client/components/message/content/attachments/structure/AttachmentDownloadBase.tsx:19` [读] |

本表 **12**。排除：`icon='download'`、`type === 'download'`、`id: 'download'`、`GenericFileAttachment` 的 `download={!!openDocumentViewer}`（预览 prop，不是 `download={title}`）、`createObjectURL` 预览、Preferences My Data 邮件导出（不是浏览器 download API）。

## 9. 表 G. deep link（20）

rg G（见 §11）：`rocketchat://` + `buildDeepLinkURL(` + `useSearchParameter('msg')` + `setMessageJumpQueryStringParameter(` + `` `?msg=${ `` + `path: '/invite/:hash'`；排除 `import` 与 `export const` 定义。

| 稳定语义 id | 族 | API | 功能一句话 | 触发入口 | 效果 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `env.deeplink.buildAuthDeeplinkURL` | deep link | `rocketchat://` | 拼桌面/移动 `rocketchat://auth?host&token&userId` | 被 3 个 loginClient 钩子调用 | 自定义协议 URL | 下 3 行 `buildDeepLinkURL(` | `apps/meteor/client/lib/buildAuthDeeplinkURL.ts:4` [读] |
| `env.deeplink.useOAuthLogin` | deep link | `buildDeepLinkURL(` | OAuth `loginCode` 兑 token 后跳桌面/移动壳 | URL `?loginCode=&loginClient=desktop\|mobile` | `window.location.href` 到协议 | `env.deeplink.buildAuthDeeplinkURL` | `apps/meteor/client/views/root/hooks/useOAuthLogin.ts:26` [读] |
| `env.deeplink.useLoginOtherClients` | deep link | `buildDeepLinkURL(` | 已有 resumeToken 时交给桌面/移动 | URL `?resumeToken=&userId=&loginClient=` | 赋 loginURL 后 `location.href` | 同上 | `apps/meteor/client/views/root/hooks/useLoginOtherClients.ts:21` [读] |
| `env.deeplink.useShareSessionWithOtherClients` | deep link | `buildDeepLinkURL(` | 已登录 Web 把当前 token 交给桌面/移动 | 已登录 + `loginClient=desktop\|mobile` 且无 resumeToken | 同上 | `readStoredLoginToken` | `apps/meteor/client/views/root/hooks/useShareSessionWithOtherClients.ts:32` [读] |
| `env.deeplink.getPermaLink` | deep link | `` `?msg=${ `` | 生成消息永久链接 `roomURL?msg=id` | Copy link / Forward / prependReplies / 审计打开 | 可粘贴的 HTTP 深链 | `env.clipboard.usePermalinkAction` | `apps/meteor/client/lib/getPermaLink.ts:37` [读] |
| `env.deeplink.SearchSourceResult` | deep link | `` `?msg=${ `` | 搜索结果行 href 带 `?msg=` | 全局搜索点一条消息 | 点进房间并跳该消息 | `env.deeplink.useTryToJumpToMessage.msg` | `apps/meteor/client/views/search/SearchSourceResult.tsx:49` [读] |
| `env.deeplink.NavBarSearchMessageRow` | deep link | `` `?msg=${ `` | 顶栏智能搜索消息行 href 带 `?msg=` | NavBar 搜索消息结果 | 同上 | 同上 | `apps/meteor/client/navbar/NavBarSearch/NavBarSearchMessageRow.tsx:29` [读] |
| `env.deeplink.invite.route` | deep link | `path: '/invite/:hash'` | 注册邀请深链路由 | 打开 `/invite/{hash}` | 进 InvitePage 验 token | `env.clipboard.InviteLink` | `apps/meteor/client/startup/routes.tsx:206` [读] |
| `env.deeplink.MessageList.msg` | deep link | `useSearchParameter('msg')` | 主列表读 `?msg=` 以配合 jump | 打开带 `?msg=` 的房间 URL | 驱动 surrounding / highlight | `env.deeplink.useTryToJumpToMessage.msg` | `apps/meteor/client/views/room/MessageList/MessageList.tsx:140` [读] |
| `env.deeplink.MessageListProvider.msg` | deep link | `useSearchParameter('msg')` | Provider 读 `?msg=` 供列表上下文 | 同上 | 列表数据/高亮入参 | 同上 | `apps/meteor/client/views/room/MessageList/providers/MessageListProvider.tsx:63` [读] |
| `env.deeplink.useTryToJumpToMessage.msg` | deep link | `useSearchParameter('msg')` | 主时间线滚动到 `?msg=`（非纯线程） | 打开 permalink / 通知 jump | virtualizer 滚到消息；跨房则 goToRoom | `env.deeplink.useTryToJumpToThreadMessage.msg` | `apps/meteor/client/views/room/MessageList/hooks/useTryToJumpToMessage.ts:24` [读] |
| `env.deeplink.useTryToJumpToMessage.clear` | deep link | `setMessageJumpQueryStringParameter(` | jump 完成后清掉 `?msg=` | 上一项成功滚动后 | URL 去掉 msg，避免反复跳 | 同上 | `apps/meteor/client/views/room/MessageList/hooks/useTryToJumpToMessage.ts:93` [读] |
| `env.deeplink.useTryToJumpToThreadMessage.msg` | deep link | `useSearchParameter('msg')` | 线程深链：`?msg=` 打开对应 thread tab | 线程消息 permalink | 路由 tab=thread&context=tmid | `env.deeplink.useLoadSurroundingMessages.msg` | `apps/meteor/client/views/room/MessageList/hooks/useTryToJumpToThreadMessage.ts:12` [读] |
| `env.deeplink.useLoadSurroundingMessages.msg` | deep link | `useSearchParameter('msg')` | `?msg=` 不在已加载窗口时拉 surrounding | 深链目标尚未在列表 | 调 RoomHistoryManager | `env.deeplink.useGetMore.msg` | `apps/meteor/client/views/room/MessageList/hooks/useLoadSurroundingMessages.ts:15` [读] |
| `env.deeplink.useGetMore.msg` | deep link | `useSearchParameter('msg')` | 有 `?msg=` 时改变向上加载策略 | 房间滚顶 | 避免 jump 期间错页 | 同上 | `apps/meteor/client/views/room/body/hooks/useGetMore.ts:11` [读] |
| `env.deeplink.ThreadMessageList.msg` | deep link | `useSearchParameter('msg')` | 线程列表读 `?msg=` | 线程栏打开且 URL 带 msg | 线程内滚动/高亮 | `env.deeplink.ThreadMessageList.clear` | `apps/meteor/client/views/room/contextualBar/Threads/components/ThreadMessageList.tsx:63` [读] |
| `env.deeplink.ThreadMessageList.clear` | deep link | `setMessageJumpQueryStringParameter(` | 线程内 jump 完成后清 `?msg=` | 上一项完成 | URL 去掉 msg | 同上 | `apps/meteor/client/views/room/contextualBar/Threads/components/ThreadMessageList.tsx:340` [读] |
| `env.deeplink.useUnreadMessages.jump` | deep link | `setMessageJumpQueryStringParameter(` | 未读条「跳到第一条未读」写成 `?msg=` | 房间未读条 Jump | URL 加 msg + jumpToUnread | `env.deeplink.useTryToJumpToMessage.msg` | `apps/meteor/client/views/room/body/hooks/useUnreadMessages.ts:75` [读] |
| `env.deeplink.JumpToMessageAction` | deep link | `setMessageJumpQueryStringParameter(` | 消息 More→Jump to message | 搜索/星标/钉选上下文 Jump | 写 `?msg=` 回主时间线 | 同上 | `apps/meteor/client/components/message/toolbar/items/actions/JumpToMessageAction.tsx:21` [读] |
| `env.deeplink.NowPlayingSection` | deep link | `setMessageJumpQueryStringParameter(` | Now Playing 点曲目跳到对应消息 | 侧栏 Now Playing 一行 | 进房并 `?msg=track.mid` | 同上 | `apps/meteor/client/sidebar/sections/NowPlayingSection.tsx:35` [读] |

本表 **20**。排除：`useGoToRoom`（应用内导航，不是深链 API）；`cloudDeepLinkUrl` / `getCloudUrl`（Cloud 控制台 URL 拼装，不是 `rocketchat://` 或 `?msg=`）；`extractOpenRoomParams`（房间路由，不是深链解析）；`routes.tsx:82` 的 TypeScript `pattern` 类型（不是 `path:` 注册）。

## 10. 表 H. localStorage / sessionStorage（28）

rg H：字面量 `(window.)?localStorage.(getItem|setItem|removeItem|clear)` / `sessionStorage.` 同 / `Object.keys(localStorage` / `window.localStorage` / `window.sessionStorage` / `const { sessionStorage } = window` / `const localStorage = getLocalStorage`。排除 `//` 注释行与 `localStorageKey` **仅属性名**（API 行里的 `this.localStorageKey` 仍算，因为同行有 `localStorage.getItem`）。

| 稳定语义 id | 族 | API | 功能一句话 | 触发入口 | 效果 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `env.storage.serviceWorker.getItem` | storage | `localStorage.getItem` | SW 重载节流：读上次 reload 时间 | `/enc.js` 已 active 但无 controller | 10s 窗口内不 reload | `env.storage.serviceWorker.setItem` | `apps/meteor/client/serviceWorker.ts:5` [读] |
| `env.storage.serviceWorker.setItem` | storage | `localStorage.setItem` | 记下本次 SW reload | 通过节流后 | 写 `sw_last_reload` 并 `location.reload` | 同上 | `apps/meteor/client/serviceWorker.ts:19` [读] |
| `env.storage.startup.loginToken` | storage | `localStorage.getItem` | boot 时若无 uid 且无 `Meteor.loginToken` 则清残键 | 模块初始化 | 调 `removeLocalUserData` | `env.storage.userData.clear` | `apps/meteor/client/startup/startup.ts:155` [读] |
| `env.storage.userData.clear` | storage | `localStorage.clear` | 登出/残会话：清空整个 localStorage | `removeLocalUserData()` | Users 集合空 + 存储清空 | 上一项；E2E 键一并没 | `apps/meteor/client/lib/userData.ts:177` [读] |
| `env.storage.purgeAllDrafts.keys` | storage | `Object.keys(localStorage)` | 枚举 `messagebox_*` 草稿键 | 登出 `purgeAllDrafts` | 交给 removeItem | `env.storage.useDraft.setItem` | `apps/meteor/client/views/root/hooks/purgeAllDrafts.ts:2` [读] |
| `env.storage.purgeAllDrafts.removeItem` | storage | `localStorage.removeItem` | 删除全部 composer 本地草稿 | 同上 | `messagebox_*` 消失 | 同上 | `apps/meteor/client/views/root/hooks/purgeAllDrafts.ts:4` [读] |
| `env.storage.useDraft.setItem` | storage | `localStorage.setItem` | 按房间/线程缓存 composer 草稿 | 输入时 `persistLocal` | 写 `messagebox_{rid}[-tmid]` | 服务端 `rooms.saveDraft` | `apps/meteor/client/views/room/composer/messageBox/hooks/useDraft.ts:11` [读] |
| `env.storage.useDraft.removeItem` | storage | `localStorage.removeItem` | 草稿空或已 flush 后删本地键 | 清空/flush | 去掉该草稿键 | 同上 | `apps/meteor/client/views/room/composer/messageBox/hooks/useDraft.ts:13` [读] |
| `env.storage.useDraft.getItem` | storage | `localStorage.getItem` | composer 初始值回填本地草稿 | 进房挂载 | 预填 textarea | 同上 | `apps/meteor/client/views/room/composer/messageBox/hooks/useDraft.ts:19` [读] |
| `env.storage.sdkTransportEnabled` | storage | `window.localStorage.getItem` | `rc-config-sdk_transport=on` 则走 SDK transport | boot `sdkTransportEnabled` | 改 DDP/REST 传输 | `env.storage.getConfig` | `apps/meteor/client/lib/sdk/sdkTransportEnabled.ts:22` [读] |
| `env.storage.meteorBackedSdk` | storage | `window.sessionStorage` / `window.localStorage` | 按 `ForgetUserSessionOnWindowClose` 把 Meteor._localStorage 指到 session 或 local | 登录 SDK 启动 | token 存活期随关标签变 | `set.Accounts_ForgetUserSessionOnWindowClose` | `apps/meteor/client/lib/sdk/meteorBackedSdk.ts:290` [读] |
| `env.storage.sdk.storage.backend` | storage | `window.sessionStorage` / `window.localStorage` | SDK 存储后端选择 | `getStorageForBackend` | 后续 get/set 走该 Storage | `getStoredItem` / `setStoredItem`（无字面量，不另列） | `apps/meteor/client/lib/sdk/storage.ts:25` [读] |
| `env.storage.getConfig` | storage | `window.localStorage.getItem` | `rc-config-*` 覆盖（URL 查询优先） | `getConfig(key)` | 读调试/实验开关 | `env.storage.sdkTransportEnabled` | `apps/meteor/client/lib/utils/getConfig.ts:3` [读] |
| `env.storage.oauth.getItem` | storage | `localStorage.getItem` | OAuth popup 回传 credential secret | OAuth 登录 popup 关 | 读 `Meteor.oauth.credentialSecret-*` | `env.storage.oauth.removeItem` | `apps/meteor/client/meteor/login/oauth.ts:29` [读] |
| `env.storage.oauth.removeItem` | storage | `localStorage.removeItem` | 读完即删 OAuth secret | 同上 | 一次性凭证 | 同上 | `apps/meteor/client/meteor/login/oauth.ts:30` [读] |
| `env.storage.voip.sessionStorage.exists.get` | storage | `window.sessionStorage` | 取旧媒体通话 sessionId 前探活 | 发起/恢复通话 | 无 sessionStorage 则放弃恢复 | 下一项 | `packages/ui-voip/src/providers/useMediaSessionInstance.ts:114` [读] |
| `env.storage.voip.sessionStorage.getItem` | storage | `sessionStorage.getItem` | 读旧 `media-call` sessionId | 同上 | 用于重绑会话 | `env.storage.voip.sessionStorage.setItem` | `packages/ui-voip/src/providers/useMediaSessionInstance.ts:120` [读] |
| `env.storage.voip.sessionStorage.removeItem` | storage | `sessionStorage.removeItem` | 读出旧 sessionId 后删除 | 同上 | 一次性恢复 | 同上 | `packages/ui-voip/src/providers/useMediaSessionInstance.ts:126` [读] |
| `env.storage.voip.sessionStorage.exists.set` | storage | `window.sessionStorage` | 写入新 sessionId 前探活 | 会话建立 | 无则跳过持久化 | 下一项 | `packages/ui-voip/src/providers/useMediaSessionInstance.ts:218` [读] |
| `env.storage.voip.sessionStorage.setItem` | storage | `sessionStorage.setItem` | 持久化当前媒体会话 id | 同上 | 刷新后可 resume | 上一项 | `packages/ui-voip/src/providers/useMediaSessionInstance.ts:219` [读] |
| `env.storage.livechat.Store.window` | storage | `window.localStorage` | livechat widget 取 localStorage（失败则内存 shim） | widget Store 构造 | 跨刷新持久化访客态 | `env.storage.livechat.Store.bind` | `packages/livechat/src/store/Store.ts:7` [读] |
| `env.storage.livechat.Store.bind` | storage | `const localStorage = getLocalStorage()` | 绑定 Store 用的存储对象 | 模块加载 | 后续 get/set 走它 | 同上 | `packages/livechat/src/store/Store.ts:20` [读] |
| `env.storage.livechat.Store.getItem` | storage | `localStorage.getItem` | 恢复 widget `store` JSON | Store 构造 | 合并 initialState | `env.storage.livechat.Store.setItem` | `packages/livechat/src/store/Store.ts:48` [读] |
| `env.storage.livechat.Store.setItem` | storage | `localStorage.setItem` | persist widget 状态 | `setState`/`persist` | 写 key（默认 `store`） | 同上 | `packages/livechat/src/store/Store.ts:84` [读] |
| `env.storage.livechat.session.destructure` | storage | `const { sessionStorage } = window` | widget 会话 id 用 sessionStorage | store/index 启动 | 绑定 sessionStorage | 下两项 | `packages/livechat/src/store/index.tsx:187` [读] |
| `env.storage.livechat.session.setItem` | storage | `sessionStorage.setItem` | 写 widget `sessionId` | 新会话 | 标签页级会话 | `env.storage.livechat.isActiveSession` | `packages/livechat/src/store/index.tsx:191` [读] |
| `env.storage.livechat.session.getItem` | storage | `sessionStorage.getItem` | 读 widget `sessionId` | 恢复/判断活跃 | 决定是否新开会话 | 同上 | `packages/livechat/src/store/index.tsx:206` [读] |
| `env.storage.livechat.isActiveSession` | storage | `sessionStorage.getItem` | 判断 widget 是否仍是同一 session | 可见性/探活 | 有 sessionId 视为活跃 | 同上 | `packages/livechat/src/helpers/isActiveSession.ts:4` [读] |

本表 **28**。`getStoredItem` / `setStoredItem` / `moveLoginKeys` 里的 `.getItem` 没有字面量 `localStorage`，不进本闭集（关联写在 `env.storage.sdk.storage.backend`）。`localStorageKey` 仅作属性名的行不进。

---

## 11. 排除（必须保持可见）

| 项 | 原因 |
| --- | --- |
| `*.spec.*` / `*.test.*` / `**/tests/**` / `*.stories.*` | 用户指定 client, not tests |
| `apps/uikit-playground` 的 `localStorage` | 不是产品客户端 |
| `document.title` 读 | 不是写 API；widget 只同步宿主 title |
| `<audio>` markup | 不是 `new Audio` / `new AudioContext` |
| `useGoToRoom` / 房间路由 | 应用内导航，不是深链 API |
| `cloudDeepLinkUrl` / `getCloudUrl` | Cloud 控制台 URL，不是 `rocketchat://` 或 `?msg=` |
| `navigator.permissions.query('notifications')` | Permissions API |
| `event.clipboardData` paste | 不是 clipboard write |
| `icon='download'` / `type==='download'` / `GenericFileAttachment download={bool}` | 不是 download API |
| Preferences My Data 邮件导出 | 服务端邮件，不是浏览器 download |
| `createObjectURL` 预览 | 不是 download |
| `packages/desktop-api` `setFavicon:` | 类型 |
| `AppRoot` og favicon PNG | 静态 meta |
| `getStoredItem` 等无字面量包装 | 闭集按字面量 |

## 12. 闭合判据

在 **`e519470d35b6caf5b228d81aef41c86aab3051f4`** 复跑。数字对不上 = 拒收。

```bash
git rev-parse HEAD
# expect e519470d35b6caf5b228d81aef41c86aab3051f4

# 表体 / 去重 id
rg -c '^\| `env\.' docs/qa/pm-feature-atlas/round-2/12-environment.md
rg -o '^\| `env\.[^`]+' docs/qa/pm-feature-atlas/round-2/12-environment.md | sort | uniq | wc -l
# expect 93 and 93
```

### 12.1 分族 rg（CLIENT 树 + 排除 glob）

```bash
ROOTS=(
  apps/meteor/client apps/meteor/app
  packages/ui-client packages/ui-contexts packages/web-ui-registration
  packages/ui-voip packages/ui-video-conf packages/fuselage-ui-kit
  packages/livechat packages/favicon packages/gazzodown packages/desktop-api
)
GLOBS=(
  --glob '*.{ts,tsx,js,jsx}'
  --glob '!**/*.spec.*' --glob '!**/*.test.*' --glob '!**/tests/**'
  --glob '!**/server/**' --glob '!**/*.stories.*' --glob '!**/*.d.ts'
)

# A Notification → 6
rg -n --no-heading "${GLOBS[@]}" \
  -e 'new Notification\b' -e 'Notification\.requestPermission' -e 'Notification\.permission' \
  "${ROOTS[@]}" | wc -l

# B favicon → 4
rg -n --no-heading "${GLOBS[@]}" \
  -e 'manageFavicon\(' -e 'updateFavicon\(' -e 'setFavicon\(' -e "setAttribute\('href'" \
  "${ROOTS[@]}" | wc -l

# C document.title 写 → 1
rg -n --no-heading "${GLOBS[@]}" -e 'document\.title\s*=' "${ROOTS[@]}" | wc -l

# D Audio 构造 → 6
rg -n --no-heading "${GLOBS[@]}" -e 'new Audio\b' -e 'new AudioContext\b' "${ROOTS[@]}" | wc -l

# E clipboard → 16（去掉函数签名 1 行后）
rg -n --no-heading "${GLOBS[@]}" \
  -e 'navigator\.clipboard\.' -e 'useClipboard\(' -e 'useClipboardWithToast\(' \
  "${ROOTS[@]}" | grep -v 'function useClipboardWithToast' | wc -l

# F download → 12
rg -n --no-heading "${GLOBS[@]}" \
  -e '\bdownload(As|JsonAs|CsvAs)?\(' -e '\.download\s*=' -e 'download=\{title\}' \
  "${ROOTS[@]}" | wc -l
```

深链与 storage 的 import/注释过滤以 §12.2 python 为准（rg 会多出 import / `export const` / 注释）。本环境 python 结果：

```
notification 6
favicon      4
title        1
audio        6
clipboard    16
download     12
deeplink     20
storage      28
TOTAL        93
```

### 12.2 权威抽点（必须 `SYMDIFF []`）

```bash
python3 - <<'PY'
import re, pathlib

ROOTS = [
  "apps/meteor/client", "apps/meteor/app",
  "packages/ui-client", "packages/ui-contexts", "packages/web-ui-registration",
  "packages/ui-voip", "packages/ui-video-conf", "packages/fuselage-ui-kit",
  "packages/livechat", "packages/favicon", "packages/gazzodown", "packages/desktop-api",
]
EXCL_DIR = re.compile(r'(^|/)(tests|server|node_modules|dist)(/|$)')
EXCL_FILE = re.compile(r'\.(spec|test|stories)\.')
EXT = {'.ts', '.tsx', '.js', '.jsx'}

def iter_files():
    for root in ROOTS:
        p = pathlib.Path(root)
        if not p.exists():
            continue
        for f in p.rglob('*'):
            if not f.is_file() or f.suffix not in EXT:
                continue
            s = str(f)
            if EXCL_DIR.search(s) or EXCL_FILE.search(s) or f.name.endswith('.d.ts'):
                continue
            yield f

def uncommented(line):
    return line.split('//', 1)[0] if '//' in line else line

def collect(pred):
    hits = []
    for f in iter_files():
        for i, line in enumerate(f.read_text(errors='replace').splitlines(), 1):
            if pred(line, uncommented(line)):
                hits.append(f"{f}:{i}")
    return hits

notif = collect(lambda raw, code: bool(re.search(r'new Notification\b|Notification\.requestPermission|Notification\.permission', code)))
fav = collect(lambda raw, code: bool(re.search(r"manageFavicon\(|updateFavicon\(|setFavicon\(|setAttribute\(\s*['\"]href['\"]", code)))
title = collect(lambda raw, code: bool(re.search(r'document\.title\s*=', code)))
audio = collect(lambda raw, code: bool(re.search(r'new Audio\b|new AudioContext\b', code)))

def clip(raw, code):
    if re.search(r'function\s+useClipboardWithToast\s*\(', code):
        return False
    return bool(re.search(r'navigator\.clipboard\.|useClipboard\(|useClipboardWithToast\(', code))
clip_hits = collect(clip)

dl = collect(lambda raw, code: bool(re.search(r'\bdownload(As|JsonAs|CsvAs)?\(|\.download\s*=|download=\{title\}', code)))

def dlk(raw, code):
    if re.search(r'^\s*import\s+', raw):
        return False
    if re.search(r'export const (buildDeepLinkURL|setMessageJumpQueryStringParameter)\s*=', raw):
        return False
    return bool(re.search(
        r"rocketchat://|buildDeepLinkURL\(|useSearchParameter\(\s*['\"]msg['\"]\s*\)|setMessageJumpQueryStringParameter\(|\?msg=\$\{|path:\s*['\"]/invite/:hash['\"]",
        raw))
dlk_hits = collect(dlk)

def sto(raw, code):
    if not re.search(r'(window\.)?(localStorage|sessionStorage)', code):
        return False
    return bool(re.search(
        r'(window\.)?localStorage\.(getItem|setItem|removeItem|clear)'
        r'|(window\.)?sessionStorage\.(getItem|setItem|removeItem|clear)'
        r'|Object\.keys\(\s*localStorage'
        r'|window\.localStorage\b|window\.sessionStorage\b'
        r'|\{\s*sessionStorage\s*\}\s*=\s*window'
        r'|const\s+localStorage\s*=\s*getLocalStorage',
        code))
sto_hits = collect(sto)

parts = {
    'notification': notif, 'favicon': fav, 'title': title, 'audio': audio,
    'clipboard': clip_hits, 'download': dl, 'deeplink': dlk_hits, 'storage': sto_hits,
}
for k, v in parts.items():
    print(k, len(v))
total = sum(len(v) for v in parts.values())
print('COUNT', total)

text = pathlib.Path('docs/qa/pm-feature-atlas/round-2/12-environment.md').read_text()
ids = re.findall(r'^\| `(env\.[^`]+)`', text, re.M)
print('TABLE', len(ids), 'UNIQUE', len(set(ids)))
# 出处 file:line 必须都能对上抽点
sites = re.findall(r'`((?:apps|packages)/[^`]+?:\d+)` \[读\]', text)
print('SITES', len(sites), 'UNIQUE_SITES', len(set(sites)))
extracted = set()
for v in parts.values():
    extracted.update(v)
print('SYMDIFF', sorted(set(sites) ^ extracted)[:20], 'len', len(set(sites) ^ extracted))
print('EQ 6+4+1+6+16+12+20+28 =', 6+4+1+6+16+12+20+28)
PY
```

期望：

```
notification 6
favicon 4
title 1
audio 6
clipboard 16
download 12
deeplink 20
storage 28
COUNT 93
TABLE 93 UNIQUE 93
SITES 93 UNIQUE_SITES 93
SYMDIFF [] len 0
EQ 6+4+1+6+16+12+20+28 = 93
```
