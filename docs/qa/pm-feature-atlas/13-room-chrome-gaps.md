# PM Feature-Test Atlas 13 — Room chrome gaps

- 仓库：`https://github.com/jianwyao01/Rocket.Chat`（fork）
- 基线：`cursor/pm-atlas-merge-06-11-f8ed`（其上 `develop` `e10bd504b9`）
- **本分册只猎取 02/03/06 未收的房间 chrome。** 不写 06 面板内部，不写 01 消息工具栏、03 composer 入口、08 omni 产品面、10 时间线正文。
- 不实现产品功能。诚实标记：`[读]` = 源码/i18n；`[待渲染实测]` = 未挂真实 UI。
- 命名空间：**仅** `room.chrome.*` `room.banner.*` `room.join.*`。8 列与 02/06 相同。
- 先列 02/03/06 已有 `room.*` / `sidebar.roomMenu.*` / `implicit.*`，再猎剩余 chrome。已覆盖的猎取项进「确认已覆盖」，不复行。

入口缩写：`房间头` = `Header`；`侧栏行` = V1 `SidebarItemTemplateWithData` 或 V2 `SidebarItemWithData`。

---

## 02/03/06 已有 id（猎取基线）

### 02 `room.*`（33）

`room.toolbox.channel-settings` `room.toolbox.team-info` `room.toolbox.user-info-group` `room.toolbox.user-info` `room.toolbox.thread` `room.toolbox.autotranslate` `room.toolbox.calls` `room.toolbox.canned-responses` `room.toolbox.clean-history` `room.toolbox.contact-profile` `room.toolbox.discussions` `room.toolbox.e2e` `room.toolbox.export-messages` `room.toolbox.game-center` `room.toolbox.banned-users` `room.toolbox.members-list` `room.toolbox.mentions` `room.toolbox.omnichannel-external-frame` `room.toolbox.outlook-calendar` `room.toolbox.pinned-messages` `room.toolbox.push-notifications` `room.toolbox.rocket-search` `room.toolbox.room-info` `room.toolbox.starred-messages` `room.toolbox.team-channels` `room.toolbox.uploaded-files-list` `room.toolbox.ai-actions` `room.toolbox.start-video-call` `room.toolbox.start-voice-call` `room.apps.toolbox-inject` `room.header.title-open-info` `room.header.favorite` `room.header.topic-add`

另：02 `user.*` / `nav.*` / `sidebar.filter.*` / `sidebar.group.collapse` / `sidebar.sidepanel.*` 不是本猎取基线，但侧栏组头折叠已覆盖。

### 03 `implicit.*`（44）

`implicit.roomInfo.kebab.open` `implicit.roomInfo.action.edit` `implicit.roomInfo.action.hide` `implicit.roomInfo.action.leave` `implicit.roomInfo.action.delete` `implicit.roomInfo.action.moveToTeam` `implicit.roomInfo.action.convertToTeam` `implicit.editRoomInfo.save` `implicit.editRoomInfo.reset` `implicit.editRoomInfo.back` `implicit.draft.persistLocal` `implicit.draft.flushServer` `implicit.draft.restore` `implicit.upload.dragEnterOverlay` `implicit.upload.dropFiles` `implicit.upload.dragDisabledOverlay` `implicit.upload.composerChipPreview` `implicit.upload.modalConfirm` `implicit.upload.progressBanner` `implicit.typing.start` `implicit.typing.stop` `implicit.typing.display` `implicit.quote.barDisplay` `implicit.quote.dismissOne` `implicit.quote.fromUrl` `implicit.header.toggleFavorite` `implicit.header.addTopicLink` `implicit.header.parentRoomBack` `implicit.unread.jumpToFirst` `implicit.unread.markAllRead` `implicit.select.composerReplace` `implicit.select.toggleMessage` `implicit.select.clear` `implicit.select.selectAll` `implicit.scroll.newMessagesButton` `implicit.scroll.jumpToRecent` `implicit.scroll.loadPrevious` `implicit.banner.announcementOpen` `implicit.banner.retentionWarning` `implicit.recording.cancel` `implicit.recording.finish` `implicit.composer.hint.editing` `implicit.composer.hint.e2eeUnencrypted` `implicit.layout.closeFlexTabOnClick`

### 06 `sidebar.roomMenu.*`（12）

`sidebar.roomMenu.trigger` `sidebar.roomMenu.hide` `sidebar.roomMenu.toggleRead` `sidebar.roomMenu.toggleFavorite` `sidebar.roomMenu.leave` `sidebar.roomMenu.hide.denied.omni` `sidebar.roomMenu.leave.denied` `sidebar.roomMenu.hideDefaultOptions` `sidebar.roomMenu.v2.notifications-toggle` `sidebar.roomMenu.v2.notifications-prefs` `sidebar.roomMenu.priority.unprioritized` `sidebar.roomMenu.priority.set`

### 06 `room.*`（面板内部，不是 chrome）

06 表体 `room.*` + `sidebar.roomMenu.*` = 306（`rg -c '^\| (room\.|sidebar\.roomMenu\.)'`）。前缀库存（表体）：`room.info` 63、`room.members` 44、`room.quick` 31、`room.search` 17、`room.prune` 17、`room.export` 15、`room.teamChannels` 15、`room.notif` 15、`room.files` 14、`room.canned` 10、`room.contact` 10、`room.outlook` 8、`room.threads` 8、`room.calls` 7、`room.banned` 6、`room.game` 6、`room.autotranslate` 4、`room.discussions` 4。这些是打开 Members/Files/Info/… **之后** 的内部控件，本猎取不当成缺口。

---

## 挂载树（VERIFY）

| 问题 | 结论 | 出处 |
|------|------|------|
| Header 分发 | invite → `RoomInviteHeader`（藏 toolbox）；`t==='l'` → `OmnichannelRoomHeader`；加密且 `!E2E_Allow_Unencrypted_Messages` → `RoomHeaderE2EESetup`；否则 `RoomHeader` | `Header.tsx:16-38` |
| 房间体分发 | invite 订阅 → `RoomInvite`；否则 `RoomLayout` + `ClassificationBanner` + `RoomBody` 或 `RoomE2EESetup`；可包 `MediaCallRoom` | `Room.tsx:42-67` |
| 公告 | `room.announcement` 且非 embedded → `RoomAnnouncement`；点 banner 开 modal，点 `<a href>` 跟链接；**无 dismiss** | `RoomBody.tsx:164`；`RoomAnnouncement.tsx:34-60` |
| 已有 topic | `MarkdownText` 只读；无「编辑主题」点击；正文里的 `<a>` 可跟链接 | `RoomTopic.tsx:36`；`MarkdownTextInner.tsx:35` |
| Retention 条 | 列表上方 `Bubble role=alert` **无 onClick** | `RetentionPolicyWarning.tsx:15-20` |
| ABAC 分类条 | `role=region` 只读，**无按钮** | `ClassificationBanner.tsx:31-50` |
| 未读 divider | `MessageDivider unreadLabel=Unread_Messages` **不可点** | `MessageListItem.tsx:64-70`；10 已记 |
| 未加入预览 | `!canPreview` 时列表换成 `You_must_join_to_view_messages_in_this_channel`；Join 在 composer | `RoomBody.tsx:71-85,193-197` |
| Follow 房间 | **无** `rooms.follow` / `Follow_room` 控件 | `rg followRoom\|Follow_room` client = 0 |
| 讨论父房 | `ParentDiscussion` `Back_to__roomName__channel` | 03 `implicit.header.parentRoomBack` |
| 团队子房 | `ParentTeam` `Back_to__roomName__team` — **02/03 未收** | `ParentTeam.tsx:58-63` |
| 置顶顶栏 | **无** pinned top bar 组件 | `rg PinnedBar\|RoomPinned` client = 0 |
| 侧栏拖拽 | `-webkit-user-drag: none`；无 DnD 重排 | `SidebarRegion.tsx:17,83` |
| 房间行 kebab | 06 `sidebar.roomMenu.*` | `RoomMenu.tsx` |
| 从房间建讨论 | composer More→Discussion；顶栏 Create_new→Discussion | 03 `composer.action.create-discussion`；02 `nav.create.discussion` |
| Header 邀请他人 | **无** 独立「邀请」钮；加成员走 06 `room.members.add.*` | `RoomInviteHeader` 只藏 toolbox |
| E2EE 口令页 | 10 `tl.e2ee.*`；toolbox 弹层 06 `room.info.e2ee.*` | `RoomE2EESetup.tsx` |
| 来电弹层 | `VideoConfPopups`：Incoming / Outgoing / Start — **02 只到「弹层出现」** | `TimedVideoConfPopup.tsx:68-76` |
| 侧栏来电钮 | 行内 phone / phone-off，**不在 RoomMenu** | `SidebarItemTemplateWithData.tsx:99-108` |
| 打开即已读 | 焦点 + unread mark 可见 → `POST /v1/subscriptions.read`；Esc 无条件 mark | `readStateManager.ts:92-157` |
| Omni 房间头残留 | 从 directory/current-chats 进来有 `Back`；未验证 Tag 可点 | `OmnichannelRoomHeader.tsx:23-31`；`OmnichannelVerificationTag.tsx:16-19` |

---

## 确认已覆盖

猎取清单里已经有稳定 id 的项。不复行。

| 猎取项 | 已有 id | 册 | 证明 |
|--------|---------|-----|------|
| 公告展开 / Enter/Space | `implicit.banner.announcementOpen` | 03 | `RoomAnnouncement.tsx:18-60`；点 banner 开 `GenericModal title=Announcement` |
| 公告内链接 | 同上（03 写「点链接则跟链接」） | 03 | `handleClick` 遇 `href` 直接 return，跟 `<a>` |
| 公告 dismiss | **无控件**（modal `Close` 属于展开行） | 03 | banner 无 ×；关 modal 不消 banner |
| 无主题「添加主题」 | `room.header.topic-add` / `implicit.header.addTopicLink` | 02/03 | `RoomTopic.tsx:28-33` |
| 已有 topic 本体（无链接） | 02/03 已 SKIP「只读 Markdown 无点击」 | 02/03 | `RoomTopic.tsx:36` 无 onClick |
| Retention 警告展示 | `implicit.banner.retentionWarning` | 03 | `RetentionPolicyWarning.tsx:15-20` **无按钮** |
| Retention Info 内 callout | 06 Room Info 展示；策略字段 `room.info.field.retention-*` | 06 | `RetentionPolicyCallout.tsx:15-19` 无按钮 |
| 归档页脚 | `composer.variant.archived` | 03 | `ComposerArchived.tsx`；Info 内 `Room_archived` Callout 是 06 面板 |
| 只读页脚 + Join | `composer.variant.read-only` / `composer.join` | 03 | `ComposerReadOnly.tsx` |
| 联邦不能发 | `composer.variant.federation.*` | 03 | `ComposerFederation*.tsx` |
| 联邦来源徽章 | 02 边界：与 Encrypted/Translate 同属只读徽章 | 02 | `FederatedRoomOriginServer.tsx:16-19` 无 onClick |
| Encrypted / Translate 徽章 | 02 边界「只读，无点击」 | 02 | `Encrypted.tsx` `Translate.tsx` |
| E2EE 口令进入/保存/回首页/文档 | `tl.e2ee.save-password` `tl.e2ee.enter-password` `tl.e2ee.back-home` `tl.e2ee.learn-more` | 10 | `RoomE2EESetup.tsx` `RoomE2EENotAllowed.tsx` |
| E2EE 开关确认/重置 | `room.info.e2ee.*` | 06 | `EnableE2EEModal` / `DisableE2EEModal` / `ResetKeysE2EEModal` |
| 未读条跳转 / 标已读 | `implicit.unread.jumpToFirst` `implicit.unread.markAllRead`；10 `tl.unread.jump` `tl.unread.mark-read` | 03/10 | **不重复** |
| 未读 divider / 日期 Bubble | 10「不可点」 | 10 | `MessageListItem.tsx:64-70` |
| 新消息 / 跳回最新 | `implicit.scroll.newMessagesButton` `implicit.scroll.jumpToRecent`；10 `tl.chrome.*` | 03/10 | `JumpToRecentMessageButton.tsx` |
| Join（composer） | `composer.join` `composer.state.join.preview` | 03/11 | `MessageBox.tsx:506-509` |
| Join with password | `composer.variant.join-password` `composer.state.join.password` | 03/11 | `ComposerJoinWithPassword.tsx` |
| Omni Join | `omni.agent.join` `composer.state.join.omni` | 08/11 | `ComposerOmnichannelJoin.tsx` |
| Follow/Unfollow **房间** | **不存在**（只有线程 follow） | 01/06 | `msg.thread.follow` `room.threads.follow-*`；无 `Follow_room` |
| 讨论回父房 | `implicit.header.parentRoomBack` | 03 | `ParentDiscussion.tsx:28-32` |
| 置顶列表入口 | `room.toolbox.pinned-messages` | 02 | **无** 房间顶 pinned bar |
| 侧栏 RoomMenu | `sidebar.roomMenu.*` | 06 | hide / toggleRead / favorite / leave / V2 通知 / omni 优先级 |
| 侧栏组头折叠 | `sidebar.group.collapse` | 02 | `useCollapsedGroups.ts` |
| 关未读角标（偏好） | `room.notif.show-counter` | 06 | 面板内 `hideUnreadStatus`；行上 badge **不可点** `UnreadBadge.tsx:15-22` |
| 从房间建讨论 | `composer.action.create-discussion` `nav.create.discussion` | 03/02 | **无** 房间头独立「创建讨论」 |
| Header 邀请他人 | `room.members.add.submit` `room.members.invite-*` | 06 | Header **无** 独立 Invite 钮 |
| 发起视频/语音 | `room.toolbox.start-video-call` `room.toolbox.start-voice-call` `nav.voip.call` | 02 | 02 只到「弹层出现」；**弹层内部**见本册 NEW |
| 全局 VoIP Incoming/Outgoing widget | `nav.voip.call` / `room.toolbox.start-voice-call`（入口） | 02 | `IncomingCall.tsx` 是全局 widget，不是房间 chrome |
| Omni 未知联系人 callout | `omni.agent.unknown-contact` | 08 | `ComposerOmnichannelCallout.tsx` |
| Omni 挂起 Resume | `room.quick.resume` `omni.agent.resume` | 06/08 | composer，非房间 banner |
| Omni QuickActions | `room.quick.*` | 06 | moveQueue / forward / transcript / close / onHold |
| ABAC 属性在 Info 面板 | `RoomInfoABACSection` 在 06 Info 内部（只读展示，无独立 id） | 06 | `RoomInfo.tsx:130` — 面板内部，不猎 |

---

## 表 A — `room.chrome.*`

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
|---|---|---|---|---|---|---|---|
| room.chrome.topic-link | 已有主题时点主题里的 markdown 链接 | `房间头→主题 Markdown 内 <a>` | `room.topic` 非空且解析出 href `RoomTopic.tsx:36`；`MarkdownTextInner.tsx:35` | DOM: [读] 跟链（内链改路由 / 外链新标签）`[待渲染实测]` name；endpoint: 无房间 REST；persist: 导航 URL 刷新仍在 | `room.topic` | `room.header.topic-add` | `RoomTopic.tsx:36`；`MarkdownTextInner.tsx:35,119-143` |
| room.chrome.parent-team | 从团队子房回到团队主房 | `房间头左→arrow-back-up title=Back_to__roomName__team` | `room.teamId && !room.teamMain`；公开团队 **或** 自己在该团队；`teamInfo` 未 error `ParentTeam.tsx:13-56` | DOM: [读] IconButton title 该 i18n；进团队主房；endpoint: [读] `GET` team info / user teams；persist: 刷新停在主房 URL | `teamId` `roomId` | `implicit.header.parentRoomBack` | `ParentTeam.tsx:45-63`；`ParentRoom.tsx:13-14` |
| room.chrome.foreword.user-link | DM 前言点对方名进其 1:1 | `时间线顶 RoomForeword→对方 Tag` | 仅 DM；`usernames` 去掉自己后 length≥1 `RoomForeword.tsx:22-24` | DOM: [读] `Tag` `data-username` `href=/direct/{username}`；进该 DM；endpoint: [读] `GET /v1/users.info` 填显示名；persist: DM URL | `room.usernames` | `user.action.direct-message` | `RoomForewordUsernameList.tsx:15-19`；`RoomForewordUsernameListItem.tsx:17` |
| room.chrome.sidebar.open-marks-read | 打开（或聚焦）未读房并在未读线可见时标已读 | `侧栏行→进房`（或窗口 focus，未读 divider 在视口） | 有 subscription 且 unread 或 alert；`document.hasFocus`；未读 mark 可见；无 `unreadNotLoaded` `readStateManager.ts:120-138` | DOM: [读] 行 `data-unread` / badge 消失；endpoint: [读] `POST /v1/subscriptions.read` `{rid}`；persist: 刷新无未读角标 | `subscription.unread` `ls` | `sidebar.roomMenu.toggleRead`；`tl.unread.mark-read` | `readStateManager.ts:59-61,120-157`；`SidebarItemTemplateWithData.tsx:117-127` |
| room.chrome.escape-mark-read | 在已开房间按 Esc 标已读 | 焦点不在 input 时 → `Escape` | `useReadMessageWindowEvents` 已挂；有 subscription `readStateManager.ts:97-101` | DOM: [读] 未读条/角标按 server 清；endpoint: [读] `POST /v1/subscriptions.read`；persist: 刷新已读 | 同上 | `implicit.unread.markAllRead` | `readStateManager.ts:97-101,149-157`；`useReadMessageWindowEvents.ts:7-10` |
| room.chrome.sidebar.call-accept | 侧栏行接听来电 | 该行有 incoming videoconf → 行内 success `phone` | `useVideoConfIncomingCalls()` 含 `call.rid===item.rid` `RoomListRow.tsx:30-37` | DOM: [读] 行内 `SidebarV2Action` phone；弹层消失并进会；endpoint: [读] 信令 accept + `POST /v1/video-conference.join`；persist: Calls 列表刷新可见 `[待渲染实测]` | `callId` `rid` | `room.chrome.call.incoming.accept` | `SidebarItemTemplateWithData.tsx:99-108`；V2 `SidebarItemWithData.tsx:52-56` |
| room.chrome.sidebar.call-reject | 侧栏行拒接来电 | 同上 → danger `phone-off` | 同上 | DOM: [读] phone-off；来电图标消失；endpoint: [读] 信令 `rejected`（无 REST）；persist: 无会议记录 | `callId` | `room.chrome.call.incoming.decline` | `RoomListRow.tsx:36`；`VideoConfManager.ts:219-228` |
| room.chrome.call.incoming.accept | 房间来电弹层接听 | 来电 `VideoConfPopup aria-label=Incoming_call_from__roomName__` → `Accept` | `isReceiving` `TimedVideoConfPopup.tsx:68-69` | DOM: [读] `button` name=`Accept`；弹层关、开会 URL；endpoint: [读] 信令 accepted + `POST /v1/video-conference.join` `{callId,state.mic/cam}`；persist: Calls 刷新 | `callId` capabilities | `room.toolbox.start-video-call` | `IncomingPopup.tsx:48-86`；`VideoConfManager.ts:176-216,342-375` |
| room.chrome.call.incoming.decline | 房间来电弹层拒绝 | 同上 → `Decline` | 同上 | DOM: [读] `button` name=`Decline`；弹层消失；endpoint: [读] 信令 rejected；persist: 无 | `callId` | `room.chrome.sidebar.call-reject` | `IncomingPopup.tsx:87-90`；`TimedVideoConfPopup.tsx:50-53` |
| room.chrome.call.incoming.mute | 静音并关掉来电提示（不拒接） | 同上 → title=`Mute_and_dismiss` | 同上 | DOM: [读] Controller icon=cross title 该 i18n；弹层消失，通话仍可从侧栏再出现 `[待渲染实测]`；endpoint: [读] `dismissIncomingCall`（本地 dismissed）；persist: session | `callId` | `room.chrome.call.incoming.decline` | `IncomingPopup.tsx:92`；`TimedVideoConfPopup.tsx:59-61` |
| room.chrome.call.incoming.toggle-cam | 接听前开关摄像头偏好 | 来电弹层 → title=`Cam_on`/`Cam_off` | `video-conference.info` 报 `capabilities.cam` `IncomingPopup.tsx:45-67` | DOM: [读] Controller 双态 title；endpoint: 无 REST（`setPreferences`）；persist: 偏好进随后 join state | capabilities | `room.chrome.call.start.toggle-cam` | `IncomingPopup.tsx:60-66` |
| room.chrome.call.incoming.toggle-mic | 接听前开关麦克风偏好 | 同上 → `Mic_on`/`Mic_off` | `capabilities.mic` | DOM: [读] 双态 title；endpoint: 无 REST；persist: join state.mic | capabilities | `room.chrome.call.start.toggle-mic` | `IncomingPopup.tsx:68-74` |
| room.chrome.call.outgoing.cancel | 取消正在呼出的视频 | `Calling__roomName__` 弹层 → `Cancel` | `isCalling` `TimedVideoConfPopup.tsx:72-73` | DOM: [读] `button` name=`Cancel`；弹层关；endpoint: [读] `abortCall`/`giveUp`（信令，非 start REST 回滚）`[待渲染实测]`；persist: 无进行中呼叫 | `callId` | `room.toolbox.start-video-call` | `OutgoingPopup.tsx:67`；`VideoConfManager.ts:378-384` |
| room.chrome.call.start.confirm | 确认开始视频会议 | 点 `Video_call` 后 `Start_a_call` 弹层 → `Start_call` | 非 receiving/calling；`!loading` `StartCallPopup.tsx:100` | DOM: [读] `button` name=`Start_call`；弹层变 Calling 或直接进会；endpoint: [读] `POST /v1/video-conference.start` `{roomId,allowRinging:true}`；persist: Calls 刷新 | `rid` | `room.toolbox.start-video-call` | `StartCallPopup.tsx:49-102`；`VideoConfManager.ts:140-174` |
| room.chrome.call.start.toggle-cam | 开始前开关摄像头 | Start 弹层 → `Cam_on`/`Cam_off` | `useVideoConfCapabilities().cam` | DOM: [读] 双态；endpoint: 无 REST；persist: 写入 preferences 后 start | capabilities | `room.chrome.call.incoming.toggle-cam` | `StartCallPopup.tsx:76-83` |
| room.chrome.call.start.toggle-mic | 开始前开关麦克风 | 同上 → `Mic_on`/`Mic_off` | `capabilities.mic` | DOM: [读] 双态；endpoint: 无 REST；persist: 同 cam | capabilities | `room.chrome.call.incoming.toggle-mic` | `StartCallPopup.tsx:84-90` |
| room.chrome.call.start.dismiss | 不开始、关掉 Start 弹层 | Start 弹层外点 **或** Escape | `!loading` 才响应 outside click `StartCallPopup.tsx:35` | DOM: [读] 弹层消失；endpoint: `dismissOutgoing` 无 REST；persist: 无会议 | — | `room.chrome.call.start.confirm` | `StartCallPopup.tsx:35,61-64`；`TimedVideoConfPopup.tsx:76` |
| room.chrome.omni.back | 从目录/当前会话进 live 房后回到该页 | live 头左 → title=`Back` | `previousRouteName` ∈ `{omnichannel-directory,omnichannel-current-chats}` `OmnichannelRoomHeader.tsx:23-27` | DOM: [读] `HeaderToolbarAction` title=`Back`；回 directory/current-chats 且 `tab=chats&context=info`；endpoint: none 路由；persist: URL | previous route | `omni.agent.directory.chats.open` | `BackButton.tsx:12-38` |
| room.chrome.omni.unverified-tag | 点未验证标签打开高级联系人 upsell | live 头标题旁 `Unverified` Tag | `!verified` 且有 onClick；已验证则不可点 `OmnichannelVerificationTag.tsx:14-19` | DOM: [读] Tag name=`Unverified`；dialog `Advanced_contact_profile`；Confirm=订阅 / Cancel=`Learn_more` 或关；endpoint: [读] 打开可 `POST /v1/statistics.telemetry` upsell 计数；persist: 无房间字段 | license `contact-id-verification` | `omni.agent.unknown-contact` | `OmnichannelRoomHeaderTag.tsx:14`；`AdvancedContactModal.tsx:16-49` |
| room.chrome.voip.toggle-chat | 进行中语音条里显隐聊天 | 1:1 DM 且 ongoing + screen-share 能力 → 条上 `ActionToggleChat` | `MediaCallRoom`：`state==='ongoing'` 且 peer 在 `room.uids` 且 features 含 `screen-share` `MediaCallRoom.tsx:40-47` | DOM: [读] section `aria-label=Voice_call`；聊天体消失/再现；endpoint: none；persist: **刷新不持久**（useState） | voip session | `room.toolbox.start-voice-call` | `MediaCallRoomActivity.tsx:31-49`；`MediaCallRoomSection.tsx:97` |
| room.chrome.voip.mute | 房间语音条静音 | 同上 → `Mute`/`Unmute` | 同上 | DOM: [读] ToggleButton 双态；endpoint: voip 信令 `onMute`；persist: 通话中 | session `muted` | `nav.voip.call` | `MediaCallRoomSection.tsx:110` |
| room.chrome.voip.hold | 房间语音条保持 | 同上 → `Hold`/`Resume` | 同上 | DOM: [读] 双态；endpoint: `onHold`；persist: 通话中 | `held` | `room.chrome.voip.mute` | `MediaCallRoomSection.tsx:111-117` |
| room.chrome.voip.share-screen | 房间语音条共享屏幕 | 同上 → `Share_screen`/`Stop_sharing_screen` | 同上（本条出现的前提就是 screen-share） | DOM: [读] 双态；endpoint: `onToggleScreenSharing`；persist: 通话中 | `localScreen.active` | `room.chrome.voip.toggle-chat` | `MediaCallRoomSection.tsx:118-124` |
| room.chrome.voip.forward | 房间语音条转接 | 同上 → `Forward` | disabled 当 connecting/reconnecting | DOM: [读] `button` name=`Forward`；转接 UI `[待渲染实测]`；endpoint: `onForward`；persist: 视转接结果 | connectionState | `room.chrome.voip.hangup` | `MediaCallRoomSection.tsx:125` |
| room.chrome.voip.popout | 语音条弹出/收回独立窗 | 同上 → `Open_in_new_window`/`Return_to_main_window` | 同上 | DOM: [读] 双态；popout 时条换成 `PopoutDockPrompt`；endpoint: `onOpenPopout`/`onClosePopout`；persist: 通话中 | `currentViews.has('popout')` | `room.chrome.voip.toggle-chat` | `MediaCallRoomSection.tsx:98-105,88` |
| room.chrome.voip.hangup | 房间语音条挂断 | 同上 → `Voice_call__user__hangup` | 同上 | DOM: [读] danger phone-off；整条 `Voice_call` 消失；endpoint: `onEndCall`；persist: Call_history 可重放 `[待渲染实测]` | peer displayName | `room.toolbox.start-voice-call` | `MediaCallRoomSection.tsx:126` |

**A 计数**：26。

---

## 表 B — `room.banner.*`

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
|---|---|---|---|---|---|---|---|
| room.banner.abac-classification | 展示 ABAC 分类条（只读，无按钮） | 打开 `abacAttributes` 非空且 banner 配置启用的房间 → 看 header 上 `role=region` | `ABAC_Classification_Banners_Enabled` + `useIsABACManagedRoom` + config.`enabled` `ClassificationBanner.tsx:14-25` | DOM: [读] `region` `aria-label=ABAC_Room_Attributes` 文案=engine 拼接；**无 button**；endpoint: none；persist: 随房间属性刷新仍在 | `room.abacAttributes`；setting JSON | 06 `RoomInfoABACSection`（面板内） | `ClassificationBanner.tsx:31-50`；`Room.tsx:58` |

**B 计数**：1。公告/retention/归档/只读/联邦/E2EE 条见「确认已覆盖」。归档/只读/联邦 **没有** 房间体独立 banner 按钮（composer 页脚已在 03）。

---

## 表 C — `room.join.*`

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
|---|---|---|---|---|---|---|---|
| room.join.preview-blocked | 未加入且无预览权时挡住时间线 | 打开公开频道、无订阅、无 `preview-c-room`、匿名读关 → 看列表区 | `room.t==='c'` 且 `!subscribed` 且 `!Accounts_AllowAnonymousRead` 且 `!preview-c-room` `RoomBody.tsx:71-85` | DOM: [读] 文案 `You_must_join_to_view_messages_in_this_channel`（非 button）；Join 仍在 composer；endpoint: none（看）；persist: 加入前刷新仍挡 | `canPreview` | `composer.join` | `RoomBody.tsx:193-197` |
| room.join.invite.accept | 接受房间/联邦邀请 | 打开 `isInviteSubscription` 的房 → `Accept` | Header 走 `RoomInviteHeader`（toolbox 藏）；body `RoomInviteBody` `Room.tsx:42-46` | DOM: [读] `button` name=`Accept`；States `Message_request` 消失，进正常房间；endpoint: [读] `POST /v1/rooms.invite` `{roomId,action:'accept'}`；persist: 订阅不再是 invite，刷新可聊天 | `subscription.inviter` | `room.join.invite.reject` | `RoomInvite.tsx:26,53`；`useRoomInvitation.ts:10-11`；`rooms.ts:1544-1565` |
| room.join.invite.reject | 拒绝邀请（先确认） | 同上 → `Reject` → dialog `Reject_invitation` 确认 | 同上；确认后才 mutate | DOM: [读] `button` name=`Reject`；danger modal title=`Reject_invitation`；确认后回 `/home`（`useGoToHomeOnRemoved`）；endpoint: [读] `POST /v1/rooms.invite` `{action:'reject'}`；persist: 邀请刷新不在 | room.t 决定文案 DM vs channel | `room.join.invite.accept` | `RoomInviteBody.tsx:33-35`；`useRoomRejectInvitationModal.tsx:30-47` |
| room.join.invite.federation-learn | 联邦邀请页打开联邦文档 | 联邦邀请 States → `Learn_more_about_Federation` | `isRoomFederated(room)` 才传 `infoLink` `RoomInvite.tsx:28` | DOM: [读] `StatesLink` 该 i18n；新标签 `links.go.matrixFederation`；endpoint: 无 RC REST；persist: 无 | federated | `composer.variant.federation.*` | `RoomInvite.tsx:28`；`RoomInviteBody.tsx:40` |

**C 计数**：4。composer Join / Join_with_password / omni Join 见「确认已覆盖」。**无** Follow/Unfollow 房间控件。

---

## 验算

| 表 | 行数 | 算法 |
|----|------|------|
| A chrome | 26 | topic-link + parent-team + foreword + sidebar 已读 2 + sidebar 来电 2 + incoming 5 + outgoing 1 + start 4 + omni 2 + voip 7 = 26 |
| B banner | 1 | ABAC 分类条（其余 banner 已覆盖或无按钮） |
| C join | 4 | preview-blocked + invite accept/reject/learn |
| **合计 NEW** | **31** | `26+1+4=31` |

`1+2+3+2+2+5+1+4+2+7=29` 再加 topic-link 与 parent-team 已计入 A 的 26：`1(topic)+1(team)+1(foreword)+2+2+5+1+4+2+7=26`。`26+1+4=31`。

---

## 猎取项对照（空表不允许，本册非空）

| 猎取项 | 处置 |
|--------|------|
| 公告 expand / link / dismiss | 已覆盖 `implicit.banner.announcementOpen`；无 dismiss |
| Topic 已存在 | NEW `room.chrome.topic-link`（有链接）；无链接则只读 |
| Retention callout 动作 | 已覆盖；**无动作** |
| 归档 / 只读 / 联邦 / E2EE-setup / ABAC | 前四已覆盖；ABAC 条 NEW `room.banner.abac-classification`（无按钮） |
| 未读 divider / jump | 已覆盖 `tl.unread.*` / `implicit.unread.*`；divider 不可点 |
| 未加入预览 / Join / 口令 / Follow 房 | NEW `room.join.preview-blocked`；Join 已覆盖；Follow 房不存在 |
| 讨论回父房 | 已覆盖 `implicit.header.parentRoomBack` |
| 团队头额外 | NEW `room.chrome.parent-team` |
| 来电/去电 toast | NEW `room.chrome.call.*` + 侧栏接听/拒接 |
| 置顶顶栏 | **不存在** |
| 侧栏行（非 RoomMenu） | NEW 打开标已读 / Esc 标已读 / 来电钮；badge 不可点；无拖拽；组头已覆盖 |
| 从房间建讨论 | 已覆盖 composer/nav，无独立头钮 |
| Header 邀请他人 | 无独立钮；邀请**接受/拒绝** NEW `room.join.invite.*` |
| E2EE 口令 | 已覆盖 10/06 |
| Omni 房间残留 | NEW Back + Unverified tag；其余 08/06 |

---

## [待渲染实测] 汇总

1. `room.chrome.topic-link`：主题截断后链接是否仍可点、内链 vs 外链 role。
2. `room.chrome.parent-team`：公开团队非成员是否真的隐藏按钮。
3. `room.chrome.sidebar.open-marks-read`：未读 divider 不在视口时打开房间是否 **不** 立刻已读。
4. `room.chrome.escape-mark-read`：焦点在 textarea 时 Esc 是否被 composer 吃掉而不 mark。
5. VideoConf 弹层 `Accept`/`Decline`/`Start_call` 的精确 role+name（Fuselage `VideoConfButton`）。
6. `Mute_and_dismiss` 之后侧栏来电钮是否仍在。
7. `room.chrome.omni.unverified-tag`：已验证 Tag 是否完全不可点；upsell vs Learn_more 两态 dialog name。
8. `room.join.invite.*`：Accept 后 toolbox 是否立刻出现；Reject modal 取消是否留在邀请页。
9. `MediaCallRoomActivity` 各 ToggleButton 的 accessible name。
10. `room.join.preview-blocked` 文案容器的 role（源码是 `div`）。

---

## 计数证据

```text
# 基线
git rev-parse --abbrev-ref HEAD
# cursor/pm-atlas-merge-06-11-f8ed（本文件从该合并枝写出）

rg -c '^\| room\.' docs/qa/pm-feature-atlas/02-room-user-nav.md
# 33

rg -c '^\| `implicit\.' docs/qa/pm-feature-atlas/03-composer-implicit.md
# 44

rg -c '^\| sidebar\.roomMenu\.' docs/qa/pm-feature-atlas/06-room-panel-interiors.md
# 12

rg -c '^\| (room\.|sidebar\.roomMenu\.)' docs/qa/pm-feature-atlas/06-room-panel-interiors.md
# 306

# 本猎取源码
rg -l 'RoomAnnouncement|ClassificationBanner|ParentTeam|RoomInviteBody|IncomingPopup|MediaCallRoomActivity|You_must_join_to_view' apps/meteor/client/views/room
find apps/meteor/client/views/room/Header -name '*.tsx' | wc -l
# 42（与 03 计数证据同）
rg 'followRoom|Follow_room|Unfollow_room' apps/meteor/client --glob '*.{ts,tsx}' | wc -l
# 0
rg 'PinnedBar|pinned top' apps/meteor/client --glob '*.{ts,tsx}' | wc -l
# 0
```

---

## 本分册 id 列表

1. room.chrome.topic-link
2. room.chrome.parent-team
3. room.chrome.foreword.user-link
4. room.chrome.sidebar.open-marks-read
5. room.chrome.escape-mark-read
6. room.chrome.sidebar.call-accept
7. room.chrome.sidebar.call-reject
8. room.chrome.call.incoming.accept
9. room.chrome.call.incoming.decline
10. room.chrome.call.incoming.mute
11. room.chrome.call.incoming.toggle-cam
12. room.chrome.call.incoming.toggle-mic
13. room.chrome.call.outgoing.cancel
14. room.chrome.call.start.confirm
15. room.chrome.call.start.toggle-cam
16. room.chrome.call.start.toggle-mic
17. room.chrome.call.start.dismiss
18. room.chrome.omni.back
19. room.chrome.omni.unverified-tag
20. room.chrome.voip.toggle-chat
21. room.chrome.voip.mute
22. room.chrome.voip.hold
23. room.chrome.voip.share-screen
24. room.chrome.voip.forward
25. room.chrome.voip.popout
26. room.chrome.voip.hangup
27. room.banner.abac-classification
28. room.join.preview-blocked
29. room.join.invite.accept
30. room.join.invite.reject
31. room.join.invite.federation-learn

`1–31` = 31 = `26+1+4`。

---

## 边界

- **不收**：06 面板内部、01 消息工具、03 composer 入口/变体、08 omni 产品面、10 时间线、07 页内、全局 VoIP widget 内部（入口已在 02）。
- **不存在**：Follow/Unfollow 房间、pinned 顶栏、侧栏拖拽重排、Header「邀请他人」、房间头「创建讨论」。
- **只读无点击（不建 id）**：Encrypted/Translate/联邦来源徽章、Retention/归档 Info callout、未读 divider、未读角标本体、已有 topic 无链接文本、ABAC Info 段（06 内部）。
- **02 入口未炸开、本册补内部**：`room.toolbox.start-video-call` 的 Start/Incoming/Outgoing 弹层；侧栏来电钮。

---

## 与现行 atlas

NEW id 均不在 01–11。交叉只互指：`implicit.header.parentRoomBack`（讨论）vs `room.chrome.parent-team`（团队）；`composer.join` vs `room.join.preview-blocked` / `room.join.invite.*`；`tl.unread.*` 不复行；`omni.agent.unknown-contact` vs `room.chrome.omni.unverified-tag`（composer callout vs 房间头 Tag）。
