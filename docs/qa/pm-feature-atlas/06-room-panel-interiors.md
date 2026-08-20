# PM Feature-Test Atlas 06 — Room panel interiors

- 仓库：`jianwyao01/Rocket.Chat`（fork）
- 基线分支：`cursor/pm-atlas-merge-blueprint-d43d`（其上 `develop` `e10bd504b9`）
- **本分册只写打开之后的面板内部。** 02 的 `room.toolbox.*`（「打开 Members / Files / …」）不是本表的替代行。
- 不实现产品功能。诚实标记：`[读]` = 源码/JSX/i18n；`[待渲染实测]` = 未挂真实 UI。只把**无法从组件证明的那一块**标待测，不把整格写成「complementary 出现」。
- 共享 a11y：`ContextualbarDialog` 走 `useDialog({ aria-labelledby: 'contextualbarTitle' })` → **role=dialog**，名字=该面板 `ContextualbarTitle` 的 i18n（`ContextualbarDialog.tsx:17`；`ContextualbarTitle.tsx:5`）。关闭钮一律 `button` `aria-label=Close`（`ContextualbarClose.tsx:9`）。返回钮 `title=Back`（`ContextualbarBack.tsx:9`）。

入口缩写：`房间头→工具栏` = `HeaderToolbar[aria-label=Toolbox_room_actions]`。父 tab 用 02 id 标注，本表 id **不回收** 02。

额外命名空间（任务第 9 条要求内部控件，02 列表里没有这些前缀）：`room.autotranslate.*` `room.calls.*` `room.canned.*` `room.contact.*` `room.game.*` `room.outlook.*`。E2EE / live Room Info 落在 `room.info.e2ee.*` / `room.info.live.*`。

---

## 挂载树（VERIFY）

| 问题 | 结论 | 出处 |
|------|------|------|
| 02 已登记的是打开 tab | `roomActionHooks` 29 + apps 注入；本册从 tabComponent **内部 JSX** 再拆行 | `ui.ts:39-68`；02 表 A |
| Room Info kebab | `useRoomActions` items：hide / enter? / edit? / leave? / move? / convert? / delete?；`useSplitRoomActions` 前 2 个变按钮，其余进 `More` | `useRoomActions.ts:30-99`；`useSplitRoomActions.ts:14-27`；`RoomInfo.tsx:66-75` |
| Team Info kebab | hide / edit? / leave / convert-to-channel? / delete?；另有 `View_channels` | `useTeamActions.ts`；`TeamsInfo.tsx:50,124-131` |
| Members 路由 | `members-list`/`user-info-group` 且无 username → `RoomMembers`；否则 `UserInfo` | `MemberListRouter.tsx:26-32` |
| QuickActions | `quickActionHooks` **5**：move-queue / chat-forward / transcript / close-chat / on-hold。Resume **不是** hook，在 composer | `ui.ts:71-77`；`ComposerOmnichannelOnHold.tsx` |
| V1 RoomMenu | `sidebar/RoomMenu.tsx` + `hooks/useRoomMenuActions.ts`；V2 另有通知段 | `RoomMenu.tsx:20-26` |
| EditRoomInfo 无 encrypted 控件 | 表单类型有 `encrypted`，JSX **不渲染**；加密走 toolbox E2EE 弹窗 | `useEditRoomInitialValues.ts:21`；`EditRoomInfo.tsx` 无 `encrypted` 字段 |

---

## 表 A — Room Info / Team Info / live Room Info 壳层

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
|---|---|---|---|---|---|---|---|
| room.info.close | 关掉 Room Info 侧栏 | `…→channel-settings→header ×` | 面板已开 | DOM: [读] `button` name=`Close`；dialog `Channel_info`/`Discussion_info` 关；endpoint: none `closeTab`；persist: [读] URL tab 清掉 | `RoomInfo.tsx:57` | `room.toolbox.channel-settings` | `ContextualbarClose.tsx:9` |
| room.info.kebab | 打开 Room Info 溢出菜单 | `…→Channel_info→More(kebab)` | `actions.items.length>2` `useSplitRoomActions.ts:16-17` | DOM: [读] 触发钮 `title=More`；菜单项 name=Hide/Leave/…；endpoint: none（打开菜单）；persist: 菜单刷新关 | `RoomInfo.tsx:68-74` | | `RoomInfo.tsx:69` |
| room.info.action.hide | 从侧栏隐藏本房间 | `…→Channel_info→Hide`（前两槽常为按钮，否则 More→Hide） | 始终列入 `useRoomActions` 第一项 | DOM: [读] 按钮/menuitem name=`Hide`；确认 dialog confirm=`Yes_hide_it` cancel=`Cancel` 勾选 `Hide_room`；endpoint: [读] `POST /v1/channels.close`\|`/v1/groups.close`\|`/v1/im.close`；persist: [读] subscription.`open=false`，刷新侧栏无此房；导 `/home` | `useRoomActions.ts:32-36` | `sidebar.roomMenu.hide` | `useHideRoomAction.tsx:23-88` |
| room.info.action.edit | 进入 EditRoomInfo | `…→Channel_info→Edit` | `useCanEditRoom`=`edit-room`；联邦另需 owner/mod `useCanEditRoom.ts:12-15` | DOM: [读] 按钮 name=`Edit`；dialog 标题切到 `Edit_channel`/`Edit_team`/`Edit_discussion`；endpoint: none（本地 `setIsEditing`）；persist: [读] 未保存刷新回只读 Info | `useRoomActions.ts:48-56` | | `RoomInfoRouter.tsx:23,35` |
| room.info.action.leave | 离开本房间 | `…→Channel_info→Leave` | `leave-c`/`leave-p` + `room.cl!==false` + 有订阅 `useRoomLeave.tsx:22` | DOM: [读] name=`Leave`；确认 dialog；endpoint: [读] `POST /v1/channels.leave`\|`/v1/groups.leave`\|`/v1/im.leave`；persist: [读] 成员身份刷新不在；`/home` | `useRoomActions.ts:58-66` | `sidebar.roomMenu.leave` | `useRoomLeave.tsx:12-58` |
| room.info.action.move-to-team | 把独立频道/组移进团队 | `…→More→Teams_move_channel_to_team` | `!federated && !teamId && !prid && canEdit` | DOM: [读] menuitem name=`Teams_move_channel_to_team`；随后 modal；endpoint: [读] `POST /v1/teams.addRooms`；persist: [读] `room.teamId` 刷新仍在 | `useRoomActions.ts:68-76` | `room.teamChannels.add-existing` | `useRoomMoveToTeam.tsx:9-38` |
| room.info.action.convert-to-team | 把频道/组转成团队 | `…→More→Teams_convert_channel_to_team` | `create-team` + canEdit + `!teamId` + `!prid` + `!federated` | DOM: [读] name=`Teams_convert_channel_to_team`；确认 `Convert`；endpoint: [读] `POST /v1/channels.convertToTeam` 或 `/v1/groups.convertToTeam`；persist: [读] 房间变 teamMain | `useRoomActions.ts:78-86` | | `useRoomConvertToTeam.tsx:9-47` |
| room.info.action.delete | 删除房间（团队主房走团队删除弹层） | `…→More→Delete`（danger 段） | `delete-{t}`（团队子房另加 `delete-team-channel/group`）且 `!federated` | DOM: [读] name=`Delete`；确认 modal；endpoint: [读] `POST /v1/rooms.delete` 或 `POST /v1/teams.delete`；persist: [读] 房间刷新不在；`/home` | `useRoomActions.ts:88-97` | | `useDeleteRoom.tsx:12-102` |
| room.info.action.enter | 从 Info 进入房间 | `…→Channel_info→Enter` | 仅当传入 `onClickEnterRoom` | DOM: [读] name=`Enter`；endpoint: 调用方导航；persist: 进房 URL | `useRoomActions.ts:38-46` | | `RoomInfoRouter.tsx:13,37-39` |
| room.info.action.enter.unwired | Enter 在当前房间头路径未接线 | 同上，但从 `RoomTitle`/`toolbox` 打开的 Info | 仓库内房间头 **未传** `onEnterRoom` | DOM: [读] **不出现** Enter；endpoint: none；persist: n/a | `RoomInfoRouter.tsx:13` | | `rg onEnterRoom` 无房间头调用 |
| room.info.team.close | 关掉 Team Info | `…→team-info→×` | 面板已开 | DOM: [读] `button` `Close`；dialog name=`Teams_Info` 关；endpoint: none；persist: URL tab 清 | `TeamsInfo.tsx:51` | `room.toolbox.team-info` | `TeamsInfo.tsx:50` |
| room.info.team.kebab | 打开 Team Info More | `…→Teams_Info→More` | items>2 | DOM: [读] `title=More`；endpoint: none；persist: 菜单刷新关 | `TeamsInfo.tsx:64-71` | | `useSplitRoomActions.ts:14-27` |
| room.info.team.action.hide | 隐藏团队主房 | `…→Teams_Info→Hide` | 始终第一项 | DOM: [读] name=`Hide`；确认同 hide 弹层；endpoint: [读] close by `room.t`；persist: 订阅 `open=false` | `useTeamActions.ts:24-28` | `room.info.action.hide` | `useHideRoomAction.tsx:23-88` |
| room.info.team.action.edit | 打开编辑团队（同一 EditRoomInfo） | `…→Teams_Info→Edit` | `edit-team-channel` on `room._id` | DOM: [读] name=`Edit`；dialog 标题 `Edit_team`；endpoint: none；persist: 未保存刷新回 Info | `useTeamActions.ts:30-38` | `room.info.action.edit` | `TeamsInfoWithData.tsx:14,18-25` |
| room.info.team.action.leave | 离开团队 | `…→Teams_Info→Leave` | hook 始终返回（权限检查被注释） | DOM: [读] name=`Leave`；`LeaveTeam` modal；endpoint: [读] `POST /v1/teams.leave`；persist: 成员刷新不在；`/home` | `useTeamActions.ts:40-48` | | `useLeaveTeam.tsx:9-44` |
| room.info.team.action.convert-to-channel | 团队改回独立频道 | `…→More→Convert_to_channel` | `edit-team-channel` | DOM: [读] name=`Convert_to_channel`；`ConvertToChannelModal`；endpoint: [读] `POST /v1/teams.convertToChannel`；persist: 不再是 teamMain | `useTeamActions.ts:50-58` | | `useConvertToChannel.tsx:9-48` |
| room.info.team.action.delete | 删除团队（含子房选择） | `…→More→Delete` | 同 `useDeleteRoom`；联邦隐藏 | DOM: [读] name=`Delete`；`DeleteTeamModal`；endpoint: [读] `POST /v1/teams.delete`；persist: 团队刷新不在 | `useTeamActions.ts:60-69` | `room.info.action.delete` | `useDeleteRoom.tsx:70-82` |
| room.info.team.view-channels | 从 Team Info 跳到团队频道列表 | `…→Teams_Info→View_channels` | `onClickViewChannels` 始终传入 | DOM: [读] `button` name=`View_channels`；dialog 标题改 `Team_Channels`；endpoint: none `openTab('team-channels')`；persist: [读] URL `tab=team-channels` | `TeamsInfo.tsx:124-131` | `room.toolbox.team-channels` | `TeamsInfoWithData.tsx:16` |
| room.info.live.close | 关掉 livechat Room Info | live `…→room-info→×` | `groups∈{live}` | DOM: [读] `button` `Close`；dialog name=`Room_Info`；endpoint: none；persist: URL tab 清 | `ChatsContextualBar.tsx:42` | `room.toolbox.room-info` | `ChatsContextualBar.tsx:18-21,39-42` |
| room.info.live.edit | 从只读 ChatInfo 进编辑 | `…→Room_Info→Edit` | 有订阅 **或** 自己是 servedBy **或** `save-others-livechat-room-info` | DOM: [读] `button` name=`Edit`；标题改 `edit-room`；endpoint: none（改 route context=edit）；persist: [读] URL `tab=room-info&context=edit` | `ChatInfo.tsx:70-88,174-176` | | `ChatInfo.tsx:174` |
| room.info.live.edit.denied | 无编辑权点 Edit | 同上但三权皆无 | `!subscription && !hasLocal && !hasGlobal` | DOM: [读] 仍渲染 Edit 按钮；toast `Not_authorized`；**不进**编辑表；endpoint: none；persist: 仍停在 info | `ChatInfo.tsx:71-73` | | `ChatInfo.tsx:70-74` |

---

## 表 B — EditRoomInfo（一控件一行）

父路径：`房间头→工具栏→Room_Info/Teams_Info→Edit`。Save 统一 `POST /v1/rooms.saveRoomSettings`（归档另 `POST /v1/rooms.changeArchivationState`）。`encrypted` **无控件**，见边界。

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
|---|---|---|---|---|---|---|---|
| room.info.edit.back | 从编辑回到 Info | `…→Edit_*→Back` | 始终 | DOM: [读] `button` title=`Back`；dialog 标题回到 `Channel_info`/`Teams_Info`；endpoint: none `setIsEditing(false)`；persist: 未保存丢 | `EditRoomInfo.tsx:242` | | `ContextualbarBack.tsx:9` |
| room.info.edit.close | 从编辑关掉整栏 | `…→Edit_*→×` | 始终 | DOM: [读] `button` `Close`；dialog 消失；endpoint: none `closeTab`；persist: URL tab 清 | `EditRoomInfo.tsx:244` | `room.info.close` | `EditRoomInfoWithData.tsx:9-11` |
| room.info.edit.avatar.upload | 上传房间头像 | `…→Edit→Upload` | 联邦 disabled | DOM: [读] `button` label=`Upload` title=`Upload_user_avatar`；选文件后 dirty；endpoint: 待 Save `{roomAvatar}`；persist: [读] 保存后头像刷新仍在 | `RoomAvatarEditor.tsx:65-67` | | `EditRoomInfo.tsx:249-253` |
| room.info.edit.avatar.reset | 头像恢复默认 | `…→Edit→头像 trash` | disabled: `!roomAvatar \|\| federated` | DOM: [读] `button` title=`Accounts_SetDefaultAvatar`；清 `roomAvatar`；endpoint: 待 Save；persist: 保存后默认头像 | `RoomAvatarEditor.tsx:69-76` | | `RoomAvatarEditor.tsx:74` |
| room.info.field.name | 改房间/团队名 | `…→Edit→Name` | 字段始终画；`disabled=!canViewName`（`RoomSettingsEnum.NAME`） | DOM: [读] `textbox` label=`Name` required；校验 `Required_field`；endpoint: Save `{roomName}`，预检 `GET /v1/rooms.nameExists`；persist: [读] `room.name` 刷新仍在 | `EditRoomInfo.tsx:256-280` | | `EditRoomInfo.tsx:202-213` |
| room.info.field.topic | 改主题 | `…→Edit→Topic` | `canViewTopic`；ABAC `disabled` | DOM: [读] `textbox` label=`Topic` hint=`Displayed_next_to_name`；endpoint: `{roomTopic}`；persist: 刷新仍在 | `EditRoomInfo.tsx:282-297` | `room.header.topic-add` | `useEditRoomPermissions.ts:57` |
| room.info.field.announcement | 改公告 | `…→Edit→Announcement` | `canViewAnnouncement`；联邦/ABAC disabled | DOM: [读] `textbox` label=`Announcement` hint=`Information_to_keep_top_of_mind`；endpoint: `{roomAnnouncement}`；persist: 刷新仍在 | `EditRoomInfo.tsx:299-319` | | `EditRoomInfo.tsx:311` |
| room.info.field.description | 改描述 | `…→Edit→Description` | `canViewDescription`；联邦/ABAC disabled | DOM: [读] `textbox`(textarea) label=`Description`；endpoint: `{roomDescription}`；persist: 刷新仍在 | `EditRoomInfo.tsx:321-333` | | `EditRoomInfo.tsx:329` |
| room.info.field.type | 公/私切换 | `…→Edit→Private` | `canViewType`；disabled: `!canChangeType \|\| federated` | DOM: [读] `switch` label=`Private` hint=`Only_invited_people`/`Anyone_can_access`；endpoint: `{roomType}`；persist: `room.t` c↔p | `EditRoomInfo.tsx:335-361` | | `useEditRoomPermissions.ts:24-29,61` |
| room.info.edit.accordion.advanced | 展开高级设置 | `…→Edit→Advanced_settings` | `showAdvancedSettings`（只读/归档/加入码/系统消息任一可见） | DOM: [读] AccordionItem title=`Advanced_settings`；展开后下列开关出现；endpoint: none；persist: UI only | `EditRoomInfo.tsx:364-367` | | `EditRoomInfo.tsx:234-237` |
| room.info.field.read-only | 只读模式 | `…→Advanced→Read_only` | `canViewReadOnly`（broadcast 房间类型才露出）；联邦 disabled | DOM: [读] `switch` label=`Read_only` hint=`Read_only_field_hint_enabled/disabled`；endpoint: `{readOnly}`；persist: `room.ro` | `EditRoomInfo.tsx:372-393` | | `public.ts:28-29` |
| room.info.field.react-when-readonly | 只读时仍可反应 | `…→Advanced→React_when_read_only` | 仅 `readOnly===true` 时渲染；disabled `!canSetReactWhenReadOnly` | DOM: [读] `switch` label=`React_when_read_only` hint=`Anyone_can_react_to_messages`/`Only_authorized_users_can_react_to_messages`；endpoint: `{reactWhenReadOnly}`；persist: 刷新仍在 | `EditRoomInfo.tsx:395-418` | | `useEditRoomPermissions.ts:31,65` |
| room.info.field.archived | 归档/解档 | `…→Advanced→Room_archivation_state_true` | `canViewArchived`；开关使能需 `archive-room`/`unarchive-room`；DM 隐藏 | DOM: [读] `switch` label=`Room_archivation_state_true` hint=`New_messages_cannot_be_sent`；endpoint: [读] **另** `POST /v1/rooms.changeArchivationState`；persist: `room.archived` | `EditRoomInfo.tsx:420-443` | | `useArchiveRoom.ts:9-17` |
| room.info.field.join-code-required | 开关加入密码 | `…→Advanced→Password_to_access` | `canViewJoinCode`（私有组指令返回 false）；联邦 disabled | DOM: [读] `switch` label=`Password_to_access`；开则露出密码框；endpoint: Save `{joinCode}`；persist: 刷新仍需码 | `EditRoomInfo.tsx:445-456` | | `useEditRoomPermissions.ts:64` |
| room.info.field.join-code | 填写加入密码 | `…→Advanced→Reset_password` | `joinCodeRequired===true` | DOM: [读] password `textbox` placeholder=`Reset_password`；endpoint: `{joinCode}`；persist: 新码刷新有效 | `EditRoomInfo.tsx:457-466` | | `EditRoomInfo.tsx:174` |
| room.info.field.hide-sys-mes | 隐藏系统消息总开关 | `…→Advanced→Hide_System_Messages` | `canViewHideSysMes`；联邦 disabled | DOM: [读] `switch` label=`Hide_System_Messages`；endpoint: `{systemMessages:[]\|selected}`；persist: 刷新仍藏 | `EditRoomInfo.tsx:470-487` | | `EditRoomInfo.tsx:175-177` |
| room.info.field.system-messages | 多选要藏的系统消息类型 | `…→Advanced→Select_messages_to_hide` | 上项开着；disabled `!hideSysMes \|\| federated` | DOM: [读] MultiSelect `aria-label=Select_messages_to_hide` placeholder 同；选项=`MessageTypesValues` i18n；endpoint: `{systemMessages}`；persist: 刷新仍选 | `EditRoomInfo.tsx:488-502` | | `EditRoomInfo.tsx:496-498` |
| room.info.edit.accordion.prune | 展开房间级保留策略 | `…→Edit→Prune` | `edit-room-retention-policy` 且 setting `RetentionPolicy_Enabled` | DOM: [读] AccordionItem title=`Prune`；endpoint: none；persist: UI | `EditRoomInfo.tsx:512-513` | `room.toolbox.clean-history` | `EditRoomInfo.tsx:235-236` |
| room.info.field.retention-enabled | 开房间保留 | `…→Prune→RetentionPolicyRoom_Enabled` | 在 prune 手风琴内 | DOM: [读] `switch` label=`RetentionPolicyRoom_Enabled`；endpoint: `{retentionEnabled}`；persist: 刷新仍在 | `EditRoomInfo.tsx:515-525` | | `EditRoomInfo.tsx:522` |
| room.info.field.retention-override-global | 覆盖全局保留 | `…→Prune→RetentionPolicyRoom_OverrideGlobal` | disabled `!retentionEnabled` | DOM: [读] `switch` label=`RetentionPolicyRoom_OverrideGlobal`；开后露出 max-age 等；endpoint: `{retentionOverrideGlobal}`；persist: 刷新仍在 | `EditRoomInfo.tsx:527-537` | | `EditRoomInfo.tsx:534` |
| room.info.field.retention-max-age | 保留天数 | `…→Prune→RetentionPolicyRoom_MaxAge` | `retentionOverrideGlobal` | DOM: [读] `spinbutton` label=`RetentionPolicyRoom_MaxAge`；endpoint: `{retentionMaxAge}`；persist: 刷新仍在 | `EditRoomInfo.tsx:544-560` | | `EditRoomInfo.tsx:68-77` |
| room.info.field.retention-exclude-pinned | 保留时排除置顶 | `…→Prune→RetentionPolicyRoom_ExcludePinned` | override on | DOM: [读] `switch` label=`RetentionPolicyRoom_ExcludePinned`；endpoint: `{retentionExcludePinned}`；persist: 刷新仍在 | `EditRoomInfo.tsx:562-572` | | `EditRoomInfo.tsx:569` |
| room.info.field.retention-files-only | 只剪文件 | `…→Prune→RetentionPolicyRoom_FilesOnly` | override on | DOM: [读] `switch` label=`RetentionPolicyRoom_FilesOnly`；endpoint: `{retentionFilesOnly}`；persist: 刷新仍在 | `EditRoomInfo.tsx:574-584` | | `EditRoomInfo.tsx:581` |
| room.info.field.retention-ignore-threads | 不剪线程 | `…→Prune→RetentionPolicy_DoNotPruneThreads` | override on | DOM: [读] `switch` label=`RetentionPolicy_DoNotPruneThreads`；endpoint: `{retentionIgnoreThreads}`；persist: 刷新仍在 | `EditRoomInfo.tsx:586-596` | `room.prune.threads` | `EditRoomInfo.tsx:593` |
| room.info.edit.reset | 丢弃未保存编辑 | `…→Edit→Reset` | disabled `!isDirty \|\| isSubmitting` | DOM: [读] `button` name=`Reset`；表单回 defaultValues；endpoint: none；persist: 无 | `EditRoomInfo.tsx:609-610` | | `EditRoomInfo.tsx:609` |
| room.info.edit.save | 提交脏字段 | `…→Edit→Save` | disabled `!isDirty` | DOM: [读] `button` name=`Save`；toast `Room_updated_successfully`；关栏；endpoint: [读] `POST /v1/rooms.saveRoomSettings` + 可选 `POST /v1/rooms.changeArchivationState`；persist: [读] 房间字段刷新仍在 | `EditRoomInfo.tsx:612-613,155-199` | | `EditRoomInfo.tsx:150` |

---

## 表 B2 — live RoomEdit 字段

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
|---|---|---|---|---|---|---|---|
| room.info.live.field.topic | 改会话主题 | `…→edit-room→Topic` | 编辑态已开 | DOM: [读] `textbox` label=`Topic`；endpoint: 待 Save `POST /v1/livechat/room.saveInfo` `{topic}`；persist: ChatInfo 主题刷新仍在 | `RoomEdit.tsx:137-142` | | `RoomEdit.tsx:59,94-104` |
| room.info.live.field.tags | 改会话标签 | `…→edit-room→Tags` | 编辑态 | DOM: [读] Tags 控件（多选/输入）；endpoint: `{tags}`；persist: 刷新仍在 | `RoomEdit.tsx:144-146` | `room.quick.closeChat.form.tags` | `Tags.tsx` |
| room.info.live.field.sla | 选 SLA | `…→edit-room→SLA_Policy` | `slaPolicies.length>0` | DOM: [读] select label=`SLA_Policy`；endpoint: `{slaId}`；persist: 刷新仍在 | `RoomEdit.tsx:148-150` | | `useSlaPolicies` |
| room.info.live.field.priority | 选优先级 | `…→edit-room→Priority` | `priorities.length>0` | DOM: [读] select label=`Priority`；endpoint: `{priorityId}`；persist: 刷新仍在 | `RoomEdit.tsx:152-154` | `sidebar.roomMenu.priority` | `useOmnichannelPriorities` |
| room.info.live.field.custom | 填房间自定义字段 | `…→edit-room→(metadata 字段)` | `view-livechat-room-customfields` 或 `edit-livechat-room-customfields` | DOM: [读] `CustomFieldsForm` 运行时字段；endpoint: `{livechatData}`；persist: 刷新仍在 | `RoomEdit.tsx:133-135` | | `useCustomFieldsMetadata` |
| room.info.live.cancel | 取消编辑回只读 | `…→edit-room→Cancel` | 编辑态 | DOM: [读] `button` name=`Cancel`；标题回 `Room_Info`；endpoint: none；persist: 未保存丢 | `RoomEdit.tsx:158-160` | | `ChatsContextualBar.tsx:31-33` |
| room.info.live.save | 保存 live 房间信息 | `…→edit-room→Save` | disabled `!isFormValid \|\| !isFormDirty` | DOM: [读] `button` name=`Save`；toast `Saved`；endpoint: [读] `POST /v1/livechat/room.saveInfo`；persist: [读] 房间 info query 失效后刷新仍在 | `RoomEdit.tsx:162-170` | | `RoomEdit.tsx:59,104` |

---

## 表 C — Members 列表内部

父：`room.toolbox.members-list`（c/p/team）或 `room.toolbox.user-info-group`（direct_multiple）。1:1 `user-info` **没有**本表列表。成员行动作与 02 `user.action.*` 同源 hook，**仍写新 id**，关联旧 id。

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
|---|---|---|---|---|---|---|---|
| room.members.close | 关成员栏 | `…→Members→×` | 已开 | DOM: [读] `button` `Close`；dialog name=`Members` 或 `Teams_members` 关；endpoint: none；persist: URL tab 清 | `RoomMembers.tsx:147` | `room.toolbox.members-list` | `RoomMembers.tsx:146` |
| room.members.search | 按用户名过滤 | `…→Members→Search_by_username` | 始终渲染 | DOM: [读] `textbox` `aria-label=Search_by_username` placeholder 同；debounce 800ms 重拉列表；endpoint: [读] `GET /v1/rooms.membersOrderedByRole` 或 `GET /v1/im.members` `filter`；persist: [读] 过滤词不持久；类型见下行 | `RoomMembers.tsx:150-158` | | `RoomMembersWithData.tsx:58` |
| room.members.filter-status | Online / All | `…→Members→Select` | 始终 | DOM: [读] Select 选项 `Online`/`All`；endpoint: 同上 + `status`；persist: [读] `localStorage['members-list-type']` | `RoomMembers.tsx:160-165` | | `RoomMembersWithData.tsx:37` |
| room.members.load-more | 滚到底加载下一页 | `…→Members→列表底部交叉` | `hasNextPage` | DOM: [读] `InfiniteListAnchor` 无独立 name；计数文案 `Showing_current_of_total`；endpoint: 同上 offset；persist: query cache | `RoomMembers.tsx:203` | | `InfiniteListAnchor.tsx:19-23` |
| room.members.empty | 过滤后无成员 | `…→Members` 且 `members.length===0` | `isSuccess` | DOM: [读] empty title=`No_members_found`；endpoint: 列表已空；persist: n/a | `RoomMembers.tsx:190` | | `RoomMembers.tsx:190` |
| room.members.error | 列表请求失败 | `…→Members` query error | `error` | DOM: [读] `Callout` danger 文案=`error.message`；无重试钮；endpoint: 失败的 members GET；persist: n/a | `RoomMembers.tsx:175-178` | | `RoomMembers.tsx:177` |
| room.members.denied.broadcast | broadcast 且无权限则整 tab 不出现 | 房间头工具栏找 Members | `room.broadcast && !view-broadcast-member-list` | DOM: [读] **工具栏无** Members/`Teams_members`；endpoint: hook 返回 undefined；persist: 刷新仍无 | `useMembersListRoomAction.ts:19-20` | `room.toolbox.members-list` | `useMembersListRoomAction.ts:18-21` |
| room.members.denied.federation | 非原生联邦隐藏成员 tab | 同上 | `isRoomFederated && !isRoomNativeFederated` | DOM: [读] 工具栏无 Members；endpoint: undefined；persist: 刷新仍无 | `useMembersListRoomAction.ts:23-25` | | `useMembersListRoomAction.ts:15-16,23-25` |
| room.members.invite-link | 打开邀请链接子页 | `…→Members→Invite_Link` | `!isDirect` 且 `canCreateInviteLinks && canAddUsers`；ABAC 则 disabled | DOM: [读] `button` `aria-label=Invite_Link` name=`Invite_Link`；进 INVITE 子页 title=`Invite_Users`（包装）；endpoint: 子页再 `POST /v1/findOrCreateInvite`；persist: 子页状态 | `RoomMembers.tsx:219-229` | | `RoomMembersWithData.tsx:48-51,135` |
| room.members.invite-link.denied.abac | ABAC 房邀请钮禁用 | 同上 | `room.abacAttributes` | DOM: [读] 按钮 disabled `title=Not_available_for_ABAC_enabled_rooms`；endpoint: 不导航；persist: n/a | `RoomMembers.tsx:224-225` | | `RoomMembersWithData.tsx:137` |
| room.members.add-users | 打开加用户子页 | `…→Members→Add` | `!isDirect` 且 `canAddUsers` | DOM: [读] `button` name=`Add`；dialog 标题改 `Add_users`；endpoint: none 至提交；persist: 子页 | `RoomMembers.tsx:231-234` | | `RoomMembersWithData.tsx:64-72,136` |
| room.members.add-users.denied | 无加人权则无 Add/Invite 脚 | `…→Members` 底栏 | `!canAddUsers` 或 `isDirect` | DOM: [读] **不渲染** footer；无拒绝文案；endpoint: n/a；persist: n/a | `RoomMembers.tsx:216` | | `RoomMembersWithData.tsx:135-136` |
| room.members.row.open-user-info | 点成员行开 UserInfo | `…→Members→行(aria-label=显示名)` | 列表有该行 | DOM: [读] 行 `aria-label={nameOrUsername}`；换成 UserInfo dialog；endpoint: [读] `GET /v1/users.info`；persist: 子页至 Back | `RoomMembersItem.tsx:70-87` | `user.card.see-full-profile` | `RoomMembersWithData.tsx:78-84` |
| room.members.row.kebab | 打开成员行 More | `…→Members→行→More` | `useUserInfoActions` 非空；空则 disabled | DOM: [读] `button` title=`More`；分段菜单；endpoint: none；persist: n/a | `RoomMembersItem.tsx:104-117` | | `RoomMembersActions.tsx:16-28` |
| room.members.action.direct-message | 对成员开 DM | `…→行 More 或 UserInfo→Direct_Message` | `create-d` 或已有订阅；`!embedded` | DOM: [读] name=`Direct_Message`；进 1:1 房；endpoint: 路由 `direct`；persist: 侧栏 DM 刷新仍在 | `useDirectMessageAction.ts:18-24` | `user.action.direct-message` | `useUserInfoActions.ts:95` |
| room.members.action.video-call | 对成员发起视频 | `…→Video_call` | 已有 DM；`!federated`；非自己；`VideoConf_Enable_DMs`；`call-management` | DOM: [读] title=`Video_call`；outgoing 弹层 [待渲染实测] 弹层 role；endpoint: [读] `POST /v1/video-conference.start`；persist: Calls 列表 | `useVideoCallAction.ts:39-64` | `user.action.video-call` | `useUserInfoActions.ts:96` |
| room.members.action.voice-call | 对成员发起语音 | `…→Voice_call__user_` | voip 可用；非联邦/拉黑/自己 | DOM: [读] name=`Voice_call__user_`；voip widget；endpoint: widget 信令；persist: Call_history [待渲染实测] | `useUserMediaCallAction.ts:42-55` | `user.action.voice-call` | `useUserInfoActions.ts:97` |
| room.members.action.add-to-room | 把非成员拉进房 | UserInfo（非列表行）→ add-to-room | `!isMember`；invite 权；非归档 | DOM: [读] name=`add-to-room`；toast `User_added`；endpoint: [读] `POST /v1/channels.invite`\|`/v1/groups.invite`；persist: 成员刷新在 | `useAddUserAction.ts:85-96` | `user.action.add-to-room` | `useUserInfoActions.ts:98` |
| room.members.action.set-owner | 授/撤 owner | `…→More→Set_as_owner`/`Remove_as_owner` | `isMember`；`set-owner`；`roomCanSetOwner`；自己与对端文案双态 | DOM: [读] name=`Set_as_owner`/`Remove_as_owner`；toast owner 文案；endpoint: [读] `POST /v1/channels.addOwner`\|`removeOwner` 或 groups；persist: 角色刷新仍在 | `useChangeOwnerAction.tsx:135-148` | `user.action.change-owner` | `useUserInfoActions.ts:99` |
| room.members.action.set-owner.federated | 联邦改 owner 先警告 | 同上且原生联邦 | `Federation.actionAllowed` | DOM: [读] 先 dialog title=`Warning`/`Federation_Matrix_losing_privileges` confirm=`Yes_continue`；再打同一 POST；persist: 同 | `useChangeOwnerAction.tsx:104-126` | | `useChangeOwnerAction.tsx:104-126` |
| room.members.action.set-leader | 授/撤 leader | `…→Set_as_leader`/`Remove_as_leader` | `set-leader` + `roomCanSetLeader`；DM 指令为 false | DOM: [读] 双态 name；endpoint: [读] `POST /v1/channels.addLeader`\|`removeLeader` 或 groups；persist: 角色刷新 | `useChangeLeaderAction.ts:58-69` | `user.action.change-leader` | `useUserInfoActions.ts:100` |
| room.members.action.set-moderator | 授/撤 moderator | `…→Set_as_moderator`/`Remove_as_moderator` | `set-moderator` + `roomCanSetModerator` | DOM: [读] 双态 name；endpoint: channels/groups `*Moderator`；persist: 角色刷新 | `useChangeModeratorAction.tsx:149-160` | `user.action.change-moderator` | `useUserInfoActions.ts:101` |
| room.members.action.set-moderator.federated | 联邦改 mod 先警告 | 同上且联邦 | 同联邦规则 | DOM: [读] 同 `Yes_continue` 警告 dialog；再 POST；persist: 同 | `useChangeModeratorAction.tsx:101-136` | | `useChangeModeratorAction.tsx:101-136` |
| room.members.action.moderation-console | 跳该用户审核台 | `…→Moderation_Action_View_reports` | `view-moderation-console` | DOM: [读] name=`Moderation_Action_View_reports`；离开房间；endpoint: 路由 `moderation-console?uid=`；persist: URL | `useRedirectModerationConsole.ts:21-26` | `user.action.moderation-console` | `useUserInfoActions.ts:102` |
| room.members.action.ignore | 忽略/取消忽略对端（非自己） | `…→Ignore`/`Unignore` | `roomCanIgnore`；`uid!==own`（自己不出现） | DOM: [读] name=`Ignore`/`Unignore`；toast `User_has_been_ignored`/`User_has_been_unignored`；endpoint: [读] `GET /v1/chat.ignoreUser`；persist: subscription.ignored | `useIgnoreUserAction.ts:46-57` | `user.action.ignore` | `useUserInfoActions.ts:103` |
| room.members.action.mute | 禁言/解禁 | `…→Mute_user`/`Unmute_user` | `mute-user` + `roomCanMute` | DOM: [读] Mute 先 danger dialog 文案=`The_user_wont_be_able_to_type_in_s` confirm=`Yes_mute_user`；Unmute 无弹层；endpoint: [读] `POST /v1/rooms.muteUser`\|`unmuteUser`；persist: `room.muted` | `useMuteUserAction.tsx:67-109` | `user.action.mute` | `useUserInfoActions.ts:104` |
| room.members.action.block | 1:1 拉黑（频道成员列表不出现） | UserInfo in 1:1 → Block/Unblock | `roomCanBlock` 仅 1:1 DM；`uid!==own` | DOM: [读] name=`Block`/`Unblock`；endpoint: [读] `POST /v1/im.blockUser`；persist: subscription.blocker | `useBlockUserAction.ts:45-54` | `user.action.block` | `direct.ts:48-50` |
| room.members.action.kick | 踢出/移出团队/撤销邀请 | `…→Remove_from_room`/`Remove_from_team`/`Revoke_invitation` | `remove-user` 或联邦可编辑；`roomCanRemove` | DOM: [读] 三选一 name；确认 `Yes_remove_user` 或团队向导；endpoint: [读] `POST /v1/channels.kick`\|`/v1/groups.kick` 或 `POST /v1/teams.removeMember`；persist: 成员刷新不在 | `useRemoveUserAction.tsx:83-142` | `user.action.remove` | `useUserInfoActions.ts:106` |
| room.members.action.ban | 封禁 | `…→Ban_user_from_room` | `ban-user` + `roomCanBan` | DOM: [读] name=`Ban_user_from_room`；dialog `Are_you_sure` / `The_user_will_be_banned_from__roomName__` confirm=`Yes_ban_user`；endpoint: [读] `POST /v1/rooms.banUser`；persist: 成员消失，Banned_Users 出现 | `useBanUserAction.ts:36-42` | `user.action.ban` `room.banned.unban` | `useBanUser.tsx:48-58` |
| room.members.action.report | 举报对端 | `…→Report` | `ownUserId!==uid` | DOM: [读] name=`Report`；`ReportUserModal` textarea label=`Report_reason` confirm=`Report`；endpoint: [读] `POST /v1/moderation.reportUser`；persist: 审核记录 | `useReportUser.tsx:33-53` | `user.action.report` | `ReportUserModal.tsx` |
| room.members.user-info.back | UserInfo 回到列表 | `…→UserInfo→Back` | 从列表点进（有 `onClickBack`） | DOM: [读] title=`Back`；回到 Members dialog；endpoint: none；persist: 列表 | `UserInfoWithData.tsx:98` | | `ContextualbarBack.tsx:9` |
| room.members.user-info.close | 从 UserInfo 关栏 | `…→UserInfo→×` | 始终 | DOM: [读] `Close`；整栏关；endpoint: none；persist: URL 清 | `UserInfoWithData.tsx:101` | `room.members.close` | `UserInfoWithData.tsx:101` |
| room.members.add.back | 加用户页返回列表 | `…→Add_users→Back` | 子页 | DOM: [读] title=`Back`；回 Members；endpoint: none；persist: n/a | `AddUsers.tsx:116` | | `AddUsers.tsx:116` |
| room.members.add.picker | 多选要加的人 | `…→Add_users→Choose_users` | 子页 | DOM: [读] 多选 label/placeholder=`Choose_users`；选项 `aria-label=username`；endpoint: [读] `GET /v1/users.autocomplete`；persist: 表单至提交 | `AddUsers.tsx:123-137` | | `UserAutoCompleteMultiple.tsx:97-122` |
| room.members.add.submit | 提交邀请（非联邦） | `…→Add_users→Add_users` | `isDirty`；非联邦 | DOM: [读] `button` name=`Add_users`；toast `Users_added`；回列表；endpoint: [读] `POST /v1/channels.invite`\|`/v1/groups.invite`；persist: 成员刷新在 | `AddUsers.tsx:165-167` | | `AddUsers.tsx:44-46,66-68` |
| room.members.add.submit.federated | 联邦加用户（先核 Matrix） | `…→Add_users→Add_users` | 原生联邦；`!isFederationBlocked` | DOM: [读] 同钮；可能先 `AddMatrixUsersModal` confirm=`Yes_continue`；toast `Users_invited`；endpoint: [读] `GET /v1/federation/matrixIds.verify` 再 invite；persist: 成员刷新 | `AddUsers.tsx:149-162` | | `useAddMatrixUsers` |
| room.members.add.external-denied | 非联邦房拒外部 Matrix id | 选择 `@external` 用户 | `!isFederated && user.startsWith('@')` | DOM: [读] `alert` `You_cannot_add_external_users_to_non_federated_room`；提交被 validate 拦住；endpoint: 不发 invite；persist: n/a | `AddUsers.tsx:127-128,139-143` | | `AddUsers.tsx:24,127-128` |
| room.members.add.unban-confirm | 加被封用户时先解封 | 提交且 API `error-user-is-banned` | 目标在 banned 列表 | DOM: [读] modal title=`User_is_banned` checkbox=`Yes_unban_user` confirm=`Add_users`；endpoint: [读] `POST /v1/rooms.unbanUser` 再 invite；persist: 不再 banned 且在成员 | `AddUsers.tsx:78-104` | `room.banned.unban` | `BannedUsersUnbanModal.tsx:62-71` |
| room.members.invite.back | 邀请页返回 | `…→Invite→Back` | 子页 | DOM: [读] title=`Back`；回列表；endpoint: none | `InviteUsersWrapper.tsx:24` | | `InviteUsersWrapper.tsx:24` |
| room.members.invite.copy | 复制邀请 URL | `…→Invite_Link 字段旁 copy` | 已有 linkText | DOM: [读] 图标钮（UrlInput endAddon）；toast `Copied`；endpoint: 链接来自 `POST /v1/findOrCreateInvite`；persist: 剪贴板；链接服务端仍在 | `InviteLink.tsx:27` | | `useClipboardWithToast.ts:11` |
| room.members.invite.edit | 打开编辑邀请参数 | `…→Edit_Invite` | `onClickEdit` | DOM: [读] `button` name=`Edit_Invite`；露出天数/次数；endpoint: none 至 Generate | `InviteLink.tsx:38` | | `InviteLink.tsx:36-39` |
| room.members.invite.expiration | 选过期天数 | `…→Expiration_(Days)` | 编辑态 | DOM: [读] Select label=`Expiration_(Days)` 选项 1/7/15/30/`Never`；endpoint: 待 Generate；persist: 新链接参数 | `EditInviteLink.tsx:48-58` | | `EditInviteLink.tsx:22-30` |
| room.members.invite.max-uses | 选最大使用次数 | `…→Max_number_of_uses` | 编辑态 | DOM: [读] Select label=`Max_number_of_uses` 5…100/`No_Limit`；endpoint: 待 Generate；persist: 新链接 | `EditInviteLink.tsx:62-73` | | `EditInviteLink.tsx:33-42` |
| room.members.invite.generate | 生成新邀请链接 | `…→Generate_New_Link` | dirty 且非 submitting | DOM: [读] `button` name=`Generate_New_Link`；toast `Invite_link_generated`；endpoint: [读] `POST /v1/findOrCreateInvite`；persist: 新 URL/过期刷新仍在 | `EditInviteLink.tsx:76-77` | | `InviteUsersWithData` |

---

## 表 D — Files

父：`room.toolbox.uploaded-files-list`。dialog name=`Files`。

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
|---|---|---|---|---|---|---|---|
| room.files.close | 关文件栏 | `…→Files→×` | 已开 | DOM: [读] `button` `Close`；dialog `Files` 关；endpoint: none；persist: URL 清 | `RoomFiles.tsx:74` | `room.toolbox.uploaded-files-list` | `RoomFiles.tsx:73` |
| room.files.search | 按文件名搜 | `…→Files→Search_Files` | 始终 | DOM: [读] `textbox` `aria-label=Search_Files`；debounce 400ms；endpoint: [读] `GET /v1/channels.files`\|`/v1/groups.files`\|`/v1/im.files` `name`；persist: 会话内 | `RoomFiles.tsx:77-85` | | `useFilesList.ts:28-38` |
| room.files.type-filter | 按类型过滤 | `…→Files→type Select` | 始终 | DOM: [读] 选项 `All`/`Images`/`Videos`/`Audios`/`Texts`/`Files`；endpoint: 同上 `typeGroup`；persist: [读] `localStorage['file-list-type']` | `RoomFiles.tsx:57-67,86-88` | | `RoomFilesWithData.tsx:15` |
| room.files.empty | 无文件 | 过滤后 0 条 | `isSuccess && length===0` | DOM: [读] empty title=`No_files_found`；endpoint: 已空；persist: n/a | `RoomFiles.tsx:99` | | `RoomFiles.tsx:99` |
| room.files.load-more | 滚动加载 | `…→Files_list` 到底 | 有下一页 | DOM: [读] list `aria-label=Files_list`（包装）；endpoint: 同 files GET offset++；persist: cache | `RoomFiles.tsx:102-108` | | `useFilesList.ts:72-75` |
| room.files.file-row-preview | 打开可预览图片画廊 | `…→预览图行` | MIME 可预览图 | DOM: [读] 行 `aria-label={filename}`；画廊 `dialog` `aria-label=Image_gallery`；endpoint: [读] `GET /v1/rooms.images`；persist: 覆盖层刷新关 | `ImageItem.tsx:17-40` | | `ImageGalleryProvider.tsx:25-34` |
| room.files.file-row-download | 点非预览行下载 | `…→非预览文件链接` | 非预览图 | DOM: [读] `link` `aria-label`/`title`={filename} `download`；endpoint: 文件 URL / E2E SW；persist: 本地文件 | `FileItem.tsx:32-48` | | `FileItem.tsx:32-48` |
| room.files.file-menu | 打开单文件 More | `…→行→More` | 每行 | DOM: [读] `button` `aria-label=More` `title=More`；endpoint: none | `FileItemMenu.tsx:90` | | `FileItemMenu.tsx:90` |
| room.files.file-menu-download | 菜单下载 | `…→More→Download` | 非（加密且无 SW） | DOM: [读] menuitem name=`Download`；endpoint: `download()` 或 SW `attachment-download`；persist: 本地 | `FileItemMenu.tsx:50-76` | | `FileItemMenu.tsx:50-76` |
| room.files.file-menu-download.denied | 加密无 SW 时 Download 禁用 | 同上 | `fileData.encryption && !serviceWorker` | DOM: [读] menuitem `Download` disabled；endpoint: no-op；persist: n/a | `FileItemMenu.tsx:35,75` | | `FileItemMenu.tsx:35` |
| room.files.file-menu-delete | 开始删文件 | `…→More→Delete` | `useMessageDeletionIsAllowed` | DOM: [读] menuitem name=`Delete`（danger）；打开确认；endpoint: 待确认 | `FileItemMenu.tsx:77-87` | | `useMessageDeletionIsAllowed.ts:7-59` |
| room.files.file-menu-delete.denied | 无权则无 Delete | `…→More` | 删除不允许 | DOM: [读] 菜单无 Delete；endpoint: n/a | `FileItemMenu.tsx:77-87` | | `FileItemMenu.tsx:77` |
| room.files.delete.confirm | 确认删除 | `…→Delete→modal Delete` | 上项允许 | DOM: [读] confirm `button` name=`Delete` body=`Delete_File_Warning`；endpoint: [读] `POST /v1/chat.delete` `{fileId}`；persist: 列表刷新不在 | `useDeleteFile.tsx:13-30` | | `useDeleteFile.tsx:13-30` |
| room.files.delete.cancel | 取消删除 | `…→modal Cancel` | modal 开 | DOM: [读] `button` name=`Cancel`；endpoint: none；persist: 文件仍在 | `useDeleteFile.tsx:27` | | `useDeleteFile.tsx:27` |

---

## 表 E — Notifications preferences（每一开关/下拉一行）

父：`room.toolbox.push-notifications`。dialog name=`Notifications_Preferences`。Save：`POST /v1/rooms.saveNotification`。

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
|---|---|---|---|---|---|---|---|
| room.notif.close | 关通知栏（不保存） | `…→Notifications_Preferences→×` | 须有 subscription | DOM: [读] `Close`；dialog 关；未保存丢；endpoint: none；persist: 旧偏好仍在 | `NotificationPreferences.tsx:38` | `room.toolbox.push-notifications` | `usePushNotificationsRoomAction.ts:9-14` |
| room.notif.turn-on | 总开关房间通知 | `…→Turn_ON` | 有订阅 | DOM: [读] `switch` label=`Turn_ON` desc=`Receive_alerts`；endpoint: Save `disableNotifications`；persist: 订阅刷新 | `NotificationPreferencesForm.tsx:25-30` | | `NotificationPreferencesWithData.tsx:67,77-80` |
| room.notif.mute-group-mentions | 静音 @all/@here | `…→Mute_Group_Mentions` | 同 | DOM: [读] `switch` label=`Mute_Group_Mentions`；endpoint: `muteGroupMentions`；persist: 刷新仍在 | `NotificationPreferencesForm.tsx:32-37` | | `NotificationPreferencesWithData.tsx:68` |
| room.notif.show-counter | 未读计数 | `…→Show_counter` | 同 | DOM: [读] `switch` label=`Show_counter` desc=`Display_unread_counter`；关后露出 mentions 行；endpoint: `hideUnreadStatus` 取反；persist: 刷新 | `NotificationPreferencesForm.tsx:39-45` | | `NotificationPreferencesWithData.tsx:69` |
| room.notif.show-mentions | 仅提及计数 | `…→Show_mentions` | 仅 `showCounter===false` | DOM: [读] `switch` label=`Show_mentions` desc=`Display_mentions_counter`；endpoint: `hideMentionStatus` 取反；persist: 刷新 | `NotificationPreferencesForm.tsx:46-58` | | `NotificationPreferencesWithData.tsx:70` |
| room.notif.desktop-section | 展开 Desktop 段 | `…→Desktop` | 始终 | DOM: [读] accordion 标题=`Desktop`；endpoint: none；persist: UI | `NotificationPreferencesForm.tsx:61` | | `NotificationByDevice.tsx:13-24` |
| room.notif.desktop-alert | Desktop 提醒级别 | `…→Desktop→Alerts` | 段展开 | DOM: [读] 下拉 label=`Alerts` 选项 `Default`/`All_messages`/`Mentions`/`Nothing`；endpoint: `desktopNotifications`；persist: 刷新 | `NotificationPreferencesForm.tsx:62-73` | | `NotificationPreferencesWithData.tsx:71` |
| room.notif.desktop-sound | Desktop 声音 | `…→Desktop→Sound` | 段展开 | DOM: [读] 下拉 label=`Sound` 选项 `None`/`Default`+自定义；endpoint: `audioNotificationValue`；persist: 刷新 | `NotificationPreferencesForm.tsx:76-90` | | `NotificationPreferencesWithData.tsx:72` |
| room.notif.play-sound | 试听声音 | `…→Sound→Play` | 段展开 | DOM: [读] `button` `aria-label=Play`；endpoint: none `customSound.play`；persist: n/a | `NotificationPreferencesForm.tsx:87` | | `NotificationPreferencesWithData.tsx:60-62` |
| room.notif.mobile-section | 展开 Mobile 段 | `…→Mobile` | 始终 | DOM: [读] 标题=`Mobile`；endpoint: none | `NotificationPreferencesForm.tsx:93` | | `NotificationByDevice.tsx:13-24` |
| room.notif.mobile-alert | Mobile 提醒级别 | `…→Mobile→Alerts` | 段展开 | DOM: [读] label=`Alerts` 同选项；endpoint: `mobilePushNotifications`；persist: 刷新 | `NotificationPreferencesForm.tsx:94-106` | | `NotificationPreferencesWithData.tsx:73` |
| room.notif.email-section | 展开 Email 段 | `…→Email` | 始终 | DOM: [读] 标题=`Email`；endpoint: none | `NotificationPreferencesForm.tsx:108` | | `NotificationByDevice.tsx:13-24` |
| room.notif.email-alert | Email 提醒级别 | `…→Email→Alerts` | 段展开 | DOM: [读] label=`Alerts`；endpoint: `emailNotifications`；persist: 刷新 | `NotificationPreferencesForm.tsx:109-121` | | `NotificationPreferencesWithData.tsx:74` |
| room.notif.reset | 还原未保存 | `…→Reset` | disabled `!isDirty` | DOM: [读] `button` name=`Reset`；endpoint: none；persist: n/a | `NotificationPreferences.tsx:45-47` | | `NotificationPreferences.tsx:45` |
| room.notif.save | 保存全部通知偏好 | `…→Save` | disabled `!isDirty` | DOM: [读] `button` name=`Save`；toast `Room_updated_successfully`；endpoint: [读] `POST /v1/rooms.saveNotification`；persist: [读] 订阅刷新仍在 | `NotificationPreferences.tsx:48-50` | | `NotificationPreferencesWithData.tsx:20-24,64-80` |

---

## 表 F — Prune（字段 + 提交 + 取消 + 结果）

父：`room.toolbox.clean-history`。dialog name=`Prune_Messages`。联邦工具箱 disabled。

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
|---|---|---|---|---|---|---|---|
| room.prune.close | 关剪枝栏（取消） | `…→Prune_Messages→×` | `clean-channel-history`；联邦不可达 | DOM: [读] `Close`；表单丢；endpoint: none；persist: 消息未剪 | `PruneMessages.tsx:41` | `room.toolbox.clean-history` | `useCleanHistoryRoomAction.ts:14-31` |
| room.prune.newer-date | Newer than 日期 | `…→Newer_than date` | 同上 | DOM: [读] `input[type=date]` `aria-label` 含 `Newer_than`+`Date`；endpoint: 提交作 `oldest`；persist: 成功后消息刷新不在 | `PruneMessagesDateTimeRow.tsx:19` | | `PruneMessagesWithData.tsx:62-64` |
| room.prune.newer-time | Newer than 时间 | `…→Newer_than time` | 同上 | DOM: [读] `input[type=time]` `Newer_than`+`Time`；并入 `oldest` | `PruneMessagesDateTimeRow.tsx:20` | | `PruneMessagesDateTimeRow.tsx:20` |
| room.prune.older-date | Older than 日期 | `…→Older_than date` | 同上 | DOM: [读] date `Older_than`+`Date`；提交 `latest` | `PruneMessagesDateTimeRow.tsx:19` | | `PruneMessagesWithData.tsx:66-68` |
| room.prune.older-time | Older than 时间 | `…→Older_than time` | 同上 | DOM: [读] time `Older_than`+`Time` | `PruneMessagesDateTimeRow.tsx:20` | | `PruneMessagesDateTimeRow.tsx:20` |
| room.prune.users | 只剪所选用户 | `…→Only_from_users` | 同上 | DOM: [读] 多选 placeholder=`Please_enter_usernames`；endpoint: 预取 `GET /v1/users.autocomplete`，提交 `users`；persist: 成功后那些人消息刷新不在 | `PruneMessages.tsx:47-54` | | `PruneMessagesWithData.tsx:89` |
| room.prune.inclusive | 含边界时刻 | `…→Inclusive` | 同上 | DOM: [读] `checkbox` label=`Inclusive`；payload `inclusive` | `PruneMessages.tsx:57-64` | | `PruneMessagesWithData.tsx:83` |
| room.prune.pinned | 不剪置顶 | `…→RetentionPolicy_DoNotPrunePinned` | 同上 | DOM: [读] `checkbox` 该 label；payload `excludePinned` | `PruneMessages.tsx:67-74` | `room.info.field.retention-exclude-pinned` | `PruneMessagesWithData.tsx:85` |
| room.prune.discussion | 不剪讨论 | `…→RetentionPolicy_DoNotPruneDiscussion` | 同上 | DOM: [读] `checkbox` 该 label；payload `ignoreDiscussion` | `PruneMessages.tsx:77-84` | | `PruneMessagesWithData.tsx:87` |
| room.prune.threads | 不剪线程 | `…→RetentionPolicy_DoNotPruneThreads` | 同上 | DOM: [读] `checkbox` 该 label；payload `ignoreThreads` | `PruneMessages.tsx:87-94` | `room.info.field.retention-ignore-threads` | `PruneMessagesWithData.tsx:88` |
| room.prune.attached | 只剪文件 | `…→Files_only` | 同上 | DOM: [读] `checkbox` label=`Files_only`；payload `filesOnly` | `PruneMessages.tsx:97-104` | | `PruneMessagesWithData.tsx:86` |
| room.prune.submit | 打开确认剪枝 | `…→Prune` | 无 `validateText` | DOM: [读] `button` name=`Prune`；警告 Callout `Prune_Warning_*`；再出确认；endpoint: 待确认 | `PruneMessages.tsx:111-113` | | `PruneMessagesWithData.tsx:123-155` |
| room.prune.submit.disabled | 日期非法禁用 Prune | 同上 | `from>to`→`Newer_than_may_not_exceed_Older_than`；非法日期 `error-invalid-date` | DOM: [读] `button` disabled + warning Callout；endpoint: none | `PruneMessages.tsx:111` | | `PruneMessagesWithData.tsx:157-167` |
| room.prune.confirm | 确认执行剪枝 | `…→Prune→Yes_prune_them` | modal 开 | DOM: [读] confirm name=`Yes_prune_them` body=`Prune_Modal`；endpoint: [读] `POST /v1/rooms.cleanHistory`；persist: 消息/文件永久无；表单 reset | `PruneMessagesWithData.tsx:70-119` | | `PruneMessagesWithData.tsx:110-119` |
| room.prune.cancel | 取消确认 | `…→modal Cancel` | modal 开 | DOM: [读] `button` `Cancel`；endpoint: none；persist: 未剪 | `PruneMessagesWithData.tsx:113-114` | | `PruneMessagesWithData.tsx:113` |
| room.prune.result.success | 剪枝成功 toast | 确认之后 count>0 | API 成功 | DOM: [读] toast `__count__message_pruned` 或 `__count__file_pruned`；endpoint: 已 cleanHistory；persist: 刷新仍无那些消息 | `PruneMessagesWithData.tsx:70-107` | | `PruneMessagesWithData.tsx:70-107` |
| room.prune.result.empty | 范围内无东西可剪 | 确认之后 0 | API 成功但 0 | DOM: [读] toast `No_messages_found_to_prune`/`No_files_found_to_prune`；endpoint: cleanHistory 空；persist: 消息仍在 | `PruneMessagesWithData.tsx` | | `PruneMessagesWithData.tsx` |

---

## 表 G — Export（字段 + 提交 + 取消 + 结果）

父：`room.toolbox.export-messages`。dialog name=`Export_Messages`。权限 `mail-messages`。

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
|---|---|---|---|---|---|---|---|
| room.export.close | 关导出栏 | `…→Export_Messages→×` | `mail-messages` | DOM: [读] `Close`；清 message selection；endpoint: none；persist: 表单丢 | `ExportMessages.tsx:192` | `room.toolbox.export-messages` | `ExportMessages.tsx:126-128` |
| room.export.method | 选导出方式 | `…→Method` | 非 E2E | DOM: [读] Select label=`Method` 选项 `Send_email`/`Send_file_via_email`/`Download_file`；endpoint: 分支提交；persist: n/a | `ExportMessages.tsx:197-213` | | `ExportMessages.tsx:71-77` |
| room.export.method.e2e | E2E 房锁死 Download | 同上 | `room.encrypted` | DOM: [读] Select disabled 默认 `download`；endpoint: 仅本地下载路径 | `ExportMessages.tsx:45,60,208` | `room.info.e2ee` | `ExportMessages.tsx:208` |
| room.export.format | 选输出格式 | `…→Output_format` | email 时锁 HTML；download 无 HTML；file 无 PDF；PDF 需 `export-messages-as-pdf` | DOM: [读] Select label=`Output_format` placeholder=`Format` 选项 `HTML`/`JSON`/`PDF`；endpoint: 随 method；persist: n/a | `ExportMessages.tsx:215-243` | | `ExportMessages.tsx:80-101` |
| room.export.date-from | file 方式起始日 | `…→Date_From` | `type==='file'` | DOM: [读] date label=`Date_From`；endpoint: `rooms.export` `dateFrom` | `ExportMessages.tsx:245-255` | | `ExportMessages.tsx:166-167` |
| room.export.date-to | file 方式结束日 | `…→Date_to` | `type==='file'` | DOM: [读] date label=`Date_to`；endpoint: `dateTo` | `ExportMessages.tsx:257-266` | | `ExportMessages.tsx:167` |
| room.export.to-users | email 收件人（站内） | `…→To_users` | `type==='email'` | DOM: [读] 多选 label=`To_users`；endpoint: 预取 autocomplete，提交 `toUsers` | `ExportMessages.tsx:269-304` | | `ExportMessages.tsx:173-176` |
| room.export.additional-emails | 站外邮箱 | `…→To_additional_emails` | `type==='email'` | DOM: [读] `textbox` label=`To_additional_emails` placeholder=`Email_Placeholder_any`；endpoint: `toEmails` | `ExportMessages.tsx:305-349` | | `ExportMessages.tsx:177` |
| room.export.subject | 邮件主题 | `…→Subject` | `type==='email'` | DOM: [读] textarea label=`Subject` 默认 `Mail_Messages_Subject`；endpoint: `subject` | `ExportMessages.tsx:351-359` | | `ExportMessages.tsx:66,178` |
| room.export.messages-validation | 未选消息时挡住提交 | 点 Send/Download 且 type≠file | 主列表未选消息 | DOM: [读] `alert` `Mail_Message_No_messages_selected_select_all`；endpoint: 不发；persist: n/a | `ExportMessages.tsx:363-377` | | `ExportMessages.tsx:121-133` |
| room.export.reset | 重置表单 | `…→Reset` | dirty | DOM: [读] `button` `Reset`；endpoint: none | `ExportMessages.tsx:385-387` | | `ExportMessages.tsx:385` |
| room.export.submit.email | 邮件发出所选消息 | `…→Send` | email + 收件人 + ≥1 消息 | DOM: [读] `button` `Send`；toast `Your_email_has_been_queued_for_sending`；endpoint: [读] `POST /v1/rooms.export` type=email；persist: 队列在服务端 | `ExportMessages.tsx:388-389,173-180` | | `useRoomExportMutation.ts:7-16` |
| room.export.submit.file | 按日期排队文件邮件 | `…→Send` | `type==='file'` | DOM: [读] `Send`；同 toast；endpoint: [读] `POST /v1/rooms.export` type=file；persist: 邮件队列 | `ExportMessages.tsx:162-169` | | `useRoomExportMutation.ts:7-16` |
| room.export.submit.download-json | 本地下载 JSON | `…→Download` | download+json | DOM: [读] `button` `Download`；toast `Messages_exported_successfully`；endpoint: **无 REST** 本地 Messages；persist: 本机文件 | `ExportMessages.tsx:154-158` | | `useDownloadExportMutation.ts:18-67` |
| room.export.submit.download-pdf | 本地下载 PDF | `…→Download` | download+pdf + 权限 | DOM: [读] `Download`；同 toast；endpoint: 客户端 PDF；persist: 本机文件 | `ExportMessages.tsx:149-151` | | `useExportMessagesAsPDFMutation.tsx:192-194` |

---

## 表 H — Threads

父：`room.toolbox.thread`。dialog name=`Threads`。

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
|---|---|---|---|---|---|---|---|
| room.threads.close | 关线程列表 | `…→Threads→×` | `Threads_enabled` | DOM: [读] `Close`；dialog `Threads` 关；endpoint: none | `ThreadList.tsx:127` | `room.toolbox.thread` | `ThreadList.tsx:124-127` |
| room.threads.filter-search | 搜线程正文 | `…→Search_Messages` | 始终 | DOM: [读] `textbox` `aria-label=Search_Messages`；debounce 400ms；endpoint: [读] `GET /v1/chat.getThreadsList` `{text}`；persist: 不持久查询串 | `ThreadList.tsx:130-138` | | `useThreadsList.ts:75-81` |
| room.threads.filter-type | All / Following / Unread | `…→type Select` | Following/Unread 需订阅 | DOM: [读] 选项 `All`/`Following`/`Unread`；endpoint: 同上 `type`/`tunread`；persist: [读] `localStorage['thread-list-type']` | `ThreadList.tsx:55-72,139-145` | | `ThreadList.tsx:64` |
| room.threads.list-item | 打开线程详情 | `…→线程行` | 行存在 | DOM: [读] 可点行 `tabIndex=0`；URL `tab=thread&context=tmid`；详情头 `Following`/`Not_Following`；endpoint: none 导航；persist: URL tmid | `ThreadListItem.tsx:34-71` | | `useGoToThread.ts:16-23` |
| room.threads.follow-list | 列表行上关注/取关 | `…→行铃铛`（停冒泡） | 已登录 uid | DOM: [读] `title=Following`/`Not_following`；endpoint: [读] `POST /v1/chat.followMessage`\|`unfollowMessage`；persist: replies 刷新仍在 | `ThreadListMessage.tsx:81` | | `ThreadMetricsFollow.tsx:29-45` |
| room.threads.follow-detail | 详情头关注/取关 | `…→线程详情→铃` | 主消息 loaded | DOM: [读] `title=Following`/`Not_Following`；同一 follow/unfollow POST；persist: 同 | `Thread.tsx:124-128` | | `useToggleFollowingThreadMutation.ts:25-36` |
| room.threads.expand | 详情加宽/收起 | `…→详情→Expand`/`Collapse` | `canExpand` | DOM: [读] title=`Expand`/`Collapse`；endpoint: none 布局；persist: [读] **刷新不持久** | `Thread.tsx:117-123` | | `Thread.tsx:117-123` |
| room.threads.empty | 无线程 | 过滤后 0 | success+0 | DOM: [读] empty title=`No_Threads` | `ThreadList.tsx:162` | | `ThreadList.tsx:162` |

---

## 表 I — Discussions

父：`room.toolbox.discussions`。dialog name=`Discussions`。联邦工具箱 disabled。

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
|---|---|---|---|---|---|---|---|
| room.discussions.close | 关讨论列表 | `…→Discussions→×` | `Discussion_enabled` 且 `!prid` | DOM: [读] `Close`；dialog `Discussions` 关 | `DiscussionsList.tsx:69` | `room.toolbox.discussions` | `DiscussionsList.tsx:66-69` |
| room.discussions.filter-search | 搜讨论 | `…→Search_Messages` | 有 userId 才渲染栏 | DOM: [读] `textbox` `aria-label=Search_Messages`；endpoint: [读] `GET /v1/chat.getDiscussions` `{text}` | `DiscussionsList.tsx:72-80` | | `useDiscussionsList.ts:39-44` |
| room.discussions.list-item | 跳进讨论房 | `…→讨论行` | 行有 `data-drid` | DOM: [读] 可点行；进讨论房；endpoint: 或 `GET /v1/rooms.info`；persist: 房间 URL | `DiscussionsList.tsx:56-62,104-106` | `nav.create.discussion` | `useGoToRoom.ts:19-37` |
| room.discussions.empty | 无讨论 | 0 条 | success+0 | DOM: [读] empty title=`No_Discussions_found` | `DiscussionsList.tsx:96` | | `DiscussionsList.tsx:96` |

---

## 表 J — Mentions / Pinned / Starred / Search

消息工具栏全集在 01，本表只收 **列表壳 + jump + 本 tab 特有 unpin/unstar + empty**。dialog 标题：`Mentions` / `Pinned_Messages` / `Starred_Messages` / `Search_Messages`。

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
|---|---|---|---|---|---|---|---|
| room.search.mentions.close | 关提及列表 | `…→Mentions→×` | groups channel/group/team | DOM: [读] `Close`；dialog 标题来自 tab title Mentions；endpoint: none | `MessageListTab.tsx:54` | `room.toolbox.mentions` | `MentionsTab.tsx` |
| room.search.mentions.empty | 无提及 | 0 条 | success+0 | DOM: [读] empty title=`No_mentions_found` | `MessageListTab.tsx:64` | | `MentionsTab.tsx:39` |
| room.search.mentions.jump | 跳到原消息 | `…→行工具栏→Jump_to_message` | 工具栏可见 | DOM: [读] `button` title=`Jump_to_message`；URL `?msg=`；endpoint: none；persist: 查询串刷新仍跳 | `JumpToMessageAction.tsx:16-22` | `msg.jump`（01） | `MentionsItems.tsx:14` |
| room.search.pinned.close | 关置顶列表 | `…→Pinned_Messages→×` | `Message_AllowPinning`；联邦 disabled | DOM: [读] `Close`；dialog `Pinned_Messages` | `MessageListTab.tsx:54` | `room.toolbox.pinned-messages` | `PinnedMessagesTab.tsx` |
| room.search.pinned.empty | 无置顶 | 0 | success+0 | DOM: [读] empty title=`No_pinned_messages` | `MessageListTab.tsx:64` | | `PinnedMessagesTab.tsx:40` |
| room.search.pinned.jump | 跳到置顶消息 | `…→Jump_to_message` | 工具栏 | DOM: [读] title=`Jump_to_message`；`?msg=` | `JumpToMessageAction.tsx:16-22` | | `PinnedItems.tsx:14` |
| room.search.pinned.unpin | 取消置顶 | `…→More→Unpin` | `pin-message`；已 pinned；非 omni | DOM: [读] menuitem `Unpin`；endpoint: [读] `POST /v1/chat.unPinMessage`；persist: 列表刷新不在 | `useUnpinMessageAction.ts:17-29` | 01 unpin | `useUnpinMessageMutation.ts:17-29` |
| room.search.starred.close | 关星标列表 | `…→Starred_Messages→×` | 无特别 setting | DOM: [读] `Close`；dialog `Starred_Messages` | `MessageListTab.tsx:54` | `room.toolbox.starred-messages` | `StarredMessagesTab.tsx` |
| room.search.starred.empty | 无星标 | 0 | success+0 | DOM: [读] empty title=`No_starred_messages` | `MessageListTab.tsx:64` | | `StarredMessagesTab.tsx:40` |
| room.search.starred.jump | 跳到星标消息 | `…→Jump_to_message` | 工具栏 | DOM: [读] title=`Jump_to_message`；`?msg=` | `JumpToMessageAction.tsx` | | `StarredItems.tsx:14` |
| room.search.starred.unstar | 取消星标 | `…→More→Unstar_Message` | `Message_AllowStarring`；自己已 star；非 omni | DOM: [读] menuitem `Unstar_Message`；endpoint: [读] `POST /v1/chat.unStarMessage`；persist: 列表刷新不在 | `useUnstarMessageAction.ts:14-31` | 01 unstar | `useUnstarMessageMutation.ts:18-29` |
| room.search.close | 关搜索栏 | `…→Search_Messages→×` | 含 live | DOM: [读] `Close`；dialog `Search_Messages` | 搜索 tab 壳 | `room.toolbox.rocket-search` | `MessageSearchTab` |
| room.search.filter-text | 输入搜索 | `…→Search_Messages 框` | provider 已 load | DOM: [读] `textbox` `aria-label=Search_Messages`；debounce 300ms；endpoint: [读] Meteor `rocketchatSearch.search`；persist: 查询串刷新 [待渲染实测] | `MessageSearchForm.tsx:56-63` | | `useMessageSearchQuery.ts:20-26` |
| room.search.global-toggle | 全局 vs 本房 | `…→Global_Search` | `provider.settings.GlobalSearchEnabled` | DOM: [读] `switch` label=`Global_Search`；endpoint: search `{searchAll}`；persist: 开关不写偏好 | `MessageSearchForm.tsx:68-72` | | `MessageSearchForm.tsx:48,68-72` |
| room.search.empty | 无结果 | 有关键词且 0 | success+0 | DOM: [读] empty/`No_results_found` | `MessageSearchTab.tsx:68` | | `MessageSearchTab.tsx:68` |
| room.search.jump | 从结果跳原消息 | `…→结果行→Jump_to_message` | 工具栏 | DOM: [读] title=`Jump_to_message`；`?msg=` | `SearchItems.tsx:14` | | `JumpToMessageAction.tsx:16-22` |
| room.search.encrypted-callout | E2E 房不能搜密文 | 打开搜索且 `room.encrypted` | encrypted | DOM: [读] warning Callout `Encrypted_RoomType` + `Encrypted_content_cannot_be_searched`；endpoint: 仍可搜非密文索引 [待渲染实测]；persist: n/a | `MessageSearchForm.tsx:74-78` | `room.info.e2ee` | `MessageSearchForm.tsx:74-78` |

---

## 表 K — Team channels

父：`room.toolbox.team-channels`。dialog name=`Team_Channels`。

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
|---|---|---|---|---|---|---|---|
| room.teamChannels.close | 关团队频道栏 | `…→Team_Channels→×` | team 房 | DOM: [读] `Close`；dialog `Team_Channels` 关 | `TeamsChannels.tsx:88` | `room.toolbox.team-channels` | `TeamsChannels.tsx:85-88` |
| room.teamChannels.filter-search | 搜频道名 | `…→Search` | 始终 | DOM: [读] `textbox` placeholder=`Search`；debounce 800ms；endpoint: [读] `GET /v1/teams.listRooms` `{filter}` | `TeamsChannels.tsx:91-97` | | `useTeamsChannelList.ts:23-29` |
| room.teamChannels.filter-type | All / Auto-join | `…→type Select` | 始终 | DOM: [读] 选项 `All`/`Team_Auto-join`；endpoint: `{type}`；persist: [读] `localStorage['channels-list-type']` | `TeamsChannels.tsx:61-67,98-100` | | `TeamsChannelsWithData.tsx:27` |
| room.teamChannels.empty | 团队无频道 | 0 条 | `!loading && length===0` | DOM: [读] empty title=`No_channels_in_team` | `TeamsChannels.tsx:108` | | `TeamsChannels.tsx:108` |
| room.teamChannels.load-more | 滚动加载 | 列表底 | `channels.length < total` | DOM: [读] `InfiniteListAnchor`；endpoint: listRooms offset | `TeamsChannels.tsx:126` | | `TeamsChannels.tsx:71-81` |
| room.teamChannels.list-item | 打开该频道 | `…→频道行` | 行存在 | DOM: [读] 可点行；进该房；endpoint: `openRouteLink`；persist: 房间 URL | `TeamsChannelItem.tsx:56` | | `TeamsChannelsWithData.tsx:45-47` |
| room.teamChannels.item-menu | 打开行 More | `…→行→More` | `edit-team-channel` 或 `remove-team-channel` 或 delete 权 | DOM: [读] `button` title=`More`；最多 3 项 | `TeamsChannelItemMenu.tsx:43-54` | | `TeamsChannelItem.tsx:38-42` |
| room.teamChannels.toggle-auto-join | 开关自动加入 | `…→More→Team_Auto-join` | `edit-team-channel` | DOM: [读] menuitem name=`Team_Auto-join` + checkbox；endpoint: [读] `POST /v1/teams.updateRoom` `{isDefault}`；persist: `teamDefault` 刷新仍在 | `TeamsChannelItemMenu.tsx:18-24` | | `useToggleAutoJoin.ts:13-39` |
| room.teamChannels.remove-from-team | 从团队移除频道 | `…→More→Team_Remove_from_team` | `remove-team-channel` | DOM: [读] name=`Team_Remove_from_team`；确认后；endpoint: [读] `POST /v1/teams.removeRoom`；persist: 列表刷新不在 | `TeamsChannelItemMenu.tsx:26-31` | | `useRemoveRoomFromTeam.tsx:16-38` |
| room.teamChannels.delete | 删除该频道 | `…→More→Delete` | `delete-{t}` 且 `delete-team-channel/group` | DOM: [读] name=`Delete`；确认；endpoint: [读] `POST /v1/rooms.delete`；persist: 房间刷新不在 | `TeamsChannelItemMenu.tsx:34-40` | `room.info.action.delete` | `useDeleteRoom.tsx:21-40` |
| room.teamChannels.add-existing | 打开「加入已有频道」 | `…→Team_Add_existing` | `move-room-to-team` | DOM: [读] `button` name=`Team_Add_existing`；modal `aria-label=Team_Add_existing_channels` title 同；endpoint: 待提交 | `TeamsChannels.tsx:139-142` | `room.info.action.move-to-team` | `TeamsChannelsWithData.tsx:18,60` |
| room.teamChannels.add-existing.rooms | 选择要加入的房间 | `…→modal→Channels` | modal 开 | DOM: [读] 字段 label=`Channels` 自动完成；endpoint: 房间自动完成；persist: 待提交 | `AddExistingModal.tsx:74-80` | | `RoomsAvailableForTeamsAutoComplete` |
| room.teamChannels.add-existing.submit | 提交加入 | `…→modal→Add` | dirty | DOM: [读] `button` name=`Add`；toast `Channels_added`；endpoint: [读] `POST /v1/teams.addRooms`；persist: 列表刷新在 | `AddExistingModal.tsx:86-88` | | `AddExistingModal.tsx:37-51` |
| room.teamChannels.add-existing.cancel | 取消加入 | `…→modal→Cancel` 或 × | modal 开 | DOM: [读] `button` `Cancel` / ModalClose；endpoint: none | `AddExistingModal.tsx:71,85` | | `AddExistingModal.tsx:85` |
| room.teamChannels.create-new | 打开新建团队频道 | `…→Create_new` | `create-team-channel` 或 `create-team-group` | DOM: [读] `button` name=`Create_new`；`CreateChannelModal`（字段与 `nav.create.channel` 同模，本行只到打开）；endpoint: 模态内 create；persist: 新频道刷新在列表 | `TeamsChannels.tsx:144-147` | `nav.create.channel` | `TeamsChannelsWithData.tsx:19,61` |

---

## 表 L — Banned users

父：`room.toolbox.banned-users`。dialog name=`Banned_Users`。

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
|---|---|---|---|---|---|---|---|
| room.banned.close | 关封禁列表 | `…→Banned_Users→×` | `ban-user` | DOM: [读] `Close`；dialog `Banned_Users` 关 | `BannedUsers.tsx:39` | `room.toolbox.banned-users` | `BannedUsers.tsx:36-39` |
| room.banned.empty | 无人被封 | 0 | success+0 | DOM: [读] empty title=`No_banned_users` subtitle=`No_banned_users_description` | `BannedUsers.tsx:50-52` | | `BannedUsers.tsx:50-52` |
| room.banned.error | 加载失败 | query error | error | DOM: [读] empty title=`Banned_users_error` subtitle=`Please_try_again` | `BannedUsers.tsx:48` | | `BannedUsers.tsx:48` |
| room.banned.item-menu | 打开行 More | `…→行→More` | 有行 | DOM: [读] `button` title=`More` | `BannedUsersItem.tsx:47` | | `BannedUsersItem.tsx:46-48` |
| room.banned.unban | 解封 | `…→More→Unban_user_from_room` | `ban-user` | DOM: [读] menuitem name=`Unban_user_from_room`；确认后；endpoint: [读] `POST /v1/rooms.unbanUser`；persist: 列表刷新不在，可再被加回成员 | `BannedUsersItem.tsx:27-31` | `room.members.action.ban` | `useUnbanUser.tsx:21-53` |
| room.banned.load-more | 滚动加载 | 列表底 | 有下一页 | DOM: [读] Virtuoso `endReached`；endpoint: [读] `GET /v1/rooms.bannedUsers` | `BannedUsers.tsx:61` | | `useRoomBannedUsers.ts:16-27` |

---

## 表 M — Autotranslate

父：`room.toolbox.autotranslate`。dialog name=`Auto_Translate`。

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
|---|---|---|---|---|---|---|---|
| room.autotranslate.close | 关自动翻译栏 | `…→Auto_Translate→×` | `auto-translate` + `AutoTranslate_Enabled` | DOM: [读] `Close`；dialog `Auto_Translate` 关 | `AutoTranslate.tsx:34` | `room.toolbox.autotranslate` | `AutoTranslate.tsx:32-34` |
| room.autotranslate.toggle | 开/关本房自动翻译 | `…→Automatic_Translation` | 加密且当前关 → disabled | DOM: [读] `switch` label=`Automatic_Translation`；toast `AutoTranslate_Enabled_for_room`/`Disabled_for_room`；endpoint: [读] `POST /v1/autotranslate.saveSettings` `{field:'autoTranslate'}`；persist: subscription.`autoTranslate` | `AutoTranslate.tsx:46-51` | | `AutoTranslateWithData.tsx:48-65` |
| room.autotranslate.language | 选目标语言 | `…→Translate_to` | 总开关开着才使能 | DOM: [读] Select id=language label=`Translate_to`；toast `AutoTranslate_language_set_to`；endpoint: [读] saveSettings `{field:'autoTranslateLanguage'}`；persist: `autoTranslateLanguage`；语言表 `GET /v1/autotranslate.getSupportedLanguages` | `AutoTranslate.tsx:55-63` | | `AutoTranslateWithData.tsx:34-45` |
| room.autotranslate.e2ee-unavailable | 加密房提示不可用 | 打开栏且 `room.encrypted` | encrypted | DOM: [读] Callout title=`Automatic_translation_not_available` body=`Automatic_translation_not_available_info`；开关无法打开；endpoint: n/a | `AutoTranslate.tsx:38-42` | `room.info.e2ee` | `AutoTranslate.tsx:38-51` |

---

## 表 N — Calls

父：`room.toolbox.calls`。dialog name=`Calls`。license `videoconference-enterprise`；联邦 disabled。

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
|---|---|---|---|---|---|---|---|
| room.calls.close | 关通话史 | `…→Calls→×` | license | DOM: [读] `Close`；dialog `Calls` 关 | `VideoConfList.tsx:42` | `room.toolbox.calls` | `VideoConfList.tsx:40-42` |
| room.calls.empty | 无历史 | total===0 | 非 loading | DOM: [读] empty title=`No_history` subtitle=`There_is_no_video_conference_history_in_this_room` | `VideoConfList.tsx:59-64` | | `VideoConfList.tsx:59-64` |
| room.calls.error | 加载失败 | error | error | DOM: [读] States title=`Something_went_wrong` subtitle=error；endpoint: `GET /v1/video-conference.list` 失败 | `VideoConfList.tsx:52-57` | | `VideoConfList.tsx:52-57` |
| room.calls.join | 加入未结束会议 | `…→Join_call` | `!endedAt` | DOM: [读] `button` name=`Join_call`；进会；endpoint: video-conf join；persist: 会议记录仍在列表 | `VideoConfListItem.tsx:92-94` | `room.toolbox.start-video-call` | `useVideoConfJoinCall` |
| room.calls.join.ended | 已结束不可加入 | 同上 | `endedAt` | DOM: [读] `button` name=`Call_ended` **disabled**；endpoint: none | `VideoConfListItem.tsx:92-94` | | `VideoConfListItem.tsx:92` |
| room.calls.join-discussion | 跳会议讨论房 | `…→Join_discussion` | 有 `discussionRid` | DOM: [读] IconButton title=`Join_discussion`；进讨论；endpoint: `useGoToRoom` | `VideoConfListItem.tsx:95-103` | `room.discussions.list-item` | `VideoConfListItem.tsx:96-102` |
| room.calls.load-more | 滚动加载 | 列表底 | 有更多 | DOM: [读] Virtuoso endReached；endpoint: video-conference.list | `VideoConfList.tsx:77` | | `VideoConfList.tsx:77` |

---

## 表 O — Canned responses

父：`room.toolbox.canned-responses`。dialog name=`Canned_Responses`。仅 live。

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
|---|---|---|---|---|---|---|---|
| room.canned.close | 关快捷回复栏 | `…→Canned_Responses→×` | license + setting | DOM: [读] `Close`；dialog `Canned_Responses` 关 | `CannedResponseList.tsx:86` | `room.toolbox.canned-responses` | `CannedResponseList.tsx:84-86` |
| room.canned.search | 搜快捷回复 | `…→Search` | 始终 | DOM: [读] `textbox` placeholder=`Search`；endpoint: [读] `GET /v1/canned-responses` 过滤 | `CannedResponseList.tsx:92-98` | | `CannedResponseList.tsx:92` |
| room.canned.type-filter | 按类型过滤 | `…→Type Select` | 始终 | DOM: [读] Select `aria-label=Type`；endpoint: 列表 `type` | `CannedResponseList.tsx:100` | | `CannedResponseList.tsx:100` |
| room.canned.empty | 无快捷回复 | itemCount===0 | 空 | DOM: [读] empty title=`No_Canned_Responses` | `CannedResponseList.tsx:105` | | `CannedResponseList.tsx:105` |
| room.canned.list-item | 打开详情 | `…→行` | 有行 | DOM: [读] 行点击；详情头 `!{shortcut}`；endpoint: 已有数据 | `CannedResponseList.tsx:116-122` | | `CannedResponse.tsx:50` |
| room.canned.use-from-list | 从列表行使用 | `…→行 Use` | `!isRoomOverMacLimit` | DOM: [读] Use 钮（Item）；把文本插入 composer；endpoint: none 客户端；persist: 草稿 [待渲染实测] | `CannedResponseList.tsx:118-123` | 03 composer | Item onClickUse |
| room.canned.create | 打开创建 | `…→Create` | `useCanCreateCannedResponse` | DOM: [读] `button` name=`Create`；进创建流；endpoint: 创建 API（管理字段域外展开） | `CannedResponseList.tsx:130-135` | | `CannedResponseList.tsx:133` |
| room.canned.detail.back | 详情回列表 | `…→!shortcut→Back_to_canned_responses` | 详情 | DOM: [读] title=`Back_to_canned_responses`；回列表 dialog | `CannedResponse.tsx:49` | | `CannedResponse.tsx:49` |
| room.canned.detail.edit | 编辑该条 | `…→Edit` | `allowEdit` | DOM: [读] `button` name=`Edit`；进编辑表；endpoint: update canned-responses | `CannedResponse.tsx:101` | | `CannedResponse.tsx:101` |
| room.canned.detail.use | 从详情使用 | `…→Use` | `allowUse`；MAC 超限 disabled | DOM: [读] `button` name=`Use`；插入 composer；endpoint: none | `CannedResponse.tsx:102-104` | | `CannedResponse.tsx:102-104` |

---

## 表 P — Contact profile

父：`room.toolbox.contact-profile`。dialog name=`Contact`。

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
|---|---|---|---|---|---|---|---|
| room.contact.close | 关联系人栏 | `…→Contact→×` | live | DOM: [读] `Close`；dialog `Contact` 关 | `ContactInfo.tsx:47` | `room.toolbox.contact-profile` | `ContactInfo.tsx:44-47` |
| room.contact.edit | 进编辑联系人 | `…→pencil Edit` | `edit-omnichannel-contact` 且无冲突 | DOM: [读] IconButton title=`Edit`；route context=edit；endpoint: 编辑表另计；persist: URL context | `ContactInfo.tsx:61-67` | | `ContactInfo.tsx:35,61-67` |
| room.contact.edit.denied | 无编辑权或有冲突 | 同上 | `!canEdit` 或 `hasConflicts` | DOM: [读] 钮 disabled title=`Not_authorized`（无权）或仅 disabled（冲突）；endpoint: none | `ContactInfo.tsx:61-63` | | `ContactInfo.tsx:61-63` |
| room.contact.see-conflicts | 打开冲突审阅 | `…→See_conflicts` | `conflictingFields.length>0` | DOM: [读] `button` name=`See_conflicts`；Callout title=`Conflicts_found`；`ReviewContactModal`；endpoint: 审阅提交另计 | `ContactInfo.tsx:70-83` | | `ReviewContactModal` |
| room.contact.tab.details | 切到 Details | `…→Details` | 始终 | DOM: [读] tab name=`Details` selected；endpoint: 已有 contact 数据 | `ContactInfo.tsx:87-89` | | `ContactInfo.tsx:87` |
| room.contact.tab.channels | 切到 Channels | `…→Channels` | 始终 | DOM: [读] tab name=`Channels` | `ContactInfo.tsx:90-92` | | `ContactInfo.tsx:90` |
| room.contact.tab.history | 切到 History | `…→History` | 始终 | DOM: [读] tab name=`History` | `ContactInfo.tsx:93-95` | | `ContactInfo.tsx:93` |
| room.contact.phone.copy | 复制电话 | Details→phone→Copy | 有 phones | DOM: [读] IconButton title=`Copy`；toast Copied；endpoint: none | `ContactInfoPhoneEntry.tsx:25` | | `useClipboardWithToast` |
| room.contact.phone.outbound | 对该号发外呼 | Details→outbound | 非 unknown contact | DOM: [读] outbound 钮；unknown 时 disabled title=`error-unknown-contact`；endpoint: 外呼向导 | `ContactInfoPhoneEntry.tsx:27-32` | `nav.create.outbound` | `ContactInfoOutboundMessageButton` |
| room.contact.email.entry | 展示/点邮箱项 | Details→Email 行 | 有 emails | DOM: [读] 列表 `aria-labelledby={id}-emails` label=`Email`；项为展示+动作；endpoint: none | `ContactInfoDetails.tsx:30-38` | | `ContactInfoDetailsEntry` |

---

## 表 Q — Game center

父：`room.toolbox.game-center`。dialog name=`Apps_Game_Center`。

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
|---|---|---|---|---|---|---|---|
| room.game.close | 关 Game Center | `…→Apps_Game_Center→×` | `externalComponents.length>0` | DOM: [读] `Close`；dialog `Apps_Game_Center` 关 | `GameCenterList.tsx:46` | `room.toolbox.game-center` | `GameCenterList.tsx:45-46` |
| room.game.open | 打开某个游戏 | `…→表行 Name` | 有 games | DOM: [读] TableRow action；iframe title=`Apps_Game_Center` src=game.url；endpoint: 已有组件列表 `GET /apps/externalComponents` | `GameCenterList.tsx:61` | | `GameCenterContainer.tsx:32-33` |
| room.game.invite | 邀请好友进游戏 | `…→行 plus` | 行存在 | DOM: [读] Icon title=`Apps_Game_Center_Invite_Friends`；打开邀请 modal；endpoint: 邀请发送 [待渲染实测 path] | `GameCenterList.tsx:67-78` | | `GameCenterInvitePlayersModal` |
| room.game.back | 从游戏回列表 | 游戏容器→Back | 已打开游戏 | DOM: [读] title=`Back`；回列表；iframe 卸 | `GameCenterContainer.tsx:26` | | `GameCenter.tsx:23-26` |
| room.game.close-from-container | 从游戏关栏 | 游戏容器→× | 已打开 | DOM: [读] `Close`；整 tab 关 | `GameCenterContainer.tsx:30` | `room.game.close` | `GameCenter.tsx:21` |
| room.game.empty | 无外部组件 | games 空且非 loading | 列表空 | DOM: [读] 空表（无 empty i18n 标题）；endpoint: 列表空；persist: n/a | `GameCenterList.tsx:49-85` | | `GameCenterList.tsx:49` |

---

## 表 R — Outlook

父：`room.toolbox.outlook-calendar`。dialog name=`Outlook_calendar`。

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
|---|---|---|---|---|---|---|---|
| room.outlook.close | 关日历栏 | `…→Outlook_calendar→×` | `Outlook_Calendar_Enabled` | DOM: [读] `Close`；dialog `Outlook_calendar` 关 | `OutlookEventsList.tsx:52` | `room.toolbox.outlook-calendar` | `OutlookEventsList.tsx:49-52` |
| room.outlook.empty | 今日无事件 | total===0 | 非 pending | DOM: [读] States title=`No_history` | `OutlookEventsList.tsx:64-68` | | `OutlookEventsList.tsx:64-68` |
| room.outlook.error | 加载失败 | query error | error | DOM: [读] title=`Something_went_wrong` | `OutlookEventsList.tsx:57-62` | | `OutlookEventsList.tsx:57-62` |
| room.outlook.item-open | 打开事件详情 | `…→事件行` | 有事件 | DOM: [读] 可点行；`OutlookCalendarEventModal`；endpoint: 已有日历数据 | `OutlookEventItem.tsx:32-42,45-54` | | `OutlookCalendarEventModal` |
| room.outlook.join | 加入会议 | 行内 `Join` | 有 `meetingUrl` | DOM: [读] `button` name=`Join`；打开会议 URL；endpoint: 外链 | `OutlookEventItem.tsx:61-65` | | `useOutlookOpenCall` |
| room.outlook.calendar-settings | 打开日历设置 | `…→Calendar_settings` | `authEnabled` | DOM: [读] `button` name=`Calendar_settings`；`changeRoute`；endpoint: 路由 | `OutlookEventsList.tsx:88` | | `OutlookEventsList.tsx:88` |
| room.outlook.open-outlook | 外开 Outlook | `…→Open_Outlook` | `user.settings.calendar.outlook.Outlook_Url` | DOM: [读] `button` name=`Open_Outlook`；`window.open`；endpoint: 外链 | `OutlookEventsList.tsx:89-93` | | `OutlookEventsList.tsx:45,89-93` |
| room.outlook.sync | 同步 / 登录后同步 | `…→Sync` 或 `Log_in_to_sync` | `hasOutlookMethods`（非 NotOnDesktopError） | DOM: [读] `button` name=`Sync`/`Log_in_to_sync` loading；endpoint: [读] Outlook sync mutation；persist: 今日事件刷新 | `OutlookEventsList.tsx:95-102` | | `useMutationOutlookCalendarSync` |

---

## 表 S — E2EE 弹层内部

父打开是 02 `room.toolbox.e2e`（无 tab）。本表只收 **确认/重置控件**。口令模态由全局 E2EE bootstrap 打开，不在 toolbox 点击链，见边界。

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
|---|---|---|---|---|---|---|---|
| room.info.e2ee.enable.confirm | 确认开启房间加密 | `工具栏→Enable_E2E_encryption→确认` | `E2E_Enable` + 权限矩阵；联邦 disabled | DOM: [读] 确认钮（`E2E_enable_encryption` 文案）；toast `E2E_Encryption_enabled_for_room`；endpoint: [读] `POST /v1/rooms.saveRoomSettings` `{encrypted:true}`；persist: `room.encrypted` | `EnableE2EEModal.tsx:19-20` | `room.toolbox.e2e` | `useE2EERoomAction.ts:73-90` |
| room.info.e2ee.enable.cancel | 取消开启 | 同上→Cancel | modal 开 | DOM: [读] `Cancel`；不改 encrypted | `EnableE2EEModal.tsx:21` | | `EnableE2EEModal.tsx:21` |
| room.info.e2ee.disable.confirm | 确认关闭加密 | `工具栏→Disable_E2E_encryption→确认` | 房间已加密 | DOM: [读] 确认；toast `E2E_Encryption_disabled_for_room`；endpoint: `{encrypted:false}`；persist: 刷新非加密 | `DisableE2EEModal.tsx:21-22` | | `useE2EERoomAction.ts` |
| room.info.e2ee.disable.cancel | 取消关闭 | →Cancel | modal 开 | DOM: [读] `Cancel` | `DisableE2EEModal.tsx:23` | | `DisableE2EEModal.tsx:23` |
| room.info.e2ee.reset-accordion | 展开重置密钥段 | Disable modal→`E2E_reset_encryption_keys` | `canResetRoomKey` | DOM: [读] Accordion title=`E2E_reset_encryption_keys` | `DisableE2EEModal.tsx:37` | | `DisableE2EEModal.tsx:37` |
| room.info.e2ee.reset-open | 打开重置密钥确认 | →`E2E_reset_encryption_keys_button` | 同上 | DOM: [读] 按钮该 i18n；换成 ResetKeys modal | `DisableE2EEModal.tsx:41-43` | | `BaseDisableE2EEModal.tsx:23-25` |
| room.info.e2ee.reset.confirm | 确认重置房间密钥 | ResetKeys→确认 | 重置 modal | DOM: [读] 确认；toast `E2E_reset_encryption_keys_success`；annotation `This_action_cannot_be_undone`；endpoint: [读] `POST /v1/e2e.resetRoomKey`；persist: 新密钥 | `ResetKeysE2EEModal.tsx:48` | | `useE2EEResetRoomKey.ts:15-31` |
| room.info.e2ee.reset.cancel | 取消重置 | →Cancel | modal | DOM: [读] `Cancel` | `ResetKeysE2EEModal.tsx:47` | | `ResetKeysE2EEModal.tsx:47` |
| room.info.e2ee.federated.disabled | 联邦房 E2EE 钮禁用 | 工具栏看钥匙 | federated | DOM: [读] 工具栏动作 disabled tooltip=`core.E2E_unavailable_for_federation`；无弹层；endpoint: none | `useE2EERoomAction.ts` | `room.toolbox.e2e` | `useE2EERoomAction.ts` |

---

## 表 T — Omnichannel QuickActions（02 OOS，本册 IN）

`quickActionHooks` 实装 **5** 个：`useMoveQueueQuickAction` `useChatForwardQuickAction` `useTranscriptQuickAction` `useCloseChatQuickAction` `useOnHoldChatQuickAction`（`ui.ts:71-77`）。工具栏 `aria-label=Omnichannel_quick_actions`（`QuickActions.tsx:21`）。**Resume 不是 hook**，在 composer `ComposerOmnichannelOnHold`。

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
|---|---|---|---|---|---|---|---|
| room.quick.moveQueue | 打开回队确认 | live 头→`Move_queue` | `returnQueue` 且 `room.u` 且 roomOpen 且未超 MAC | DOM: [读] 工具栏钮 title=`Move_queue`；modal `Return_to_the_queue` body=`Would_you_like_to_return_the_queue`；endpoint: 待确认 | `useMoveQueueQuickAction.ts:8-12` | | `useQuickActions.tsx:269,284-285` |
| room.quick.moveQueue.confirm | 确认回队 | modal→Confirm | modal | DOM: [读] `Confirm`；关房 `/home`；endpoint: [读] `POST /v1/livechat/inquiries.returnAsInquiry`；persist: 房间/订阅刷新不在进行中 | `ReturnChatQueueModal.tsx:17-19` | | `useReturnChatToQueueMutation.ts:11-17` |
| room.quick.moveQueue.cancel | 取消回队 | modal→Cancel | modal | DOM: [读] `Cancel`；endpoint: none | `ReturnChatQueueModal.tsx:18` | | `ReturnChatQueueModal.tsx:18` |
| room.quick.chatForward | 打开转接表 | 头→`Forward_chat` | `transfer-livechat-guest` 且 roomOpen 未超 MAC | DOM: [读] title=`Forward_chat`；modal 标题同；endpoint: 待提交 | `useChatForwardQuickAction.ts:8-12` | | `useQuickActions.tsx:286-287` |
| room.quick.chatForward.department | 选目标部门 | modal→`Forward_to_department` | 与 user 互斥 | DOM: [读] 自动完成 label=`Forward_to_department`；endpoint: departments list | `ForwardChatModal.tsx:112-128` | | `useDepartmentsList` |
| room.quick.chatForward.username | 选目标坐席 | modal→`Forward_to_user` | 与 dept 互斥；排除当前 servedBy | DOM: [读] label=`Forward_to_user`；endpoint: `GET /v1/users.info` | `ForwardChatModal.tsx:133-151` | | `ForwardChatModal.tsx:57-59` |
| room.quick.chatForward.comment | 转接备注 | modal→`Leave_a_comment` | 可选 | DOM: [读] textarea label=`Leave_a_comment` (`Optional`) | `ForwardChatModal.tsx:154-167` | | `ForwardChatModal.tsx:154` |
| room.quick.chatForward.confirm | 提交转接 | modal→`Forward` | 须 username **或** department（不能同时） | DOM: [读] `button` name=`Forward`；toast `Transferred`；`/home`；endpoint: [读] `POST /v1/livechat/room.forward`；persist: 分配刷新 | `ForwardChatModal.tsx:105-108` | | `ForwardChatModal.tsx:52-94` |
| room.quick.chatForward.cancel | 取消转接 | →Cancel | modal | DOM: [读] `Cancel` | `ForwardChatModal.tsx:104` | | `ForwardChatModal.tsx:104` |
| room.quick.transcript.toggle | 打开 transcript 子菜单 | 头→`Send_transcript` | email 权 **或**（企业+PDF 权） | DOM: [读] title=`Send_transcript`；下拉两项 | `useTranscriptQuickAction.ts:8-24` | | `QuickActionOptions.tsx:31` |
| room.quick.transcript.email | 打开邮件 transcript 表 | 下拉→`Send_via_email` | `send-omnichannel-chat-transcript`；访客无邮箱则 toast `Customer_without_registered_email` | DOM: [读] 项 name=`Send_via_email`；`Transcript` modal；预取 `GET /v1/livechat/visitors.info` | `useTranscriptQuickAction.ts:15` | | `useQuickActions.tsx:212-228` |
| room.quick.transcript.pdf | 请求 PDF transcript | 下拉→`Export_as_PDF` | `request-pdf-transcript` + 企业；**房间仍 open 则 disabled** tooltip=`Export_enabled_at_the_end_of_the_conversation` | DOM: [读] 项 name=`Export_as_PDF`；toast `Livechat_transcript_has_been_requested`；endpoint: [读] `POST /v1/omnichannel/:rid/request-transcript`；persist: 任务在服务端 | `useTranscriptQuickAction.ts:16-22` | | `useQuickActions.tsx:93-104,209-210` |
| room.quick.transcript.modal.email | 填 transcript 邮箱 | Transcript modal→`Email` | 无预填/无既有请求 | DOM: [读] 字段 label=`Email` 校验 `Required_field` | `TranscriptModal.tsx:81-98` | | `TranscriptModal.tsx:81` |
| room.quick.transcript.modal.subject | 填 transcript 主题 | →`Subject` | 同上 | DOM: [读] label=`Subject` `Required_field` | `TranscriptModal.tsx:100-113` | | `TranscriptModal.tsx:100` |
| room.quick.transcript.modal.request | 进行中会话请求邮件 | →`Request` | `roomOpen && !transcriptRequest` | DOM: [读] `button` name=`Request`；toast `Livechat_email_transcript_has_been_requested`；endpoint: [读] `POST /v1/livechat/transcript/:rid`；persist: 请求刷新仍在 | `TranscriptModal.tsx:124-127` | | handler `77-90` |
| room.quick.transcript.modal.send | 已关会话发送邮件 | →`Send` | `!roomOpen` | DOM: [读] name=`Send`；endpoint: [读] `POST /v1/livechat/transcript` | `TranscriptModal.tsx:129-132` | | handler `109-118` |
| room.quick.transcript.modal.undo | 撤销待发请求 | →`Undo_request` | `roomOpen && transcriptRequest` | DOM: [读] name=`Undo_request`；warning `Livechat_transcript_already_requested_warning`；toast `Livechat_transcript_request_has_been_canceled`；endpoint: [读] `DELETE /v1/livechat/transcript/:rid` | `TranscriptModal.tsx:119-122` | | handler `123-134` |
| room.quick.onHold | 打开挂起确认 | 头→`Omnichannel_onHold_Chat` | 企业 license + `Livechat_allow_manual_on_hold` + `!room.onHold` + `room.u`；可选须坐席最后发言 | DOM: [读] title=`Omnichannel_onHold_Chat`；modal body=`Would_you_like_to_place_chat_on_hold` | `useOnHoldChatQuickAction.ts:6-21` | | `useQuickActions.tsx:263-279,296-297` |
| room.quick.onHold.confirm | 确认挂起 | modal→`Omnichannel_onHold_Chat` | modal | DOM: [读] 确认该 i18n；toast `Chat_On_Hold_Successfully`；endpoint: [读] `POST /v1/livechat/room.onHold`；persist: `room.onHold`；composer 换 Resume | `PlaceChatOnHoldModal.tsx:35-37` | `room.quick.resume` | `usePutChatOnHoldMutation.ts:11-17` |
| room.quick.onHold.cancel | 取消挂起 | →Cancel | modal | DOM: [读] `Cancel` | `PlaceChatOnHoldModal.tsx:34` | | `useQuickActions.tsx:248-251` |
| room.quick.closeChat | 打开关闭会话 | 头→`End_conversation` | roomOpen 且 `close-livechat-room` 或 `close-others-livechat-room` | DOM: [读] title=`End_conversation`（danger）；简单确认 **或** 完整 wrap-up | `useCloseChatQuickAction.ts:8-14` | | `useQuickActions.tsx:236-241,294-295` |
| room.quick.closeChat.simple.confirm | 无表单直接关 | 简单 modal→Confirm | `!commentRequired && !tagRequired && !canSendTranscript` | DOM: [读] title=`Are_you_sure_you_want_to_close_this_chat` confirm=`Confirm`；toast `Chat_closed_successfully`；endpoint: [读] `POST /v1/livechat/room.closeByUser`；persist: 房间关闭 | `CloseChatModal.tsx:253-261` | | `CloseChatModal.tsx:140-169` |
| room.quick.closeChat.simple.cancel | 取消简单关闭 | →Cancel | 简单态 | DOM: [读] `Cancel` | `CloseChatModal.tsx:258` | | `CloseChatModal.tsx:258` |
| room.quick.closeChat.form.comment | 关闭评语 | wrap-up→`Comment` | `Livechat_request_comment_when_closing_conversation` 则必填 | DOM: [读] 文本 label=`Comment` placeholder=`Please_add_a_comment` 错=`Required_field` | `CloseChatModal.tsx:169-177` | | `CloseChatModal.tsx:169` |
| room.quick.closeChat.form.tags | 关闭标签 | →`Tags` | 企业+部门标签 或 自由输入 | DOM: [读] 多选/输入 label=`Tags` 错=`error-tags-must-be-assigned-before-closing-chat`/`Enter_a_tag` | `Tags.tsx:74-99` | `room.info.live.field.tags` | `CurrentChatTags.tsx` |
| room.quick.closeChat.form.transcriptPdf | 关闭时出 PDF | checkbox `Omnichannel_transcript_pdf` | `request-pdf-transcript` + 企业 | DOM: [读] `checkbox` 该 label；payload `generateTranscriptPdf`；默认来自用户偏好 | `CloseChatModal.tsx:190-196` | `room.quick.transcript.pdf` | `CloseChatModal.tsx:190` |
| room.quick.closeChat.form.transcriptEmail | 关闭时发电邮 | checkbox `Omnichannel_transcript_email` | `send-omnichannel-chat-transcript` + 访客邮箱 + 非 always | DOM: [读] `checkbox` 该 label；露出 subject | `CloseChatModal.tsx:198-205` | `room.quick.transcript.email` | `CloseChatModal.tsx:198` |
| room.quick.closeChat.form.subject | 关闭电邮主题 | →`Subject` | transcript email 勾上则必填 | DOM: [读] 文本 label=`Subject` `Required_field` 默认 `Transcript_of_your_livechat_conversation` | `CloseChatModal.tsx:214-225` | | `CloseChatModal.tsx:214` |
| room.quick.closeChat.form.confirm | 提交 wrap-up 关闭 | →`Confirm` | 必填齐 | DOM: [读] `Confirm`；toast `Chat_closed_successfully`；endpoint: [读] `POST /v1/livechat/room.closeByUser`；persist: 关闭+标签 | `CloseChatModal.tsx:244-246` | | `CloseChatModal.tsx:90-114` |
| room.quick.closeChat.form.cancel | 取消 wrap-up | →`Cancel` | 表单态 | DOM: [读] `Cancel` | `CloseChatModal.tsx:243` | | `CloseChatModal.tsx:243` |
| room.quick.resume | 从挂起恢复（composer，非 hook） | 挂起房 composer→`Resume` | `room.onHold && room.open` | DOM: [读] `button` name=`Resume`；banner `chat_on_hold_due_to_inactivity` 消失、composer 恢复；endpoint: [读] `POST /v1/livechat/room.resumeOnHold`；persist: `onHold=false` | `ComposerOmnichannelOnHold.tsx:17-21` | `room.quick.onHold` | `ComposerOmnichannel.tsx:44-50` |

---

## 表 U — V1 sidebar RoomMenu kebab（02 OOS，本册 IN）

V1：`sidebar/RoomMenu.tsx` + `hooks/useRoomMenuActions.ts`。触发 `GenericMenu` `title=Options` `aria-keyshortcuts=alt`。V2 同名组件多通知段，用独立 id。

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
|---|---|---|---|---|---|---|---|
| sidebar.roomMenu.trigger | 打开房间行 Options | V1 侧栏行→`Options` | 菜单非空否则 disabled | DOM: [读] `button` title=`Options`；endpoint: none | `RoomMenu.tsx:26` | | `RoomMenu.tsx:26` |
| sidebar.roomMenu.hide | 隐藏房间 | Options→`Hide` | `!hideDefaultOptions` 且 `type!=='l'` | DOM: [读] menuitem name=`Hide`；确认 `Yes_hide_it` / `Hide_room`；endpoint: [读] close by type；persist: `open=false` **不**跳 /home（`redirect:false`） | `useRoomMenuActions.ts:62-67` | `room.info.action.hide` | `useHideRoomAction.tsx:50,65-88` |
| sidebar.roomMenu.toggleRead | 标已读/未读 | Options→`Mark_read`/`Mark_unread` | 始终（在默认项里） | DOM: [读] 双态 name；endpoint: [读] `POST /v1/subscriptions.read` 或 `POST /v1/subscriptions.unread`；persist: 未读态刷新 | `useRoomMenuActions.ts:68-72` | | `useToggleReadAction.ts:24-47` |
| sidebar.roomMenu.toggleFavorite | 收藏/取消 | Options→`Favorite`/`Unfavorite` | setting `Favorite_Rooms` | DOM: [读] 双态 name；endpoint: [读] `POST /v1/rooms.favorite`；persist: subscription.`f` | `useRoomMenuActions.ts:74-78` | `room.header.favorite` | `useToggleFavoriteAction` |
| sidebar.roomMenu.leave | 离开房间 | Options→`Leave_room` | 非 d/l；`cl!==false`；`leave-c`/`leave-p` | DOM: [读] name=`Leave_room`；确认；endpoint: [读] channels/groups/im leave；persist: 成员刷新不在 | `useRoomMenuActions.ts:80-85` | `room.info.action.leave` | `useLeaveRoom.tsx:34` |
| sidebar.roomMenu.hide.denied.omni | live 行无 Hide | type=`l` | omni | DOM: [读] 菜单无 `Hide`；endpoint: n/a | `useRoomMenuActions.ts:62` | | `useRoomMenuActions.ts:55,62` |
| sidebar.roomMenu.leave.denied | DM/live/cl=false 无 Leave | Options | `d`/`l` 或 `cl===false` 或无 leave 权 | DOM: [读] 无 `Leave_room` | `useRoomMenuActions.ts:40-48,80` | | `useRoomMenuActions.ts:40-48` |
| sidebar.roomMenu.hideDefaultOptions | 排队项隐藏默认菜单 | 队列行 kebab | `hideDefaultOptions===true` | DOM: [读] 默认项空；或仅 Priorities；endpoint: n/a | `useRoomMenuActions.ts:59-60` | | `SidebarItemTemplateWithData.tsx:150` |
| sidebar.roomMenu.v2.notifications-toggle | V2 行开关房间通知 | V2 Options→`Turn_ON`/`Turn_OFF` | secondarySidebar ON；有 subscription；非 omni | DOM: [读] name=`Turn_ON`/`Turn_OFF`；toast `Room_notifications_on/off`；endpoint: [读] `POST /v1/rooms.saveNotification`；persist: `disableNotifications` | V2 `useRoomMenuActions.ts:117-122` | `room.notif.turn-on` | `useToggleNotificationAction` |
| sidebar.roomMenu.v2.notifications-prefs | V2 跳通知偏好栏 | V2→`Preferences` | 同上 + href | DOM: [读] name=`Preferences`；打开 push-notifications 栏；endpoint: 路由；persist: URL tab | V2 `useRoomMenuActions.ts:124-128` | `room.toolbox.push-notifications` | V2 `:124-128` |
| sidebar.roomMenu.priority.unprioritized | 清除 live 优先级 | live Options→`Unprioritized` | type=l 且有优先级列表 | DOM: [读] name=`Unprioritized` 段标题=`Priorities`；endpoint: [读] `DELETE /v1/livechat/room/:rid/priority`；persist: 优先级刷新空 | `useOmnichannelPrioritiesMenu.ts:35-41` | `room.info.live.field.priority` | `useOmnichannelPrioritiesMenu.ts:35-41` |
| sidebar.roomMenu.priority.set | 设置 live 优先级 | →动态优先级名 | 同上 | DOM: [读] 动态 name；endpoint: [读] `POST /v1/livechat/room/:rid/priority`；persist: 刷新仍在 | `useOmnichannelPrioritiesMenu.ts:43-52` | | `useOmnichannelPrioritiesMenu.ts:43-52` |

---

## 验算

表体行必须等于「本分册 id 列表」条数。禁止把下表收成一个对外「总功能」标题——这些是**表行**。

| 表 | 行数 | 算法 |
|----|------|------|
| A Room/Team/live 壳 | 21 | Room kebab 9（含 Enter + unwired）+ Team 8 + live close/edit/denied 3；`9+8+3=21` |
| B EditRoomInfo | 26 | back+close+avatar×2=4；name/topic/announcement/description/type=5；accordion.advanced+7 advanced=8；accordion.prune+6 retention=7；reset+save=2。`4+5+8+7+2=26` |
| B2 live RoomEdit | 7 | topic/tags/sla/priority/custom/cancel/save |
| C Members | 44 | 壳 14（close…row.kebab）+ 动作 16 + UserInfo 2 + Add 6 + Invite 6；`14+16+2+6+6=44` |
| D Files | 14 | 壳 5 + 行/菜单 9 |
| E Notif | 15 | 与 `NotificationPreferencesForm` 8 个 `name=` + 3 accordion + Play + close/reset/save；`8+3+1+3=15` |
| F Prune | 17 | 10 字段 + close/submit/disabled/confirm/cancel + 2 result；`10+5+2=17` |
| G Export | 15 | close + method + method.e2e + format + 5 email/file 字段 + validation + reset + 4 submit |
| H Threads | 8 | close/search/type/item/follow-list/follow-detail/expand/empty |
| I Discussions | 4 | close/search/item/empty |
| J Mentions/Pinned/Starred/Search | 17 | mentions 3 + pinned 4 + starred 4 + search 6；`3+4+4+6=17` |
| K Team channels | 15 | 壳 6 + 行菜单 4 + add-existing 4 + create-new 1 |
| L Banned | 6 | close/empty/error/menu/unban/load-more |
| M Autotranslate | 4 | close/toggle/language/e2ee-callout |
| N Calls | 7 | close/empty/error/join/ended/discussion/load-more |
| O Canned | 10 | 列表 7 + 详情 3 |
| P Contact | 10 | 壳 7 + details 3 |
| Q Game | 6 | close/open/invite/back/close-container/empty |
| R Outlook | 8 | close/empty/error/item/join/settings/open/sync |
| S E2EE 弹层 | 9 | enable×2 + disable×2 + reset×4 + federated |
| T QuickActions | 31 | 回队 3 + 转接 6 + transcript 8 + hold 3 + close 10 + resume 1；`3+6+8+3+10+1=31` |
| U RoomMenu | 12 | trigger + 4 默认项 + 2 denied + hideDefault + 2 V2 + 2 priority |

分步：

`21+26=47`；`47+7=54`；`54+44=98`；`98+14=112`；`112+15=127`；`127+17=144`；`144+15=159`。

`159+8=167`；`167+4=171`；`171+17=188`；`188+15=203`；`203+6=209`；`209+4=213`；`213+7=220`。

`220+10=230`；`230+10=240`；`240+6=246`；`246+8=254`；`254+9=263`；`263+31=294`；`294+12=306`。

回检：`rg -c '^\| (room\.|sidebar\.roomMenu\.)' docs/qa/pm-feature-atlas/06-room-panel-interiors.md` → **306**。去重 id 同为 306。

---

## [待渲染实测] 汇总

比 02 短：dialog 的 role+title 已从 `useDialog` + `ContextualbarTitle` i18n **读出**，不再写「complementary 出现」。下列是**仍无法从 JSX 钉死**的碎片。

1. `room.members.action.video-call` outgoing 会议弹层的真实 role+name。
2. `room.members.action.voice-call` voip widget / Call_history 行是否对应本次呼叫。
3. `room.search.filter-text` 查询串刷新后是否还在输入框。
4. `room.search.encrypted-callout` 加密房搜索实际命中哪些消息（索引行为）。
5. `room.canned.use-from-list` / `room.canned.detail.use` 插入 composer 后草稿是否刷新仍在。
6. `room.game.invite` 邀请 modal 提交所用具体 endpoint。
7. Fuselage `<Select>` / `<MultiSelect>` / `GenericMenu` 项在浏览器里是 `combobox` 还是 `listbox`/`menuitem`（代码给了 option/i18n，未量 computed role）。
8. `useSplitRoomActions` 真机前 2 个主按钮到底是 Hide+Edit 还是 Hide+Leave（取决于哪些项使能）。
9. 团队踢人 `RemoveUsersModal` 向导各步（本表折进 `room.members.action.kick` 后果，未拆行）。
10. `room.teamChannels.create-new` 弹出的 `CreateChannelModal` 字段（与 `nav.create.channel` 同模，本行只到打开）。

---

## 计数证据

```text
# 本文件表体
rg -c '^\| (room\.|sidebar\.roomMenu\.)' docs/qa/pm-feature-atlas/06-room-panel-interiors.md
# → 306

# 与 02 主键零重叠
rg -c '^\| room\.toolbox\.' docs/qa/pm-feature-atlas/06-room-panel-interiors.md
# → 0

# contextualBar 顶层
ls -1 apps/meteor/client/views/room/contextualBar | wc -l
# → 18（含 uikit；Mentions/Pinned/Starred 是单文件 tab）

# EditRoomInfo Controller name=
rg -n "name='" apps/meteor/client/views/room/contextualBar/Info/EditRoomInfo/EditRoomInfo.tsx
# → 19（roomAvatar…retentionIgnoreThreads；无 encrypted）

# useRoomActions id
rg -n "id: '" apps/meteor/client/views/room/contextualBar/Info/hooks/useRoomActions.ts
# → hide enter edit leave move_channel_team convert_channel_team delete = 7

# NotificationPreferencesForm name=
rg -n "name='" apps/meteor/client/views/room/contextualBar/NotificationPreferences/NotificationPreferencesForm.tsx
# → turnOn muteGroupMentions showCounter showMentions desktopAlert desktopSound mobileAlert emailAlert = 8

# PruneMessages 表单 name=（排除 icon name）
# users inclusive pinned discussion threads attached = 6；日期在 PruneMessagesDateTimeRow

# quickActionHooks
# ui.ts:71-77 → 5：move-queue / chat-forward / transcript / close-chat / on-hold
ls apps/meteor/client/hooks/quickActions/*.ts | wc -l
# → 5

# Members 树
find apps/meteor/client/views/room/contextualBar/RoomMembers -type f \( -name '*.ts' -o -name '*.tsx' \) | wc -l
# → 30

# userInfo 动作 hook（与 C 表动作同源，02 已登记打开态）
ls apps/meteor/client/views/room/hooks/useUserInfoActions/actions/* | grep -v spec | wc -l
# → 14

# 其他面板文件数
find apps/meteor/client/views/room/contextualBar/RoomFiles -type f \( -name '*.ts' -o -name '*.tsx' \) | wc -l   # 7（含 spec/stories）
find apps/meteor/client/views/room/contextualBar/NotificationPreferences -type f \( -name '*.ts' -o -name '*.tsx' \) | wc -l  # 9
find apps/meteor/client/views/room/contextualBar/PruneMessages -type f \( -name '*.ts' -o -name '*.tsx' \) | wc -l  # 5
find apps/meteor/client/views/room/contextualBar/ExportMessages -type f \( -name '*.ts' -o -name '*.tsx' \) | wc -l  # 6
find apps/meteor/client/views/room/contextualBar/Threads -type f \( -name '*.ts' -o -name '*.tsx' \) | wc -l  # 21
find apps/meteor/client/views/room/contextualBar/BannedUsers -type f \( -name '*.ts' -o -name '*.tsx' \) | wc -l  # 6
find apps/meteor/client/views/teams/contextualBar/channels -type f \( -name '*.ts' -o -name '*.tsx' \) | wc -l  # 12
find apps/meteor/client/views/omnichannel/contactInfo -type f \( -name '*.ts' -o -name '*.tsx' \) | wc -l  # 30
find apps/meteor/client/views/omnichannel/cannedResponses/contextualBar -type f \( -name '*.ts' -o -name '*.tsx' \) | wc -l  # 9
ls apps/meteor/client/apps/gameCenter/*.{ts,tsx} | wc -l  # 4
find apps/meteor/client/views/outlookCalendar -type f \( -name '*.ts' -o -name '*.tsx' \) | wc -l  # 14
ls apps/meteor/client/views/room/contextualBar/AutoTranslate/*.{ts,tsx} | wc -l  # 4
ls apps/meteor/client/views/room/contextualBar/VideoConference/VideoConfList/*.{ts,tsx} | wc -l  # 5
ls apps/meteor/client/views/room/modals/E2EEModals/*.{ts,tsx} | wc -l  # 4
wc -l apps/meteor/client/sidebar/RoomMenu.tsx apps/meteor/client/hooks/useRoomMenuActions.ts
# 29 + 111
```

---

## 本分册 id 列表

1. room.info.close
2. room.info.kebab
3. room.info.action.hide
4. room.info.action.edit
5. room.info.action.leave
6. room.info.action.move-to-team
7. room.info.action.convert-to-team
8. room.info.action.delete
9. room.info.action.enter
10. room.info.action.enter.unwired
11. room.info.team.close
12. room.info.team.kebab
13. room.info.team.action.hide
14. room.info.team.action.edit
15. room.info.team.action.leave
16. room.info.team.action.convert-to-channel
17. room.info.team.action.delete
18. room.info.team.view-channels
19. room.info.live.close
20. room.info.live.edit
21. room.info.live.edit.denied
22. room.info.edit.back
23. room.info.edit.close
24. room.info.edit.avatar.upload
25. room.info.edit.avatar.reset
26. room.info.field.name
27. room.info.field.topic
28. room.info.field.announcement
29. room.info.field.description
30. room.info.field.type
31. room.info.edit.accordion.advanced
32. room.info.field.read-only
33. room.info.field.react-when-readonly
34. room.info.field.archived
35. room.info.field.join-code-required
36. room.info.field.join-code
37. room.info.field.hide-sys-mes
38. room.info.field.system-messages
39. room.info.edit.accordion.prune
40. room.info.field.retention-enabled
41. room.info.field.retention-override-global
42. room.info.field.retention-max-age
43. room.info.field.retention-exclude-pinned
44. room.info.field.retention-files-only
45. room.info.field.retention-ignore-threads
46. room.info.edit.reset
47. room.info.edit.save
48. room.info.live.field.topic
49. room.info.live.field.tags
50. room.info.live.field.sla
51. room.info.live.field.priority
52. room.info.live.field.custom
53. room.info.live.cancel
54. room.info.live.save
55. room.members.close
56. room.members.search
57. room.members.filter-status
58. room.members.load-more
59. room.members.empty
60. room.members.error
61. room.members.denied.broadcast
62. room.members.denied.federation
63. room.members.invite-link
64. room.members.invite-link.denied.abac
65. room.members.add-users
66. room.members.add-users.denied
67. room.members.row.open-user-info
68. room.members.row.kebab
69. room.members.action.direct-message
70. room.members.action.video-call
71. room.members.action.voice-call
72. room.members.action.add-to-room
73. room.members.action.set-owner
74. room.members.action.set-owner.federated
75. room.members.action.set-leader
76. room.members.action.set-moderator
77. room.members.action.set-moderator.federated
78. room.members.action.moderation-console
79. room.members.action.ignore
80. room.members.action.mute
81. room.members.action.block
82. room.members.action.kick
83. room.members.action.ban
84. room.members.action.report
85. room.members.user-info.back
86. room.members.user-info.close
87. room.members.add.back
88. room.members.add.picker
89. room.members.add.submit
90. room.members.add.submit.federated
91. room.members.add.external-denied
92. room.members.add.unban-confirm
93. room.members.invite.back
94. room.members.invite.copy
95. room.members.invite.edit
96. room.members.invite.expiration
97. room.members.invite.max-uses
98. room.members.invite.generate
99. room.files.close
100. room.files.search
101. room.files.type-filter
102. room.files.empty
103. room.files.load-more
104. room.files.file-row-preview
105. room.files.file-row-download
106. room.files.file-menu
107. room.files.file-menu-download
108. room.files.file-menu-download.denied
109. room.files.file-menu-delete
110. room.files.file-menu-delete.denied
111. room.files.delete.confirm
112. room.files.delete.cancel
113. room.notif.close
114. room.notif.turn-on
115. room.notif.mute-group-mentions
116. room.notif.show-counter
117. room.notif.show-mentions
118. room.notif.desktop-section
119. room.notif.desktop-alert
120. room.notif.desktop-sound
121. room.notif.play-sound
122. room.notif.mobile-section
123. room.notif.mobile-alert
124. room.notif.email-section
125. room.notif.email-alert
126. room.notif.reset
127. room.notif.save
128. room.prune.close
129. room.prune.newer-date
130. room.prune.newer-time
131. room.prune.older-date
132. room.prune.older-time
133. room.prune.users
134. room.prune.inclusive
135. room.prune.pinned
136. room.prune.discussion
137. room.prune.threads
138. room.prune.attached
139. room.prune.submit
140. room.prune.submit.disabled
141. room.prune.confirm
142. room.prune.cancel
143. room.prune.result.success
144. room.prune.result.empty
145. room.export.close
146. room.export.method
147. room.export.method.e2e
148. room.export.format
149. room.export.date-from
150. room.export.date-to
151. room.export.to-users
152. room.export.additional-emails
153. room.export.subject
154. room.export.messages-validation
155. room.export.reset
156. room.export.submit.email
157. room.export.submit.file
158. room.export.submit.download-json
159. room.export.submit.download-pdf
160. room.threads.close
161. room.threads.filter-search
162. room.threads.filter-type
163. room.threads.list-item
164. room.threads.follow-list
165. room.threads.follow-detail
166. room.threads.expand
167. room.threads.empty
168. room.discussions.close
169. room.discussions.filter-search
170. room.discussions.list-item
171. room.discussions.empty
172. room.search.mentions.close
173. room.search.mentions.empty
174. room.search.mentions.jump
175. room.search.pinned.close
176. room.search.pinned.empty
177. room.search.pinned.jump
178. room.search.pinned.unpin
179. room.search.starred.close
180. room.search.starred.empty
181. room.search.starred.jump
182. room.search.starred.unstar
183. room.search.close
184. room.search.filter-text
185. room.search.global-toggle
186. room.search.empty
187. room.search.jump
188. room.search.encrypted-callout
189. room.teamChannels.close
190. room.teamChannels.filter-search
191. room.teamChannels.filter-type
192. room.teamChannels.empty
193. room.teamChannels.load-more
194. room.teamChannels.list-item
195. room.teamChannels.item-menu
196. room.teamChannels.toggle-auto-join
197. room.teamChannels.remove-from-team
198. room.teamChannels.delete
199. room.teamChannels.add-existing
200. room.teamChannels.add-existing.rooms
201. room.teamChannels.add-existing.submit
202. room.teamChannels.add-existing.cancel
203. room.teamChannels.create-new
204. room.banned.close
205. room.banned.empty
206. room.banned.error
207. room.banned.item-menu
208. room.banned.unban
209. room.banned.load-more
210. room.autotranslate.close
211. room.autotranslate.toggle
212. room.autotranslate.language
213. room.autotranslate.e2ee-unavailable
214. room.calls.close
215. room.calls.empty
216. room.calls.error
217. room.calls.join
218. room.calls.join.ended
219. room.calls.join-discussion
220. room.calls.load-more
221. room.canned.close
222. room.canned.search
223. room.canned.type-filter
224. room.canned.empty
225. room.canned.list-item
226. room.canned.use-from-list
227. room.canned.create
228. room.canned.detail.back
229. room.canned.detail.edit
230. room.canned.detail.use
231. room.contact.close
232. room.contact.edit
233. room.contact.edit.denied
234. room.contact.see-conflicts
235. room.contact.tab.details
236. room.contact.tab.channels
237. room.contact.tab.history
238. room.contact.phone.copy
239. room.contact.phone.outbound
240. room.contact.email.entry
241. room.game.close
242. room.game.open
243. room.game.invite
244. room.game.back
245. room.game.close-from-container
246. room.game.empty
247. room.outlook.close
248. room.outlook.empty
249. room.outlook.error
250. room.outlook.item-open
251. room.outlook.join
252. room.outlook.calendar-settings
253. room.outlook.open-outlook
254. room.outlook.sync
255. room.info.e2ee.enable.confirm
256. room.info.e2ee.enable.cancel
257. room.info.e2ee.disable.confirm
258. room.info.e2ee.disable.cancel
259. room.info.e2ee.reset-accordion
260. room.info.e2ee.reset-open
261. room.info.e2ee.reset.confirm
262. room.info.e2ee.reset.cancel
263. room.info.e2ee.federated.disabled
264. room.quick.moveQueue
265. room.quick.moveQueue.confirm
266. room.quick.moveQueue.cancel
267. room.quick.chatForward
268. room.quick.chatForward.department
269. room.quick.chatForward.username
270. room.quick.chatForward.comment
271. room.quick.chatForward.confirm
272. room.quick.chatForward.cancel
273. room.quick.transcript.toggle
274. room.quick.transcript.email
275. room.quick.transcript.pdf
276. room.quick.transcript.modal.email
277. room.quick.transcript.modal.subject
278. room.quick.transcript.modal.request
279. room.quick.transcript.modal.send
280. room.quick.transcript.modal.undo
281. room.quick.onHold
282. room.quick.onHold.confirm
283. room.quick.onHold.cancel
284. room.quick.closeChat
285. room.quick.closeChat.simple.confirm
286. room.quick.closeChat.simple.cancel
287. room.quick.closeChat.form.comment
288. room.quick.closeChat.form.tags
289. room.quick.closeChat.form.transcriptPdf
290. room.quick.closeChat.form.transcriptEmail
291. room.quick.closeChat.form.subject
292. room.quick.closeChat.form.confirm
293. room.quick.closeChat.form.cancel
294. room.quick.resume
295. sidebar.roomMenu.trigger
296. sidebar.roomMenu.hide
297. sidebar.roomMenu.toggleRead
298. sidebar.roomMenu.toggleFavorite
299. sidebar.roomMenu.leave
300. sidebar.roomMenu.hide.denied.omni
301. sidebar.roomMenu.leave.denied
302. sidebar.roomMenu.hideDefaultOptions
303. sidebar.roomMenu.v2.notifications-toggle
304. sidebar.roomMenu.v2.notifications-prefs
305. sidebar.roomMenu.priority.unprioritized
306. sidebar.roomMenu.priority.set

`1–306` = 306。与验算对齐。

---

## 边界

| 项 | 原因 | 出处 |
|----|------|------|
| 02 `room.toolbox.*` / `user.action.*` / `nav.*` / `sidebar.filter.*` | **不回收**；本表只写打开之后。等价动作用 关联 指回 02 | 02 表 A–E |
| EditRoomInfo `encrypted` / `showChannels` / `showDiscussions` | 在 `useEditRoomInitialValues` 类型里，**JSX 不渲染**。加密走 toolbox E2EE | `useEditRoomInitialValues.ts:21-29`；`EditRoomInfo.tsx` 无对应 Controller |
| Info 只读展示（avatar/markdown/ABAC 标签/retention callout） | 不可操作 | `RoomInfo.tsx` `TeamsInfo.tsx` `RoomInfoABACSection.tsx` |
| Mentions/Pinned/Starred 完整消息工具栏 | 01 已登记；本表只 jump + 本 tab 特有 unpin/unstar + empty | `MessageListTab.tsx` + 01 |
| `CreateChannelModal` 全字段 | `room.teamChannels.create-new` 只到打开；字段= `nav.create.channel` | `TeamsChannels.tsx:144-147` |
| 团队踢人向导逐步字段 | 折进 `room.members.action.kick` | `RemoveUsersFirstStep.tsx` |
| EnterE2EPassword / SaveE2EPassword | 全局 E2EE bootstrap，**不是** toolbox 点击链 | `lib/e2ee/rocketchat.e2e.ts` |
| `omnichannel-external-frame` | 内部只有 iframe（`Omnichannel_External_Frame_URL`），无第二层控件 | `ExternalFrameContainer` |
| Apps UiKit contextual bar | 运行时 app 注入，无稳定字段 id | `contextualBar/uikit` |
| Admin / Marketplace / Omni **管理后台** 字段 | 02/04/05 已标域外 | 456 / 188 / 472 ts/tsx |

---

## 与现行 atlas（相对 02）

02 是 **REGISTRATION**（打开 tab X）。本册是 **NEW child rows**，id 全部新建。

| 02 父 id | 本册子空间 | 说明 |
|----------|------------|------|
| `room.toolbox.channel-settings` / `team-info` | `room.info.*` | kebab + EditRoomInfo 每字段 |
| `room.toolbox.room-info` | `room.info.live.*` | ChatInfo/RoomEdit |
| `room.toolbox.e2e` | `room.info.e2ee.*` | 确认/重置弹层 |
| `room.toolbox.members-list` / `user-info-group` | `room.members.*` | 02 的 `user.action.*` 在此再写成员栏入口，关联旧 id |
| `room.toolbox.uploaded-files-list` | `room.files.*` | |
| `room.toolbox.push-notifications` | `room.notif.*` | |
| `room.toolbox.clean-history` | `room.prune.*` | |
| `room.toolbox.export-messages` | `room.export.*` | |
| `room.toolbox.thread` | `room.threads.*` | |
| `room.toolbox.discussions` | `room.discussions.*` | |
| `room.toolbox.mentions` / `pinned-messages` / `starred-messages` / `rocket-search` | `room.search.*` | |
| `room.toolbox.team-channels` | `room.teamChannels.*` | |
| `room.toolbox.banned-users` | `room.banned.*` | |
| `room.toolbox.autotranslate` | `room.autotranslate.*` | 任务第 9 条；02 列表无此前缀 |
| `room.toolbox.calls` | `room.calls.*` | 同上 |
| `room.toolbox.canned-responses` | `room.canned.*` | 同上 |
| `room.toolbox.contact-profile` | `room.contact.*` | 同上 |
| `room.toolbox.game-center` | `room.game.*` | 同上 |
| `room.toolbox.outlook-calendar` | `room.outlook.*` | 同上 |
| 02 OOS `quickActionHooks` | `room.quick.*` | 5 hook + resume + 表单内部 |
| 02 OOS `sidebar/RoomMenu` | `sidebar.roomMenu.*` | V1 kebab；V2 通知两项另标 |

检索：

```text
rg -o '^\| (room|sidebar)\.[a-zA-Z0-9._-]+' docs/qa/pm-feature-atlas/02-room-user-nav.md | sort -u > /tmp/02-ids
rg -o '^\| (room|sidebar)\.[a-zA-Z0-9._-]+' docs/qa/pm-feature-atlas/06-room-panel-interiors.md | sort -u > /tmp/06-ids
comm -12 /tmp/02-ids /tmp/06-ids
# → 空（无回收 02 主键）
```
