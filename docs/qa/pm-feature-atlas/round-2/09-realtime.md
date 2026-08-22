# Round 2 / Vol.9 — 客户端 stream/notify 订阅闭集

## 1. 方法

- 冻结树：**仅** `e519470d35b6caf5b228d81aef41c86aab3051f4`（`e519470`）。不是 `develop`。`file:line` 均相对此 SHA。
- 闭集定义：Meteor **Web 客户端**在本树上会真正 **bind 回调** 的 `(streamName, eventKey)`。一行一键。id = `rt.<stream>/<event>`。
- 客户端树：`apps/meteor/client/**`、`apps/meteor/ee/client/**`、`apps/meteor/app/**/client/**`、`apps/meteor/ee/app/**/client/**`、`packages/ui-client` `ui-contexts` `web-ui-registration` `ui-voip` `ui-video-conf` `fuselage-ui-kit`。排除 `server/`、`*.spec.*`、`*.stories.*`、`tests/`、`*.snap`。
- API（已核 hunch）：`useStream` / `useStreamAll`（随后对返回函数 bind event）+ `sdk.stream(stream, [event], cb)`。`CachedStore.setupListener` 按子类 `eventType` + `eventName` 展开（`PrivateSettingsCachedStore` 覆盖为字面量 `private-settings-changed`）。`userStatuses.watch(stream)` 展开为 `updateCustomUserStatus` + `deleteCustomUserStatus`。
- event 归一：`` `${uid|rid}/suffix` `` → `suffix`；`` `department/${id}` `` / `` `agent/${id}` `` → `department` / `agent`；`room-messages` 的 rid 变量 → `rid`；`integrationHistory` 的 id 变量 → `id`；`useStreamAll` → `*`；`${rid}/${USER_ACTIVITY}` → `user-activity`。
- **排除（基础设施，不是订阅点）**：`useStream.ts` / `useStreamAll.ts` / `useWriteStream.ts` / `ServerContext` / `index.ts` 导出；`ServerProvider.getStream` 包装；`SDKClient.stream` 实现；`meteorBackedSdk` throw；`CachedStore.ts:213` 泛型（已由子类展开）；`sdk.publish` / `useWriteStream`（写，不是订）；注释。
- **排除（本闭集外）**：`packages/livechat` 访客小部件（`useStream` 4 文件 / 6 个 hook 调用，含本树 Web 客户端未订的 `livechat-room`）；`Meteor.subscribe('stream-user-presence')`（DDP publication 命令，不是 `sdk.stream`/`useStream`；在线状态回调走 `useStreamAll('user-presence')`）。
- `Notifications.on`：**0**（本冻结树客户端无此 API）。
- `StreamerEvents` 已登记但本树 Web 客户端 **未 bind**（不进闭集，不发明行）：`notify-user` 的 `e2ekeyRequest` / `call.hangup` / `updateInvites`；`notify-room` 的 `typing` / `e2e.keyRequest`；`notify-logged` 的 `new-banner` / `user-status`；`notify-all` 的 `deleteCustomSound` / `updateCustomSound`（经 `public-info` 复用）；`room-messages` 的 `__my_messages__`；`room-data`；`livechat-room`（仅 livechat 包）；`apps-engine`；`notify-room-users`（仅 `sdk.publish`）；`local`。
- 诚实标记：每行 `[读]`。本环境无 `meteor` 二进制、无 Mongo、workspace 根无可用 Meteor 启动路径，故 **无 `[活]`**。未发明任何实时推送样本。
- 8 列：稳定语义 id / stream+event / 功能一句话 / 订阅 API / 何时订 / UI 效果 / 关联 / 出处。

## 2. Hunch 核验

| hunch | 本树结论 | 计数（排除 server/spec/stories/tests） |
| --- | --- | --- |
| `useStream` | **成立**（含 `useStreamAll` 定义/导出） | files=37；lines=78 |
| `sdk.stream` | **成立** | files=13；lines=21（含 ServerProvider 包装 1、meteorBackedSdk throw 1、startup 注释 1） |
| `stream(` | **成立**（= `sdk.stream(` 调用面；比上一行少 infra/注释） | files=11 |
| `notify` | **部分成立**（噪声大；有效信号是 `notify-user\|room\|logged\|all`） | files=41 |
| `Notifications.on` | **不成立** | files=0；lines=0 |

`useStreamAll` files=3（定义 + 导出 + `useUserPresenceListener.ts`）。

## 3. 闭集表（一行一 `(stream, event)`）

数据行 **44**。排序：stream 字典序，再 event。同一 event 多处 bind 合并到出处列。bind 合计 **68**（`68 − 24 重复 = 44`）。

### 3.1 `apps` / `canned-responses` / `importers` / `integrationHistory` / `roles` / `room-messages` / `user-presence`

| 稳定语义 id | stream/event | 功能一句话 | 订阅 API | 何时订 | UI 效果 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `rt.apps/apps` | `apps` / `apps` | Apps 总线：动作钮、slash、i18n、Marketplace 列表失效 | useStream | 已登录（动作钮/slash/i18n）；Marketplace `useApps` | 消息/房间 Apps 按钮刷新；slash 弹出层命令增删；Apps 文案热更新；Marketplace 卡状态变 | `rt.notify-user/uiInteraction` | `apps/meteor/client/hooks/useAppActionButtons.ts:51` `useAppSlashCommands.ts:32` `useTranslationsForApps.ts:49` `views/marketplace/hooks/useApps.ts:123` [读] |
| `rt.canned-responses/canned-responses` | `canned-responses` / `canned-responses` | 预置回复增删改同步进 composer 选择器 | useStream | Omni 房 + `Canned_Responses_Enable` + `view-canned-responses` | composer 预置回复列表即时增删改；非本坐席 `agentsId` 忽略 | Omni 队列三键 | `apps/meteor/client/views/room/providers/hooks/useCannedResponsesQuery.ts:27` [读] |
| `rt.importers/progress` | `importers` / `progress` | 管理端导入进度条 | useStream | Admin→Import 准备页/进度页挂载 | Prepare/Progress 页 ProgressBar 与百分比刷新；完成后 toast/跳转 | （无） | `apps/meteor/client/views/admin/import/PrepareImportPage.tsx:69` `ImportProgressPage.tsx:120` [读] |
| `rt.integrationHistory/id` | `integrationHistory` / `${id}` | 某条 Outgoing webhook 的执行历史实时追加 | sdk.stream | Admin→Integrations→Outgoing→History 已 mount | History 表顶部插入新行、total+1 | （无） | `apps/meteor/client/views/admin/integrations/outgoing/history/OutgoingWebhookHistoryPage.tsx:66` [读] |
| `rt.roles/roles` | `roles` / `roles` | 角色定义插入/更新/删除 | sdk.stream | 已有 uid（或随后 `userIdStore` 有值） | 权限/成员角色标签随 Roles store 变；无独立弹层 | `rt.notify-logged/roles-change` | `apps/meteor/client/startup/roles.ts:27` [读] |
| `rt.room-messages/rid` | `room-messages` / `${rid}` | 房间新消息/编辑进入时间线与线程 | useStream + sdk.stream | 打开房间（LegacyRoomManager）；无限滚动列表；线程主消息/回复列表 | 时间线插入/替换气泡；线程栏追加回复；`new-message` 全局事件 | `rt.notify-room/deleteMessage`；`rt.notify-user/message` | `apps/meteor/app/ui-utils/client/lib/LegacyRoomManager.ts:171` `useInfiniteMessageQueryUpdates.ts:75` `useThreadMainMessageQuery.ts:36` `useThreadMessagesQuery.ts:53` [读] |
| `rt.user-presence/*` | `user-presence` / `*`（useStreamAll） | 任意用户在线状态广播 | useStreamAll | `useUserPresenceListener` 挂载（登录壳） | 头像/成员列表状态点、状态文案即时变 | DDP `stream-user-presence` 仅加/减 uid，不是本行 | `apps/meteor/client/hooks/useUserPresenceListener.ts:10` [读] |

本表数据行：**7**。

### 3.2 `livechat-inquiry-queue-observer`

| 稳定语义 id | stream/event | 功能一句话 | 订阅 API | 何时订 | UI 效果 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `rt.livechat-inquiry-queue-observer/agent` | `livechat-inquiry-queue-observer` / `agent/${userId}` | 坐席个人排队询盘 | sdk.stream | Omni 手动选单且路由非 autoAssign；`initializeLivechatInquiryStream` | Omni 侧栏/队列池出现新询盘、alert；房间 query 失效 | 下两行；`rt.notify-user/departmentAgentData` | `apps/meteor/app/livechat/client/lib/stream/queueManager.ts:124` [读] |
| `rt.livechat-inquiry-queue-observer/department` | `livechat-inquiry-queue-observer` / `department/${departmentId}` | 坐席所属部门排队询盘 | sdk.stream | 同上，按坐席部门逐个 append | 同上，仅该部门 inquiry | 上/下一行 | `apps/meteor/app/livechat/client/lib/stream/queueManager.ts:81` [读] |
| `rt.livechat-inquiry-queue-observer/public` | `livechat-inquiry-queue-observer` / `public` | 公共排队询盘 | sdk.stream | 同上，另订 public | 无部门 inquiry 进队列池 | 上两行 | `apps/meteor/app/livechat/client/lib/stream/queueManager.ts:113` [读] |

本表数据行：**3**。

### 3.3 `notify-all`

| 稳定语义 id | stream/event | 功能一句话 | 订阅 API | 何时订 | UI 效果 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `rt.notify-all/license` | `notify-all` / `license` | 许可证变更后刷新 license query | useStream | `useLicenseBase` 挂载（已登录） | 5s debounce 后许可证/限额 UI（Marketplace、VoIP、EE 门）重取 | vol 6 license settings | `packages/ui-client/src/hooks/useLicense.ts:45` [读] |
| `rt.notify-all/public-info` | `notify-all` / `public-info` | 自定义声音增删（mux：`updateCustomSound`/`deleteCustomSound`） | useStream | CustomSoundProvider 挂载 | 通知/呼叫铃声列表刷新；下一声用新 src | `rt.notify-all/public-settings-changed` | `apps/meteor/client/providers/CustomSoundProvider/CustomSoundProvider.tsx:129` [读] |
| `rt.notify-all/public-settings-changed` | `notify-all` / `public-settings-changed` | 公开工作区设置热更新 | CachedStore | PublicSettingsCachedStore 监听 | 依赖 `useSetting` 的开关/文案/占位符立即重渲染 | vol 6 243 键 | `apps/meteor/client/cachedStores/PublicSettingsCachedStore.ts:10`（`CachedStore.ts:213`） [读] |

本表数据行：**3**。

### 3.4 `notify-logged`

| 稳定语义 id | stream/event | 功能一句话 | 订阅 API | 何时订 | UI 效果 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `rt.notify-logged/Users:Deleted` | `notify-logged` / `Users:Deleted` | 用户被删：抹消息或 Unlink 改作者 | useStream | 已登录 UserProvider | 时间线该用户气泡消失，或作者换成 replaceByUser/alias | `rt.notify-logged/Users:NameChanged` | `apps/meteor/client/providers/UserProvider/hooks/useDeleteUser.ts:18` [读] |
| `rt.notify-logged/Users:NameChanged` | `notify-logged` / `Users:NameChanged` | 他人改名/改用户名 | useStream | 房间角色 query；房间 provider | 成员列表/消息作者名即时变 | 上一行；`rt.notify-logged/updateAvatar` | `apps/meteor/client/hooks/useRoomRolesQuery.ts:77` `useUsersNameChanged.ts:12` [读] |
| `rt.notify-logged/banner-changed` | `notify-logged` / `banner-changed` | 工作区横幅集合变 | useStream | 已登录 CloudAnnouncementsRegion | 顶栏/工作区 Cloud 公告条刷新 | `rt.notify-user/banners` | `apps/meteor/client/views/cloud/CloudAnnouncementsRegion.tsx:31` [读] |
| `rt.notify-logged/deleteCustomUserStatus` | `notify-logged` / `deleteCustomUserStatus` | 删除自定义状态预设 | useStream+watch | 头像菜单 Status（`userStatuses.watch`） | Status 菜单去掉该自定义项 | `rt.notify-logged/updateCustomUserStatus` | `useStatusItems.tsx:26` → `userStatuses.ts:80` [读] |
| `rt.notify-logged/deleteEmojiCustom` | `notify-logged` / `deleteEmojiCustom` | 删除自定义 emoji | useStream | EmojiPickerProvider | 选择器去掉该 emoji | `rt.notify-logged/updateEmojiCustom` | `apps/meteor/client/providers/EmojiPickerProvider/useUpdateCustomEmoji.ts:15` [读] |
| `rt.notify-logged/omnichannel.priority-changed` | `notify-logged` / `omnichannel.priority-changed` | Omni 优先级定义变 | useStream | EE + Omni 可访问 + `useHasLicenseModule('livechat-enterprise')` | 优先级下拉/列表 query 失效后重拉 | 队列三键 | `apps/meteor/client/providers/OmnichannelProvider.tsx:96` [读] |
| `rt.notify-logged/permissions-changed` | `notify-logged` / `permissions-changed` | 权限矩阵热更新 | CachedStore | PermissionsCachedStore | 按钮/侧栏/路由门随 `usePermission` 显隐 | vol 7 148 键 | `apps/meteor/client/cachedStores/PermissionsCachedStore.ts:8` [读] |
| `rt.notify-logged/private-settings-changed` | `notify-logged` / `private-settings-changed` | 私有/特权设置热更新 | sdk.stream（覆盖 CachedStore） | 有特权设置权的会话 | Admin Settings 私有集与 `settings.peek` 依赖处刷新 | `rt.notify-all/public-settings-changed` | `apps/meteor/client/cachedStores/PrivateSettingsCachedStore.ts:17` [读] |
| `rt.notify-logged/roles-change` | `notify-logged` / `roles-change` | 用户房间/全局角色加减 | useStream | 用户角色 query；房间角色 query；成员列表 | 成员徽章、房间角色、成员表行即时变 | `rt.roles/roles` | `useUserRolesQuery.ts:31` `useRoomRolesQuery.ts:31` `useMembersList.ts:125` [读] |
| `rt.notify-logged/updateAvatar` | `notify-logged` / `updateAvatar` | 他人头像 etag 变 | useStream | 已登录 UserProvider | 对应用户头像 src 带新 etag 重载 | `rt.notify-logged/Users:NameChanged` | `apps/meteor/client/providers/UserProvider/hooks/useUpdateAvatar.ts:13` [读] |
| `rt.notify-logged/updateCustomUserStatus` | `notify-logged` / `updateCustomUserStatus` | 新增/改自定义状态预设 | useStream+watch | 头像菜单 Status | Status 菜单出现/改名该自定义项 | `rt.notify-logged/deleteCustomUserStatus` | `useStatusItems.tsx:26` → `userStatuses.ts:75` [读] |
| `rt.notify-logged/updateEmojiCustom` | `notify-logged` / `updateEmojiCustom` | 新增/改自定义 emoji | useStream | EmojiPickerProvider | 选择器出现/更新该 emoji | `rt.notify-logged/deleteEmojiCustom` | `apps/meteor/client/providers/EmojiPickerProvider/useUpdateCustomEmoji.ts:14` [读] |

本表数据行：**12**。

### 3.5 `notify-room`

| 稳定语义 id | stream/event | 功能一句话 | 订阅 API | 何时订 | UI 效果 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `rt.notify-room/deleteMessage` | `notify-room` / `${rid}/deleteMessage` | 单条消息删除 | useStream + sdk.stream | 打开房间；无限列表；线程栏 | 气泡消失；线程引用剥掉 tmid | `rt.notify-room/deleteMessageBulk`；`rt.room-messages/rid` | `LegacyRoomManager.ts:214` `useInfiniteMessageQueryUpdates.ts:89` `useThreadMainMessageQuery.ts:40` `useThreadMessagesQuery.ts:62` [读] |
| `rt.notify-room/deleteMessageBulk` | `notify-room` / `${rid}/deleteMessageBulk` | 批量删/只删文件/显示已删占位 | useStream + sdk.stream | 同上 | 时间线/线程一批消失，或附件被替换，或变 `t=rm` 占位 | 上一行 | `LegacyRoomManager.ts:223` `useInfiniteMessageQueryUpdates.ts:98` `useThreadMainMessageQuery.ts:44` `useThreadMessagesQuery.ts:71` [读] |
| `rt.notify-room/messagesImported` | `notify-room` / `${rid}/messagesImported` | 房间完成消息导入 | sdk.stream | LegacyRoomManager 打开该房 | 清空历史再拉一页，时间线整段重载 | `rt.room-messages/rid` | `apps/meteor/app/ui-utils/client/lib/LegacyRoomManager.ts:210` [读] |
| `rt.notify-room/messagesRead` | `notify-room` / `${rid}/messagesRead` | 已读回执/未读条清除 | useStream + sdk.stream | 打开房间；线程栏；已读回执弹层 | 未读点/条消失；线程消息标已读；ReadReceipts 表刷新 | `rt.room-messages/rid` | `LegacyRoomManager.ts:246` `useThreadMainMessageQuery.ts:54` `useThreadMessagesQuery.ts:90` `ReadReceiptsModal.tsx:37` [读] |
| `rt.notify-room/user-activity` | `notify-room` / `${rid}/user-activity` | 他人正在输入/录音/上传/播放 | sdk.stream | `UserAction.addStream(rid)`（进房） | composer 上方出现「正在输入…」等活动条（忽略自己） | 本行只订不发；发出走 `sdk.publish` | `apps/meteor/app/ui/client/lib/UserAction.ts:87` [读] |
| `rt.notify-room/videoconf` | `notify-room` / `${rid}/videoconf` | 该房间某次视频会议状态变 | useStream | 时间线 VideoConference 块（有 callId） | 会议块按钮（加入/已结束/再呼）随 query 失效刷新 | `rt.notify-user/video-conference` | `packages/fuselage-ui-kit/src/blocks/VideoConferenceBlock/hooks/useVideoConfDataStream.ts:15` [读] |

本表数据行：**6**。

### 3.6 `notify-user`

| 稳定语义 id | stream/event | 功能一句话 | 订阅 API | 何时订 | UI 效果 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `rt.notify-user/banners` | `notify-user` / `${uid}/banners` | 针对当前用户的横幅 | useStream | 已登录 CloudAnnouncementsRegion | 与 banner-changed 一样重拉公告条 | `rt.notify-logged/banner-changed` | `apps/meteor/client/views/cloud/CloudAnnouncementsRegion.tsx:37` [读] |
| `rt.notify-user/calendar` | `notify-user` / `${uid}/calendar` | Outlook 日历桌面通知 | useStream | 已登录且 `user.settings.calendar.outlook.Enabled`；busy 忽略 | 系统 Notification；点击打开 OutlookCalendarEventModal | `rt.notify-user/notification` | `apps/meteor/client/views/root/hooks/loggedIn/useNotificationUserCalendar.ts:56` [读] |
| `rt.notify-user/departmentAgentData` | `notify-user` / `${uid}/departmentAgentData` | 坐席部门数据变，重订询盘流 | useStream | Omni 手动队列（showQueue 且非 autoAssign 且坐席 available） | 重新 `initializeLivechatInquiryStream`，队列池换部门订阅 | 队列三键 | `apps/meteor/client/providers/OmnichannelProvider.tsx:139` [读] |
| `rt.notify-user/force_logout` | `notify-user` / `${uid}/force_logout` | 服务端强制登出 | useStream | 已登录 `useForceLogout` | `forceLogout` session；SDK 传输下再 wipe 本地 token，回到 /login | `rt.notify-user/userData` | `apps/meteor/client/views/root/hooks/loggedIn/useForceLogout.ts:16` [读] |
| `rt.notify-user/media-signal` | `notify-user` / `${uid}/media-signal` | 团队语音信令入站 | useStream | `useMediaSessionInstance` 有 userId | 来电铃/接通/挂断小组件；发出走 `useWriteStream` `media-calls`（非本行） | `rt.notify-user/video-conference` | `packages/ui-voip/src/providers/useMediaSessionInstance.ts:308` [读] |
| `rt.notify-user/message` | `notify-user` / `${uid}/message` | 私密/ephemeral 消息进本地 Messages | sdk.stream | `onLoggedIn` | 当前房间时间线出现仅自己可见的私密气泡（缺省作者 rocket.cat）；线程缓存同步 | `rt.room-messages/rid` | `apps/meteor/client/startup/incomingMessages.ts:12` [读] |
| `rt.notify-user/notification` | `notify-user` / `${uid}/notification` | 桌面通知 + 新消息铃声 | useStream | 已登录 `useNotifyUser`；embedded 仅失焦且在本房 | 系统/桌面通知；`notificationSounds.playNewMessage`；`notification` 全局事件 | `rt.notify-user/subscriptions-changed` | `apps/meteor/client/views/root/hooks/loggedIn/useNotifyUser.ts:59` [读] |
| `rt.notify-user/rooms-changed` | `notify-user` / `${uid}/rooms-changed` | 房间文档增改删，合并进订阅侧栏 | CachedStore | RoomsCachedStore | 侧栏房间名/主题/未读来源/Omni 字段即时变 | `rt.notify-user/subscriptions-changed` | `apps/meteor/client/cachedStores/RoomsCachedStore.ts:12` [读] |
| `rt.notify-user/subscriptions-changed` | `notify-user` / `${uid}/subscriptions-changed` | 订阅增改删：侧栏、忽略、踢出、新房间提示 | useStream + sdk.stream + CachedStore | 登录后常驻 + 开房/embedded | 侧栏增行/消失；被移出 toast 并回 /home（Omni 走 close 路由）；ignore 灰掉消息；新房间铃声；embedded 补订 | `rt.notify-user/rooms-changed`；`rt.notify-user/notification` | `SubscriptionsCachedStore.ts:12` `incomingMessages.ts:25` `useNotifyUser.ts:61` `useGoToHomeOnRemoved.ts:23` `useClearRemovedRoomsHistory.ts:14` `RoomOpenerEmbedded.tsx:41` [读] |
| `rt.notify-user/uiInteraction` | `notify-user` / `${uid}/uiInteraction` | Apps UiKit 服务端交互（模态/更新块） | useStream | 已登录 `useAppUiKitInteraction` | Apps 模态打开/更新/关；消息块表面变 | `rt.apps/apps` | `apps/meteor/client/hooks/useAppUiKitInteraction.ts:16` [读] |
| `rt.notify-user/userData` | `notify-user` / `${uid}/userData` | 当前用户文档 inserted/updated/removed | sdk.stream | `synchronizeUserData(uid)`（登录壳） | 自己的名字/状态/角色/偏好立即反映到顶栏与 Preferences；removed 清 Users | `rt.notify-user/force_logout` | `apps/meteor/client/lib/userData.ts:65` [读] |
| `rt.notify-user/video-conference` | `notify-user` / `${uid}/video-conference` | 点对点视频会议呼叫信令 | sdk.stream | VideoConfManager.connectUser | 来电铃/接听条/超时取消 | `rt.notify-room/videoconf` | `apps/meteor/client/lib/VideoConfManager.ts:531` [读] |
| `rt.notify-user/webdav` | `notify-user` / `${uid}/webdav` | WebDAV 账户增删改 | useStream | 已登录且 query enabled | Account/composer WebDAV 账户列表刷新或移除一行 | （无） | `apps/meteor/client/hooks/webdav/useWebDAVAccountIntegrationsQuery.ts:39` [读] |

本表数据行：**13**。

分表验算：`7 + 3 + 3 + 12 + 6 + 13 = 44`。

## 4. 活样本

本环境：`command -v meteor` → 无；无 Mongo；未执行 Meteor 启动。

**无 `[活]`。** 不发明推送样本、不发明 DDP 帧、不发明 UI 截图。上表全部 `[读]`。

若日后在 **同一冻结 SHA** 上成功启动已登录 Web：只允许把「已亲眼见到的」行把出处列升为 `[活]`，并写清房间/用户/操作；禁止补造未观察到的 event。

## 5. 闭合判据

在 **`e519470d35b6caf5b228d81aef41c86aab3051f4`** 上重跑。

```bash
git rev-parse HEAD
# 期望：e519470d35b6caf5b228d81aef41c86aab3051f4

# 1. 表数据行 / 唯一 id
rg -c '^\| `rt\.' docs/qa/pm-feature-atlas/round-2/09-realtime.md
rg -o '^\| `rt\.[^`]+`' docs/qa/pm-feature-atlas/round-2/09-realtime.md | sort | uniq | wc -l
# 期望：44 和 44

# 2. Hunch（与写作时相同 glob / roots）
rg -l --glob '*.ts' --glob '*.tsx' --glob '*.js' \
  --glob '!**/*.spec.*' --glob '!**/*.test.*' --glob '!**/*.stories.*' \
  --glob '!**/tests/**' --glob '!**/server/**' --glob '!**/*.snap' \
  'useStream' \
  apps/meteor/client apps/meteor/ee/client apps/meteor/app apps/meteor/ee/app \
  packages/ui-client packages/ui-contexts packages/web-ui-registration \
  packages/ui-voip packages/ui-video-conf packages/fuselage-ui-kit | wc -l
# 期望：37

rg -l --glob '*.ts' --glob '*.tsx' --glob '*.js' \
  --glob '!**/*.spec.*' --glob '!**/*.test.*' --glob '!**/*.stories.*' \
  --glob '!**/tests/**' --glob '!**/server/**' --glob '!**/*.snap' \
  'sdk\.stream' \
  apps/meteor/client apps/meteor/ee/client apps/meteor/app apps/meteor/ee/app \
  packages/ui-client packages/ui-contexts packages/web-ui-registration \
  packages/ui-voip packages/ui-video-conf packages/fuselage-ui-kit | wc -l
# 期望：13

rg -l --glob '*.ts' --glob '*.tsx' --glob '*.js' \
  --glob '!**/*.spec.*' --glob '!**/*.test.*' --glob '!**/*.stories.*' \
  --glob '!**/tests/**' --glob '!**/server/**' \
  'Notifications\.on' \
  apps/meteor/client apps/meteor/ee/client apps/meteor/app apps/meteor/ee/app \
  packages/ui-client packages/ui-contexts packages/web-ui-registration \
  packages/ui-voip packages/ui-video-conf packages/fuselage-ui-kit | wc -l
# 期望：0

# 3. 抽键验算
python3 - <<'PY'
import re, pathlib
ROOT = pathlib.Path('.')
ROOTS = [
    'apps/meteor/client','apps/meteor/ee/client','apps/meteor/app','apps/meteor/ee/app',
    'packages/ui-client','packages/ui-contexts','packages/web-ui-registration',
    'packages/ui-voip','packages/ui-video-conf','packages/fuselage-ui-kit',
]
SKIP = ('.spec.ts','.spec.tsx','.test.ts','.test.tsx','.stories.ts','.stories.tsx','.snap')
INFRA = {
    'packages/ui-contexts/src/hooks/useStream.ts',
    'packages/ui-contexts/src/hooks/useStreamAll.ts',
    'packages/ui-contexts/src/hooks/useWriteStream.ts',
    'packages/ui-contexts/src/index.ts',
    'packages/ui-contexts/src/ServerContext.ts',
    'apps/meteor/client/providers/ServerProvider.tsx',
    'apps/meteor/app/utils/client/lib/SDKClient.ts',
    'apps/meteor/client/lib/sdk/meteorBackedSdk.ts',
    'apps/meteor/client/meteor/overrides/stubMeteorStream.ts',
    'apps/meteor/client/lib/cachedStores/CachedStore.ts',
}
USE_ASSIGN = re.compile(r'(?:const|let)\s+(\w+)\s*=\s*useStream(All)?\(\s*[\'"]([^\'"]+)[\'"]')
SDK = re.compile(r'''sdk\.stream\(\s*['"]([^'"]+)['"]\s*,\s*\[([^\]]+)\]''')

def iter_files():
    for root in ROOTS:
        p = ROOT/root
        if not p.exists():
            continue
        for f in p.rglob('*'):
            if not f.is_file() or f.suffix not in {'.ts','.tsx','.js','.jsx'}:
                continue
            if str(f).endswith(SKIP):
                continue
            if 'server' in f.parts or 'tests' in f.parts:
                continue
            s = str(f)
            if ('/app/' in s or '/ee/app/' in s) and '/client/' not in s:
                continue
            yield f

def canon(stream, raw):
    raw = raw.strip().rstrip(',')
    if 'USER_ACTIVITY' in raw:
        return 'user-activity'
    m = re.match(r'`\$\{[^}]+\}/([^`]+)`', raw)
    if m:
        suf = m.group(1)
        return suf.split('/')[0] if stream == 'livechat-inquiry-queue-observer' else suf
    m = re.match(r'`(department|agent)/\$\{[^}]+\}`', raw)
    if m:
        return m.group(1)
    m = re.match(r'''['"]([^'"]+)['"]''', raw)
    if m:
        return m.group(1)
    if stream == 'room-messages':
        return 'rid'
    if stream == 'integrationHistory':
        return 'id'
    if stream == 'user-presence':
        return '*'
    return raw

binds = []
for f in iter_files():
    rel = str(f)
    if rel in INFRA:
        continue
    text = f.read_text(errors='replace')
    lines = text.splitlines()
    for i, line in enumerate(lines, 1):
        for sm in SDK.finditer(line):
            binds.append((sm.group(1), canon(sm.group(1), sm.group(2).strip())))
    for i, line in enumerate(lines, 1):
        m = USE_ASSIGN.search(line)
        if not m:
            continue
        var, is_all, stream = m.group(1), m.group(2), m.group(3)
        if is_all:
            binds.append((stream, '*'))
            continue
        if 'userStatuses.watch' in text:
            binds.append((stream, 'updateCustomUserStatus'))
            binds.append((stream, 'deleteCustomUserStatus'))
            continue
        call_re = re.compile(rf'\b{re.escape(var)}\s*\(')
        for j, ln in enumerate(lines, 1):
            if j <= i or 'useStream' in ln or not call_re.search(ln):
                continue
            rest = ln.split(var, 1)[1]
            am = re.match(r'\s*\(\s*([^\n,]+)', rest)
            if not am:
                chunk = '\n'.join(lines[j-1:j+3])
                am2 = re.search(rf'{re.escape(var)}\s*\(\s*([^\n,]+)', chunk)
                arg = am2.group(1).strip() if am2 else '?'
            else:
                arg = am.group(1).strip()
            ev = canon(stream, arg)
            if ev == '?' or ev.startswith('('):
                continue
            binds.append((stream, ev))

binds += [
    ('notify-user', 'rooms-changed'),
    ('notify-user', 'subscriptions-changed'),
    ('notify-all', 'public-settings-changed'),
    ('notify-logged', 'permissions-changed'),
]
keys = {f'{s}/{e}' for s, e in binds}
doc = (ROOT/'docs/qa/pm-feature-atlas/round-2/09-realtime.md').read_text()
table = set(re.findall(r'^\| `rt\.([^`]+)`', doc, re.M))
print('BINDS', len(binds))
print('COUNT', len(keys))
print('TABLE', len(table))
print('SYMDIFF', sorted(keys ^ table))
PY
# 期望：BINDS 68；COUNT 44；TABLE 44；SYMDIFF []
```

### 验算

| 量 | 期望 | 本册 |
| --- | --- | --- |
| `git rev-parse HEAD` | `e519470d35b6caf5b228d81aef41c86aab3051f4` | 写作时已钉 |
| 表数据行（`rg -c '^\| \`rt\.'`） | 44 | 44 |
| 唯一 `rt.*` id | 44 | 44 |
| 抽键闭集 COUNT | 44 | 44 |
| bind 行 BINDS | 68 | 68 |
| `7+3+3+12+6+13` | 44 | 44 |
| `useStream` files | 37 | 37 |
| `sdk.stream` files | 13 | 13 |
| `Notifications.on` files | 0 | 0 |
| `[读]` 行 | 每数据行 | 每行出处列 |
| `[活]` 行 | 0（meteor 未启动） | 0 |

`44 = 44 = 44`。`68 − 24 重复 bind = 44`。Hunch 与抽键一致。
