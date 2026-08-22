# Round 2 / Vol.11 — Keyboard / Focus / Timing

冻结树：**仅** `e519470d35b6caf5b228d81aef41c86aab3051f4`（短 SHA `e519470`）。不是 `develop`。`file:line` 均相对此 SHA。

文档-only。不改产品代码。

---

## 1. 方法

- **闭集 A（本卷主闭集）= 每一次 shortcut registration**。注册 API = 生产代码里的 `tinykeys(`（不含 `import`、不含 spec/test/stories）。
  - 调用点 **6**；每个 keymap 里的和弦各算一行，共 **10**。
  - `NavBarSearch` 与 `NavBarAISearch`、legacy `sidebar` 与 `navigation/sidebar` 是 FeaturePreview 互斥挂载，**仍各计一次注册**（源码里各有一份 `tinykeys(`）。
- **文档集** = `KeyboardShortcutsModal.tsx` `SHORTCUTS` 的 `id:` **9**。这是帮助文案，不是注册 API。与闭集 A 对账，不并入 10。
- **邻接绑定**（不是 `tinykeys`，所以不进闭集 A）：`useEscapeKeyStroke`、composer `keydown`、格式化 `command`、popup/list 导航、`UserAction` 时序。写出来是为了不把「帮助里有、tinykeys 没有」误写成不存在。
- **闭集 B** = 生产 JSX `<FocusScope` **13** + skip-link + `#main-content` + 列表键盘导航 hook。
- **闭集 C** = 客户端节流/防抖 API 调用点：`useDebouncedValue` **77** + `useDebouncedCallback` **20** + `useDebouncedState` **1** + `withDebouncing` **8** + `withThrottling` **1** = **107**。
- **闭集 D** = `export const runOptimistic*` **2**。乐观窗口 **没有** 硬编码 ms；窗口 = REST 返回或 stream 覆盖 `temp` 之前。
- 扫描根：`apps/meteor/client` `apps/meteor/app` `packages/ui-client` `packages/ui-contexts` `packages/ui-voip` `packages/ui-video-conf` `packages/fuselage-ui-kit` `packages/web-ui-registration`。
  - `apps/meteor/ee/client` 在本冻结树 **不存在**。不要把它写进复跑命令。
- 排除：`*.spec.*` `*.test.*` `*.stories.*` `tests/` `node_modules` `server/`。
- 诚实标记：有用户可见截图才升 `[实测]`。打不开 / OS 抢走 / 预览互斥未挂 / 无联邦房 / 未诱发 REST fail = leftover，保持 `[读]`。不发明 debounce/throttle DOM。
- 8 列：稳定语义 id / 功能一句话 / 和弦或常量 / 门控 / 触发后果 / 供给 / 关联 / 出处。
- 截图：`docs/qa/pm-feature-atlas/round-2/shots/vol11/`。

---

## 2. Live-verify（Meteor boot）

跳过 docker compose（overlayfs 失败）。按 Volume 5 路径（2026-08-22）：

| 探测 | 结果 |
| --- | --- |
| 产品 merge-base | `e519470d35b6caf5b228d81aef41c86aab3051f4`（`git merge-base HEAD e519470`） |
| 文档分支 HEAD | 本卷 atlas commit（Meteor 横幅 Commit Hash 会是 docs HEAD，不是冻结 SHA） |
| Mongo | 8.0.12 tarball；`rs0` PRIMARY `127.0.0.1:27017` |
| nvm / Meteor / deno | 22.22.3 / 3.4.1 / 2.3.1 |
| turbo | `yarn turbo run build --filter=@rocket.chat/meteor... --filter='!@rocket.chat/meteor'`（i18n dist 已出） |
| `MONGO_URL` | `mongodb://127.0.0.1:27017/rocketchat?replicaSet=rs0&directConnection=true&retryWrites=false` |
| `ROOT_URL` | `http://127.0.0.1:3000` → **HTTP 200**；`TEST_MODE=true` `OVERWRITE_SETTING_Show_Setup_Wizard=completed` |
| 登录 | `rocketchat.internal.admin.test` / 同密 |
| 版本 | 8.8.0-develop；Community；`hasValidLicense=false` |
| Feature preview | `/account/feature-preview` = 「No feature to preview」（`aiSearch` / `secondarySidebar` 未挂） |
| 房间 | 仅 `#general`；无联邦房、无消息图、无 UiKit app、无 VoIP |
| OS | Xfce：**Ctrl+Esc 打开系统应用菜单**，不是 RC leftover「未绑定」 |

登录页 / 进房：`01-login.webp` `02-home.webp`。preview 空页：`19-feature-preview.webp`。

纸面闭合在 boot 后复跑仍对齐：tinykeys 调用 **6**、和弦 **10**、SHORTCUTS **9**、FocusScope **13**、`77+20+1+8+1=107`、`runOptimistic` **2**。

---

## 3. Hunch 核验

| hunch | 本树结论 | 计数（排除 spec/test/stories） |
| --- | --- | --- |
| `tinykeys(` | **成立**（唯一 shortcut 注册 API） | 调用 6；和弦 10 |
| `useHotkeys` / `mousetrap` | **不成立** | 0 |
| `KeyboardShortcutsModal` `id:` | **成立**（文档集，不是注册） | 9 |
| `<FocusScope` | **成立** | 13 |
| `useDebouncedValue(` | **成立** | 77 |
| `useDebouncedCallback(` | **成立** | 20 |
| `useDebouncedState(` | **成立** | 1 |
| `withDebouncing(` | **成立** | 8 |
| `withThrottling(` | **成立** | 1 |
| `export const runOptimistic` | **成立** | 2 |
| `lodash` `debounce(`（`UserAction`） | **邻接**（不在 107） | 1（`wait=500`） |

---

## 4. 闭集 A — 每一次 `tinykeys(` 注册

数据行 **10**。`6` 个调用点炸开。验算：`3+3+1+1+1+1 = 10`。

| 稳定语义 id | 功能一句话 | 和弦或常量 | 门控 | 触发后果 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `kb.reg.search.mod-k.classic` | Ctrl/Cmd+K 聚焦房间搜索 | `$mod+K` | `FeaturePreviewOff` `aiSearch`；`NavBarSearch` 已挂 | `[实测]` ①`setFocus('filterText')`；placeholder「Search rooms (Ctrl+K)」= classic。Ctrl+K → 蓝框 + Recent（`#general` / admin / rocket.cat / 自己）。②无 REST。③不 persist。shot `03-ctrl-k-search.webp` | core+preview | `kb.doc.openSearch` | `apps/meteor/client/navbar/NavBarSearch/NavBarSearch.tsx:56-59` |
| `kb.reg.search.mod-p.classic` | Ctrl/Cmd+P 同上 | `$mod+P` | 同左 | `[实测]` 同 K。本机未抢打印。shot `05-ctrl-p-search.webp` | core+preview | `kb.reg.search.mod-k.classic` | `NavBarSearch.tsx:61-64` |
| `kb.reg.search.esc.classic` | Escape 清空并关搜索 overlay | `Escape` | 同左；全局 `window` | `[实测]` ①`resetField` + `close`；Esc 后 overlay 没了。②无 REST。③无。**无输入守卫**未另测。shot `04-escape-cleared.webp` | core+preview | `kb.reg.search.mod-k.classic` | `NavBarSearch.tsx:65-68` |
| `kb.reg.search.mod-k.ai` | AI 搜索栏的 Ctrl/Cmd+K | `$mod+K` | `FeaturePreviewOn` `aiSearch` | `[读]` leftover：Community preview 页「No feature to preview」，顶栏仍是 classic placeholder。shot `19-feature-preview.webp` | core+preview | `kb.reg.search.mod-k.classic` | `apps/meteor/client/navbar/NavBarSearch/NavBarAISearch.tsx:61-64` |
| `kb.reg.search.mod-p.ai` | AI 搜索栏的 Ctrl/Cmd+P | `$mod+P` | 同左 | `[读]` leftover 同 `mod-k.ai` | core+preview | `kb.reg.search.mod-k.ai` | `NavBarAISearch.tsx:66-69` |
| `kb.reg.search.esc.ai` | Escape 清文本+滤镜并关 overlay | `Escape` | 同左 | `[读]` leftover 同 `mod-k.ai` | core+preview | `kb.reg.search.esc.classic` | `NavBarAISearch.tsx:70-73` |
| `kb.reg.shortcuts.shift-question` | Shift+? 打开快捷键说明 | `Shift+?` | `AppLayout` 已挂；目标不是 contentEditable / INPUT / TEXTAREA / SELECT / `dialog[open]` | `[实测]` ①`GenericModal`「Keyboard shortcuts」。用户菜单同入口。②无 REST。③关后不 persist。shot `06-keyboard-shortcuts-modal.webp` `06b-shortcuts-all-rows.webp` `18-user-menu.webp` `18b-shortcuts-from-menu.webp` | core | `kb.doc.openKeyboardShortcuts` | `apps/meteor/client/views/root/hooks/useKeyboardShortcutsHotkey.tsx:7-21,39-40`；`AppLayout.tsx:57` |
| `kb.reg.sidebar.alt.legacy` | 焦点在侧栏房间项时 Alt 点开 kebab | `Alt` | `FeaturePreviewOff` `secondarySidebar`；目标 class 含 `rcx-sidebar-item` | `[读]` leftover：侧栏是 legacy（Channels / `# general`）；点房间行再按 Alt，**无 kebab**。shot `07-alt-key-leftover.webp` `22-alt-sidebar-retry.webp` | core+preview | `kb.reg.sidebar.alt.v2` | `apps/meteor/client/sidebar/hooks/useShortcutOpenMenu.ts:8-15`；`sidebar/RoomList/RoomList.tsx:50` |
| `kb.reg.sidebar.alt.v2` | 新侧栏房间项 Alt 开菜单 | `Alt` | `FeaturePreviewOn` `secondarySidebar`；class 含 `rcx-sidebar-v2-item` | `[读]` leftover：`secondarySidebar` 未挂；preview 页无开关。shot `19-feature-preview.webp` | core+preview | `kb.reg.sidebar.alt.legacy` | `apps/meteor/client/views/navigation/sidebar/hooks/useShortcutOpenMenu.ts:8-15`；`navigation/sidebar/RoomList/RoomList.tsx:37` |
| `kb.reg.subscription.konami` | Admin 订阅页 Konami 切 license tab | `ArrowUp ArrowUp ArrowDown ArrowDown ArrowLeft ArrowRight ArrowLeft ArrowRight b a` | 仅 `SubscriptionPage` 挂载时；`useSessionStorage('admin:showLicenseTab')` | `[读]` leftover：`/admin/subscription` 打 Konami 后仍是 Community 卡，**无 license tab**。不发明第二次成功。shot `08-subscription-page.webp` `09-konami-leftover.webp` | core+admin | （无） | `apps/meteor/client/views/admin/subscription/SubscriptionPage.tsx:39-42` |

**A 计数**：10。调用点 6。实机：`[实测]` 4（classic K/P/Esc + Shift+?）+ leftover 6（AI×3 + Alt legacy/v2 + Konami）= 10。

互斥挂载（不是排除，只是运行时二选一）：

- 搜索：`NavBarNavigation.tsx:18-24` `FeaturePreview feature='aiSearch'`。
- 侧栏：`LayoutWithSidebar.tsx:67+` `FeaturePreview feature='secondarySidebar'`。

---

## 5. 文档集 — `SHORTCUTS` 9 条 vs 真实绑定

`rg -c "id: '"` → **9**。帮助 modal 列出的不等于 `tinykeys` 闭集。

| 稳定语义 id | 功能一句话 | 和弦或常量 | 门控 | 触发后果 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `kb.doc.openKeyboardShortcuts` | 打开快捷键说明 | Mac/其他：`Shift+?` | 同 `kb.reg.shortcuts.shift-question` | `[实测]` modal 第 1 行：Show keyboard shortcuts = `Shift + ?`。已绑定。shot `06b-shortcuts-all-rows.webp` `18b-shortcuts-from-menu.webp` | core | `kb.reg.shortcuts.shift-question` | `KeyboardShortcutsModal.tsx:18-21` |
| `kb.doc.openSearch` | 打开频道/用户搜索 | Mac：`Command+P`/`Command+K`；其他：`Control+P`/`Control+K` | 搜索组件已挂 | `[实测]` modal 第 2 行 Linux：`Ctrl + P` or `Ctrl + K`。和弦已走。shot `06b` + `03`/`05` | core | `kb.reg.search.mod-k.*` | `KeyboardShortcutsModal.tsx:23-29` |
| `kb.doc.markAllAsRead` | 标全部未读为已读 | Mac 文案：`Shift+Escape`；其他：`Control+Escape` | `AppLayout` 调 `useEscapeKeyStroke` | `[实测]` modal 第 3 行 Linux 文案 **Ctrl + Esc**。绑定是 `shiftKey \|\| ctrlKey` + `Escape`，**不是** tinykeys。**Shift+Esc**（先点开输入区）→「Clear all unreads?」`13-shift-esc.webp`；Tab 仍在 modal `14-markall-modal-tab.webp`；Esc 关后房间还在、焦点回 listitem `15-markall-modal-esc-restore.webp`。**Ctrl+Esc** 被 Xfce 系统菜单抢走 `10-ctrl-escape-system-menu.webp`（OS steal，不是 unbound）。未点「Yes, clear all!」。Round-1 `documented-unbound` **在本冻结不成立** | core | `kb.adj.escape.mark-all` | `KeyboardShortcutsModal.tsx:32-34`；`useEscapeKeyStroke.ts:22-44` |
| `kb.doc.editPreviousMessage` | 编辑上一条自己的消息 | `ArrowUp` | 焦点 textarea 且 `selectionEnd===0` | `[实测]` modal 第 4 行：`Up arrow`。**未按** composer ↑（只对文案）。shot `06b` | core | `kb.adj.composer.arrow-up` | `KeyboardShortcutsModal.tsx:37-39`；`MessageBox.tsx:253-263` |
| `kb.doc.moveToBeginningHorizontal` | 移到消息开头（水平） | Mac：`Command+ArrowLeft`；其他：`Alt+ArrowLeft` | 浏览器 textarea 原生 | `[实测]` modal 第 5 行 Linux：`Alt + Left arrow`。**无 RC handler**（只对文案）。shot `06b` | core（文档） | `kb.doc.moveToEndHorizontal` | `KeyboardShortcutsModal.tsx:42-44` |
| `kb.doc.moveToBeginningVertical` | 移到消息开头（垂直） | Mac：`Command+ArrowUp`；其他：`Alt+ArrowUp` | 同左 | `[实测]` modal 第 6 行：`Alt + Up arrow`。无 RC handler。shot `06b` | core（文档） | `kb.doc.editPreviousMessage` | `KeyboardShortcutsModal.tsx:47-49` |
| `kb.doc.moveToEndHorizontal` | 移到消息末尾（水平） | Mac：`Command+ArrowRight`；其他：`Alt+ArrowRight` | 浏览器原生 | `[实测]` modal 第 7 行：`Alt + Right arrow`。无 RC handler。shot `06b` | core（文档） | `kb.doc.moveToBeginningHorizontal` | `KeyboardShortcutsModal.tsx:52-54` |
| `kb.doc.moveToEndVertical` | 移到消息末尾（垂直） | Mac：`Command+ArrowDown`；其他：`Alt+ArrowDown` | 浏览器原生 | `[实测]` modal 第 8 行：`Alt + Down arrow`。无 RC handler。shot `06b` | core（文档） | `kb.adj.composer.arrow-down` | `KeyboardShortcutsModal.tsx:57-59` |
| `kb.doc.newLine` | 插入换行不发送 | `Shift+Enter`（文案两侧相同） | `sendOnEnter` 偏好 | `[实测]` modal 第 9 行：`Shift + Enter`。**未在 composer 按**（只对文案）。shot `06b` | core+preference | `kb.adj.composer.enter` | `KeyboardShortcutsModal.tsx:62-64`；`MessageBox.tsx:223-232` |

**文档集计数**：9。modal 实机 9 行与纸面 `id:` 对齐（Linux 标签）。其中绑定 5（含 mark-all 的非 tinykeys 绑定）、纯文档/UA 原生 4。

---

## 6. 邻接键盘绑定（不进闭集 A）

这些不是 `tinykeys(`。列出来避免把「帮助有 / 房间有」漏成空洞。

| 稳定语义 id | 功能一句话 | 和弦或常量 | 门控 | 触发后果 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `kb.adj.escape.mark-all` | Shift/Ctrl+Escape 清全部未读 | `Escape` + `shiftKey \|\| ctrlKey` | `AppLayout.tsx:56` | `[实测]` ①Shift+Esc →「Clear all unreads?」。②未确认 mutation。③Ctrl+Esc = OS 菜单。shot `13-shift-esc.webp` `10-ctrl-escape-system-menu.webp` | core | `kb.doc.markAllAsRead` | `useEscapeKeyStroke.ts:22-44` |
| `kb.adj.escape.room-read` | 房间内裸 Escape 标当前房已读 | `keyup` `Escape` | `ReadStateManager.handleWindowEvents` | `[读]` ①未读条可消。②`POST /v1/subscriptions.read`。③persist。与 mark-all 和弦不同（无 Shift/Ctrl） | core | `time.hof.mark-as-read` | `readStateManager.ts:97-105` |
| `kb.adj.composer.enter` | Enter 发送或换行 | Enter / 修饰+Enter | `sendOnEnter`；`keyCodes.CARRIAGE_RETURN \|\| NEW_LINE` | `[读]` ①发送或 `insertNewLine`。②`POST /v1/chat.sendMessage` 或无。③同 send | core+preference | `kb.doc.newLine` | `MessageBox.tsx:218-235` |
| `kb.adj.composer.escape` | Escape 退出编辑或空内容回调 | `Escape` | textarea 焦点 | `[读]` ①`closeEditing`；空则 `onEscape`（线程可关面板）。②无 REST。③不持久 | core | `kb.doc.editPreviousMessage` | `MessageBox.tsx:247-250` |
| `kb.adj.composer.arrow-up` | 行首 ↑ 上一条自己的 | `ArrowUp` 且 `selectionEnd===0` | `canSend`；有历史 | `[读]` ①editing。②无 REST。③不持久 | core | `kb.doc.editPreviousMessage` | `MessageBox.tsx:253-263` |
| `kb.adj.composer.arrow-down` | 文末 ↓ 下一条 | `ArrowDown` 且 `selectionEnd===length` | 编辑链中 | `[读]` ①切下一条或退出。②无 REST。③不持久 | core | `kb.doc.moveToEndVertical` | `MessageBox.tsx:268-276` |
| `kb.adj.composer.format-b` | Ctrl/Cmd+B 加粗 | `command:'b'` | `isCmdOrCtrlPressed`；formatter 有 `command` | `[读]` ①`wrapSelection('*{{text}}*')`。②无 REST。③随草稿 | core | `kb.adj.composer.format-i` | `MessageBox.tsx:59-76,238`；`messageBoxFormatting.ts:35-40` |
| `kb.adj.composer.format-i` | Ctrl/Cmd+I 斜体 | `command:'i'` | 同左 | `[读]` ①`_{{text}}_`。②无。③随草稿。strike/code/link **无** `command` | core | `kb.adj.composer.format-b` | `messageBoxFormatting.ts:41-46` |
| `kb.adj.composer.focus-on-type` | 非输入区敲可打印键拉回 composer | keyCode 46–90 或 8；非 Ctrl/Cmd | `useMessageBoxAutoFocus`；目标不是 input/textarea/select | `[读]` ①`textarea` focus。②无。③无 | core | `kb.adj.composer.enter` | `useMessageBoxAutoFocus.ts:13-36` |
| `kb.adj.popup.nav` | 补全弹层 ↑↓ Enter/Tab Esc | ArrowUp/Down / Enter / Tab / Esc | `useComposerBoxPopup` 有 option | `[读]` ①改 `aria-selected` 或选中/关掉。②可能已 spotlight。③随草稿 | core | `kb.adj.composer.escape` | `useComposerBoxPopup.ts:160-228` |
| `kb.adj.search.listbox` | 搜索框 ↑↓ / Shift+Tab / Esc | ArrowUp/Down；Shift+Tab；Escape | overlay 开 | `[读]` ①焦点进 `role=option` 或关 overlay。②无。③无 | core | `kb.reg.search.mod-k.classic` | `useSearchNavigation.ts:41-63` |
| `kb.adj.msglist.tab` | 消息列表 Shift+Tab / Tab / ↑↓ | Tab；Shift+Tab；ArrowUp/Down | 焦点 `role=listitem` | `[读]` ①回 header / 到 textarea / 相邻 listitem。②无。③无 | core | `focus.list.message` | `useMessageListNavigation.ts:31-67` |
| `kb.adj.sidebar.arrows` | 侧栏房间 ↑↓ 与 Tab 逃出列表 | ArrowUp/Down；Tab | listitem 或 collapse group | `[读]` ①相邻房间或跳出列表。②无。③无 | core | `kb.reg.sidebar.alt.*` | `useSidebarListNavigation.ts`（legacy `:23` / v2 `:24`） |
| `kb.adj.members.arrows` | 成员列表键盘导航 | keydown on list | 成员栏打开 | `[读]` ①成员项焦点移动。②无。③无 | core | `focus.list.members` | `useMembersListNavigation.ts:49` |
| `kb.adj.modal.esc` | 模态 Esc 关闭 | `Escape` | `ModalBackdrop` 已挂 | `[读]` ①`onDismiss`。②无。③无 | core | `focus.scope.modal` | `packages/ui-client/src/components/Modal/ModalBackdrop.tsx:7-21` |
| `kb.adj.contextualbar.esc` | 上下文栏 Esc 关 tab | `Escape` | `ContextualbarDialog` | `[读]` ①`closeTab` / `onClose`。②无。③无 | core | `focus.scope.contextualbar` | `ContextualbarDialog.tsx:30-33` |
| `kb.adj.history.keys` | PageUp 等只标记「用户已交互」以加载历史 | PageUp/Down；ArrowUp/Down；Home/End | 消息滚动容器 | `[读]` ①翻 `userInteracted`；真正拉页看节流。②`RoomHistoryManager.getMore*`。③刷新重拉 | core | `time.hof.get-more` | `useGetMore.ts:88-98` |

**邻接计数**：17。不计入闭集 A 的 10。

---

## 7. 闭集 B — Focus order

`<FocusScope` JSX **13**。再加 skip-link 与 `#main-content`（不是 FocusScope，但是焦点顺序的产品入口）。

布局 DOM 顺序（`LayoutWithSidebar.tsx:56-59`）：`AccessibilityShortcut` → `NavBar` → `#rocket-chat`（侧栏 FeaturePreview + `MainContent`）。

| 稳定语义 id | 功能一句话 | 和弦或常量 | 门控 | 触发后果 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `focus.skip.main` | 第一个 Tab 露出「跳到主内容」 | 链到 `#main-content` | 未 `:focus` 时 clip 成 1×1 | `[读]` leftover：未专门 Tab 出 skip-link。①`a` `Skip_to_main_content` | core | `focus.main-content` | `AccessibilityShortcut.tsx:11-29`；`LayoutWithSidebar.tsx:58` |
| `focus.main-content` | 主列 `main#main-content` | hash `#main-content` | 已登录主壳 | `[读]` leftover：未走 `#main-content` hash | core | `focus.skip.main` | `MainContent.tsx:23-26` |
| `focus.scope.navbar-search` | 顶栏搜索包一层 FocusScope | （无 trap） | 非 embed | `[实测]` ①Ctrl+K 后搜索获焦 + Recent listbox。②无。③无。shot `03-ctrl-k-search.webp` | core | `kb.reg.search.mod-k.*` | `NavBarNavigation.tsx:17` |
| `focus.scope.sidebar.legacy` | 旧侧栏 FocusScope | （无 trap） | `secondarySidebar` Off | `[实测]` ①legacy 侧栏已挂（Channels / `# general`）。无 contain trap。②无。③无。shot `02-home.webp` `22-alt-sidebar-retry.webp` | core+preview | `kb.adj.sidebar.arrows` | `sidebar/SidebarRegion.tsx:93` |
| `focus.scope.nav.primary` | 新导航第一块 FocusScope | （无 trap） | `secondarySidebar` On | `[读]` leftover：v2 导航未挂。shot `19-feature-preview.webp` | core+preview | `focus.scope.nav.secondary` | `NavigationRegion.tsx:95` |
| `focus.scope.nav.secondary` | 新导航第二块 FocusScope | （无 trap） | 同左 | `[读]` leftover 同左 | core+preview | `focus.scope.nav.primary` | `NavigationRegion.tsx:102` |
| `focus.scope.room.invite` | 邀请订阅房间整页 FocusScope | （无 trap） | `isInviteSubscription` | `[读]` leftover：无 invite 订阅房间 | core | `focus.scope.room` | `Room.tsx:44` |
| `focus.scope.room` | 普通房间壳 FocusScope | （无 trap） | 非 invite | `[实测]` ①`#general` 房间壳。关 mark-all 后焦点回到消息 listitem 蓝框。②无。③无。shot `15-markall-modal-esc-restore.webp` | core | `kb.adj.msglist.tab` | `Room.tsx:53` |
| `focus.scope.contextualbar` | 上下文栏 autoFocus + restoreFocus | Esc 关栏 | toolbox tab 打开 | `[实测]` ①Channel info `/channel-settings`。Tab 仍在栏内。未截关栏还焦。②无。③无。shot `12-room-contextual-bar.webp` `12b-contextual-bar-tab-focus.webp` | core | `kb.adj.contextualbar.esc` | `ContextualbarDialog.tsx:40` |
| `focus.scope.modal` | 通用模态 contain + restore + autoFocus | Esc 关 | `ModalRegion` 有 modal | `[实测]` ①Keyboard shortcuts / Clear all unreads / Create channel。打开 Name 获焦；Tab → Topic 蓝框；Esc 后 Home 卡片回来。②无。③无。shot `06` `13` `14` `16-create-channel-modal.webp` `16b-create-channel-tab.webp` `17-create-channel-closed.webp` | core | `kb.adj.modal.esc` | `packages/ui-client/src/components/Modal/ModalRegion.tsx:25` |
| `focus.scope.uikit-modal` | UiKit 模态同样 trap | Esc / 忽略栏外键 | UiKit modal | `[读]` leftover：Community 无挂载的 UiKit modal | core+apps | `focus.scope.modal` | `views/modal/uikit/ModalBlock.tsx:177` |
| `focus.scope.image-gallery` | 图片画廊 contain + autoFocus | 画廊打开 | 点消息图 | `[读]` leftover：`#general` 无图片消息 | core | `focus.scope.modal` | `ImageGallery.tsx:133` |
| `focus.scope.videoconf-popup` | 视频会议弹层 restoreFocus | 弹层开 | videoconf popup | `[读]` leftover：未开 videoconf | core | `focus.scope.modal` | `VideoConfPopups.tsx:55` |
| `focus.scope.voip-widget` | 语音 widget 可选 autoFocus | 呼叫 UI | voip 开 | `[读]` leftover：Community 无 voip | core+voip | `focus.scope.voip-keypad` | `packages/ui-voip/src/components/Widget/Widget.tsx:16` |
| `focus.scope.voip-keypad` | 拨号盘 autoFocus | 拨号盘开 | keypad 挂载 | `[读]` leftover 同左 | core+voip | `focus.scope.voip-widget` | `packages/ui-voip/src/components/Keypad/Keypad.tsx:26` |
| `focus.list.message` | 时间线 listitem 键盘顺序 | ↑↓ Tab Shift+Tab | 房间/线程消息列表 | `[实测]` 关 mark-all 后焦点在最后一条 listitem（蓝框）。↑↓ 邻条未另走。shot `15-markall-modal-esc-restore.webp` | core | `kb.adj.msglist.tab` | `useMessageListNavigation.ts:15-109`；`RoomBody.tsx:102`；`ThreadMessageList.tsx:121` |
| `focus.list.sidebar` | 侧栏房间键盘顺序 | ↑↓ Tab | 旧或新 RoomList | `[读]` 见 `kb.adj.sidebar.arrows` | core | `kb.adj.sidebar.arrows` | `sidebar/RoomList/useSidebarListNavigation.ts`；`navigation/sidebar/RoomList/useSidebarListNavigation.ts` |
| `focus.list.members` | 成员列表键盘顺序 | keydown | 成员栏 | `[读]` 见 `kb.adj.members.arrows` | core | `kb.adj.members.arrows` | `useMembersListNavigation.ts:7` |

**B 计数**：FocusScope JSX 13 + skip + main + 3 list hooks = **18** 行。`13` 必须能被下面的 `rg '<FocusScope'` 复跑对上。

实机能开：navbar-search / sidebar.legacy / room / contextualbar / modal（+ Create channel）。打不开 leftover：invite / NavigationRegion×2 / ImageGallery / VideoConf / VoIP×2 / UiKit。skip-link 未 Tab 出。

---

## 8. 闭集 C — Throttle / debounce 常量

API 闭集 **107** = `77+20+1+8+1`。

下面 8 列只展开 **HOF**（`withDebouncing`/`withThrottling`，**9**）和 **聊天可感知** 的额外常量（含 107 之外的 `UserAction` lodash debounce）。Admin 表过滤的 `useDebouncedValue(..., 400|500)` 不逐行发明功能名，数字以 §11 命令为准。

### 8.1 HOF `wait:`（9）

| 稳定语义 id | 功能一句话 | 和弦或常量 | 门控 | 触发后果 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `time.hof.draft` | composer 草稿落盘防抖 | `wait: 300` | textarea 有 `createComposerAPI` | `[读]` ①300ms 后 `persistDraft`。②无 REST（本地/订阅草稿）。③刷新可恢复 | core | `kb.adj.composer.enter` | `apps/meteor/app/ui-message/client/messageBox/createComposerAPI.ts:42` |
| `time.hof.find-parent` | 找父消息防抖 | `wait: 500` | 引用/回复链 | `[读]` ①合并多次查找。②读消息缓存/REST。③无 | core | `opt.send` | `apps/meteor/app/ui-message/client/findParentMessage.ts:14` |
| `time.hof.apps-i18n` | Apps 文案 invalidate | `wait: 100` | 已登录 | `[读]` ①短抖动后 refetch。②apps 查询。③无 | core+apps | `time.hook.apps-buttons` | `apps/meteor/client/hooks/useTranslationsForApps.ts:43` |
| `time.hof.presence` | 在线/离开状态防抖 | `wait: 1000` | `enableAutoAway`；idle = `idleTimeLimit` 秒（默认 300 → 300000ms） | `[读]` ①`UserPresence:online` / away method。②method。③状态 persist。`awayTime` 初值 `60_000` 会被偏好覆盖 | core+preference | `time.adj.typing` | `userPresence.ts:19,44,74` |
| `time.hof.mark-as-read` | 标已读防抖 | `wait: 1000` | 有订阅；窗口有焦点 | `[读]` ①`POST /v1/subscriptions.read`。②REST。③persist | core | `kb.adj.escape.room-read` | `readStateManager.ts:141` |
| `time.hof.unread-attempt` | 滚动后尝试标已读 | `wait: 500` | 已订阅 | `[读]` ①`attemptMarkAsRead`。②可能 REST。③persist | core | `time.hof.mark-as-read` | `useUnreadMessages.ts:106` |
| `time.hof.cached-store` | CachedStore 写盘 | `wait: 1000` | 缓存脏 | `[读]` ①本地 persist。②无用户可见 REST。③刷新仍在 | core | （无） | `cachedStores/CachedStore.ts:193` |
| `time.hof.thread-invalidate` | 线程主消息 query 失效 | `wait: 10000` | 线程栏打开 | `[读]` ①10s 后 invalidate。②query。③无 | core | `opt.send` | `useThreadMainMessageQuery.ts:98` |
| `time.hof.get-more` | 历史加载节流（唯一 `withThrottling`） | `wait: 100` | 用户已滚/按 PageUp 等 | `[读]` ①`getMore` / `getMoreNext`。②历史订阅。③刷新重拉 | core | `kb.adj.history.keys` | `useGetMore.ts:24` |

**HOF 计数**：`8+1 = 9`。107 不发明 debounce/throttle DOM；本节保持 `[读]`。

### 8.2 邻接：`UserAction` 打字窗口（不在 107）

`lodash.debounce`，所以 **不计入 107**。漏写它会把「正在输入」窗口弄丢。

| 稳定语义 id | 功能一句话 | 和弦或常量 | 门控 | 触发后果 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `time.adj.typing.emit` | 合并对外发布 user-activity | `debounce(..., 500)` | composer `onTyping` → `action.start('typing')` | `[读]` ①`notify-room` `${rid}/user-activity`。②WS。③15s 无续约则停 | core | `kb.adj.composer.enter` | `UserAction.ts:10-11,41-44`；`ComposerMessage.tsx:68-73` |
| `time.adj.typing.timeout` | 停止「正在输入」 | `TIMEOUT = 15000` | 已 start | `[读]` ①15s 后 `stop`。②再发空活动。③无 | core | `time.adj.typing.emit` | `UserAction.ts:10,143` |
| `time.adj.typing.renew` | 续约间隔 | `RENEW = TIMEOUT/3 = 5000` | 连续 typing | `[读]` ①5s 内不重复 start；`performContinuously` 每 5s start。②WS。③无 | core | `time.adj.typing.timeout` | `UserAction.ts:11,107-111,122-127` |

### 8.3 Hook 调用点（98）— 按 ms 归组，不是 98 条功能

`77+20+1 = 98`。同一数字出现多次 = 多个调用点，不是一个功能。

| ms | API（本树出现） | 代表出处 | 行数（约） |
| --- | --- | --- | --- |
| 5 | `useDebouncedCallback` | `useDateScroll.ts:53`（日期泡，另有 `setTimeout(1000)` 隐藏） | 1 |
| 50 | `useDebouncedValue` | `useRoomList.ts:205`；`RoomsNavigationProvider.tsx:150` | 2 |
| 100 | `useDebouncedValue` / `Callback` / `State` | `useRouteLock.ts:9`；`PrepareImportPage.tsx:188`；`useIsVisible.ts:5`；`useAppActionButtons.ts:36`（100）；`useAppSlashCommands.ts:18`；`useApps.ts:113`；`useHasNewMessages.ts:73`；`useStoreScrollPosition.ts:14`；`ThreadMessageList.tsx:83,95` | 多 |
| 200 | `useDebouncedValue` | `ABACRoomsTab/RoomsPage.tsx:33` | 1 |
| 230 | `useDebouncedCallback` | `Setting.tsx:42`；`ABAC SettingField.tsx:36`（设置编辑落盘） | 2 |
| 300 | `useDebouncedValue` / `Callback` | 房间/用户自动完成；`MessageSearchForm.tsx:34`；`PaginatedVirtualList.tsx:72`；`MessageList.tsx:241`；`BannedUsers.tsx:32`；`RoomMembers.tsx:88`；`TeamsChannels.tsx:71`；`useAISearchResults.ts:12`；fuselage-ui-kit Channels/Users select | 多 |
| 400 | `useDebouncedValue` | 线程/讨论/文件/权限/设置搜索/通话历史/VoIP peer | 多 |
| 500 | `useDebouncedValue` / `Callback` | 顶栏搜索 500（`useSearchItems.ts:39` 等）；大量 Omni/Admin 表；`useWidgetPositionTracker.ts:14` | 多 |
| 700 | `useDebouncedCallback` | UiKit `emitInteraction`：`useModalContextValue.ts:33`；`useContextualBarContextValue.ts:37`；`UiKitSubscriptionLicense.tsx:53` | 3 |
| 800 | `useDebouncedValue` | `RoomMembersWithData.tsx:58`；`TeamsChannelsWithData.tsx:29` | 2 |
| 1000 | `useDebouncedValue` | `UserAutoComplete.tsx:23`；`UserAndRoomAutoCompleteMultiple.tsx:29`；`AutoCompleteDepartmentAgent.tsx:17`；`RoomsAvailableForTeamsAutoComplete.tsx:15` | 4 |
| 10000 | `useDebouncedValue` | `SubscriptionPage.tsx:63`（订阅成功 callout） | 1 |

聊天里另外两个 **不是** debounce API、但影响时序：`useDateScroll.ts:155` 日期泡隐藏 `1000`；`useDateScroll.ts:141` CSS `transition: opacity 0.6s`。

---

## 9. 闭集 D — Optimistic-update window

`export const runOptimistic*` **2**。**没有** `setTimeout` / `wait:` 乐观窗口。窗口 = 本地写入 `temp` 到 REST 结束或 stream 覆盖。

| 稳定语义 id | 功能一句话 | 和弦或常量 | 门控 | 触发后果 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `opt.send` | 发送先本地插入 `temp:true` | **无 ms 窗口** | 非联邦房；有 uid/username；`trim(msg)!==''`；`_id` 尚未在 store | `[实测]` ①`#general` 发出 `vol11-opt-send-20260822`，listitem 立即出现（未见 pending spinner）。②REST 随后成功。③联邦跳过 leftover（无 federated room，不发明 Matrix）。REST fail leftover（未诱发；不伪造 rollback）。shot `11-optimistic-send.webp` | core | `kb.adj.composer.enter` | `app/lib/client/methods/sendMessage.ts:12-51`；`lib/chats/flows/sendMessage.ts:48-60` |
| `opt.reaction` | `+:emoji:` 先改最后一条反应 | **无 ms 窗口** | 消息存在、非 private、emoji 已注册、非只读、已订阅 | `[实测]` ①composer 发送 `+:smile:` 后最后一条出现第二枚 smile，composer 清空，**没有**字面 `+:smile:` 消息。②`POST /v1/chat.react`。③失败 toast leftover（未诱发）。工具栏点 reaction 走 `ReactionMessageAction` REST，**不是** `runOptimisticSetReaction`（对照 `21-reaction-optimistic.webp`）。shot `23-plus-smile-runOptimistic.webp` | core | `kb.adj.composer.enter` | `app/reactions/client/methods/setReaction.ts:8-81`；`processSetReaction.ts:27-32` |

**D 计数**：2。`rg 'export const runOptimistic'` = 2。调用点另 2（`sendMessage.ts:49`、`processSetReaction.ts:27`）。`6` 是「定义+import+调用」命中，不是窗口数。

---

## 10. 验算（不是功能总数）

不要把这些数加出「总功能」。

```
tinykeys 调用           6
tinykeys 和弦           10 = 3+3+1+1+1+1
SHORTCUTS id            9
FocusScope JSX          13
focus 表行              18 = 13 + skip + main + 3 list
debounce/throttle API  107 = 77+20+1+8+1
HOF wait 行             9 = 8+1
runOptimistic 定义      2
Meteor boot             1（200；产品 merge-base e519470）
```

`[实测]` 只给有截图的行；其余 leftover 仍 `[读]`。不要把上面的数加成功能总数。

邻接（不进对应闭集）：keyboard 17；`UserAction` 3；lodash `debounce` 1。

---

## 11. 闭合判据（评审员在 e519470 复跑）

```bash
git rev-parse HEAD
# expect e519470d35b6caf5b228d81aef41c86aab3051f4

# 本冻结没有 apps/meteor/ee/client，不要加进路径
ROOTS='apps/meteor/client apps/meteor/app packages/ui-client packages/ui-contexts packages/ui-voip packages/ui-video-conf packages/fuselage-ui-kit packages/web-ui-registration'
GLOBS='--glob !**/*.spec.* --glob !**/*.test.* --glob !**/tests/** --glob !**/*.stories.*'

# A: tinykeys 调用（去掉 import 行）
rg -n $GLOBS -g '*.{ts,tsx,js,jsx}' 'tinykeys\(' $ROOTS | grep -v 'import tinykeys' | wc -l
# expect 6

# A: 和弦行（本文件）
rg -c '^\| `kb\.reg\.' docs/qa/pm-feature-atlas/round-2/11-keyboard-timing.md
# expect 10

# 文档集
rg -c "id: '" apps/meteor/client/navbar/NavBarSettingsToolbar/UserMenu/KeyboardShortcutsModal.tsx
# expect 9

# B: FocusScope
rg -c $GLOBS -g '*.{ts,tsx}' '<FocusScope' $ROOTS | awk -F: '{s+=$2} END {print s+0}'
# expect 13

# C: 五 API
rg -c $GLOBS -g '*.{ts,tsx,js,jsx}' 'useDebouncedValue\(' $ROOTS | awk -F: '{s+=$2} END {print s+0}'
# expect 77
rg -c $GLOBS -g '*.{ts,tsx,js,jsx}' 'useDebouncedCallback\(' $ROOTS | awk -F: '{s+=$2} END {print s+0}'
# expect 20
rg -c $GLOBS -g '*.{ts,tsx,js,jsx}' 'useDebouncedState\(' $ROOTS | awk -F: '{s+=$2} END {print s+0}'
# expect 1
rg -c $GLOBS -g '*.{ts,tsx,js,jsx}' 'withDebouncing\(' $ROOTS | awk -F: '{s+=$2} END {print s+0}'
# expect 8
rg -c $GLOBS -g '*.{ts,tsx,js,jsx}' 'withThrottling\(' $ROOTS | awk -F: '{s+=$2} END {print s+0}'
# expect 1
# 77+20+1+8+1 = 107

# D
rg -c $GLOBS -g '*.{ts,tsx}' 'export const runOptimistic' $ROOTS | awk -F: '{s+=$2} END {print s+0}'
# expect 2
```

和弦拆分复跑（必须得到 10）：

```bash
python3 - <<'PY'
from pathlib import Path
import re
files = [
    "apps/meteor/client/navbar/NavBarSearch/NavBarSearch.tsx",
    "apps/meteor/client/navbar/NavBarSearch/NavBarAISearch.tsx",
    "apps/meteor/client/views/root/hooks/useKeyboardShortcutsHotkey.tsx",
    "apps/meteor/client/sidebar/hooks/useShortcutOpenMenu.ts",
    "apps/meteor/client/views/navigation/sidebar/hooks/useShortcutOpenMenu.ts",
    "apps/meteor/client/views/admin/subscription/SubscriptionPage.tsx",
]
n = 0
for f in files:
    text = Path(f).read_text()
    i = text.find("tinykeys(")
    assert i != -1, f
    chunk = text[i:i+800]
    quoted = re.findall(r"^\s*'([^']+)'\s*:", chunk, re.M)
    ident = re.findall(r"^\s*([A-Za-z][A-Za-z0-9]*)\s*:\s*\(", chunk, re.M)
    keys = quoted + ident
    print(f, keys)
    n += len(keys)
print("COMBOS", n)
PY
# expect COMBOS 10
# 8 quoted ($mod+K/P, Escape ×2, Shift+?, Konami) + 2 ident (Alt ×2)
```

数字对不上 = 拒收本卷，不要用 develop 行号补。

---

## 12. 已知排除

- **`useHotkeys`**：本树 0。
- **帮助里的行首/行尾四条**：无 RC 注册，只留在文档集。
- **Admin 表 `useDebouncedValue` 过滤**：计入 107，不逐条写成产品快捷键。
- **`lodash.debounce` / `setTimeout` / CSS transition**：除 `UserAction` 与日期泡外不进 107。
- **`apps/meteor/ee/client`**：本冻结路径不存在。
- **livechat visitor widget**（`packages/livechat`）：另一客户端，不进本闭集。
- **debounce/throttle 107**：纸面计数。不发明 DOM 时序实测。
- **打不开的 FocusScope**：invite / v2 NavigationRegion×2 / ImageGallery / VideoConf / VoIP×2 / UiKit。Community + 本库只有 `#general`。
- **Ctrl+Esc**：Xfce 系统菜单，不是 RC unbound。

`file:line` 只保证在 `e519470` 上存在。
