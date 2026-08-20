# PM Feature-Test Atlas 02 — Room / User / Nav chrome

- 仓库：`jianwyao01/Rocket.Chat`（fork of RocketChat/Rocket.Chat）
- 默认分支：**develop**（`git symbolic-ref refs/remotes/origin/HEAD` → `origin/develop`；当前 HEAD `e10bd504b9`）
- 本分册只覆盖房间工具箱、用户卡片/UserInfo、顶栏与侧栏 chrome。不实现产品功能。
- 现行 atlas：`baseline: empty`（`find docs -iname '*atlas*'` = 0；`docs/qa/` 原先不存在）
- 诚实标记：`[读]` = 源码推断；`[待渲染实测]` = 未在真实 UI 复核。无代码证据的行已删除。

## 挂载树（VERIFY）

| 问题 | 结论 | 出处 |
|------|------|------|
| Header vs HeaderV2 | **只挂载 `Header`，仓库无 HeaderV2 树** | `Room.tsx:12,59` `import Header from './Header'`；`find apps/meteor packages -iname '*HeaderV2*'` = 0 |
| Header 分发 | embedded+`!UI_Show_top_navbar_embedded_layout` → null；invite → `RoomInviteHeader`；`room.t==='l'` → `OmnichannelRoomHeader`；加密且 `!E2E_Allow_Unencrypted_Messages` → `RoomHeaderE2EESetup`；否则 `RoomHeader` | `Header.tsx:16-38` |
| RoomToolbox 消费 | `RoomHeader` 把 `RoomToolbox` 放进 `HeaderToolbar aria-label=Toolbox_room_actions` | `RoomHeader.tsx:56-63`；`RoomToolbox.tsx:15-56` |
| 动作注册 | `roomActionHooks` 29 个 hook → `useCoreRoomActions` + `useAppsRoomActions` 合并 | `ui.ts:39-68`；`RoomToolboxProvider.tsx:71-88` |
| NavBar | 非 embedded 挂载 | `LayoutWithSidebar.tsx:59`；`NavBar.tsx:8-16` |
| 侧栏 V1 vs V2 | `FeaturePreview secondarySidebar` OFF → `client/sidebar/Sidebar`；ON → `NavigationRegion` | `LayoutWithSidebar.tsx:67-76` |
| 搜索 V1 vs AI | `FeaturePreview aiSearch` OFF → `NavBarSearch`；ON → `NavBarAISearch` | `NavBarNavigation.tsx:18-25` |
| 无 `newNavigation` 标识 | 布局切换键是用户偏好 `featuresPreview.secondarySidebar` / `aiSearch` | `useFeaturePreviewList` + `LayoutProvider.tsx:26` |

E2EE 设置态工具箱子集：`roomActionHooksForE2EESetup` = channel-settings / members-list / e2e（`ui.ts:79`；`RoomToolboxE2EESetup.tsx`）。

## 房间工具箱共享规则

- **可见/溢出**：`featured` 始终露在工具栏；普通动作在 `roomToolboxExpanded`（`lg+`，`LayoutProvider.tsx:88`）时取前 6 个，其余 + 全部 `type==='apps'` 进 kebab `title=Options`（`useRoomToolboxActions.ts:15-20`；`RoomToolbox.tsx:54`）。
- **Provider 后过滤**（每条 toolbox 行都叠加）：登录 `uid` 或（`Accounts_AllowAnonymousRead` 且 `action.anonymous`）；`groups` 含 `getRoomGroup(room)`；不在 `hiddenActions.roomToolbox`（`RoomToolboxProvider.tsx:77-86`；`getRoomGroup.ts:11-20`：`teamMain→team`，`d` 且 `uids>2→direct_multiple`，否则 `c/p/d/l→channel/group/direct/live`）。
- **默认点击**：`openTab(id)` 写路由 `tab`/`context`（`RoomToolboxProvider.tsx:27-48`）。再点同一 tab 则 `closeTab`（`:28-29`）。
- **入口缩写**：`房间头→工具栏` = `HeaderToolbar[aria-label=Toolbox_room_actions]`；溢出 = `房间头→工具栏→Options`。

---

## 表 A — Room toolbox（`room.*`）

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
|---|---|---|---|---|---|---|---|
| room.toolbox.channel-settings | 打开频道/私有组房间信息侧栏 | `房间头→工具栏→Room_Info`；溢出 `…→Options→Room_Info`；兼 `房间头→房间标题`（非 team/DM/live） | hook: none `useChannelSettingsRoomAction.ts:7-18`；groups∈{channel,group}；anonymous 可读 | DOM: [待渲染实测] complementary/dialog name≈Room_Info 出现，再点同一按钮消失；endpoint: [读] 打开用房间上下文，编辑 `POST /v1/rooms.saveRoomSettings` `EditRoomInfo.tsx`；persist: [读] URL `tab=channel-settings`，刷新由 `RoomToolboxProvider.tsx:90-102` 重开 | `useChannelSettingsRoomAction.ts:8-17` | `RoomToolbox.tsx:19-46` | `ui.ts:40` |
| room.toolbox.team-info | 打开团队信息侧栏 | `房间头→工具栏→Teams_Info`；溢出 `…→Options→Teams_Info`；兼 `房间头→房间标题`（teamMain） | hook: none `useTeamInfoRoomAction.ts:6-18`；groups∈{team} | DOM: [待渲染实测] complementary name≈Teams_Info；endpoint: [读] 打开用房间上下文，团队写接口 `/v1/teams.*`；persist: [读] URL `tab=team-info` | `useTeamInfoRoomAction.ts:8-16` | `RoomToolbox.tsx:19-46` | `ui.ts:41` |
| room.toolbox.user-info-group | 打开多人 DM 成员列表 | `房间头→工具栏→Members`；兼 `房间头→房间标题`（uids>2 的 d） | hook: none `useUserInfoGroupRoomAction.ts:6-17`；groups∈{direct_multiple} | DOM: [待渲染实测] complementary name≈Members；endpoint: [读] `GET /v1/im.members` 或 `GET /v1/rooms.membersOrderedByRole` `useMembersList.ts`；persist: [读] URL `tab=user-info-group` | `useUserInfoGroupRoomAction.ts:8-15` | `MemberListRouter.tsx` | `ui.ts:42` |
| room.toolbox.user-info | 打开 1:1 DM 对方资料侧栏 | `房间头→工具栏→User_Info`；兼 `房间头→房间标题`（uids≤2 的 d） | hook: none `useUserInfoRoomAction.ts:6-17`；groups∈{direct} | DOM: [待渲染实测] complementary name≈User_Info；endpoint: [读] `GET /v1/users.info` `useUserInfoQuery.ts:12`；persist: [读] URL `tab=user-info` | `useUserInfoRoomAction.ts:8-15` | `MemberListRouter.tsx` | `ui.ts:43` |
| room.toolbox.thread | 打开房间线程列表侧栏 | `房间头→工具栏→Threads`；溢出 `…→Options→Threads` | setting `Threads_enabled` 否则 undefined `useThreadRoomAction.tsx:25,36-37`；groups 无 live | DOM: [待渲染实测] complementary name=Threads，未读时 badge 出现；endpoint: [读] `GET /v1/chat.getThreadsList`；persist: [读] URL `tab=thread` | `useThreadRoomAction.tsx:40-47` | `RoomToolbox.tsx:23-37` 自定义 render | `ui.ts:44` |
| room.toolbox.autotranslate | 打开自动翻译设置侧栏 | `房间头→工具栏→Auto_Translate`；常在 Options（order=20） | permission `auto-translate` + setting `AutoTranslate_Enabled` `useAutotranslateRoomAction.ts:8-13` | DOM: [待渲染实测] complementary name=Auto_Translate；endpoint: [读] `GET /v1/autotranslate.getSupportedLanguages`，保存 `POST /v1/autotranslate.saveSettings`；persist: [读] URL tab + 订阅设置刷新仍在 | `useAutotranslateRoomAction.ts:16-25` | `RoomToolbox.tsx` | `ui.ts:45` |
| room.toolbox.calls | 打开视频会议历史侧栏 | `房间头→工具栏→Calls`；常在 Options（order=999） | license module `videoconference-enterprise` `useCallsRoomAction.ts:12,18-19`；federated 则 disabled+tooltip | DOM: [待渲染实测] complementary name=Calls（federated 时按钮 disabled）；endpoint: [读] `GET /v1/video-conference.list`；persist: [读] URL `tab=calls` | `useCallsRoomAction.ts:22-33` | `VideoConfList` | `ui.ts:46` |
| room.toolbox.canned-responses | 打开 Omnichannel 快捷回复侧栏 | live 房间 `房间头→工具栏→Canned_Responses` | license `canned-responses` + setting `Canned_Responses_Enable` `useCannedResponsesRoomAction.ts:10-15`；groups∈{live} | DOM: [待渲染实测] complementary name=Canned_Responses；endpoint: [读] `GET /v1/canned-responses`；persist: [读] URL `tab=canned-responses` | `useCannedResponsesRoomAction.ts:18-25` | Omnichannel header 共用 RoomToolbox | `ui.ts:47` |
| room.toolbox.clean-history | 打开清理历史（剪枝）侧栏 | `房间头→工具栏→Options→Prune_Messages` | permission `clean-channel-history`（room scoped）`useCleanHistoryRoomAction.ts:14,18-19`；federated disabled | DOM: [待渲染实测] complementary name=Prune_Messages；endpoint: [读] 打开无请求，提交 `POST /v1/rooms.cleanHistory`；persist: [读] 剪枝后消息刷新不在；tab URL 可重开表单 | `useCleanHistoryRoomAction.ts:22-35` | `PruneMessages` | `ui.ts:48` |
| room.toolbox.contact-profile | 打开 livechat 联系人资料 | live `房间头→工具栏→Contact_Info` | hook: none `useContactProfileRoomAction.ts:6-17`；groups∈{live} | DOM: [待渲染实测] complementary name=Contact_Info；endpoint: [读] `GET /v1/omnichannel/contacts.get`；persist: [读] URL `tab=contact-profile` | `useContactProfileRoomAction.ts:8-15` | `ContactInfoRouter` | `ui.ts:49` |
| room.toolbox.discussions | 打开讨论列表侧栏 | `房间头→工具栏→Discussions` | setting `Discussion_enabled` 且 `!room.prid` `useDiscussionsRoomAction.ts:14,18-19`；federated disabled | DOM: [待渲染实测] complementary name=Discussions；endpoint: [读] `GET /v1/chat.getDiscussions`；persist: [读] URL `tab=discussions` | `useDiscussionsRoomAction.ts:22-34` | `Discussions` | `ui.ts:50` |
| room.toolbox.e2e | 开关房间端到端加密（弹窗，无 tab） | `房间头→工具栏→Enable_E2E_encryption` 或 `Disable_E2E_encryption`；常在 Options（type=organization） | setting `E2E_Enable` + (`room.t==='d'` 或 (`edit-room` 且 `toggle-room-e2e-encryption`)) 且 E2EE ready/`room.encrypted` `useE2EERoomAction.ts:17-26,94-95`；groups 无 channel；federated disabled | DOM: [待渲染实测] dialog Enable/Disable E2EE 出现，确认后关闭且标题在 Enable/Disable 间切换；endpoint: [读] `POST /v1/rooms.saveRoomSettings` `{rid,encrypted}` `:45,74`；persist: [读] `room.encrypted` 服务端字段，刷新后图标/标题仍对 | `useE2EERoomAction.ts:98-109` | 无 tabComponent；`RoomHeader` Encrypted 徽章 | `ui.ts:51` |
| room.toolbox.export-messages | 打开导出消息侧栏 | `房间头→工具栏→Options→Export_Messages` | permission `mail-messages` `useExportMessagesRoomAction.ts:11,14-15` | DOM: [待渲染实测] complementary name=Export_Messages；endpoint: [读] 提交 `POST /v1/rooms.export`；persist: [读] URL tab；导出产物在服务端，刷新后表单空 [待渲染实测] | `useExportMessagesRoomAction.ts:18-28` | `ExportMessages` | `ui.ts:52` |
| room.toolbox.game-center | 打开 Game Center 侧栏 | `房间头→工具栏→Apps_Game_Center`（order=-1 靠前） | `GET /apps/externalComponents` 成功且 length>0 `useGameCenterRoomAction.ts:9-14` | DOM: [待渲染实测] complementary name=Apps_Game_Center；endpoint: [读] `GET /apps/externalComponents`；persist: [读] URL `tab=game-center` | `useGameCenterRoomAction.ts:17-24` | `GameCenter` | `ui.ts:53` |
| room.toolbox.banned-users | 打开房间封禁用户列表 | `房间头→工具栏→Options→Banned_Users` | permission `ban-user` `useBannedUsersRoomAction.ts:12,15-16`；groups∈{channel,group,team} | DOM: [待渲染实测] complementary name=Banned_Users；endpoint: [读] `GET /v1/rooms.bannedUsers`，解封 `POST /v1/rooms.unbanUser`；persist: [读] URL tab + 封禁记录刷新仍在 | `useBannedUsersRoomAction.ts:19-27` | `BannedUsers` | `ui.ts:54` |
| room.toolbox.members-list | 打开频道/组/团队成员列表 | `房间头→工具栏→Members` 或 `Teams_members` | broadcast 需 `view-broadcast-member-list`；非原生 federation 隐藏 `useMembersListRoomAction.ts:13-24` | DOM: [待渲染实测] complementary name=Members/Teams_members；endpoint: [读] `GET /v1/rooms.membersOrderedByRole`；persist: [读] URL `tab=members-list` | `useMembersListRoomAction.ts:27-34` | `MemberListRouter` | `ui.ts:55` |
| room.toolbox.mentions | 打开本房间提及消息列表 | `房间头→工具栏→Mentions` | hook: none `useMentionsRoomAction.ts:6-18`；groups∈{channel,group,team} | DOM: [待渲染实测] complementary name=Mentions；endpoint: [读] `GET /v1/chat.getMentionedMessages` `MentionsTab.tsx`；persist: [读] URL `tab=mentions` | `useMentionsRoomAction.ts:8-16` | `MentionsTab` | `ui.ts:56` |
| room.toolbox.omnichannel-external-frame | 打开 Omnichannel 外部 iframe 侧栏 | live `房间头→工具栏→Omnichannel_External_Frame` | setting `Omnichannel_External_Frame_Enabled` `useOmnichannelExternalFrameRoomAction.ts:8,11-12` | DOM: [待渲染实测] complementary 内 iframe 出现；endpoint: [读] 无 REST 拉内容，iframe 打开 `Omnichannel_External_Frame_URL`；persist: [读] URL `tab=omnichannel-external-frame` | `useOmnichannelExternalFrameRoomAction.ts:15-22` | `ExternalFrameContainer` | `ui.ts:57` |
| room.toolbox.outlook-calendar | 打开 Outlook 日历事件侧栏 | `房间头→工具栏→Outlook_calendar`（order=999） | setting `Outlook_Calendar_Enabled` `useOutlookCalenderRoomAction.ts:8,11-12`；groups∈{channel,group,team} | DOM: [待渲染实测] complementary name=Outlook_calendar；endpoint: [读] `GET /v1/calendar-events.list`；persist: [读] URL `tab=outlookCalendar` | `useOutlookCalenderRoomAction.ts:15-22` | `OutlookEventsRoute` | `ui.ts:58` |
| room.toolbox.pinned-messages | 打开置顶消息列表 | `房间头→工具栏→Pinned_Messages` | setting `Message_AllowPinning` `usePinnedMessagesRoomAction.ts:14,18-19`；federated disabled | DOM: [待渲染实测] complementary name=Pinned_Messages；endpoint: [读] `GET /v1/chat.getPinnedMessages`；persist: [读] URL `tab=pinned-messages` | `usePinnedMessagesRoomAction.ts:22-34` | `PinnedMessagesTab` | `ui.ts:59` |
| room.toolbox.push-notifications | 打开本房间通知偏好 | `房间头→工具栏→Notifications_Preferences` | 必须有 subscription `usePushNotificationsRoomAction.ts:9-14` | DOM: [待渲染实测] complementary name=Notifications_Preferences；endpoint: [读] 打开用 subscription；保存 `POST /v1/rooms.saveNotification`；persist: [读] URL tab + 偏好刷新仍在 | `usePushNotificationsRoomAction.ts:17-25` | `NotificationPreferences` | `ui.ts:60` |
| room.toolbox.rocket-search | 打开房间内消息搜索侧栏 | `房间头→工具栏→Search_Messages` | hook: none `useRocketSearchRoomAction.ts:6-17`（含 live） | DOM: [待渲染实测] complementary name=Search_Messages + 搜索框；endpoint: [读] Meteor `rocketchatSearch.getProvider` / `rocketchatSearch.search`；persist: [读] URL `tab=rocket-search`；查询串刷新是否保留 [待渲染实测] | `useRocketSearchRoomAction.ts:8-15` | `MessageSearchTab` | `ui.ts:61` |
| room.toolbox.room-info | 打开 livechat 会话信息 | live `房间头→工具栏→Room_Info`；兼 `房间头→房间标题`（t=l） | hook: none `useRoomInfoRoomAction.ts:6-17`；groups∈{live} | DOM: [待渲染实测] complementary name=Room_Info；endpoint: [读] `GET /v1/rooms.info` + `GET /v1/livechat/visitors.info`；persist: [读] URL `tab=room-info` | `useRoomInfoRoomAction.ts:8-15` | `ChatsContextualBar` | `ui.ts:62` |
| room.toolbox.starred-messages | 打开星标消息列表 | `房间头→工具栏→Starred_Messages` | hook: none `useStarredMessagesRoomAction.ts:6-18` | DOM: [待渲染实测] complementary name=Starred_Messages；endpoint: [读] `GET /v1/chat.getStarredMessages`；persist: [读] URL `tab=starred-messages` | `useStarredMessagesRoomAction.ts:8-16` | `StarredMessagesTab` | `ui.ts:63` |
| room.toolbox.team-channels | 打开团队频道列表 | team `房间头→工具栏→Team_Channels` | hook: none `useTeamChannelsRoomAction.ts:6-18`；groups∈{team} | DOM: [待渲染实测] complementary name=Team_Channels；endpoint: [读] `GET /v1/teams.listRooms`；persist: [读] URL `tab=team-channels` | `useTeamChannelsRoomAction.ts:8-16` | `TeamsChannels` | `ui.ts:64` |
| room.toolbox.uploaded-files-list | 打开房间文件列表 | `房间头→工具栏→Files` | hook: none `useUploadedFilesListRoomAction.ts:6-17`（含 live） | DOM: [待渲染实测] complementary name=Files；endpoint: [读] `GET /v1/channels.files` 或 `/v1/groups.files` 或 `/v1/im.files`；persist: [读] URL `tab=uploaded-files-list` | `useUploadedFilesListRoomAction.ts:8-16` | `RoomFiles` | `ui.ts:65` |
| room.toolbox.ai-actions | Apps-Engine AI 类房间动作聚合菜单（featured） | `房间头→工具栏→AI_Actions`（stars 图标）；子项再点 app 标签 | `GET /apps/actionButtons` 且 `useApplyButtonFilters('ai')` 非空 `useAppsRoomStarActions.tsx:16-30` | DOM: [待渲染实测] menu AI_Actions 展开，子项出现；endpoint: [读] 列表 `GET /apps/actionButtons`，点击 `POST /apps/ui.interaction/${appId}`；persist: [读] 按钮清单随 app 安装刷新仍在；单次 interaction 不持久 [待渲染实测] | `useAppsRoomStarActions.tsx:33-40` | featured `GenericMenu` | `ui.ts:66` |
| room.toolbox.start-video-call | 从房间头发起视频会议（featured，无 tab） | `房间头→工具栏→Video_call` | `call-management` + 对应 `VideoConf_Enable_DMs/Channels/Teams/Groups` 或 `Omnichannel_call_provider==='default-provider'`；非自己单人 DM；非 muted；federated/readonly/archived 则 disabled `useVideoCallRoomAction.ts:34-53,70-71` | DOM: [待渲染实测] Video_call 按钮出现，点击后 outgoing 弹层出现；endpoint: [读] `GET /v1/video-conference.capabilities` 后 `POST /v1/video-conference.start`；persist: [读] 会议记录在 Calls 列表刷新可见 [待渲染实测] | `useVideoCallRoomAction.ts:74-84` | featured 工具栏 | `ui.ts:67` |
| room.toolbox.start-voice-call | 从 1:1 DM 头发起/结束语音（featured，无 tab） | 1:1 DM `房间头→工具栏→Voice_call__user_`（文案动态） | 恰好一个 peer；voip 非 `unavailable`；非 blocked/blocker；非 federated `useMediaCallRoomAction.ts:35,55-59` | DOM: [待渲染实测] phone 按钮出现，点击 voip widget 出现/挂断后消失；endpoint: [读] 预取 `GET /v1/users.info` `useUserInfoQuery.ts:12`；widget 信令另计；persist: [读] 通话结束后 Call_history 可重放 [待渲染实测] | `useMediaCallRoomAction.ts:64-71` | featured；另见 `nav.voip.call` | `ui.ts:68` |
| room.apps.toolbox-inject | Apps-Engine 向房间工具箱注入非 AI `roomAction` 按钮 | `房间头→工具栏→Options` 下 Apps 分段（`type=apps` 永不进前 6） | `GET /apps/actionButtons` context=`roomAction` + `useApplyButtonFilters()`（roles/permissions/roomTypes）`useAppsRoomActions.ts:14-16,21` | DOM: [待渲染实测] Options→Apps 下出现 app 标签；endpoint: [读] 列表 `GET /apps/actionButtons`，点击 `POST /apps/ui.interaction/${appId}` `useAppsRoomActions.ts:34-40`；persist: [读] 安装 app 后刷新仍在；无 app 则整段不出现 | `useAppsRoomActions.ts:21-54` | `RoomToolboxProvider.tsx:72,83` | `useAppsRoomActions.ts:14` |

---

## 表 B — Room header chrome（非 roomActionHooks，但是同一 Header 表面）

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
|---|---|---|---|---|---|---|---|
| room.header.title-open-info | 点房间标题打开对应 info tab | `房间头→房间标题按钮(aria-label=房间名)` | none（标题始终可点）`RoomTitle.tsx:39-43`；目标 tab 仍受该 tab 自身 groups 约束 | DOM: [待渲染实测] 标题为 button，点击后与 toolbox 同一 complementary 出现；endpoint: [读] 无独立请求，转 `openTab`；persist: [读] 写入 URL tab（team-info / room-info / user-info-group / user-info / channel-settings）`RoomTitle.tsx:17-34` | `RoomTitle.tsx:17-34` | 复用表 A 对应 tab | `RoomHeader.tsx:45` |
| room.header.favorite | 星标/取消星标当前房间 | `房间头→star/star-filled（title=Favorite/Unfavorite {name}）` | 已订阅 + setting `Favorite_Rooms` + `room.t ∈ {c,p,d,t}` `Favorite.tsx:16,29-30` | DOM: [待渲染实测] HeaderState 星标出现，点击后 filled/outline 与 title 在 Favorite/Unfavorite 间切换；endpoint: [读] `POST /v1/rooms.favorite` `useToggleFavoriteMutation.ts:14,19`；persist: [读] subscription.`f`，刷新后星标状态仍在 | `Favorite.tsx:19-25` | 侧栏 Favorites 分组 | `RoomHeader.tsx:46` |
| room.header.topic-add | 无主题且可编辑时点「添加主题」进编辑 | `房间头→Add_topic 链接` | `useCanEditRoom`=`edit-room`（federated 另需 Federation.isEditableByTheUser）且 public/private `RoomTopic.tsx:15,22`；`useCanEditRoom.ts:12-15`。已有 topic 只读，不进本行 | DOM: [待渲染实测] link name=Add_topic 出现，点击后 channel-settings 或 team-info 侧栏出现；endpoint: [读] 导航无请求，保存走房间设置 POST；persist: [读] href 含 tab 路径 `RoomTopic.tsx:19,30` | `RoomTopic.tsx:28-33` | `room.toolbox.channel-settings` / `team-info` | `RoomHeader.tsx:50` |

Encrypted / Translate 图标为只读徽章（`Encrypted.tsx` / `Translate.tsx`），无点击，不入表。见边界。

---

## 表 C — User card / UserInfo（`user.*`）

共享：`useUserInfoActions` 14 hook 合成后按 `size` 切 featured vs kebab（UserCard size=3 `UserCardWithData.tsx:75-88`；UserInfo size=2；成员行 size=0 全进 kebab）。无 Apps-Engine user-card 注入（`UIActionButtonContext` 无该 context）。

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
|---|---|---|---|---|---|---|---|
| user.card.open | 打开用户资料气泡卡片 | 消息头像 / 显示名 / @提及 → 卡片；线程头像；系统消息名（头像不可点） | none 于 `openUserCard(e,username)`；embedded 仍可开卡 | DOM: [待渲染实测] dialog name=User_card 出现；关：`Close` 或点外部消失；endpoint: [读] `GET /v1/users.info` `useUserInfoQuery.ts:12` + `GET /v1/rooms.isMember`；persist: [读] 卡片是 popover，刷新关闭 | `UserCardProvider` + `UserCardWithData.tsx:30` | `UserCard.tsx:52` | `UserCardWithData.tsx:25` |
| user.card.see-full-profile | 从卡片进入完整 UserInfo 侧栏 | `…→User_card→See_full_profile` | `!embedded` `UserCard.tsx:93` | DOM: [待渲染实测] User_card 消失，UserInfo complementary 出现；endpoint: [读] 再取 `GET /v1/users.info`；persist: [读] URL tab=members-list 或 user-info 或 user-info-group 或 room-info + username | `UserCardWithData.tsx:70-73` | 表 A members/user-info | `UserCard.tsx:95-96` |
| user.action.direct-message | 对目标用户开/跳转 DM | `User_card 或 UserInfo → Direct_Message`；溢出 `…→More→Direct_Message` | `create-d` 或已有同名 subscription；且 `!embedded` `useUserInfoActions.ts:95`；`useDirectMessageAction.ts:14-16` | DOM: [待渲染实测] 进入 1:1 房间，卡片关闭；endpoint: [读] 路由 `direct`（已有房间无 create）；persist: [读] 订阅刷新后侧栏仍有该 DM | `useDirectMessageAction.ts:18-23` | 卡片/侧栏/成员 kebab | `useUserInfoActions.ts:95` |
| user.action.video-call | 从资料面对该用户发起视频 | `User_card/UserInfo → Video_call`（常为前 2–3 个图标） | 已有 DM 房间；`!federated`；`user._id!==own`；setting `VideoConf_Enable_DMs`；permission `call-management`；非 ringing/calling `useVideoCallAction.ts:36-38,54-55` | DOM: [待渲染实测] 卡片关闭，outgoing video 弹层出现；endpoint: [读] capabilities + `POST /v1/video-conference.start`；persist: [读] Calls 列表刷新可见 [待渲染实测] | `useVideoCallAction.ts:39-60` | 与 `room.toolbox.start-video-call` 同栈 | `useUserInfoActions.ts:96` |
| user.action.voice-call | 从资料面对该用户发起语音 | `User_card/UserInfo → Voice_call__user_` | voip≠unavailable；非 federated；非 block；`user._id!==own` `useUserMediaCallAction.ts:22-38`；state≠available 时 disabled | DOM: [待渲染实测] 卡片关闭，voip widget 出现；endpoint: [读] 本 hook 无 REST，toggleWidget；persist: [读] 通话记录 [待渲染实测] | `useUserMediaCallAction.ts:42-54` | `room.toolbox.start-voice-call` | `useUserInfoActions.ts:97` |
| user.action.add-to-room | 把非成员加进当前房间 | `User_card/UserInfo → add-to-room`（仅 !isMember） | `!isMember`；`roomCanInvite`；`add-user-to-any-c-room` 或 `add-user-to-any-p-room` 或 `add-user-to-joined-room`；非 archived；非 blocked federation `useAddUserAction.ts:42-56` | DOM: [待渲染实测] 成功 toast User_added，该动作被 owner/mute 等替换；endpoint: [读] `POST /v1/channels.invite` 或 `/v1/groups.invite` `:20-23,58`；persist: [读] 成员列表刷新仍在 | `useAddUserAction.ts` | 仅非成员 | `useUserInfoActions.ts:98` |
| user.action.change-owner | 授予/撤销房间 owner | `User_card/UserInfo → More → Set_as_owner/Remove_as_owner` | `isMember`；`roomCanSetOwner`；非联邦需 `set-owner` `useChangeOwnerAction.tsx:54,66` | DOM: [待渲染实测] 文案在 Set/Remove 间切换；联邦先 warning dialog；endpoint: [读] `POST /v1/channels.addOwner` 或 `removeOwner` 或 groups 对应 `:43-48`；persist: [读] 房间角色刷新仍在 | `useChangeOwnerAction.tsx` | privileges 段 | `useUserInfoActions.ts:99` |
| user.action.change-leader | 授予/撤销房间 leader | `…→More→Set_as_leader/Remove_as_leader` | `isMember`；`roomCanSetLeader`；`set-leader` `useChangeLeaderAction.ts:29,37` | DOM: [待渲染实测] 文案切换；endpoint: [读] `POST /v1/channels.addLeader` 或 `removeLeader` 或 groups `:18-23`；persist: [读] 角色刷新仍在 | `useChangeLeaderAction.ts` | privileges | `useUserInfoActions.ts:100` |
| user.action.change-moderator | 授予/撤销房间 moderator | `…→More→Set_as_moderator/Remove_as_moderator` | `isMember`；`roomCanSetModerator`；非联邦 `set-moderator` `useChangeModeratorAction.tsx` | DOM: [待渲染实测] 文案切换；联邦 warning dialog；endpoint: [读] `POST /v1/channels.*Moderator` 或 groups；persist: [读] 角色刷新仍在 | `useChangeModeratorAction.tsx` | privileges | `useUserInfoActions.ts:101` |
| user.action.moderation-console | 跳到该用户的审核控制台 | `…→More→Moderation_Action_View_reports` | `isMember`；permission `view-moderation-console` `useRedirectModerationConsole.ts:9-14` | DOM: [待渲染实测] 离开房间进入 moderation-console；endpoint: [读] 路由 `moderation-console?uid=`；persist: [读] URL 刷新仍在该用户审核页 | `useRedirectModerationConsole.ts:17-26` | 管理后台审核 | `useUserInfoActions.ts:102` |
| user.action.ignore | 忽略/取消忽略该成员消息 | `…→More→Ignore/Unignore` | `isMember`；`roomCanIgnore`；`uid!==own` `useIgnoreUserAction.ts:31,48` | DOM: [待渲染实测] 文案 Ignore↔Unignore，被忽略消息样式变 [待渲染实测]；endpoint: [读] `GET /v1/chat.ignoreUser` `{rid,userId,ignore}` `:23,35`；persist: [读] subscription.ignored 刷新仍在 | `useIgnoreUserAction.ts:46-54` | management | `useUserInfoActions.ts:103` |
| user.action.mute | 禁言/解除禁言该成员 | `…→More→Mute_user/Unmute_user` | `isMember`；`roomCanMute`；`mute-user` `useMuteUserAction.tsx:44,61` | DOM: [待渲染实测] Mute 先出 danger dialog，确认后文案切换；endpoint: [读] `POST /v1/rooms.muteUser` 或 `unmuteUser` `:65`；persist: [读] `room.muted` 刷新仍在 | `useMuteUserAction.tsx` | management | `useUserInfoActions.ts:104` |
| user.action.block | 1:1 DM 拉黑/取消拉黑 | `User_card/UserInfo → Block/Unblock` | `roomCanBlock`（仅非群 DM）且 `uid!==own` `useBlockUserAction.ts:28,47`；`direct.ts` 仅 BLOCK | DOM: [待渲染实测] 文案 Block↔Unblock；endpoint: [读] `POST /v1/im.blockUser` `{roomId,block}` `:31-35`；persist: [读] subscription.blocker 刷新仍在 | `useBlockUserAction.ts:45-54` | 无 type 分段 | `useUserInfoActions.ts:105` |
| user.action.remove | 踢出房间/团队或撤销邀请 | `…→More→Remove_from_room 或 Remove_from_team 或 Revoke_invitation` | `isMember 或 isInvited`；`roomCanRemove`；`remove-user` 或联邦可编辑 `useRemoveUserAction.tsx:45-57` | DOM: [待渲染实测] danger dialog 出现，确认后该用户离开成员列表；endpoint: [读] team `POST /v1/teams.removeMember` 否则 `POST /v1/channels.kick` 或 `/v1/groups.kick` `:61,71-72`；persist: [读] 成员刷新不在 | `useRemoveUserAction.tsx` | moderation danger | `useUserInfoActions.ts:106` |
| user.action.ban | 从房间封禁用户 | `…→More→Ban_user_from_room` | `isMember 或 isInvited`；`ban-user` + `roomCanBan` `useBanUserAction.ts:25-33` | DOM: [待渲染实测] danger dialog 确认后成员消失，Banned_Users 出现该人；endpoint: [读] `POST /v1/rooms.banUser` `useBanUser.tsx`；persist: [读] 封禁列表刷新仍在 | `useBanUserAction.ts:31-42` | `room.toolbox.banned-users` | `useUserInfoActions.ts:107` |
| user.action.report | 举报用户 | `…→More→Report` | `ownUserId!==uid` `useReportUser.tsx:44`；无房间/权限键 | DOM: [待渲染实测] dialog Report_User 出现，提交后关闭+toast Report_has_been_sent；endpoint: [读] `POST /v1/moderation.reportUser` `:20-25`；persist: [读] 审核记录刷新仍在（需 `view-moderation-console` 查看） | `useReportUser.tsx:33-50` | moderation danger | `useUserInfoActions.ts:108` |

---

## 表 D — Navbar（`nav.*`）

顶栏三段：Pages / Navigation / Controls（`NavBar.tsx:12-15`）。mobile 搜索展开时 Pages+Controls 隐藏。

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
|---|---|---|---|---|---|---|---|
| nav.sidebar.toggle | 折叠/展开主侧栏 | `顶栏左→汉堡 SidebarToggler` | `sidebar.shouldToggle`：V2=tablet 或 mobile，V1=仅 mobile `LayoutProvider.tsx:35-36`；`NavBarPagesSection.tsx:12` | DOM: [待渲染实测] 侧栏消失/出现；endpoint: none `LayoutProvider.tsx:73` 仅 React state；persist: [读] **刷新不持久**（useState） | `SidebarToggler` | V1/V2 侧栏 | `NavBarPagesSection.tsx:12-16` |
| nav.pages.home | 打开 Home 并 toggle 侧栏 | desktop `顶栏左→Home`；tablet `顶栏左→Pages→Home` | setting `Layout_Show_Home_Button` `NavBarItemHomePage.tsx:11,20` | DOM: [待渲染实测] Home 页出现，Home 按钮 pressed；endpoint: [读] 客户端 `navigate('/home')`；persist: [读] URL `/home` | `NavBarItemHomePage.tsx:12-14` | `nav.pages.stack` | `NavBarPagesGroup.tsx:25` |
| nav.pages.directory | 打开人员/频道/团队目录 | desktop `顶栏左→Directory`；tablet `顶栏左→Pages→Directory` | none `NavBarItemDirectoryPage.tsx:8-25` | DOM: [待渲染实测] Directory 页+Users/Channels/Teams tabs；endpoint: [读] 目录各 tab 自有 REST（本行只到入口）；persist: [读] URL `/directory`，默认 tab=`Accounts_Directory_DefaultView` | `NavBarItemDirectoryPage.tsx:10-12` | 目录内部 field-level 域外 | `NavBarPagesGroup.tsx:26` |
| nav.pages.stack | tablet 把 Home+Directory 收进 Pages 菜单 | `顶栏左→Pages(stack)` | `isTablet` `NavBarPagesGroup.tsx:22`；Home 子项另需 `Layout_Show_Home_Button` | DOM: [待渲染实测] menu Pages 出现 Home/Directory；endpoint: 同对应子项；persist: 同子项 | `NavBarPagesStackMenu.tsx:26-42` | home/directory | `NavBarPagesGroup.tsx:22` |
| nav.marketplace.explore | 进入 Marketplace 浏览 | `顶栏左→Marketplace→Explore` | `access-marketplace` OR `manage-apps`，且 `!isMobile` `NavBarPagesGroup.tsx:16-29`；`useMarketPlaceMenu.tsx:10-13` | DOM: [待渲染实测] Marketplace Explore 列表；endpoint: [读] 市场列表 REST（域外展开）；persist: [读] URL `/marketplace/explore/list` | `useMarketPlaceMenu.tsx:19-25` | 市场侧栏 6 项 | `NavBarItemMarketPlaceMenu.tsx:20` |
| nav.marketplace.installed | 进入已安装应用列表 | `顶栏左→Marketplace→Installed` | 同上 marketplace 权限 | DOM: [待渲染实测] Installed 列表；endpoint: [读] 已安装 apps API；persist: [读] URL `/marketplace/installed/list` | `useMarketPlaceMenu.tsx:26-31` | 市场侧栏 | `useMarketPlaceMenu.tsx:27` |
| nav.marketplace.requested | 进入待审批应用 | `顶栏左→Marketplace→Requested` | permission `manage-apps` `useMarketPlaceMenu.tsx:34-49` | DOM: [待渲染实测] Requested 列表，未读 badge 可能出现；endpoint: [读] app request stats；persist: [读] URL `/marketplace/requested/list` | `useMarketPlaceMenu.tsx:34-49` | 仅管理员 | `useMarketPlaceMenu.tsx:35` |
| nav.sort.display.extended | 侧栏扩展行高 | `顶栏左→Display→Display→Extended` | `!isMobile` 才有 Sort 按钮 `NavBarPagesGroup.tsx:30`；**整段 Display 仅 secondarySidebar OFF** `useSortMenu.ts:18` | DOM: [待渲染实测] Extended 单选勾上，房间行变高；endpoint: [读] `POST /v1/users.setPreferences` `{sidebarViewMode:extended}` `useViewModeItems.tsx:10-13`；persist: [读] 用户偏好刷新仍在 | `useViewModeItems.tsx:28-34` | V1 侧栏 | `useViewModeItems.tsx:29` |
| nav.sort.display.medium | 侧栏中等行高 | `顶栏左→Display→Display→Medium` | 同上 Display 段 | DOM: [待渲染实测] Medium 勾上；endpoint: [读] `POST /v1/users.setPreferences` `{sidebarViewMode:medium}`；persist: [读] 偏好刷新仍在 | `useViewModeItems.tsx:35-41` | V1 | `useViewModeItems.tsx:36` |
| nav.sort.display.condensed | 侧栏紧凑行高 | `顶栏左→Display→Display→Condensed` | 同上 | DOM: [待渲染实测] Condensed 勾上；endpoint: [读] `{sidebarViewMode:condensed}`；persist: [读] 偏好刷新仍在 | `useViewModeItems.tsx:42-48` | V1 | `useViewModeItems.tsx:43` |
| nav.sort.display.avatars | 开关侧栏头像 | `顶栏左→Display→Display→Avatars` | 同上 Display 段 | DOM: [待渲染实测] Avatars 开关切换，行内头像出现/消失；endpoint: [读] `{sidebarDisplayAvatar:bool}` `useViewModeItems.tsx:22-24`；persist: [读] 偏好刷新仍在 | `useViewModeItems.tsx:49-55` | V1 | `useViewModeItems.tsx:50` |
| nav.sort.by.activity | 房间列表按活跃度排 | `顶栏左→Display→Sort_By→Activity` | `!isMobile`；none 于选项本身 `useSortModeItems.tsx:25-33` | DOM: [待渲染实测] Activity 单选勾上，列表重排；endpoint: [读] `POST /v1/users.setPreferences` `{sidebarSortby:activity}`；persist: [读] 偏好刷新仍在 | `useSortModeItems.tsx:26-33` | Omni disclaimer 仅描述 | `useSortModeItems.tsx:27` |
| nav.sort.by.name | 房间列表按名称排 | `顶栏左→Display→Sort_By→Name` | none 于选项 `useSortModeItems.tsx:34-41` | DOM: [待渲染实测] Name 勾上；endpoint: [读] `{sidebarSortby:alphabetical}`；persist: [读] 偏好刷新仍在 | `useSortModeItems.tsx:34-41` | | `useSortModeItems.tsx:35` |
| nav.sort.group.unread | 侧栏按未读分组 | `顶栏左→Display→Group_by→Unread` | none `useGroupingListItems.tsx:25-31` | DOM: [待渲染实测] Unread 勾选，Unread 组头出现/消失；endpoint: [读] `{sidebarShowUnread:bool}`；persist: [读] 偏好刷新仍在 | `useGroupingListItems.tsx:25-31` | `sidebar.group.collapse` | `useGroupingListItems.tsx:26` |
| nav.sort.group.favorites | 侧栏按收藏分组 | `顶栏左→Display→Group_by→Favorites` | **secondarySidebar OFF** 才渲染 `useGroupingListItems.tsx:32-38` | DOM: [待渲染实测] Favorites 组出现/消失；endpoint: [读] `{sidebarShowFavorites:bool}`；persist: [读] 偏好刷新仍在 | `useGroupingListItems.tsx:32-38` | `room.header.favorite` | `useGroupingListItems.tsx:33` |
| nav.sort.group.types | 侧栏按房间类型分组 | `顶栏左→Display→Group_by→Types` | none `useGroupingListItems.tsx:39-45` | DOM: [待渲染实测] Types 组头出现/消失；endpoint: [读] `{sidebarGroupByType:bool}`；persist: [读] 偏好刷新仍在 | `useGroupingListItems.tsx:39-45` | | `useGroupingListItems.tsx:40` |
| nav.create.dm | 打开创建私聊模态 | `顶栏左→Create_new→Direct_message` | permission `create-d` `useCreateNewItems.ts:14,23,73` | DOM: [待渲染实测] dialog CreateDirectMessage 出现；endpoint: [读] 提交后创建 DM（模态内 REST）；persist: [读] 新 DM 刷新后在侧栏 | `useCreateNewItems.ts:49-56` | | `useCreateNewItems.ts:50` |
| nav.create.discussion | 打开创建讨论模态 | `顶栏左→Create_new→Discussion` | `start-discussion` OR `start-discussion-other-user` + setting `Discussion_enabled` `useCreateNewItems.ts:15,19,24,74` | DOM: [待渲染实测] dialog CreateDiscussion；endpoint: [读] 讨论创建 API；persist: [读] 新讨论刷新仍在 | `useCreateNewItems.ts:57-64` | `room.toolbox.discussions` | `useCreateNewItems.ts:58` |
| nav.create.channel | 打开创建频道模态 | `顶栏左→Create_new→Channel` | `create-c` OR `create-p` `useCreateNewItems.ts:12,21,75` | DOM: [待渲染实测] dialog CreateChannelModal；endpoint: [读] channels/groups create；persist: [读] 新房间刷新仍在 | `useCreateNewItems.ts:33-40` | | `useCreateNewItems.ts:34` |
| nav.create.team | 打开创建团队模态 | `顶栏左→Create_new→Team` | `create-team` AND (`create-c` 或 `create-p`) `useCreateNewItems.ts:13,22,76` | DOM: [待渲染实测] dialog CreateTeamModal；endpoint: [读] teams.create；persist: [读] 新团队刷新仍在 | `useCreateNewItems.ts:41-48` | | `useCreateNewItems.ts:42` |
| nav.create.outbound | 打开外呼消息向导 | `顶栏左→Create_new→Outbound_message` | omnichannel enabled；若同时有 license `livechat-enterprise`+`outbound-messaging` 则还需 `outbound.send-messages`，否则放宽为 true `useOutboundMessageAccess.ts:6-20` | DOM: [待渲染实测] outbound wizard modal；endpoint: [读] 向导内 omnichannel REST（域外）；persist: [读] 发出消息刷新仍在 [待渲染实测] | `useCreateNewItems.ts:65-70` | Omni 入口级 | `useCreateNewItems.ts:66` |
| nav.search.rooms | 顶栏搜索房间/用户并跳转 | `顶栏中→Search_rooms`（可 Ctrl/Cmd+K/P） | `aiSearch` preview OFF `NavBarNavigation.tsx:19-21`；输入 none | DOM: [待渲染实测] listbox overlay 出现，选中行后关闭并进房间；endpoint: [读] `GET /v1/spotlight`（debounce）`useSearchItems.ts`；persist: [读] 导航 URL 刷新仍在目标房间；搜索框清空 | `NavBarSearch.tsx` | | `NavBarNavigation.tsx:20` |
| nav.search.ai | AI 增强顶栏搜索 | `顶栏中→Search_rooms_or_ask_AI` | preview `aiSearch` ON；AI 按钮另需 license `AI_LICENSE_MODULE` + setting `AI_Intelligent_Search_Enabled` `useNavBarAISearch.ts` | DOM: [待渲染实测] AI listbox/chips 出现；endpoint: [读] spotlight + AI search package；persist: [读] 导航持久，AI 会话刷新 [待渲染实测] | `NavBarAISearch.tsx` | | `NavBarNavigation.tsx:22-24` |
| nav.history.back | 路由后退 | `顶栏中→Back_in_history` | `!isMobile` `NavBarNavigation.tsx:27` | DOM: [待渲染实测] 上一页出现；endpoint: none `navigate(-1)`；persist: [读] 浏览器历史 | `NavBarNavigation.tsx:30` | | `NavBarNavigation.tsx:30` |
| nav.history.forward | 路由前进 | `顶栏中→Forward_in_history` | `!isMobile` | DOM: [待渲染实测] 下一页出现；endpoint: none `navigate(1)`；persist: [读] 浏览器历史 | `NavBarNavigation.tsx:31` | | `NavBarNavigation.tsx:31` |
| nav.manage.workspace | 进入管理后台 | `顶栏右→Manage→Workspace` | `useAtLeastOnePermission(ADMIN_PERMISSIONS)` 25 键含 `view-statistics`…`view-moderation-console` `useAdministrationMenu.ts:5-31,37` | DOM: [待渲染实测] Admin 二级侧栏+Workspace；endpoint: [读] `/admin` 后续 admin REST（域外）；persist: [读] URL `/admin` | `useAdministrationMenu.ts:40-44` | Admin 22 个 href | `useAdministrationMenu.ts:41` |
| nav.manage.omnichannel | 进入 Omnichannel 管理 | `顶栏右→Manage→Omnichannel` | permission `view-livechat-manager` `useAdministrationMenu.ts:38,45-49` | DOM: [待渲染实测] Omnichannel 二级侧栏；endpoint: [读] `/omnichannel`；persist: [读] URL `/omnichannel` | `useAdministrationMenu.ts:45-49` | Omni 13 个 href | `useAdministrationMenu.ts:46` |
| nav.audit.messages | 打开消息审计 | `顶栏右→Manage→Audit→Messages` | license `auditing` + permission `can-audit` `useAuditMenu.ts:11-13,37` | DOM: [待渲染实测] Audit Messages 页；endpoint: [读] `/audit`；persist: [读] URL `/audit` | `useAuditMenu.ts:16-20` | EE 审计 | `useAuditMenu.ts:17` |
| nav.audit.logs | 打开审计日志 | `顶栏右→Manage→Audit→Logs` | license `auditing` + `can-audit-log` `useAuditMenu.ts:14,38` | DOM: [待渲染实测] Audit Logs 页；endpoint: [读] `/audit-log`；persist: [读] URL `/audit-log` | `useAuditMenu.ts:22-26` | | `useAuditMenu.ts:23` |
| nav.audit.security | 打开安全日志 | `顶栏右→Manage→Audit→Security_logs` | license `auditing` + `can-audit` `useAuditMenu.ts:13,39` | DOM: [待渲染实测] Security logs 页；endpoint: [读] `/security-logs`；persist: [读] URL `/security-logs` | `useAuditMenu.ts:28-32` | | `useAuditMenu.ts:29` |
| nav.user.status.online | 把在线状态设为 online | `顶栏右→User_menu→Status→Online` | 已登录；`Presence_broadcast_disabled` 时改走 disabled 提示 `useStatusItems.tsx:53` | DOM: [待渲染实测] Online 勾上，头像状态点变绿；endpoint: [读] `POST /v1/users.setStatus` `useStatusItems.tsx:57`；persist: [读] 用户 status 刷新仍在 | `useStatusItems.tsx` | | `useUserMenu.tsx:46-48` |
| nav.user.status.away | 把在线状态设为 away | `顶栏右→User_menu→Status→Away` | 同上 | DOM: [待渲染实测] Away 勾上；endpoint: [读] `POST /v1/users.setStatus`；persist: [读] status 刷新仍在 | `useStatusItems.tsx` | | `useUserMenu.tsx:46-48` |
| nav.user.status.busy | 把在线状态设为 busy | `顶栏右→User_menu→Status→Busy` | 同上 | DOM: [待渲染实测] Busy 勾上；endpoint: [读] `POST /v1/users.setStatus`；persist: [读] status 刷新仍在 | `useStatusItems.tsx` | | `useUserMenu.tsx:46-48` |
| nav.user.status.offline | 把在线状态设为不可见/offline | `顶栏右→User_menu→Status→Offline` | setting `Accounts_AllowInvisibleStatusOption` `useStatusItems.tsx:24` | DOM: [待渲染实测] Offline 勾上；endpoint: [读] `POST /v1/users.setStatus`；persist: [读] status 刷新仍在 | `useStatusItems.tsx` | | `useUserMenu.tsx:46-48` |
| nav.user.status.custom-edit | 编辑自定义状态文案 | `顶栏右→User_menu→Status→(自定义编辑项)` | setting `Accounts_AllowUserStatusMessageChange` `useStatusItems.tsx:54` | DOM: [待渲染实测] EditStatusModal 出现；endpoint: [读] 保存走 `POST /v1/users.setStatus`；列表预取 `GET /v1/custom-user-status.list` `:28`；persist: [读] statusText 刷新仍在 | `useCustomStatusModalHandler` | | `useStatusItems.tsx:54` |
| nav.user.status.visibility | 配置状态对谁可见 | `顶栏右→User_menu→Status→(visibility)` | setting `Accounts_StatusVisibility_Enabled` `useStatusItems.tsx` | DOM: [待渲染实测] EditStatusVisibilityModal；endpoint: [读] 偏好/可见性写入 [待渲染实测 具体 path]；persist: [读] 刷新后对他人隐藏规则仍在 [待渲染实测] | `useStatusVisibilityModalHandler` | | `useStatusItems.tsx` |
| nav.user.account.profile | 打开我的资料 | `顶栏右→User_menu→Account→Profile` | none `useAccountItems.tsx:42-47` | DOM: [待渲染实测] Account Profile 页；endpoint: [读] `/account`；persist: [读] URL `/account` | `useAccountItems.tsx:14-16,42-47` | | `useAccountItems.tsx:43` |
| nav.user.account.preferences | 打开偏好设置 | `顶栏右→User_menu→Account→Preferences` | none `useAccountItems.tsx:48-53` | DOM: [待渲染实测] Preferences 页；endpoint: [读] `/account/preferences`；persist: [读] URL | `useAccountItems.tsx:17-19` | | `useAccountItems.tsx:49` |
| nav.user.account.accessibility | 打开无障碍与外观 | `顶栏右→User_menu→Account→Accessibility_and_Appearance` | none `useAccountItems.tsx:54-59` | DOM: [待渲染实测] Accessibility 页；endpoint: [读] `/account/accessibility-and-appearance`；persist: [读] URL | `useAccountItems.tsx:23-25` | | `useAccountItems.tsx:55` |
| nav.user.account.feature-preview | 打开功能预览（secondarySidebar/aiSearch） | `顶栏右→User_menu→Account→Feature_preview` | setting `Accounts_AllowFeaturePreview` 且 `defaultFeaturesPreview.length>0` `useAccountItems.tsx:12,60` | DOM: [待渲染实测] Feature preview 页，可能有 Unseen_features badge；endpoint: [读] `/account/feature-preview`；persist: [读] URL + 预览开关走用户偏好 | `useAccountItems.tsx:27-39,60` | 布局 V2 / AI 搜索 | `useAccountItems.tsx:28` |
| nav.user.keyboard | 打开键盘快捷键说明 | `顶栏右→User_menu→Keyboard_Shortcuts_Title` | none `useUserMenu.tsx:26-31` | DOM: [待渲染实测] KeyboardShortcutsModal 出现；endpoint: none（纯说明）；persist: [读] 模态刷新关闭 | `useKeyboardShortcutsModalHandler` | 快捷键域外 | `useUserMenu.tsx:54` |
| nav.user.apps-inject | Apps-Engine 注入用户下拉动作 | `顶栏右→User_menu→Apps→{app label}` | `GET /apps/actionButtons` context=`userDropdownAction` 且 filter 通过 `useUserDropdownAppsActionButtons.ts` | DOM: [待渲染实测] Apps 段出现动态项；endpoint: [读] `GET /apps/actionButtons` + `POST /apps/ui.interaction/${appId}`；persist: [读] 安装后刷新仍在 | `useUserDropdownAppsActionButtons.ts` | 与 room.apps 同类扩展面 | `useUserMenu.tsx:18,56` |
| nav.user.logout | 退出登录 | `顶栏右→User_menu→Logout` | none（已登录才有 User_menu）`useUserMenu.tsx:33-38` | DOM: [待渲染实测] 回到登录页，User_menu 被 Login 替换；endpoint: [读] logout/session 清除 `useLogout()`；persist: [读] 刷新仍未登录 | `useUserMenu.tsx:21-24,33-38` | `nav.user.login` | `useUserMenu.tsx:58` |
| nav.user.login | 未登录时强制登录 | `顶栏右→Login` | `!user` `NavBarControlsSection.tsx:26,38` | DOM: [待渲染实测] 登录流出现；endpoint: [读] session `forceLogin=true` `NavBarItemLoginPage.tsx:9-13`；persist: [读] 登录成功后刷新仍在会话 | `NavBarItemLoginPage.tsx:12-15` | | `NavBarItemLoginPage.tsx:13` |
| nav.voip.call | 顶栏发起语音通话 | desktop `顶栏右→Voice_Call→(动态 title)`；mobile `顶栏右→kebab→同项` | `useMediaCallAction()` 有值 `NavBarControlsSection.tsx:18,34` | DOM: [待渲染实测] voip widget 出现；endpoint: [读] voip 栈（同 room voice）；persist: [读] 通话史 [待渲染实测] | `NavBarVoipGroup.tsx:10-21` | `room.toolbox.start-voice-call` | `NavBarVoipGroup.tsx:21` |
| nav.voip.history | 打开通话记录页 | `顶栏右→Voice_Call→Call_history` | 同上，组随 callAction 显隐 `NavBarVoipGroup.tsx:15-17` | DOM: [待渲染实测] Call history 页；endpoint: [读] `/call-history`（页内另有历史 REST）；persist: [读] URL `/call-history` | `NavBarVoipGroup.tsx:12-14,22` | `media-call-history` 房间路由 | `NavBarVoipGroup.tsx:22` |
| nav.omnichannel.queue | 打开 livechat 队列 | `顶栏右→Omnichannel→Queue` | 组：`Livechat_enabled`+`view-l-room`（`useOmnichannelEnabled`）；项：`Livechat_show_queue_list_link`+agent available `useOmnichannelQueueAction.ts:9,15` | DOM: [待渲染实测] queue 页 pressed；endpoint: [读] `/livechat-queue`；persist: [读] URL | `useOmnichannelQueueAction.ts:14-19` | Omni 域外 | `useOmnichannelQueueAction.ts:18` |
| nav.omnichannel.contact | 打开联络中心目录 | `顶栏右→Omnichannel→Contact_Center` | 组级 omnichannel enabled；项 none `useOmnichannelContactAction.ts:10-14` | DOM: [待渲染实测] omnichannel-directory；endpoint: [读] `/omnichannel-directory`；persist: [读] URL | `useOmnichannelContactAction.ts:11-14` | | `useOmnichannelContactAction.ts:13` |
| nav.omnichannel.agent-toggle | 开关自己接听 livechat | `顶栏右→Omnichannel→Turn_on/off_answer_chats` | 组级 omnichannel enabled | DOM: [待渲染实测] 图标/title 在 on/off 间切换；endpoint: [读] `POST /v1/livechat/agent.status` `useOmnichannelLivechatToggle.ts:11-16`；persist: [读] agent 状态刷新仍在 | `useOmnichannelLivechatToggle.ts:22-27` | | `useOmnichannelLivechatToggle.ts:11` |

---

## 表 E — Sidebar chrome（`sidebar.*`）

V2（`secondarySidebar` ON）才有主栏 filter tabs + 副栏。V1 仅分组房间列表，无本表 filter。

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
|---|---|---|---|---|---|---|---|
| sidebar.filter.all | V2 主栏切到全部会话 | `主侧栏顶 tablist Team_collaboration_filters→All` | preview `secondarySidebar` ON；项 none `TeamCollabFilters.tsx:15` | DOM: [待渲染实测] tab All selected，副栏 tabpanel 列出全部；endpoint: none（本地订阅分组）；persist: [读] localStorage `sidePanelFilters` | `RoomListFiltersItem.tsx:27-41` | `RoomsNavigationContext` | `TeamCollabFilters.tsx:15` |
| sidebar.filter.favorites | V2 主栏切到收藏 | `主侧栏顶→Favorites` | secondarySidebar ON；项 none `TeamCollabFilters.tsx:16` | DOM: [待渲染实测] Favorites tab selected，副栏仅收藏；endpoint: none；persist: [读] localStorage `sidePanelFilters` | `RoomListFiltersItem.tsx` | `room.header.favorite` | `TeamCollabFilters.tsx:16` |
| sidebar.filter.discussions | V2 主栏切到讨论 | `主侧栏顶→Discussions` | secondarySidebar ON + setting `Discussion_enabled` `TeamCollabFilters.tsx:10,17` | DOM: [待渲染实测] Discussions tab 出现且 selected；endpoint: none；persist: [读] localStorage | `TeamCollabFilters.tsx:17` | `nav.create.discussion` | `TeamCollabFilters.tsx:17` |
| sidebar.filter.in-progress | V2 主栏切到进行中 livechat | `主侧栏顶 tablist Omnichannel_filters→In_progress` | secondarySidebar ON + omnichannel enabled + `view-l-room` `OmnichannelFilters.tsx:10,13-15,20` | DOM: [待渲染实测] In_progress selected，副栏进行中会话；endpoint: [读] 页内 livechat 列表 REST；persist: [读] localStorage filter | `OmnichannelFilters.tsx:20` | Omni 入口级 | `OmnichannelFilters.tsx:20` |
| sidebar.filter.queue | V2 主栏切到排队 | `主侧栏顶→Queue` | 上一项 + `view-livechat-queue` `OmnichannelFilters.tsx:11,21` | DOM: [待渲染实测] Queue tab 出现且 selected；endpoint: [读] 队列 REST；persist: [读] localStorage | `OmnichannelFilters.tsx:21` | `nav.omnichannel.queue` | `OmnichannelFilters.tsx:21` |
| sidebar.filter.on-hold | V2 主栏切到挂起 | `主侧栏顶→On_Hold` | `view-l-room` + omnichannel `OmnichannelFilters.tsx:22` | DOM: [待渲染实测] On_Hold selected；endpoint: [读] on-hold REST；persist: [读] localStorage | `OmnichannelFilters.tsx:22` | | `OmnichannelFilters.tsx:22` |
| sidebar.group.collapse | 折叠/展开侧栏分组头 | `主侧栏→(Unread/Teams/Channels/DMs 等组头)` | 分组本身由 Sort Group_by 偏好驱动；折叠控件 none `useCollapsedGroups.ts:6` | DOM: [待渲染实测] 组内房间列表消失/展开；endpoint: none；persist: [读] localStorage `sidebarGroups` `useCollapsedGroups.ts:6` | `useCollapsedGroups.ts:8-16` | V1 `RoomListCollapser` 同 hook | `useCollapsedGroups.ts:6` |
| sidebar.sidepanel.unread-toggle | 副栏只看未读 | `副栏顶 heading→Unread ToggleSwitch` | secondarySidebar ON；项 none `SidePanelInternal.tsx:48-51` | DOM: [待渲染实测] switch 勾上，副栏列表只剩未读；endpoint: none；persist: [读] `sidePanelFilters` unread 后缀 localStorage | `SidePanelInternal.tsx:48-51` | `nav.sort.group.unread` | `SidePanelInternal.tsx:51` |
| sidebar.sidepanel.back | tablet 关闭副栏 | `副栏顶→Back` | secondarySidebar ON + `isTablet` `SidePanelInternal.tsx:44` | DOM: [待渲染实测] 副栏 tabpanel 消失；endpoint: none `closeSidePanel()` layout state；persist: [读] **刷新不持久** | `SidePanelInternal.tsx:44` | `nav.sidebar.toggle` | `SidePanelInternal.tsx:44` |

---

## 验算

表内数据行（不含表头）必须等于「本分册 id 列表」条数。

| 表 | 行数 | 算法 |
|----|------|------|
| A Room toolbox | 30 | `roomActionHooks` 29（`ui.ts:39-68`）+ apps 注入 1（`useAppsRoomActions`，不在 hooks 数组） |
| B Room header chrome | 3 | title + favorite + topic-add |
| C User card/info | 16 | open + see-full-profile + 14 `useUserInfoActions` keys |
| D Navbar | 49 | 见下分项 |
| E Sidebar | 9 | 3 team filters + 3 omni filters + collapse + unread-toggle + back |

表 D 分项：

- Pages chrome：toggle + home + directory + stack = **4**
- Marketplace 子项：explore + installed + requested = **3**
- Sort：display×4 + sort×2 + group×3 = **9**
- Create：dm + discussion + channel + team + outbound = **5**
- Search/history：rooms + ai + back + forward = **4**
- Manage/audit：workspace + omnichannel + messages + logs + security = **5**
- Status：online + away + busy + offline + custom-edit + visibility = **6**
- Account：profile + preferences + accessibility + feature-preview = **4**
- User 其余：keyboard + apps-inject + logout + login = **4**
- Voip/omni：call + history + queue + contact + agent-toggle = **5**

`4+3+9+5+4+5+6+4+4+5 = 49`。

`30+3+16+49+9 = 107`。与「本分册 id 列表」107 条对齐。

文件夹计数（禁止用一个仓库总计数代替上表）：

| 文件夹 | 命令 | 结果 |
|--------|------|------|
| roomActionHooks 注册 | 见下 python/`rg` | 29 hook 名 |
| `client/hooks/roomActions/*` | `ls apps/meteor/client/hooks/roomActions/* \| wc -l` | 26（含 1 spec；omni 4 个在另一目录） |
| omni roomAction hooks | `ls apps/meteor/client/views/omnichannel/hooks/use*RoomAction.ts \| wc -l` | 4 |
| userInfo action 文件 | `ls apps/meteor/client/views/room/hooks/useUserInfoActions/actions/* \| wc -l` | 15（14 hook + 1 spec） |
| HeaderV2 | `find apps/meteor packages -iname '*HeaderV2*'` | 0 |
| navbar ts/tsx | `find apps/meteor/client/navbar -type f \( -name '*.ts' -o -name '*.tsx' \) \| wc -l` | 98 |
| navigation views | `find apps/meteor/client/views/navigation -type f \( -name '*.ts' -o -name '*.tsx' \) \| wc -l` | 67 |
| V1 sidebar | `find apps/meteor/client/sidebar -type f \( -name '*.ts' -o -name '*.tsx' \) \| wc -l` | 44 |
| admin views（域外量级） | `find apps/meteor/client/views/admin -type f \( -name '*.ts' -o -name '*.tsx' \) \| wc -l` | 456 |
| omnichannel views（域外量级） | `find apps/meteor/client/views/omnichannel -type f \( -name '*.ts' -o -name '*.tsx' \) \| wc -l` | 472 |
| marketplace views（域外量级） | `find apps/meteor/client/views/marketplace -type f \( -name '*.ts' -o -name '*.tsx' \) \| wc -l` | 188 |
| admin 侧栏 href | `rg -c "href:" apps/meteor/client/views/admin/sidebarItems.ts` | 22 |
| omni 侧栏 href | `rg "href:" apps/meteor/client/views/omnichannel/sidebarItems.tsx \| wc -l` | 13 |
| marketplace 侧栏 href | `rg "href:" apps/meteor/client/views/marketplace/sidebarItems.tsx \| wc -l` | 6 |
| 现行 atlas 文件 | `find docs -iname '*atlas*'` | 0 |

---

## [待渲染实测] 汇总

以下均有代码证据，但本环境未挂真实 Rocket.Chat 做点击回放。成功标准是 10 条随机行按入口+三件套在真机过一遍。

1. 所有 complementary/dialog 的 **真实 role+accessible name**（工具栏用 `title`/`aria-label`，kebab 用 `Options`/`More`/`User_menu`，卡片 `User_card`，副栏 `Side_panel`）——代码给了 i18n key，未量 DOM。
2. `roomToolboxExpanded` 真机：`lg+` 前 6 普通按钮 vs 窄屏全部进 Options。
3. Featured 三键（Video_call / Voice_call / AI_Actions）与 Options 分段（Apps / organization / customization）的可见顺序。
4. 点房间标题 vs 点工具栏 info 是否打开同一 tab、再点是否关闭。
5. Favorite 星标 filled/outline 与 toast `__roomName__was_added_to_favorites`。
6. Add_topic 仅空主题+可编辑出现；有主题时 Markdown 只读不可点。
7. User_card 从头像/用户名/@mention 打开的定位与 Close。
8. UserCard featured=3 vs UserInfo featured=2 vs 成员行全 kebab 的实际前几个图标。
9. 角色动作（owner/leader/moderator）文案双态与联邦 warning modal。
10. Mute/Remove/Ban/Report 的 danger dialog 标题。
11. Block 仅 1:1 DM 出现，群 DM/频道不出现。
12. NavBar mobile：搜索展开后 Pages/Controls 隐藏；tablet Pages stack；Sort/Marketplace 在 mobile 隐藏。
13. Display 段与 Group_by Favorites 在 `secondarySidebar` ON 时消失。
14. Create_new 在只有 outbound 权限、没有 create-c/d/p 时是否空菜单（`useCreateNewMenu` 段过滤不含 outbound）。
15. AI 搜索 vs classic 搜索的 listbox 名称。
16. Manage 齿轮在无 admin/audit 权限时整颗不出现。
17. 状态点颜色与 Presence_broadcast_disabled 的 Learn more 替换。
18. V2 主栏 tab 的 `aria-selected` 与副栏 `role=tabpanel` 同步。
19. `sidebarGroups` / `sidePanelFilters` localStorage 真机刷新。
20. Apps 注入三面（toolbox Apps 段、AI_Actions、User_menu Apps）在无 app 时整段不渲染。
21. E2EE 设置态工具箱是否真的只剩 3 个按钮。
22. Omnichannel 房间头 QuickActions（进队/转接/关闭等）**未列入本表**——它们走 `quickActionHooks` 而非 RoomToolbox；需在真机确认不与 toolbox 混淆。
23. `nav.user.status.visibility` 保存所用具体 endpoint 未在本分册展开到 mutation 文件。
24. 视频/语音弹层与 Call_history 刷新后的行是否对应本次呼叫。

---

## 计数证据

```text
# 默认分支
git symbolic-ref refs/remotes/origin/HEAD
# → refs/remotes/origin/develop

# roomActionHooks 29
python3 - <<'PY'
import re
text=open('apps/meteor/client/ui.ts').read()
m=re.search(r'export const roomActionHooks = \[(.*?)\];', text, re.S)
items=[x.strip().rstrip(',') for x in m.group(1).split('\n') if x.strip() and not x.strip().startswith('//') and 'satisfies' not in x]
print(len(items), items)
PY
# → 29

ls apps/meteor/client/hooks/roomActions/* | wc -l
# 26

ls apps/meteor/client/views/omnichannel/hooks/use*RoomAction.ts | wc -l
# 4

# 29 = (26 目录文件 - 1 spec - 0?) + 4 omni + useAppsRoomStarActions 已在 26 内
# 26 含 spec：25 实现文件。25 - useAppsRoomStarActions 等已计入 + 4 omni = 29。验算：
ls apps/meteor/client/hooks/roomActions/*.{ts,tsx} | grep -v spec | wc -l
# 25
# 25 + 4 omni = 29

ls apps/meteor/client/views/room/hooks/useUserInfoActions/actions/* | grep -v spec | wc -l
# 14

find apps/meteor packages -iname '*HeaderV2*' | wc -l
# 0

find apps/meteor/client/navbar -type f \( -name '*.ts' -o -name '*.tsx' \) | wc -l
# 98

find apps/meteor/client/views/navigation -type f \( -name '*.ts' -o -name '*.tsx' \) | wc -l
# 67

find apps/meteor/client/sidebar -type f \( -name '*.ts' -o -name '*.tsx' \) | wc -l
# 44

find apps/meteor/client/views/admin -type f \( -name '*.ts' -o -name '*.tsx' \) | wc -l
# 456

find apps/meteor/client/views/omnichannel -type f \( -name '*.ts' -o -name '*.tsx' \) | wc -l
# 472

find apps/meteor/client/views/marketplace -type f \( -name '*.ts' -o -name '*.tsx' \) | wc -l
# 188

rg "href:" apps/meteor/client/views/admin/sidebarItems.ts | wc -l
# 22

rg "href:" apps/meteor/client/views/omnichannel/sidebarItems.tsx | wc -l
# 13

rg "href:" apps/meteor/client/views/marketplace/sidebarItems.tsx | wc -l
# 6

find docs -iname '*atlas*' | wc -l
# 0（写入本文件前）
```

本文件表格行回检：

```text
python3 - <<'PY'
from pathlib import Path
p=Path('docs/qa/pm-feature-atlas/02-room-user-nav.md')
lines=p.read_text().splitlines()
# count table data rows: lines starting with | room.| user.| nav.| sidebar.
rows=[l for l in lines if l.startswith('| room.') or l.startswith('| user.') or l.startswith('| nav.') or l.startswith('| sidebar.')]
from collections import Counter
c=Counter(x.split('|')[1].strip().split('.')[0] for x in rows)
print('by ns', dict(c), 'sum', len(rows))
print('ids', len({x.split('|')[1].strip() for x in rows}))
PY
```

---

## 本分册 id 列表

1. room.toolbox.channel-settings
2. room.toolbox.team-info
3. room.toolbox.user-info-group
4. room.toolbox.user-info
5. room.toolbox.thread
6. room.toolbox.autotranslate
7. room.toolbox.calls
8. room.toolbox.canned-responses
9. room.toolbox.clean-history
10. room.toolbox.contact-profile
11. room.toolbox.discussions
12. room.toolbox.e2e
13. room.toolbox.export-messages
14. room.toolbox.game-center
15. room.toolbox.banned-users
16. room.toolbox.members-list
17. room.toolbox.mentions
18. room.toolbox.omnichannel-external-frame
19. room.toolbox.outlook-calendar
20. room.toolbox.pinned-messages
21. room.toolbox.push-notifications
22. room.toolbox.rocket-search
23. room.toolbox.room-info
24. room.toolbox.starred-messages
25. room.toolbox.team-channels
26. room.toolbox.uploaded-files-list
27. room.toolbox.ai-actions
28. room.toolbox.start-video-call
29. room.toolbox.start-voice-call
30. room.apps.toolbox-inject
31. room.header.title-open-info
32. room.header.favorite
33. room.header.topic-add
34. user.card.open
35. user.card.see-full-profile
36. user.action.direct-message
37. user.action.video-call
38. user.action.voice-call
39. user.action.add-to-room
40. user.action.change-owner
41. user.action.change-leader
42. user.action.change-moderator
43. user.action.moderation-console
44. user.action.ignore
45. user.action.mute
46. user.action.block
47. user.action.remove
48. user.action.ban
49. user.action.report
50. nav.sidebar.toggle
51. nav.pages.home
52. nav.pages.directory
53. nav.pages.stack
54. nav.marketplace.explore
55. nav.marketplace.installed
56. nav.marketplace.requested
57. nav.sort.display.extended
58. nav.sort.display.medium
59. nav.sort.display.condensed
60. nav.sort.display.avatars
61. nav.sort.by.activity
62. nav.sort.by.name
63. nav.sort.group.unread
64. nav.sort.group.favorites
65. nav.sort.group.types
66. nav.create.dm
67. nav.create.discussion
68. nav.create.channel
69. nav.create.team
70. nav.create.outbound
71. nav.search.rooms
72. nav.search.ai
73. nav.history.back
74. nav.history.forward
75. nav.manage.workspace
76. nav.manage.omnichannel
77. nav.audit.messages
78. nav.audit.logs
79. nav.audit.security
80. nav.user.status.online
81. nav.user.status.away
82. nav.user.status.busy
83. nav.user.status.offline
84. nav.user.status.custom-edit
85. nav.user.status.visibility
86. nav.user.account.profile
87. nav.user.account.preferences
88. nav.user.account.accessibility
89. nav.user.account.feature-preview
90. nav.user.keyboard
91. nav.user.apps-inject
92. nav.user.logout
93. nav.user.login
94. nav.voip.call
95. nav.voip.history
96. nav.omnichannel.queue
97. nav.omnichannel.contact
98. nav.omnichannel.agent-toggle
99. sidebar.filter.all
100. sidebar.filter.favorites
101. sidebar.filter.discussions
102. sidebar.filter.in-progress
103. sidebar.filter.queue
104. sidebar.filter.on-hold
105. sidebar.group.collapse
106. sidebar.sidepanel.unread-toggle
107. sidebar.sidepanel.back

`1–107` = 107。与验算 `30+3+16+49+9` 对齐。

---

## 边界

### 本分册收了但只到入口级

- Omnichannel **房间工具箱**四键（canned-responses / contact-profile / room-info / external-frame）在表 A，因为它们在 `roomActionHooks`。Omnichannel **管理后台字段**不展开。
- Navbar Manage→Workspace / Omnichannel / Marketplace 子菜单：只到二级侧栏入口。Admin 22 href、Omni 13 href、Marketplace 6 href 的表单字段全部域外（文件量级见计数证据：456 / 472 / 188）。
- `nav.create.outbound`、`nav.omnichannel.*`、`sidebar.filter.in-progress|queue|on-hold`：只到入口。

### 明确不收录（交给 implicit / 其他分册）

| 项 | 原因 | 量级/出处 |
|----|------|-----------|
| HeaderV2 | 当前 develop **不存在**，无需双树 | `find …HeaderV2*` = 0；历史 `a587ab378c` purge |
| Encrypted / Translate 徽章 | 只读，无点击 | `Header/icons/Encrypted.tsx` `Translate.tsx` |
| Room Info 面板内 Hide/Leave/Delete/Move to team/Convert to team/Edit | 点标题后的 **面板内部** 动作，不是 chrome 注册表 | `contextualBar/Info/hooks/useRoomActions.ts:17-26`（至少 6 个 items） |
| `media-call-history` | `useCoreRoomRoutes` 有 tab、**无工具栏按钮** | `useCoreRoomRoutes.ts` |
| Omnichannel QuickActions（转接/关闭/挂起/回队/transcript） | `quickActionHooks` 5 个，不是 RoomToolbox | `ui.ts:71-77` |
| V1 `sidebar/RoomMenu.tsx` 房间行 kebab（hide/favorite/leave…） | 房间列表 **行级** 菜单，不是 room list header | `RoomMenu.tsx:20-26` + `useRoomMenuActions` |
| Apps `roomSideBarAction` | **仅类型定义，客户端 0 消费** | `packages/apps-engine/.../UIActionButtonContext.ts:6`；`rg roomSideBarAction` 无 client 调用 |
| 消息工具栏 *Items、composer、drafts、拖放、附件预览、typing、quote bar、thread 面板内部、unread jump、键盘快捷键（除打开说明模态）、selection mode | 题面 OUT OF SCOPE | 其他分册 |
| Admin / Marketplace / Omnichannel 字段级 | 题面禁止展开 | 456 / 188 / 472 ts/tsx |
| 自定义用户状态动态项 `custom-*` | 运行时列表，不预注册稳定 id；覆盖在 `nav.user.status.custom-edit` | `useStatusItems.tsx:151-163` |
| Account 二级侧栏字段 | 只到 Profile/Preferences 入口 | `views/account` |

### 给 implicit 分册的相邻表面

- 点房间标题后的 Room Info **内部** 动作（hide/leave/delete/…）。
- 房间行 kebab（`RoomMenu`）。
- Encrypted/Translate 只读徽章。
- Topic **已有文本** 的只读展示。
- `media-call-history` 无按钮路由。
- QuickActions 5 键。

---

## 与现行 atlas

`baseline: empty`。

检索：

```text
find docs -iname '*atlas*'
# 写入前 = 0
rg -l '稳定语义 id|pm-feature-atlas' docs
# 写入前无匹配
```

本分册 **全部 107 个 id 均为新建**。每条出处见各表「出处」列（`ui.ts:40-68`、`useUserInfoActions.ts:95-108`、navbar/sidebar 文件:line）。无旧 id 可对齐、无重号风险。

姊妹分册（message toolbar / composer implicit / routes views i18n）若并行开 PR，id 命名空间已用 `room.*` `user.*` `nav.*` `sidebar.*` 隔离。