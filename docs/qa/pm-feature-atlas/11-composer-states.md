# 11 — Composer 状态机（把 03 入口行炸开）

- 仓库：`https://github.com/jianwyao01/Rocket.Chat`（fork of RocketChat/Rocket.Chat）
- 调查分支：`develop` @ `e10bd504b9`；本分册从 `cursor/pm-atlas-merge-blueprint-d43d` 分出
- **不改产品代码。** 不重写 03 的入口-only 行（`composer.send` `composer.join` `composer.action.*` `composer.format.*` `composer.popup.mention` 等）。这里每一行是用户**能进到的状态**，门控或后果不同才拆行。
- 诚实标记：`[读]` = 源码/i18n 可复述；`[待渲染实测]` = 必须在真实 RC 渲染后才能钉死 role+name / 时序
- 列约定：`触发后果三件套` = ①JSX role+name 出现/消失；②endpoint/method；③刷新是否还在
- 本分册命名空间：`composer.state.*` / `composer.fmt.*` / `composer.popup.*`
- **关联**写 03 父 id（`composer.action.file-upload` 等）。Omni canned / 坐席 extras 关联 **08**（本仓库尚无 08 文件）；仍列出**房间 composer 上看得见**的状态。
- 03 已登记、本册不复述为入口：`composer.send` `composer.send.enter-behavior` `composer.edit.cancel` `composer.join` `composer.keyboard.auto-wrap` `composer.slash.execute` `composer.format.*` `composer.popup.*`（六套）`composer.emoji.picker` `composer.action.*` `composer.upload.*` `composer.variant.*` `implicit.draft.*` `implicit.upload.*` `implicit.typing.*` `implicit.quote.*` `implicit.recording.*` `thread.composer.*`

---

## A. Send：启用 / 禁用原因 / Enter vs 点击 / 编辑保存 vs 新发

`MessageBox.tsx:517` 发送钮：

```
disabled={!canSend || isUploading || isProcessingUploads || (!typing && !isEditing && !hasUploads)}
```

`canSend`：`roomCoordinator.canSendMessage`（默认有订阅）且联邦须原生 + `federationMatrixEnabled`（`MessageBox.tsx:314-332`）。录音**不**进入该表达式：录音禁 textarea/工具栏，不单独禁 Send。

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `composer.state.send.disabled.empty` | 空输入且无附件且非编辑时 Send 不可点 | 打开已订阅房间 → 不打字、不传文件 | `!typing && !isEditing && !hasUploads`；`canSend` | `[读]` ①`MessageComposerAction` `aria-label=Send` `disabled`；无 `secondary`/`info`。②无 REST。③空态不 persist | core | `composer.send` | `MessageBox.tsx:121,517-520` |
| `composer.state.send.disabled.uploading` | 附件仍在 XHR 时 Send 不可点且点击空操作 | 选文件后、chip 仍 `aria-busy` → 点 Send | `isUploading` = 存在 `!url && !error` 的 upload | `[读]` ①Send `disabled`；chip `aria-busy=true` `aria-label=文件名`。②`handleSendMessage` 早退，无 `chat.sendMessage`。③队列仅 session | core | `composer.action.file-upload` | `MessageBox.tsx:182-185,517`；`useFileUpload.ts:36` |
| `composer.state.send.disabled.processing` | mediaConfirm 循环中 textarea 与 Send 都禁 | 有已完成 chip → Send → 确认处理中 | `isProcessingUploads` | `[读]` ①`textarea[name=msg]` `disabled`；Send `disabled`；chip 组 `disabled`。②`POST /v1/rooms.mediaConfirm/:rid/:fileId`。③处理完 chip 清；消息 persist | core | `composer.send` | `MessageBox.tsx:470,517`；`processMessageUploads.ts:149-151` |
| `composer.state.send.disabled.recording` | 录音中 textarea/格式/emoji 禁；Send **不**因录音单独禁 | 点 `data-qa-id=audio-message`（或 video）进入录音 | `isRecording = isRecordingAudio \|\| isRecordingVideo`。Send 仍只看 empty/upload 公式 | `[读]` ①`textarea` `disabled`；emoji/format `disabled`；`role=group` `aria-label=Audio_recorder` 或 `role=dialog` `aria-label=Video_record`。②无 send REST。③录音态不 persist。`[待渲染实测]` 若录音前已有字，Send 是否仍可点 | core+setting | `composer.action.audio-message` | `MessageBox.tsx:305,470,482-493,517` |
| `composer.state.send.disabled.read-only` | 只读房间无 textarea，不能发 | 打开 `roomCoordinator.readOnly` 为真的房间（muted / `room.ro` 且无 `post-readonly`） | 容器先于 MessageBox：`useMessageComposerIsReadOnly` | `[读]` ①`MessageFooterCallout` 文案 `room_is_read_only`；无 `aria-label=Send`。②无 send。③只读属性刷新仍在 | core+permission | `composer.variant.read-only` | `ComposerContainer.tsx:59-60`；`ComposerReadOnly.tsx:26-32` |
| `composer.state.send.disabled.blocked` | 被屏蔽的 DM 无输入 | 打开 DM 且 `subscription.blocked \|\| blocker` | 仅 DM + 有订阅 | `[读]` ①callout `room_is_blocked`；无 Send。②无 REST。③屏蔽关系刷新仍在 | core | `composer.variant.blocked` | `ComposerContainer.tsx:71-72`；`ComposerBlocked.tsx:4-6` |
| `composer.state.send.e2ee.hint` | 加密房密钥未就绪但允许明文：可发，有 hint | 加密房间 + `E2E_Enable` + `E2E_Allow_Unencrypted_Messages` + e2e 状态 ∉ {READY, DISABLED} + 非编辑 + 非 `room.ro` → 输入 → Send | hint 条件 `MessageBoxHint.tsx:22-29`。**Send 表达式不含 e2e** | `[读]` ①hint `E2EE_Composer_Unencrypted_Message`；Send 可点。②`POST /v1/chat.sendMessage` 明文（`shouldConvertSentMessages` 在 !READY 时 false）。③密钥就绪后 hint 消失 | core+setting | `implicit.composer.hint.e2eeUnencrypted` | `MessageBoxHint.tsx:22-43`；`rocketchat.e2e.room.ts:176-191` |
| `composer.state.send.e2ee.server-reject` | 不允许明文时 UI 仍像可发，服务端拒 | 加密房间 + `E2E_Enable` + `!E2E_Allow_Unencrypted_Messages` + 状态非 READY → 输入 → Send | UI 无 e2e disable。服务端 `message.t !== 'e2e'` 抛 `error-not-allowed` | `[读]` ①无 hint；Send 可点；失败 toast。②`POST /v1/chat.sendMessage` 被拒。③消息不 persist | core+setting | `composer.send` | `MessageBox.tsx:517`；`server/.../sendMessage.ts:100-105` |
| `composer.state.send.click` | 点发送钮发出（不受 Enter 偏好） | 非空或有附件或编辑中 → 点 `aria-label=Send` | 同 Send 启用公式；无修饰键检查 | `[读]` ①消息 `role=listitem` 出现；textarea 被 `clear()`。②新发 `POST /v1/chat.sendMessage`；编辑见 A13。③刷新后消息仍在 | core | `composer.send` | `MessageBox.tsx:182-196,514-521` |
| `composer.state.send.enter` | Enter（或 alternative 下修饰+Enter）走同一 send | Preferences `sendOnEnter`=`normal`/`desktop`(桌面) → 焦点 textarea → Enter；或 `alternative`/mobile+desktop → Ctrl/Cmd/Alt/Shift+Enter | `sendOnEnter` 计算 `MessageBox.tsx:124-125`；`isSending` `221-228` | `[读]` ①同 click。②同 `composer.send`。③同 send。偏好在用户设置 persist | core+preference | `composer.send.enter-behavior` | `MessageBox.tsx:124-125,221-233` |
| `composer.state.send.enter.newline` | 和弦不发送时插入换行 | `normal`：Shift+Enter；`alternative`：裸 Enter | 与 A10 互补 | `[读]` ①textarea 多一行 `\n`。②无 REST。③随草稿 | core+preference | `shortcut.composer.newLine` | `MessageBox.tsx:226-230` |
| `composer.state.send.new` | 非编辑发出新消息 | 无 editing mid → Send/Enter | `!chat.currentEditingMessage.getMID()`；`text \|\| hasFiles` | `[读]` ①listitem 新增。②`POST /v1/chat.sendMessage`；带附件先 media 再 confirm。③server persist | core | `composer.send` | `sendMessage.ts:48-51,87-120` |
| `composer.state.send.edit.save` | 编辑态发送走 update 不是 sendMessage | ↑ 或 More→Edit 载入 → 改字 → Send | `mid` 存在且 `text` 非空（或有文件） | `[读]` ①`variant=editing` 与 `Cancel`、hint `Editing_message` 消失；原 listitem 正文变。②`POST /v1/chat.update` `{msgId,roomId,text}`。③刷新后仍是新正文 + edited | core | `composer.send`；`msg.edit` | `sendMessage.ts:44-46`；`processMessageEditing.ts:12-27`；`data.ts:176-192` |
| `composer.state.send.edit.empty-delete` | 编辑中清空再发送走删除而不是 update | 进入编辑 → 清空 textarea → Send | `mid` 且 `!text && !hasFiles` | `[读]` ①该 listitem 消失；编辑态结束。②`requestMessageDeletion` → `POST /v1/chat.delete`。③刷新后消息不在 | core | `composer.edit.cancel` | `sendMessage.ts:128-144` |

**A 计数**：14。

---

## B. Join / preview-join / code-join

03 `composer.join` 只写 MessageBox 上的 Join。这里按**替换了 MessageBox 还是 MessageBox 内 Join**拆。

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `composer.state.join.preview` | 未订阅预览房：composer 在，Send 换成 Join | 打开公开且无订阅的房间（非只读、无 joinCode）→ 点 `Join` | `!canSend`（无订阅）；容器未抢走 MessageBox | `[读]` ①`MessageComposerButton` 文案 `Join` `loading` 后消失，Send 出现，textarea 解禁。②`POST /v1/rooms.join` `{roomId}`（`data.ts:276-278`）。③刷新后已是订阅者 | core | `composer.join` | `MessageBox.tsx:506-509`；`ComposerMessage.tsx:34-40` |
| `composer.state.join.readonly` | 只读且未订阅：callout + Join，无 textarea | 只读房且 `!isSubscribed` → 点 `Join` | 容器 `isReadOnly` 先于 preview-join | `[读]` ①`room_is_read_only` + `Button` `Join`；加入后仍可能只读（无 textarea）。②`POST /v1/rooms.join` `{roomId}`。③订阅 persist；只读仍在则仍无输入 | core+permission | `composer.variant.read-only` | `ComposerReadOnly.tsx:12-32` |
| `composer.state.join.password` | 需要加入码的预览：密码框 + Join_with_password | 无订阅 + `joinCodeRequired` + 无 `join-without-join-code` → 填密码 → `Join_with_password` | `mustJoinWithCode`；提交 `disabled={!isDirty}` | `[读]` ①`form` `aria-label=Join_with_password`；`PasswordInput`；成功后变正常 composer。②`POST /v1/rooms.join` `{roomId,joinCode}`。③刷新后已订阅 | core+permission | `composer.variant.join-password` | `ComposerContainer.tsx:27-28,67-68`；`ComposerJoinWithPassword.tsx:21-47` |
| `composer.state.join.omni` | 全渠道已开房间、自己未订阅且非当前坐席：Join | live 房间 `open` 且非 hold/inquiry/MAC → `room_is_read_only` + `Join` | `!isSubscribed && !isSameAgent`；关联 **08** | `[读]` ①同只读文案 + `Join`。②`GET /v1/livechat/room.join`。③刷新后成为订阅坐席，出现 `ComposerMessage` | core+omni | 08；`composer.join` | `ComposerOmnichannel.tsx:62-68`；`ComposerOmnichannelJoin.tsx:15-28` |

**B 计数**：4。匿名 Sign_in / talk-as-anonymous 仍是 03 `composer.variant.anonymous.*`，不是 Join。

---

## C. File upload 状态

父入口 03：`composer.action.file-upload` `composer.paste.image` `implicit.upload.*` `composer.upload.*`。

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `composer.state.upload.button` | 点回形针打开多选系统选择器并入队 | 已订阅可发房 → `data-qa-id=file-upload` `title=Upload_file` → 选文件 | `FileUpload_Enabled`；`!disableBasicActions`（`!canSend \|\| isRecording \|\| isEditing` 则 disabled） | `[读]` ①系统 file picker；确认后 `aria-label=Uploads` 组出现 chip `aria-label=文件名`。②`POST /v1/rooms.media/:rid`（XHR）。③队列 session；发出并 confirm 后刷新仍在 | core+setting | `composer.action.file-upload` | `useFileUploadAction.ts:9-52` |
| `composer.state.upload.drop` | 拖放文件入队 | 从桌面拖进 `.messages-container-main` → overlay 绿 → drop | `FileUpload_Enabled`；未超 MAC；可发/已订阅；非 editing | `[读]` ①`role=dialog` `data-qa=DropTargetOverlay` `Drop_to_upload_file` 出现再关；chips 出现。②同 `rooms.media`。③同 button | core+setting+permission | `implicit.upload.dropFiles` | `useFileUploadDropTarget.ts:72-91`；`DropTargetOverlay.tsx:66-92` |
| `composer.state.upload.drop.disabled` | 无权拖入时 overlay 变红，松手不传 | 只读/未订阅/编辑中/关上传/MAC → dragenter → drop | `!FileUpload_Enabled \|\| MAC` → 文案 `FileUpload_Disabled`；否则 `error-not-allowed` | `[读]` ①同 dialog `color=danger`。②无 upload。③无附件 | core+setting | `implicit.upload.dragDisabledOverlay` | `useFileUploadDropTarget.ts:72-86` |
| `composer.state.upload.paste` | 剪贴板无 text/plain 时粘贴图片入队 | 焦点 textarea → Ctrl/Cmd+V 一张图 | 同 file upload；有 `text/plain` 则走默认粘贴 | `[读]` ①chip 名 `Clipboard - {datetime}.ext`。②`rooms.media`。③同 button | core+setting | `composer.paste.image` | `MessageBox.tsx:351-379` |
| `composer.state.upload.reject.size` | 超 `FileUpload_MaxFileSize` 出错误 chip，不发 XHR | 选/拖一个过大文件 | `maxFileSize > -1 && file.size > maxFileSize`；`size===0` 另条 empty-file | `[读]` ①`MessageComposerFileError` 副题 `Upload_failed`。②无 media POST。③session until Remove | core+setting | `composer.action.file-upload` | `uploads.ts:143-149` |
| `composer.state.upload.reject.type` | MIME 不在白名单/在黑名单 → 错误 chip | 选被拒类型 | `!fileUploadIsValidContentType` | `[读]` ①错误 chip `title` 为类型错误。②无 media POST。③session | core+setting | `composer.action.file-upload` | `uploads.ts:125,152-153` |
| `composer.state.upload.reject.count` | 队列+新选 >10 只 toast，不加 chip | 已有 n 个 chip → 再选使合计 >10 | `MAX_MULTIPLE_UPLOADED_FILES=10` | `[读]` ①toast `You_cant_upload_more_than__count__files`；无新 chip。②无 REST。③旧 chip 仍在 | core | `composer.action.file-upload` | `uploadFiles.ts:17-22`；`lib/constants.ts:2` |
| `composer.state.upload.e2ee.blocked` | 加密房且不允许明文文件且未开加密文件：整批拒 | 加密房间 + `!E2E_Allow_Unencrypted_Messages` + `!E2E_Enable_Encrypt_Files` → 选文件 | `uploadFiles.ts:27-31` 在入队前 return | `[读]` ①toast `You_cant_send_unencrypted_files_in_an_encrypted_room`；无 chip。②无 media。③无 | core+setting | `composer.action.file-upload` | `uploadFiles.ts:27-31` |
| `composer.state.upload.e2ee.encrypt-fail` | 开了加密文件但房间未就绪：该文件失败 | 加密房 + `E2E_Enable_Encrypt_Files` + `!e2eRoom.isReady()` → 选文件 | `!e2eRoom.isReady() \|\| !encryptedFile` | `[读]` ①toast `Error_encrypting_file`。②无 media。③无该文件 chip | core+setting | `composer.action.file-upload` | `uploadFiles.ts:47-54` |
| `composer.state.upload.chip.loading` | 上传中 chip 忙 + 顶栏百分比 | 文件已选、XHR 未完成 | `!upload.url && !upload.error` | `[读]` ①chip `aria-busy=true`；`role=status` Bubble `{n}% Uploading__count__file`。②`POST /v1/rooms.media/:rid`。③完成后变 success chip | core | `implicit.upload.progressBanner` | `MessageComposerGenericFile.tsx:33,78-96`；`UploadProgressIndicator.tsx:61-68` |
| `composer.state.upload.chip.cancel` | 取消进行中的 XHR | loading chip 上点 `aria-label=Cancel` | `isLoading` | `[读]` ①该 chip 与进度消失。②中止 XHR；无 mediaConfirm。③无残留 | core | `composer.upload.cancel` | `MessageComposerGenericFile.tsx:33,55-63` |
| `composer.state.upload.chip.remove` | 去掉已完成或错误 chip | success/error chip → `aria-label=Remove` | `upload.url \|\| upload.error`；`isProcessingUploads` 时整组 disabled | `[读]` ①该 `aria-label=文件名` chip 消失。②无新 REST。③刷新不会回来 | core | `composer.upload.remove` | `MessageComposerGenericFile.tsx:55-63` |
| `composer.state.upload.chip.error` | 失败 chip **没有 Retry**，只能 Remove | 触发 size/type/400/网络失败后看 chip | `upload.error`；`handleOpenFilePreview` 对 error 早退 | `[读]` ①`MessageComposerFileError`；点 chip 不打开 modal；**无 Retry 按钮**。②无重传。③session until Remove | core | `composer.upload.remove` | `MessageComposerGenericFile.tsx:35-37,66-75` |
| `composer.state.upload.chip.edit` | 成功 chip 改文件名/alt | 非 loading 非 error chip → FileUpload modal → `Update` | `!isLoading && !upload.error`；`isDirty` 才可提交 | `[读]` ①modal 标题 `FileUpload`；确认 `Update`；chip `fileTitle` 变。②此时无 REST；发送时带新名 confirm。③未发送刷新丢失 | core | `composer.upload.edit` | `MessageComposerGenericFile.tsx:35-52`；`FileUploadModal.tsx:63-112` |
| `composer.state.upload.multiple` | 一次多选并行上传 | file input `multiple` 选 2–10 个未超限文件 | 合计 ≤10 | `[读]` ①多个 chip；多个进度。②并行 `rooms.media`（`Promise.allSettled`）。③各自独立 | core | `composer.action.file-upload` | `useFileUploadAction.ts:9`；`uploadFiles.ts:82` |
| `composer.state.upload.partial-send` | 部分失败时 Send_anyway 只确认成功的 | 有成功+失败 chip → Send → `Are_you_sure` → `Send_anyway` | `failedUploads.length > 0 && < all` | `[读]` ①`GenericModal` 确认 `Send_anyway` / `Cancel`；确认后失败 chip 被 remove。②成功文件 `POST /v1/rooms.mediaConfirm/:rid/:fileId`。③成功附件 persist | core | `composer.send` | `processMessageUploads.ts:200-215` |
| `composer.state.upload.all-failed` | 全部失败只 Ok，不发送 | 仅错误 chip → Send → Warning `Ok` | `failedUploads.length === filesToUpload.length` | `[读]` ①`GenericModal` `variant=warning` 只有 `Ok`。②无 mediaConfirm。③错误 chip 仍在 | core | `composer.send` | `processMessageUploads.ts:182-198` |

**C 计数**：17。

---

## D. Audio recording

**锁/上滑锁定：源码无。** `AudioMessageRecorder` / `recorderjs` 无 lock/swipe-lock。

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `composer.state.audio.start` | 开始录音，textarea 换成录音条 | 宽屏 `data-qa-id=audio-message`（或 More→Create new） | `AudioRecorder.isSupported`；`FileUpload_Enabled`；`Message_AudioRecorderEnabled`；MIME 含 `audio/mp3`；`!isMicrophoneDenied`；`!disableBasicActions` | `[读]` ①`role=group` `aria-label=Audio_recorder`；`title=Cancel_recording` / `Finish_recording`；textarea disabled。②无 REST；`UserAction` `notify-room` `user-recording`。③不 persist | core+setting | `composer.action.audio-message` | `useAudioMessageAction.ts:14-61`；`AudioMessageRecorder.tsx:106-126` |
| `composer.state.audio.cancel` | 丢掉录音，不入队 | 录音条 → `Cancel_recording` | `state==='recording'` | `[读]` ①group 消失；textarea 恢复。②`UserAction.stop('recording')`；无 upload。③无文件 | core | `implicit.recording.cancel` | `AudioMessageRecorder.tsx:77-79,116-118` |
| `composer.state.audio.finish` | 完成录音 → 立刻当 mp3 入上传队列 | 录音条 → `Finish_recording` | recording 态 | `[读]` ①group 关；出现 `Audio_record.mp3` chip；短暂 Throbber。②`uploadFiles` → `POST /v1/rooms.media/:rid`。③随之后发送 persist | core | `implicit.recording.finish` | `AudioMessageRecorder.tsx:83-91,125-128` |
| `composer.state.audio.permission-denied` | 麦克风已拒：钮 disabled，点了也不出录音条 | 浏览器拒 mic 后看钮 / 再点 | `isMicrophoneDenied`；title `Microphone_access_not_allowed`。录音条 `return null` | `[读]` ①`data-qa-id=audio-message` disabled；无 `Audio_recorder` group。②无 REST。③权限 persist 在浏览器 | core | `composer.action.audio-message` | `useAudioMessageAction.ts:14-15,61`；`AudioMessageRecorder.tsx:102-104` |
| `composer.state.audio.send` | 录音入队后当附件发出 | finish 后 chip 在 → Send | 同 send+uploads | `[读]` ①chip 消失；消息带音频附件。②`rooms.mediaConfirm` + `chat.sendMessage`。③刷新仍在 | core | `composer.send` | `sendMessage.ts:33-35`；`processMessageUploads.ts` |
| `composer.state.audio.lock.absent` | **没有**录音锁定/上滑锁 | 开始录音后左右滑/上滑 | 全仓库录音组件无 lock UI | `[读]` ①只有 Cancel / Finish；无 lock 控件。②无。③无。负向断言，勿找 WhatsApp 式锁 | core | `composer.action.audio-message` | `AudioMessageRecorder.tsx:116-126` |

**D 计数**：6。

---

## E. Video recording（与 audio 同矩阵）

**锁：源码无。**

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `composer.state.video.start` | 打开摄像浮层，点 Record 开始 | `data-qa-id=video-message` → 浮层 → `aria-label=Record` | `Message_VideoRecorderEnabled`；`FileUpload_Enabled`；`MediaRecorder`；camera 未拒；`video/webm` MIME | `[读]` ①`role=dialog` `aria-label=Video_record`；`<video muted autoPlay>`；Record 变 `Stop_Recording`。②`UserAction` `user-recording`。③浮层不 persist | core+setting | `composer.action.video-message` | `useVideoMessageAction.ts:12-40`；`VideoMessageRecorder.tsx:116-128` |
| `composer.state.video.cancel` | 关浮层不入队 | 浮层 → `Cancel`（或开镜失败自动 cancel） | 浮层已开 | `[读]` ①dialog 消失。②`VideoRecorder.stop` + `UserAction.stop`。③无文件 | core | `composer.action.video-message` | `VideoMessageRecorder.tsx:97-113,130-131` |
| `composer.state.video.finish` | Stop 结束录制，Send 才可点 | 录制中 → `Stop_Recording` | `recordingState==='recording'` | `[读]` ①Stop 回到 Record；`Send` 从 `disabled`（`!(cameraStarted && !isRecording)`）变为可点。②无 upload 直到 Send。③不 persist | core | `composer.action.video-message` | `VideoMessageRecorder.tsx:49,64-80,133` |
| `composer.state.video.permission-denied` | 摄像头已拒：钮 disabled，或浮层被关掉 | 拒 camera 后看钮；或打开后 `isPermissionDenied` | title `Camera_access_not_allowed`；hook 会 `setRecordingVideo(false)` | `[读]` ①video 钮 disabled；dialog 不在。②无 REST。③浏览器权限 persist | core | `composer.action.video-message` | `useVideoMessageAction.ts:51-53`；`useMediaActionTitle.ts` |
| `composer.state.video.send` | 浮层 Send 把 webm 入队 | Stop 后 → `Send` | `cameraStarted && !isRecording` | `[读]` ①dialog 关；video chip 出现。②`uploadFiles` → `rooms.media`。③随消息 persist | core | `composer.send` | `VideoMessageRecorder.tsx:84-95,133-135` |
| `composer.state.video.lock.absent` | **没有**视频锁定手势 | 浮层内拖动手势 | 无 lock | `[读]` ①只有 Record/Stop、Cancel、Send。②无。③无 | core | `composer.action.video-message` | `VideoMessageRecorder.tsx:122-136` |

**E 计数**：6。不支持浏览器：toast `Browser_does_not_support_recording_video` 后早退（`VideoMessageRecorder.tsx:105-107`），并入 permission/start 失败，不另占行。

---

## F. Formatting：每 mark 的 apply + remove

工具栏注册表 **7** 项：bold / italic / strike / inline-code / multiline-code / link / katex。**无 quote、无 list 按钮**（用户可手打 `>` / `- `，无 wrap/unwrap）。Link 走 modal，**不**走 `wrapSelection` toggle。KaTeX 是外链，03 已有入口，本册不复述。

`wrapSelection`（`createComposerAPI.ts:225-261`）：光标两侧已是起止定界符 → **REMOVE**；否则 **APPLY**。

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `composer.fmt.bold.apply` | 选区包成 `*text*` | 选中未加粗文字 → title=`Bold` 或 Ctrl/Cmd+B | toolbar `disabled={isRecording \|\| !canSend}` | `[读]` ①选区变 `*…*`，光标包住内文。②无 REST。③随草稿 | core | `composer.format.bold` | `messageBoxFormatting.ts:35-40`；`createComposerAPI.ts:263-269` |
| `composer.fmt.bold.remove` | 已有 `*` 定界则剥掉 | 选中已被 `*` 包住的内文（光标贴在定界符内）→ 再点 Bold / Ctrl+B | 同 apply；`startPatternFound && endPatternFound` | `[读]` ①`*` 消失，内文保留。②无 REST。③随草稿 | core | `composer.format.bold` | `createComposerAPI.ts:236-260` |
| `composer.fmt.italic.apply` | 选区包成 `_text_` | 选中 → title=`Italic` 或 Ctrl/Cmd+I | 同格式栏 | `[读]` ①`_…_`。②无。③草稿 | core | `composer.format.italic` | `messageBoxFormatting.ts:41-46` |
| `composer.fmt.italic.remove` | 剥掉 `_` | 已包住 → 再点 Italic / Ctrl+I | 同 bold.remove | `[读]` ①`_` 消失。②无。③草稿 | core | `composer.format.italic` | `createComposerAPI.ts:236-260` |
| `composer.fmt.strike.apply` | 选区包成 `~text~` | 选中 → title=`Strikethrough`（无快捷键） | 同格式栏 | `[读]` ①`~…~`。②无。③草稿 | core | `composer.format.strikethrough` | `messageBoxFormatting.ts:47-51` |
| `composer.fmt.strike.remove` | 剥掉 `~` | 已包住 → 再点 Strike | 同 toggle | `[读]` ①`~` 消失。②无。③草稿 | core | `composer.format.strikethrough` | `createComposerAPI.ts:236-260` |
| `composer.fmt.inline-code.apply` | 选区包成行内代码 | 选中 → title=`Inline_code` | 同格式栏 | `[读]` ①`` `…` ``。②无。③草稿 | core | `composer.format.inline-code` | `messageBoxFormatting.ts:52-56` |
| `composer.fmt.inline-code.remove` | 剥掉行内反引号 | 已包住 → 再点 | 同 toggle | `[读]` ①反引号消失。②无。③草稿 | core | `composer.format.inline-code` | `createComposerAPI.ts:236-260` |
| `composer.fmt.multiline-code.apply` | 选区包成围栏代码块 | 选中 → title=`Multi_line_code` | 同格式栏 | `[读]` ①三反引号围栏。②无。③草稿 | core | `composer.format.multiline-code` | `messageBoxFormatting.ts:57-61` |
| `composer.fmt.multiline-code.remove` | 剥掉围栏 | 光标在围栏内再点 | 同 toggle | `[读]` ①围栏消失。②无。③草稿 | core | `composer.format.multiline-code` | `createComposerAPI.ts:236-260` |
| `composer.fmt.link.open` | 打开加链接弹窗（不 toggle） | 点 title=`Link`（可先选文字预填 Text） | 同格式栏 | `[读]` ①`GenericModal` title=`Add_link`；`TextInput` `URL` / `Text`。②无 REST。③关也不改文本直到 Add | core | `composer.format.link` | `messageBoxFormatting.ts:62-88`；`AddLinkComposerActionModal.tsx:28-46` |
| `composer.fmt.link.invalid` | URL 非法时不能 Add | modal 开 → URL 空或 `new URL` 抛错 | `isValidLink`；`confirmDisabled={!isValid}` | `[读]` ①`FieldError` `Invalid_URL` 或 `URL_is_required`；Add disabled。②无。③无插入 | core | `composer.format.link` | `AddLinkComposerActionModal.tsx:61-71` |
| `composer.fmt.link.add` | 插入 `[text](url)`；**没有**对应 remove 钮 | 填合法 URL → `Add` | `formState.isValid` | `[读]` ①modal 关；选区变 markdown 链接。②无 REST。③随草稿。再点 Link 仍开 modal，不剥链接 | core | `composer.format.link` | `AddLinkComposerActionModal.tsx:75-83` |
| `composer.fmt.link.cancel` | 关 modal 不改文本 | modal → Cancel / 关 | 始终可关 | `[读]` ①modal 消失；`composer.focus()`；原文不动。②无。③无 | core | `composer.format.link` | `AddLinkComposerActionModal.tsx:43` |
| `composer.fmt.quote.absent` | 工具栏**没有** quote/blockquote mark | 看格式栏 / overflow `Message_Formatting_toolbox` | `formattingButtons` 7 项无 quote | `[读]` ①无 title=Quote 的 formatter。②无。③手打 `>` 只是普通字符。负向断言 | core | `composer.format.bold` | `messageBoxFormatting.ts:34-106` |
| `composer.fmt.list.absent` | 工具栏**没有** ul/ol mark | 同上找 list/bullet/number | 注册表无 list | `[读]` ①无 lists 钮。②无。③手打 `- `/`1. ` 不经 wrapSelection。负向断言 | core | `composer.format.bold` | `messageBoxFormatting.ts:34-106` |

**F 计数**：16 = 5 pattern×(apply+remove) + link 4 + 2 absent。

---

## G. Emoji picker 状态

父入口 03 `composer.emoji.picker`。Colon 弹层仍是 03 `composer.popup.emoji-colon`，本册不复述。

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `composer.state.emoji.open` | 打开 picker dialog | toolbar title=`Emoji` | `useEmojis`；`!isRecording && canSend` | `[读]` ①`role=dialog` `aria-label=Emoji_picker`；`role=tablist` 分类。②无 REST。③关后不持久；`localStorage emoji.recent/tone` 仍在 | core+preference | `composer.emoji.picker` | `MessageBox.tsx:164-178,480-485`；`EmojiPicker.tsx:193-245` |
| `composer.state.emoji.search` | 搜索过滤 | dialog 开 → `aria-label=Search` 输入 | `searching=true` 非空 | `[读]` ①`role=tabpanel` 切到 `SearchingResult`。②仅本地 `emoji.list`。③输入不 persist | core | `composer.emoji.picker` | `EmojiPicker.tsx:139-205` |
| `composer.state.emoji.search.empty` | 搜索无结果 | 搜不存在的名 | 过滤后 0 | `[读]` ①`EmojiPickerNotFound` `No_emojis_found`。②无。③无 | core | `composer.emoji.picker` | `SearchingResult.tsx:26-27` |
| `composer.state.emoji.tone` | 改肤色并写入本地 | 点 Skin_tone → 选 tone 0–5 | ToneSelector 始终在 footer | `[读]` ①`IconButton` 预览肤色变；后续有肤色的 emoji 按 tone 渲染。②无 REST。③`localStorage emoji.tone` | core | `composer.emoji.picker` | `ToneSelector.tsx:54-66`；`ToneSelectorWrapper.tsx:10-11` |
| `composer.state.emoji.recent` | 打开时落在 recent 分类 | 先前插入过 emoji → 再打开 | 初始 category `recent`；数据 `emoji.recent` | `[读]` ①`role=tab` recent 选中；空则 `No_emojis_found`。②无。③recent persist localStorage | core | `composer.emoji.picker` | `EmojiPicker.tsx:135-137` |
| `composer.state.emoji.insert` | 点一个 emoji 插入并关闭 | dialog 开 → 点 `data-emoji` 项 | picker 开 | `[读]` ①dialog 关；textarea 插入 unicode/` :name: `。②无 REST。③`addRecentEmoji` → `emoji.recent`/`emoji.frequent`；文本随草稿 | core | `composer.emoji.picker` | `EmojiPicker.tsx:104-132` |
| `composer.state.emoji.pref-off` | 关 useEmojis：钮 disabled，点了也不开 | Preferences 关 Emojis → 回房间 | `!useUserPreference('useEmojis')`；open handler 早退 | `[读]` ①title=`Emoji` disabled；无 dialog。②无。③偏好 server persist | core+preference | `composer.emoji.picker` | `MessageBox.tsx:168-169,482` |

**G 计数**：7。

---

## H. Mentions popup：@user / @all / @here / 键盘 vs 点击 / 空

父入口 03 `composer.popup.mention`。壳：`role=menu` `name=ComposerBoxPopup` 标题 People。

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `composer.popup.mention.open` | 输入 `@` 打开 People 菜单 | textarea 输入 `@` 或 `@ali` | 无额外 permission；条数 `Number_of_users_autocomplete_suggestions` | `[读]` ①`role=menu` `name=ComposerBoxPopup` 标题 People；option `id=popup-item-{id}`。②本地最近消息；不足 5 则 `GET /v1/spotlight?type={"users":true,"mentions":true}`。③popup 关不 persist | core+setting | `composer.popup.mention` | `ComposerPopupProvider.tsx:110-184`；`ComposerBoxPopup.tsx:82-114` |
| `composer.popup.mention.empty` | 过滤后无人 | `@zzzz-no-user` | 本地+spotlight 皆空 | `[读]` ①`Option` `No_results_found`。②spotlight 仍可能已发。③无插入 | core | `composer.popup.mention` | `ComposerBoxPopup.tsx:99` |
| `composer.popup.mention.user.keyboard` | ↑↓ 后 Enter/Tab 插入 @username | popup 开 → 焦点某用户 → Enter 或 Tab | `focused` 存在 | `[读]` ①menu 关；textarea 成 `@username `。②无新 REST（spotlight 可能已发生）。③随草稿 | core | `shortcut.popup.select` | `useComposerBoxPopup.ts:181-190`；`ComposerPopupProvider.tsx:182` |
| `composer.popup.mention.user.click` | 鼠标点 option 插入同一值 | popup → 点用户 option | 同 open | `[读]` ①同 keyboard 插入。②同。③同。触发不同故分行 | core | `composer.popup.mention` | `ComposerBoxPopup.tsx:105` |
| `composer.popup.mention.all.keyboard` | 键盘选系统项 @all | `@` 或 `@all` → 焦点 `_id=all` → Enter/Tab | filter 空或匹配 `all`；`system:true` | `[读]` ①option `@all` + `Notify_all_in_this_room`（无头像）。②无 REST。③插入 `@all ` | core | `composer.popup.mention` | `ComposerPopupProvider.tsx:129-136` |
| `composer.popup.mention.all.click` | 点击 @all | 点 all option | 同 all.keyboard | `[读]` ①同插入 `@all `。②无。③草稿 | core | `composer.popup.mention` | `ComposerBoxPopup.tsx:105` |
| `composer.popup.mention.here.keyboard` | 键盘选 @here | 焦点 `_id=here` → Enter/Tab | filter 空或匹配 `here` | `[读]` ①`@here` + `Notify_active_in_this_room`。②无。③`@here ` | core | `composer.popup.mention` | `ComposerPopupProvider.tsx:139-146` |
| `composer.popup.mention.here.click` | 点击 @here | 点 here option | 同 here.keyboard | `[读]` ①同 `@here `。②无。③草稿 | core | `composer.popup.mention` | `ComposerBoxPopup.tsx:105` |
| `composer.popup.mention.not-in-channel` | spotlight 到不在本房的用户 | `@` 搜仅 spotlight 命中的外人 → 选中 | `ComposerBoxPopupUser` 大号 variant title `Not_in_channel` | `[读]` ①option 带 `Not_in_channel`。②spotlight。③插入 `@username `（是否自动邀请不在本 popup；见 i18n `Add_them` 服务端 hook） | core | `composer.popup.mention` | `ComposerBoxPopupUser.tsx:51-54` |

**H 计数**：9。

---

## I. Slash commands：palette / execute / invalid / app 扩展面

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `composer.popup.slash.open` | 行首 `/` 打开 Commands palette（只补全不执行） | 行首 `/` 或 `/to` → ↑↓ | 每条 `command.permission`；无权限项被滤掉 | `[读]` ①menu 标题 `Commands`；行 `{cmd}`+params。②仅本地 `slashCommands.commands`。③补全 `/cmd `，popup 关 | core+app | `composer.popup.slash-command` | `ComposerPopupProvider.tsx:327-360` |
| `composer.popup.slash.empty` | 过滤无命令 | `/zzz-no-cmd` | 本地表无匹配 | `[读]` ①`No_results_found`。②无。③无 | core | `composer.popup.slash-command` | `ComposerBoxPopup.tsx:99` |
| `composer.popup.slash.encrypted` | 加密且不允许明文：palette 整组 disabled | 加密房 + `E2E_Enable` + `!E2E_Allow_Unencrypted_Messages` → `/` | config `disabled: encrypted`；项 title `Unavailable_in_encrypted_channels` | `[读]` ①Commands 项 disabled。②无。③不能补全执行 | core+setting | `composer.popup.slash-command` | `ComposerPopupProvider.tsx:101-103,332-343` |
| `composer.state.slash.execute` | 发送 `/cmd params` 真正执行 | 输入已知命令 → Send/Enter | `isSlashCommandAllowed`；`hasAtLeastOnePermission` | `[读]` ①composer `clear()`。②clientOnly 本地 callback；否则 `POST /v1/commands.run` + `POST /v1/statistics.telemetry`。③副作用按命令 persist | core+app | `composer.slash.execute` | `processSlashCommand.ts:64-113`；`MessageBox.tsx:116-118` |
| `composer.state.slash.invalid` | 未知命令且不允许当正文：rocket.cat 临时提示 | `/not-a-cmd` → Send；`Message_AllowUnrecognizedSlashCommand=false` | 解析得 string command | `[读]` ①临时私信 `No_such_command`（rocket.cat）。②无 `commands.run`、无 `chat.sendMessage`。③刷新后 ephemeral 不在 | core+setting | `composer.slash.execute` | `processSlashCommand.ts:55-58` |
| `composer.state.slash.unrecognized-pass` | 未知命令被允许时当普通消息发出 | 同上但 setting **true** | `processSlashCommand` return false → 走 send | `[读]` ①listitem 正文是 `/not-a-cmd …`。②`POST /v1/chat.sendMessage`。③刷新仍在 | core+setting | `composer.slash.execute` | `processSlashCommand.ts:55-61` |
| `composer.state.slash.denied` | 已知命令但无 permission | `/cmd`（自己缺 permission）→ Send | `command.permission` 失败 | `[读]` ①ephemeral `You_do_not_have_permission_to_execute_this_command`。②无 `commands.run`。③不 persist | core+permission | `composer.slash.execute` | `processSlashCommand.ts:66-68` |
| `composer.state.slash.app.commands` | App 经 commands.list 注入同一 palette（扩展面 1） | 启用带 slash 的 app → `/` | `GET /v1/commands.list` → `slashCommands.add`；stream `command/removed\|disabled` 失效 | `[读]` ①Commands 里出现 app 的 `cmd`（无单独 Apps 分区）。②目录 GET；执行仍 `commands.run`（带 `appId` trigger）。③app 仍启用则刷新后仍在表 | app | `composer.popup.slash-command` | `useAppSlashCommands.ts:32-87`；`app/apps/server/bridges/commands.ts:100-120` |
| `composer.popup.slash.preview` | `providesPreview` 命令：横预览后 POST 执行（扩展面 2） | `/cmd ` + 参数（该命令 `providesPreview`）→ 点 preview 或 Enter | `slashCommands.commands[cmd].providesPreview` | `[读]` ①menu 内 `role=listbox`/`role=option`（loading 时 Skeleton×5）。②`GET /v1/commands.preview`；选中 `POST /v1/commands.preview`。③`setText('')`；结果按命令 | core+app | `composer.popup.slash-preview` | `ComposerBoxPopupPreview.tsx:31-76,102-133`；`useComposerBoxPopupQueries.ts:18-23` |

**I 计数**：9。

---

## J. Canned `!`

**非 omni 房间 composer 没有 `!` popup。** Omni 房间的 `!` 关联 **08**，但仍是房间 composer 可见状态。

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `composer.popup.canned.absent-non-omni` | 普通 c/p/d 输入 `!` **不**开 canned 菜单 | 非 live 房间 → textarea `!` | 仅当 `Canned_Responses_Enable && isOmnichannelRoom` 才 `createMessageBoxPopupConfig({trigger:'!'})` | `[读]` ①无 `ComposerBoxPopup` 标题 `Canned_Responses`。②无 `canned-responses.get`。③`!` 只是字符。负向断言 | core | 08 | `ComposerPopupProvider.tsx:364-392` |
| `composer.popup.canned.omni.open` | live 房间 `!` 打开 canned 菜单 | omni 且已进入 `ComposerMessage`（非 hold/inquiry/closed）→ `!` | `Canned_Responses_Enable`；`view-canned-responses`；`triggerAnywhere:true` | `[读]` ①menu 标题 `Canned_Responses`。②`GET /v1/canned-responses.get` + stream `canned-responses`。③popup 关 | EE/omni | 08 | `ComposerPopupProvider.tsx:364-392`；`useCannedResponsesQuery.ts:14-18` |
| `composer.popup.canned.omni.empty` | 快捷码无匹配 | `!zzz` | query 过滤空 | `[读]` ①`No_results_found`。②无新写。③无替换 | EE/omni | 08 | `ComposerBoxPopup.tsx:99` |
| `composer.popup.canned.omni.select` | 选一项用全文替换 `!filter` | ↑↓ Enter/Tab 或点击 | 有 option | `[读]` ①`!…` 换成 canned `text`。②无执行 REST。③随草稿 | EE/omni | 08 | `ComposerPopupProvider.tsx:376-388` |

**J 计数**：4。侧栏 canned toolbox 是 02，不是 composer popup。

---

## K. Quote bar

引用**进入**来自消息工具栏 Quote（01 `msg.quote`），03 只写了 bar 展示。本册写 bar 上的状态。

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `composer.state.quote.add` | 工具栏 Quote 后 composer 上方出现引用块 | 房间消息 → 悬停 → Quote（01）；或 `?reply=` | `quotedMessages.length>0`；链长 `Message_QuoteChainLimit` | `[读]` ①textarea 上 `QuoteAttachment` 块。②点击无 REST；URL 路径可能 `GET /v1/chat.getMessage`。③仅内存；刷新掉（除非 URL 仍带 `?reply=`） | core | `msg.quote`；`implicit.quote.barDisplay` | `MessageBoxReplies.tsx:16-26`；`createComposerAPI.ts:113-116` |
| `composer.state.quote.dismiss` | 关掉单条引用 chip | 引用块右上 `aria-label=Dismiss_quoted_message` | 该 mid 仍在 quoted 列表 | `[读]` ①该块消失。②无 REST。③session | core | `implicit.quote.dismissOne` | `MessageBoxReply.tsx:44-51` |
| `composer.state.quote.send` | 带着引用发出，bar 乐观清空 | 有 quote → 输入（可空若有附件）→ Send | `composeMessage` 把 quotes 写入 `msg` | `[读]` ①bar 立刻清空；消息带引用附件。②`POST /v1/chat.sendMessage`。③引用在消息上 persist；composer bar 不在 | core | `composer.send` | `sendMessage.ts:96-119` |

**K 计数**：3。

---

## L. Drafts：persist / restore / discard / 切房 / 刷新

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `composer.state.draft.persist` | 打字 debounce 写入 localStorage | 房间或线程 composer 输入 | key=`messagebox_{rid}[-{tmid}]`；300ms | `[读]` ①textarea 值变。②无 REST。③同标签刷新可从 local 恢复（在 flush 清掉前） | core | `implicit.draft.persistLocal` | `useDraft.ts:4-33`；`createComposerAPI.ts:42-44,287` |
| `composer.state.draft.flush` | 卸载 composer 时同步服务器并清 local | 输入后切到另一房间 / 关线程（textarea ref=null） | `draft!==serverDraft`；`tmid && !threadExists` 则跳过 | `[读]` ①成功后 local key remove。②`POST /v1/rooms.saveDraft` `{rid,draft,tmid?}`。③他端/刷新从 `subscription.draft` / `threadDrafts[tmid]` 回来 | core | `implicit.draft.flushServer` | `useDraft.ts:36-55`；`MessageBox.tsx:144-146` |
| `composer.state.draft.restore` | 再进房间/线程预填 | A 打字离开 → 再进 A | 优先 server draft，否则 local | `[读]` ①textarea 预填。②无单独 GET（订阅字段）。③server draft 跨刷新仍在 | core | `implicit.draft.restore` | `useDraft.ts:19`；`MessageBox.tsx:135-140` |
| `composer.state.draft.discard` | 发送成功立刻清空本地文本 | 发出新消息或带附件发送 | `composer.clear()` 在 send/upload 成功路径 | `[读]` ①textarea 空。②随后卸载才 `saveDraft` 空串。③刷新不再出现已发正文 | core | `composer.send` | `sendMessage.ts:34,48` |
| `composer.state.draft.room-switch` | 切房：旧房 flush，新房 restore | A 打字 → 点侧栏 B → 再回 A | `ComposerMessage` 按房间挂载；unmount flush | `[读]` ①B 的 textarea 是 B 的草稿；回 A 恢复 A。②A 的 `rooms.saveDraft`。③两边独立 key | core | `implicit.draft.flushServer` | `ComposerMessage.tsx:91`；`useDraft.ts:5` |
| `composer.state.draft.reload` | 整页刷新：server 优先，否则 local | A 打字（未切房、local 已写）→ F5 | `initialValue = serverDraft \|\| localStorage` | `[读]` ①刷新后预填。②若从未 flush 且 local 还在则恢复；若已 flush 则 server。③`[待渲染实测]` 仅 server、无 local 的跨设备时序 | core | `implicit.draft.restore` | `useDraft.ts:19` |

**L 计数**：6。编辑态另有内存 `saveDraft(mid)`（Cancel 恢复），挂在 03 `composer.edit.cancel`，不另占行。

---

## M. Typing indicator

**没有**「关闭房间内 typing」的用户偏好。`UI_Use_Real_Name` 只改 activity 里的名字。联邦可用 `Federation_Service_EDU_Process_Typing` 关掉跨服 typing。Embedded 用 CSS 藏指示器。

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `composer.state.typing.start` | 自己非空输入时广播 typing | 非空 composer 按非 Enter/Esc/方向修饰键 | `onTyping` 且 `text.trim()!==''` | `[读]` ①对方 `role=status` 出现 `is_typing`。②`sdk.publish notify-room {rid}/user-activity` `user-typing`。③约 15s 超时，不 persist | core | `implicit.typing.start` | `ComposerMessage.tsx:68-73`；`UserAction.ts:10-18,114+` |
| `composer.state.typing.stop` | 清空或发送后停止 | 清空输入 **或** Send 成功路径先 `action.stop('typing')` | 有过 start | `[读]` ①对方 status 该动作清空。②stop publish。③无残留 | core | `implicit.typing.stop` | `ComposerMessage.tsx:54-56,69-71` |
| `composer.state.typing.multi` | 多人同时 typing 拼文案 | ≥2 人在同一 rid/tmid 输入 | `users.length>1` → `are_typing` | `[读]` ①`role=status` `u1, u2 are_typing`；混有 recording 时 recording 优先。②stream。③ephemeral | core | `implicit.typing.display` | `ComposerUserActionIndicator.tsx:9-14,70-74` |
| `composer.state.typing.truncated` | ≥5 人截成 and others | ≥5 个 username | `maxUsernames=5` | `[读]` ①前 4 名 + `and` `others`。②stream。③ephemeral。`[待渲染实测]` 拼接空格 | core | `implicit.typing.display` | `ComposerUserActionIndicator.tsx:7,70-72` |
| `composer.state.typing.setting-off` | 能关掉指示的只有联邦 EDU / embedded CSS；无账号级开关 | 联邦房关 `Federation_Service_EDU_Process_Typing`；或 embedded 开房间 | 无 `useUserPreference` 藏 typing。联邦 setting；embedded `.users-typing{display:none}` | `[读]` ①联邦：对方无 typing status。embedded：`role=status` 被 CSS 藏。普通房间关不掉。②联邦不发/不收 EDU typing。③设置 persist | core+setting | `implicit.typing.display` | `en.i18n.json` `Federation_Service_EDU_Process_Typing`；`RoomComposer.tsx:16-18`；`UserAction.ts:31-38` |

**M 计数**：5。

---

## N. Location / WebDAV / discussion / timestamp / apps + 房间内看得见的 omni extras

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `composer.state.location.prompt` | 定位权限未决：先说明再 Continue | More → Share → `Location` | `MapView_Enabled`；geolocation；`MapView_GMapsAPIKey`；`!federated`；`!disableBasicActions` | `[待渲染实测]` ①`GenericModal` `You_will_be_asked_for_permissions` `Continue`。②无消息 REST。③不 persist | core+setting | `composer.action.share-location` | `useShareLocationAction.tsx:17-31`；`ShareLocationModal.tsx:70-79` |
| `composer.state.location.denied` | 定位拒绝或拿不到坐标 | Continue 后拒 / 无 position | `denied \|\| !positionData` | `[待渲染实测]` ①modal `Cannot_share_your_location` 仅 Ok。②无 `chat.sendMessage`。③无消息 | core | `composer.action.share-location` | `ShareLocationModal.tsx:82-87` |
| `composer.state.location.share` | 预览地图后发出 Point | 允许定位 → `Share` | granted + position | `[待渲染实测]` ①`MapView` + `Share`；发出后 modal 关。②`POST /v1/chat.sendMessage` `location.Point`。③刷新后地图附件仍在 | core+setting | `composer.send` | `ShareLocationModal.tsx:90-93` |
| `composer.state.webdav.add` | 添加 WebDAV 账号 | More → Create new → `Add_Server` → 填表提交 | `Webdav_Integration_Enabled`；项 `disabled=!isSuccess` | `[待渲染实测]` ①`AddWebdavAccountModal`。②Meteor `addWebdavAccount`；列表 `GET /v1/webdav.getMyAccounts`。③账号刷新后仍在 More | core+setting | `composer.action.webdav-add` | `useWebdavActions.tsx:12-33` |
| `composer.state.webdav.pick` | 从已连账户选文件入队 | More → 账户名 → picker 点文件 | query success 且有账户 | `[待渲染实测]` ①`WebdavFilePickerModal`；选中后 chip。②`getWebdavFileList` / `getFileFromWebdav` 再 `rooms.media`。③同 upload | core+setting | `composer.action.webdav-upload` | `useWebdavActions.tsx:35-43`；`WebdavFilePickerModal.tsx:128-147` |
| `composer.state.discussion.open` | 从 composer 打开创建讨论 | More → Create new → `Discussion` | `Discussion_enabled`；`start-discussion` 或 `start-discussion-other-user`；`!federated` | `[待渲染实测]` ①`GenericModal` `Discussion_title`；父房/名/话题/成员/首帖/加密开关。②无直到提交。③modal 不 persist | core+permission+setting | `composer.action.create-discussion` | `useCreateDiscussionAction.tsx:16-31`；`CreateDiscussion.tsx` |
| `composer.state.discussion.submit` | 提交创建并跳进新讨论 | modal 填必填名 → 确认 | 父房加密则首帖 textarea disabled、加密开关 locked | `[待渲染实测]` ①modal 关；导航到新讨论。②`POST /v1/rooms.createDiscussion`。③新房间刷新仍在 | core+permission | `composer.action.create-discussion` | `CreateDiscussion.tsx:53,82,190-205` |
| `composer.state.timestamp.open` | 打开时间戳选择器 | More → Insert → `Timestamp` | disabled 仅 `!canSend \|\| isRecording`（**编辑态仍可用**） | `[待渲染实测]` ①`GenericModal` `Insert_timestamp`；Date/Time/Format/Timezone。②无 REST。③不 persist | core | `composer.action.timestamp` | `useTimestampAction.tsx:8-26`；`TimestampPickerModal.tsx:64-71` |
| `composer.state.timestamp.insert` | 把 markup 插入 composer | 有效日期 → Add | `!isValid` 则 Add disabled | `[读]` ①modal 关；textarea 插入 timestamp markup。②无 REST。③随草稿 | core | `composer.send` | `TimestampPickerModal.tsx:46-52,64` |
| `composer.state.apps.emit` | 点 Apps 段按钮发 UiKit | More → Apps → `{appId}/{actionId}` | `GET` actionButtons `context=messageBoxAction`；`useApplyButtonFilters`；`!disableBasicActions` | `[待渲染实测]` ①运行时 app label；可能再出 UiKit modal。②`emitInteraction` `type=actionButton` `{rid,tmid,actionId}`；目录 `GET /apps/actionButtons`。③按钮随 app 启用 persist | app | `composer.action.apps` | `useMessageboxAppsActionButtons.ts:12-61`；`MessageBoxActionsToolbar.tsx:105-126` |
| `composer.state.apps.timeout` | UiKit 交互超时 toast | 点 app 钮后 app 不响应 | `UiKitTriggerTimeoutError` | `[读]` ①toast `UIKit_Interaction_Timeout`。②interaction 已发。③无本地状态 | app | `composer.action.apps` | `useMessageboxAppsActionButtons.ts:40-44` |
| `composer.state.omni.hold` | 会话挂起：页脚 Resume，无 textarea | live `room.onHold` → `Resume` | 容器在 inquiry/join 之前；关联 **08** | `[读]` ①`chat_on_hold_due_to_inactivity` + `Resume`（pending 时 disabled）。②`POST /v1/livechat/room.resumeOnHold`。③`onHold` 刷新仍在直到恢复 | core+omni | 08 | `ComposerOmnichannel.tsx:44-49`；`ComposerOmnichannelOnHold.tsx:15-22` |
| `composer.state.omni.inquiry` | 队列预览：Take_it（离线/不可用则禁） | 未 `servedBy` 且有 `queuedAt` → `Take_it` | 离线 title `You_cant_take_chats_offline`；不可用 `You_cants_take_chats_unavailable` | `[读]` ①`you_are_in_preview_mode_of_incoming_livechat`；`aria-busy` 加载。②`GET /v1/livechat/inquiries.getOne`；`POST /v1/livechat/inquiries.take`。③接起后变正常 composer | core+omni | 08 | `ComposerOmnichannelInquiry.tsx:42-60` |
| `composer.state.omni.callout` | 未知联系人条：Add_contact / Block / Dismiss | 进入 live 且 `contact.unknown` 且未 dismiss | 在所有 omni 页脚之上；`sessionStorage contact-unknown-callout-{id}` | `[读]` ①`Callout` `role=status`；`Add_contact` `Block`/`Unblock` `Dismiss`。②`GET /v1/omnichannel/contacts.get`。③Dismiss 仅 session；联系人状态 server | core+omni | 08 | `ComposerOmnichannelCallout.tsx:35-58` |

**N 计数**：14。`ComposerOmnichannel` **没有** department 选择器、**没有**会话导航控件（↑↓ 在 MessageBox 是编辑上一条消息）。见 O8。

---

## O. 加密 / 联邦 / 其余容器约束（房间 composer 上仍看得到）

与 A/B 重叠的只读/屏蔽/Join 不重复。这里是**整页替换 MessageBox**且后果不同的状态。

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `composer.state.constraint.federation.invalid` | 非原生联邦房禁止输入 | 打开 `isRoomFederated && !isRoomNativeFederated` | 容器 `isFederation` + `blocked` | `[读]` ①callout `Federation_Matrix_Federated_Description_invalid_version` + 外链。②无 REST。③房间类型刷新不变 | core | `composer.variant.federation.invalid-version` | `ComposerFederation.tsx:17-18`；`ComposerFederationInvalidVersion.tsx:7-18` |
| `composer.state.constraint.federation.disabled` | 联邦总开关关 | 原生联邦但 `!Federation_Matrix_enabled && !Federation_Service_Enabled` | `useIsFederationEnabled()` 假 | `[读]` ①`Federation_Matrix_Federated_Description_disabled`。②无。③设置 persist | core+setting | `composer.variant.federation.disabled` | `ComposerFederation.tsx:21-22` |
| `composer.state.constraint.federation.premium` | 无 federation 许可 | 联邦已开但 `useHasLicenseModule('federation')` 假 | license 模块 | `[读]` ①`Federation_Matrix_join_public_rooms_is_premium`。②无。③许可未变则仍禁 | core+license | `composer.variant.federation.premium` | `ComposerFederation.tsx:25-26` |
| `composer.state.constraint.airgapped` | 空窗到期只读页脚 | `Cloud_Workspace_AirGapped_Restrictions_Remaining_Days===0` → 任意房间 | `useAirGappedRestriction()[0]` | `[读]` ①`Composer_readonly_airgapped`；无 textarea。②无。③设置/许可 persist | core+license | `composer.variant.air-gapped` | `ComposerContainer.tsx:43-44`；`ComposerAirGappedRestricted.tsx:6-16` |
| `composer.state.constraint.archived` | 归档房无输入 | `room.archived` 或 DM `subscription.archived` | `useMessageComposerIsArchived` | `[读]` ①`Room_archived`。②无。③归档未解则仍如此 | core | `composer.variant.archived` | `ComposerContainer.tsx:63-64`；`ComposerArchived.tsx:8-10` |
| `composer.state.constraint.omni.closed` | 已关闭会话无输入 | live `!room.open` | omni 路由第一分支 | `[读]` ①`This_conversation_is_already_closed`（仍可能有 unknown-contact callout）。②无 send。③`open` persist | core+omni | 08 | `ComposerOmnichannel.tsx:26-32` |
| `composer.state.constraint.omni.mac` | MAC 超限无输入 | live 且 `isRoomOverMacLimit` | 在 hold 之前 | `[读]` ①`Workspace_exceeded_MAC_limit_disclaimer`。②无。③许可/用量 persist | core+license+omni | 08 | `ComposerOmnichannel.tsx:35-40` |
| `composer.state.constraint.omni.dept-nav.absent` | 房间 composer **没有**部门选择 / 会话前进后退 | 打开 live 已接管会话，看页脚 | `ComposerOmnichannel/*` 无 department/navigation 控件。部门在转发等 08 表面 | `[读]` ①页脚只有 `ComposerMessage`（+ callout）；无 dept `<select>`、无 prev/next 会话钮。②无。③负向断言。↑↓ 仍是编辑上/下一条消息 | core+omni | 08 | `ComposerOmnichannel.tsx:71-75`；`MessageBox.tsx:251-276` |

**O 计数**：8。加密约束已摊到 A7/A8、C8/C9、I3，不在此复行。

---

## P. Thread composer vs room composer

房间：`RoomComposer` `aria-label=Room_composer`。线程：`aria-label=Thread_composer` + `tmid` + 可选 checkbox。

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `composer.state.thread.tmid` | 线程里发送带 tmid（房间发送不带） | 顶栏 Threads → 开线程 → 底部输入 → Send | `ChatProvider tmid`；其余同 `canSend` | `[读]` ①`RoomComposer` `aria-label=Thread_composer`；线程列表新 listitem。②`POST /v1/chat.sendMessage` 带 `tmid`。③刷新仍在该线程 | core | `thread.composer.reply` | `ThreadChat.tsx:113-122`；`data.ts:29-31` |
| `composer.state.thread.also-send-on` | 勾选后回复同时出现在频道 | 勾 `Also_send_to_channel` → Send | 偏好 `alsoSendThreadToChannel`：`always` 默认勾；`default` 且 `!tcount` 默认勾 | `[读]` ①checkbox `name=alsoSendThreadToChannel` checked。②发送体 `tshow:true`。③频道刷新可见该回复 | core+preference | `thread.composer.alsoSendToChannel` | `ThreadChat.tsx:29-40,122-134` |
| `composer.state.thread.also-send-off` | 不勾则只在线程 | 去勾（或偏好 `never`）→ Send | 同左，checked=false | `[读]` ①checkbox 未勾。②无 `tshow`。③频道时间线不出现该回复 | core+preference | `thread.composer.alsoSendToChannel` | `ThreadChat.tsx:122-134` |
| `composer.state.thread.escape` | 空内容 Esc 关线程面板（房间无此回调） | 焦点线程 composer 且 trim 空且非编辑 → Escape | `onEscape` → `closeTab`；编辑中 Esc 先取消编辑 | `[读]` ①`rcx-thread-view` 消失。②无 REST。③刷新无 tmid 则不再开 | core | `thread.composer.escapeLeave` | `ThreadChat.tsx:50-52,119`；`MessageBox.tsx:245-248` |
| `composer.state.thread.draft-key` | 线程草稿与房间草稿分 key | 房间打字、线程打字，分别离开再回来 | 房间 `messagebox_{rid}`；线程 `messagebox_{rid}-{tmid}`；server `draft` vs `threadDrafts[tmid]` | `[读]` ①两个 textarea 互不覆盖。②各走 `rooms.saveDraft`（线程带 `tmid`）。③两边独立 persist | core | `implicit.draft.persistLocal` | `useDraft.ts:5,19`；`ThreadChat.tsx:115-116` |

**P 计数**：5。线程 drop 复用 C，不另占行。

---

## 验算

禁止把下面收成一个「总功能」标题。数字是**表体行**。

| 节 | 行 | 命令 |
| --- | --- | --- |
| A Send | 14 | `rg -c '^\| `composer\.state\.send\.' docs/qa/pm-feature-atlas/11-composer-states.md` |
| B Join | 4 | `rg -c '^\| `composer\.state\.join\.' …` |
| C Upload | 17 | `rg -c '^\| `composer\.state\.upload\.' …` |
| D Audio | 6 | `rg -c '^\| `composer\.state\.audio\.' …` |
| E Video | 6 | `rg -c '^\| `composer\.state\.video\.' …` |
| F Fmt | 16 | `rg -c '^\| `composer\.fmt\.' …` |
| G Emoji | 7 | `rg -c '^\| `composer\.state\.emoji\.' …` |
| H Mention | 9 | `rg -c '^\| `composer\.popup\.mention\.' …` |
| I Slash | 9 | `rg -c '^\| `composer\.(popup\.slash|state\.slash)\.' …` |
| J Canned | 4 | `rg -c '^\| `composer\.popup\.canned\.' …` |
| K Quote | 3 | `rg -c '^\| `composer\.state\.quote\.' …` |
| L Draft | 6 | `rg -c '^\| `composer\.state\.draft\.' …` |
| M Typing | 5 | `rg -c '^\| `composer\.state\.typing\.' …` |
| N Extras | 14 | `rg -c '^\| `composer\.state\.(location|webdav|discussion|timestamp|apps|omni)\.' …` |
| O Constraint | 8 | `rg -c '^\| `composer\.state\.constraint\.' …` |
| P Thread | 5 | `rg -c '^\| `composer\.state\.thread\.' …` |

加法（只证明没丢表）：

```
14+4=18
18+17=35
35+6=41
41+6=47
47+16=63
63+7=70
70+9=79
79+9=88
88+4=92
92+3=95
95+6=101
101+5=106
106+14=120
120+8=128
128+5=133
```

去重稳定 id = 表体行 = **133**（本册无复行）。

```bash
rg -c '^\| `composer\.(state|fmt|popup)\.' docs/qa/pm-feature-atlas/11-composer-states.md
# 133

rg -o '^\| `composer\.(state|fmt|popup)\.[^`]+' docs/qa/pm-feature-atlas/11-composer-states.md | sort | uniq -d
# （应空）
```

与 03 入口 id **零交集**（03 用 `composer.send` / `composer.format.*` / `composer.action.*` / `composer.popup.mention` 无后缀状态；本册 `composer.state.*` `composer.fmt.*` `composer.popup.mention.*` 等）。

---

## [待渲染实测] 汇总

1. 录音前已有字时 Send 是否仍可点（表达式不含 `isRecording`）。
2. Fuselage GenericMenu / FileUpload / ShareLocation / Timestamp / WebDAV / CreateDiscussion / Apps 的最终 dialog role+name。
3. EmojiPicker tab/tabpanel 与 tone `Options` 的精确 name。
4. `composer.state.typing.truncated` ≥5 人的空格拼接。
5. `composer.state.draft.reload` 仅 server、无 localStorage 的跨设备时序。
6. Quote 多条堆叠的 list 结构。
7. Video 开镜失败：toast vs 浮层谁先消失（03 已记，状态仍标）。
8. Omni callout `role=status` 与 Block/Unblock 文案。
9. 联邦 EDU 关时主 SPA 房间指示器是否仍显示本服用户。
10. `composer.popup.mention.not-in-channel` 发送后是否弹出 `Add_them`（服务端 hook，非 popup）。

---

## 计数证据

命令在仓库根、本文件写入后执行（见上节）。源码树与 03 相同：

```
find apps/meteor/client/views/room/composer -type f \( -name '*.ts' -o -name '*.tsx' \) | wc -l
# 73

ls apps/meteor/client/views/room/composer/messageBox/MessageBoxActionsToolbar/hooks/ | wc -l
# 7

rg -c "label:" apps/meteor/app/ui-message/client/messageBox/messageBoxFormatting.ts
# 8   # 类型 1 + 按钮 7（无 quote/list）
```

---

## 本分册 id 列表

**A** `composer.state.send.disabled.empty` `composer.state.send.disabled.uploading` `composer.state.send.disabled.processing` `composer.state.send.disabled.recording` `composer.state.send.disabled.read-only` `composer.state.send.disabled.blocked` `composer.state.send.e2ee.hint` `composer.state.send.e2ee.server-reject` `composer.state.send.click` `composer.state.send.enter` `composer.state.send.enter.newline` `composer.state.send.new` `composer.state.send.edit.save` `composer.state.send.edit.empty-delete`

**B** `composer.state.join.preview` `composer.state.join.readonly` `composer.state.join.password` `composer.state.join.omni`

**C** `composer.state.upload.button` `composer.state.upload.drop` `composer.state.upload.drop.disabled` `composer.state.upload.paste` `composer.state.upload.reject.size` `composer.state.upload.reject.type` `composer.state.upload.reject.count` `composer.state.upload.e2ee.blocked` `composer.state.upload.e2ee.encrypt-fail` `composer.state.upload.chip.loading` `composer.state.upload.chip.cancel` `composer.state.upload.chip.remove` `composer.state.upload.chip.error` `composer.state.upload.chip.edit` `composer.state.upload.multiple` `composer.state.upload.partial-send` `composer.state.upload.all-failed`

**D** `composer.state.audio.start` `composer.state.audio.cancel` `composer.state.audio.finish` `composer.state.audio.permission-denied` `composer.state.audio.send` `composer.state.audio.lock.absent`

**E** `composer.state.video.start` `composer.state.video.cancel` `composer.state.video.finish` `composer.state.video.permission-denied` `composer.state.video.send` `composer.state.video.lock.absent`

**F** `composer.fmt.bold.apply` `composer.fmt.bold.remove` `composer.fmt.italic.apply` `composer.fmt.italic.remove` `composer.fmt.strike.apply` `composer.fmt.strike.remove` `composer.fmt.inline-code.apply` `composer.fmt.inline-code.remove` `composer.fmt.multiline-code.apply` `composer.fmt.multiline-code.remove` `composer.fmt.link.open` `composer.fmt.link.invalid` `composer.fmt.link.add` `composer.fmt.link.cancel` `composer.fmt.quote.absent` `composer.fmt.list.absent`

**G** `composer.state.emoji.open` `composer.state.emoji.search` `composer.state.emoji.search.empty` `composer.state.emoji.tone` `composer.state.emoji.recent` `composer.state.emoji.insert` `composer.state.emoji.pref-off`

**H** `composer.popup.mention.open` `composer.popup.mention.empty` `composer.popup.mention.user.keyboard` `composer.popup.mention.user.click` `composer.popup.mention.all.keyboard` `composer.popup.mention.all.click` `composer.popup.mention.here.keyboard` `composer.popup.mention.here.click` `composer.popup.mention.not-in-channel`

**I** `composer.popup.slash.open` `composer.popup.slash.empty` `composer.popup.slash.encrypted` `composer.state.slash.execute` `composer.state.slash.invalid` `composer.state.slash.unrecognized-pass` `composer.state.slash.denied` `composer.state.slash.app.commands` `composer.popup.slash.preview`

**J** `composer.popup.canned.absent-non-omni` `composer.popup.canned.omni.open` `composer.popup.canned.omni.empty` `composer.popup.canned.omni.select`

**K** `composer.state.quote.add` `composer.state.quote.dismiss `composer.state.quote.send`

**L** `composer.state.draft.persist` `composer.state.draft.flush` `composer.state.draft.restore` `composer.state.draft.discard` `composer.state.draft.room-switch` `composer.state.draft.reload`

**M** `composer.state.typing.start` `composer.state.typing.stop` `composer.state.typing.multi` `composer.state.typing.truncated` `composer.state.typing.setting-off`

**N** `composer.state.location.prompt` `composer.state.location.denied` `composer.state.location.share` `composer.state.webdav.add` `composer.state.webdav.pick` `composer.state.discussion.open` `composer.state.discussion.submit` `composer.state.timestamp.open` `composer.state.timestamp.insert` `composer.state.apps.emit` `composer.state.apps.timeout` `composer.state.omni.hold` `composer.state.omni.inquiry` `composer.state.omni.callout`

**O** `composer.state.constraint.federation.invalid` `composer.state.constraint.federation.disabled` `composer.state.constraint.federation.premium` `composer.state.constraint.airgapped` `composer.state.constraint.archived` `composer.state.constraint.omni.closed` `composer.state.constraint.omni.mac` `composer.state.constraint.omni.dept-nav.absent`

**P** `composer.state.thread.tmid` `composer.state.thread.also-send-on` `composer.state.thread.also-send-off` `composer.state.thread.escape` `composer.state.thread.draft-key`

---

## 边界

- **不复述 03 入口行**：`composer.send` `composer.join` `composer.format.*` `composer.action.*` `composer.popup.mention`（无后缀）等。本册只写状态。
- **OUT**：消息工具栏 Quote **进入**（01 `msg.quote`）；canned **侧栏**（02）；omni 管理页 / 部门 CRUD / 会话列表导航（08）。
- **负向断言（用户进不去，但必须写明）**：`composer.fmt.quote.absent` `composer.fmt.list.absent` `composer.state.audio.lock.absent` `composer.state.video.lock.absent` `composer.popup.canned.absent-non-omni` `composer.state.constraint.omni.dept-nav.absent`；upload **无 Retry 钮**（`composer.state.upload.chip.error`）。
- **加密**：UI 不禁 Send（A7/A8）；禁 slash palette（I3）；禁/失败文件（C8/C9）。
- **线程 drop**：复用 C，不另占 id。

---

## 与现行 atlas

- 03 入口 117 行仍在 `03-composer-implicit.md`。本册 **133** 状态行全部 NEW。
- 08 尚未入库；omni 行标「关联 08」，不臆造 08 id。
- 机械碰撞：本册 id 前缀 `composer.state.` `composer.fmt.` `composer.popup.mention.` `composer.popup.slash.` `composer.popup.canned.`，与 03 `composer.popup.mention`（无第四段）及 `composer.format.*` 不精确相等。
