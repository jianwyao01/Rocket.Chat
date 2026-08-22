# 15 — i18n 必须补行（8 列）

文档-only。不改产品代码。Round 2 Volume 15 的 **MISS 填空**。

对照：**冻结** `e519470d35b6caf5b228d81aef41c86aab3051f4`。输入是 [PR #24](https://github.com/jianwyao01/Rocket.Chat/pull/24) `15-i18n-full.md` **§5** 的 24 条必须补行。本文件 **只** 把那 24 个 key 写成 8 列功能行；**不**发明新 key，**不**改 §5 的 `file:line`。

诚实标记：`[读]` = 本树源码 / 三列字符串；`[待渲染实测]` = 未挂真实 UI。HIT 参考 id 仍来自 round-1 `cursor/pm-atlas-merge-12-16-1b5b`（00–16），只进「关联」列。

与 PR #24 的差：那份是反查输入（MISS **不**写 8 列）。本份是同一 24 条的 8 列行。`fill.*` 命名空间沿用 round-1 16。

---

## 1. 输入（PR #24 §5，不发明）

| # | key | English（en.i18n.json） | 按钮 file:line（e519470） |
| --- | --- | --- | --- |
| 1 | `Accept_without_mic` | Accept without mic | `packages/ui-voip/src/views/PermissionFlow/PermissionFlowModal.tsx:46` |
| 2 | `VoIP_allow_and_accept` | Allow and accept | `packages/ui-voip/src/views/PermissionFlow/PermissionFlowModal.tsx:49` |
| 3 | `Call_without_mic` | Call without mic | `packages/ui-voip/src/views/PermissionFlow/PermissionFlowModal.tsx:55` |
| 4 | `VoIP_allow_and_call` | Allow and call | `packages/ui-voip/src/views/PermissionFlow/PermissionFlowModal.tsx:58` |
| 5 | `Allow` | Allow | `packages/ui-voip/src/views/PermissionFlow/PermissionFlowModal.tsx:67` |
| 6 | `Open_sidebar` | Open sidebar | `apps/meteor/client/components/SidebarToggler/SidebarTogglerButton.tsx:18` |
| 7 | `Close_sidebar` | Close sidebar | `apps/meteor/client/components/SidebarToggler/SidebarTogglerButton.tsx:18` |
| 8 | `Remove_filter` | Remove filter {{filter}} | `apps/meteor/client/navbar/NavBarSearch/NavBarSearchInputAddon.tsx:38` |
| 9 | `Connect` | Connect | `apps/meteor/client/components/connectionStatus/ConnectionStatusBar.tsx:67` |
| 10 | `Confirm_new_workspace` | Confirm new workspace | `apps/meteor/client/components/FingerprintChangeModalConfirmation.tsx:19` |
| 11 | `Confirm_configuration_update` | Confirm configuration update | `apps/meteor/client/components/FingerprintChangeModalConfirmation.tsx:19` |
| 12 | `Open_dialpad` | Open dialpad | `packages/ui-voip/src/views/MediaCallWidget/OngoingCall.tsx:80` |
| 13 | `Close_dialpad` | Close dialpad | `packages/ui-voip/src/views/MediaCallWidget/OngoingCall.tsx:80` |
| 14 | `Open_in_room` | Open in room | `packages/ui-voip/src/components/Cards/StreamCard/StreamCardOpenInRoom.tsx:16` |
| 15 | `Stop_sharing` | Stop sharing | `packages/ui-voip/src/components/Cards/StreamCard/StreamCardStopSharingButton.tsx:16` |
| 16 | `Voice_call__user__cancel` | Cancel call with {{user}} | `packages/ui-voip/src/hooks/useMediaCallAction.ts:38` |
| 17 | `Voice_call__user__reject` | Reject call from {{user}} | `packages/ui-voip/src/hooks/useMediaCallAction.ts:46` |
| 18 | `Call_again` | Call again | `packages/fuselage-ui-kit/src/blocks/VideoConferenceBlock/VideoConferenceBlock.tsx:155` |
| 19 | `Call_back` | Call back | `packages/fuselage-ui-kit/src/blocks/VideoConferenceBlock/VideoConferenceBlock.tsx:155` |
| 20 | `Open_call` | Open call | `apps/meteor/client/views/room/contextualBar/VideoConference/VideoConfBlockModal.tsx:13` |
| 21 | `Set_up_2FA` | Set up 2FA | `apps/meteor/client/views/root/MainLayout/TwoFactorRequiredModal.tsx:23` |
| 22 | `Add_more_users` | Add more users | `apps/meteor/client/views/admin/users/AdminUserCreated.tsx:18` |
| 23 | `Reload_to_update` | Reload to update | `apps/meteor/client/components/AutoupdateToastMessage.tsx:23` |
| 24 | `Open_settings` | Open settings | `apps/meteor/client/views/room/contextualBar/VideoConference/VideoConfConfigModal.tsx:78` |

本节表体 **24**。`file:line` 与 PR #24 §5 逐字相同。

---

## 2. 8 列行

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `fill.voip.permission.accept-without-mic` | 来电麦克风权限未决时，无麦接听 | 已登录 → VoIP 来电 widget `Incoming_call` → `Accept`（`IncomingCall.tsx:32-33`）→ 浏览器 mic `PermissionState==='prompt'` → `PermissionFlowModal` type=`incomingPrompt` → `Accept_without_mic` | `useDevicePermissionPrompt2`：`state!=='granted'` 才 `setModal`；`getModalType('incoming','prompt')==='incomingPrompt'` `useDevicePermissionPrompt.tsx:34-51,159-161`。`onAccept` 仅 `sessionState.state==='ringing'` `MediaCallViewProvider.tsx:117-130`。`denied`/`noDevices` 走 `Continue_without_mic`，**不是**本行 | `[读]` ①钮 `t('Accept_without_mic')` icon=`mic-off`；`onCancel` 关模态并 `reject(PermissionRequestCancelledCallRejectedError)`；`onAccept` catch 后 `controls.acceptCall(true)`（micless）`[待渲染实测]` role。②无 REST；VoIP 信令 accept(micless)。③刷新不持久（会话态） | voip session；mic `prompt` | `room.chrome.call.incoming.accept`（videoconf 弹层 `Accept`，不是本入口）；`fill.voip.permission.allow-and-accept` | `PermissionFlowModal.tsx:43-50`；`useDevicePermissionPrompt.tsx:138-161`；`MediaCallViewProvider.tsx:117-130` `[读]` |
| `fill.voip.permission.allow-and-accept` | 来电麦克风权限未决时，授权并接听 | 同上 → `incomingPrompt` → `VoIP_allow_and_accept` | 同上一行 type=`incomingPrompt`。主键 `onConfirm` → `requestDevice` `useDevicePermissionPrompt.tsx:120-135` | `[读]` ①success 钮 `t('VoIP_allow_and_accept')` icon=`phone`；授权成功关模态、`controls.acceptCall(false)`；拒绝则换 `denied`/`noDevices` 模态 `[待渲染实测]`。②`navigator.mediaDevices` getUserMedia + VoIP accept(有麦)。③刷新不持久 | voip session；mic `prompt` | `fill.voip.permission.accept-without-mic` | `PermissionFlowModal.tsx:48-50`；`useDevicePermissionPrompt.tsx:120-135`；`MediaCallViewProvider.tsx:123-126` `[读]` |
| `fill.voip.permission.call-without-mic` | 呼出麦克风权限未决时，无麦呼叫 | 已登录 → 顶栏/房间 `Voice_call` 或 widget `NewCall` 发起 → `onCall` `requestDevice({actionType:'outgoing'})` → type=`outgoingPrompt` → `Call_without_mic` | `state!=='granted'` 且 `actionType==='outgoing'` `useDevicePermissionPrompt.tsx:46-47,159-161`。`onCall` 仅 `sessionState.state==='none'` 且已有 `targetPeer` `MediaCallViewProvider.tsx:83-114` | `[读]` ①钮 `t('Call_without_mic')` icon=`mic-off`；`onCancel` reject → catch `startCall(true)`（micless）`[待渲染实测]`。②无 REST；`controls.startCall(userId 或 number, 'user' 或 'sip', true)`。③刷新不持久 | targetPeer；mic `prompt` | `room.chrome.call.start.confirm`（videoconf `Start_call`）；`fill.voip.permission.allow-and-call` | `PermissionFlowModal.tsx:52-59`；`MediaCallViewProvider.tsx:83-114` `[读]` |
| `fill.voip.permission.allow-and-call` | 呼出麦克风权限未决时，授权并呼叫 | 同上 → `outgoingPrompt` → `VoIP_allow_and_call` | 同上一行 type=`outgoingPrompt`。主键 `onConfirm` | `[读]` ①success 钮 `t('VoIP_allow_and_call')` icon=`phone`；授权成功 `startCall(false)`；拒绝换 `denied`/`noDevices` `[待渲染实测]`。②getUserMedia + `startCall(..., false)`。③刷新不持久 | targetPeer；mic `prompt` | `fill.voip.permission.call-without-mic` | `PermissionFlowModal.tsx:57-59`；`MediaCallViewProvider.tsx:107-110` `[读]` |
| `fill.voip.permission.allow-device-change` | 换麦/扬声器前确认浏览器设备权限 | VoIP widget `DevicePicker` 打开菜单（或通话中 `onDeviceChange` 音频输入）→ `requestDevice({actionType:'device-change'})` → type=`deviceChangePrompt` → `Allow` | `state!=='granted'` 且 `actionType==='device-change'` `useDevicePermissionPrompt.tsx:42-44`。`DevicePicker.onOpenChange` `DevicePicker.tsx:103-118`；进行中换麦 `MediaCallViewProvider.tsx:133-161`。单词语 `Allow` 三列弱命中不算同一入口（PR #24 §5） | `[读]` ①primary 钮 `t('Allow')`；旁路 `Cancel`；`onConfirm` 要流后关模态 / 打开设备菜单 `[待渲染实测]`。②getUserMedia（可带 `deviceId.exact`）。③刷新不持久；选中设备写入 media-devices 偏好 | mic `prompt`；DevicePicker | `nav.voip.call`；`room.chrome.voip.mute` | `PermissionFlowModal.tsx:61-68`；`DevicePicker.tsx:101-118` `[读]` |
| `fill.shell.sidebar.open` | 窄屏汉堡：侧栏收起时打开 | 已登录壳 → 顶栏左 `sidebar.shouldToggle` 才渲染 `SidebarToggler` → IconButton **未** pressed → title=`Open_sidebar` | `shouldToggle`：V2 = tablet 或 mobile，V1 = 仅 mobile `LayoutProvider.tsx:35`。`NavBarPagesSection.tsx:12-16`。`pressed={!sidebar.isCollapsed}` `SidebarToggler.tsx:16-18`。02 `nav.sidebar.toggle` 写了汉堡但三列无本 key | `[读]` ①title=`Open_sidebar`；`sidebar.toggle()` → `isCollapsed` false `[待渲染实测]` name。②无 REST。③**刷新不持久**（`useState`） | layout `isCollapsed` | `nav.sidebar.toggle`；`fill.shell.sidebar.close` | `SidebarTogglerButton.tsx:18`；`SidebarToggler.tsx:13-18`；`LayoutProvider.tsx:35,68-73` `[读]` |
| `fill.shell.sidebar.close` | 窄屏汉堡：侧栏展开时关上 | 同上 → IconButton **已** pressed → title=`Close_sidebar` | 同一 IconButton 的 pressed 态。`pressed` 真时 title 切到 `Close_sidebar` `SidebarTogglerButton.tsx:18` | `[读]` ①title=`Close_sidebar`；`toggle()` → `isCollapsed` true。②无 REST。③刷新不持久 | layout `isCollapsed` | `fill.shell.sidebar.open`；`nav.sidebar.toggle` | `SidebarTogglerButton.tsx:18`；`SidebarToggler.tsx:16-18` `[读]` |
| `fill.navbar.search.remove-filter` | 顶栏 AI 搜索已选 chip 上移除该过滤 | 已登录 → 顶栏搜索开 AI（stars）→ 输入完成的 `in`/`from`/`after`/`before` 过滤 → chip `aria-label=Remove_filter` → 点 chip | `appliedFilterChips.length>0` 才渲染 `NavBarSearchInputAddon.tsx:28-46`。chips 仅 `aiSearchActive`：`AI_Intelligent_Search_Enabled` 且 license `AI_LICENSE_MODULE` 且用户已切 AI `useNavBarAISearch.ts:34-43`。`filterKey` ∈ `in`/`from`/`after`/`before` `useNavBarAISearch.ts:45-60` | `[读]` ①chip `aria-label=t('Remove_filter',{filter:filter.label})`；对应字段清空、焦点回输入 `[待渲染实测]`。②无 REST（只改 RHF `appliedFilters`）。③刷新不持久（表单 state） | `appliedFilters`；AI search license | 04/02 顶栏搜索行（无本 chip） | `NavBarSearchInputAddon.tsx:31-38`；`useNavBarAISearch.ts:45-60` `[读]` |
| `fill.shell.connection.reconnect` | 断线条上手动重连 | 任意壳页（含未登录）→ `ConnectionStatusBar` 因 `!connected` 出现 → 主键 `Connect` | `appLayout.wrap` 始终挂条 `appLayout.tsx:31`。`connected` 真则 `return null` `ConnectionStatusBar.tsx:39-41`。钮 `disabled` 当 `status` ∈ `connected`/`connecting` `:66`。可见且可点：`waiting`/`failed`/`offline` | `[读]` ①primary small `t('Connect')`；点后走 `reconnect()` `[待渲染实测]` 条消失时机。②`Meteor.reconnect()`；SDK 运输开时另 `ensureConnectedAndAuthenticated()` `ServerProvider.tsx:96-104`。③重连成功后条不渲染；失败仍在 | Meteor/SDK status | 03/04 无 connection-status 行 | `ConnectionStatusBar.tsx:39-68`；`ServerProvider.tsx:96-104`；`appLayout.tsx:31` `[读]` |
| `fill.admin.fingerprint.confirm-new-workspace` | 指纹变更后确认「新工作区」 | 已登录 admin → `Deployment_FingerPrint_Verified` 为假 → 先 `Unique_ID_change_detected` → `New_workspace` → 确认模态 title+confirm=`Confirm_new_workspace` | `useRole('admin')` 且 `deploymentFingerPrintVerified===false`（`null`/`true` 不弹）`useFingerprintChange.tsx:56-63`。`newWorkspace===true` 才用本 key `:19,23`。REST 另要 `manage-cloud` `misc.ts:814` | `[读]` ①warning `GenericModal` 双处 `t('Confirm_new_workspace')`；确认后关模态、toast `New_workspace_confirmed` `[待渲染实测]`。②`POST /v1/fingerprint` `{setDeploymentAs:'new-workspace'}`。③设置已核后刷新不再弹 | `Deployment_FingerPrint_Verified`；admin | `fill.admin.fingerprint.confirm-config-update` | `FingerprintChangeModalConfirmation.tsx:17-24`；`useFingerprintChange.tsx:39-97`；`FingerprintChangeModal.tsx:16-24` `[读]` |
| `fill.admin.fingerprint.confirm-config-update` | 指纹变更后确认「配置更新」 | 同上先模态 → `Configuration_update` → title+confirm=`Confirm_configuration_update` | 同钩子；`newWorkspace===false`。同一组件、同一 `file:line`，文案由 `newWorkspace` 分叉 | `[读]` ①双处 `t('Confirm_configuration_update')`；toast `Configuration_update_confirmed`。②`POST /v1/fingerprint` `{setDeploymentAs:'updated-configuration'}`。③已核后不再弹 | 同上 | `fill.admin.fingerprint.confirm-new-workspace` | `FingerprintChangeModalConfirmation.tsx:17-24`；`useFingerprintChange.tsx:76-94` `[读]` |
| `fill.voip.widget.dialpad.open` | 无屏幕共享能力的进行中通话，打开拨号盘 | 进行中 VoIP widget 且 `supportedFeatures` **不含** `screen-share` → `OngoingCall`（非 `OngoingCallWithScreen`）→ footer `Dialpad` title=`Open_dialpad` | `MediaCallWidgetViewRouter.tsx:11-15`：`state==='ongoing'` 且无 `screen-share` 才挂本组件。钮 `disabled` 当 `CONNECTING`/`RECONNECTING` `OngoingCall.tsx:76-81`。`open===false` 时 title 为 `Open_dialpad`。13 voip 条不写 Dialpad title | `[读]` ①`title=Open_dialpad`；`setOpen(true)` 展开只读 `TextInput` + `Keypad` `[待渲染实测]`。②无 REST；按键才 `onTone`/`sendTone`。③**刷新不持久**（`useState`） | session `ongoing`；无 screen-share | `room.chrome.voip.mute`；`fill.voip.widget.dialpad.close` | `OngoingCall.tsx:28-29,59-82`；`MediaCallWidgetViewRouter.tsx:11-15` `[读]` |
| `fill.voip.widget.dialpad.close` | 同一拨号钮关上拨号盘 | 同上且盘已开 → title=`Close_dialpad` | 同一 `ActionButton`；`open===true` 时 title 切到 `Close_dialpad` `:80` | `[读]` ①`title=Close_dialpad`；`setOpen(false)` 收起 Keypad。②无 REST。③刷新不持久 | 同上 | `fill.voip.widget.dialpad.open` | `OngoingCall.tsx:80` `[读]` |
| `fill.voip.widget.stream.open-in-room` | widget 远端共享流卡片「在房间打开」 | 进行中 + 有 `screen-share` → `OngoingCallWithScreen` → **非** popout 且 `remoteScreen.active` → 卡片 `Open_in_room` | `onClickOpenInRoom` 有值才渲染钮 `StreamCard.tsx:48`。本树只 `OngoingCallWithScreen.tsx:98` 传入 `onClickDirectMessage`。`useGoToDirectMessage`：有 `username`，且（`create-d` 或已有订阅），且当前房不是该 DM 才返回函数 `useGoToDirectMessage.ts:25-38`。13 popout 文案是 `Open_in_new_window` | `[读]` ①primary small icon=`arrow-expand` `t('Open_in_room')`；`router.navigate` name=`direct` params.rid=username `[待渲染实测]`。②无该点击的 REST（进房另计）。③URL `/direct/:username` | remoteScreen；peer username | `room.chrome.voip.popout`；`room.chrome.voip.toggle-chat` | `StreamCardOpenInRoom.tsx:15-17`；`OngoingCallWithScreen.tsx:97-102`；`useGoToDirectMessage.ts:20-38` `[读]` |
| `fill.voip.widget.stream.stop-sharing` | widget/房间共享流卡片停自己的共享 | 进行中且 `localScreen.active` → 本端 `StreamCard` `own` → `Stop_sharing` | `own && onClickStopSharing` `StreamCard.tsx:47`。挂载：`OngoingCallWithScreen.tsx:106`（widget）；`MediaCallCardList.tsx:55-58`（房间卡列表，hover 才显）。**不是** 13 `room.chrome.voip.share-screen` 的双态 title `Stop_sharing_screen` | `[读]` ①danger small icon=`desktop-cross` `t('Stop_sharing')`；`onToggleScreenSharing` → `controls.toggleScreenSharing()` `[待渲染实测]`。②无 REST；VoIP 停共享信令。③通话中有效 | localScreen.active | `room.chrome.voip.share-screen`（`Stop_sharing_screen`） | `StreamCardStopSharingButton.tsx:15-17`；`StreamCard.tsx:47`；`OngoingCallWithScreen.tsx:104-110`；`MediaCallCardList.tsx:54-60` `[读]` |
| `fill.voip.action.cancel-calling` | 顶栏/房间工具条在呼出态取消语音 | 已登录且 VoIP 可用 → 会话 `state==='calling'` 且有 `peerInfo` → 顶栏 `NavBarItem` / 移动 kebab / 1:1 DM toolbox `start-voice-call` → title=`Voice_call__user__cancel` | `useMediaCallAction`：`state==='calling' && peerInfo` 才返回本 title `useMediaCallAction.ts:36-41`。`state==='unavailable'` 整钩子 `undefined`。房间工具条另要 1:1 `peerId`、非 block、非 federated `useMediaCallRoomAction.ts:57-71`。13 `room.chrome.call.outgoing.cancel` 是 videoconf 弹层 `Cancel`，widget 呼出钮是 `t('Cancel')` `OutgoingCall.tsx:31-33`，都不是本 title | `[读]` ①title=`Cancel call with {{user}}` icon=`phone-off`；`endCall()`=`getEndCall(instance)()` `[待渲染实测]`。②无 REST；VoIP 结束呼出。③刷新后无进行中呼叫 | peer displayName；calling | `nav.voip.call`；`room.toolbox.start-voice-call`；`room.chrome.call.outgoing.cancel` | `useMediaCallAction.ts:36-41`；`NavBarVoipGroup.tsx:21`；`NavBarControlsWithData.tsx:44-50`；`useMediaCallRoomAction.ts:64-70` `[读]` |
| `fill.voip.action.reject-ringing` | 顶栏/房间工具条在振铃态拒接语音 | 同上但 `state==='ringing'` → title=`Voice_call__user__reject` | `useMediaCallAction.ts:44-49`。房间工具条同上一行。13 `room.chrome.call.incoming.decline` 是 videoconf `Decline`；widget 来电钮是 `t('Reject')` `IncomingCall.tsx:29-30` | `[读]` ①title=`Reject call from {{user}}` icon=`phone-off`；同一 `endCall()`。②无 REST；VoIP 拒接。③刷新后无振铃 | peer displayName；ringing | `nav.voip.call`；`room.chrome.call.incoming.decline` | `useMediaCallAction.ts:44-49`；`NavBarVoipGroup.tsx:21`；`useMediaCallRoomAction.ts:64-70` `[读]` |
| `fill.tl.videoconf.call-again` | 已结束 1:1 会议块：主叫再打 | 房间时间线 `videoconf` 消息（surface=`message` 且有 `rid`）→ 块 `'endedAt' in data` 且 `data.type==='direct'` 且 `createdBy._id===userId` → `Call_again` | `VideoConferenceBlock.tsx:43-48,120,142-155`。`callAgainHandler` 一律 `actionId:'callBack'` `:66-76`。10 `tl.uikit.videoconf.join` 只盖进行中 `Join`；`tl.uikit.videoconf.callback` 写了 actionId 但三列无本 key | `[读]` ①`VideoConfMessageButton` `t('Call_again')`；`handleOpenVideoConf(rid)`：若已 calling/ringing 则 no-op，否则 `loadCapabilities` + `dispatchPopup({rid})` `[待渲染实测]` Start 弹层。②随后确认才 `POST /v1/video-conference.start`（本钮本身无 REST）。③新会议进 Calls | videoconf-core；direct ended | `tl.uikit.videoconf.join`；`tl.uikit.videoconf.callback`；`room.chrome.call.start.confirm` | `VideoConferenceBlock.tsx:66-76,142-155`；`useMessageBlockContextValue.ts:27-38,53-55` `[读]` |
| `fill.tl.videoconf.call-back` | 已结束 1:1 会议块：被叫回拨 | 同上块，但 `createdBy._id!==userId` → `Call_back` | 同一 `file:line`、同一 `callAgainHandler`；仅 label 按 `isUserCaller` 分叉 `:155` | `[读]` ①`t('Call_back')`；后果同 `callBack` → outgoing Start 弹层。②同上一行。③同上一行 | videoconf-core；direct ended | `fill.tl.videoconf.call-again`；`tl.uikit.videoconf.callback` | `VideoConferenceBlock.tsx:120,153-155` `[读]` |
| `fill.tl.videoconf.open-call-blocked` | 浏览器拦了会议弹窗后，确认在新标签打开 | 点 Join / 接听等触发 `VideoConfManager` `call/join` → `useVideoConfOpenCall` `window.open(callUrl)` 返回 `null` → 模态 title=`Open_call_in_new_tab` → 确认钮 `Open_call` | 无 `window.RocketChatDesktop.openInternalVideoChatWindow`（桌面走内部窗，不弹本模态）`useVideoConfOpenCall.tsx:13-24`。`popup===null` 才 `setModal`。join 行只到 `joinCall`，不够 | `[读]` ①确认区 icon=`new-window` + `t('Open_call')`；`onConfirm` 再 `window.open` 并关模态 `[待渲染实测]`。②无 REST（URL 已由 join 给出）。③新标签会话；本页模态关 | callUrl；providerName | `tl.uikit.videoconf.join`；`room.chrome.call.incoming.accept` | `VideoConfBlockModal.tsx:10-29`；`useVideoConfOpenCall.tsx:9-24`；`VideoConfProvider.tsx:23-28` `[读]` |
| `fill.account.2fa.setup-required` | 强制 2FA 门闩模态上的「设置 2FA」 | 已登录 → 角色 `mandatory2fa` 且工作区 2FA 开且用户尚未启用 email/TOTP → `TwoFactorRequiredModal` → `Set_up_2FA` | `useRequire2faSetup`：`Accounts_TwoFactorAuthentication_Enabled` 且（email 或 TOTP 开）且用户角色有 `mandatory2fa` 且对应 2FA 未开 `useRequire2faSetup.ts:6-28`。`LoggedInArea.tsx:42` 挂检查。`route.2fa` / Security 页内 toggle **不是**这个入口 | `[读]` ①primary `t('Set_up_2FA')`；`onClick` **只** `setModal(null)`，**不** `navigate` 到 Security `TwoFactorRequiredModal.tsx:10-24` `[待渲染实测]`。②无 REST。③本挂载周期关后不自动再开；整页刷新且仍缺 2FA 会再挂 | user.roles；email2fa/totp | `page.account.security.totp.toggle`；`page.account.security.email-2fa`；`page.admin.permissions.role.mandatory-2fa` | `TwoFactorRequiredModal.tsx:14-24`；`useTwoFactorAuthSetupCheck.tsx:11-14`；`useRequire2faSetup.ts:6-28` `[读]` |
| `fill.admin.users.add-more` | 刚建用户后的空态「再加用户」 | 管理台 Users → `New_user` 填表保存成功 → `/admin/users/created/:uid` → 空态 footer `Add_more_users` | `AdminUsersPage`：`context==='created' && id` 且 `!isRoutePrevented` `:192`。进 created：`users.create` 成功 `router.navigate(/admin/users/created/${_id})` `AdminUserForm.tsx:154-165`。07 `page.admin.users.new` 是列表头 `New_user`，入口不同 | `[读]` ①`t('Add_more_users')` → `router.navigate('/admin/users/new')` 再挂 `AdminUserForm` `[待渲染实测]`。②本点击无 REST。③URL `/admin/users/new` | 新建用户 `_id`；create-user | `page.admin.users.new`；`page.admin.users.form.save` | `AdminUserCreated.tsx:17-18`；`AdminUsersPage.tsx:192`；`AdminUserForm.tsx:154-165` `[读]` |
| `fill.shell.autoupdate.reload` | 客户端热更新 toast 内立刻重载 | 已挂 `AppLayout` → 非 `development` 收到 `document` 事件 `client_changed` → 持久 info toast → `Reload_to_update` | `useAutoupdate`：`NODE_ENV==='development'` 则事件上直接 `location.reload()`、不渲染本钮 `useAutoupdate.tsx:10-23`。生产：`isPersistent:true` toast 内嵌 `AutoupdateToastMessage`。组件另对 idle/blur 自动 reload `AutoupdateToastMessage.tsx:9-11`。atlas 无 autoupdate 行 | `[读]` ①文案 `An_update_is_available` + primary small `t('Reload_to_update')`；`window.location.reload()` `[待渲染实测]`。②无 REST。③整页重载后是新客户端包 | `client_changed` | （无既有 atlas 行） | `AutoupdateToastMessage.tsx:21-24`；`useAutoupdate.tsx:12-24`；`AppLayout.tsx:75` `[读]` |
| `fill.room.videoconf.open-settings` | 未配会议应用时，房间配置模态给管理员打开设置 | 房间内发起/加入会议抛配置错 → `useVideoConfWarning` 开 `VideoConfConfigModal` → 管理员主键 `Open_settings` | `onConfirm && isAdmin` 才渲染本钮 `VideoConfConfigModal.tsx:76-79`。`isAdmin=useRole('admin')`；`onConfirm`=`admin-settings` push `{group:'Video_Conference'}` `useVideoConfWarning.tsx:8-21`。非管理员只有 `Close`。07 `page.admin.settings.open.video-conference` 是 Settings **索引卡**，入口不同 | `[读]` ①primary `t('Open_settings')`；关模态并进 `/admin/settings/Video_Conference` `[待渲染实测]`。②无该点击的 REST。③URL 组页刷新仍在 | admin；缺会议 app | `page.admin.settings.open.video-conference`；`room.toolbox.start-video-call` | `VideoConfConfigModal.tsx:75-79`；`useVideoConfWarning.tsx:8-21` `[读]` |

**NEW 计数**：24。

---

## 3. 计数与验算

```bash
git rev-parse HEAD
# e519470d35b6caf5b228d81aef41c86aab3051f4

rg -c '^\| `fill\.' docs/qa/pm-feature-atlas/round-2/15-i18n-must-fill-rows.md
# 24

rg -c '^\| [0-9]+ \| `' docs/qa/pm-feature-atlas/round-2/15-i18n-must-fill-rows.md
# 24
```

```bash
python3 - <<'PY'
from pathlib import Path
t = Path("docs/qa/pm-feature-atlas/round-2/15-i18n-must-fill-rows.md").read_text()
keys = [
  "Accept_without_mic","VoIP_allow_and_accept","Call_without_mic","VoIP_allow_and_call","Allow",
  "Open_sidebar","Close_sidebar","Remove_filter","Connect","Confirm_new_workspace",
  "Confirm_configuration_update","Open_dialpad","Close_dialpad","Open_in_room","Stop_sharing",
  "Voice_call__user__cancel","Voice_call__user__reject","Call_again","Call_back","Open_call",
  "Set_up_2FA","Add_more_users","Reload_to_update","Open_settings",
]
rows = [ln for ln in t.splitlines() if ln.startswith("| `fill.")]
joined = "\n".join(rows)
missing = [k for k in keys if k not in joined]
print("FILL", len(rows), "KEYS", len(keys), "MISSING_IN_ROWS", missing)
print("READ", sum("[读]" in ln for ln in rows))
print("COLS8", sum(ln.count("|")==9 for ln in rows))
PY
# FILL 24 KEYS 24 MISSING_IN_ROWS []
# READ 24
# COLS8 24
```

```text
24 = PR #24 §5 MUST
24 = §1 表体
24 = §2 `fill.*`
```

---

## 4. 与 round-1 弱行的差（不复用当 HIT）

PR #24 已说明这些入口 **不等于** 下列已有行。本文件只在「关联」引用，不把它们写成同一 id。

| 本行 | 不要当成同一入口 |
| --- | --- |
| PermissionFlow 五条 | 13 `room.chrome.call.incoming.accept`（videoconf `Accept`） |
| 侧栏开合 | 02 `nav.sidebar.toggle`（汉堡在，三列无 `Open_sidebar`/`Close_sidebar`） |
| 拨号盘 | 13 voip 条 Mute/Hold/Forward/Hangup |
| `Open_in_room` | 13 `room.chrome.voip.popout`（`Open_in_new_window`） |
| `Stop_sharing` | 13 `room.chrome.voip.share-screen`（`Stop_sharing_screen`） |
| cancel/reject title | 13 outgoing `Cancel` / incoming `Decline`；widget `Cancel`/`Reject` |
| `Call_again`/`Call_back` | 10 `tl.uikit.videoconf.join`；`tl.uikit.videoconf.callback` 无这两把 key |
| `Open_call` | 只写 join / `window.open` 成功路径不够 |
| `Set_up_2FA` | `route.2fa` / Security 页内 toggle |
| `Add_more_users` | 07 `page.admin.users.new` |
| `Open_settings` | 07 `page.admin.settings.open.video-conference` |

---

## 5. 停条件 / CLOSURE

```text
MUST 24 = FILL 24
§1 keys = §2 行内 i18n key（24/24）
每行含 [读] + e519470 file:line
```

本文件把 PR #24 的 24 ≠ 0 收成 8 列行。不宣称产品总掌握；不升级 `[待渲染实测]`。

---

## 6. 边界

- 只覆盖 §1 的 24 个 key。不回写 PR #24 的 HIT/OOS。
- `file:line` 冻结在 e519470；不跟 develop 重锚。
- `Set_up_2FA` 的点击在本树 **只关模态**，不导航到 Account Security；关联 07 页内 toggle 仍是另一入口。
- `Allow` 只写 Voip `deviceChangePrompt` 主键，不写设置项/权限里其它 `Allow`。
- 不把 widget `Stop_sharing` 与房间条 `Stop_sharing_screen` 合并。
- 不把 PermissionFlow `Accept_without_mic` 与 videoconf `Accept` 合并。

调查日：2026-08-22。冻结：`e519470d35b6caf5b228d81aef41c86aab3051f4`。输入：PR #24 §5。atlas 参考：`cursor/pm-atlas-merge-12-16-1b5b`。
