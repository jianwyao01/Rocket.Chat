# 03 — Composer 注册面 + 房间隐式交互

- 仓库：`https://github.com/jianwyao01/Rocket.Chat`（fork of RocketChat/Rocket.Chat）
- 调查分支：`develop` @ `e10bd504b9`
- 本分册只做测试图，不实现产品功能
- 诚实标记：`[读]` = 源码/i18n 可复述；`[待渲染实测]` = 必须在真实 RC 渲染后才能钉死 role+name / 时序
- 列约定：`触发后果三件套` = ①DOM role+name 出现/消失；②endpoint/method；③刷新是否还在。写不出三件套的行已删除
- 本分册命名空间：`composer.*` / `implicit.*` / `thread.*` / `shortcut.*`

---

## A. Composer 注册面

起点：`apps/meteor/client/views/room/composer/**`（`find` 得 **73** 个 `.ts/.tsx`）。容器路由见 `ComposerContainer.tsx:43-84`。legacy `messageBox.actions.add` **全仓库 0 调用**。

### A1 发送与输入

`ls` 核心文件：`messageBox/MessageBox.tsx`、`ComposerMessage.tsx`、`lib/chats/flows/sendMessage.ts`

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `composer.send` | 把当前输入（文本/附件/引用/编辑）发出去 | 打开已订阅房间 → 焦点落在 `textarea[name=msg]` → 输入非空文本或已有附件 → 点 `aria-label=Send` 的发送钮 | `canSend`：`roomCoordinator.getRoomDirectives(room.t).canSendMessage(room)`；联邦须 `isRoomNativeFederated` + `federationMatrixEnabled`；`MessageBox.tsx:314-332`。钮 disabled 当 `!typing && !isEditing && !hasUploads` 或上传中 `MessageBox.tsx:517` | `[读]` ①发送钮 `aria-label=Send` 变可点；消息列表新增 `role=listitem`；引用条消失。②普通 `POST /v1/chat.sendMessage`（`sendMessage.ts:51`）；编辑 `POST /v1/chat.update`（`data.ts:192`）；带附件先 `POST /v1/rooms.media/:rid` 再 `POST /v1/rooms.mediaConfirm/:rid/:id`。③刷新后消息仍在（server） | core | `composer.send.enter-behavior`；`implicit.draft.flushServer`；`thread.composer.reply` | `MessageBox.tsx:182-196,514-521`；`sendMessage.ts:63-151` |
| `composer.send.enter-behavior` | 按用户偏好决定 Enter 发送还是换行 | 设置 → Preferences → `sendOnEnter` 选 normal/desktop/alternative → 回房间 → 在 textarea 按 Enter / Shift+Enter | `useUserPreference('sendOnEnter')`；mobile 或 `null`/`normal`/`desktop&&!isMobile` 时 `sendOnEnter=true`（Enter 发送）；`alternative` 则修饰键+Enter 才发送。`MessageBox.tsx:124-125,221-233` | `[读]` ①无独立控件；textarea 内容被发送或插入 `\n`。②同 `composer.send`。③偏好存在用户设置（server），刷新后和弦语义不变 | core+preference | `shortcut.composer.send`；`shortcut.composer.newLine` | `MessageBox.tsx:123-125,221-233` |
| `composer.edit.cancel` | 退出正在编辑的消息 | 用 ↑ 进入编辑（见 `shortcut.composer.prevMessage`）→ 点 `Cancel` **或** 按 Escape | `chat.composer.editing` 为真；`MessageBox.tsx:198-214,244-248,513` | `[读]` ①`Cancel` 按钮与 hint「Editing_message」消失；textarea 恢复非 editing variant。②无 REST（仅 `currentEditingMessage.reset/cancel/stop`）。③刷新后不会停在编辑态 | core | `shortcut.composer.escape`；`implicit.composer.hint.editing` | `MessageBox.tsx:198-214,456-461,513` |
| `composer.join` | 未订阅时用 Join 先加入再发 | 预览公开房间且 `canSend=false` → 点发送栏 `Join` | `!canSend` 才渲染 Join；`MessageBox.tsx:506-509`。`onJoin` → `chat.data.joinRoom()` | `[读]` ①`Join` 按钮 loading 后消失，textarea 解除 disabled。②`POST /v1/rooms.join` `{roomId}`（`data.ts:276-277`）。③刷新后已成为订阅者，composer 正常 | core | `composer.variant.join-password`；`composer.variant.read-only` | `ComposerMessage.tsx:34-41`；`MessageBox.tsx:338-340,506-509` |
| `composer.keyboard.auto-wrap` | 选中文字再敲配对符，自动包一层 | 选中 textarea 一段文字 → 敲 `` ` " ' ( < { [ * _ ~ `` 之一 | 须有非空选区且 `event.data` 命中 `wrapSelectionPatterns`；`wrapSelection.ts:3-15,41-52` | `[读]` ①选区变成 `*text*` / `` `text` `` 等，光标仍包在中间。②无 endpoint。③仅写入当前文本；随草稿 persist | core | `composer.format.bold`；`composer.format.italic` | `wrapSelection.ts:25-65`；`MessageBox.tsx:399-410` |
| `composer.slash.execute` | 发送 `/cmd params` 执行斜杠命令 | textarea 输入 `/topic hello`（或任意已注册命令）→ Send / Enter | `isSlashCommandAllowed = !E2E_Enable \|\| !room.encrypted \|\| E2E_Allow_Unencrypted_Messages`（`MessageBox.tsx:116-118`）。命令自身 `permission` → `hasAtLeastOnePermission`（`processSlashCommand.ts:66-68`）。未知命令看 `Message_AllowUnrecognizedSlashCommand`（`:56`） | `[读]` ①composer 被 `clear()`；未知/无权限时出现 rocket.cat 临时提示。②clientOnly 走本地 callback；否则 `POST /v1/commands.run` + `POST /v1/statistics.telemetry`。③命令副作用（改 topic 等）刷新后仍在 | core+app | `composer.popup.slash-command`；`composer.popup.slash-preview` | `processSlashCommand.ts:46-114` |

**A1 计数**：表 6 行。`ls` `MessageBox.tsx` + `sendMessage.ts` + `processSlashCommand.ts` + `wrapSelection.ts`。

### A2 格式化工具栏

`formattingButtons` 注册表 **7** 项（`messageBoxFormatting.ts:34-106`；`rg "label:"` 命中 8 含类型声明）。工具栏：`MessageBoxFormattingToolbar.tsx`。

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `composer.format.bold` | 把选区包成 `*text*` | 选中文字 → 点 title=`Bold` 的粗体钮；或 `Ctrl/Cmd+B` | toolbar `disabled={isRecording \|\| !canSend}`（`MessageBox.tsx:487-493`）。formatter 来自 `chat.composer.formatters` | `[读]` ①选区变为 `*…*`。②无 REST。③随草稿；发出后刷新消息仍带 markdown | core | `shortcut.composer.formatBold` | `messageBoxFormatting.ts:35-40` |
| `composer.format.italic` | 把选区包成 `_text_` | 选中 → title=`Italic`；或 `Ctrl/Cmd+I` | 同格式化栏 | `[读]` ①选区变为 `_…_`。②无 REST。③同 bold | core | `shortcut.composer.formatItalic` | `messageBoxFormatting.ts:41-46` |
| `composer.format.strikethrough` | 把选区包成 `~text~` | 选中 → title=`Strikethrough` | 同格式化栏；无 command 快捷键 | `[读]` ①选区变为 `~…~`。②无 REST。③同 bold | core | `composer.keyboard.auto-wrap` | `messageBoxFormatting.ts:47-51` |
| `composer.format.inline-code` | 把选区包成行内代码 | 选中 → title=`Inline_code` | 同格式化栏 | `[读]` ①选区变为 `` `…` ``。②无 REST。③同 bold | core | `composer.keyboard.auto-wrap` | `messageBoxFormatting.ts:52-56` |
| `composer.format.multiline-code` | 把选区包成代码块 | 选中 → title=`Multi_line_code` | 同格式化栏 | `[读]` ①选区变为三反引号围栏。②无 REST。③同 bold | core | `composer.send` | `messageBoxFormatting.ts:57-61` |
| `composer.format.link` | 打开加链接弹窗，插入 `[text](url)` | 点 title=`Link` → 填 Text / URL → `Add` | 同格式化栏；URL 须 `isValidLink`（`AddLinkComposerActionModal.tsx:61-66`） | `[读]` ①modal `title=Add_link`、确认 `Add` 出现；确认后 modal 关、选区变 markdown 链接。②无 REST。③随草稿 | core | `composer.format.bold` | `messageBoxFormatting.ts:62-88`；`AddLinkComposerActionModal.tsx:39-46` |
| `composer.format.katex` | 打开 KaTeX 函数帮助外链 | 点 title=`KaTeX`（大屏为图标或 `$$KaTeX$$` 文本链） | `settings.peek('Katex_Enabled')`（默认 true）；文案还看 `Katex_Dollar_Syntax` / `Katex_Parenthesis_Syntax`。`messageBoxFormatting.ts:89-105` | `[读]` ①新窗口打开 `https://khan.github.io/KaTeX/function-support.html`；composer 文本不变。②无 RC endpoint。③无本地状态 | core+setting | — | `messageBoxFormatting.ts:89-105`；`MessageBoxFormattingToolbar.tsx:56-58` |
| `composer.format.overflow-dropdown` | 窄屏把除首项外的格式收入下拉 | 把窗口缩到 composer `inlineSize<480` → 点 `Message_Formatting_toolbox` 下拉 → 再点某 formatter | `variant==='small'` 时只外露第一项（通常 Bold），其余进 dropdown。`MessageBox.tsx:490`；`MessageBoxFormattingToolbar.tsx:20-37` | `[待渲染实测]` ①下拉菜单 role/name（Fuselage GenericMenu）。②无 REST。③纯布局，刷新后按宽度重算 | core | `composer.format.bold` | `FormattingToolbarDropdown.tsx`；`MessageBoxFormattingToolbar.tsx:20-37` |

**A2 计数**：表 8 行 = 注册表 7 + 窄屏 overflow 1。`python`/`rg`：`label:` 在 formatting 文件出现 8 次（含类型 1 + 按钮 7）。

### A3 弹层补全

`ComposerPopupProvider.tsx` 里 `createMessageBoxPopupConfig` **7** 套（含 omnichannel `!` canned，本分册不登记，见边界）。弹层壳：`ComposerBoxPopup.tsx` `role='menu'` `name='ComposerBoxPopup'`。

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `composer.popup.mention` | `@` 补全最近发言者 / @all / @here / spotlight 用户 | 在 textarea 输入 `@` 或 `@ali` → ↑↓ → Enter/Tab 或点击 option | 无额外 permission。建议条数 `Number_of_users_autocomplete_suggestions`（默认 5）。`ComposerPopupProvider.tsx:94,110-184` | `[读]` ①`role=menu` `name=ComposerBoxPopup` 标题 People；option `id=popup-item-{id}` `aria-selected`。②本地最近消息 + `GET /v1/spotlight?type={"users":true,"mentions":true}`。③选中写入文本，随草稿；刷新后 popup 关 | core+setting | `shortcut.popup.select` | `ComposerPopupProvider.tsx:110-184`；`ComposerBoxPopup.tsx:82-114` |
| `composer.popup.channel` | `#` 补全自己订过的 c/p 频道 | 输入 `#` + 过滤词 → Enter/Tab | 本地过滤 `!federated && (t==='c'\|\|'p')`。`ComposerPopupProvider.tsx:195-200` | `[读]` ①menu 标题 Channels。②本地 subscriptions + `GET /v1/spotlight?type={"rooms":true,"mentions":true}`。③写入 `#name `；popup 关 | core | `composer.popup.mention` | `ComposerPopupProvider.tsx:185-215` |
| `composer.popup.emoji-colon` | `:name` 内联 emoji 建议 | 输入至少 2 个触发字符（`triggerLength: 2`）如 `:smi` → 选一项 | `useUserPreference('useEmojis')` 为真才注册。`ComposerPopupProvider.tsx:99,216` | `[读]` ①menu 标题 Emoji。②仅本地 `emoji.list`，无 REST。③插入 unicode 或 `:name:`；`localStorage emoji.recent` 影响下次排序 | core+preference | `composer.emoji.picker` | `ComposerPopupProvider.tsx:216-273` |
| `composer.popup.emoji-plus` | `+:` 插入大表情前缀 | 行首输入 `+:` + 名 → 选一项 | 同 `useEmojis`；`triggerAnywhere: false`。`ComposerPopupProvider.tsx:274-279` | `[读]` ①menu 标题 Emoji。②本地 emoji.list。③插入 `+:name: `（prefix `+` + suffix 空格） | core+preference | `composer.popup.emoji-colon` | `ComposerPopupProvider.tsx:274-325` |
| `composer.popup.slash-command` | `/` 打开斜杠命令 palette | 行首输入 `/` 或 `/to` → ↑↓ → Enter/Tab 补全命令名 | `encrypted = isRoomEncrypted && E2E_Enable && !E2E_Allow_Unencrypted_Messages` 时整组 `disabled`。每条再 `command.permission`。`ComposerPopupProvider.tsx:101-103,327-360` | `[读]` ①menu 标题 Commands；加密不可用项 title=`Unavailable_in_encrypted_channels`。②仅本地 `slashCommands.commands`。③补全 `/cmd `，不立刻执行 | core+app | `composer.slash.execute` | `ComposerPopupProvider.tsx:327-363` |
| `composer.popup.slash-preview` | 带 preview 的命令横向预览并执行 | 输入 `/cmd ` + 参数（该命令 `providesPreview`）→ 点 preview option 或 Enter | `useComposerBoxPopupQueries` 要求 `slashCommands.commands[cmd].providesPreview`。`popup.option.preview` 才挂 `ComposerBoxPopupPreview`。`MessageBox.tsx:443-455` | `[读]` ①`role=menu` 内 `role=listbox`/`role=option`。②`GET /v1/commands.preview` 加载；选中 `POST /v1/commands.preview`。③composer `setText('')`；命令结果刷新后按命令语义 | core+app | `composer.slash.execute` | `ComposerBoxPopupPreview.tsx:31-76,106-133`；`ComposerPopupProvider.tsx:393-410` |

**A3 计数**：表 6 行（7 套 popup − 1 套 omnichannel canned）。`ls ComposerBoxPopup*.tsx` = **7** 文件（含 CannedResponse + 壳）。

### A4 动作工具栏 / 录音 / 附件 / Apps

`ls` hooks = **7**：audio / video / file-upload / webdav / discussion / location / timestamp。`data-qa-id` 硬编码：`audio-message` `video-message` `file-upload` `create-discussion` `share-location` `timestamp` `webdav-add` `menu-more-actions`。

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `composer.emoji.picker` | 打开 emoji 选择器并插入 | 点 toolbar title=`Emoji` → 在 picker 点一个 emoji | `useUserPreference('useEmojis')`；录音/`!canSend` 时 disabled。`MessageBox.tsx:162,168-177,480-485` | `[读]` ①toolbar title=Emoji；picker `[读]` `role=dialog` `aria-label=Emoji_picker`（EmojiPicker 组件）。②无 REST，`chat.emojiPicker.open` → `insertText`。③`localStorage emoji.recent/frequent/tone` | core+preference | `composer.popup.emoji-colon` | `MessageBox.tsx:164-178,480-485` |
| `composer.action.audio-message` | 开始录音，完成后当 mp3 附件 | 宽屏点 `data-qa-id=audio-message`；窄屏在 featured 或 More→Create new。再走 `implicit.recording.finish` | `AudioRecorder.isSupported()`；`FileUpload_Enabled`；`Message_AudioRecorderEnabled`；黑白名单不含/含 `audio/mp3`；`!isMicrophoneDenied`；`disableBasicActions=!canSend\|\|isRecording\|\|isEditing`。`useAudioMessageAction.ts:14-31`；`MessageBoxActionsToolbar.tsx:57` | `[读]` ①录音条 `role=group` `aria-label=Audio_recorder` 出现，textarea disabled。②开始无 REST；完成走 `uploadFiles` → `POST /v1/rooms.media/:rid`；`UserAction` 发 `notify-room` recording。③录音态不持久；上传成功后附件随发送 persist | core+setting | `implicit.recording.cancel`；`implicit.recording.finish` | `useAudioMessageAction.ts:13-64`；`AudioMessageRecorder.tsx:106-126` |
| `composer.action.video-message` | 打开视频录制浮层 | 宽屏点 `data-qa-id=video-message`；窄屏 More→Create new→video | `Message_VideoRecorderEnabled`；`FileUpload_Enabled`；`navigator.mediaDevices`+`MediaRecorder`；camera 未拒；MIME 黑白名单 `video/webm`；`VideoRecorder.getSupportedMimeTypes()`。`useVideoMessageAction.ts:12-30` | `[读]` ①`role=dialog` `aria-label=Video_record`；Record/Stop `aria-label`；Cancel/Send。②完成 `uploadFiles` → `POST /v1/rooms.media/:rid`。③浮层不持久；文件随发送 | core+setting | `composer.action.more-menu` | `useVideoMessageAction.ts:11-62`；`VideoMessageRecorder.tsx:116-136` |
| `composer.action.file-upload` | 打开系统文件选择器多选上传 | 点 `data-qa-id=file-upload`（clip）→ 选文件 | `FileUpload_Enabled`；`disableBasicActions`。`useFileUploadAction.ts:13,50` | `[读]` ①系统 file picker；确认后 composer 出现 `aria-label=文件名` 的 chip，组名 Uploads。②`POST /v1/rooms.media/:rid`。③上传队列仅 session；发出并 `mediaConfirm` 后刷新仍在 | core+setting | `composer.paste.image`；`implicit.upload.dropFiles` | `useFileUploadAction.ts:11-52`；`uploads.ts:157` |
| `composer.paste.image` | 粘贴剪贴板图片当附件 | 焦点在 textarea → `Ctrl/Cmd+V` 一张图（剪贴板无 `text/plain`） | 同 file upload；有 `text/plain` 则走默认粘贴。`MessageBox.tsx:351-353` | `[读]` ①出现名为 `Clipboard - {datetime}.ext` 的 chip。②同 `rooms.media`。③同 file-upload | core+setting | `composer.action.file-upload` | `MessageBox.tsx:342-379` |
| `composer.action.create-discussion` | 从 composer 打开创建讨论弹窗 | More (`data-qa-id=menu-more-actions`) → Create new → `Discussion` | `Discussion_enabled`；`start-discussion` **或** `start-discussion-other-user`；`!isRoomFederated`。`useCreateDiscussionAction.tsx:21-25` | `[待渲染实测]` ①CreateDiscussion modal 字段树。②提交 `POST /v1/rooms.createDiscussion`。③新讨论房间刷新后仍在 | core+permission+setting | `composer.action.more-menu` | `useCreateDiscussionAction.tsx:8-34` |
| `composer.action.share-location` | 分享当前位置为 geo 消息 | More → Share → `Location` → 允许定位 → Share | `MapView_Enabled===true`；`navigator.geolocation.getCurrentPosition`；`MapView_GMapsAPIKey` 非空；`!isRoomFederated`。`useShareLocationAction.tsx:17-24` | `[待渲染实测]` ①ShareLocation GenericModal / 权限提示 / 地图。②`POST /v1/chat.sendMessage` 带 `location.Point`。③刷新后地图附件仍在 | core+setting | `composer.send` | `useShareLocationAction.tsx:9-33`；`ShareLocationModal.tsx:36-52` |
| `composer.action.timestamp` | 插入时间戳 markup | More → Insert → `Timestamp` → 选日期/格式/时区 → Add | disabled 仅当 `!canSend \|\| isRecording`（**编辑态仍可用**）。`MessageBoxActionsToolbar.tsx:65`；`useTimestampAction.tsx:8-26` | `[待渲染实测]` ①modal `Insert_timestamp`。②无 REST，`composer.insertText`。③随草稿 | core | `composer.send` | `useTimestampAction.tsx:8-27` |
| `composer.action.webdav-add` | 添加 WebDAV 服务器账号 | More → Create new → `Add_Server` | `Webdav_Integration_Enabled`；整组可被 `hiddenActions` 含 `webdav-add` 藏掉。Add 项 `disabled=!isSuccess`。`useWebdavActions.tsx:12-33`；`MessageBoxActionsToolbar.tsx:77` | `[待渲染实测]` ①AddWebdavAccountModal。②账号保存走 WebDAV 集成 API（非本分册深挖）。③账号刷新后仍在 More 菜单 | core+setting | `composer.action.webdav-upload` | `useWebdavActions.tsx:11-34` |
| `composer.action.webdav-upload` | 从已连 WebDAV 选文件上传 | More → Create new → 点账户名 → 在 picker 选文件 | 同上 setting + query success 且有账户。`useWebdavActions.tsx:35-43` | `[待渲染实测]` ①WebdavFilePickerModal。②选中后 `uploadFiles` → `POST /v1/rooms.media/:rid`。③同 file-upload | core+setting | `composer.action.file-upload` | `useWebdavActions.tsx:22-43` |
| `composer.action.more-menu` | 打开 + 更多操作菜单 | 点 `data-qa-id=menu-more-actions`（icon=plus，`title=More_actions`） | `disabled={isRecording \|\| !canSend}`。`MessageBoxActionsToolbar.tsx:152` | `[待渲染实测]` ①GenericMenu 分段 Create_new / Share / Insert / Apps。②无 REST。③关闭后不持久 | core | `composer.action.create-discussion` | `MessageBoxActionsToolbar.tsx:151-163` |
| `composer.action.apps` | 运行 Apps Engine 注册的 messageBox 按钮 | More → Apps → 点 `{appId}/{actionId}` | `GET` actionButtons `context==='messageBoxAction'`；`useApplyButtonFilters` 按房间类型/角色/权限过滤。`useMessageboxAppsActionButtons.ts:13-25` | `[待渲染实测]` ①运行时 app i18n label。②UiKit `emitInteraction` `type=actionButton`（非普通 REST）。③取决于 app | app | `composer.action.more-menu` | `useMessageboxAppsActionButtons.ts:12-61` |
| `composer.upload.remove` | 去掉待发送附件 chip | 上传完成的 chip 上点 `aria-label=Remove`（cross） | 非 loading；`isProcessingUploads` 时整组 disabled。`MessageComposerGenericFile.tsx:55-63,93` | `[读]` ①该 `aria-label=文件名` chip 消失。②无新 REST（本地 store remove）。③刷新不会回来 | core | `implicit.upload.composerChipPreview` | `MessageComposerGenericFile.tsx:55-64` |
| `composer.upload.cancel` | 取消进行中的上传 | loading chip 上点 `aria-label=Cancel` | `isLoading = !upload.url && !upload.error`。`MessageComposerGenericFile.tsx:33,55` | `[读]` ①chip 与进度条消失。②中止 XHR；无 mediaConfirm。③无残留 | core | `implicit.upload.progressBanner` | `MessageComposerGenericFile.tsx:55-63` |
| `composer.upload.edit` | 改附件文件名 / alt | 点非 loading chip → FileUpload modal 改 name/altText → `Update` | `!isLoading && !upload.error` 才能打开。`MessageComposerGenericFile.tsx:35-38` | `[读]` ①modal `aria-labelledby` 标题 FileUpload；确认 `Update`；关闭后 chip 文件名变。②此时无 REST；发送时带新名走 mediaConfirm。③未发送则刷新丢失 | core | `implicit.upload.modalConfirm` | `MessageComposerGenericFile.tsx:35-52`；`FileUploadModal.tsx:63-112` |

**A4 计数**：表 15 行。`ls` action hooks **7**；`rg data-qa-id` 硬编码 8 个（含 more）。

### A5 容器变体（非 omnichannel）

路由顺序 `ComposerContainer.tsx:43-84`。Omnichannel 整支 OUT。

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `composer.variant.air-gapped` | 空窗限制时只读页脚，无输入框 | 工作区 `Cloud_Workspace_AirGapped_Restrictions_Remaining_Days===0` → 打开任意房间 | `useAirGappedRestriction()[0]`；天数 `<0` 视为有许可。`useAirGappedRestriction.ts:10-17`；`ComposerContainer.tsx:43-44` | `[读]` ①`MessageFooterCallout` 文案 `Composer_readonly_airgapped`；textarea 不出现。②无 REST。③设置未变则刷新仍只读 | core+license | — | `ComposerAirGappedRestricted.tsx:6-16` |
| `composer.variant.anonymous.sign-in` | 未登录点「登录后发言」 | 匿名可读工作区、未登录 → 进房间 → `Sign_in_to_start_talking` | `!uid`（`useMessageComposerIsAnonymous`）；`ComposerContainer.tsx:55-56` | `[读]` ①登录流出现（`forceLogin=true`）。②无房间 REST。③登录后刷新进正常 composer | core+setting | `composer.variant.anonymous.join` | `ComposerAnonymous.tsx:42-44` |
| `composer.variant.anonymous.join` | 以匿名用户开始说话 | 同上 → `Or_talk_as_anonymous` | 另需 `Accounts_AllowAnonymousWrite`。`ComposerAnonymous.tsx:15,45-48` | `[读]` ①按钮后出现可输入 composer。②Meteor method `registerUser` + `loginWithToken`。③token 会话刷新后仍在 | core+setting | `composer.variant.anonymous.sign-in` | `ComposerAnonymous.tsx:21-37,45-48` |
| `composer.variant.read-only` | 只读房间页脚；未订阅可 Join | 打开 `room.ro` 且无 `post-readonly` 的房间 | `roomCoordinator.readOnly` + `post-readonly` 依赖。`useMessageComposerIsReadOnly.ts:11-13` | `[读]` ①callout `room_is_read_only`；未订阅时 `Join`。②Join → `POST /v1/rooms.join`。③只读属性刷新仍在；Join 后仍可能只读 | core+permission | `composer.join` | `ComposerReadOnly.tsx:9-34` |
| `composer.variant.archived` | 归档房间不能输入 | 打开 `room.archived` 或 DM `subscription.archived` | `useMessageComposerIsArchived`。`ComposerContainer.tsx:63-64` | `[读]` ①callout `Room_archived`；无 textarea。②无 REST。③归档未解则刷新仍如此 | core | `implicit.editRoomInfo.save` | `ComposerArchived.tsx:8-10`；`useMessageComposerIsArchived.ts:3-4` |
| `composer.variant.join-password` | 用加入码加入加密加入的房间 | 无订阅 + `joinCodeRequired` + 无 `join-without-join-code` → 输入密码 → `Join_with_password` | `ComposerContainer.tsx:27-28,67-68` | `[读]` ①form `aria-label=Join_with_password`；成功后变正常 composer。②`POST /v1/rooms.join` `{roomId,joinCode}`。③刷新后已订阅 | core+permission | `composer.join` | `ComposerJoinWithPassword.tsx:13-47` |
| `composer.variant.blocked` | 被对方或自己屏蔽的 DM 不能输入 | 打开 DM 且 `subscription.blocked\|\|blocker` | 仅 DM。`useMessageComposerIsBlocked.ts:9-18` | `[读]` ①callout `room_is_blocked`。②无 REST。③屏蔽关系刷新仍在 | core | — | `ComposerBlocked.tsx:4-7` |
| `composer.variant.federation.invalid-version` | 非原生联邦房间禁止发送 | 打开 `isRoomFederated && !isRoomNativeFederated` | `ComposerContainer.tsx:39,51-52`；`ComposerFederation.tsx:17-18` | `[读]` ①callout `Federation_Matrix_Federated_Description_invalid_version` + 外链。②无 REST。③房间类型刷新不变 | core | `composer.variant.federation.disabled` | `ComposerFederationInvalidVersion.tsx:7-18` |
| `composer.variant.federation.disabled` | 联邦总开关关闭时不能发 | 原生联邦房间但 `useIsFederationEnabled()` 假 | `ComposerFederation.tsx:21-22` | `[读]` ①callout `Federation_Matrix_Federated_Description_disabled`。②无 REST。③设置刷新后仍禁 | core+setting | `composer.variant.federation.premium` | `ComposerFederationDisabled.tsx:7` |
| `composer.variant.federation.premium` | 无 federation 许可模块时不能加入/发 | 联邦已开但 `useHasLicenseModule('federation')` 假 | `ComposerFederation.tsx:15,25-26` | `[读]` ①callout `Federation_Matrix_join_public_rooms_is_premium`。②无 REST。③许可未变则刷新仍禁 | core+license | — | `ComposerFederationJoinRoomDisabled.tsx:7` |

**A5 计数**：表 10 行。`ComposerContainer` 变体分支 9（airgap/omni/fed/anon/ro/arch/join/block/select）− omni − select（select 记入 B11）+ fed 3 子态 + anon 2 按钮 = 10 可测动作。

---

## B. 隐式交互层

不在 message toolbar `*Items`、不在 `roomActionHooks` 注册表。房间视图用户仍能做的事。

### B1 Room Info kebab + EditRoomInfo

进路依赖 toolbox 打开 `channel-settings`（标题点击是 toolbox，**本分册不登记标题**）。kebab / Edit / 保存不在 hooks 注册表。

`find` Info 目录 `.ts/.tsx` **26**（含 spec 则更多）。

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `implicit.roomInfo.kebab.open` | 打开 Room Info 溢出菜单 | 打开 Channel/Discussion Info → 点 kebab（`title=More`） | `actions.items.length > 2` 才生成 menu（默认 size=2）。`useSplitRoomActions.ts:16-18`；`RoomInfo.tsx:68-75` | `[待渲染实测]` ①GenericMenu 分段出现。②无 REST。③刷新后 menu 关，须重开 Info | core | `implicit.roomInfo.action.leave` | `RoomInfo.tsx:68-75` |
| `implicit.roomInfo.action.edit` | 从 Info 进入编辑表单 | Info 面板点 `Edit`（前 2 个按钮之一，或 kebab） | `useCanEditRoom` = `edit-room`；联邦再 `Federation.isEditableByTheUser`。`useCanEditRoom.ts:12-16`；`RoomInfoRouter.tsx:23-35` | `[读]` ①标题切到 `Edit_channel`/`Edit_team`/`Edit_discussion`；Save/Reset 出现。②无即时 REST。③`isEditing` 为 local state，刷新回 Info | core+permission | `implicit.editRoomInfo.save` | `RoomInfoRouter.tsx:26-36` |
| `implicit.roomInfo.action.hide` | 隐藏房间（关订阅） | Info → Hide →（若未勾 don't ask）确认 `Yes_hide_it` | 有订阅即可调 `useHideRoomAction`。`useRoomActions.ts:32-36` | `[读]` ①确认 modal；成功后导航 `/home`，侧栏该房间消失。②`POST /v1/channels.close` 或 `groups.close` / `im.close`。③刷新后仍隐藏直至再打开 | core | `implicit.roomInfo.action.leave` | `useHideRoomAction.tsx:23-39,65-88` |
| `implicit.roomInfo.action.leave` | 离开房间 | Info → Leave → WarningModal `Leave_room` | `leave-c`（频道）或 `leave-p`（私有）；`room.cl!==false`；有 subscription。`useRoomLeave.tsx:22` | `[读]` ①WarningModal 出现再关；进 `/home`。②`POST /v1/channels.leave` / `groups.leave` / `im.leave`。③刷新后不再是成员 | core+permission | `implicit.roomInfo.action.hide` | `useRoomLeave.tsx:17-56` |
| `implicit.roomInfo.action.delete` | 删除房间 | kebab 危险区 → Delete → `Yes_delete_it` | `delete-{room.t}`；团队房间还要 `delete-team-channel/group`；联邦不可删。`useDeleteRoom.tsx:27-30` | `[读]` ①danger modal `Delete_roomType`。②`POST /v1/rooms.delete`（团队主房间 `POST /v1/teams.delete`）。③房间不可恢复 | core+permission | `implicit.roomInfo.action.leave` | `useDeleteRoom.tsx:21-99`；`useRoomActions.ts:88-97` |
| `implicit.roomInfo.action.moveToTeam` | 把频道移进团队 | kebab → `Teams_move_channel_to_team` → 选团队确认 | `!federated && !teamId && !prid && canEdit`。`useRoomMoveToTeam.tsx:15` | `[读]` ①ChannelToTeamModal；toast `Rooms_added_successfully`。②`POST /v1/teams.addRooms`。③刷新后房间带 teamId | core+permission | `implicit.roomInfo.action.convertToTeam` | `useRoomMoveToTeam.tsx:15-36` |
| `implicit.roomInfo.action.convertToTeam` | 把频道转成团队 | kebab → Convert → GenericModal `Convert` | `create-team` + `canEdit` + `!teamId && !prid && !federated`。`useRoomConvertToTeam.tsx:14-17` | `[读]` ①warning modal `Converting_channel_to_a_team`；toast `Room_has_been_converted`。②`POST /v1/channels.convertToTeam` 或 `groups.convertToTeam`。③刷新后变为团队 | core+permission | `implicit.roomInfo.action.moveToTeam` | `useRoomConvertToTeam.tsx:14-44` |
| `implicit.editRoomInfo.save` | 保存房间设置 | Edit Room Info 改字段 → `Save` | 字段级：`edit-room`、`set-readonly`、`set-react-when-readonly`、`edit-room-retention-policy`、`archive-room`/`unarchive-room`、`create-c`/`create-p`（改类型）。`useEditRoomPermissions.ts:13-66`。Save `disabled={!isDirty}` | `[读]` ①toast `Room_updated_successfully`；回到 Info/关栏。②`POST /v1/rooms.saveRoomSettings`（归档另走 archive hook）。③刷新后字段仍在 | core+permission | `implicit.editRoomInfo.reset` | `EditRoomInfo.tsx:150-199,612-614` |
| `implicit.editRoomInfo.reset` | 把编辑表单打回默认值 | Edit 且已 dirty → `Reset` | `disabled={!isDirty \|\| isSubmitting}`。`EditRoomInfo.tsx:609` | `[读]` ①字段回 `defaultValues`；Save 再 disabled。②无 REST。③未保存则刷新仍是旧值 | core | `implicit.editRoomInfo.save` | `EditRoomInfo.tsx:609-610` |
| `implicit.editRoomInfo.back` | 从编辑返回 Info | Edit 顶栏 ContextualbarBack | 仅 `isEditing`。`RoomInfoRouter.tsx:26-27` | `[读]` ①Edit 表单消失，Info 再现。②无 REST。③local `isEditing=false` | core | `implicit.roomInfo.action.edit` | `RoomInfoRouter.tsx:26-27` |

**B1 计数**：表 10 行。`useRoomActions` items 最多 7 种动作 + kebab/save/reset/back。

### B2 Drafts

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `implicit.draft.persistLocal` | 输入时写入 localStorage 草稿 | 在房间（或线程）composer 打字 | 有 rid；key=`messagebox_{rid}[-{tmid}]`。`useDraft.ts:5,8-16,28-33` | `[读]` ①textarea 值变化。②无 REST。③刷新同标签页可从 localStorage 恢复（在 flush 清掉之前） | core | `implicit.draft.restore` | `useDraft.ts:4-33` |
| `implicit.draft.flushServer` | 卸载 composer 时把草稿同步到服务器 | 输入后切到另一房间 / 关掉线程（textarea ref 变 null） | `draft!==serverDraft`；若 `tmid && !threadExists` 则跳过。`useDraft.ts:44-54` | `[读]` ①本地 key 在成功后被 remove。②`POST /v1/rooms.saveDraft` `{rid,draft,tmid?}`。③他端/刷新从 subscription.draft 回来 | core | `implicit.draft.persistLocal` | `useDraft.ts:36-55`；`MessageBox.tsx:144-146` |
| `implicit.draft.restore` | 打开房间/线程时预填草稿 | 在 A 房间打字离开 → 再进 A（或带 tmid 的线程） | 优先 `subscription.draft` / `threadDrafts[tmid]`，否则 localStorage。`useDraft.ts:19`；`MessageBox.tsx:135-140` | `[读]` ①textarea 预填。②读订阅字段（无单独 GET）。③server draft 跨刷新仍在 | core | `thread.composer.reply` | `useDraft.ts:19-20` |

**B2 计数**：表 3 行。`ls` `useDraft.ts` + spec。

### B3 Drag-and-drop 上传

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `implicit.upload.dragEnterOverlay` | 拖入文件时盖一层 drop overlay | 从桌面拖文件进入 `.messages-container-main` | overlay 总在 dragenter 出现；文案看 enabled。`useDropTarget` + `RoomBody.tsx:173-174` | `[读]` ①`role=dialog` `data-qa=DropTargetOverlay` 文案 `Drop_to_upload_file`。②无 REST。③松手或离开即消失 | core | `implicit.upload.dropFiles` | `DropTargetOverlay.tsx:66-92` |
| `implicit.upload.dropFiles` | 放下文件开始上传 | overlay 可见且绿色 → drop | `FileUpload_Enabled`；未超 MAC；`post-readonly`/非只读；已订阅；非 editing。`useFileUploadDropTarget.ts:72-91` | `[读]` ①overlay 关；composer chips 出现。②`POST /v1/rooms.media/:rid`。③同 file-upload | core+setting+permission | `composer.action.file-upload` | `useFileUploadDropTarget.ts:47-68`；`DropTargetOverlay.tsx:35-59` |
| `implicit.upload.dragDisabledOverlay` | 无权限拖入时显示拒绝原因 | 只读/未订阅/编辑中/关上传 时 dragenter | `!FileUpload_Enabled \|\| MAC` → `FileUpload_Disabled`；否则 `error-not-allowed`。`useFileUploadDropTarget.ts:72-86` | `[读]` ①同 dialog，文字红色 danger。②无 upload。③松手无附件 | core+setting | `implicit.upload.dragEnterOverlay` | `useFileUploadDropTarget.ts:72-86` |

**B3 计数**：表 3 行。`ls` `DropTargetOverlay.tsx` + `useFileUploadDropTarget.ts` + `useDropTarget.ts`。

### B4 发送前附件预览

chip 的 remove/cancel/edit 已在 A4，这里只登记预览与进度。

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `implicit.upload.composerChipPreview` | 点 chip 打开发送前预览/改名 | 完成上传后的 chip → click | 非 loading 且无 error。`MessageComposerGenericFile.tsx:35-38` | `[读]` ①FileUpload modal 标题 FileUpload + 预览区。②无新 REST。③关 modal 不发消息 | core | `implicit.upload.modalConfirm` | `MessageComposerGenericFile.tsx:35-52` |
| `implicit.upload.modalConfirm` | 在预览里确认新文件名/alt | modal 改字段 → `Update` | `isDirty` 才可提交。`FileUploadModal.tsx:110-112` | `[读]` ①modal 关；chip `fileTitle` 变。②仍无 REST until send。③未发送刷新丢失 | core | `composer.upload.edit` | `FileUploadModal.tsx:39-117` |
| `implicit.upload.progressBanner` | 房间顶显示上传百分比 | 开始任一未完成 upload（选择/拖放/录音） | `isUploading`。`RoomBody.tsx:176` | `[读]` ①`role=status` Bubble `{n}% Uploading__count__file`。②伴随 media POST。③完成后消失，不刷新残留 | core | `composer.upload.cancel` | `UploadProgressIndicator.tsx:61-68` |

**B4 计数**：表 3 行。

### B5 Typing indicator

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `implicit.typing.start` | 自己输入时向房间广播 typing | 在非空 composer 按非 Enter/Esc/方向修饰键 | `onTyping` 且 `composer.text.trim()!==''`。`ComposerMessage.tsx:68-73`；`MessageBox.tsx:280` | `[读]` ①对方 `role=status` 出现 `is_typing`。②`sdk.publish notify-room {rid}/user-activity`。③约 15s 超时，不持久 | core | `implicit.typing.display` | `ComposerMessage.tsx:68-73` |
| `implicit.typing.stop` | 停止广播 typing | 清空输入 **或** 发送成功 | send 路径先 `action.stop('typing')`。`ComposerMessage.tsx:55,69-71` | `[读]` ①对方 status 该动作清空。②stop publish。③无残留 | core | `composer.send` | `ComposerMessage.tsx:54-56,69-71` |
| `implicit.typing.display` | 显示他人 typing/recording/uploading/playing | 被动：另一用户触发对应 UserAction | `UserAction.get(tmid\|\|rid)`。`ComposerUserActionIndicator.tsx:20-23` | `[读]` ①`.rc-message-box__activity-wrapper` `role=status` 拼接 `is_typing`/`are_recording` 等。②stream `notify-room`。③ephemeral | core | `implicit.recording.finish` | `ComposerUserActionIndicator.tsx:57-76` |

**B5 计数**：表 3 行。

### B6 Quote / preview bar

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `implicit.quote.barDisplay` | 在 composer 上方显示引用预览 | 用消息动作 Quote/Reply（toolbar OUT，只作前置）后看 composer | `quotedMessages.length>0`。`MessageBoxReplies.tsx:16-18` | `[读]` ①QuoteAttachment 块出现在 textarea 上。②无 REST until send。③仅 session；刷新掉（除非 URL `?reply=`） | core | `implicit.quote.dismissOne` | `MessageBoxReplies.tsx:16-26`；`MessageBox.tsx:427` |
| `implicit.quote.dismissOne` | 关掉单条引用 | 引用条右上 `aria-label=Dismiss_quoted_message` | 该 mid 仍在 quoted 列表。`MessageBoxReply.tsx:47-51` | `[读]` ①该引用块消失。②无 REST。③session only | core | `composer.send` | `MessageBoxReply.tsx:44-51` |
| `implicit.quote.fromUrl` | URL `?reply={mid}` 自动挂引用 | 导航到 `/channel/xxx?reply={mid}` | `useSearchParameter('reply')`。`useQuoteMessageByUrl.ts:7-27` | `[读]` ①quote bar 出现。②`GET /v1/chat.getMessage`（缓存未命中时，`data.ts:37-39`）。③带参刷新会再挂上 | core | `implicit.quote.barDisplay` | `useQuoteMessageByUrl.ts:15-27` |

**B6 计数**：表 3 行。

### B7 Thread 面板内部

`find` Threads **21** 文件。列表入口是 toolbox tab，**不登记「打开 Threads 工具」**；登记面板内操作。

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `thread.panel.openFromList` | 从线程列表打开某条线程面板 | Threads tab（toolbox）→ 点列表项 | 列表已加载。`ThreadList.tsx:114-118` | `[读]` ①`rcx-thread-view` contextualbar；路由带 tmid。②拉主消息 query。③刷新带 tmid 可重开 | core | `thread.panel.backToList` | `ThreadList.tsx:115-118` |
| `thread.panel.backToList` | 从线程面板回到列表 | 面板 header ContextualbarBack | 面板已开。`Thread.tsx:64-66,112` | `[读]` ①ThreadChat 关，ThreadList 再现。②无 REST。③replace 路由 | core | `thread.panel.close` | `Thread.tsx:64-66` |
| `thread.panel.close` | 关掉线程面板 | header Close **或** 展开态点 backdrop | 始终可关。`Thread.tsx:60-62,82-84` | `[读]` ①contextualbar 消失。②`closeTab()`。③刷新无 tmid 则不再开 | core | `thread.composer.escapeLeave` | `Thread.tsx:82-84` |
| `thread.panel.toggleExpand` | 展开/折叠线程面板 | header `Expand`/`Collapse` | `useLayoutContextualBarExpanded()`。`Thread.tsx:49,117-122` | `[读]` ①portal 到 `#main-content` + backdrop；title 在 Expand/Collapse 间切。②无 REST。③`localStorage expand-threads` | core | `thread.panel.close` | `Thread.tsx:68-70,86-88,117-122` |
| `thread.panel.toggleFollow` | 关注/取关该线程 | header bell / bell-off | 主消息已加载。`Thread.tsx:72-79,124-128` | `[读]` ①`title` 在 Following / Not_Following 间切。②`POST /v1/chat.followMessage` 或 `unfollowMessage`。③刷新后 replies 仍含自己 | core | `thread.list.filter` | `useToggleFollowingThreadMutation.ts:19-31` |
| `thread.composer.reply` | 在线程 composer 回复 | 面板底部 `aria-label=Thread_composer` 输入 → Send | `ChatProvider tmid`；其余同 `canSend`。`ThreadChat.tsx:113-123` | `[读]` ①线程列表新增 listitem。②`POST /v1/chat.sendMessage` 带 `tmid`（及可选 `tshow`）。③刷新仍在线程 | core | `composer.send`；`thread.composer.alsoSendToChannel` | `ThreadChat.tsx:113-137` |
| `thread.composer.alsoSendToChannel` | 勾选后回复同时出现在频道 | 勾/去勾 `Also_send_to_channel` → 再发送 | 偏好 `alsoSendThreadToChannel`：always/never/default（首帖默认 `!tcount`）。`ThreadChat.tsx:29-40,124-135` | `[读]` ①checkbox `name=alsoSendThreadToChannel`。②发送体带 `tshow`。③频道刷新可见该回复 | core+preference | `thread.composer.reply` | `ThreadChat.tsx:124-135` |
| `thread.composer.escapeLeave` | 空内容 Esc 离开线程面板 | 焦点在线程 composer 且 trim 空 → Escape | `onEscape` → `closeTab`。`ThreadChat.tsx:50-52,119`；`MessageBox.tsx:247` | `[读]` ①面板关闭。②无 REST。③同 close | core | `shortcut.composer.escape` | `ThreadChat.tsx:50-52` |
| `thread.readOnNewMessage` | 线程内新回复自动标已读 | 面板开着时他人发 tmid 回复 | `msg.tmid===mainMessage._id` 且非 edited。`ThreadChat.tsx:66-75` | `[读]` ①未读点消失（列表 Following/Unread）。②`POST /v1/chat.readThread` `{tmid}`。③刷新 tunread 已清 | core | `implicit.unread.markAllRead` | `ThreadChat.tsx:65-75` |
| `thread.list.filter` | 搜索/筛选线程列表 | Threads 列表顶：搜索框 和/或 All\|Following\|Unread | following/unread 需已订阅 + uid。`ThreadList.tsx:46-72,83-107` | `[读]` ①列表项减少；`ResultsLiveRegion` 更新。②threads 列表 query。③`localStorage thread-list-type` | core | `thread.panel.openFromList` | `ThreadList.tsx:46-72,129+` |

**B7 计数**：表 10 行。另：线程内 drop 复用 B3，不另占行（见 `ThreadChat.tsx:54,94`）。

### B8 Room header（非 toolbox）

**SKIP**：`RoomTitle` 点击 → `openTab('channel-settings'|'team-info'|…)`，toolbox 独占（`RoomTitle.tsx:17-34`）。主题只读 Markdown 无点击。E2E/翻译徽章只展示。

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `implicit.header.toggleFavorite` | 收藏/取消收藏房间 | 点 header star（`title=Favorite {name}` / `Unfavorite {name}`） | `Favorite_Rooms=true` 且 `room.t∈{c,p,d,t}` 且已订阅。`Favorite.tsx:16,29-31` | `[读]` ①icon `star`↔`star-filled`；toast 加入/移出收藏。②`POST /v1/rooms.favorite`。③刷新后星标仍在 | core+setting | — | `Favorite.tsx:16-39`；`useToggleFavoriteMutation.ts:14-19` |
| `implicit.header.addTopicLink` | 无主题时从 header 去加主题 | 点 header 链接 `Add_topic` | `canEdit && (public\|\|private)` 且无 topic。`RoomTopic.tsx:22-33` | `[读]` ①导航 `{route}/channel-settings` 或 `/team-info`（落地 toolbox 编辑）。②随后保存走 `rooms.saveRoomSettings`。③主题刷新后 header 变为 Markdown | core+permission | `implicit.editRoomInfo.save` | `RoomTopic.tsx:28-33` |
| `implicit.header.parentRoomBack` | 从讨论回到父房间 | 点 header 返回 `Back_to__roomName__channel` | 讨论有 prid。`ParentDiscussion.tsx:28-32` | `[读]` ①路由切到父房间。②房间订阅数据。③刷新停在父房间 | core | — | `ParentDiscussion.tsx:28-32` |

**B8 计数**：表 3 行；标题/只读 topic **SKIP**。

### B9 Unread jump bar

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `implicit.unread.jumpToFirst` | 跳到第一条未读 | 未读 Bubble（arrow-up，文案 `unread_messages_counter`）→ 点气泡本体 | `unread.count>0` 且已订阅。`RoomBody.tsx:177-182`；`useUnreadMessages.ts:61-78` | `[读]` ①bar 消失；列表滚到该消息；URL `?msg=` jumpToUnread。②`readStateManager.markAsRead()`（subscriptions 已读）。③刷新后未读计数按 server ls | core | `implicit.unread.markAllRead` | `UnreadMessagesIndicator.tsx:23-30` |
| `implicit.unread.markAllRead` | 把未读条关掉并标已读 | 未读 Bubble 的 dismiss（`aria-label=Mark_as_read`） | 同上 | `[读]` ①bar 消失，不跳转。②`markAsRead()`。③刷新无未读条 | core | `shortcut.global.markAllAsRead.documented-unbound` | `UnreadMessagesIndicator.tsx:25-27`；`useUnreadMessages.ts:80-83` |

**B9 计数**：表 2 行。

### B10 Keyboard shortcuts

帮助 modal 文档 9 条（`KeyboardShortcutsModal.tsx` `id:` **9**）。其中搜索属 navbar OUT；光标到行首/行尾是浏览器 textarea 原生，无 RC handler。本表只登记 **房间内已绑定** + **文档有但 client 无绑定的 mark-all**（可测「按了不发生」）。

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `shortcut.composer.send` | 按发送和弦发出消息 | 焦点 textarea → Enter（normal）或 Ctrl/Cmd/Alt/Shift+Enter（alternative） | 同 `composer.send.enter-behavior` | `[读]` ①同 `composer.send`。②同 send endpoint。③同 send | core+preference | `composer.send` | `MessageBox.tsx:221-233` |
| `shortcut.composer.newLine` | 插入换行而不发送 | normal：Shift+Enter；alternative：裸 Enter | 同左 | `[读]` ①textarea 多一行。②无 REST。③随草稿 | core+preference | `composer.send.enter-behavior` | `MessageBox.tsx:224-230` |
| `shortcut.composer.escape` | Esc 退出编辑或空内容回调 | 编辑中或空 textarea → Escape | `closeEditing` 若有 mid；空则 `onEscape`。`MessageBox.tsx:245-248` | `[读]` ①编辑 hint/Cancel 消失或线程面板关。②无 REST。③不持久 | core | `thread.composer.escapeLeave` | `MessageBox.tsx:245-248` |
| `shortcut.composer.prevMessage` | 光标在行首时 ↑ 编辑上一条自己的消息 | 光标 `selectionEnd===0` → ArrowUp | `canSend`；存在可编辑历史 | `[读]` ①textarea 填入上条；hint Editing_message；Cancel 出现。②无 REST（本地消息缓存）。③刷新不保持编辑 | core | `composer.edit.cancel` | `MessageBox.tsx:251-260` |
| `shortcut.composer.nextMessage` | 光标在文末时 ↓ 下一条可编辑 | `selectionEnd===length` → ArrowDown | 正在编辑链中 | `[读]` ①内容切到下一条或退出编辑。②无 REST。③不持久 | core | `shortcut.composer.prevMessage` | `MessageBox.tsx:266-276` |
| `shortcut.composer.formatBold` | Ctrl/Cmd+B 加粗 | 选区或光标处 → Ctrl+B（Win）/ Cmd+B（Mac） | `handleFormattingShortcut` 找到 `command==='b'`。`MessageBox.tsx:59-76` | `[读]` ①包 `*…*`。②无 REST。③随草稿 | core | `composer.format.bold` | `messageBoxFormatting.ts:39` |
| `shortcut.composer.formatItalic` | Ctrl/Cmd+I 斜体 | Ctrl/Cmd+I | `command==='i'` | `[读]` ①包 `_…_`。②无 REST。③随草稿 | core | `composer.format.italic` | `messageBoxFormatting.ts:45` |
| `shortcut.composer.focusOnType` | 在非输入控件敲可打印键时拉回 composer | 点消息列表空白 → 敲字母/退格（非 Ctrl/Cmd） | 非 touch 才 autofocus 挂载；目标不能是 input/textarea/select。`useMessageBoxAutoFocus.ts:13-36` | `[读]` ①`textarea[name=msg]` 获焦并吃到该键。②无 REST。③无 | core | `composer.send` | `useMessageBoxAutoFocus.ts:13-36` |
| `shortcut.popup.navigateUp` | 补全弹层上移焦点 | popup 打开 → ArrowUp（无修饰键） | `useComposerBoxPopup` 有 option。`useComposerBoxPopup.ts:192-209` | `[读]` ①`aria-selected` 移到上一项，`aria-activedescendant=popup-item-*`。②无新 REST。③关 popup 即无 | core | `composer.popup.mention` | `useComposerBoxPopup.ts:192-209` |
| `shortcut.popup.navigateDown` | 补全弹层下移焦点 | ArrowDown | 同上 `:211-228` | `[读]` ①焦点下移循环。②无 REST。③无 | core | `shortcut.popup.navigateUp` | `useComposerBoxPopup.ts:211-228` |
| `shortcut.popup.select` | Enter/Tab 选中当前补全项 | popup 有 focused → Enter 或 Tab | `focused` 存在。`:181-190` | `[读]` ①popup 关；textarea 插入值。②mention/channel 可能已 spotlight。③随草稿 | core | `composer.popup.slash-command` | `useComposerBoxPopup.ts:181-190` |
| `shortcut.popup.dismiss` | Esc 关掉补全弹层 | popup 开 → Escape（默认 `closeOnEsc:true`） | `ComposerPopupContext.ts:37`；`:164-170` | `[读]` ①`role=menu` 消失；Esc 不冒泡到编辑取消。②无 REST。③无 | core | `shortcut.composer.escape` | `useComposerBoxPopup.ts:164-170` |
| `shortcut.messageList.tabToHeader` | 消息 listitem 上 Shift+Tab 回 header | 焦点在 `role=listitem` → Shift+Tab | `useMessageListNavigation.ts:40-47` | `[读]` ①焦点到 `.rcx-room-header` 第一可聚焦。②无 REST。③无 | core | `implicit.header.toggleFavorite` | `useMessageListNavigation.ts:40-47` |
| `shortcut.messageList.tabToComposer` | 线程/系统消息上 Tab 到 textarea | 焦点在 `.rcx-message-thread` 或 `.rcx-message-system` → Tab | `:48-55` | `[读]` ①焦点到 `TEXTAREA`。②无 REST。③无 | core | `thread.composer.reply` | `useMessageListNavigation.ts:48-55` |
| `shortcut.messageList.arrowNavigate` | 消息之间上下键移动焦点 | 焦点 listitem → ArrowUp/ArrowDown | `:58-67` | `[读]` ①相邻 `role=listitem` 获焦。②无 REST。③无 | core | `implicit.select.toggleMessage` | `useMessageListNavigation.ts:58-67` |
| `shortcut.history.loadMore` | 滚到顶/底或 PageUp 等加载更多历史 | 在消息滚动容器滚到顶 1/3 或底；或 PageUp/Down/Home/End 后触发 | `RoomHistoryManager.hasMore` / `hasMoreNext`。`useGetMore.ts:49-65,88-98` | `[读]` ①列表变长；可能短暂 loading。②历史订阅/load more。③刷新仍要重新拉 | core | `implicit.scroll.loadPrevious` | `useGetMore.ts:24-65` |
| `shortcut.global.showShortcutsModal` | Shift+? 打开快捷键说明 | 焦点不在 input/textarea/select/open dialog → `Shift+?` | `useKeyboardShortcutsHotkey.tsx:7-21,39-40` | `[读]` ①GenericModal `title=Keyboard_Shortcuts_Title` `dl[aria-label=…]`。②无 REST。③关后不持久 | core | `shortcut.global.markAllAsRead.documented-unbound` | `useKeyboardShortcutsHotkey.tsx:24-42`；`KeyboardShortcutsModal.tsx:94` |
| `shortcut.global.markAllAsRead.documented-unbound` | 帮助里写了标全已读，client 无绑定 | 打开快捷键 modal 看到 Mark_all_as_read → 关掉 → 在房间按 Shift+Esc（Mac）或 Ctrl+Esc（其他） | **无** `tinykeys`/keydown 绑定（全 `client` 仅 modal 文案）。`KeyboardShortcutsModal.tsx:32-34` | `[读]` ①modal 列出该和弦；按键后未读条**不**因此消失。②无 mark-all endpoint 被该键触发。③要用 B9 dismiss。`[待渲染实测]` 确认无遗漏全局 listener | core（文档） | `implicit.unread.markAllRead` | `KeyboardShortcutsModal.tsx:32-34` |

**B10 计数**：表 18 行。帮助 modal 9 条 − 1 navbar 搜索 − 4 条原生光标移动 + 房间内额外绑定（popup/list/history/format/focus 等）。

### B11 Selection / 多选

进入点是 toolbox `ExportMessages` 调 `setIsSelecting(true)`（入口 OUT）。进入后的房间内操作在此。

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `implicit.select.composerReplace` | 选择模式用计数条替换输入框 | Export Messages（toolbox）打开 → 看房间底部 | `useIsSelecting()`。`ComposerContainer.tsx:75-76` | `[读]` ①`MessageFooterCallout` `__count__messages_selected`；textarea 不出现。②无 REST。③关掉 export/清选择后恢复 | core | `implicit.select.clear` | `ComposerContainer.tsx:75-77`；`ComposerSelectMessages.tsx:15-28` |
| `implicit.select.toggleMessage` | 勾选/取消单条消息 | 选择模式下点消息、点 checkbox，或焦点 listitem 按 Space/Enter | `selecting===true`。`RoomMessage.tsx:82-98,109,136` | `[读]` ①checkbox `aria-label` 来自 `getCheckboxLabel`；`isSelected`。②无 REST。③store 仅内存，刷新清空 | core | `implicit.select.selectAll` | `RoomMessage.tsx:82-136` |
| `implicit.select.clear` | 清除全部选择 | 底栏 `Clear_selection` | `countSelected>0` 才可点。`ComposerSelectMessages.tsx:21-22` | `[读]` ①计数归 0；所有 checkbox 未勾。②无 REST。③无 | core | `implicit.select.composerReplace` | `SelectedMessagesContext.tsx:71-75` |
| `implicit.select.selectAll` | 全选当前已加载并滚到顶 | 底栏 `Select__count__messages` | `countAvailable>0`。`ComposerSelectMessages.tsx:24-25` | `[读]` ①计数=available；列表 `scrollTo({top:0})`。②无 REST。③仅已 mount 的 availableMessages | core | `implicit.select.toggleMessage` | `useSelectAllAndScrollToTop.ts:9-11` |

**B11 计数**：表 4 行。

### B12 额外隐式（房间视图、非注册表）

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `implicit.scroll.newMessagesButton` | 不在底部时跳到新消息 | 他人发来新消息且自己未贴底 → 点底部 Bubble `New_messages` | `hasNewMessages && !atBottom`。`useHasNewMessages.ts:25-28,60-62`；`RoomBody.tsx:187` | `[读]` ①Bubble 消失；列表贴底；composer focus。②无 REST。③状态不持久 | core | `implicit.scroll.jumpToRecent` | `JumpToRecentMessageButton.tsx:41-55` |
| `implicit.scroll.jumpToRecent` | 正在看历史时跳回最新 | 有 `hasMoreNext`（从中间消息跳入）→ 点 `Jump_to_recent_messages` | `RoomHistoryManager.hasMoreNext`。`RoomBody.tsx:188-191` | `[读]` ①Bubble 淡出；历史缓存 clear 后贴底。②`getMoreIfIsEmpty`。③最新页刷新可见 | core | `shortcut.history.loadMore` | `useHasNewMessages.ts:31-35` |
| `implicit.scroll.loadPrevious` | 向上滚加载更早历史 | 用滚轮/触控把列表滚到顶部三分之一 | `hasMorePreviousMessages`。`useGetMore.ts:49-50` | `[读]` ①更早 listitem 出现。②RoomHistoryManager.getMore。③刷新重拉 | core | `shortcut.history.loadMore` | `useGetMore.ts:49-62` |
| `implicit.banner.announcementOpen` | 打开房间公告全文 | 点 header 下 AnnouncementBanner（或 Enter/Space）；点链接则跟链接 | `room.announcement` 且非 embedded。`RoomBody.tsx:164`；`RoomAnnouncement.tsx:34-59` | `[读]` ①GenericModal `title=Announcement` `Close`。②无 REST。③关后 banner 仍在（房间字段） | core | `implicit.editRoomInfo.save` | `RoomAnnouncement.tsx:18-60` |
| `implicit.banner.retentionWarning` | 展示保留策略将删消息的警告 | 打开启用 retention 的房间，看消息列表上方 | `retentionPolicy.isActive`。`RetentionPolicyWarning.tsx:15-20` | `[读]` ①`role=alert` `aria-label=Retention_policy_warning_banner`。②无 REST。③刷新仍在直到策略关 | core+setting | `implicit.editRoomInfo.save` | `RetentionPolicyWarning.tsx:15-20` |
| `implicit.recording.cancel` | 取消正在进行的语音录制 | 录音条 → title=`Cancel_recording`（circle-cross） | `isRecordingAudio`。`AudioMessageRecorder.tsx:77-79,118` | `[读]` ①`role=group` Audio_recorder 消失；textarea 恢复。②无 upload。③无文件 | core | `composer.action.audio-message` | `AudioMessageRecorder.tsx:77-79,116-118` |
| `implicit.recording.finish` | 完成录音并进入附件队列 | 录音条 → title=`Finish_recording`（circle-check） | 正在 recording 态。`AudioMessageRecorder.tsx:83-91,125` | `[读]` ①录音条关；出现 `Audio_record.mp3` chip。②`POST /v1/rooms.media/:rid`。③随发送 persist | core | `composer.action.audio-message` | `AudioMessageRecorder.tsx:83-91` |
| `implicit.composer.hint.editing` | 编辑态显示铅笔提示 | ↑ 进入编辑 | `isEditing`。`MessageBoxHint.tsx:36-37,49-54` | `[读]` ①hint 文案 `Editing_message` + 桌面 `Editing_message_hint`。②无 REST。③取消/发送后消失 | core | `composer.edit.cancel` | `MessageBoxHint.tsx:31-54` |
| `implicit.composer.hint.e2eeUnencrypted` | E2EE 房间密钥未就绪时提示将发明文 | 打开加密房间，E2E 允许明文，且 e2e 状态不是 READY/DISABLED | `E2E_Enable && E2E_Allow_Unencrypted_Messages && state∉{READY,DISABLED} && !editing && !ro`。`MessageBoxHint.tsx:22-29,42-43` | `[读]` ①hint `E2EE_Composer_Unencrypted_Message`。②无 REST。③密钥就绪后刷新消失 | core+setting | `composer.send` | `MessageBoxHint.tsx:22-43` |
| `implicit.layout.closeFlexTabOnClick` | 点消息区关闭侧栏 | 偏好 hideFlexTab 打开 → 开任意 toolbox 侧栏 → 点消息容器空白（非 button/link） | `useUserPreference('hideFlexTab')`。`RoomBody.tsx:59,126-154,170` | `[读]` ①contextualbar 关。②无 REST。③偏好刷新仍在；侧栏默认关 | core+preference | `thread.panel.close` | `RoomBody.tsx:59,126-154` |

**B12 计数**：表 10 行。日期分隔线 / BubbleDate **不可点**，不登记。composer 图片 lightbox 依赖全局 `ImageGalleryProvider` 是否吃到 chip 的 `preview-image` class → 见待渲染实测，**不单列**以免空断言。

---

## 验算

- A1 6 + A2 8 + A3 6 + A4 15 + A5 10 = **45**
- B1 10 + B2 3 + B3 3 + B4 3 + B5 3 + B6 3 + B7 10 + B8 3 + B9 2 + B10 18 + B11 4 + B12 10 = **72**

各节表行数 = 上式加数；未把 45 与 72 收成册级总行（按「不分册总计」）。

---

## [待渲染实测] 汇总

1. `composer.format.overflow-dropdown` / `composer.action.more-menu` / `implicit.roomInfo.kebab.open`：Fuselage `GenericMenu` 最终 `role`+accessible name。
2. `composer.emoji.picker`：EmojiPicker 完整 tablist/tab/tabpanel 树（源码有 dialog，细节要渲染）。
3. `composer.action.apps`：运行时 app 按钮可见 label。
4. `composer.action.create-discussion`：CreateDiscussion 表单控件 name。
5. `composer.action.share-location`：权限 prompt → 地图 → Share 的逐步 role。
6. `composer.action.timestamp`：TimestampPicker 各 spinbutton/select 的 name。
7. `composer.action.webdav-add` / `composer.action.webdav-upload`：两个 WebDAV modal 的 dialog name。
8. `implicit.quote.barDisplay`：多条 quote 堆叠时的 list 结构。
9. `thread.panel.toggleExpand`：portal 到 `#main-content` 后的焦点与 backdrop 点击热区。
10. `implicit.select.toggleMessage`：进入选择模式后第一个 checkbox 是否自动获焦。
11. `implicit.scroll.newMessagesButton` / `implicit.scroll.jumpToRecent`：Bubble 在 Fuselage 下的精确 accessible name。
12. `shortcut.global.markAllAsRead.documented-unbound`：实机确认 Shift+Esc / Ctrl+Esc **没有**其它全局 listener 误绑。
13. `implicit.typing.display`：≥5 人同时 typing 的 `and others` 文案拼接。
14. `implicit.draft.flushServer`：跨设备（仅 server draft、无 localStorage）的恢复时序。
15. composer 图片 chip 是否带 `preview-image` 从而打开 ImageGallery（源码 chip 走 FileUploadModal，**不像**消息附件 lightbox）。
16. `composer.variant.federation.*` callout 在 ui-composer 里的 role（看起来是 div，不是 dialog）。
17. `implicit.banner.announcementOpen`：AnnouncementBanner 自身 role（点击/键盘已读到）。
18. `VideoMessageRecorder` 摄像机权限被拒时 toast vs 浮层谁先消失。
19. `implicit.upload.dragEnterOverlay` 真实 DnD 的 `dropEffect` 与 z-index 是否挡住侧栏。
20. `composer.format.link` GenericModal `variant=warning` 的 dialog name 是否等于 `Add_link`。

---

## 计数证据

命令均在仓库根 `/workspace`、分支 `develop` 工作树上执行。

```
find apps/meteor/client/views/room/composer -type f \( -name '*.ts' -o -name '*.tsx' \) | wc -l
# 73

ls apps/meteor/client/views/room/composer/messageBox/MessageBoxActionsToolbar/hooks/ | wc -l
# 7

ls apps/meteor/client/views/room/composer/ComposerBoxPopup*.tsx | wc -l
# 7

rg -c "label:" apps/meteor/app/ui-message/client/messageBox/messageBoxFormatting.ts
# 8   # 类型 1 + 按钮 7

rg "slashCommands.add" --glob '*.{ts,tsx,js}' apps/meteor | wc -l
# 53

find apps/meteor/client/views/room/contextualBar/Threads -type f \( -name '*.ts' -o -name '*.tsx' \) | wc -l
# 21

find apps/meteor/client/views/room/Header -type f \( -name '*.ts' -o -name '*.tsx' \) | wc -l
# 42

find apps/meteor/client/views/room/body -type f \( -name '*.ts' -o -name '*.tsx' \) | wc -l
# 31

find apps/meteor/client/views/room/contextualBar/Info -type f \( -name '*.ts' -o -name '*.tsx' \) | wc -l
# 26

rg "id: '" apps/meteor/client/navbar/NavBarSettingsToolbar/UserMenu/KeyboardShortcutsModal.tsx | wc -l
# 9

rg "messageBox\.actions.add" --glob '*.{ts,tsx,js}' . | wc -l
# 0

find docs -name '*atlas*' -o -name '0*-composer*'
# （本文件写入前为空；docs/qa/pm-feature-atlas 目录仅本分册）
```

---

## 本分册 id 列表

**A1** `composer.send` `composer.send.enter-behavior` `composer.edit.cancel` `composer.join` `composer.keyboard.auto-wrap` `composer.slash.execute`

**A2** `composer.format.bold` `composer.format.italic` `composer.format.strikethrough` `composer.format.inline-code` `composer.format.multiline-code` `composer.format.link` `composer.format.katex` `composer.format.overflow-dropdown`

**A3** `composer.popup.mention` `composer.popup.channel` `composer.popup.emoji-colon` `composer.popup.emoji-plus` `composer.popup.slash-command` `composer.popup.slash-preview`

**A4** `composer.emoji.picker` `composer.action.audio-message` `composer.action.video-message` `composer.action.file-upload` `composer.paste.image` `composer.action.create-discussion` `composer.action.share-location` `composer.action.timestamp` `composer.action.webdav-add` `composer.action.webdav-upload` `composer.action.more-menu` `composer.action.apps` `composer.upload.remove` `composer.upload.cancel` `composer.upload.edit`

**A5** `composer.variant.air-gapped` `composer.variant.anonymous.sign-in` `composer.variant.anonymous.join` `composer.variant.read-only` `composer.variant.archived` `composer.variant.join-password` `composer.variant.blocked` `composer.variant.federation.invalid-version` `composer.variant.federation.disabled` `composer.variant.federation.premium`

**B1** `implicit.roomInfo.kebab.open` `implicit.roomInfo.action.edit` `implicit.roomInfo.action.hide` `implicit.roomInfo.action.leave` `implicit.roomInfo.action.delete` `implicit.roomInfo.action.moveToTeam` `implicit.roomInfo.action.convertToTeam` `implicit.editRoomInfo.save` `implicit.editRoomInfo.reset` `implicit.editRoomInfo.back`

**B2** `implicit.draft.persistLocal` `implicit.draft.flushServer` `implicit.draft.restore`

**B3** `implicit.upload.dragEnterOverlay` `implicit.upload.dropFiles` `implicit.upload.dragDisabledOverlay`

**B4** `implicit.upload.composerChipPreview` `implicit.upload.modalConfirm` `implicit.upload.progressBanner`

**B5** `implicit.typing.start` `implicit.typing.stop` `implicit.typing.display`

**B6** `implicit.quote.barDisplay` `implicit.quote.dismissOne` `implicit.quote.fromUrl`

**B7** `thread.panel.openFromList` `thread.panel.backToList` `thread.panel.close` `thread.panel.toggleExpand` `thread.panel.toggleFollow` `thread.composer.reply` `thread.composer.alsoSendToChannel` `thread.composer.escapeLeave` `thread.readOnNewMessage` `thread.list.filter`

**B8** `implicit.header.toggleFavorite` `implicit.header.addTopicLink` `implicit.header.parentRoomBack`

**B9** `implicit.unread.jumpToFirst` `implicit.unread.markAllRead`

**B10** `shortcut.composer.send` `shortcut.composer.newLine` `shortcut.composer.escape` `shortcut.composer.prevMessage` `shortcut.composer.nextMessage` `shortcut.composer.formatBold` `shortcut.composer.formatItalic` `shortcut.composer.focusOnType` `shortcut.popup.navigateUp` `shortcut.popup.navigateDown` `shortcut.popup.select` `shortcut.popup.dismiss` `shortcut.messageList.tabToHeader` `shortcut.messageList.tabToComposer` `shortcut.messageList.arrowNavigate` `shortcut.history.loadMore` `shortcut.global.showShortcutsModal` `shortcut.global.markAllAsRead.documented-unbound`

**B11** `implicit.select.composerReplace` `implicit.select.toggleMessage` `implicit.select.clear` `implicit.select.selectAll`

**B12** `implicit.scroll.newMessagesButton` `implicit.scroll.jumpToRecent` `implicit.scroll.loadPrevious` `implicit.banner.announcementOpen` `implicit.banner.retentionWarning` `implicit.recording.cancel` `implicit.recording.finish` `implicit.composer.hint.editing` `implicit.composer.hint.e2eeUnencrypted` `implicit.layout.closeFlexTabOnClick`

---

## 边界

- **OUT**：message toolbar `*Items` 行、`roomActionHooks` / RoomToolbox 目录、user card、sidebar/navbar 目录、admin 字段、omnichannel、marketplace。
- **Omnichannel 已看见但不登记**：`ComposerContainer` 优先走 `ComposerOmnichannel`（`ComposerContainer.tsx:47-48`）；popup `!` canned（`Canned_Responses_Enable && isOmnichannelRoom`，`ComposerPopupProvider.tsx:364-392`）；header Omnichannel QuickActions。
- **Toolbox 独占 → SKIP 不重复**：`RoomTitle` 点击开 Info（`RoomTitle.tsx:17-34`）；Keyboard Shortcuts **侧栏**（若存在 toolbox 项）；Export Messages **打开**选择模式的入口（进入后的 checkbox 在 B11）。
- **Header「Add topic」**：控件在 header，落地 `/channel-settings` toolbox 路由；登记为 `implicit.header.addTopicLink`，不登记标题点击。
- **只展示、无用户动作**：日期分隔线 / `BubbleDate`、E2E/翻译徽章、只读 topic Markdown、composer 空 `role=status` 占位。
- **帮助 modal 有、房间无绑定**：`openSearch`（navbar OUT）；`moveToBeginning/End` 四条（浏览器 textarea 原生，无 RC handler）；`markAllAsRead` 已用 `shortcut.global.markAllAsRead.documented-unbound` 登记为负向断言。
- **legacy 空扩展点**：`messageBox.actions.add` 全仓库 **0** 调用；toolbar 仍 `messageBox.actions.get()`（`MessageBoxActionsToolbar.tsx:109`）。
- **线程 drop**：`ThreadChat.tsx:54,94` 复用 B3，不另占 id。
- **ImageGallery from composer chip**：chip 打开的是 `FileUploadModal` 而非消息 lightbox；不单列以免空断言。

---

## 与现行 atlas

- 检索：`find docs -name '*atlas*'`、`rg -l "稳定语义 id" --glob '*.md'`、`ls docs/qa/pm-feature-atlas`。
- 结果：写入前 **baseline empty**（无 01/02 分册、无既有 id）。
- 本分册全部 id 均为 **new**。出处即各行「出处」列与上节文件树。
- 若后续 01（toolbar Items）/ 02（roomActionHooks）落地，交叉点只应是文字互指，不应复制：Quote/Reply **进入** quote bar 的消息工具、Threads **tab 打开**、Export Messages **进入**选择模式、Room Title **打开** Info。
