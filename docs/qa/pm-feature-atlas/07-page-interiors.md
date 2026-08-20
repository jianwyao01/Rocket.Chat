# 分册 07 — 页面内部控件（page interiors）

本册把分册 02 / 04 只写成 **入口** 的用户向页面/模态，炸开成 **每一个可操作控件** 一行。不改产品代码。未开浏览器；界面可见性与真实 accessible name 一律标 `[待渲染实测]`。从源码读到的 i18n key、权限、设置、endpoint 标 `[读]`。

**本册不做：** 消息工具条、房间 toolbox / contextual bar 内部、composer、隐式进房、972 个 Settings.json 字段、市场 App 详情、全渠道坐席控制台内部页。键盘快捷键的 **按键绑定** 已在分册 03（`shortcut.*`）；本册只登记「打开说明模态」这一显示面。

**现行 atlas：** 基线 `cursor/pm-atlas-merge-blueprint-d43d`（已含 00–05）。本册 id 全部 `page.*`，对 02/04 父入口是 **NEW 子行**，不复用 `nav.create.*` / `account.*` / `route.admin.*` / `directory.*`。

**id 命名空间：** `page.create.*` `page.account.*` `page.directory.*` `page.home.*` `page.admin.*` `page.audit.*`

## 列约定

| 列 | 含义 |
|---|---|
| 稳定语义 id | 本册唯一；父入口 id 写在「关联」 |
| 功能一句话 | 用户能改/能提交的一件事 |
| 完整入口点击序列 | 从壳层走到该控件；可复放 |
| 门控 | 权限 / 设置 / 许可证；未验证标 `[待渲染实测]` |
| 触发后果三件套 | `界面 / 导航 / 持久化`；须含 endpoint 或写明无请求 |
| 供给 | `core` 或 `EE:<module>`；共享保存 endpoint 写在此列 |
| 关联 | 02/04 父入口 + 本册兄弟 id |
| 出处 | `path:line` + `[读]` |

空行、把整页塌成「打开 X」禁止。共享 `POST /v1/users.setPreferences` 可以，但每个用户可感知控件仍各占一行。

**入口缩写：**

- `顶栏+` = `顶栏左→Create_new`（`useCreateNewItems.ts`）
- `账号侧栏` = `/account` 左侧 `AccountSidebar`
- `管理侧栏` = `/admin` 左侧 `Administration`
- `Home卡` = `/home` `DefaultHomePage` 卡片组

---

## A. 创建模态（完整表单）

02 只写到 `nav.create.channel|team|discussion|dm`「打开模态」。04 只写 `team.create`。本表从打开之后的字段起算。

### A1 Create Channel — `CreateChannelModal.tsx`

表单 `aria-labelledby` → 标题 i18n `Create_channel`。提交：私有 `POST /v1/groups.create`，公开 `POST /v1/channels.create`。重名预检 `GET /v1/rooms.nameExists`。成功 toast `Room_has_been_created`，无 `teamId` 时 `goToRoom`。

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
|---|---|---|---|---|---|---|---|
| `page.create.channel.name` | 填写必填频道名 | `顶栏+→Channel` 或 `Home卡→Create_channel` → textbox `Name`（required） | 菜单：`create-c` OR `create-p`；正则 `UTF8_Channel_Names_Validation`；`UI_Allow_room_names_with_special_chars` 关则禁特殊字符 `[读]` | 界面: `[待渲染实测]` textbox `Name` + 尾图标 hashtag/hashtag-lock ／ 导航: 模态仍开 `[读]` ／ 持久化: 仅本地 RHF，提交才写库 `[读]` | core；提交见 `page.create.channel.submit` | `nav.create.channel` `page.home.create-channel` | `CreateChannelModal.tsx:204-227` `[读]` |
| `page.create.channel.name.required` | 空名提交时拦下 | 同上 → 名空 → `Create` | 同 name | 界面: `[待渲染实测]` `FieldError`=`Required_field(Name)` ／ 导航: 不关模态 `[读]` ／ 持久化: 无 POST `[读]` | core | `page.create.channel.name` | `CreateChannelModal.tsx:211-213` `[读]` |
| `page.create.channel.name.special-chars` | 特殊字符名被客户端拒 | 关特殊名设置 → 输入空格/符号 → 失焦/提交 | `!UI_Allow_room_names_with_special_chars` `[读]` | 界面: `[待渲染实测]` error=`Name_cannot_have_special_characters` + hint `No_spaces_or_special_characters` ／ 导航: 不关 `[读]` ／ 持久化: 无 POST `[读]` | core | `page.create.channel.name` | `CreateChannelModal.tsx:144-146,226` `[读]` |
| `page.create.channel.name.duplicate` | 重名被 rooms.nameExists 拒 | 输入已存在房间名 → 失焦/提交 | 无额外权 | 界面: `[待渲染实测]` error=`Channel_already_exist` ／ 导航: 不关 `[读]` ／ 持久化: `GET /v1/rooms.nameExists` 只读；不 create `[读]` | core | `page.create.channel.name` | `CreateChannelModal.tsx:91,148-151` `[读]` |
| `page.create.channel.topic` | 填写可选主题 | 模态 → textbox `Topic` | 无 | 界面: `[待渲染实测]` textbox `Topic` + hint `Displayed_next_to_name` ／ 导航: 仍开 `[读]` ／ 持久化: 随 submit 进 `extraData.topic` `[读]` | core；同 create POST | `page.create.channel.submit` | `CreateChannelModal.tsx:228-234` `[读]` |
| `page.create.channel.members` | 添加初始成员 | 模态 → combobox `Add_people`（label `Members`） | 无；联邦关时外部分员另见 error 行 | 界面: `[待渲染实测]` `UserAutoCompleteMultiple` placeholder=`Add_people` ／ 导航: 仍开 `[读]` ／ 持久化: 随 submit `members[]` `[读]` | core | `page.create.channel.members.external-rejected` | `CreateChannelModal.tsx:235-247` `[读]` |
| `page.create.channel.members.external-rejected` | 非联邦房拒绝 @external 成员 | 联邦关 → 成员含 `@…` → 提交 | `!federated` 且 `hasExternalMembers` `[读]` | 界面: `[待渲染实测]` error=`You_cannot_add_external_users_to_non_federated_room` ／ 导航: 不关 `[读]` ／ 持久化: 无 create `[读]` | core | `page.create.channel.federated` | `CreateChannelModal.tsx:71,241-243` `[读]` |
| `page.create.channel.private` | 开关私有/公开 | 模态 → switch `Private` | `useCreateChannelTypePermission` 若只剩一种类型则 disabled 并锁死 `[读]` | 界面: `[待渲染实测]` switch `Private`；hint 在 `People_can_only_join_by_being_invited` / `Anyone_can_access` 间切；公开时强制关加密 `[读]` ／ 导航: 仍开 `[读]` ／ 持久化: 决定走 groups vs channels create `[读]` | core | `page.create.channel.encrypted` | `CreateChannelModal.tsx:248-264,129-133` `[读]` |
| `page.create.channel.advanced` | 展开高级设置手风琴 | 模态 → accordion `Advanced_settings` | 无 | 界面: `[待渲染实测]` `AccordionItem` `Advanced_settings` 展开，露出 Security_and_permissions 四开关 ／ 导航: 仍开 `[读]` ／ 持久化: 无 `[读]` | core | `page.create.channel.federated` | `CreateChannelModal.tsx:266-268` `[读]` |
| `page.create.channel.federated` | 开关矩阵联邦 | 高级 → switch `Federation_Matrix_Federated` | 许可模块 `federation` + `useIsFederationEnabled` + `access-federation`；否则 disabled，hint 分别为 premium / disabled / not-authorized `[读]` | 界面: `[待渲染实测]` switch + hint 四态之一；开则强制关 encrypted/broadcast/readOnly `[读]` ／ 导航: 仍开 `[读]` ／ 持久化: 随 submit `extraData.federated` `[读]` | EE:federation（完整可用）；无模块仍见 disabled 开关 | `page.create.channel.members.external-rejected` | `CreateChannelModal.tsx:55-89,272-282` `[读]` |
| `page.create.channel.encrypted` | 开关频道 E2E | 高级 → switch `Encrypted` | `E2E_Enable`；仅私有；联邦时 disabled；默认值 `E2E_Enabled_Default_PrivateRooms` `[读]` | 界面: `[待渲染实测]` switch `Encrypted` + `useEncryptedRoomDescription('channel')` hint ／ 导航: 仍开 `[读]` ／ 持久化: 随 submit `extraData.encrypted` `[读]` | core（E2E 设置） | `page.create.channel.private` | `CreateChannelModal.tsx:283-293,188` `[读]` |
| `page.create.channel.readonly` | 开关只读 | 高级 → switch `Read_only` | `set-readonly`（scoped owner）；broadcast 或 federated 时 disabled `[读]` | 界面: `[待渲染实测]` switch；hint `Read_only_field_hint_enabled` / `Anyone_can_send_new_messages` ／ 导航: 仍开 `[读]` ／ 持久化: 随 submit `readOnly` `[读]` | core | `page.create.channel.broadcast` | `CreateChannelModal.tsx:294-308` `[读]` |
| `page.create.channel.broadcast` | 开关广播（并连带只读） | 高级 → switch `Broadcast` | federated 时 disabled `[读]` | 界面: `[待渲染实测]` switch；开则 hint `Broadcast_hint_enabled` 且 readOnly 被 set true `[读]` ／ 导航: 仍开 `[读]` ／ 持久化: 随 submit `extraData.broadcast` `[读]` | core | `page.create.channel.readonly` | `CreateChannelModal.tsx:309-319,135-137` `[读]` |
| `page.create.channel.cancel` | 取消不建房 | 模态 → `Cancel` 或 `Close` | 无 | 界面: `[待渲染实测]` dialog `Create_channel` 消失 ／ 导航: 回打开前页 `[读]` ／ 持久化: 无 `[读]` | core | `nav.create.channel` | `CreateChannelModal.tsx:201,326` `[读]` |
| `page.create.channel.submit` | 提交创建频道 | 填完 → `Create` | 同打开菜单；服务端再检 create-c/create-p `[读]` | 界面: `[待渲染实测]` 成功 toast `Room_has_been_created`，模态关；失败 toast error `[读]` ／ 导航: 无 teamId 则进新房；有 teamId 只 reload 列表不跳房 `[读]` ／ 持久化: `POST /v1/groups.create` 或 `/v1/channels.create` `[读]` | core | `nav.create.channel` `team.create` | `CreateChannelModal.tsx:156-186,327-329` `[读]` |
| `page.create.channel.submit.permission-denied` | 无权时提交失败 | 菜单因缓存仍可见但服务端拒（或只剩一种类型的锁）→ `Create` | 缺 `create-c`/`create-p` 或类型被锁 `[读]` | 界面: `[待渲染实测]` toast error（服务端 error-not-authorized）／ 导航: 不进房 `[读]` ／ 持久化: create 失败 `[读]` | core | `page.create.channel.submit` | `CreateChannelModal.tsx:183-185` `[读]` |
| `page.create.channel.team-parent` | 从团队频道列表建房时带上 teamId | 团队主房 → toolbox `Team_Channels` → 新建频道（`teamId`+`mainRoom`）→ 同表单 → `Create` | 团队内 `create-team-channel` / `create-team-group` 经 `useCreateChannelTypePermission(mainRoom._id)` `[读]` | 界面: `[待渲染实测]` **无额外字段**；Private 可能被锁 ／ 导航: **不** `goToRoom`，只 `reload` 团队频道表 `[读]` ／ 持久化: create `extraData.teamId` `[读]` | core | `room.toolbox.team-channels` `page.create.channel.submit` | `CreateChannelModal.tsx:38-42,97,167-178` `[读]` |

`rg -c 'name=' apps/meteor/client/navbar/NavBarPagesGroup/actions/CreateChannelModal.tsx` 表单字段：`name` `topic` `members` `isPrivate` `federated` `encrypted` `readOnly` `broadcast` = **8** 可改字段。本表字段行 8 + 校验/取消/提交/team 变体 = 17。

### A2 Create Team — `CreateTeamModal.tsx`

标题 `Teams_New_Title`。提交 `POST /v1/teams.create`。重名 `GET /v1/rooms.nameExists`。成功 toast `Team_has_been_created` 后 `goToRoom(team.roomId)`。**无联邦开关。**

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
|---|---|---|---|---|---|---|---|
| `page.create.team.name` | 填写必填团队名 | `顶栏+→Team` → textbox `Teams_New_Name_Label` | 菜单：`create-team` AND (`create-c` OR `create-p`) `[读]` | 界面: `[待渲染实测]` textbox + team/team-lock 图标 ／ 导航: 仍开 `[读]` ／ 持久化: 仅本地 `[读]` | core；提交 `POST /v1/teams.create` | `nav.create.team` `team.create` | `CreateTeamModal.tsx:169-191` `[读]` |
| `page.create.team.name.required` | 空名提交被拦 | 名空 → `Create` | 同 name | 界面: `[待渲染实测]` `Required_field(Name)` ／ 导航: 不关 `[读]` ／ 持久化: 无 POST `[读]` | core | `page.create.team.name` | `CreateTeamModal.tsx:176` `[读]` |
| `page.create.team.name.special-chars` | 特殊字符名被拒 | 关特殊名 → 非法字符 → 提交 | `!UI_Allow_room_names_with_special_chars` `[读]` | 界面: `[待渲染实测]` `Name_cannot_have_special_characters` ／ 导航: 不关 `[读]` ／ 持久化: 无 `[读]` | core | `page.create.team.name` | `CreateTeamModal.tsx:74-76,190` `[读]` |
| `page.create.team.name.duplicate` | 重名被拒 | 已存在名 → 提交 | 无 | 界面: `[待渲染实测]` `Teams_Errors_Already_exists` ／ 导航: 不关 `[读]` ／ 持久化: `GET /v1/rooms.nameExists` `[读]` | core | `page.create.team.name` | `CreateTeamModal.tsx:56,78-81` `[读]` |
| `page.create.team.topic` | 填写可选主题 | 模态 → `Topic` | 无 | 界面: `[待渲染实测]` textbox `Topic` ／ 导航: 仍开 `[读]` ／ 持久化: `room.extraData.topic` `[读]` | core | `page.create.team.submit` | `CreateTeamModal.tsx:192-200` `[读]` |
| `page.create.team.members` | 添加初始成员 | 模态 → `Teams_New_Add_members_Label` / `Add_people` | 无 | 界面: `[待渲染实测]` 成员多选 ／ 导航: 仍开 `[读]` ／ 持久化: `members[]` `[读]` | core | `page.create.team.submit` | `CreateTeamModal.tsx:201-210` `[读]` |
| `page.create.team.private` | 开关私有团队 | 模态 → switch `Teams_New_Private_Label` | `canOnlyCreateOneType` 则 disabled `[读]` | 界面: `[待渲染实测]` switch；公开则关加密 `[读]` ／ 导航: 仍开 `[读]` ／ 持久化: `type` 1/0 `[读]` | core | `page.create.team.encrypted` | `CreateTeamModal.tsx:211-228` `[读]` |
| `page.create.team.advanced` | 展开高级设置 | 模态 → `Advanced_settings` | 无 | 界面: `[待渲染实测]` 手风琴展开 ／ 导航: 仍开 `[读]` ／ 持久化: 无 `[读]` | core | `page.create.team.encrypted` | `CreateTeamModal.tsx:230-232` `[读]` |
| `page.create.team.encrypted` | 开关团队 E2E | 高级 → `Teams_New_Encrypted_Label` | 仅私有且 `E2E_Enable` `[读]` | 界面: `[待渲染实测]` switch + team 加密 hint ／ 导航: 仍开 `[读]` ／ 持久化: `room.extraData.encrypted` `[读]` | core | `page.create.team.private` | `CreateTeamModal.tsx:236-248` `[读]` |
| `page.create.team.readonly` | 开关只读 | 高级 → `Teams_New_Read_only_Label` | `set-readonly`；broadcast 时 disabled `[读]` | 界面: `[待渲染实测]` switch + team 只读 hint ／ 导航: 仍开 `[读]` ／ 持久化: `room.readOnly` `[读]` | core | `page.create.team.broadcast` | `CreateTeamModal.tsx:249-263` `[读]` |
| `page.create.team.broadcast` | 开关广播 | 高级 → `Teams_New_Broadcast_Label` | 无联邦锁（团队无 federated 字段）`[读]` | 界面: `[待渲染实测]` switch；开则 hint `Teams_New_Broadcast_Description` 且 readOnly=true `[读]` ／ 导航: 仍开 `[读]` ／ 持久化: `room.extraData.broadcast` `[读]` | core | `page.create.team.readonly` | `CreateTeamModal.tsx:264-274,104-110` `[读]` |
| `page.create.team.cancel` | 取消不建团队 | `Cancel` 或 `Close` | 无 | 界面: `[待渲染实测]` dialog `Teams_New_Title` 消失 ／ 导航: 回前页 `[读]` ／ 持久化: 无 `[读]` | core | `nav.create.team` | `CreateTeamModal.tsx:162,281` `[读]` |
| `page.create.team.submit` | 提交创建团队 | `Create` | 按钮 `disabled={!canCreateTeam}`（`create-team`）`[读]` | 界面: `[待渲染实测]` toast `Team_has_been_created` ／ 导航: 进 `team.roomId` `[读]` ／ 持久化: `POST /v1/teams.create` `[读]` | core | `team.create` `directory.teams` | `CreateTeamModal.tsx:118-149,282-284` `[读]` |
| `page.create.team.submit.permission-denied` | 无 create-team 时按钮不可点 | 侧门打开模态但缺 `create-team` → `Create` disabled | `!create-team` `[读]` | 界面: `[待渲染实测]` `Create` disabled ／ 导航: 不进房 `[读]` ／ 持久化: 无 POST `[读]` | core | `page.create.team.submit` | `CreateTeamModal.tsx:54,282` `[读]` |

`name=` 字段：`name` `topic` `members` `isPrivate` `encrypted` `readOnly` `broadcast` = **7**。本表字段 7 + 校验/手风琴/取消/提交 = 14。

### A3 Create Discussion — `CreateDiscussion.tsx`

`GenericModal` 标题 `Discussion_title`，`confirmText=Create` `cancelText=Cancel`。提交 `POST /v1/rooms.createDiscussion`。加密父房时首条回复被丢掉（`reply: encrypted ? undefined : firstMessage`）。

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
|---|---|---|---|---|---|---|---|
| `page.create.discussion.parent` | 选择父房间 | `顶栏+→Discussion` → combobox `Discussion_target_channel` / `Search_options` | 菜单：(`start-discussion` OR `start-discussion-other-user`) + `Discussion_enabled`；从消息「创建讨论」时 `defaultParentRoom` 只读 `[读]` | 界面: `[待渲染实测]` `RoomAutoComplete` 或只读 `DefaultParentRoomField`；加密父房显示 key 图标 `[读]` ／ 导航: 仍开 `[读]` ／ 持久化: 提交 `prid` `[读]` | core | `nav.create.discussion` `room.toolbox.discussions` | `CreateDiscussion.tsx:120-150` `[读]` |
| `page.create.discussion.parent.required` | 未选父房被拦 | 无 defaultParent → 不选房 → `Create` | `!defaultParentRoom` `[读]` | 界面: `[待渲染实测]` `Required_field(Discussion_target_channel)` ／ 导航: 不关 `[读]` ／ 持久化: 无 POST `[读]` | core | `page.create.discussion.parent` | `CreateDiscussion.tsx:134` `[读]` |
| `page.create.discussion.name` | 填写讨论名 | 模态 → `Name`（required，气球图标） | 可带 `nameSuggestion` 预填 `[读]` | 界面: `[待渲染实测]` textbox `Name` ／ 导航: 仍开 `[读]` ／ 持久化: 提交 `t_name` `[读]` | core | `page.create.discussion.submit` | `CreateDiscussion.tsx:151-164` `[读]` |
| `page.create.discussion.name.required` | 空名被拦 | 名空 → `Create` | 同 name | 界面: `[待渲染实测]` `Required_field(Name)` ／ 导航: 不关 `[读]` ／ 持久化: 无 `[读]` | core | `page.create.discussion.name` | `CreateDiscussion.tsx:157` `[读]` |
| `page.create.discussion.topic` | 填写可选主题 | 模态 → `Topic` | 无 | 界面: `[待渲染实测]` textbox + `Displayed_next_to_name` ／ 导航: 仍开 `[读]` ／ 持久化: `topic` `[读]` | core | `page.create.discussion.submit` | `CreateDiscussion.tsx:165-173` `[读]` |
| `page.create.discussion.members` | 添加讨论成员 | 模态 → `Members` / `Add_people` | 无 | 界面: `[待渲染实测]` 多选 ／ 导航: 仍开 `[读]` ／ 持久化: `users` `[读]` | core | `page.create.discussion.submit` | `CreateDiscussion.tsx:174-183` `[读]` |
| `page.create.discussion.reply` | 填写首条消息 | 模态 → textarea `Discussion_first_message_title` | 加密时 disabled，hint `Discussion_first_message_disabled_due_to_e2e` `[读]` | 界面: `[待渲染实测]` textarea 5 行；加密则不可输入 `[读]` ／ 导航: 仍开 `[读]` ／ 持久化: 非加密才作为 `reply` `[读]` | core | `page.create.discussion.encrypted` | `CreateDiscussion.tsx:184-198,99` `[读]` |
| `page.create.discussion.encrypted` | 开关讨论加密 | 模态 → switch `Encrypted` | 父房已加密则 disabled 且默认开 `[读]` | 界面: `[待渲染实测]` switch + discussion 加密 hint；开则禁用首条 `[读]` ／ 导航: 仍开 `[读]` ／ 持久化: 加密时 `reply` 被丢掉 `[读]` | core | `page.create.discussion.reply` | `CreateDiscussion.tsx:199-209,72-78` `[读]` |
| `page.create.discussion.cancel` | 取消不建讨论 | `Cancel` | 无 | 界面: `[待渲染实测]` warning dialog 消失 ／ 导航: 回前页 `[读]` ／ 持久化: 无 `[读]` | core | `nav.create.discussion` | `CreateDiscussion.tsx:108-116` `[读]` |
| `page.create.discussion.submit` | 提交创建讨论 | `Create` | 同菜单；mutation pending 时 confirmLoading `[读]` | 界面: `[待渲染实测]` 模态关 ／ 导航: `goToRoom(discussion._id)` `[读]` ／ 持久化: `POST /v1/rooms.createDiscussion`（可选 `pmid`）`[读]` | core | `nav.create.discussion` | `CreateDiscussion.tsx:82-103` `[读]` |

`name=` 字段：`parentRoom` `name` `topic` `usernames` `firstMessage` `encrypted` = **6**。本表 10 行。

### A4 Create Direct Message — `CreateDirectMessage.tsx`

标题 `Create_direct_message`。提交 `POST /v1/dm.create` `{usernames: join(',')}`。成功 `goToRoom(rid)`；`onSettled` 关模态。

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
|---|---|---|---|---|---|---|---|
| `page.create.dm.users` | 选择私聊对象（可多人） | `顶栏+→Direct_message` → 多选（label=`Direct_message_creation_description`） | 菜单 `create-d`；人数上限 `DirectMesssage_maxUsers`（含自己 +1）`[读]` | 界面: `[待渲染实测]` `UserAutoCompleteMultiple` federated + hint `Direct_message_creation_description_hint` ／ 导航: 仍开 `[读]` ／ 持久化: 仅本地 `[读]` | core | `nav.create.dm` | `CreateDirectMessage.tsx:67-96` `[读]` |
| `page.create.dm.users.required` | 未选用户被拦 | 空选 → `Create` | 同 users | 界面: `[待渲染实测]` `Direct_message_creation_error` ／ 导航: 不关 `[读]` ／ 持久化: 无 POST `[读]` | core | `page.create.dm.users` | `CreateDirectMessage.tsx:74` `[读]` |
| `page.create.dm.users.max` | 超过人数上限被拦 | 选超过 `maxUsers-1` 人 → `Create` | `DirectMesssage_maxUsers` `[读]` | 界面: `[待渲染实测]` `error-direct-message-max-user-exceeded` ／ 导航: 不关 `[读]` ／ 持久化: 无 `[读]` | core | `page.create.dm.users` | `CreateDirectMessage.tsx:75-78` `[读]` |
| `page.create.dm.cancel` | 取消不建 DM | `Cancel` 或 `ModalClose` | 无 | 界面: `[待渲染实测]` dialog 消失 ／ 导航: 回前页 `[读]` ／ 持久化: 无 `[读]` | core | `nav.create.dm` | `CreateDirectMessage.tsx:64,101` `[读]` |
| `page.create.dm.submit` | 提交创建/打开 DM | `Create` | `create-d`；loading 为 isSubmitting 或 isValidating `[读]` | 界面: `[待渲染实测]` 关模态；失败 toast 仍关（onSettled）`[读]` ／ 导航: `goToRoom(rid)` `[读]` ／ 持久化: `POST /v1/dm.create` `[读]` | core | `nav.create.dm` `user.action.direct-message` | `CreateDirectMessage.tsx:30-55,102-104` `[读]` |
| `page.create.dm.submit.error` | 服务端拒建（含无权） | 选人 → `Create` → API 错 | 服务端 create-d / 联邦 / 封锁等 `[读]` | 界面: `[待渲染实测]` toast error **且模态仍关** ／ 导航: 不进房 `[读]` ／ 持久化: 无新 DM `[读]` | core | `page.create.dm.submit` | `CreateDirectMessage.tsx:45-50` `[读]` |

`name=` 字段：`users` = **1**。本表 6 行。

---
## B. 账号页内部控件

04 只写 `account.profile` / `account.preferences` 等「打开页」。本表从页内控件起算。顶栏用户菜单只直达 Profile / Preferences / Accessibility / Feature preview；其余走账号侧栏。

### B1 Profile — `/account/profile`

页标题 `Profile`。资料保存走 `POST /v1/users.updateOwnBasicInfo` + 条件 `POST /v1/users.setStatus` + 条件 `POST /v1/users.setPreferences`（仅 statusVisibilityDenied）+ 头像 `useUpdateAvatar`。页脚 `Save_changes` / `Cancel` 是同一表单。

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
|---|---|---|---|---|---|---|---|
| `page.account.profile.avatar.upload` | 上传本地图作头像 | 顶栏头像→`Profile` → 按钮 title=`Upload` → 选文件 | `Accounts_AllowUserAvatarChange`；否则 disabled `[读]` | 界面: `[待渲染实测]` 预览换成 dataURL；非法格式 toast `Avatar_format_invalid` ／ 导航: 仍在 profile `[读]` ／ 持久化: 点 `Save_changes` 才 `POST /v1/users.setAvatar` `[读]` | core；与 `page.account.profile.save` 同保存 | `account.profile` `nav.user.account.profile` | `UserAvatarEditor.tsx:51,121` `useUpdateAvatar.ts` `[读]` |
| `page.account.profile.avatar.url` | 输入头像 URL | Profile → textbox `Use_url_for_avatar` | 同上 | 界面: `[待渲染实测]` 输入框；未点 Add 不改预览 ／ 导航: 仍在页 `[读]` ／ 持久化: 仅本地 `[读]` | core | `page.account.profile.avatar.add-url` | `UserAvatarEditor.tsx:124-150` `[读]` |
| `page.account.profile.avatar.add-url` | 用 URL 更新头像预览 | URL 非空 → title=`Add_URL` 或 Enter | URL 须 `isSafeAvatarUrl` 且有效图；空则按钮 disabled `[读]` | 界面: `[待渲染实测]` 预览更新 + toast `Avatar_preview_updated`；非法 `error-invalid-image-url` ／ 导航: 仍在页 `[读]` ／ 持久化: Save 时 `POST /v1/users.setAvatar` `{avatarUrl}` `[读]` | core | `page.account.profile.avatar.url` | `UserAvatarEditor.tsx:55-74,130-137` `[读]` |
| `page.account.profile.avatar.reset` | 重置为默认字母头像 | Profile → 按钮 title=`Accounts_SetDefaultAvatar` | 同上 avatar 设置 | 界面: `[待渲染实测]` 预览变 `/avatar/@…` ／ 导航: 仍在页 `[读]` ／ 持久化: Save 时 `POST /v1/users.resetAvatar` `[读]` | core | `page.account.profile.save` | `UserAvatarEditor.tsx:76-79,118-120` `[读]` |
| `page.account.profile.avatar.suggest` | 选用 OAuth 建议头像 | Profile → 各服务名按钮（`UserAvatarSuggestions`） | 有 `GET /v1/users.getAvatarSuggestion` 结果；avatar 设置关则 disabled `[读]` | 界面: `[待渲染实测]` 预览换成 suggestion.blob ／ 导航: 仍在页 `[读]` ／ 持久化: Save 时 `POST /v1/users.setAvatar` 带 service `[读]` | core | `page.account.profile.save` | `UserAvatarEditor.tsx:91-97,122` `[读]` |
| `page.account.profile.name` | 改显示名 | Profile → textbox `Name` | `Accounts_AllowRealNameChange`；`Accounts_RequireNameForSignUp` 时 required `[读]` | 界面: `[待渲染实测]` textbox；禁用时 hint `RealName_Change_Disabled` ／ 导航: 仍在页 `[读]` ／ 持久化: Save → `updateOwnBasicInfo.data.name` `[读]` | core；`POST /v1/users.updateOwnBasicInfo` | `account.profile` | `AccountProfileForm.tsx:216-230` `[读]` |
| `page.account.profile.name.required` | 必填名为空被拦 | requireName 开 → 清空 Name → Save | `Accounts_RequireNameForSignUp` `[读]` | 界面: `[待渲染实测]` `Required_field(Name)` ／ 导航: 不离开 `[读]` ／ 持久化: 无 POST `[读]` | core | `page.account.profile.name` | `AccountProfileForm.tsx:222` `[读]` |
| `page.account.profile.username` | 改用户名 | Profile → textbox `Username`（@ 尾标） | `Accounts_AllowUsernameChange`；正则 `UTF8_User_Names_Validation` `[读]` | 界面: `[待渲染实测]` textbox；禁用 hint `Username_Change_Disabled` ／ 导航: 仍在页 `[读]` ／ 持久化: Save → `data.username`；可用性 `GET /v1/users.checkUsernameAvailability` `[读]` | core | `account.profile` | `AccountProfileForm.tsx:231-254,108-125` `[读]` |
| `page.account.profile.username.invalid` | 用户名不合正则 | 改成非法字符 → 失焦/Save | 同上 regex `[读]` | 界面: `[待渲染实测]` `error-invalid-username` ／ 导航: 不离开 `[读]` ／ 持久化: 无 update `[读]` | core | `page.account.profile.username` | `AccountProfileForm.tsx:117-119` `[读]` |
| `page.account.profile.username.taken` | 用户名已被占用 | 改成他人名 → Save | 无 | 界面: `[待渲染实测]` `Username_already_exist` ／ 导航: 不离开 `[读]` ／ 持久化: availability=false，无 update `[读]` | core | `page.account.profile.username` | `AccountProfileForm.tsx:121-124` `[读]` |
| `page.account.profile.status-type` | 改在线状态点 | Profile → Status 输入框左侧 `UserStatusMenu` | `Accounts_AllowUserStatusMessageChange` 同时管文案；菜单本身随表单 `[读]` | 界面: `[待渲染实测]` 状态点颜色切 ／ 导航: 仍在页 `[读]` ／ 持久化: Save 且 status dirty → `POST /v1/users.setStatus` `{status}` `[读]` | core | `nav.user.status.online` | `AccountProfileForm.tsx:277-281,177-183` `[读]` |
| `page.account.profile.status-text` | 改状态文案（可 emoji） | Profile → textbox placeholder=`StatusMessage_Placeholder` | `Accounts_AllowUserStatusMessageChange`；最长 120 `[读]` | 界面: `[待渲染实测]` textbox；禁用 hint `StatusMessage_Change_Disabled` ／ 导航: 仍在页 `[读]` ／ 持久化: 同 setStatus `{message}` `[读]` | core | `nav.user.status.custom-edit` | `AccountProfileForm.tsx:257-290` `[读]` |
| `page.account.profile.status-duration` | 选择状态自动清除 | Profile → select `Status_clear_after` | 状态可改；online 且无文案时 disabled `[读]` | 界面: `[待渲染实测]` select；custom 时再露日期/时间 ／ 导航: 仍在页 `[读]` ／ 持久化: setStatus `{expiresAt}` `[读]` | core | `page.account.profile.status-text` | `AccountProfileForm.tsx:291-349` `[读]` |
| `page.account.profile.status-custom-date` | 自定义状态过期日期 | duration=`custom` → `aria-label=Status_expiration_date` | 同上 | 界面: `[待渲染实测]` date input ／ 导航: 仍在页 `[读]` ／ 持久化: 并入 expiresAt `[读]` | core | `page.account.profile.status-duration` | `AccountProfileForm.tsx:315-328` `[读]` |
| `page.account.profile.status-custom-time` | 自定义状态过期时间 | duration=`custom` → `aria-label=Status_expiration_time` | 同上 | 界面: `[待渲染实测]` time input ／ 导航: 仍在页 `[读]` ／ 持久化: 并入 expiresAt `[读]` | core | `page.account.profile.status-duration` | `AccountProfileForm.tsx:330-345` `[读]` |
| `page.account.profile.status-visibility` | 选择对谁隐藏状态 | Profile → `Accounts_StatusVisibility_HideStatusFromUsers` 多选 | `Accounts_StatusVisibility_Enabled` 才渲染 `[读]` | 界面: `[待渲染实测]` `UserAutoCompleteMultiple` placeholder=`Select_users` ／ 导航: 仍在页 `[读]` ／ 持久化: Save → `POST /v1/users.setPreferences` `{statusVisibilityDenied}` `[读]` | core | `nav.user.status.visibility` | `AccountProfileForm.tsx:350-369,173-175` `[读]` |
| `page.account.profile.nickname` | 改昵称 | Profile → textbox `Nickname` | 无独立设置门 | 界面: `[待渲染实测]` textbox + edit 图标 ／ 导航: 仍在页 `[读]` ／ 持久化: `updateOwnBasicInfo.data.nickname` `[读]` | core | `page.account.profile.save` | `AccountProfileForm.tsx:371-380` `[读]` |
| `page.account.profile.bio` | 改个人简介 | Profile → textarea `Bio` | 最长 260 `[读]` | 界面: `[待渲染实测]` textarea 3 行；超长 `Max_length_is` ／ 导航: 仍在页 `[读]` ／ 持久化: `data.bio` `[读]` | core | `page.account.profile.save` | `AccountProfileForm.tsx:381-402` `[读]` |
| `page.account.profile.email` | 改自己的邮箱 | Profile → textbox `Email` | `Accounts_AllowEmailChange`；required + `validateEmail` `[读]` | 界面: `[待渲染实测]` textbox；已验证尾标 circle-check，未验证 mail；禁用 hint `Email_Change_Disabled` ／ 导航: 仍在页 `[读]` ／ 持久化: 仅当与旧邮箱不同才写入 `data.email` `[读]` | core | `account.profile` | `AccountProfileForm.tsx:403-440` `[读]` |
| `page.account.profile.email.invalid` | 非法邮箱被拦 | 输入非邮箱 → Save | 同 email | 界面: `[待渲染实测]` `error-invalid-email-address` ／ 导航: 不离开 `[读]` ／ 持久化: 无 `[读]` | core | `page.account.profile.email` | `AccountProfileForm.tsx:417-419` `[读]` |
| `page.account.profile.resend-verification` | 重发验证邮件 | 未验证 → 按钮 `Resend_verification_email` | 邮箱未改（`email===previousEmail`）否则 disabled `[读]` | 界面: `[待渲染实测]` toast `Verification_email_sent` ／ 导航: 仍在页 `[读]` ／ 持久化: `POST /v1/users.sendConfirmationEmail`（不改资料）`[读]` | core | `page.account.profile.email` | `AccountProfileForm.tsx:432-436,52,100-106` `[读]` |
| `page.account.profile.custom-fields` | 填写工作区自定义资料字段 | Profile → `CustomFieldsForm` 各运行时字段 | `useAccountsCustomFields()` 有 metadata 才渲染；字段集运行时 `[读]` | 界面: `[待渲染实测]` 动态字段 ／ 导航: 仍在页 `[读]` ／ 持久化: `updateOwnBasicInfo.customFields` `[读]` | core | `page.account.profile.save` | `AccountProfileForm.tsx:441` `[读]` |
| `page.account.profile.cancel` | 放弃未保存资料 | 页脚 `Cancel`（dirty 才可点） | `isDirty` `[读]` | 界面: `[待渲染实测]` 表单 reset 回 `getProfileInitialValues` ／ 导航: 仍在 profile `[读]` ／ 持久化: 无 `[读]` | core | `page.account.profile.save` | `AccountProfilePage.tsx:141-144` `[读]` |
| `page.account.profile.save` | 保存资料/状态/头像 | 页脚 `Save_changes` | dirty 且非 loggingOut `[读]` | 界面: `[待渲染实测]` toast `Profile_saved_successfully` 或 error ／ 导航: 仍在页 `[读]` ／ 持久化: `POST /v1/users.updateOwnBasicInfo` ± `setStatus` ± `setPreferences` ± setAvatar/resetAvatar `[读]` | core | `account.profile` | `AccountProfileForm.tsx:132-191` `AccountProfilePage.tsx:145-147` `[读]` |
| `page.account.profile.logout-others` | 登出其他客户端 | Profile → `Logout_Others` | 无额外权 | 界面: `[待渲染实测]` toast `Logged_out_of_other_clients_successfully`；本会话仍在 ／ 导航: 仍在 profile `[读]` ／ 持久化: `POST /v1/users.logoutOtherClients` `[读]` | core | `page.account.sessions.logout` `nav.user.logout` | `AccountProfilePage.tsx:49-64,128-130` `[读]` |
| `page.account.profile.delete` | 删除自己的账号 | Profile → danger `Delete_my_account` → 模态 `Delete_account?` 填密码或用户名 → `Delete_account` | `Accounts_AllowDeleteOwnAccount`；有本地密码则密码框，否则用户名框 `[读]` | 界面: `[待渲染实测]` 确认 dialog；成功 toast `User_has_been_deleted` ／ 导航: 成功后 `logout()` `[读]` ／ 持久化: `POST /v1/users.deleteOwnAccount` `{password: SHA256(…)}` `[读]` | core | `account.profile` | `AccountProfilePage.tsx:93-114,131-135` `ActionConfirmModal.tsx:39-45` `[读]` |
| `page.account.profile.delete.invalid-password` | 删号密码错误 | 确认框填错密码 → 确认 | 有本地密码 `[读]` | 界面: `[待渲染实测]` 字段 error `Invalid_password`（不关模态）／ 导航: 仍在模态 `[读]` ／ 持久化: delete 失败 `[读]` | core | `page.account.profile.delete` | `ActionConfirmModal.tsx:31-34` `AccountProfilePage.tsx:105-107` `[读]` |
| `page.account.profile.delete.last-owner` | 末位房主删号需二次确认 | 删号 API 返 `user-last-owner` → `ConfirmOwnerChangeModal` → `Delete` | 用户是某些房最后 owner `[读]` | 界面: `[待渲染实测]` 二次模态列出 shouldChangeOwner / shouldBeRemoved，文案 `Delete_User_Warning_{erasureType}` ／ 导航: 确认后 logout `[读]` ／ 持久化: 再 `deleteOwnAccount` `{confirmRelinquish:true}` `[读]` | core | `page.account.profile.delete` | `AccountProfilePage.tsx:66-91,99-103` `[读]` |

Profile 可感知控件（不含纯校验行）：avatar×5 + name + username + status-type/text/duration/date/time + visibility + nickname + bio + email + resend + custom-fields + cancel + save + logout-others + delete = **24** 主控件。校验/二次确认 6 行。`rg -c "name='" AccountProfileForm.tsx` 对应 RHF 字段：avatar name username statusText statusType statusDuration statusCustomDate statusCustomTime statusVisibilityDenied nickname bio email customFields。

### B2 Preferences — `/account/preferences`

一手风琴 + **一个** `POST /v1/users.setPreferences`（`getDirtyFields` 只提交脏字段）。My Data 两按钮独立 `GET /v1/users.requestDataDownload`。Messages 里三条 FieldLink 只跳外观页，不保存本页。

共享供给：`core；脏字段走 POST /v1/users.setPreferences`（除 My Data / 桌面通知权限）。

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
|---|---|---|---|---|---|---|---|
| `page.account.preferences.language` | 改界面语言 | 顶栏头像→`Preferences` → 手风琴 `Localization`（默认展开）→ select `Language` | 侧栏无门 | 界面: `[待渲染实测]` 语言选项来自 `useLanguages()` ／ 导航: 仍在页 `[读]` ／ 持久化: Save → `language` `[读]` | 共享 setPreferences | `account.preferences` | `PreferencesLocalizationSection.tsx:18-26` `[读]` |
| `page.account.preferences.dont-ask-again` | 管理「不再询问」列表 | 手风琴 `Global` → `Dont_ask_me_again_list` MultiSelect | 列表来自已有 `dontAskAgainList` 偏好 `[读]` | 界面: `[待渲染实测]` 多选 placeholder=`Nothing_found` ／ 导航: 仍在页 `[读]` ／ 持久化: Save 写成 `{action,label}[]` `[读]` | 共享 setPreferences | `account.preferences` | `PreferencesGlobalSection.tsx:17-32` `AccountPreferencesPage.tsx:61-67` `[读]` |
| `page.account.preferences.auto-away` | 开关自动离开 | 手风琴 `User_Presence` → switch `Enable_Auto_Away` | 无 | 界面: `[待渲染实测]` switch + hint ／ 导航: 仍在页 `[读]` ／ 持久化: `enableAutoAway` `[读]` | 共享 setPreferences | `account.preferences` | `PreferencesUserPresenceSection.tsx:13-23` `[读]` |
| `page.account.preferences.idle-time` | 设置空闲秒数 | 同上 → number `Idle_Time_Limit` | 无 | 界面: `[待渲染实测]` NumberInput ／ 导航: 仍在页 `[读]` ／ 持久化: `idleTimeLimit` `[读]` | 共享 setPreferences | `page.account.preferences.auto-away` | `PreferencesUserPresenceSection.tsx:24-35` `[读]` |
| `page.account.preferences.desktop-permission` | 向浏览器要通知权或发测试通知 | 手风琴 `Notifications` → `Desktop_Notifications` 主按钮 | `window.Notification`；denied 只显示文案无按钮 `[读]` | 界面: `[待渲染实测]` granted→`Test_Desktop_Notifications`；未决→`Enable_Desktop_Notifications`；denied→`Desktop_Notifications_Disabled` ／ 导航: 浏览器权限框 `[待渲染实测]` ／ 持久化: 测试走本地 notify，**不** setPreferences；授权是浏览器权限 `[读]` | core（浏览器 Notification API） | `account.preferences` | `PreferencesNotificationsSection.tsx:99-114` `[读]` |
| `page.account.preferences.desktop-require-interaction` | 开关桌面通知需交互才消失 | Notifications → switch `Notification_RequireInteraction` | 无；hint 写明 Chrome>50 `[读]` | 界面: `[待渲染实测]` switch ／ 导航: 仍在页 `[读]` ／ 持久化: `desktopNotificationRequireInteraction` `[读]` | 共享 setPreferences | `account.preferences` | `PreferencesNotificationsSection.tsx:115-125` `[读]` |
| `page.account.preferences.desktop-default` | 选桌面通知默认范围 | Notifications → select `Notification_Desktop_Default_For` | 选项 all/mentions/nothing + Default(工作区默认) `[读]` | 界面: `[待渲染实测]` select ／ 导航: 仍在页 `[读]` ／ 持久化: `desktopNotifications` `[读]` | 共享 setPreferences | `account.preferences` | `PreferencesNotificationsSection.tsx:126-135` `[读]` |
| `page.account.preferences.desktop-voice` | 开关桌面语音来电通知 | Notifications → switch `Notification_Desktop_show_voice_calls` | 无 | 界面: `[待渲染实测]` switch ／ 导航: 仍在页 `[读]` ／ 持久化: `desktopNotificationVoiceCalls` `[读]` | 共享 setPreferences | `account.preferences` | `PreferencesNotificationsSection.tsx:136-145` `[读]` |
| `page.account.preferences.push-default` | 选移动推送默认范围 | Notifications → select `Notification_Push_Default_For` | 同上三档 + 工作区默认 `[读]` | 界面: `[待渲染实测]` select ／ 导航: 仍在页 `[读]` ／ 持久化: `pushNotifications` `[读]` | 共享 setPreferences | `account.preferences` | `PreferencesNotificationsSection.tsx:146-155` `[读]` |
| `page.account.preferences.email-mode` | 选邮件通知模式 | Notifications → select `Email_Notification_Mode` | `Accounts_AllowEmailNotifications` 否则 disabled `[读]` | 界面: `[待渲染实测]` select；hint 验证邮箱或 `Email_Notifications_Change_Disabled` ／ 导航: 仍在页 `[读]` ／ 持久化: `emailNotificationMode` `[读]` | 共享 setPreferences | `account.preferences` | `PreferencesNotificationsSection.tsx:156-169` `[读]` |
| `page.account.preferences.login-email` | 开关登录检测邮件 | Notifications → switch `Receive_Login_Detection_Emails` | `Device_Management_Enable_Login_Emails` AND `Device_Management_Allow_Login_Email_preference` `[读]` | 界面: `[待渲染实测]` 条件渲染 switch ／ 导航: 仍在页 `[读]` ／ 持久化: `receiveLoginDetectionEmail` `[读]` | 共享 setPreferences | `account.manage-devices` | `PreferencesNotificationsSection.tsx:170-182` `[读]` |
| `page.account.preferences.calendar-notify` | 开关日历事件通知 | Notifications → switch `Notify_Calendar_Events` | `user.settings.calendar.outlook.Enabled` `[读]` | 界面: `[待渲染实测]` 条件渲染 switch ／ 导航: 仍在页 `[读]` ／ 持久化: `notifyCalendarEvents` `[读]` | 共享 setPreferences | `room.toolbox.outlook-calendar` | `PreferencesNotificationsSection.tsx:183-194` `[读]` |
| `page.account.preferences.mobile-ringing` | 开关移动端响铃 | Notifications → switch `VideoConf_Mobile_Ringing` | `VideoConf_Mobile_Ringing` OR `VoIP_TeamCollab_Mobile_Ringing_Enabled` `[读]` | 界面: `[待渲染实测]` 条件渲染 switch ／ 导航: 仍在页 `[读]` ／ 持久化: `enableMobileRinging` `[读]` | 共享 setPreferences | `account.preferences` | `PreferencesNotificationsSection.tsx:195-206` `[读]` |
| `page.account.preferences.unread-alert` | 开关托盘未读提示 | 手风琴 `Messages` → switch `Unread_Tray_Icon_Alert` | 无 | 界面: `[待渲染实测]` switch ／ 导航: 仍在页 `[读]` ／ 持久化: `unreadAlert` `[读]` | 共享 setPreferences | `account.preferences` | `PreferencesMessagesSection.tsx:37-46` `[读]` |
| `page.account.preferences.threads-in-main` | 开关线程回复进主频道 | Messages → switch `Always_show_thread_replies_in_main_channel` | 无 | 界面: `[待渲染实测]` switch + 描述 hint ／ 导航: 仍在页 `[读]` ／ 持久化: `showThreadsInMainChannel` `[读]` | 共享 setPreferences | `composer.send` | `PreferencesMessagesSection.tsx:47-57` `[读]` |
| `page.account.preferences.thread-to-channel` | 选「同时发到频道」默认 | Messages → select `Also_send_thread_message_to_channel_behavior` | 无 | 界面: `[待渲染实测]` default/always/never ／ 导航: 仍在页 `[读]` ／ 持久化: `alsoSendThreadToChannel` `[读]` | 共享 setPreferences | `thread.composer.reply` | `PreferencesMessagesSection.tsx:58-68` `[读]` |
| `page.account.preferences.link-clock` | 跳到外观页改时间格式 | Messages → link `Go_to_accessibility_and_appearance`（旁 label `Message_TimeFormat`） | 无 | 界面: `[待渲染实测]` 链 `href=/account/accessibility-and-appearance#clockMode` ／ 导航: 到外观页锚点 `[读]` ／ 持久化: 无（本页不存）`[读]` | core | `page.account.accessibility.clock-mode` | `PreferencesMessagesSection.tsx:69-74` `[读]` |
| `page.account.preferences.use-emojis` | 开关使用 emoji | Messages → switch `Use_Emojis` | 无 | 界面: `[待渲染实测]` switch ／ 导航: 仍在页 `[读]` ／ 持久化: `useEmojis` `[读]` | 共享 setPreferences | `composer.format` | `PreferencesMessagesSection.tsx:75-84` `[读]` |
| `page.account.preferences.ascii-emoji` | 开关 ASCII 转 emoji | Messages → switch `Convert_Ascii_Emojis` | 无 | 界面: `[待渲染实测]` switch ／ 导航: 仍在页 `[读]` ／ 持久化: `convertAsciiEmoji` `[读]` | 共享 setPreferences | `account.preferences` | `PreferencesMessagesSection.tsx:85-94` `[读]` |
| `page.account.preferences.auto-images` | 开关自动加载图片 | Messages → switch `Auto_Load_Images` | 无 | 界面: `[待渲染实测]` switch ／ 导航: 仍在页 `[读]` ／ 持久化: `autoImageLoad` `[读]` | 共享 setPreferences | `account.preferences` | `PreferencesMessagesSection.tsx:95-104` `[读]` |
| `page.account.preferences.mobile-bandwidth` | 开关节省移动流量 | Messages → switch `Save_Mobile_Bandwidth` | 无 | 界面: `[待渲染实测]` switch ／ 导航: 仍在页 `[读]` ／ 持久化: `saveMobileBandwidth` `[读]` | 共享 setPreferences | `account.preferences` | `PreferencesMessagesSection.tsx:105-114` `[读]` |
| `page.account.preferences.collapse-media` | 开关默认折叠嵌入媒体 | Messages → switch `Collapse_Embedded_Media_By_Default` | 无 | 界面: `[待渲染实测]` switch ／ 导航: 仍在页 `[读]` ／ 持久化: `collapseMediaByDefault` `[读]` | 共享 setPreferences | `account.preferences` | `PreferencesMessagesSection.tsx:115-124` `[读]` |
| `page.account.preferences.link-usernames` | 跳到外观页改是否显示用户名 | Messages → link（旁 `Hide_usernames`） | 无 | 界面: `[待渲染实测]` href `#hideUsernames` ／ 导航: 外观页 `[读]` ／ 持久化: 无 `[读]` | core | `page.account.accessibility.show-usernames` | `PreferencesMessagesSection.tsx:125-130` `[读]` |
| `page.account.preferences.link-roles` | 跳到外观页改是否显示角色 | Messages → link（旁 `Hide_roles`） | 无 | 界面: `[待渲染实测]` href `#hideRoles` ／ 导航: 外观页 `[读]` ／ 持久化: 无 `[读]` | core | `page.account.accessibility.show-roles` | `PreferencesMessagesSection.tsx:131-136` `[读]` |
| `page.account.preferences.hide-flextab` | 开关隐藏右侧 flextab | Messages → switch `Hide_flextab` | 无 | 界面: `[待渲染实测]` switch ／ 导航: 仍在页 `[读]` ／ 持久化: `hideFlexTab` `[读]` | 共享 setPreferences | `account.preferences` | `PreferencesMessagesSection.tsx:137-146` `[读]` |
| `page.account.preferences.display-avatars` | 开关消息头像 | Messages → switch `Display_avatars` | 无 | 界面: `[待渲染实测]` switch ／ 导航: 仍在页 `[读]` ／ 持久化: `displayAvatars` `[读]` | 共享 setPreferences | `nav.sort.display.avatars` | `PreferencesMessagesSection.tsx:147-156` `[读]` |
| `page.account.preferences.send-on-enter` | 选 Enter 发送行为 | Messages → select `Enter_Behaviour` | 无；选项 normal/alternative/desktop `[读]` | 界面: `[待渲染实测]` select + `Enter_Behaviour_Description` ／ 导航: 仍在页 `[读]` ／ 持久化: `sendOnEnter` `[读]` | 共享 setPreferences | `composer.send.enter-behavior` `shortcut.composer.send` | `PreferencesMessagesSection.tsx:157-164` `[读]` |
| `page.account.preferences.highlights` | 编辑高亮词列表 | 手风琴 `Highlights` → textarea `Highlights_List` | 无 | 界面: `[待渲染实测]` 4 行 + `Highlights_How_To` ／ 导航: 仍在页 `[读]` ／ 持久化: Save 按 `,`/`\n` 拆成数组 `[读]` | 共享 setPreferences | `account.preferences` | `PreferencesHighlightsSection.tsx:11-21` `AccountPreferencesPage.tsx:50-58` `[读]` |
| `page.account.preferences.master-volume` | 调主音量 | 手风琴 `Sound` → slider `Master_volume` | 无 | 界面: `[待渲染实测]` 0–100 slider ／ 导航: 仍在页 `[读]` ／ 持久化: `masterVolume` `[读]` | 共享 setPreferences | `account.preferences` | `PreferencesSoundSection.tsx:25-31` `[读]` |
| `page.account.preferences.notification-volume` | 调通知音量（并试听） | Sound → slider `Notification_volume` | 无 | 界面: `[待渲染实测]` 拖动即 `customSound.play(newMessageNotification)` `[读]` ／ 导航: 仍在页 `[读]` ／ 持久化: `notificationsSoundVolume` `[读]` | 共享 setPreferences | `page.account.preferences.new-message-sound` | `PreferencesSoundSection.tsx:32-53` `[读]` |
| `page.account.preferences.ringer-volume` | 调来电铃声音量（并试听） | Sound → slider `Call_ringer_volume` | 无 | 界面: `[待渲染实测]` 拖动 play `telephone` ／ 导航: 仍在页 `[读]` ／ 持久化: `voipRingerVolume` `[读]` | 共享 setPreferences | `nav.voip.call` | `PreferencesSoundSection.tsx:54-75` `[读]` |
| `page.account.preferences.new-room-sound` | 选新房间提示音 | Sound → select `New_Room_Notification` | 选项来自 `useCustomSound().list` `[读]` | 界面: `[待渲染实测]` 改选项即试听 ／ 导航: 仍在页 `[读]` ／ 持久化: `newRoomNotification` `[读]` | 共享 setPreferences | `account.preferences` | `PreferencesSoundSection.tsx:76-93` `[读]` |
| `page.account.preferences.new-message-sound` | 选新消息提示音 | Sound → select `New_Message_Notification` | 同上 | 界面: `[待渲染实测]` 改选项即试听 ／ 导航: 仍在页 `[读]` ／ 持久化: `newMessageNotification` `[读]` | 共享 setPreferences | `account.preferences` | `PreferencesSoundSection.tsx:94-113` `[读]` |
| `page.account.preferences.mute-focused` | 开关静音已聚焦会话 | Sound → switch `Mute_Focused_Conversations` | 无 | 界面: `[待渲染实测]` switch ／ 导航: 仍在页 `[读]` ／ 持久化: `muteFocusedConversations` `[读]` | 共享 setPreferences | `account.preferences` | `PreferencesSoundSection.tsx:114-123` `[读]` |
| `page.account.preferences.download-my-data` | 申请下载自己的数据（非完整导出） | 手风琴 `My Data` → `Download_My_Data` | `UserData_EnableDownload` 才渲染整段 `[读]` | 界面: `[待渲染实测]` `MyDataModal` 标题 `UserDataDownload_Requested`（三种已存在/排队文案）／ 导航: 模态叠在偏好页 `[读]` ／ 持久化: `GET /v1/users.requestDataDownload?fullExport=false` `[读]` | core | `account.preferences` | `PreferencesMyDataSection.tsx:75-83,16-73` `[读]` |
| `page.account.preferences.export-my-data` | 申请完整导出自己的数据 | `My Data` → `Export_My_Data` | 同上 | 界面: `[待渲染实测]` 同模态族 ／ 导航: 模态 `[读]` ／ 持久化: `GET /v1/users.requestDataDownload?fullExport=true` `[读]` | core | `page.account.preferences.download-my-data` | `PreferencesMyDataSection.tsx:76-86` `[读]` |
| `page.account.preferences.cancel` | 放弃未保存偏好 | 页脚 `Cancel` | 无 | 界面: `[待渲染实测]` reset 回 `useAccountPreferencesValues` ／ 导航: 仍在页 `[读]` ／ 持久化: 无 `[读]` | core | `page.account.preferences.save` | `AccountPreferencesPage.tsx:95` `[读]` |
| `page.account.preferences.save` | 保存所有脏偏好 | 页脚 `Save_changes` | dirty `[读]` | 界面: `[待渲染实测]` toast `Preferences_saved` ／ 导航: 仍在页 `[读]` ／ 持久化: `POST /v1/users.setPreferences` `{data: dirtyFields}` `[读]` | core | `account.preferences` | `AccountPreferencesPage.tsx:36-70,96-98` `[读]` |

Preferences `name=` 可保存字段（grep Controller name）：language, dontAskAgainList, enableAutoAway, idleTimeLimit, desktopNotificationRequireInteraction, desktopNotifications, desktopNotificationVoiceCalls, pushNotifications, emailNotificationMode, receiveLoginDetectionEmail, notifyCalendarEvents, enableMobileRinging, unreadAlert, showThreadsInMainChannel, alsoSendThreadToChannel, useEmojis, convertAsciiEmoji, autoImageLoad, saveMobileBandwidth, collapseMediaByDefault, hideFlexTab, displayAvatars, sendOnEnter, highlights, masterVolume, notificationsSoundVolume, voipRingerVolume, newRoomNotification, newMessageNotification, muteFocusedConversations = **30**。另：桌面权限按钮 1、FieldLink 3、My Data 2、cancel/save 2。条件字段仍各占一行。

### B3 Security — `/account/security`

侧栏 OR：`Accounts_TwoFactorAuthentication_Enabled` | `E2E_Enable` | `Accounts_AllowPasswordChange`。改密与 2FA/E2E **不是**同一 POST。

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
|---|---|---|---|---|---|---|---|
| `page.account.security.password` | 输入新密码 | 账号侧栏 `Security` → 手风琴 `Password` → `New_password` | `Accounts_AllowPasswordChange` + `useAllowPasswordChange`；否则 disabled + `Password_Change_Disabled` `[读]` | 界面: `[待渲染实测]` PasswordInput + `PasswordVerifier` ／ 导航: 仍在页 `[读]` ／ 持久化: 仅本地，页脚 Save 才写 `[读]` | core；`POST /v1/users.updateOwnBasicInfo` `{newPassword}` | `account.security` | `ChangePassword.tsx:62-97` `[读]` |
| `page.account.security.password-confirm` | 确认新密码 | Password → `Confirm_password` | 新密码复杂度未过则 disabled `[读]` | 界面: `[待渲染实测]` 不匹配 `Passwords_do_not_match` ／ 导航: 仍在页 `[读]` ／ 持久化: 仅本地 `[读]` | core | `page.account.security.password` | `ChangePassword.tsx:98-127` `[读]` |
| `page.account.security.password.cancel` | 清空未保存新密 | 页脚 `Cancel` | dirty `[读]` | 界面: `[待渲染实测]` 两框清空 ／ 导航: 仍在 security `[读]` ／ 持久化: 无 `[读]` | core | `page.account.security.password.save` | `AccountSecurityPage.tsx:84` `[读]` |
| `page.account.security.password.save` | 提交改密 | 页脚 `Save_changes`（绑 password 表单） | dirty 且复杂度过 `[读]` | 界面: `[待渲染实测]` toast `Password_changed_successfully` ／ 导航: 仍在页 `[读]` ／ 持久化: `POST /v1/users.updateOwnBasicInfo` `{data:{newPassword}}` `[读]` | core | `account.security` | `ChangePassword.tsx:43-57` `AccountSecurityPage.tsx:85-87` `[读]` |
| `page.account.security.totp.toggle` | 开关 TOTP 二次验证 | 手风琴 `Two Factor Authentication` → switch `Two-factor_authentication_via_TOTP` | `Accounts_TwoFactorAuthentication_Enabled` + `Accounts_TwoFactorAuthentication_By_TOTP_Enabled` `[读]` | 界面: `[待渲染实测]` 开→进入登记；关→`TwoFactorTotpModal` 要验证码 ／ 导航: 仍在页 `[读]` ／ 持久化: 开 `POST /v1/users.enableTotp`；关 `POST /v1/users.disableTotp` `{code}` `[读]` | core | `account.security` `route.2fa` | `TwoFactorTOTP.tsx:31-32,100-106,151-154` `[读]` |
| `page.account.security.totp.secret` | 复制 TOTP 密钥（替代扫码） | 登记中 → `TextCopy` 密钥 | 刚 enable、尚未 verify `[读]` | 界面: `[待渲染实测]` 密钥可复制 + QR `img` aria-hidden ／ 导航: 仍在页 `[读]` ／ 持久化: 密钥来自 enableTotp 响应，未 verify 前未启用 `[读]` | core | `page.account.security.totp.toggle` | `TwoFactorTOTP.tsx:156-161` `[读]` |
| `page.account.security.totp.verify` | 用应用码完成 TOTP 启用 | 登记中 → `Enter_code_provided_by_authentication_app` → `Verify` | 登记态 `[读]` | 界面: `[待渲染实测]` 成功 toast `Two-factor_authentication_enabled` + `BackupCodesModal`；错码 `Invalid_two_factor_code` ／ 导航: 模态叠在页上 `[读]` ／ 持久化: `POST /v1/users.validateTotp` `{code}` `[读]` | core | `page.account.security.totp.toggle` | `TwoFactorTOTP.tsx:111-128,162-170` `[读]` |
| `page.account.security.totp.regenerate` | 重新生成备份码 | TOTP 已启用 → `Regenerate_codes` → 再输入 TOTP | 已启用；剩余数 `GET /v1/users.totpCodesRemaining` `[读]` | 界面: `[待渲染实测]` 文案 `You_have_n_codes_remaining`；确认后 BackupCodesModal ／ 导航: 模态 `[读]` ／ 持久化: `POST /v1/users.regenerateTotpCodes` `{code}` `[读]` | core | `page.account.security.totp.toggle` | `TwoFactorTOTP.tsx:130-145,173-180` `[读]` |
| `page.account.security.email-2fa` | 开关邮件二次验证 | 2FA 手风琴 → switch `Two-factor_authentication_email` | 2FA 总开 + `Accounts_TwoFactorAuthentication_By_Email_Enabled`；OAuth 用户另要 `Accounts_twoFactorAuthentication_email_available_for_OAuth_users` `[读]` | 界面: `[待渲染实测]` switch 立即切；toast enabled/disabled ／ 导航: 仍在页 `[读]` ／ 持久化: `POST /v1/users.2fa.enableEmail` 或 `disableEmail` `[读]` | core | `account.security` `route.2fa` | `TwoFactorEmail.tsx:18-37,43-47` `[读]` |
| `page.account.security.e2e-passphrase` | 输入新 E2E 口令 | 手风琴 `End-to-end_encryption` → `New_E2EE_password` | `E2E_Enable`；本地密钥须 READY/SAVE_PASSWORD 否则 disabled `[读]` | 界面: `[待渲染实测]` PasswordInput + 30 位策略 `PasswordVerifierList` ／ 导航: 仍在页 `[读]` ／ 持久化: 仅本地 `[读]` | core | `account.security` | `ChangePassphrase.tsx:109-161` `[读]` |
| `page.account.security.e2e-passphrase-confirm` | 确认新 E2E 口令 | 策略通过后出现 `Confirm_new_E2EE_password` | 同上；策略未过不渲染 `[读]` | 界面: `[待渲染实测]` 不匹配 `Passwords_do_not_match` ／ 导航: 仍在页 `[读]` ／ 持久化: 仅本地 `[读]` | core | `page.account.security.e2e-passphrase` | `ChangePassphrase.tsx:162-193` `[读]` |
| `page.account.security.e2e-enter-current` | 先输入当前 E2E 口令才能改 | 密钥未解码 → hint 链「enter your current E2EE password」 | keysExist=false `[读]` | 界面: `[待渲染实测]` 链点击走 `e2e.decodePrivateKeyFlow()`（另模态）／ 导航: 解码流模态 `[待渲染实测]` ／ 持久化: 本地解开私钥，不 reset 服务端 `[读]` | core | `page.account.security.e2e-passphrase` | `ChangePassphrase.tsx:145-159` `[读]` |
| `page.account.security.e2e-save` | 保存新 E2E 口令 | 段内 `Save_changes`（**不是**页脚改密 Save） | keysExist && valid && isValid `[读]` | 界面: `[待渲染实测]` toast `Encryption_key_saved_successfully` ／ 导航: 仍在页 `[读]` ／ 持久化: `e2e.changePassword`（客户端 E2E，非 REST 改密）`[读]` | core | `account.security` | `ChangePassphrase.tsx:87-97,195-197` `[读]` |
| `page.account.security.e2e-reset` | 重置 E2E 密钥并登出 | `Reset_E2EE_password` 按钮 | `E2E_Enable` `[读]` | 界面: `[待渲染实测]` toast `E2EE_password_reset` ／ 导航: `logout()` `[读]` ／ 持久化: `POST /v1/users.resetE2EKey` `{}` `[读]` | core | `page.account.security.e2e-passphrase` | `ResetPassphrase.tsx:6-18` `useResetE2EPasswordMutation.ts:10-17` `[读]` |

### B4 Accessibility / Appearance — `/account/accessibility-and-appearance`

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
|---|---|---|---|---|---|---|---|
| `page.account.accessibility.link-statement` | 打开无障碍声明外链 | 顶栏头像→`Accessibility_and_Appearance` → `Accessibility_statement` | 无 | 界面: `[待渲染实测]` 外链 `links.go.accessibilityStatement` ／ 导航: 新标签 `[待渲染实测]` ／ 持久化: 无 `[读]` | core | `account.accessibility-and-appearance` | `AccessibilityPage.tsx:100-102` `[读]` |
| `page.account.accessibility.link-glossary` | 打开简写术语表外链 | 同上 → `Glossary_of_simplified_terms` | 无 | 界面: `[待渲染实测]` 外链 glossary ／ 导航: 外站 `[待渲染实测]` ／ 持久化: 无 `[读]` | core | `page.account.accessibility.link-statement` | `AccessibilityPage.tsx:103-105` `[读]` |
| `page.account.accessibility.link-docs` | 打开无障碍功能文档 | 同上 → `Accessibility_feature_documentation` | 无 | 界面: `[待渲染实测]` 外链 ／ 导航: 外站 `[待渲染实测]` ／ 持久化: 无 `[读]` | core | `page.account.accessibility.link-statement` | `AccessibilityPage.tsx:106-108` `[读]` |
| `page.account.accessibility.theme.light` | 选浅色主题 | 手风琴 `Theme` → radio `Theme_light` | 无；四选一 `themeAppearence` `[读]` | 界面: `[待渲染实测]` radio 勾上 ／ 导航: 仍在页 `[读]` ／ 持久化: Save → `themeAppearence=light` `[读]` | 共享 `POST /v1/users.setPreferences` | `account.accessibility-and-appearance` | `themeItems.ts:9-13` `AccessibilityPage.tsx:113-137` `[读]` |
| `page.account.accessibility.theme.dark` | 选深色主题 | Theme → radio `Theme_dark` | 无 | 界面: `[待渲染实测]` radio ／ 导航: 仍在页 `[读]` ／ 持久化: `themeAppearence=dark` `[读]` | 共享 setPreferences | `page.account.accessibility.theme.light` | `themeItems.ts:14-18` `[读]` |
| `page.account.accessibility.theme.high-contrast` | 选高对比主题 | Theme → radio `Theme_high_contrast` | 无 | 界面: `[待渲染实测]` radio ／ 导航: 仍在页 `[读]` ／ 持久化: `themeAppearence=high-contrast` `[读]` | 共享 setPreferences | `page.account.accessibility.theme.light` | `themeItems.ts:19-23` `[读]` |
| `page.account.accessibility.theme.auto` | 选跟随系统主题 | Theme → radio `Theme_match_system` | 无 | 界面: `[待渲染实测]` radio ／ 导航: 仍在页 `[读]` ／ 持久化: `themeAppearence=auto` `[读]` | 共享 setPreferences | `page.account.accessibility.theme.light` | `themeItems.ts:24-28` `[读]` |
| `page.account.accessibility.font-size` | 改字号 | 手风琴 `Adjustable_layout` → select `Font_size` | 无 | 界面: `[待渲染实测]` select；Save 后 `createFontStyleElement` 写 style `[读]` ／ 导航: 仍在页 `[读]` ／ 持久化: `fontSize` `[读]` | 共享 setPreferences | `account.accessibility-and-appearance` | `AccessibilityPage.tsx:144-150,69-72` `[读]` |
| `page.account.accessibility.mentions-symbol` | 开关 @ 提及符号 | Adjustable_layout → switch `Mentions_with_@_symbol` | 无 | 界面: `[待渲染实测]` switch ／ 导航: 仍在页 `[读]` ／ 持久化: `mentionsWithSymbol` `[读]` | 共享 setPreferences | `account.accessibility-and-appearance` | `AccessibilityPage.tsx:151-168` `[读]` |
| `page.account.accessibility.clock-mode` | 选消息时间格式 | `#clockMode` → select `Message_TimeFormat` | 无；0 Default / 1 12h / 2 24h `[读]` | 界面: `[待渲染实测]` select ／ 导航: 仍在页（可从偏好 FieldLink 深链）`[读]` ／ 持久化: `clockMode` `[读]` | 共享 setPreferences | `page.account.preferences.link-clock` | `AccessibilityPage.tsx:169-178` `[读]` |
| `page.account.accessibility.show-usernames` | 开关显示作者用户名 | `#hideUsernames` → switch `Show_usernames`（存值取反 `hideUsernames`） | 无 | 界面: `[待渲染实测]` switch ／ 导航: 仍在页 `[读]` ／ 持久化: `hideUsernames`（UI 是 Show）`[读]` | 共享 setPreferences | `page.account.preferences.link-usernames` | `AccessibilityPage.tsx:179-191` `[读]` |
| `page.account.accessibility.show-roles` | 开关显示作者角色 | `#hideRoles` → switch `Show_roles`（存值取反 `hideRoles`） | `UI_DisplayRoles` `[读]` | 界面: `[待渲染实测]` 条件渲染 switch ／ 导航: 仍在页 `[读]` ／ 持久化: `hideRoles` `[读]` | 共享 setPreferences | `page.account.preferences.link-roles` | `AccessibilityPage.tsx:192-206` `[读]` |
| `page.account.accessibility.cancel` | 放弃未保存外观 | 页脚 `Cancel` | dirty | 界面: `[待渲染实测]` reset ／ 导航: 仍在页 `[读]` ／ 持久化: 无 `[读]` | core | `page.account.accessibility.save` | `AccessibilityPage.tsx:214` `[读]` |
| `page.account.accessibility.save` | 保存外观与无障碍 | 页脚 `Save_changes` | dirty `[读]` | 界面: `[待渲染实测]` toast `Preferences_saved`；字号即时写 style `[读]` ／ 导航: 仍在页 `[读]` ／ 持久化: `POST /v1/users.setPreferences` `[读]` | core | `account.accessibility-and-appearance` | `AccessibilityPage.tsx:63-78,215-217` `[读]` |

### B5 Feature preview — `/account/feature-preview`

`defaultFeaturesPreview` 目前 **2** 个开关（`useFeaturePreviewList.ts:21-38`）。打开页若有 unseen 会先 `setPreferences` 记已读。

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
|---|---|---|---|---|---|---|---|
| `page.account.feature-preview.empty` | 无预览功能时看空态 | 进入页且 `featuresPreview.length===0` | `Accounts_AllowFeaturePreview` 且列表可被滤空 `[读]` | 界面: `[待渲染实测]` States `No_feature_to_preview` ／ 导航: 仍在页 `[读]` ／ 持久化: 无新写（unseen 逻辑不跑）`[读]` | core | `account.feature-preview` | `AccountFeaturePreviewPage.tsx:82-87` `[读]` |
| `page.account.feature-preview.secondary-sidebar` | 开关二级侧栏预览 | 手风琴 Navigation → switch `Filters_and_secondary_sidebar` | 功能在 defaultFeaturesPreview 且 enabled `[读]` | 界面: `[待渲染实测]` switch id=`secondarySidebar` + 预览图 ／ 导航: 仍在页 `[读]` ／ 持久化: Save → `featuresPreview[{name,value}]` `[读]` | 共享 setPreferences | `sidebar.filter.all` `nav.user.account.feature-preview` | `useFeaturePreviewList.ts:22-30` `AccountFeaturePreviewPage.tsx:100-111` `[读]` |
| `page.account.feature-preview.ai-search` | 开关智能搜索预览 | 手风琴 AI → switch `Intelligent_Search` | 同上 | 界面: `[待渲染实测]` switch id=`aiSearch` ／ 导航: 仍在页 `[读]` ／ 持久化: 同上 `[读]` | 共享 setPreferences | `nav.search.ai` `route.search` | `useFeaturePreviewList.ts:31-37` `[读]` |
| `page.account.feature-preview.cancel` | 放弃未保存预览开关 | 页脚 `Cancel` | dirty | 界面: `[待渲染实测]` reset 回当前 features ／ 导航: 仍在页 `[读]` ／ 持久化: 无 `[读]` | core | `page.account.feature-preview.save` | `AccountFeaturePreviewPage.tsx:130` `[读]` |
| `page.account.feature-preview.save` | 保存功能预览开关 | 页脚 `Save_changes` | dirty `[读]` | 界面: `[待渲染实测]` toast `Preferences_saved` ／ 导航: 仍在页 `[读]` ／ 持久化: `POST /v1/users.setPreferences` `{featuresPreview}` `[读]` | core | `account.feature-preview` | `AccountFeaturePreviewPage.tsx:58-68,131-133` `[读]` |

### B6 Integrations (WebDAV) — `/account/integrations`

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
|---|---|---|---|---|---|---|---|
| `page.account.integrations.select` | 选择要移除的 WebDAV 账号 | 账号侧栏 `Integrations` → select `WebDAV_Accounts` | `Webdav_Integration_Enabled` `[读]` | 界面: `[待渲染实测]` 选项=`getWebdavServerName`；空则无 option ／ 导航: 仍在页 `[读]` ／ 持久化: 仅本地选中 `[读]` | core | `account.integrations` | `AccountIntegrationsPage.tsx:48-61` `[读]` |
| `page.account.integrations.remove` | 移除所选 WebDAV 账号 | 选中 → danger `Remove` | required `accountSelected` `[读]` | 界面: `[待渲染实测]` toast `Webdav_account_removed`；未选 `Required_field(WebDAV_Accounts)` ／ 导航: 仍在页 `[读]` ／ 持久化: `useRemoveWebDAVAccountIntegrationMutation`（删集成记录）`[读]` | core | `account.integrations` | `AccountIntegrationsPage.tsx:31-42,58-60` `[读]` |

### B7 Personal access tokens — `/account/tokens`

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
|---|---|---|---|---|---|---|---|
| `page.account.tokens.name` | 填写新令牌名 | 账号侧栏 `Personal_Access_Tokens` → placeholder=`API_Add_Personal_Access_Token` | `create-personal-access-tokens` `[读]` | 界面: `[待渲染实测]` textbox data-qa=`PersonalTokenField` ／ 导航: 仍在页 `[读]` ／ 持久化: 仅本地 `[读]` | core | `account.tokens` | `AddToken.tsx:74-86` `[读]` |
| `page.account.tokens.name.required` | 空名被拦 | 空名 → `Add` | 同 | 界面: `[待渲染实测]` `Please_provide_a_name_for_your_token` ／ 导航: 不弹成功模态 `[读]` ／ 持久化: 无 `[读]` | core | `page.account.tokens.name` | `AddToken.tsx:77` `[读]` |
| `page.account.tokens.bypass-2fa` | 选令牌是否绕过 2FA | 同行 select：`Require_Two_Factor_Authentication` / `Ignore_Two_Factor_Authentication` | 无 | 界面: `[待渲染实测]` select ／ 导航: 仍在页 `[读]` ／ 持久化: 随 Add `bypassTwoFactor` bool `[读]` | core | `page.account.tokens.add` | `AddToken.tsx:34-40,88-93` `[读]` |
| `page.account.tokens.add` | 生成个人访问令牌 | `Add` | 同页权限 | 界面: `[待渲染实测]` 成功模态 `API_Personal_Access_Token_Generated` 展示 token+userId（只此一次）／ 导航: 模态；确认后 reload 表 `[读]` ／ 持久化: `POST /v1/users.generatePersonalAccessToken` `[读]` | core | `account.tokens` | `AddToken.tsx:42-65,95-97` `[读]` |
| `page.account.tokens.regenerate` | 重新生成某令牌 | 行 → title=`Refresh` → 警告模态 `API_Personal_Access_Tokens_Regenerate_It` | 同行有 name `[读]` | 界面: `[待渲染实测]` 再出 Generated 模态显示新 token ／ 导航: 仍在 tokens `[读]` ／ 持久化: `POST /v1/users.regeneratePersonalAccessToken` `{tokenName}` `[读]` | core | `page.account.tokens.add` | `AccountTokensTable.tsx:66-101` `AccountTokensRow.tsx:31` `[读]` |
| `page.account.tokens.remove` | 撤销某令牌 | 行 → title=`Remove` → danger `API_Personal_Access_Tokens_Remove_Modal` → `Remove` | 同 | 界面: `[待渲染实测]` toast `Token_has_been_removed` ／ 导航: 仍在页 `[读]` ／ 持久化: `POST /v1/users.removePersonalAccessToken` `[读]` | core | `page.account.tokens.add` | `AccountTokensTable.tsx:103-123` `AccountTokensRow.tsx:32` `[读]` |
| `page.account.tokens.pagination` | 翻页浏览令牌 | 表底 `Pagination` | 有 token `[读]` | 界面: `[待渲染实测]` 切片 `tokens.slice` ／ 导航: 仍在页 `[读]` ／ 持久化: 仅客户端分页；列表 `GET /v1/users.getPersonalAccessTokens` `[读]` | core | `page.account.tokens.add` | `AccountTokensTable.tsx:41-50,172-180` `[读]` |
| `page.account.tokens.empty` | 无令牌时空态 | 列表空 | 同 | 界面: `[待渲染实测]` `GenericNoResults` ／ 导航: 仍在页 `[读]` ／ 持久化: 无 `[读]` | core | `page.account.tokens.add` | `AccountTokensTable.tsx:183` `[读]` |
| `page.account.tokens.retry` | 加载失败后重试 | 错误 States → `Retry` | 查询 error `[读]` | 界面: `[待渲染实测]` `Something_went_wrong` / `We_Could_not_retrive_any_data` ／ 导航: 仍在页 `[读]` ／ 持久化: invalidate `personalAccessTokens` `[读]` | core | `page.account.tokens.pagination` | `AccountTokensTable.tsx:125-140` `[读]` |

列：`API_Personal_Access_Token_Name` / `Created_at`（中屏）/ `Last_token_part` / `Two Factor Authentication` / 动作。

### B8 Sessions / Manage Devices — `/account/manage-devices`

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
|---|---|---|---|---|---|---|---|
| `page.account.sessions.sort.client` | 按客户端排序会话 | 账号侧栏 `Manage_Devices` → 表头 `Client` | EE `device-management` `[读]` | 界面: `[待渲染实测]` 排序箭头 ／ 导航: 仍在页 `[读]` ／ 持久化: `GET /v1/sessions/list` `{sort: device.name}` `[读]` | EE:device-management | `account.manage-devices` | `DeviceManagementAccountTable.tsx:42-44` `[读]` |
| `page.account.sessions.sort.os` | 按操作系统排序 | 表头 `OS` | 同上 | 界面: `[待渲染实测]` 重排 ／ 导航: 仍在页 `[读]` ／ 持久化: sort `device.os.name` `[读]` | EE:device-management | `page.account.sessions.sort.client` | `DeviceManagementAccountTable.tsx:45-47` `[读]` |
| `page.account.sessions.sort.login-at` | 按最后登录排序 | 表头 `Last_login`（默认） | 同上 | 界面: `[待渲染实测]` 重排 ／ 导航: 仍在页 `[读]` ／ 持久化: sort `loginAt` `[读]` | EE:device-management | `page.account.sessions.sort.client` | `DeviceManagementAccountTable.tsx:48-50` `[读]` |
| `page.account.sessions.pagination` | 翻页会话 | 表底 Pagination | 同上 | 界面: `[待渲染实测]` 换页 ／ 导航: 仍在页 `[读]` ／ 持久化: list `count/offset` `[读]` | EE:device-management | `page.account.sessions.sort.client` | `DeviceManagementAccountTable.tsx:20,72-77` `[读]` |
| `page.account.sessions.logout` | 登出某一设备（含当前） | 行 → `Logout` | 同上；当前行文案带 `(current)` `[读]` | 界面: `[待渲染实测]` 行消失或当前会话被踢 ／ 导航: 若登出当前则回登录 `[待渲染实测]` ／ 持久化: `POST /v1/sessions/logout.me` `[读]` | EE:device-management | `page.account.profile.logout-others` | `DeviceManagementAccountRow.tsx:24,42-44` `[读]` |

own-vs-peer：当前会话与其他会话 **同一按钮同一 endpoint**，差别只在 `current` 标记与登出后是否踢自己；不拆第二 id，后果写在本行。

### B9 Account Omnichannel — `/account/omnichannel`

04 有入口 `account.omnichannel`。本表拆可保存控件（同 `users.setPreferences`）。

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
|---|---|---|---|---|---|---|---|
| `page.account.omnichannel.hide-after-close` | 开关关单后隐藏会话 | 账号侧栏 `Omnichannel` → switch `Omnichannel_hide_conversation_after_closing` | 侧栏：`send-omnichannel-chat-transcript` OR `request-pdf-transcript` `[读]` | 界面: `[待渲染实测]` switch ／ 导航: 仍在页 `[读]` ／ 持久化: `omnichannelHideConversationAfterClosing` `[读]` | 共享 setPreferences | `account.omnichannel` | `PreferencesGeneral.tsx:11-21` `[读]` |
| `page.account.omnichannel.transcript-pdf` | 开关 PDF transcript | 手风琴 `Conversational_transcript` → `Omnichannel_transcript_pdf` | EE `livechat-enterprise` + `request-pdf-transcript`；否则 disabled + Premium/No_permission 标签 `[读]` | 界面: `[待渲染实测]` switch ／ 导航: 仍在页 `[读]` ／ 持久化: `omnichannelTranscriptPDF` `[读]` | EE:livechat-enterprise（完整） | `account.omnichannel` | `PreferencesConversationTranscript.tsx:22-40` `[读]` |
| `page.account.omnichannel.transcript-email` | 开关邮件 transcript | 同上 → `Omnichannel_transcript_email` | `send-omnichannel-chat-transcript`；`Livechat_transcript_send_always` 则 disabled `[读]` | 界面: `[待渲染实测]` switch ／ 导航: 仍在页 `[读]` ／ 持久化: `omnichannelTranscriptEmail` `[读]` | core（全渠道） | `account.omnichannel` | `PreferencesConversationTranscript.tsx:41-56` `[读]` |
| `page.account.omnichannel.cancel` | 放弃未保存坐席偏好 | 页脚 `Cancel` | dirty | 界面: `[待渲染实测]` reset ／ 导航: 仍在页 `[读]` ／ 持久化: 无 `[读]` | core | `page.account.omnichannel.save` | `OmnichannelPreferencesPage.tsx:64` `[读]` |
| `page.account.omnichannel.save` | 保存坐席全渠道偏好 | 页脚 `Save_changes` | dirty `[读]` | 界面: `[待渲染实测]` toast `Preferences_saved` ／ 导航: 仍在页 `[读]` ／ 持久化: `POST /v1/users.setPreferences` `[读]` | core | `account.omnichannel` | `OmnichannelPreferencesPage.tsx:37-47,65-66` `[读]` |

---
## C. Directory — `/directory`

04 只写 tab 入口（`directory.channels|users|teams|external`）。本表写搜索/排序/分页/行点击。列表一律 `GET /v1/directory`（`useDirectoryQuery` 500ms debounce）。`FilterByText` **无搜索按钮**，输入即滤。`federationEnabled` 写死 false，External 页签不渲染。

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
|---|---|---|---|---|---|---|---|
| `page.directory.tab.channels` | 切到频道目录 | 顶栏 Directory 或 Home `Open_directory` → tab `Channels` | tab 内容：`view-c-room` 否则 `NotAuthorizedPage` `[读]` | 界面: `[待渲染实测]` tab selected；无权则未授权页 ／ 导航: `/directory/channels` `[读]` ／ 持久化: 无 `[读]` | core | `directory.channels` `route.directory` | `DirectoryPage.tsx:43-45,59` `ChannelsTab.tsx:6-13` `[读]` |
| `page.directory.tab.users` | 切到用户目录 | Directory → tab `Users` | `view-outside-room` AND `view-d-room` `[读]` | 界面: `[待渲染实测]` Users 表或未授权 ／ 导航: `/directory/users` `[读]` ／ 持久化: 无 `[读]` | core | `directory.users` | `DirectoryPage.tsx:46-48,60` `UsersTab.tsx:10-18` `[读]` |
| `page.directory.tab.teams` | 切到团队目录 | Directory → tab `Teams` | `view-c-room` `[读]` | 界面: `[待渲染实测]` Teams 表或未授权 ／ 导航: `/directory/teams` `[读]` ／ 持久化: 无 `[读]` | core | `directory.teams` | `DirectoryPage.tsx:49-51,61` `TeamsTab.tsx:6-13` `[读]` |
| `page.directory.tab.external` | 联邦外部用户页签（当前不渲染） | 源码 `federationEnabled===true` 才有 tab `External_Users` | 写死 false `[读]` | 界面: `[待渲染实测]` 页签不出现；直达 `/directory/external` 被 replace 回默认 tab `[读]` ／ 导航: replace `[读]` ／ 持久化: 无 `[读]` | core（旧联邦已移除） | `directory.external` | `DirectoryPage.tsx:17,30-32,52-62` `[读]` |
| `page.directory.channels.search` | 搜索频道 | Channels 表 → textbox placeholder=`Search_Channels` | `view-c-room` `[读]` | 界面: `[待渲染实测]` 输入 500ms 后表刷新；空=`GenericNoResults` ／ 导航: 仍在 `/directory/channels` `[读]` ／ 持久化: `GET /v1/directory` text 参数，只读 `[读]` | core | `directory.channels` | `ChannelsTable.tsx:26,101` `useDirectoryQuery.ts` `[读]` |
| `page.directory.channels.sort.name` | 按名称排序频道 | 表头 `Name`（默认） | 同 | 界面: `[待渲染实测]` 排序指示 ／ 导航: 仍在页 `[读]` ／ 持久化: directory sort name `[读]` | core | `page.directory.channels.search` | `ChannelsTable.tsx:37-39` `[读]` |
| `page.directory.channels.sort.users` | 按人数排序频道 | 表头 `Users` | 同 | 界面: `[待渲染实测]` 重排 ／ 导航: 仍在页 `[读]` ／ 持久化: sort usersCount `[读]` | core | `page.directory.channels.sort.name` | `ChannelsTable.tsx:40-49` `[读]` |
| `page.directory.channels.sort.created` | 按创建时间排序 | 表头 `Created_at`（≥768px） | mediaQuery `[读]` | 界面: `[待渲染实测]` 中屏才见列 ／ 导航: 仍在页 `[读]` ／ 持久化: sort createdAt `[读]` | core | `page.directory.channels.sort.name` | `ChannelsTable.tsx:50-61` `[读]` |
| `page.directory.channels.sort.last-message` | 按最后消息排序 | 表头 `Last_Message`（≥768px） | mediaQuery `[读]` | 界面: `[待渲染实测]` 中屏列 ／ 导航: 仍在页 `[读]` ／ 持久化: sort lastMessage `[读]` | core | `page.directory.channels.sort.name` | `ChannelsTable.tsx:62-74` `[读]` |
| `page.directory.channels.col.belongs-to` | 只读「所属团队」列 | 表头 `Belongs_To`（≥768px，**不可点排序**） | mediaQuery `[读]` | 界面: `[待渲染实测]` 列出现 ／ 导航: 无 ／ 持久化: 展示字段 `[读]` | core | `page.directory.channels.sort.name` | `ChannelsTable.tsx:75-78` `[读]` |
| `page.directory.channels.pagination` | 翻页频道 | 表底 Pagination | 有结果 `[读]` | 界面: `[待渲染实测]` 换页 ／ 导航: 仍在页 `[读]` ／ 持久化: directory count/offset `[读]` | core | `page.directory.channels.search` | `ChannelsTable.tsx:120-128` `[读]` |
| `page.directory.channels.row` | 点行进入频道/私组 | 行 `role=link` 单击或 Enter | 行有 name `[读]` | 界面: `[待渲染实测]` 离开目录进房间 ／ 导航: `t==='c'` → `/channel/:name` 否则 `/group/:name` `[读]` ／ 持久化: 进房交房间分册；本行不写订阅 `[读]` | core | `directory.channels` | `ChannelsTable.tsx:90-97` `ChannelsTableRow.tsx:24` `[读]` |
| `page.directory.channels.empty` | 无匹配频道 | 搜索无结果 | 同 tab | 界面: `[待渲染实测]` `GenericNoResults` ／ 导航: 仍在页 `[读]` ／ 持久化: 无 `[读]` | core | `page.directory.channels.search` | `ChannelsTable.tsx:131` `[读]` |
| `page.directory.channels.error` | 目录加载失败后重载 | States → `Reload_page` | query error `[读]` | 界面: `[待渲染实测]` `Something_went_wrong` ／ 导航: 仍在页 `[读]` ／ 持久化: refetch directory `[读]` | core | `page.directory.channels.search` | `ChannelsTable.tsx:132-139` `[读]` |
| `page.directory.channels.not-authorized` | 无 view-c-room 看未授权页 | 有 Directory 入口但无 `view-c-room` → Channels | `!view-c-room` `[读]` | 界面: `[待渲染实测]` `NotAuthorizedPage`（无表）／ 导航: URL 仍可是 `/directory/channels` `[读]` ／ 持久化: 无 `[读]` | core | `directory.channels` | `ChannelsTab.tsx:6-13` `[读]` |
| `page.directory.users.search` | 搜索用户 | Users 表 → placeholder=`Search_Users` | `view-outside-room`+`view-d-room` `[读]` | 界面: `[待渲染实测]` 500ms 后刷新 ／ 导航: `/directory/users` `[读]` ／ 持久化: directory type=users `[读]` | core | `directory.users` | `UsersTable.tsx:105` `[读]` |
| `page.directory.users.sort.name` | 按姓名排序用户 | 表头 `Name` | 同 | 界面: `[待渲染实测]` 重排 ／ 导航: 仍在页 `[读]` ／ 持久化: sort name `[读]` | core | `page.directory.users.search` | `UsersTable.tsx:42-44` `[读]` |
| `page.directory.users.sort.email` | 按邮箱排序 | 表头 `Email`（≥1024px） | `view-full-other-user-info` + mediaQuery `[读]` | 界面: `[待渲染实测]` 列+排序；无权限无列 `[读]` ／ 导航: 仍在页 `[读]` ／ 持久化: sort email `[读]` | core | `page.directory.users.search` | `UsersTable.tsx:45-56` `[读]` |
| `page.directory.users.sort.created` | 按加入时间排序 | 表头 `Joined_at`（≥1024px） | mediaQuery `[读]` | 界面: `[待渲染实测]` 宽屏列 ／ 导航: 仍在页 `[读]` ／ 持久化: sort createdAt `[读]` | core | `page.directory.users.sort.name` | `UsersTable.tsx:69-80` `[读]` |
| `page.directory.users.pagination` | 翻页用户 | 表底 Pagination | 有结果 | 界面: `[待渲染实测]` 换页 ／ 导航: 仍在页 `[读]` ／ 持久化: count/offset `[读]` | core | `page.directory.users.search` | `UsersTable.tsx:131-139` `[读]` |
| `page.directory.users.row` | 点行打开与该用户的 DM | 行单击/Enter | 行有 username `[读]` | 界面: `[待渲染实测]` 进 1:1 ／ 导航: `direct` route `{rid: username}` `[读]` ／ 持久化: 进房交房间分册 `[读]` | core | `directory.users` `user.action.direct-message` | `UsersTable.tsx:93-101` `[读]` |
| `page.directory.users.empty` | 无匹配用户 | 搜索无结果 | 同 tab | 界面: `[待渲染实测]` `GenericNoResults` ／ 导航: 仍在页 `[读]` ／ 持久化: 无 `[读]` | core | `page.directory.users.search` | `UsersTable.tsx:142` `[读]` |
| `page.directory.users.error` | 用户目录失败重载 | `Reload_page` | error | 界面: `[待渲染实测]` warning States ／ 导航: 仍在页 `[读]` ／ 持久化: refetch `[读]` | core | `page.directory.users.search` | `UsersTable.tsx:143-150` `[读]` |
| `page.directory.users.not-authorized` | 缺 outside/d 权限看未授权 | 无 `view-outside-room` 或 `view-d-room` | 见门控 | 界面: `[待渲染实测]` `NotAuthorizedPage` ／ 导航: URL 可仍是 users `[读]` ／ 持久化: 无 `[读]` | core | `directory.users` | `UsersTab.tsx:11-18` `[读]` |
| `page.directory.teams.search` | 搜索团队 | Teams → placeholder=`Teams_Search_teams` | `view-c-room` | 界面: `[待渲染实测]` 500ms 刷新 ／ 导航: `/directory/teams` `[读]` ／ 持久化: directory type=teams `[读]` | core | `directory.teams` | `TeamsTable.tsx:26,77` `[读]` |
| `page.directory.teams.sort.name` | 按名称排序团队 | 表头 `Name` | 同 | 界面: `[待渲染实测]` 重排 ／ 导航: 仍在页 `[读]` ／ 持久化: sort name `[读]` | core | `page.directory.teams.search` | `TeamsTable.tsx:34-36` `[读]` |
| `page.directory.teams.col.channels` | 只读频道数（不排序） | 表头 `Channels` | 同 | 界面: `[待渲染实测]` 列 `roomsCount` ／ 导航: 无 ／ 持久化: 展示 `[读]` | core | `page.directory.teams.sort.name` | `TeamsTable.tsx:37-39` `[读]` |
| `page.directory.teams.sort.created` | 按创建时间排序团队 | 表头 `Created_at`（≥768px） | mediaQuery | 界面: `[待渲染实测]` 中屏列 ／ 导航: 仍在页 `[读]` ／ 持久化: sort createdAt `[读]` | core | `page.directory.teams.sort.name` | `TeamsTable.tsx:40-51` `[读]` |
| `page.directory.teams.pagination` | 翻页团队 | Pagination | 有结果 | 界面: `[待渲染实测]` 换页 ／ 导航: 仍在页 `[读]` ／ 持久化: count/offset `[读]` | core | `page.directory.teams.search` | `TeamsTable.tsx:101-109` `[读]` |
| `page.directory.teams.row` | 点行进入团队主房间 | 行单击/Enter | 有 name | 界面: `[待渲染实测]` 进主房 ／ 导航: public→channel 否则 group `[读]` ／ 持久化: 进房交房间分册 `[读]` | core | `directory.teams` `team.create` | `TeamsTable.tsx:66-73` `[读]` |
| `page.directory.teams.empty` | 无匹配团队 | 无结果 | 同 | 界面: `[待渲染实测]` `GenericNoResults` ／ 导航: 仍在页 `[读]` ／ 持久化: 无 `[读]` | core | `page.directory.teams.search` | `TeamsTable.tsx:112` `[读]` |
| `page.directory.teams.error` | 团队目录失败重载 | `Reload_page` | error | 界面: `[待渲染实测]` States ／ 导航: 仍在页 `[读]` ／ 持久化: refetch `[读]` | core | `page.directory.teams.search` | `TeamsTable.tsx:113-120` `[读]` |
| `page.directory.teams.not-authorized` | 无 view-c-room 看未授权 | 缺权限进 Teams | `!view-c-room` | 界面: `[待渲染实测]` `NotAuthorizedPage` ／ 导航: URL 可仍是 teams `[读]` ／ 持久化: 无 `[读]` | core | `directory.teams` | `TeamsTab.tsx:6-13` `[读]` |

频道列：Name / Users / Created_at / Last_Message / Belongs_To。用户列：Name / Email(权) / Domain(联邦，当前不出现) / Joined_at。团队列：Name / Channels / Created_at。

---

## D. Home — `/home`

04 `route.home` 把卡片写进一行。本表按卡/CTA 拆。`Layout_Custom_Body_Only` 为真则只渲染 `CustomHomePage`（无默认卡）。

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
|---|---|---|---|---|---|---|---|
| `page.home.customize` | 从 Home 头进入 Layout 设置 | Home 页头 `Customize` | `view-privileged-setting` AND `edit-privileged-setting` AND `manage-selected-settings` `[读]` | 界面: `[待渲染实测]` 按钮 pencil ／ 导航: `/admin/settings/Layout` `[读]` ／ 持久化: 无（打开设置组）`[读]` | core | `route.home` `page.admin.settings.open.layout` | `HomePageHeader.tsx:10-18` `[读]` |
| `page.home.add-users` | 从欢迎卡去用户管理 | 卡 `Add_users` → 主按钮 `Add_users` | `view-user-administration` 才渲染卡 `[读]` | 界面: `[待渲染实测]` 卡 title=`Add_users` ／ 导航: `/admin/users` `[读]` ／ 持久化: 无 `[读]` | core | `route.admin.users` `page.admin.users.new` | `AddUsersCard.tsx:11-23` `DefaultHomePage.tsx:18,37` `[读]` |
| `page.home.create-channel` | 从欢迎卡打开创建频道 | 卡 `Create_channels` → `Create_channel` | `create-c` OR `create-p` `[读]` | 界面: `[待渲染实测]` 叠 `CreateChannelModal` ／ 导航: 仍在 `/home` 直到提交 `[读]` ／ 持久化: 见 `page.create.channel.submit` `[读]` | core | `nav.create.channel` `page.create.channel.name` | `CreateChannelsCard.tsx:12-21` `DefaultHomePage.tsx:38` `[读]` |
| `page.home.open-directory` | 从欢迎卡打开目录 | 卡 `Join_rooms` → `Open_directory` | 卡始终渲染（有 Home）`[读]` | 界面: `[待渲染实测]` ／ 导航: `/directory` `[读]` ／ 持久化: 无 `[读]` | core | `route.directory` `page.directory.tab.users` | `JoinRoomsCard.tsx:11-22` `DefaultHomePage.tsx:39` `[读]` |
| `page.home.mobile.google` | 打开 Google Play | 卡 `Mobile_apps` → link `Google_Play` | 无 | 界面: `[待渲染实测]` role=link ／ 导航: 外链 `links.go.mobileAppGoogle` `[读]` ／ 持久化: 无 `[读]` | core | `route.home` | `MobileAppsCard.tsx:21-23` `[读]` |
| `page.home.mobile.apple` | 打开 App Store | 卡 `Mobile_apps` → link `App_Store` | 无 | 界面: `[待渲染实测]` role=link ／ 导航: `links.go.mobileAppApple` `[读]` ／ 持久化: 无 `[读]` | core | `page.home.mobile.google` | `MobileAppsCard.tsx:24-26` `[读]` |
| `page.home.desktop.windows` | 打开 Windows 客户端下载 | 卡 `Desktop_apps` → `Platform_Windows` | 无 | 界面: `[待渲染实测]` role=link ／ 导航: `links.go.desktopAppWindows` `[读]` ／ 持久化: 无 `[读]` | core | `route.home` | `DesktopAppsCard.tsx:22-24` `[读]` |
| `page.home.desktop.linux` | 打开 Linux 客户端下载 | 同上 → `Platform_Linux` | 无 | 界面: `[待渲染实测]` ／ 导航: `desktopAppLinux` `[读]` ／ 持久化: 无 `[读]` | core | `page.home.desktop.windows` | `DesktopAppsCard.tsx:25-27` `[读]` |
| `page.home.desktop.mac` | 打开 Mac 客户端下载 | 同上 → `Platform_Mac` | 无 | 界面: `[待渲染实测]` ／ 导航: `desktopAppMac` `[读]` ／ 持久化: 无 `[读]` | core | `page.home.desktop.windows` | `DesktopAppsCard.tsx:28-30` `[读]` |
| `page.home.docs` | 打开产品文档 | 卡 `Documentation` → `See_documentation` | 无 | 界面: `[待渲染实测]` role=link ／ 导航: `links.go.documentation` `[读]` ／ 持久化: 无 `[读]` | core | `route.home` | `DocumentationCard.tsx:20-22` `[读]` |
| `page.home.custom.body` | 阅读自定义 Home HTML | 自定义卡/仅自定义页 body | 非 admin：`Layout_Home_Custom_Block_Visible` 且 body 非空；admin 即使空也见默认说明 `[读]` | 界面: `[待渲染实测]` `CustomHomepageContent` `role=status` aria-label=HTML；或 `Homepage_Custom_Content_Default_Message` ／ 导航: 仍在 `/home` `[读]` ／ 持久化: 只读设置 `Layout_Home_Body` `[读]` | core | `route.home` | `CustomContentCard.tsx:52-99` `HomePage.tsx:6-13` `[读]` |
| `page.home.custom.edit-layout` | admin 从自定义卡去改 Layout | 自定义卡 → `Customize_Content`（title=`Layout_Home_Page_Content`） | admin 角色 `[读]` | 界面: `[待渲染实测]` ／ 导航: `/admin/settings/Layout` `[读]` ／ 持久化: 无 `[读]` | core | `page.home.customize` | `CustomContentCard.tsx:63-65` `[读]` |
| `page.home.custom.visibility` | admin 对工作区显示/隐藏自定义块 | 自定义卡 → `Show_To_Workspace` / `Hide_On_Workspace` | admin；body 空则 disabled；visible+only 时 hide disabled `[读]` | 界面: `[待渲染实测]` Tag `Visible_To_Workspace`/`Not_Visible_To_Workspace` 切换 ／ 导航: 仍在 Home `[读]` ／ 持久化: 写设置 `Layout_Home_Custom_Block_Visible` `[读]` | core | `page.home.custom.body` | `CustomContentCard.tsx:24-30,66-74` `[读]` |
| `page.home.custom.only` | admin 开关「只显示自定义」 | 自定义卡 → `Show_Only_This_Content` / `Show_default_content` | admin + Enterprise；自定义未对工作区可见则 disabled `[读]` | 界面: `[待渲染实测]` title `Premium_only` 或显示/隐藏其他卡 ／ 导航: 仍在 Home；开 only 后整页变 `CustomHomePage` `[读]` ／ 持久化: `Layout_Custom_Body_Only` `[读]` | EE（only 需要 isEnterprise） | `page.home.custom.visibility` | `CustomContentCard.tsx:32-38,75-83` `[读]` |

`Layout_Show_Home_Button` 管顶栏 Home 按钮（02 `nav.pages.home`），不挡直达 `/home`。

---

---

## E. Admin 侧栏 22 页内部控件

04 只写 `route.admin.*`「打开页」。本表从页内可操作控件起算。`rg -c "i18nLabel:" apps/meteor/client/views/admin/sidebarItems.ts` → **22**。Settings **不拆** 972 个 Settings.json key，只写：索引搜索、打开组、Save/Cancel/Reset、具名危险动作。Mailer / Email Inbox / User form / Room edit / Integration incoming+outgoing 按 `name=` 字段一行一个。

### E1 Workspace `/admin/info` — `page.admin.workspace.*`

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
|---|---|---|---|---|---|---|---|
| `page.admin.workspace.download-info` | 下载工作区信息 JSON | 管理侧栏 Workspace → Download_Info | view-statistics [读] | 界面: [待渲染实测] 触发本地下载 ／ 导航: 仍在 /admin/info [读] ／ 持久化: 无 REST，客户端拼 statistics JSON [读] | core | route.admin.workspace | WorkspacePage.tsx [读] |
| `page.admin.workspace.refresh` | 刷新工作区统计 | Workspace → Refresh | view-statistics [读] | 界面: [待渲染实测] 卡片数字更新 ／ 导航: 仍在页 [读] ／ 持久化: GET statistics（useWorkspaceInfo refetch）[读] | core | page.admin.workspace.download-info | WorkspaceRoute.tsx [读] |
| `page.admin.workspace.register` | 打开注册工作区向导 | VersionCard → RegisterWorkspace_Button | 未注册 [读] | 界面: [待渲染实测] RegisterWorkspaceModal ／ 导航: 模态叠在 info [读] ／ 持久化: 无请求至选方式 [读] | core | route.admin.workspace | VersionCard.tsx [读] |
| `page.admin.workspace.register.token` | 用 token 注册工作区 | 注册模态 → Use_token → 填 token → 确认 | 未注册 [读] | 界面: [待渲染实测] RegisterWorkspaceTokenModal ／ 导航: 仍在 info [读] ／ 持久化: POST /v1/cloud.connectWorkspace [读] | core | page.admin.workspace.register | RegisterWorkspaceTokenModal.tsx [读] |
| `page.admin.workspace.register.intent` | 走 Cloud 注册意图/轮询 | 注册向导 StepOne → 继续 → StepTwo 自动轮询 | 未注册 [读] | 界面: [待渲染实测] 两步模态 ／ 导航: 仍在 info [读] ／ 持久化: POST /v1/cloud.createRegistrationIntent 后 GET /v1/cloud.confirmationPoll [读] | core | page.admin.workspace.register | RegisterWorkspaceSetupStepTwoModal.tsx [读] |
| `page.admin.workspace.sync` | 已注册工作区同步 Cloud | RegisteredWorkspaceModal → 同步 | 已注册 [读] | 界面: [待渲染实测] toast ／ 导航: 仍在页 [读] ／ 持久化: POST /v1/cloud.syncWorkspace [读] | core | page.admin.subscription.sync | RegisteredWorkspaceModal.tsx [读] |
| `page.admin.workspace.update` | 打开版本更新外链 | VersionCard → Update_version | 有新版本提示 [读] | 界面: [待渲染实测] 按钮 ／ 导航: 外链更新文档/下载 [读] ／ 持久化: 无 REST [读] | core | page.admin.workspace.download-info | VersionCard.tsx [读] |
| `page.admin.workspace.manage-subscription` | 从版本卡去订阅页 | VersionCard → Manage_subscription | view-statistics [读] | 界面: [待渲染实测] 链 ／ 导航: /admin/subscription [读] ／ 持久化: 无 [读] | core | page.admin.subscription.sync | VersionCard.tsx [读] |
| `page.admin.workspace.instances` | 查看部署实例列表 | DeploymentCard → 实例按钮 → InstancesModal | 多实例部署 [读] | 界面: [待渲染实测] 只读实例表 ／ 导航: 模态 [读] ／ 持久化: 无新写，展示已拉 statistics [读] | core | page.admin.workspace.download-info | DeploymentCard.tsx InstancesModal.tsx [读] |

### E2 Subscription `/admin/subscription` — `page.admin.subscription.*`

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
|---|---|---|---|---|---|---|---|
| `page.admin.subscription.sync` | 同步许可证状态 | 管理侧栏 Subscription → Sync_license_update | manage-cloud [读] | 界面: [待渲染实测] toast ／ 导航: 仍在 /admin/subscription [读] ／ 持久化: POST /v1/cloud.syncWorkspace [读] | core | route.admin.subscription | SubscriptionPage.tsx useWorkspaceSync [读] |
| `page.admin.subscription.checkout` | 打开购买/升级结账 | Subscription → Manage_subscription / Upgrade | manage-cloud [读] | 界面: [待渲染实测] 外链按钮 ／ 导航: Cloud checkout URL [读] ／ 持久化: 无本站 REST [读] | core | page.admin.subscription.sync | SubscriptionPage.tsx useCheckoutUrl [读] |
| `page.admin.subscription.cancel` | 取消订阅 | PlanCard → Cancel_subscription → 确认 | 有有效许可证 [读] | 界面: [待渲染实测] 确认模态 ／ 导航: 仍在订阅页 [读] ／ 持久化: 取消流（源码 useCancelSubscriptionModal）[读] | core | page.admin.subscription.sync | useCancelSubscriptionModal.tsx [读] |
| `page.admin.subscription.license-text` | 粘贴许可证密钥 | ManageLicenseModal → textarea | manage-cloud [读] | 界面: [待渲染实测] 多行文本 ／ 导航: 模态仍开 [读] ／ 持久化: 仅本地至 Apply [读] | core；提交见 apply | page.admin.subscription.apply | ManageLicenseModal.tsx [读] |
| `page.admin.subscription.apply` | 应用许可证密钥 | ManageLicenseModal → Apply_license | 文本非空 [读] | 界面: [待渲染实测] 校验状态 ／ 导航: 关模态或留错 [读] ／ 持久化: POST /v1/licenses.validate + 写设置 Enterprise_License [读] | core | page.admin.subscription.license-text | ManageLicenseModal.tsx useValidateLicense [读] |
| `page.admin.subscription.upload` | 上传许可证文件 | ManageLicenseModal → 选文件 | manage-cloud [读] | 界面: [待渲染实测] LicenseFilePreview ／ 导航: 仍在模态 [读] ／ 持久化: 读文件后再走 apply [读] | core | page.admin.subscription.apply | useLicenseFileInput.ts [读] |
| `page.admin.subscription.remove` | 移除许可证密钥 | ManageLicenseModal → Remove_license_key | 已有许可证 [读] | 界面: [待渲染实测] 确认后卡变社区 ／ 导航: 仍在订阅页 [读] ／ 持久化: POST /v1/cloud.removeLicense [读] | core | page.admin.subscription.apply | useRemoveLicense.ts [读] |
| `page.admin.subscription.copy-url` | 复制站点 URL / 哈希 | PlanCardLicenseDetails → Copy | 有许可证详情 [读] | 界面: [待渲染实测] 剪贴板 ／ 导航: 无 ／ 持久化: 无请求 [读] | core | page.admin.subscription.sync | PlanCardLicenseDetails.tsx [读] |

### E3 Engagement `/admin/engagement/:tab` — `page.admin.engagement.*`

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
|---|---|---|---|---|---|---|---|
| `page.admin.engagement.timezone` | 改报表默认时区 | Engagement → select Default_Timezone_For_Reporting | view-engagement-dashboard + EE [读] | 界面: [待渲染实测] select ／ 导航: 仍在页 [读] ／ 持久化: 无写库；随后图表按此时区 GET [读] | EE:engagement-dashboard | route.admin.engagement | EngagementDashboardPage.tsx [读] |
| `page.admin.engagement.tab.users` | 切到 Users 分析 | Engagement → tab Users | 同上 [读] | 界面: [待渲染实测] Users 卡片组 ／ 导航: /admin/engagement/users [读] ／ 持久化: 无至图表 hook [读] | EE:engagement-dashboard | route.admin.engagement | EngagementDashboardPage.tsx [读] |
| `page.admin.engagement.tab.messages` | 切到 Messages 分析 | Engagement → tab Messages | 同上 | 界面: [待渲染实测] ／ 导航: /admin/engagement/messages [读] ／ 持久化: 无至图表 [读] | EE:engagement-dashboard | page.admin.engagement.tab.users | EngagementDashboardPage.tsx [读] |
| `page.admin.engagement.tab.channels` | 切到 Channels 分析 | Engagement → tab Channels | 同上 | 界面: [待渲染实测] ／ 导航: /admin/engagement/channels [读] ／ 持久化: 无至图表 [读] | EE:engagement-dashboard | page.admin.engagement.tab.users | EngagementDashboardPage.tsx [读] |
| `page.admin.engagement.users.new.period` | 改新用户图周期 | Users → NewUsersSection → Select_period | 同上 | 界面: [待渲染实测] 重绘 ／ 导航: 仍在 users [读] ／ 持久化: GET /v1/engagement-dashboard/users/new-users [读] | EE:engagement-dashboard | page.admin.engagement.tab.users | users/NewUsersSection.tsx [读] |
| `page.admin.engagement.users.new.download` | 下载新用户图数据 | Users → NewUsersSection → download | 同上 | 界面: [待渲染实测] 本地下载 ／ 导航: 仍在页 [读] ／ 持久化: 无 REST，客户端导出 [读] | EE:engagement-dashboard | page.admin.engagement.users.new.period | users/NewUsersSection.tsx [读] |
| `page.admin.engagement.users.active.download` | 下载活跃用户图数据 | Users → ActiveUsersSection → download | 同上 | 界面: [待渲染实测] 下载 ／ 导航: 仍在页 [读] ／ 持久化: GET /v1/engagement-dashboard/users/active-users 后客户端导出 [读] | EE:engagement-dashboard | page.admin.engagement.tab.users | users/ActiveUsersSection.tsx [读] |
| `page.admin.engagement.users.tod.period` | 改日内时段用户图周期 | Users → UsersByTimeOfTheDaySection → Select_period | 同上 | 界面: [待渲染实测] 重绘 ／ 导航: 仍在页 [读] ／ 持久化: GET .../users/users-by-time-of-the-day-in-a-week [读] | EE:engagement-dashboard | page.admin.engagement.tab.users | users/UsersByTimeOfTheDaySection.tsx [读] |
| `page.admin.engagement.users.tod.download` | 下载日内时段用户图 | UsersByTimeOfTheDaySection → download | 同上 | 界面: [待渲染实测] 下载 ／ 导航: 仍在页 [读] ／ 持久化: 客户端导出 [读] | EE:engagement-dashboard | page.admin.engagement.users.tod.period | users/UsersByTimeOfTheDaySection.tsx [读] |
| `page.admin.engagement.users.busiest.period` | 改最忙时段粒度 Hours/Days | Users → BusiestChatTimesSection → Select_period | 同上 | 界面: [待渲染实测] Hours/Days 切 ／ 导航: 仍在页 [读] ／ 持久化: GET hourly/weekly chat activity [读] | EE:engagement-dashboard | page.admin.engagement.tab.users | users/BusiestChatTimesSection.tsx [读] |
| `page.admin.engagement.users.busiest.prev` | 最忙时段上一窗口 | BusiestChatTimes → previous | 同上 | 界面: [待渲染实测] 日期后退 ／ 导航: 仍在页 [读] ／ 持久化: 同 GET 换日期 [读] | EE:engagement-dashboard | page.admin.engagement.users.busiest.period | users/ContentForHours.tsx [读] |
| `page.admin.engagement.users.busiest.next` | 最忙时段下一窗口 | BusiestChatTimes → next | 同上 | 界面: [待渲染实测] 日期前进 ／ 导航: 仍在页 [读] ／ 持久化: 同 GET [读] | EE:engagement-dashboard | page.admin.engagement.users.busiest.prev | users/ContentForHours.tsx [读] |
| `page.admin.engagement.messages.sent.period` | 改发送消息图周期 | Messages → MessagesSentSection → Select_period | 同上 | 界面: [待渲染实测] 重绘 ／ 导航: 仍在 messages [读] ／ 持久化: GET /v1/engagement-dashboard/messages/messages-sent [读] | EE:engagement-dashboard | page.admin.engagement.tab.messages | messages/MessagesSentSection.tsx [读] |
| `page.admin.engagement.messages.sent.download` | 下载发送消息图 | MessagesSentSection → download | 同上 | 界面: [待渲染实测] 下载 ／ 导航: 仍在页 [读] ／ 持久化: 客户端导出 [读] | EE:engagement-dashboard | page.admin.engagement.messages.sent.period | messages/MessagesSentSection.tsx [读] |
| `page.admin.engagement.messages.channel.period` | 改热门频道图周期 | Messages → MessagesPerChannelSection → Select_period | 同上 | 界面: [待渲染实测] 重绘 ／ 导航: 仍在页 [读] ／ 持久化: GET .../messages/top-five-popular-channels [读] | EE:engagement-dashboard | page.admin.engagement.tab.messages | messages/MessagesPerChannelSection.tsx [读] |
| `page.admin.engagement.messages.channel.download` | 下载热门频道图 | MessagesPerChannelSection → download | 同上 | 界面: [待渲染实测] 下载 ／ 导航: 仍在页 [读] ／ 持久化: 客户端导出 [读] | EE:engagement-dashboard | page.admin.engagement.messages.channel.period | messages/MessagesPerChannelSection.tsx [读] |
| `page.admin.engagement.channels.period` | 改频道总览周期 | Channels → ChannelsOverview → Select_period | 同上 | 界面: [待渲染实测] 表刷新 ／ 导航: 仍在 channels [读] ／ 持久化: GET /v1/engagement-dashboard/channels/list [读] | EE:engagement-dashboard | page.admin.engagement.tab.channels | channels/ChannelsOverview.tsx [读] |
| `page.admin.engagement.channels.download` | 下载频道总览 | ChannelsOverview → download | 同上 | 界面: [待渲染实测] 下载 ／ 导航: 仍在页 [读] ／ 持久化: 客户端导出 [读] | EE:engagement-dashboard | page.admin.engagement.channels.period | channels/ChannelsOverview.tsx [读] |
| `page.admin.engagement.channels.pagination` | 翻页频道总览 | ChannelsOverview → Pagination | 有多页 [读] | 界面: [待渲染实测] 换页 ／ 导航: 仍在页 [读] ／ 持久化: 同 GET count/offset [读] | EE:engagement-dashboard | page.admin.engagement.channels.period | channels/ChannelsOverview.tsx [读] |

### E4 Moderation `/admin/moderation` — `page.admin.moderation.*`

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
|---|---|---|---|---|---|---|---|
| `page.admin.moderation.tab.messages` | 打开已举报消息 | 管理侧栏 Moderation → tab Reported_Messages | view-moderation-console [读] | 界面: [待渲染实测] 举报表 ／ 导航: /admin/moderation [读] ／ 持久化: GET /v1/moderation.reportsByUsers [读] | core | route.admin.moderation | ModerationConsolePage.tsx [读] |
| `page.admin.moderation.tab.users` | 打开已举报用户 | Moderation → tab Reported_Users | 同上 | 界面: [待渲染实测] 用户举报表 ／ 导航: 切 tab [读] ／ 持久化: GET /v1/moderation.userReports [读] | core | page.admin.moderation.tab.messages | ModerationConsolePage.tsx [读] |
| `page.admin.moderation.row` | 点行打开举报详情 | 举报表 → 行单击 | 同上 | 界面: [待渲染实测] 详情上下文 ／ 导航: context=info [读] ／ 持久化: 无至详情 GET [读] | core | page.admin.moderation.tab.messages | ModerationConsoleTableRow.tsx [读] |
| `page.admin.moderation.see-messages` | 菜单查看该用户被举报消息 | 行菜单 → Moderation_See_messages | 同上 | 界面: [待渲染实测] 进详情 Messages ／ 导航: 详情 [读] ／ 持久化: GET /v1/moderation.user.reportedMessages [读] | core | page.admin.moderation.row | ModerationConsoleActions.tsx [读] |
| `page.admin.moderation.dismiss-user` | 驳回该用户全部举报 | 行菜单或详情脚 → Moderation_Dismiss_user_reports / Dismiss_all_reports | manage-moderation-actions [读] | 界面: [待渲染实测] 行消失/toast ／ 导航: 仍在控制台 [读] ／ 持久化: POST /v1/moderation.dismissUserReports [读] | core | page.admin.moderation.row | useDismissUserAction.tsx [读] |
| `page.admin.moderation.delete-all-messages` | 删除该用户全部被举报消息 | 行菜单或详情脚 → Moderation_Delete_all_messages | 同上 | 界面: [待渲染实测] 确认后刷新 ／ 导航: 仍在页 [读] ／ 持久化: POST /v1/moderation.user.deleteReportedMessages [读] | core | page.admin.moderation.row | useDeleteMessagesAction.tsx [读] |
| `page.admin.moderation.deactivate` | 停用被举报用户 | 行菜单或详情 More → Moderation_Deactivate_User | 同上 | 界面: [待渲染实测] 用户 inactive ／ 导航: 仍在页 [读] ／ 持久化: POST /v1/users.setActiveStatus [读] | core | page.admin.users.action.deactivate | useDeactivateUserAction [读] |
| `page.admin.moderation.reset-avatar` | 重置被举报用户头像 | 行菜单或详情 More → Moderation_Reset_avatar | 同上 | 界面: [待渲染实测] 头像回默认 ／ 导航: 仍在页 [读] ／ 持久化: POST /v1/users.resetAvatar [读] | core | page.admin.moderation.row | useResetAvatarAction.tsx [读] |
| `page.admin.moderation.dismiss-reports` | 驳回单条消息举报 | 详情 Messages → Moderation_Dismiss_reports | 同上 | 界面: [待渲染实测] 该条消失 ／ 导航: 仍在详情 [读] ／ 持久化: POST /v1/moderation.dismissReports [读] | core | page.admin.moderation.see-messages | ContextMessage.tsx [读] |
| `page.admin.moderation.goto-message` | 跳到原消息 | 详情 → Moderation_Go_to_message | 消息仍在 [读] | 界面: [待渲染实测] 离开管理进房间 ／ 导航: permalink [读] ／ 持久化: 无 [读] | core | page.admin.moderation.see-messages | ContextMessage.tsx [读] |
| `page.admin.moderation.delete-message` | 删除单条被举报消息 | 详情 → Moderation_Delete_message | manage-moderation-actions [读] | 界面: [待渲染实测] 确认后消息删 ／ 导航: 仍在详情 [读] ／ 持久化: 消息删除 endpoint（useDeleteMessage）[读] | core | page.admin.moderation.see-messages | useDeleteMessage.tsx [读] |

### E5 Rooms `/admin/rooms` — `page.admin.rooms.*`

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
|---|---|---|---|---|---|---|---|
| `page.admin.rooms.search` | 搜索房间 | 管理侧栏 Rooms → Search_rooms | view-room-administration [读] | 界面: [待渲染实测] 表过滤 ／ 导航: 仍在 /admin/rooms [读] ／ 持久化: GET /v1/rooms.adminRooms [读] | core | route.admin.rooms | RoomsTableFilters.tsx [读] |
| `page.admin.rooms.filter.type` | 按房间类型过滤 | Rooms → Filter_by_room 多选 | 同上 | 界面: [待渲染实测] 芯片 ／ 导航: 仍在页 [读] ／ 持久化: 同 GET types [读] | core | page.admin.rooms.search | RoomsTableFilters.tsx [读] |
| `page.admin.rooms.sort` | 排序房间列 | Rooms → 可点列表头 | 同上 | 界面: [待渲染实测] 排序指示 [待渲染实测] ／ 导航: 仍在页 [读] ／ 持久化: 同 GET sort [读] | core | page.admin.rooms.search | RoomsTable.tsx [读] |
| `page.admin.rooms.pagination` | 翻页房间 | Rooms → Pagination | 有多页 [读] | 界面: [待渲染实测] 换页 ／ 导航: 仍在页 [读] ／ 持久化: GET count/offset [读] | core | page.admin.rooms.search | RoomsTable.tsx [读] |
| `page.admin.rooms.row` | 打开房间编辑面板 | Rooms → 行单击 | 同上 | 界面: [待渲染实测] 右侧 EditRoom ／ 导航: /admin/rooms/:context/:id [读] ／ 持久化: 无至改字段 [读] | core | page.admin.rooms.edit.save | RoomsTable.tsx [读] |
| `page.admin.rooms.edit.avatar` | 改房间头像 | 编辑面板 → roomAvatar | edit-room [读] | 界面: [待渲染实测] 预览 ／ 导航: 面板仍开 [读] ／ 持久化: 仅本地至 Save [读] | core；共享 POST /v1/rooms.saveRoomSettings | page.admin.rooms.edit.save | EditRoom.tsx name=roomAvatar [读] |
| `page.admin.rooms.edit.name` | 改房间名 | 编辑面板 → Name | edit-room [读] | 界面: [待渲染实测] textbox ／ 导航: 仍开 [读] ／ 持久化: 仅本地至 Save [读] | core；共享 POST /v1/rooms.saveRoomSettings | page.admin.rooms.edit.save | EditRoom.tsx name=roomName [读] |
| `page.admin.rooms.edit.owner` | 查看房主（只读） | 编辑面板 → Owner | 同上 | 界面: [待渲染实测] 只读 Owner ／ 导航: 无 ／ 持久化: 无请求 [读] | core | page.admin.rooms.edit.name | EditRoom.tsx name=roomOwner [读] |
| `page.admin.rooms.edit.description` | 改房间描述 | 编辑面板 → Description | 同上 | 界面: [待渲染实测] textarea ／ 导航: 仍开 [读] ／ 持久化: 仅本地至 Save [读] | core；共享 POST /v1/rooms.saveRoomSettings | page.admin.rooms.edit.save | EditRoom.tsx name=roomDescription [读] |
| `page.admin.rooms.edit.announcement` | 改房间公告 | 编辑面板 → Announcement | 同上 | 界面: [待渲染实测] ／ 导航: 仍开 [读] ／ 持久化: 仅本地至 Save [读] | core；共享 POST /v1/rooms.saveRoomSettings | page.admin.rooms.edit.save | EditRoom.tsx name=roomAnnouncement [读] |
| `page.admin.rooms.edit.topic` | 改房间主题 | 编辑面板 → Topic | 同上 | 界面: [待渲染实测] ／ 导航: 仍开 [读] ／ 持久化: 仅本地至 Save [读] | core；共享 POST /v1/rooms.saveRoomSettings | page.admin.rooms.edit.save | EditRoom.tsx name=roomTopic [读] |
| `page.admin.rooms.edit.private` | 切换私有/公开 | 编辑面板 → Private | 非 DM [读] | 界面: [待渲染实测] switch ／ 导航: 仍开 [读] ／ 持久化: 仅本地至 Save（roomType）[读] | core；共享 POST /v1/rooms.saveRoomSettings | page.admin.rooms.edit.save | EditRoom.tsx name=roomType [读] |
| `page.admin.rooms.edit.readonly` | 切换只读 | 编辑面板 → Read_only | 非 DM [读] | 界面: [待渲染实测] switch ／ 导航: 仍开 [读] ／ 持久化: 仅本地至 Save [读] | core；共享 POST /v1/rooms.saveRoomSettings | page.admin.rooms.edit.save | EditRoom.tsx name=readOnly [读] |
| `page.admin.rooms.edit.react-when-readonly` | 只读时仍可反应 | 编辑面板 → React_when_read_only | readOnly [读] | 界面: [待渲染实测] switch ／ 导航: 仍开 [读] ／ 持久化: 仅本地至 Save [读] | core；共享 POST /v1/rooms.saveRoomSettings | page.admin.rooms.edit.readonly | EditRoom.tsx name=reactWhenReadOnly [读] |
| `page.admin.rooms.edit.archived` | 归档/取消归档 | 编辑面板 → Room_archivation_state_true | 非 DM [读] | 界面: [待渲染实测] switch ／ 导航: 仍开 [读] ／ 持久化: 归档动作 + Save [读] | core；共享 POST /v1/rooms.saveRoomSettings | page.admin.rooms.edit.save | EditRoom.tsx name=archived [读] |
| `page.admin.rooms.edit.default` | 设为默认房间 | 编辑面板 → Default | 非 DM [读] | 界面: [待渲染实测] switch ／ 导航: 仍开 [读] ／ 持久化: 仅本地至 Save [读] | core；共享 POST /v1/rooms.saveRoomSettings | page.admin.rooms.edit.save | EditRoom.tsx name=isDefault [读] |
| `page.admin.rooms.edit.favorite` | 默认收藏 | 编辑面板 → Favorite | isDefault [读] | 界面: [待渲染实测] switch ／ 导航: 仍开 [读] ／ 持久化: 仅本地至 Save [读] | core；共享 POST /v1/rooms.saveRoomSettings | page.admin.rooms.edit.default | EditRoom.tsx name=favorite [读] |
| `page.admin.rooms.edit.featured` | 精选房间 | 编辑面板 → Featured | 非 DM [读] | 界面: [待渲染实测] switch ／ 导航: 仍开 [读] ／ 持久化: 仅本地至 Save [读] | core；共享 POST /v1/rooms.saveRoomSettings | page.admin.rooms.edit.save | EditRoom.tsx name=featured [读] |
| `page.admin.rooms.edit.reset` | 重置未保存房间编辑 | 编辑面板 → Reset | dirty [读] | 界面: [待渲染实测] 回滚 ／ 导航: 仍开 [读] ／ 持久化: 无请求 [读] | core | page.admin.rooms.edit.save | EditRoom.tsx [读] |
| `page.admin.rooms.edit.save` | 保存房间设置 | 编辑面板 → Save | dirty + edit-room [读] | 界面: [待渲染实测] toast ／ 导航: 仍在 rooms [读] ／ 持久化: POST /v1/rooms.saveRoomSettings [读] | core | page.admin.rooms.row | EditRoom.tsx [读] |
| `page.admin.rooms.edit.delete` | 删除房间 | 编辑面板 → Delete | delete-room [读] | 界面: [待渲染实测] 确认后行消失 ／ 导航: 回列表 [读] ／ 持久化: rooms.delete（useDeleteRoom）[读] | core | page.admin.rooms.row | EditRoom.tsx useDeleteRoom [读] |

### E6 Users `/admin/users` — `page.admin.users.*`

`rg name=` AdminUserForm + SetRandomPassword：avatar email verified name username freeSwitchExtension setRandomPassword requirePasswordChange password passwordConfirmation roles joinDefaultChannels sendWelcomeEmail statusText bio nickname customFields。

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
|---|---|---|---|---|---|---|---|
| `page.admin.users.tab.all` | 看全部用户 | 管理侧栏 Users → tab All | view-user-administration [读] | 界面: [待渲染实测] 全量表 ／ 导航: /admin/users [读] ／ 持久化: GET /v1/users.listByStatus [读] | core | route.admin.users | AdminUsersPage.tsx [读] |
| `page.admin.users.tab.pending` | 看待处理用户 | Users → tab Pending | 同上 | 界面: [待渲染实测] ／ 导航: 切 tab [读] ／ 持久化: 同 GET pending [读] | core | page.admin.users.tab.all | AdminUsersPage.tsx [读] |
| `page.admin.users.tab.active` | 看活跃用户 | Users → tab Active | 同上 | 界面: [待渲染实测] ／ 导航: 切 tab [读] ／ 持久化: 同 GET active [读] | core | page.admin.users.tab.all | AdminUsersPage.tsx [读] |
| `page.admin.users.tab.deactivated` | 看已停用用户 | Users → tab Deactivated | 同上 | 界面: [待渲染实测] ／ 导航: 切 tab [读] ／ 持久化: 同 GET deactivated [读] | core | page.admin.users.tab.all | AdminUsersPage.tsx [读] |
| `page.admin.users.search` | 搜索用户 | Users → Search_Users | 同上 | 界面: [待渲染实测] 表过滤 ／ 导航: 仍在页 [读] ／ 持久化: 同 GET text [读] | core | page.admin.users.tab.all | UsersTableFilters.tsx [读] |
| `page.admin.users.filter.role` | 按角色过滤用户 | Users → Filter_by_role | 同上 | 界面: [待渲染实测] 多选角色 ／ 导航: 仍在页 [读] ／ 持久化: 同 GET roles [读] | core | page.admin.users.search | UsersTableFilters.tsx [读] |
| `page.admin.users.sort` | 排序用户列 | Users → 可点列表头 | 同上 | 界面: [待渲染实测] 排序指示 ／ 导航: 仍在页 [读] ／ 持久化: 同 GET sort [读] | core | page.admin.users.search | UsersTable.tsx [读] |
| `page.admin.users.pagination` | 翻页用户 | Users → Pagination | 有多页 | 界面: [待渲染实测] 换页 ／ 导航: 仍在页 [读] ／ 持久化: GET count/offset [读] | core | page.admin.users.search | UsersTable.tsx [读] |
| `page.admin.users.invite` | 打开邀请面板 | Users → Invite | bulk-register-user [读] | 界面: [待渲染实测] AdminInviteUsers ／ 导航: /admin/users/invite [读] ／ 持久化: 无至 Send [读] | core | page.admin.users.invite.send | UsersPageHeaderContent.tsx [读] |
| `page.admin.users.invite.emails` | 填写邀请邮箱列表 | Invite 面板 → 邮箱 textarea | 同上 | 界面: [待渲染实测] 多邮箱 ／ 导航: 仍在面板 [读] ／ 持久化: 仅本地至 Send [读] | core；提交 POST /v1/sendInvitationEmail | page.admin.users.invite.send | AdminInviteUsers.tsx [读] |
| `page.admin.users.invite.send` | 发送邀请邮件 | Invite 面板 → Send | SMTP 已配 + 权限 [读] | 界面: [待渲染实测] toast ／ 导航: 仍在 users [读] ／ 持久化: POST /v1/sendInvitationEmail [读] | core | page.admin.users.invite.emails | AdminInviteUsers.tsx [读] |
| `page.admin.users.invite.setup-smtp` | 无 SMTP 时去配邮件 | Invite 面板 → Setup_SMTP | SMTP 未配 [读] | 界面: [待渲染实测] 按钮 ／ 导航: /admin/settings/Email [读] ／ 持久化: 无 [读] | core | page.admin.settings.open.email | AdminInviteUsers.tsx [读] |
| `page.admin.users.new` | 打开新建用户表单 | Users → New_user | create-user [读] | 界面: [待渲染实测] AdminUserForm ／ 导航: /admin/users/new [读] ／ 持久化: 无至 Save [读] | core | page.admin.users.form.save | UsersPageHeaderContent.tsx [读] |
| `page.admin.users.seats` | 购买更多席位 | Users → Buy_more_seats | 席位上限 [读] | 界面: [待渲染实测] ／ 导航: Cloud checkout [读] ／ 持久化: 无本站 REST [读] | core | page.admin.subscription.checkout | UsersPageHeaderContent.tsx SeatsCapUsage [读] |
| `page.admin.users.row` | 打开用户详情 | Users → 行单击 | view-user-administration [读] | 界面: [待渲染实测] info 面板 ／ 导航: context=info [读] ／ 持久化: 无 [读] | core | page.admin.users.action.edit | UsersTableRow.tsx [读] |
| `page.admin.users.form.avatar` | 设用户头像 | New/Edit → avatar | create-user / edit-other-user-info [读] | 界面: [待渲染实测] 头像编辑器 ／ 导航: 仍在表单 [读] ／ 持久化: 仅本地至 Save [读] | core；共享 POST /v1/users.create 或 /v1/users.update | page.admin.users.form.save | AdminUserForm.tsx name=avatar [读] |
| `page.admin.users.form.email` | 填 Email | New/Edit → Email | 同上 | 界面: [待渲染实测] textbox ／ 导航: 仍在表单 [读] ／ 持久化: 仅本地至 Save [读] | core；共享 POST /v1/users.create 或 /v1/users.update | page.admin.users.form.save | AdminUserForm.tsx name=email [读] |
| `page.admin.users.form.verified` | 标记邮箱已验证 | New/Edit → Mark_email_as_verified | 同上 | 界面: [待渲染实测] switch ／ 导航: 仍在表单 [读] ／ 持久化: 仅本地至 Save [读] | core；共享 POST /v1/users.create 或 /v1/users.update | page.admin.users.form.email | AdminUserForm.tsx name=verified [读] |
| `page.admin.users.form.name` | 填 Name | New/Edit → Name | 同上 | 界面: [待渲染实测] ／ 导航: 仍在表单 [读] ／ 持久化: 仅本地至 Save [读] | core；共享 POST /v1/users.create 或 /v1/users.update | page.admin.users.form.save | AdminUserForm.tsx name=name [读] |
| `page.admin.users.form.username` | 填 Username | New/Edit → Username | 同上 | 界面: [待渲染实测] ／ 导航: 仍在表单 [读] ／ 持久化: 仅本地至 Save [读] | core；共享 POST /v1/users.create 或 /v1/users.update | page.admin.users.form.save | AdminUserForm.tsx name=username [读] |
| `page.admin.users.form.voip-extension` | 填 Voice_call_extension | New/Edit → Voice_call_extension | VoIP 扩展可见（useShowVoipExtension）[读] | 界面: [待渲染实测] 条件字段 ／ 导航: 仍在表单 [读] ／ 持久化: 仅本地至 Save [读] | core；共享 POST /v1/users.create 或 /v1/users.update | page.admin.users.form.save | AdminUserForm.tsx name=freeSwitchExtension [读] |
| `page.admin.users.form.set-random-pwd` | 选随机密码并邮件发送 | New/Edit → Set_randomly_and_send_by_email | SMTP；与手动密码互斥 [读] | 界面: [待渲染实测] radio ／ 导航: 仍在表单 [读] ／ 持久化: 仅本地至 Save（setRandomPassword=true）[读] | core；共享 POST /v1/users.create 或 /v1/users.update | page.admin.users.form.password | AdminUserSetRandomPasswordRadios.tsx [读] |
| `page.admin.users.form.set-manual-pwd` | 选手动设置密码 | New/Edit → Set_manually | 同上 | 界面: [待渲染实测] radio 露出密码框 ／ 导航: 仍在表单 [读] ／ 持久化: 仅本地至 Save [读] | core；共享 POST /v1/users.create 或 /v1/users.update | page.admin.users.form.password | AdminUserSetRandomPasswordRadios.tsx [读] |
| `page.admin.users.form.require-change` | 要求下次改密 | New/Edit → Require_password_change | 同上 | 界面: [待渲染实测] switch ／ 导航: 仍在表单 [读] ／ 持久化: 仅本地至 Save [读] | core；共享 POST /v1/users.create 或 /v1/users.update | page.admin.users.form.save | AdminUserSetRandomPasswordContent.tsx name=requirePasswordChange [读] |
| `page.admin.users.form.password` | 填 Password | Set_manually → Password | 手动密码模式 [读] | 界面: [待渲染实测] PasswordInput ／ 导航: 仍在表单 [读] ／ 持久化: 仅本地至 Save [读] | core；共享 POST /v1/users.create 或 /v1/users.update | page.admin.users.form.save | AdminUserSetRandomPasswordContent.tsx name=password [读] |
| `page.admin.users.form.password-confirm` | 确认 Password | Set_manually → Confirm_password | 手动密码模式 [读] | 界面: [待渲染实测] 不匹配拦提交 [读] ／ 导航: 仍在表单 [读] ／ 持久化: 仅本地 [读] | core；共享 POST /v1/users.create 或 /v1/users.update | page.admin.users.form.password | AdminUserSetRandomPasswordContent.tsx name=passwordConfirmation [读] |
| `page.admin.users.form.roles` | 分配 Roles | New/Edit → Roles | 同上 | 界面: [待渲染实测] 多选 ／ 导航: 仍在表单 [读] ／ 持久化: 仅本地至 Save [读] | core；共享 POST /v1/users.create 或 /v1/users.update | page.admin.users.form.save | AdminUserForm.tsx name=roles [读] |
| `page.admin.users.form.join-default` | 加入默认频道 | New → Join_default_channels | 新建 [读] | 界面: [待渲染实测] switch ／ 导航: 仍在表单 [读] ／ 持久化: 仅本地至 Save [读] | core；共享 POST /v1/users.create 或 /v1/users.update | page.admin.users.form.save | AdminUserForm.tsx name=joinDefaultChannels [读] |
| `page.admin.users.form.send-welcome` | 发送欢迎邮件 | New/Edit → Send_welcome_email | SMTP [读] | 界面: [待渲染实测] switch ／ 导航: 仍在表单 [读] ／ 持久化: 创建时可 POST /v1/users.sendWelcomeEmail [读] | core；共享 POST /v1/users.create 或 /v1/users.update | page.admin.users.form.save | AdminUserForm.tsx name=sendWelcomeEmail [读] |
| `page.admin.users.form.show-additional` | 展开/收起附加字段 | New/Edit → Show/Hide_additional_fields | 同上 | 界面: [待渲染实测] 露出 Status/Bio/Nickname ／ 导航: 仍在表单 [读] ／ 持久化: 无请求 [读] | core | page.admin.users.form.status-text | AdminUserForm.tsx [读] |
| `page.admin.users.form.status-text` | 填 StatusMessage | 附加字段 → StatusMessage | 已展开 [读] | 界面: [待渲染实测] ／ 导航: 仍在表单 [读] ／ 持久化: 仅本地至 Save [读] | core；共享 POST /v1/users.create 或 /v1/users.update | page.admin.users.form.save | AdminUserForm.tsx name=statusText [读] |
| `page.admin.users.form.bio` | 填 Bio | 附加字段 → Bio | 已展开 | 界面: [待渲染实测] ／ 导航: 仍在表单 [读] ／ 持久化: 仅本地至 Save [读] | core；共享 POST /v1/users.create 或 /v1/users.update | page.admin.users.form.save | AdminUserForm.tsx name=bio [读] |
| `page.admin.users.form.nickname` | 填 Nickname | 附加字段 → Nickname | 已展开 | 界面: [待渲染实测] ／ 导航: 仍在表单 [读] ／ 持久化: 仅本地至 Save [读] | core；共享 POST /v1/users.create 或 /v1/users.update | page.admin.users.form.save | AdminUserForm.tsx name=nickname [读] |
| `page.admin.users.form.custom-fields` | 填自定义字段 | New/Edit → CustomFields | 配置了自定义字段 [读] | 界面: [待渲染实测] 动态字段 ／ 导航: 仍在表单 [读] ／ 持久化: 仅本地至 Save [读] | core；共享 POST /v1/users.create 或 /v1/users.update | page.admin.users.form.save | AdminUserForm.tsx name=customFields.* [读] |
| `page.admin.users.form.save` | 保存用户 | New/Edit → Add_user / Save_user | 校验通过 [读] | 界面: [待渲染实测] toast ／ 导航: 回列表或 info [读] ／ 持久化: POST /v1/users.create 或 /v1/users.update [读] | core | page.admin.users.new | AdminUserForm.tsx [读] |
| `page.admin.users.action.dm` | 从详情开直连消息 | 用户 info → Direct_Message | create-d [读] | 界面: [待渲染实测] 离开管理 ／ 导航: DM 房间 [读] ／ 持久化: 进房交房间分册 [读] | core | page.create.dm.submit | useAdminUserInfoActions.ts [读] |
| `page.admin.users.action.edit` | 从详情进入编辑 | 用户 info → Edit | edit-other-user-info [读] | 界面: [待渲染实测] 同表单 ／ 导航: context=edit [读] ／ 持久化: 无至 Save [读] | core | page.admin.users.form.save | useAdminUserInfoActions.ts [读] |
| `page.admin.users.action.admin` | 授予/撤销管理员 | info → Grant/Remove admin | assign-admin-role [读] | 界面: [待渲染实测] 角色变化 ／ 导航: 仍在 info [读] ／ 持久化: POST /v1/roles.addUserToRole 或 removeUserFromRole [读] | core | page.admin.users.row | useChangeAdminStatusAction.ts [读] |
| `page.admin.users.action.deactivate` | 停用/启用用户 | info → Activate/Deactivate | 权限 [读] | 界面: [待渲染实测] 状态切 ／ 导航: 仍在 info [读] ／ 持久化: POST /v1/users.setActiveStatus [读] | core | page.admin.users.tab.deactivated | useChangeUserStatusAction.ts [读] |
| `page.admin.users.action.reset-e2e` | 重置用户 E2E 密钥 | info → Reset E2E | 权限 [读] | 界面: [待渲染实测] 确认 ／ 导航: 仍在 info [读] ／ 持久化: POST /v1/users.resetE2EKey [读] | core | page.account.security.e2e-reset | useResetE2EEKeyAction.tsx [读] |
| `page.admin.users.action.reset-totp` | 重置用户 TOTP | info → Reset TOTP | 权限 [读] | 界面: [待渲染实测] 确认 ／ 导航: 仍在 info [读] ／ 持久化: POST /v1/users.resetTOTP [读] | core | page.account.security.totp.toggle | useResetTOTPAction.tsx [读] |
| `page.admin.users.action.delete` | 删除用户 | info → Delete | delete-user [读] | 界面: [待渲染实测] 确认（可含 owner 变更）／ 导航: 回列表 [读] ／ 持久化: POST /v1/users.delete [读] | core | page.admin.users.row | useDeleteUserAction.tsx [读] |

### E7 AI Center `/admin/ai-center` — `page.admin.ai-center.*`

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
|---|---|---|---|---|---|---|---|
| `page.admin.ai-center.view-options` | 无 AI 许可时去看订阅选项 | 管理侧栏 AI_Center → Callout → View_options | view/edit-privileged-setting 或 manage-selected-settings；无 AI 许可模块才渲染 [读] | 界面: [待渲染实测] Callout AI_Center_license_required_title ／ 导航: /admin/subscription [读] ／ 持久化: 无 [读] | EE:ai | page.admin.subscription.checkout | AICenterOverview.tsx [读] |
| `page.admin.ai-center.search` | 配置智能搜索 | AI Center 卡 Intelligent_Search → Configure | 同上；无许可卡标 Locked [读] | 界面: [待渲染实测] 卡 status Enabled/Disabled/Locked ／ 导航: /admin/ai-center/search [读] ／ 持久化: 打开设置组 Intelligent_Search，无请求至 Save [读] | EE:ai；组内字段不拆（同 Settings 约定） | page.admin.settings.save | AICenterOverview.tsx AISettingsSection.tsx section=Intelligent_Search [读] |
| `page.admin.ai-center.llm` | 管理 LLM 提供方 | 卡 AI_Center_LLM_Providers → Manage | 同上 | 界面: [待渲染实测] 卡 status Available/Locked ／ 导航: /admin/ai-center/llm-providers [读] ／ 持久化: 打开设置组 AI_LLM_Provider，无请求至 Save [读] | EE:ai；组内字段不拆 | page.admin.settings.save | AICenterOverview.tsx AISettingsSection.tsx section=AI_LLM_Provider [读] |
| `page.admin.ai-center.mcp` | 配置 MCP | 卡 MCP → Configure | 同上 | 界面: [待渲染实测] 卡 status Enabled/Disabled/Locked ／ 导航: /admin/ai-center/mcp [读] ／ 持久化: 打开设置组 MCP，无请求至 Save [读] | EE:ai；组内字段不拆 | page.admin.settings.save | AICenterOverview.tsx AISettingsSection.tsx section=MCP [读] |
| `page.admin.ai-center.section.save` | 保存当前 AI 设置段 | search/llm/mcp 段 → Save_changes | edit-privileged-setting [读] | 界面: [待渲染实测] toast ／ 导航: 仍在该 section [读] ／ 持久化: 设置 dispatch（同 Settings Save）[读] | core；共享设置保存 | page.admin.ai-center.search | AISettingsSection.tsx [读] |

### E8 Invites `/admin/invites` — `page.admin.invites.*`

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
|---|---|---|---|---|---|---|---|
| `page.admin.invites.list` | 查看邀请链接表 | 管理侧栏 Invites | create-invite-links [读] | 界面: [待渲染实测] 表或空态 ／ 导航: /admin/invites [读] ／ 持久化: GET /v1/listInvites [读] | core | route.admin.invites | InvitesPage.tsx [读] |
| `page.admin.invites.remove` | 撤销一条邀请 | Invites → 行 → 删除叉 | 同上 | 界面: [待渲染实测] 行消失 ／ 导航: 仍在页 [读] ／ 持久化: DELETE /v1/removeInvite/:_id [读] | core | page.admin.invites.list | InviteRow.tsx [读] |
| `page.admin.invites.reload` | 加载失败后重载邀请表 | Invites → Reload_page | query error [读] | 界面: [待渲染实测] 错误态 ／ 导航: 仍在页 [读] ／ 持久化: 再 GET /v1/listInvites [读] | core | page.admin.invites.list | InvitesPage.tsx [读] |

### E9 User Status `/admin/user-status` — `page.admin.user-status.*`

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
|---|---|---|---|---|---|---|---|
| `page.admin.user-status.new` | 打开新建自定义状态 | 管理侧栏 User_Status → New_custom_status | manage-user-status [读] | 界面: [待渲染实测] 表单 ／ 导航: context=new [读] ／ 持久化: 无至 Save [读] | core | page.admin.user-status.save | CustomUserStatusRoute.tsx [读] |
| `page.admin.user-status.presence-service` | 去 Presence 服务设置 | User Status → Presence_service | 同上 | 界面: [待渲染实测] 按钮 ／ 导航: 相关 Settings 组 [读] ／ 持久化: 无 [读] | core | page.admin.settings.open.general | CustomUserStatusRoute.tsx [读] |
| `page.admin.user-status.row` | 打开编辑自定义状态 | 表 → 行 | 同上 | 界面: [待渲染实测] 表单预填 ／ 导航: context=edit [读] ／ 持久化: 无至 Save [读] | core | page.admin.user-status.save | CustomUserStatusRoute.tsx [读] |
| `page.admin.user-status.name` | 填状态 Name | 表单 → Name | 同上 | 界面: [待渲染实测] textbox ／ 导航: 仍在表单 [读] ／ 持久化: 仅本地至 Save [读] | core；共享 POST /v1/custom-user-status.create 或 .update | page.admin.user-status.save | CustomUserStatusForm.tsx name=name [读] |
| `page.admin.user-status.type` | 选 Presence 类型 | 表单 → Presence | 同上 | 界面: [待渲染实测] select ／ 导航: 仍在表单 [读] ／ 持久化: 仅本地至 Save [读] | core；共享 create/update | page.admin.user-status.save | CustomUserStatusForm.tsx name=statusType [读] |
| `page.admin.user-status.cancel` | 取消未保存状态 | 表单 → Cancel | dirty 或任意 [读] | 界面: [待渲染实测] 关面板 ／ 导航: 回列表 [读] ／ 持久化: 无 [读] | core | page.admin.user-status.save | CustomUserStatusForm.tsx [读] |
| `page.admin.user-status.save` | 保存自定义状态 | 表单 → Save | 校验通过 [读] | 界面: [待渲染实测] toast ／ 导航: 回列表 [读] ／ 持久化: POST /v1/custom-user-status.create 或 .update [读] | core | page.admin.user-status.name | CustomUserStatusForm.tsx [读] |
| `page.admin.user-status.delete` | 删除自定义状态 | 编辑表单 → Delete | 已有记录 [读] | 界面: [待渲染实测] 确认 ／ 导航: 回列表 [读] ／ 持久化: POST /v1/custom-user-status.delete [读] | core | page.admin.user-status.row | CustomUserStatusForm.tsx [读] |

### E10 Permissions `/admin/permissions` — `page.admin.permissions.*`

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
|---|---|---|---|---|---|---|---|
| `page.admin.permissions.tab.permissions` | 看权限矩阵 | 管理侧栏 Permissions → tab Permissions | access-permissions 或 access-setting-permissions [读] | 界面: [待渲染实测] 矩阵 ／ 导航: /admin/permissions [读] ／ 持久化: 权限查询 [读] | core | route.admin.permissions | PermissionsPage.tsx [读] |
| `page.admin.permissions.tab.settings` | 看设置权限 | Permissions → tab Settings | access-setting-permissions [读] | 界面: [待渲染实测] 设置权表 ／ 导航: 切 tab [读] ／ 持久化: 权限查询 [读] | core | page.admin.permissions.tab.permissions | PermissionsPage.tsx [读] |
| `page.admin.permissions.search` | 搜索权限名 | 矩阵 → Search | 同上 | 界面: [待渲染实测] 客户端过滤 ／ 导航: 仍在页 [读] ／ 持久化: 无 REST [读] | core | page.admin.permissions.tab.permissions | PermissionsTableFilter.tsx [读] |
| `page.admin.permissions.toggle` | 切换某角色某权限单元格 | 矩阵 → 权限×角色 checkbox | access-permissions [读] | 界面: [待渲染实测] 勾选即时变 ／ 导航: 仍在页 [读] ／ 持久化: POST /v1/permissions.addRole 或 .removeRole [读] | core | page.admin.permissions.tab.permissions | RoleCell.tsx PermissionsTable.tsx [读] |
| `page.admin.permissions.pagination` | 翻页权限矩阵 | 矩阵 → Pagination | 有多页 | 界面: [待渲染实测] 换页 ／ 导航: 仍在页 [读] ／ 持久化: 权限查询切片 [读] | core | page.admin.permissions.search | PermissionsTable.tsx [读] |
| `page.admin.permissions.role.new` | 打开新建角色 | Permissions → New_role | access-permissions [读] | 界面: [待渲染实测] RoleForm ／ 导航: context=new [读] ／ 持久化: 无至 Save [读] | core | page.admin.permissions.role.save | PermissionsPage.tsx [读] |
| `page.admin.permissions.role.name` | 填角色名 | 角色表单 → Role | 同上 | 界面: [待渲染实测] ／ 导航: 仍在表单 [读] ／ 持久化: 仅本地至 Save [读] | core；共享 POST /v1/roles.create 或 .update | page.admin.permissions.role.save | RoleForm.tsx name=name [读] |
| `page.admin.permissions.role.description` | 填角色描述 | 角色表单 → Description | 同上 | 界面: [待渲染实测] ／ 导航: 仍在表单 [读] ／ 持久化: 仅本地至 Save [读] | core；共享 create/update | page.admin.permissions.role.save | RoleForm.tsx name=description [读] |
| `page.admin.permissions.role.scope` | 选角色 Scope | 角色表单 → Scope | 同上 | 界面: [待渲染实测] select ／ 导航: 仍在表单 [读] ／ 持久化: 仅本地至 Save [读] | core；共享 create/update | page.admin.permissions.role.save | RoleForm.tsx name=scope [读] |
| `page.admin.permissions.role.mandatory-2fa` | 强制该角色 2FA | 角色表单 → Users must use Two Factor Authentication | 同上 | 界面: [待渲染实测] switch ／ 导航: 仍在表单 [读] ／ 持久化: 仅本地至 Save [读] | core；共享 create/update | page.admin.permissions.role.save | RoleForm.tsx name=mandatory2fa [读] |
| `page.admin.permissions.role.save` | 保存角色 | 角色表单 → Save | 校验通过 [读] | 界面: [待渲染实测] toast ／ 导航: 回权限页 [读] ／ 持久化: POST /v1/roles.create 或 .update [读] | core | page.admin.permissions.role.name | EditRolePage.tsx [读] |
| `page.admin.permissions.role.delete` | 删除角色 | 角色表单 → Delete | 非受保护角色 [读] | 界面: [待渲染实测] 确认 ／ 导航: 回权限页 [读] ／ 持久化: POST /v1/roles.delete [读] | core | page.admin.permissions.role.new | EditRolePage.tsx [读] |
| `page.admin.permissions.users-in-role` | 打开角色成员 | 角色表单 → Users_in_role | 同上 | 界面: [待渲染实测] 成员表 ／ 导航: users-in-role [读] ／ 持久化: GET /v1/roles.getUsersInRole [读] | core | page.admin.permissions.users-in-role.add | EditRolePage.tsx [读] |
| `page.admin.permissions.users-in-role.room` | 按房间筛角色成员 | Users_in_role → Choose_a_room | scope 需房间时 [读] | 界面: [待渲染实测] RoomAutoComplete ／ 导航: 仍在页 [读] ／ 持久化: 再 GET getUsersInRole {rid} [读] | core | page.admin.permissions.users-in-role | UsersInRolePage.tsx name=rid [读] |
| `page.admin.permissions.users-in-role.users` | 选择要加入的用户 | Users_in_role → Add_users | 同上 | 界面: [待渲染实测] 多选 ／ 导航: 仍在页 [读] ／ 持久化: 仅本地至 Add [读] | core；提交 POST /v1/roles.addUserToRole | page.admin.permissions.users-in-role.add | UsersInRolePage.tsx name=users [读] |
| `page.admin.permissions.users-in-role.add` | 把用户加入角色 | Users_in_role → Add | 已选用户 [读] | 界面: [待渲染实测] 行出现 ／ 导航: 仍在页 [读] ／ 持久化: POST /v1/roles.addUserToRole [读] | core | page.admin.permissions.users-in-role.users | UsersInRolePage.tsx [读] |
| `page.admin.permissions.users-in-role.remove` | 从角色移除用户 | 成员行 → Remove | 同上 | 界面: [待渲染实测] 行消失 ／ 导航: 仍在页 [读] ／ 持久化: POST /v1/roles.removeUserFromRole [读] | core | page.admin.permissions.users-in-role.add | UsersInRoleTableRow.tsx [读] |
| `page.admin.permissions.users-in-role.pagination` | 翻页角色成员 | Users_in_role → Pagination | 有多页 | 界面: [待渲染实测] 换页 ／ 导航: 仍在页 [读] ／ 持久化: GET getUsersInRole offset [读] | core | page.admin.permissions.users-in-role | UsersInRolePage.tsx [读] |

### E11 ABAC `/admin/ABAC` — `page.admin.abac.*`

ABAC Settings 页签渲染 `ee/server/settings/abac.ts` 具名键（挂在 General 组 section=ABAC*）。本表按这些键一行一个，因它们挂在 **ABAC 侧栏页** 而非 Settings 索引。

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
|---|---|---|---|---|---|---|---|
| `page.admin.abac.sync-ldap` | 立即 LDAP 同步（ABAC 头） | 管理侧栏 ABAC → LDAP_Sync_Now | abac-management + 对应 tab 权；ABAC 与 LDAP 均开否则 disabled [读] | 界面: [待渲染实测] 按钮 title=Enable_ABAC_and_LDAP_to_sync ／ 导航: 仍在 /admin/ABAC [读] ／ 持久化: LDAP sync hook [读] | EE:abac | page.admin.settings.ldap.sync-now | AdminABACPage.tsx [读] |
| `page.admin.abac.learn-more` | 打开 ABAC 文档 | ABAC → ABAC_Learn_More | abac-management [读] | 界面: [待渲染实测] 外链 ／ 导航: 文档站 [读] ／ 持久化: 无 [读] | EE:abac | route.admin.abac | AdminABACPage.tsx [读] |
| `page.admin.abac.tab.settings` | 打开 ABAC 设置页签 | ABAC → tab Settings | manage-abac-admin-settings [读] | 界面: [待渲染实测] SettingField 列表 ／ 导航: /admin/ABAC/settings [读] ／ 持久化: 无至改字段 [读] | EE:abac | page.admin.abac.setting.enabled | AdminABACTabs.tsx [读] |
| `page.admin.abac.tab.attributes` | 打开房间属性页签 | ABAC → tab ABAC_Room_Attributes | manage-abac-admin-room-attributes；外部 store 时不渲染 [读] | 界面: [待渲染实测] 属性表 ／ 导航: /admin/ABAC/room-attributes [读] ／ 持久化: GET /v1/abac/attributes [读] | EE:abac | page.admin.abac.attr.search | AdminABACTabs.tsx [读] |
| `page.admin.abac.tab.rooms` | 打开 ABAC 房间页签 | ABAC → tab Rooms | manage-abac-admin-rooms [读] | 界面: [待渲染实测] 房间表 ／ 导航: /admin/ABAC/rooms [读] ／ 持久化: GET /v1/abac/rooms [读] | EE:abac | page.admin.abac.rooms.search | AdminABACTabs.tsx [读] |
| `page.admin.abac.tab.logs` | 打开 ABAC 审计日志页签 | ABAC → tab ABAC_Logs | view-abac-admin-audit [读] | 界面: [待渲染实测] 日志表 [待渲染实测] ／ 导航: /admin/ABAC/logs [读] ／ 持久化: ABAC audit GET [读] | EE:abac | route.admin.abac | AdminABACTabs.tsx [读] |
| `page.admin.abac.setting.enabled` | 开关 ABAC | ABAC → Settings → ABAC_Enabled | manage-abac-admin-settings + enableQuery（多数要 ABAC_Enabled）[读] | 界面: [待渲染实测] boolean 控件 ／ 导航: 仍在 Settings 页签 [读] ／ 持久化: 仅本地至页级 Save [读] | EE:abac；共享 Settings dispatch（ABAC 页 Settings 页签，非 972 全拆） | page.admin.abac.setting.save | ee/server/settings/abac.ts ABAC_Enabled [读] |
| `page.admin.abac.setting.pdp-type` | 选 PDP 类型 local/virtru | ABAC → Settings → ABAC_PDP_Type | manage-abac-admin-settings + enableQuery（多数要 ABAC_Enabled）[读] | 界面: [待渲染实测] select 控件 ／ 导航: 仍在 Settings 页签 [读] ／ 持久化: 仅本地至页级 Save [读] | EE:abac；共享 Settings dispatch（ABAC 页 Settings 页签，非 972 全拆） | page.admin.abac.setting.save | ee/server/settings/abac.ts ABAC_PDP_Type [读] |
| `page.admin.abac.setting.attribute-store` | 选属性存储 | ABAC → Settings → ABAC_Attribute_Store | manage-abac-admin-settings + enableQuery（多数要 ABAC_Enabled）[读] | 界面: [待渲染实测] select 控件 ／ 导航: 仍在 Settings 页签 [读] ／ 持久化: 仅本地至页级 Save [读] | EE:abac；共享 Settings dispatch（ABAC 页 Settings 页签，非 972 全拆） | page.admin.abac.setting.save | ee/server/settings/abac.ts ABAC_Attribute_Store [读] |
| `page.admin.abac.setting.show-in-rooms` | 房间内显示属性 | ABAC → Settings → ABAC_ShowAttributesInRooms | manage-abac-admin-settings + enableQuery（多数要 ABAC_Enabled）[读] | 界面: [待渲染实测] boolean 控件 ／ 导航: 仍在 Settings 页签 [读] ／ 持久化: 仅本地至页级 Save [读] | EE:abac；共享 Settings dispatch（ABAC 页 Settings 页签，非 972 全拆） | page.admin.abac.setting.save | ee/server/settings/abac.ts ABAC_ShowAttributesInRooms [读] |
| `page.admin.abac.setting.banners-enabled` | 开关分级横幅 | ABAC → Settings → ABAC_Classification_Banners_Enabled | manage-abac-admin-settings + enableQuery（多数要 ABAC_Enabled）[读] | 界面: [待渲染实测] boolean 控件 ／ 导航: 仍在 Settings 页签 [读] ／ 持久化: 仅本地至页级 Save [读] | EE:abac；共享 Settings dispatch（ABAC 页 Settings 页签，非 972 全拆） | page.admin.abac.setting.save | ee/server/settings/abac.ts ABAC_Classification_Banners_Enabled [读] |
| `page.admin.abac.setting.banners-config` | 编辑分级横幅 JSON | ABAC → Settings → ABAC_Classification_Banners_Config | manage-abac-admin-settings + enableQuery（多数要 ABAC_Enabled）[读] | 界面: [待渲染实测] code 控件 ／ 导航: 仍在 Settings 页签 [读] ／ 持久化: 仅本地至页级 Save [读] | EE:abac；共享 Settings dispatch（ABAC 页 Settings 页签，非 972 全拆） | page.admin.abac.setting.save | ee/server/settings/abac.ts ABAC_Classification_Banners_Config [读] |
| `page.admin.abac.setting.cache-seconds` | 设决策缓存秒数 | ABAC → Settings → Abac_Cache_Decision_Time_Seconds | manage-abac-admin-settings + enableQuery（多数要 ABAC_Enabled）[读] | 界面: [待渲染实测] int 控件 ／ 导航: 仍在 Settings 页签 [读] ／ 持久化: 仅本地至页级 Save [读] | EE:abac；共享 Settings dispatch（ABAC 页 Settings 页签，非 972 全拆） | page.admin.abac.setting.save | ee/server/settings/abac.ts Abac_Cache_Decision_Time_Seconds [读] |
| `page.admin.abac.setting.virtru-url` | 填 Virtru Base URL | ABAC → Settings → ABAC_Virtru_Base_URL | manage-abac-admin-settings + enableQuery（多数要 ABAC_Enabled）[读] | 界面: [待渲染实测] string 控件 ／ 导航: 仍在 Settings 页签 [读] ／ 持久化: 仅本地至页级 Save [读] | EE:abac；共享 Settings dispatch（ABAC 页 Settings 页签，非 972 全拆） | page.admin.abac.setting.save | ee/server/settings/abac.ts ABAC_Virtru_Base_URL [读] |
| `page.admin.abac.setting.virtru-client-id` | 填 Virtru Client ID | ABAC → Settings → ABAC_Virtru_Client_ID | manage-abac-admin-settings + enableQuery（多数要 ABAC_Enabled）[读] | 界面: [待渲染实测] string 控件 ／ 导航: 仍在 Settings 页签 [读] ／ 持久化: 仅本地至页级 Save [读] | EE:abac；共享 Settings dispatch（ABAC 页 Settings 页签，非 972 全拆） | page.admin.abac.setting.save | ee/server/settings/abac.ts ABAC_Virtru_Client_ID [读] |
| `page.admin.abac.setting.virtru-secret` | 填 Virtru Client Secret | ABAC → Settings → ABAC_Virtru_Client_Secret | manage-abac-admin-settings + enableQuery（多数要 ABAC_Enabled）[读] | 界面: [待渲染实测] password 控件 ／ 导航: 仍在 Settings 页签 [读] ／ 持久化: 仅本地至页级 Save [读] | EE:abac；共享 Settings dispatch（ABAC 页 Settings 页签，非 972 全拆） | page.admin.abac.setting.save | ee/server/settings/abac.ts ABAC_Virtru_Client_Secret [读] |
| `page.admin.abac.setting.virtru-oidc` | 填 Virtru OIDC Endpoint | ABAC → Settings → ABAC_Virtru_OIDC_Endpoint | manage-abac-admin-settings + enableQuery（多数要 ABAC_Enabled）[读] | 界面: [待渲染实测] string 控件 ／ 导航: 仍在 Settings 页签 [读] ／ 持久化: 仅本地至页级 Save [读] | EE:abac；共享 Settings dispatch（ABAC 页 Settings 页签，非 972 全拆） | page.admin.abac.setting.save | ee/server/settings/abac.ts ABAC_Virtru_OIDC_Endpoint [读] |
| `page.admin.abac.setting.virtru-entity-key` | 选默认实体键 | ABAC → Settings → ABAC_Virtru_Default_Entity_Key | manage-abac-admin-settings + enableQuery（多数要 ABAC_Enabled）[读] | 界面: [待渲染实测] select 控件 ／ 导航: 仍在 Settings 页签 [读] ／ 持久化: 仅本地至页级 Save [读] | EE:abac；共享 Settings dispatch（ABAC 页 Settings 页签，非 972 全拆） | page.admin.abac.setting.save | ee/server/settings/abac.ts ABAC_Virtru_Default_Entity_Key [读] |
| `page.admin.abac.setting.virtru-namespace` | 填属性命名空间 | ABAC → Settings → ABAC_Virtru_Attribute_Namespace | manage-abac-admin-settings + enableQuery（多数要 ABAC_Enabled）[读] | 界面: [待渲染实测] string 控件 ／ 导航: 仍在 Settings 页签 [读] ／ 持久化: 仅本地至页级 Save [读] | EE:abac；共享 Settings dispatch（ABAC 页 Settings 页签，非 972 全拆） | page.admin.abac.setting.save | ee/server/settings/abac.ts ABAC_Virtru_Attribute_Namespace [读] |
| `page.admin.abac.setting.virtru-sync` | 填同步 cron | ABAC → Settings → ABAC_Virtru_Sync_Interval | manage-abac-admin-settings + enableQuery（多数要 ABAC_Enabled）[读] | 界面: [待渲染实测] string 控件 ／ 导航: 仍在 Settings 页签 [读] ／ 持久化: 仅本地至页级 Save [读] | EE:abac；共享 Settings dispatch（ABAC 页 Settings 页签，非 972 全拆） | page.admin.abac.setting.save | ee/server/settings/abac.ts ABAC_Virtru_Sync_Interval [读] |
| `page.admin.abac.setting.test-virtru` | 测试 Virtru PDP 连接 | ABAC → Settings → ABAC_Virtru_Test_Connection | PDP=virtru [读] | 界面: [待渲染实测] 动作按钮 ／ 导航: 仍在页 [读] ／ 持久化: GET /v1/abac/pdp/health [读] | EE:abac | page.admin.abac.setting.pdp-type | abac.ts ABAC_Virtru_Test_Connection [读] |
| `page.admin.abac.setting.save` | 保存 ABAC 设置页签 | ABAC Settings → Save | dirty [读] | 界面: [待渲染实测] toast ／ 导航: 仍在页 [读] ／ 持久化: 设置 dispatch 批量写上表键 [读] | EE:abac | page.admin.abac.tab.settings | ABACSettingTab/SettingsPage.tsx [读] |
| `page.admin.abac.attr.search` | 搜索房间属性 | Room Attributes → ABAC_Search_attributes | manage-abac-admin-room-attributes [读] | 界面: [待渲染实测] 表过滤 ／ 导航: 仍在页 [读] ／ 持久化: GET /v1/abac/attributes [读] | EE:abac | page.admin.abac.tab.attributes | AttributesPage.tsx [读] |
| `page.admin.abac.attr.new` | 新建房间属性 | Room Attributes → ABAC_New_attribute | 同上 | 界面: [待渲染实测] AttributesForm ／ 导航: context=new [读] ／ 持久化: 无至 Save [读] | EE:abac | page.admin.abac.attr.save | AttributesPage.tsx [读] |
| `page.admin.abac.attr.pagination` | 翻页房间属性 | Room Attributes → Pagination | 有多页 | 界面: [待渲染实测] 换页 ／ 导航: 仍在页 [读] ／ 持久化: 同 GET [读] | EE:abac | page.admin.abac.attr.search | AttributesPage.tsx [读] |
| `page.admin.abac.attr.name` | 填属性 Name | 属性表单 → Name | 同上 | 界面: [待渲染实测] ／ 导航: 仍在表单 [读] ／ 持久化: 仅本地至 Save [读] | EE:abac；共享 POST/PUT /v1/abac/attributes | page.admin.abac.attr.save | AttributesForm.tsx name=name [读] |
| `page.admin.abac.attr.value` | 编辑/添加属性值 | 属性表单 → Values / Add_Value | 同上 | 界面: [待渲染实测] 可增删行 ／ 导航: 仍在表单 [读] ／ 持久化: 仅本地至 Save [读] | EE:abac；共享 attributes 写 | page.admin.abac.attr.save | AttributesForm.tsx attributeValues.*.value [读] |
| `page.admin.abac.attr.remove-value` | 删除某一属性值 | 属性表单 → ABAC_Remove_attribute（值行） | 同上 | 界面: [待渲染实测] 行消失 ／ 导航: 仍在表单 [读] ／ 持久化: 仅本地至 Save [读] | EE:abac | page.admin.abac.attr.value | AttributesForm.tsx [读] |
| `page.admin.abac.attr.save` | 保存房间属性 | 属性表单 → Save | 校验通过 | 界面: [待渲染实测] toast ／ 导航: 回列表 [读] ／ 持久化: POST/PUT /v1/abac/attributes [读] | EE:abac | page.admin.abac.attr.name | AttributesForm.tsx [读] |
| `page.admin.abac.attr.delete` | 删除整个属性 | 属性行菜单 → Delete | 未被房间占用否则不能删 [读] | 界面: [待渲染实测] 确认或 ABAC_Cannot_delete_attribute ／ 导航: 仍在列表 [读] ／ 持久化: DELETE /v1/abac/attributes/:_id [读] | EE:abac | page.admin.abac.attr.search | useAttributeOptions.tsx [读] |
| `page.admin.abac.rooms.search` | 搜索 ABAC 房间 | Rooms 页签 → ABAC_Search_rooms | manage-abac-admin-rooms [读] | 界面: [待渲染实测] 表过滤 ／ 导航: 仍在页 [读] ／ 持久化: GET /v1/abac/rooms [读] | EE:abac | page.admin.abac.tab.rooms | RoomsPage.tsx [读] |
| `page.admin.abac.rooms.filter` | 按 All/Rooms/Attributes/Values 过滤 | Rooms 页签 → 类型 select | 同上 | 界面: [待渲染实测] 过滤 ／ 导航: 仍在页 [读] ／ 持久化: 同 GET [读] | EE:abac | page.admin.abac.rooms.search | RoomsPage.tsx [读] |
| `page.admin.abac.rooms.add` | 把房间纳入 ABAC | Rooms 页签 → Add_room | 同上 | 界面: [待渲染实测] RoomForm ／ 导航: context=new [读] ／ 持久化: 无至 Save [读] | EE:abac | page.admin.abac.rooms.save | RoomsPage.tsx [读] |
| `page.admin.abac.rooms.pagination` | 翻页 ABAC 房间 | Rooms 页签 → Pagination | 有多页 | 界面: [待渲染实测] 换页 ／ 导航: 仍在页 [读] ／ 持久化: 同 GET [读] | EE:abac | page.admin.abac.rooms.search | RoomsPage.tsx [读] |
| `page.admin.abac.rooms.room` | 选择要托管的房间 | 房间表单 → ABAC_Room_to_be_managed | 同上 | 界面: [待渲染实测] 房间选择 ／ 导航: 仍在表单 [读] ／ 持久化: 仅本地至 Save [读] | EE:abac；共享房间映射 POST | page.admin.abac.rooms.save | RoomForm.tsx name=room [读] |
| `page.admin.abac.rooms.attr-key` | 为房间选属性键 | 房间表单 → Attribute key | 同上 | 界面: [待渲染实测] ／ 导航: 仍在表单 [读] ／ 持久化: 仅本地至 Save [读] | EE:abac；共享房间映射 POST | page.admin.abac.rooms.save | RoomFormAttributeField.tsx name=attributes.*.key [读] |
| `page.admin.abac.rooms.attr-values` | 为房间选属性值 | 房间表单 → Attribute values | 同上 | 界面: [待渲染实测] 多选 ／ 导航: 仍在表单 [读] ／ 持久化: 仅本地至 Save [读] | EE:abac；共享房间映射 POST | page.admin.abac.rooms.save | RoomFormAttributeField.tsx name=attributes.*.values [读] |
| `page.admin.abac.rooms.add-attr` | 再加一条房间属性 | 房间表单 → ABAC_Add_Attribute | 同上 | 界面: [待渲染实测] 新行 ／ 导航: 仍在表单 [读] ／ 持久化: 无请求 [读] | EE:abac | page.admin.abac.rooms.attr-key | RoomForm.tsx [读] |
| `page.admin.abac.rooms.save` | 保存房间 ABAC 映射 | 房间表单 → Save | 校验通过 | 界面: [待渲染实测] toast ／ 导航: 回列表 [读] ／ 持久化: POST ABAC room save [读] | EE:abac | page.admin.abac.rooms.room | RoomForm.tsx [读] |
| `page.admin.abac.rooms.remove` | 从 ABAC 移除房间 | 房间行菜单 → Remove | 同上 | 界面: [待渲染实测] 确认 ABAC_Delete_room ／ 导航: 仍在列表 [读] ／ 持久化: DELETE 房间映射 [读] | EE:abac | page.admin.abac.rooms.search | useRoomItems.tsx [读] |

### E12 Device Management `/admin/device-management` — `page.admin.devices.*`

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
|---|---|---|---|---|---|---|---|
| `page.admin.devices.search` | 搜索设备/用户会话 | 管理侧栏 Device_Management → Search_Devices_Users | view-device-management + EE [读] | 界面: [待渲染实测] 表过滤 ／ 导航: /admin/device-management [读] ／ 持久化: GET /v1/sessions/list.all [读] | EE:device-management | route.admin.device-management | DeviceManagementAdminTable.tsx [读] |
| `page.admin.devices.sort.client` | 按 Client 排序 | 表头 Client | 同上 | 界面: [待渲染实测] 重排 ／ 导航: 仍在页 [读] ／ 持久化: 同 GET sort [读] | EE:device-management | page.admin.devices.search | DeviceManagementAdminTable.tsx [读] |
| `page.admin.devices.sort.os` | 按 OS 排序 | 表头 OS | 同上 | 界面: [待渲染实测] 重排 ／ 导航: 仍在页 [读] ／ 持久化: 同 GET sort [读] | EE:device-management | page.admin.devices.search | DeviceManagementAdminTable.tsx [读] |
| `page.admin.devices.sort.user` | 按 User 排序 | 表头 User | 同上 | 界面: [待渲染实测] 重排 ／ 导航: 仍在页 [读] ／ 持久化: 同 GET sort [读] | EE:device-management | page.admin.devices.search | DeviceManagementAdminTable.tsx [读] |
| `page.admin.devices.sort.login` | 按 Last_login 排序 | 表头 Last_login | 同上 | 界面: [待渲染实测] 重排 ／ 导航: 仍在页 [读] ／ 持久化: 同 GET sort [读] | EE:device-management | page.admin.devices.search | DeviceManagementAdminTable.tsx [读] |
| `page.admin.devices.pagination` | 翻页设备会话 | 表底 Pagination | 有多页 | 界面: [待渲染实测] 换页 ／ 导航: 仍在页 [读] ／ 持久化: GET count/offset [读] | EE:device-management | page.admin.devices.search | DeviceManagementAdminTable.tsx [读] |
| `page.admin.devices.row` | 打开设备详情 | 行单击 | 同上 | 界面: [待渲染实测] info 面板 ／ 导航: context=info [读] ／ 持久化: 无 [读] | EE:device-management | page.admin.devices.logout | DeviceManagementAdminRow.tsx [读] |
| `page.admin.devices.logout` | 登出该设备 | 详情 → Logout_Device | 同上 | 界面: [待渲染实测] 行消失 ／ 导航: 回列表 [读] ／ 持久化: POST /v1/sessions/logout [读] | EE:device-management | page.account.sessions.logout | DeviceManagementInfo.tsx [读] |

### E13 Email Inboxes `/admin/email-inboxes` — `page.admin.email-inbox.*`

`rg name=` EmailInboxForm.tsx → 16 字段（active…imapSecure）。另 Cancel/Save/Delete/Send_Test。

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
|---|---|---|---|---|---|---|---|
| `page.admin.email-inbox.new` | 打开新建收件箱 | 管理侧栏 Email_Inboxes → New | manage-email-inbox [读] | 界面: [待渲染实测] 表单 ／ 导航: context=new [读] ／ 持久化: 无至 Save [读] | core | page.admin.email-inbox.save | EmailInboxPage.tsx [读] |
| `page.admin.email-inbox.row` | 打开编辑收件箱 | 表 → 行 | 同上 | 界面: [待渲染实测] 表单预填 ／ 导航: context=edit [读] ／ 持久化: 无至 Save [读] | core | page.admin.email-inbox.save | EmailInboxPage.tsx [读] |
| `page.admin.email-inbox.active` | 开关收件箱启用 | 表单 → Active | manage-email-inbox [读] | 界面: [待渲染实测] ／ 导航: 仍在表单 [读] ／ 持久化: 仅本地至 Save | core；共享 POST /v1/email-inbox | page.admin.email-inbox.save | EmailInboxForm.tsx name=active [读] |
| `page.admin.email-inbox.name` | 填收件箱名 | 表单 → Name | manage-email-inbox [读] | 界面: [待渲染实测] ／ 导航: 仍在表单 [读] ／ 持久化: 仅本地至 Save | core；共享 POST /v1/email-inbox | page.admin.email-inbox.save | EmailInboxForm.tsx name=name [读] |
| `page.admin.email-inbox.email` | 填收件箱邮箱 | 表单 → Email | manage-email-inbox [读] | 界面: [待渲染实测] ／ 导航: 仍在表单 [读] ／ 持久化: 仅本地至 Save；失焦可 GET /v1/email-inbox.search 校验 [读] | core；共享 POST /v1/email-inbox | page.admin.email-inbox.save | EmailInboxForm.tsx name=email [读] |
| `page.admin.email-inbox.description` | 填描述 | 表单 → Description | manage-email-inbox [读] | 界面: [待渲染实测] ／ 导航: 仍在表单 [读] ／ 持久化: 仅本地至 Save | core；共享 POST /v1/email-inbox | page.admin.email-inbox.save | EmailInboxForm.tsx name=description [读] |
| `page.admin.email-inbox.sender-info` | 填发件人信息 | 表单 → Sender_Info | manage-email-inbox [读] | 界面: [待渲染实测] ／ 导航: 仍在表单 [读] ／ 持久化: 仅本地至 Save | core；共享 POST /v1/email-inbox | page.admin.email-inbox.save | EmailInboxForm.tsx name=senderInfo [读] |
| `page.admin.email-inbox.department` | 选部门 | 表单 → Department | manage-email-inbox [读] | 界面: [待渲染实测] ／ 导航: 仍在表单 [读] ／ 持久化: 仅本地至 Save | core；共享 POST /v1/email-inbox | page.admin.email-inbox.save | EmailInboxForm.tsx name=department [读] |
| `page.admin.email-inbox.smtp-server` | 填 SMTP 主机 | 表单 → SMTP Server | manage-email-inbox [读] | 界面: [待渲染实测] ／ 导航: 仍在表单 [读] ／ 持久化: 仅本地至 Save | core；共享 POST /v1/email-inbox | page.admin.email-inbox.save | EmailInboxForm.tsx name=smtpServer [读] |
| `page.admin.email-inbox.smtp-port` | 填 SMTP 端口 | 表单 → SMTP Port | manage-email-inbox [读] | 界面: [待渲染实测] ／ 导航: 仍在表单 [读] ／ 持久化: 仅本地至 Save | core；共享 POST /v1/email-inbox | page.admin.email-inbox.save | EmailInboxForm.tsx name=smtpPort [读] |
| `page.admin.email-inbox.smtp-username` | 填 SMTP 用户名 | 表单 → SMTP Username | manage-email-inbox [读] | 界面: [待渲染实测] ／ 导航: 仍在表单 [读] ／ 持久化: 仅本地至 Save | core；共享 POST /v1/email-inbox | page.admin.email-inbox.save | EmailInboxForm.tsx name=smtpUsername [读] |
| `page.admin.email-inbox.smtp-password` | 填 SMTP 密码 | 表单 → SMTP Password | manage-email-inbox [读] | 界面: [待渲染实测] ／ 导航: 仍在表单 [读] ／ 持久化: 仅本地至 Save | core；共享 POST /v1/email-inbox | page.admin.email-inbox.save | EmailInboxForm.tsx name=smtpPassword [读] |
| `page.admin.email-inbox.smtp-secure` | 开关 SMTP TLS | 表单 → SMTP Connect_SSL_TLS | manage-email-inbox [读] | 界面: [待渲染实测] ／ 导航: 仍在表单 [读] ／ 持久化: 仅本地至 Save | core；共享 POST /v1/email-inbox | page.admin.email-inbox.save | EmailInboxForm.tsx name=smtpSecure [读] |
| `page.admin.email-inbox.imap-server` | 填 IMAP 主机 | 表单 → IMAP Server | manage-email-inbox [读] | 界面: [待渲染实测] ／ 导航: 仍在表单 [读] ／ 持久化: 仅本地至 Save | core；共享 POST /v1/email-inbox | page.admin.email-inbox.save | EmailInboxForm.tsx name=imapServer [读] |
| `page.admin.email-inbox.imap-port` | 填 IMAP 端口 | 表单 → IMAP Port | manage-email-inbox [读] | 界面: [待渲染实测] ／ 导航: 仍在表单 [读] ／ 持久化: 仅本地至 Save | core；共享 POST /v1/email-inbox | page.admin.email-inbox.save | EmailInboxForm.tsx name=imapPort [读] |
| `page.admin.email-inbox.imap-username` | 填 IMAP 用户名 | 表单 → IMAP Username | manage-email-inbox [读] | 界面: [待渲染实测] ／ 导航: 仍在表单 [读] ／ 持久化: 仅本地至 Save | core；共享 POST /v1/email-inbox | page.admin.email-inbox.save | EmailInboxForm.tsx name=imapUsername [读] |
| `page.admin.email-inbox.imap-password` | 填 IMAP 密码 | 表单 → IMAP Password | manage-email-inbox [读] | 界面: [待渲染实测] ／ 导航: 仍在表单 [读] ／ 持久化: 仅本地至 Save | core；共享 POST /v1/email-inbox | page.admin.email-inbox.save | EmailInboxForm.tsx name=imapPassword [读] |
| `page.admin.email-inbox.imap-retries` | 填 IMAP 重试次数 | 表单 → Retry_Failed_Messages | manage-email-inbox [读] | 界面: [待渲染实测] ／ 导航: 仍在表单 [读] ／ 持久化: 仅本地至 Save | core；共享 POST /v1/email-inbox | page.admin.email-inbox.save | EmailInboxForm.tsx name=imapRetries [读] |
| `page.admin.email-inbox.imap-secure` | 开关 IMAP TLS | 表单 → IMAP Connect_SSL_TLS | manage-email-inbox [读] | 界面: [待渲染实测] ／ 导航: 仍在表单 [读] ／ 持久化: 仅本地至 Save | core；共享 POST /v1/email-inbox | page.admin.email-inbox.save | EmailInboxForm.tsx name=imapSecure [读] |
| `page.admin.email-inbox.cancel` | 取消未保存收件箱 | 表单 → Cancel | 同上 | 界面: [待渲染实测] 关表单 ／ 导航: 回列表 [读] ／ 持久化: 无 [读] | core | page.admin.email-inbox.save | EmailInboxForm.tsx [读] |
| `page.admin.email-inbox.save` | 保存收件箱 | 表单 → Save | 校验通过 [读] | 界面: [待渲染实测] toast ／ 导航: 回列表 [读] ／ 持久化: POST /v1/email-inbox [读] | core | page.admin.email-inbox.name | EmailInboxForm.tsx [读] |
| `page.admin.email-inbox.delete` | 删除收件箱 | 编辑表单 → Delete | 已有记录 [读] | 界面: [待渲染实测] 确认 ／ 导航: 回列表 [读] ／ 持久化: DELETE /v1/email-inbox/:_id [读] | core | page.admin.email-inbox.row | EmailInboxForm.tsx [读] |
| `page.admin.email-inbox.send-test` | 发送测试邮件 | 表行 → Send_Test_Email | 已保存 [读] | 界面: [待渲染实测] toast ／ 导航: 仍在列表 [读] ／ 持久化: POST /v1/email-inbox.send-test/:_id [读] | core | page.admin.email-inbox.row | SendTestButton.tsx [读] |

### E14 Mailer `/admin/mailer` — `page.admin.mailer.*`

`rg name=` MailerPage：fromEmail dryRun query subject emailBody。

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
|---|---|---|---|---|---|---|---|
| `page.admin.mailer.from` | 填 From | 管理侧栏 Mailer → From | access-mailer [读] | 界面: [待渲染实测] ／ 导航: 仍在 /admin/mailer [读] ／ 持久化: 仅本地至 Send [读] | core；共享 POST /v1/mailer | page.admin.mailer.send | MailerPage.tsx name=fromEmail [读] |
| `page.admin.mailer.dry-run` | 开关 Dry_run | Mailer → Dry_run | 同上 | 界面: [待渲染实测] switch；开则只发给自己 [读] ／ 导航: 仍在页 [读] ／ 持久化: 仅本地至 Send [读] | core；共享 POST /v1/mailer | page.admin.mailer.send | MailerPage.tsx name=dryRun [读] |
| `page.admin.mailer.query` | 填用户 Query | Mailer → Query | 同上 | 界面: [待渲染实测] JSON 查询 ／ 导航: 仍在页 [读] ／ 持久化: 仅本地至 Send [读] | core；共享 POST /v1/mailer | page.admin.mailer.send | MailerPage.tsx name=query [读] |
| `page.admin.mailer.subject` | 填 Subject | Mailer → Subject | 同上 | 界面: [待渲染实测] ／ 导航: 仍在页 [读] ／ 持久化: 仅本地至 Send [读] | core；共享 POST /v1/mailer | page.admin.mailer.send | MailerPage.tsx name=subject [读] |
| `page.admin.mailer.body` | 填 Email_body | Mailer → Email_body | 同上 | 界面: [待渲染实测] HTML ／ 导航: 仍在页 [读] ／ 持久化: 仅本地至 Send [读] | core；共享 POST /v1/mailer | page.admin.mailer.send | MailerPage.tsx name=emailBody [读] |
| `page.admin.mailer.cancel` | 重置未发送邮件 | Mailer → Cancel | dirty [读] | 界面: [待渲染实测] 表单 reset ／ 导航: 仍在页 [读] ／ 持久化: 无 [读] | core | page.admin.mailer.send | MailerPage.tsx [读] |
| `page.admin.mailer.send` | 发送群发邮件 | Mailer → Send_email | 校验通过 [读] | 界面: [待渲染实测] toast ／ 导航: 仍在页 [读] ／ 持久化: POST /v1/mailer [读] | core | route.admin.mailer | MailerPage.tsx [读] |

### E15 Third party login `/admin/third-party-login` — `page.admin.oauth-apps.*`

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
|---|---|---|---|---|---|---|---|
| `page.admin.oauth-apps.new` | 打开新建 OAuth App | 管理侧栏 Third_party_login → New | manage-oauth-apps [读] | 界面: [待渲染实测] OAuthAddApp ／ 导航: /new [读] ／ 持久化: 无至 Save [读] | core | page.admin.oauth-apps.save | OAuthAppsPage.tsx [读] |
| `page.admin.oauth-apps.row` | 打开编辑 OAuth App | 表 → 行 | 同上 | 界面: [待渲染实测] EditOauthApp ／ 导航: edit [读] ／ 持久化: 无至 Save [读] | core | page.admin.oauth-apps.save | OAuthAppsTable.tsx [读] |
| `page.admin.oauth-apps.active` | 开关 Active | 表单 → Active | 同上 | 界面: [待渲染实测] switch ／ 导航: 仍在表单 [读] ／ 持久化: 仅本地至 Save [读] | core；共享 POST /v1/oauth-apps.create 或 .update | page.admin.oauth-apps.save | OAuthAddApp.tsx / EditOauthApp.tsx name=active [读] |
| `page.admin.oauth-apps.name` | 填 Application_Name | 表单 → Application_Name | 同上 | 界面: [待渲染实测] ／ 导航: 仍在表单 [读] ／ 持久化: 仅本地至 Save [读] | core；共享 POST /v1/oauth-apps.create 或 .update | page.admin.oauth-apps.save | name=name [读] |
| `page.admin.oauth-apps.redirect-uri` | 填 Redirect_URI | 表单 → Redirect_URI | 同上 | 界面: [待渲染实测] ／ 导航: 仍在表单 [读] ／ 持久化: 仅本地至 Save [读] | core；共享 POST /v1/oauth-apps.create 或 .update | page.admin.oauth-apps.save | name=redirectUri [读] |
| `page.admin.oauth-apps.cancel` | 取消未保存 OAuth App | 表单 → Cancel | 同上 | 界面: [待渲染实测] 关表单 ／ 导航: 回列表 [读] ／ 持久化: 无 [读] | core | page.admin.oauth-apps.save | OAuthAddApp.tsx EditOauthApp.tsx [读] |
| `page.admin.oauth-apps.save` | 保存 OAuth App | 表单 → Save | 校验通过 | 界面: [待渲染实测] toast ／ 导航: 回列表 [读] ／ 持久化: POST /v1/oauth-apps.create 或 .update [读] | core | page.admin.oauth-apps.name | OAuthAddApp.tsx EditOauthApp.tsx [读] |
| `page.admin.oauth-apps.delete` | 删除 OAuth App | 编辑表单 → Delete | 已有记录 | 界面: [待渲染实测] 确认 ／ 导航: 回列表 [读] ／ 持久化: POST /v1/oauth-apps.delete [读] | core | page.admin.oauth-apps.row | EditOauthApp.tsx [读] |

### E16 Integrations `/admin/integrations` — `page.admin.integrations.*`

Incoming `name=`：enabled name channel username alias avatar emoji overrideDestinationChannelEnabled scriptEnabled scriptEngine script = **11**。
Outgoing `name=`：event enabled name channel triggerWords targetRoom urls impersonateUser username alias avatar emoji token scriptEnabled scriptEngine script retryFailedCalls retryCount retryDelay triggerWordAnywhere runOnEdits = **21**。

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
|---|---|---|---|---|---|---|---|
| `page.admin.integrations.new` | 打开新建集成 | 管理侧栏 Integrations → New | manage-incoming/outgoing 或 own 变体 [读] | 界面: [待渲染实测] 选 incoming/outgoing ／ 导航: new [读] ／ 持久化: 无至 Save [读] | core | page.admin.integrations.incoming.save | IntegrationsPage.tsx [读] |
| `page.admin.integrations.tab.all` | 看全部集成 | Integrations → tab All | 同上 | 界面: [待渲染实测] ／ 导航: 切 tab [读] ／ 持久化: GET /v1/integrations.list [读] | core | route.admin.integrations | IntegrationsPage.tsx [读] |
| `page.admin.integrations.tab.incoming` | 只看 Incoming | Integrations → tab Incoming | manage-incoming-integrations 或 own [读] | 界面: [待渲染实测] ／ 导航: 切 tab [读] ／ 持久化: 同 GET type=webhook-incoming [读] | core | page.admin.integrations.tab.all | IntegrationsPage.tsx [读] |
| `page.admin.integrations.tab.outgoing` | 只看 Outgoing | Integrations → tab Outgoing | manage-outgoing-integrations 或 own [读] | 界面: [待渲染实测] ／ 导航: 切 tab [读] ／ 持久化: 同 GET type=webhook-outgoing [读] | core | page.admin.integrations.tab.all | IntegrationsPage.tsx [读] |
| `page.admin.integrations.tab.zapier` | 打开 Zapier 说明页签 | Integrations → tab Zapier | 同上 | 界面: [待渲染实测] Zapier 说明 [待渲染实测] ／ 导航: 切 tab [读] ／ 持久化: 无写 [读] | core | page.admin.integrations.tab.all | IntegrationsPage.tsx [读] |
| `page.admin.integrations.tab.bots` | 看 Bots 页签 | Integrations → tab Bots | 同上 | 界面: [待渲染实测] ／ 导航: 切 tab [读] ／ 持久化: 列表查询 [读] | core | page.admin.integrations.tab.all | IntegrationsPage.tsx [读] |
| `page.admin.integrations.search` | 搜索集成 | 表 → 搜索 | 同上 | 界面: [待渲染实测] 过滤 ／ 导航: 仍在页 [读] ／ 持久化: GET /v1/integrations.list [读] | core | page.admin.integrations.tab.all | IntegrationsTable.tsx [读] |
| `page.admin.integrations.sort` | 排序集成列 | 表 → 列表头 | 同上 | 界面: [待渲染实测] 重排 ／ 导航: 仍在页 [读] ／ 持久化: 同 GET sort [读] | core | page.admin.integrations.search | IntegrationsTable.tsx [读] |
| `page.admin.integrations.pagination` | 翻页集成 | 表 → Pagination | 有多页 | 界面: [待渲染实测] 换页 ／ 导航: 仍在页 [读] ／ 持久化: 同 GET offset [读] | core | page.admin.integrations.search | IntegrationsTable.tsx [读] |
| `page.admin.integrations.row` | 打开编辑集成 | 表 → 行 | 同上 | 界面: [待渲染实测] incoming/outgoing 表单 ／ 导航: edit [读] ／ 持久化: 无至 Save [读] | core | page.admin.integrations.incoming.save | IntegrationsTable.tsx [读] |
| `page.admin.integrations.incoming.enabled` | 开关启用 | Incoming 表单 → Enabled | manage-incoming-integrations 或 own [读] | 界面: [待渲染实测] ／ 导航: 仍在表单 [读] ／ 持久化: 仅本地至 Save [读] | core；共享 POST /v1/integrations.create 或 PUT /v1/integrations.update | page.admin.integrations.incoming.save | IncomingWebhookForm.tsx [读] |
| `page.admin.integrations.incoming.name` | 填名称 | Incoming 表单 → Name | manage-incoming-integrations 或 own [读] | 界面: [待渲染实测] ／ 导航: 仍在表单 [读] ／ 持久化: 仅本地至 Save [读] | core；共享 POST /v1/integrations.create 或 PUT /v1/integrations.update | page.admin.integrations.incoming.save | IncomingWebhookForm.tsx [读] |
| `page.admin.integrations.incoming.channel` | 选投递频道 | Incoming 表单 → Post_to_Channel | manage-incoming-integrations 或 own [读] | 界面: [待渲染实测] ／ 导航: 仍在表单 [读] ／ 持久化: 仅本地至 Save [读] | core；共享 POST /v1/integrations.create 或 PUT /v1/integrations.update | page.admin.integrations.incoming.save | IncomingWebhookForm.tsx [读] |
| `page.admin.integrations.incoming.username` | 填投递用户名 | Incoming 表单 → Post_as | manage-incoming-integrations 或 own [读] | 界面: [待渲染实测] ／ 导航: 仍在表单 [读] ／ 持久化: 仅本地至 Save [读] | core；共享 POST /v1/integrations.create 或 PUT /v1/integrations.update | page.admin.integrations.incoming.save | IncomingWebhookForm.tsx [读] |
| `page.admin.integrations.incoming.alias` | 填别名 | Incoming 表单 → Alias | manage-incoming-integrations 或 own [读] | 界面: [待渲染实测] ／ 导航: 仍在表单 [读] ／ 持久化: 仅本地至 Save [读] | core；共享 POST /v1/integrations.create 或 PUT /v1/integrations.update | page.admin.integrations.incoming.save | IncomingWebhookForm.tsx [读] |
| `page.admin.integrations.incoming.avatar` | 填头像 URL | Incoming 表单 → Avatar_URL | manage-incoming-integrations 或 own [读] | 界面: [待渲染实测] ／ 导航: 仍在表单 [读] ／ 持久化: 仅本地至 Save [读] | core；共享 POST /v1/integrations.create 或 PUT /v1/integrations.update | page.admin.integrations.incoming.save | IncomingWebhookForm.tsx [读] |
| `page.admin.integrations.incoming.emoji` | 填 emoji | Incoming 表单 → Emoji | manage-incoming-integrations 或 own [读] | 界面: [待渲染实测] ／ 导航: 仍在表单 [读] ／ 持久化: 仅本地至 Save [读] | core；共享 POST /v1/integrations.create 或 PUT /v1/integrations.update | page.admin.integrations.incoming.save | IncomingWebhookForm.tsx [读] |
| `page.admin.integrations.incoming.override-channel` | 允许覆盖目标频道 | Incoming 表单 → Override_Destination_Channel | manage-incoming-integrations 或 own [读] | 界面: [待渲染实测] ／ 导航: 仍在表单 [读] ／ 持久化: 仅本地至 Save [读] | core；共享 POST /v1/integrations.create 或 PUT /v1/integrations.update | page.admin.integrations.incoming.save | IncomingWebhookForm.tsx [读] |
| `page.admin.integrations.incoming.script-enabled` | 开脚本 | Incoming 表单 → Script_Enabled | manage-incoming-integrations 或 own [读] | 界面: [待渲染实测] ／ 导航: 仍在表单 [读] ／ 持久化: 仅本地至 Save [读] | core；共享 POST /v1/integrations.create 或 PUT /v1/integrations.update | page.admin.integrations.incoming.save | IncomingWebhookForm.tsx [读] |
| `page.admin.integrations.incoming.script-engine` | 选脚本引擎 | Incoming 表单 → Script_Engine | manage-incoming-integrations 或 own [读] | 界面: [待渲染实测] ／ 导航: 仍在表单 [读] ／ 持久化: 仅本地至 Save [读] | core；共享 POST /v1/integrations.create 或 PUT /v1/integrations.update | page.admin.integrations.incoming.save | IncomingWebhookForm.tsx [读] |
| `page.admin.integrations.incoming.script` | 编辑脚本 | Incoming 表单 → Script | manage-incoming-integrations 或 own [读] | 界面: [待渲染实测] ／ 导航: 仍在表单 [读] ／ 持久化: 仅本地至 Save [读] | core；共享 POST /v1/integrations.create 或 PUT /v1/integrations.update | page.admin.integrations.incoming.save | IncomingWebhookForm.tsx [读] |
| `page.admin.integrations.incoming.copy-url` | 复制 Webhook URL | Incoming 编辑 → Copy Webhook_URL | 已保存 [读] | 界面: [待渲染实测] 剪贴板 ／ 导航: 仍在表单 [读] ／ 持久化: 无请求 [读] | core | page.admin.integrations.incoming.save | IncomingWebhookForm.tsx [读] |
| `page.admin.integrations.incoming.copy-token` | 复制 Token | Incoming 编辑 → Copy Token | 已保存 | 界面: [待渲染实测] 剪贴板 ／ 导航: 仍在表单 [读] ／ 持久化: 无请求 [读] | core | page.admin.integrations.incoming.save | IncomingWebhookForm.tsx [读] |
| `page.admin.integrations.incoming.copy-curl` | 复制 Curl 示例 | Incoming 编辑 → Copy Curl | 已保存 | 界面: [待渲染实测] 剪贴板 ／ 导航: 仍在表单 [读] ／ 持久化: 无请求 [读] | core | page.admin.integrations.incoming.save | IncomingWebhookForm.tsx [读] |
| `page.admin.integrations.incoming.cancel` | 取消 Incoming 未保存 | Incoming 表单 → Cancel | 同上 | 界面: [待渲染实测] 关表单 ／ 导航: 回列表 [读] ／ 持久化: 无 [读] | core | page.admin.integrations.incoming.save | EditIncomingWebhook.tsx [读] |
| `page.admin.integrations.incoming.save` | 保存 Incoming webhook | Incoming 表单 → Save | 校验通过 | 界面: [待渲染实测] toast ／ 导航: 回列表 [读] ／ 持久化: POST /v1/integrations.create 或 PUT /v1/integrations.update [读] | core | page.admin.integrations.incoming.name | EditIncomingWebhook.tsx [读] |
| `page.admin.integrations.incoming.delete` | 删除 Incoming webhook | Incoming 编辑 → Delete | 已有记录 | 界面: [待渲染实测] 确认 ／ 导航: 回列表 [读] ／ 持久化: POST /v1/integrations.remove [读] | core | page.admin.integrations.row | EditIncomingWebhook.tsx [读] |
| `page.admin.integrations.outgoing.event` | 选事件触发器 | Outgoing 表单 → Event_Trigger | manage-outgoing-integrations 或 own [读] | 界面: [待渲染实测] 条件字段随 event 显隐 [读] ／ 导航: 仍在表单 [读] ／ 持久化: 仅本地至 Save [读] | core；共享 POST /v1/integrations.create 或 PUT /v1/integrations.update | page.admin.integrations.outgoing.save | OutgoingWebhookForm.tsx [读] |
| `page.admin.integrations.outgoing.enabled` | 开关启用 | Outgoing 表单 → Enabled | manage-outgoing-integrations 或 own [读] | 界面: [待渲染实测] 条件字段随 event 显隐 [读] ／ 导航: 仍在表单 [读] ／ 持久化: 仅本地至 Save [读] | core；共享 POST /v1/integrations.create 或 PUT /v1/integrations.update | page.admin.integrations.outgoing.save | OutgoingWebhookForm.tsx [读] |
| `page.admin.integrations.outgoing.name` | 填名称 | Outgoing 表单 → Name | manage-outgoing-integrations 或 own [读] | 界面: [待渲染实测] 条件字段随 event 显隐 [读] ／ 导航: 仍在表单 [读] ／ 持久化: 仅本地至 Save [读] | core；共享 POST /v1/integrations.create 或 PUT /v1/integrations.update | page.admin.integrations.outgoing.save | OutgoingWebhookForm.tsx [读] |
| `page.admin.integrations.outgoing.channel` | 选频道（条件） | Outgoing 表单 → Channel | manage-outgoing-integrations 或 own [读] | 界面: [待渲染实测] 条件字段随 event 显隐 [读] ／ 导航: 仍在表单 [读] ／ 持久化: 仅本地至 Save [读] | core；共享 POST /v1/integrations.create 或 PUT /v1/integrations.update | page.admin.integrations.outgoing.save | OutgoingWebhookForm.tsx [读] |
| `page.admin.integrations.outgoing.trigger-words` | 填触发词（条件） | Outgoing 表单 → Trigger_Words | manage-outgoing-integrations 或 own [读] | 界面: [待渲染实测] 条件字段随 event 显隐 [读] ／ 导航: 仍在表单 [读] ／ 持久化: 仅本地至 Save [读] | core；共享 POST /v1/integrations.create 或 PUT /v1/integrations.update | page.admin.integrations.outgoing.save | OutgoingWebhookForm.tsx [读] |
| `page.admin.integrations.outgoing.target-room` | 填目标房间（条件） | Outgoing 表单 → TargetRoom | manage-outgoing-integrations 或 own [读] | 界面: [待渲染实测] 条件字段随 event 显隐 [读] ／ 导航: 仍在表单 [读] ／ 持久化: 仅本地至 Save [读] | core；共享 POST /v1/integrations.create 或 PUT /v1/integrations.update | page.admin.integrations.outgoing.save | OutgoingWebhookForm.tsx [读] |
| `page.admin.integrations.outgoing.urls` | 填回调 URL | Outgoing 表单 → URLs | manage-outgoing-integrations 或 own [读] | 界面: [待渲染实测] 条件字段随 event 显隐 [读] ／ 导航: 仍在表单 [读] ／ 持久化: 仅本地至 Save [读] | core；共享 POST /v1/integrations.create 或 PUT /v1/integrations.update | page.admin.integrations.outgoing.save | OutgoingWebhookForm.tsx [读] |
| `page.admin.integrations.outgoing.impersonate` | 开关冒充用户 | Outgoing 表单 → Impersonate_user | manage-outgoing-integrations 或 own [读] | 界面: [待渲染实测] 条件字段随 event 显隐 [读] ／ 导航: 仍在表单 [读] ／ 持久化: 仅本地至 Save [读] | core；共享 POST /v1/integrations.create 或 PUT /v1/integrations.update | page.admin.integrations.outgoing.save | OutgoingWebhookForm.tsx [读] |
| `page.admin.integrations.outgoing.username` | 填投递用户名 | Outgoing 表单 → Post_as | manage-outgoing-integrations 或 own [读] | 界面: [待渲染实测] 条件字段随 event 显隐 [读] ／ 导航: 仍在表单 [读] ／ 持久化: 仅本地至 Save [读] | core；共享 POST /v1/integrations.create 或 PUT /v1/integrations.update | page.admin.integrations.outgoing.save | OutgoingWebhookForm.tsx [读] |
| `page.admin.integrations.outgoing.alias` | 填别名 | Outgoing 表单 → Alias | manage-outgoing-integrations 或 own [读] | 界面: [待渲染实测] 条件字段随 event 显隐 [读] ／ 导航: 仍在表单 [读] ／ 持久化: 仅本地至 Save [读] | core；共享 POST /v1/integrations.create 或 PUT /v1/integrations.update | page.admin.integrations.outgoing.save | OutgoingWebhookForm.tsx [读] |
| `page.admin.integrations.outgoing.avatar` | 填头像 URL | Outgoing 表单 → Avatar_URL | manage-outgoing-integrations 或 own [读] | 界面: [待渲染实测] 条件字段随 event 显隐 [读] ／ 导航: 仍在表单 [读] ／ 持久化: 仅本地至 Save [读] | core；共享 POST /v1/integrations.create 或 PUT /v1/integrations.update | page.admin.integrations.outgoing.save | OutgoingWebhookForm.tsx [读] |
| `page.admin.integrations.outgoing.emoji` | 填 emoji | Outgoing 表单 → Emoji | manage-outgoing-integrations 或 own [读] | 界面: [待渲染实测] 条件字段随 event 显隐 [读] ／ 导航: 仍在表单 [读] ／ 持久化: 仅本地至 Save [读] | core；共享 POST /v1/integrations.create 或 PUT /v1/integrations.update | page.admin.integrations.outgoing.save | OutgoingWebhookForm.tsx [读] |
| `page.admin.integrations.outgoing.token` | 填/看 Token | Outgoing 表单 → Token | manage-outgoing-integrations 或 own [读] | 界面: [待渲染实测] 条件字段随 event 显隐 [读] ／ 导航: 仍在表单 [读] ／ 持久化: 仅本地至 Save [读] | core；共享 POST /v1/integrations.create 或 PUT /v1/integrations.update | page.admin.integrations.outgoing.save | OutgoingWebhookForm.tsx [读] |
| `page.admin.integrations.outgoing.script-enabled` | 开脚本 | Outgoing 表单 → Script_Enabled | manage-outgoing-integrations 或 own [读] | 界面: [待渲染实测] 条件字段随 event 显隐 [读] ／ 导航: 仍在表单 [读] ／ 持久化: 仅本地至 Save [读] | core；共享 POST /v1/integrations.create 或 PUT /v1/integrations.update | page.admin.integrations.outgoing.save | OutgoingWebhookForm.tsx [读] |
| `page.admin.integrations.outgoing.script-engine` | 选脚本引擎 | Outgoing 表单 → Script_Engine | manage-outgoing-integrations 或 own [读] | 界面: [待渲染实测] 条件字段随 event 显隐 [读] ／ 导航: 仍在表单 [读] ／ 持久化: 仅本地至 Save [读] | core；共享 POST /v1/integrations.create 或 PUT /v1/integrations.update | page.admin.integrations.outgoing.save | OutgoingWebhookForm.tsx [读] |
| `page.admin.integrations.outgoing.script` | 编辑脚本 | Outgoing 表单 → Script | manage-outgoing-integrations 或 own [读] | 界面: [待渲染实测] 条件字段随 event 显隐 [读] ／ 导航: 仍在表单 [读] ／ 持久化: 仅本地至 Save [读] | core；共享 POST /v1/integrations.create 或 PUT /v1/integrations.update | page.admin.integrations.outgoing.save | OutgoingWebhookForm.tsx [读] |
| `page.admin.integrations.outgoing.retry-failed` | 开关失败重试 | Outgoing 表单 → Integration_Retry_Failed_Url_Calls | manage-outgoing-integrations 或 own [读] | 界面: [待渲染实测] 条件字段随 event 显隐 [读] ／ 导航: 仍在表单 [读] ／ 持久化: 仅本地至 Save [读] | core；共享 POST /v1/integrations.create 或 PUT /v1/integrations.update | page.admin.integrations.outgoing.save | OutgoingWebhookForm.tsx [读] |
| `page.admin.integrations.outgoing.retry-count` | 填重试次数 | Outgoing 表单 → Retry_Count | manage-outgoing-integrations 或 own [读] | 界面: [待渲染实测] 条件字段随 event 显隐 [读] ／ 导航: 仍在表单 [读] ／ 持久化: 仅本地至 Save [读] | core；共享 POST /v1/integrations.create 或 PUT /v1/integrations.update | page.admin.integrations.outgoing.save | OutgoingWebhookForm.tsx [读] |
| `page.admin.integrations.outgoing.retry-delay` | 填重试延迟 | Outgoing 表单 → Integration_Retry_Delay | manage-outgoing-integrations 或 own [读] | 界面: [待渲染实测] 条件字段随 event 显隐 [读] ／ 导航: 仍在表单 [读] ／ 持久化: 仅本地至 Save [读] | core；共享 POST /v1/integrations.create 或 PUT /v1/integrations.update | page.admin.integrations.outgoing.save | OutgoingWebhookForm.tsx [读] |
| `page.admin.integrations.outgoing.trigger-anywhere` | 触发词可在任意位置（sendMessage） | Outgoing 表单 → Integration_Word_Trigger_Placement | manage-outgoing-integrations 或 own [读] | 界面: [待渲染实测] 条件字段随 event 显隐 [读] ／ 导航: 仍在表单 [读] ／ 持久化: 仅本地至 Save [读] | core；共享 POST /v1/integrations.create 或 PUT /v1/integrations.update | page.admin.integrations.outgoing.save | OutgoingWebhookForm.tsx [读] |
| `page.admin.integrations.outgoing.run-on-edits` | 编辑消息也跑（sendMessage） | Outgoing 表单 → Integration_Run_When_Message_Is_Edited | manage-outgoing-integrations 或 own [读] | 界面: [待渲染实测] 条件字段随 event 显隐 [读] ／ 导航: 仍在表单 [读] ／ 持久化: 仅本地至 Save [读] | core；共享 POST /v1/integrations.create 或 PUT /v1/integrations.update | page.admin.integrations.outgoing.save | OutgoingWebhookForm.tsx [读] |
| `page.admin.integrations.outgoing.cancel` | 取消 Outgoing 未保存 | Outgoing 表单 → Cancel | 同上 | 界面: [待渲染实测] 关表单 ／ 导航: 回列表 [读] ／ 持久化: 无 [读] | core | page.admin.integrations.outgoing.save | EditOutgoingWebhook.tsx [读] |
| `page.admin.integrations.outgoing.save` | 保存 Outgoing webhook | Outgoing 表单 → Save | 校验通过 | 界面: [待渲染实测] toast ／ 导航: 回列表 [读] ／ 持久化: POST /v1/integrations.create 或 PUT update [读] | core | page.admin.integrations.outgoing.name | EditOutgoingWebhook.tsx [读] |
| `page.admin.integrations.outgoing.delete` | 删除 Outgoing webhook | Outgoing 编辑 → Delete | 已有记录 | 界面: [待渲染实测] 确认 ／ 导航: 回列表 [读] ／ 持久化: POST /v1/integrations.remove [读] | core | page.admin.integrations.row | EditOutgoingWebhook.tsx [读] |
| `page.admin.integrations.outgoing.history` | 打开输出历史 | Outgoing 编辑 → History | outgoing 已保存 [读] | 界面: [待渲染实测] 历史表 ／ 导航: history [读] ／ 持久化: GET /v1/integrations.history [读] | core | page.admin.integrations.outgoing.history.replay | EditOutgoingWebhook.tsx OutgoingWebhookHistoryPage.tsx [读] |
| `page.admin.integrations.outgoing.history.clear` | 清空输出历史 | History → Clear history | 同上 | 界面: [待渲染实测] 表空 ／ 导航: 仍在 history [读] ／ 持久化: POST /v1/integrations.clearHistory [读] | core | page.admin.integrations.outgoing.history | OutgoingWebhookHistoryPage.tsx [读] |
| `page.admin.integrations.outgoing.history.replay` | 重放一条历史 | History 行 → Replay | 同上 | 界面: [待渲染实测] toast ／ 导航: 仍在 history [读] ／ 持久化: POST /v1/integrations.replayOutgoing [读] | core | page.admin.integrations.outgoing.history | HistoryItem.tsx [读] |
| `page.admin.integrations.outgoing.history.pagination` | 翻页输出历史 | History → Pagination | 有多页 | 界面: [待渲染实测] 换页 ／ 导航: 仍在页 [读] ／ 持久化: GET history offset [读] | core | page.admin.integrations.outgoing.history | OutgoingWebhookHistoryPage.tsx [读] |

### E17 Import `/admin/import` — `page.admin.import.*`

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
|---|---|---|---|---|---|---|---|
| `page.admin.import.new` | 开始新导入 | 管理侧栏 Import → Import_New_File | run-import [读] | 界面: [待渲染实测] 向导 ／ 导航: /admin/import/new [读] ／ 持久化: 无至选文件 [读] | core | page.admin.import.start-upload | ImportHistoryPage.tsx [读] |
| `page.admin.import.download-files` | 下载待导入文件 | Import 历史 → Download_Pending_Files | 同上 | 界面: [待渲染实测] 进度 ／ 导航: 仍在历史 [读] ／ 持久化: POST /v1/downloadPendingFiles [读] | core | route.admin.import | ImportHistoryPage.tsx [读] |
| `page.admin.import.download-avatars` | 下载待导入头像 | Import 历史 → Download_Pending_Avatars | 同上 | 界面: [待渲染实测] 进度 ／ 导航: 仍在历史 [读] ／ 持久化: POST /v1/downloadPendingAvatars [读] | core | page.admin.import.download-files | ImportHistoryPage.tsx [读] |
| `page.admin.import.history.row` | 查看某次导入进度 | 历史行 | 同上 | 界面: [待渲染实测] 进度页 ／ 导航: /admin/import/progress [读] ／ 持久化: GET /v1/getCurrentImportOperation 与 getImportProgress [读] | core | page.admin.import.progress | ImportHistoryPage.tsx ImportProgressPage.tsx [读] |
| `page.admin.import.type` | 选导入器类型 | New → Import_Type | 同上 | 界面: [待渲染实测] select ／ 导航: 仍在 new [读] ／ 持久化: GET /v1/importers.list 只读选项 [读] | core；提交见 start-upload | page.admin.import.start-upload | NewImportPage.tsx [读] |
| `page.admin.import.file-type` | 选文件来源 upload/url/path | New → File_Type | 同上 | 界面: [待渲染实测] select 切输入 ／ 导航: 仍在 new [读] ／ 持久化: 仅本地 [读] | core；提交见 start-upload | page.admin.import.start-upload | NewImportPage.tsx [读] |
| `page.admin.import.file` | 选择本地导入文件 | File_Type=upload → Importer_Source_File | upload 模式 [读] | 界面: [待渲染实测] file input ／ 导航: 仍在 new [读] ／ 持久化: 仅本地至 Import [读] | core；提交 POST /v1/uploadImportFile | page.admin.import.start-upload | NewImportPage.tsx [读] |
| `page.admin.import.url` | 填导入文件 URL | File_Type=url → File_URL | url 模式 [读] | 界面: [待渲染实测] ／ 导航: 仍在 new [读] ／ 持久化: 仅本地至 Import [读] | core；提交 POST /v1/downloadPublicImportFile | page.admin.import.start-upload | NewImportPage.tsx [读] |
| `page.admin.import.path` | 填服务器文件路径 | File_Type=path → File_Path | path 模式 [读] | 界面: [待渲染实测] ／ 导航: 仍在 new [读] ／ 持久化: 仅本地至 Import [读] | core；提交 downloadPublicImportFile/本地路径 | page.admin.import.start-upload | NewImportPage.tsx [读] |
| `page.admin.import.start-upload` | 提交导入文件进入准备 | New → Import（头按钮） | 已选类型+来源 [读] | 界面: [待渲染实测] 进入 prepare ／ 导航: /admin/import/prepare [读] ／ 持久化: POST /v1/uploadImportFile 或 /v1/downloadPublicImportFile [读] | core | page.admin.import.prepare.start | NewImportPage.tsx [读] |
| `page.admin.import.prepare.tab.users` | 准备页 Users 页签 | Prepare → Users | 有用户数据 [读] | 界面: [待渲染实测] 用户勾选表 ／ 导航: 仍在 prepare [读] ／ 持久化: GET /v1/getImportFileData [读] | core | page.admin.import.prepare.start | PrepareImportPage.tsx [读] |
| `page.admin.import.prepare.tab.contacts` | 准备页 Contacts 页签 | Prepare → Contacts | 有联系人数据 [读] | 界面: [待渲染实测] ／ 导航: 仍在 prepare [读] ／ 持久化: 同 GET [读] | core | page.admin.import.prepare.start | PrepareImportPage.tsx [读] |
| `page.admin.import.prepare.tab.channels` | 准备页 Channels 页签 | Prepare → Channels | 有频道数据 [读] | 界面: [待渲染实测] ／ 导航: 仍在 prepare [读] ／ 持久化: 同 GET [读] | core | page.admin.import.prepare.start | PrepareImportPage.tsx [读] |
| `page.admin.import.prepare.tab.messages` | 准备页 Messages 页签 | Prepare → Messages | 有消息统计 [读] | 界面: [待渲染实测] 只读计数 [待渲染实测] ／ 导航: 仍在 prepare [读] ／ 持久化: 同 GET [读] | core | page.admin.import.prepare.start | PrepareImportPage.tsx [读] |
| `page.admin.import.prepare.users.select-all` | 全选/取消导入用户 | Users 表 → select-all | 同上 | 界面: [待渲染实测] 全勾 ／ 导航: 仍在页 [读] ／ 持久化: 仅本地至 Start [读] | core；提交 POST /v1/startImport | page.admin.import.prepare.start | PrepareUsers.tsx [读] |
| `page.admin.import.prepare.users.toggle` | 勾选单个用户是否导入 | Users 行 → do_import | 同上 | 界面: [待渲染实测] checkbox ／ 导航: 仍在页 [读] ／ 持久化: 仅本地至 Start [读] | core；提交 startImport | page.admin.import.prepare.start | PrepareUsers.tsx [读] |
| `page.admin.import.prepare.users.pagination` | 翻页准备用户 | Users → Pagination | 有多页 | 界面: [待渲染实测] 换页 ／ 导航: 仍在页 [读] ／ 持久化: 客户端切片 [读] | core | page.admin.import.prepare.tab.users | PrepareUsers.tsx [读] |
| `page.admin.import.prepare.channels.select-all` | 全选/取消导入频道 | Channels 表 → select-all | 同上 | 界面: [待渲染实测] ／ 导航: 仍在页 [读] ／ 持久化: 仅本地至 Start [读] | core；提交 startImport | page.admin.import.prepare.start | PrepareChannels.tsx [读] |
| `page.admin.import.prepare.channels.toggle` | 勾选单个频道是否导入 | Channels 行 → do_import | 同上 | 界面: [待渲染实测] ／ 导航: 仍在页 [读] ／ 持久化: 仅本地至 Start [读] | core；提交 startImport | page.admin.import.prepare.start | PrepareChannels.tsx [读] |
| `page.admin.import.prepare.channels.pagination` | 翻页准备频道 | Channels → Pagination | 有多页 | 界面: [待渲染实测] ／ 导航: 仍在页 [读] ／ 持久化: 客户端切片 [读] | core | page.admin.import.prepare.tab.channels | PrepareChannels.tsx [读] |
| `page.admin.import.prepare.contacts.select-all` | 全选/取消导入联系人 | Contacts → select-all | 同上 | 界面: [待渲染实测] ／ 导航: 仍在页 [读] ／ 持久化: 仅本地至 Start [读] | core；提交 startImport | page.admin.import.prepare.start | PrepareContacts.tsx [读] |
| `page.admin.import.prepare.contacts.toggle` | 勾选单个联系人是否导入 | Contacts 行 → do_import | 同上 | 界面: [待渲染实测] ／ 导航: 仍在页 [读] ／ 持久化: 仅本地至 Start [读] | core；提交 startImport | page.admin.import.prepare.start | PrepareContacts.tsx [读] |
| `page.admin.import.prepare.contacts.pagination` | 翻页准备联系人 | Contacts → Pagination | 有多页 | 界面: [待渲染实测] ／ 导航: 仍在页 [读] ／ 持久化: 客户端切片 [读] | core | page.admin.import.prepare.tab.contacts | PrepareContacts.tsx [读] |
| `page.admin.import.prepare.start` | 开始导入选中项 | Prepare → Importer_Prepare_Start_Import | 已选至少一项 [读] | 界面: [待渲染实测] 进进度 ／ 导航: /admin/import/progress [读] ／ 持久化: POST /v1/startImport [读] | core | page.admin.import.progress | PrepareImportPage.tsx [读] |
| `page.admin.import.progress` | 观看导入进度（只读） | Progress 页自动刷新 | 有进行中操作 [读] | 界面: [待渲染实测] 进度条/状态 ／ 导航: /admin/import/progress [读] ／ 持久化: GET /v1/getImportProgress + stream importers；无用户写 [读] | core | page.admin.import.prepare.start | ImportProgressPage.tsx [读] |

### E18 Reports `/admin/analytic-reports` — `page.admin.reports.*`

侧栏 i18n=`Reports`，页标题 `Analytic_reports`。`ViewLogsPage` 只嵌 `AnalyticsReports`：**无表单字段**。内部可操作面是文档链与只读 JSON。

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
|---|---|---|---|---|---|---|---|
| `page.admin.reports.docs` | 打开日志访问变更文档 | 管理侧栏 Reports → Callout 链 logsDocs | view-logs [读] | 界面: [待渲染实测] Callout Server_logs_access_has_changed_callout_title ／ 导航: 外链 links.go.logsDocs [读] ／ 持久化: 无 [读] | core | route.admin.reports | AnalyticsReports.tsx [读] |
| `page.admin.reports.view-json` | 阅读用量统计 JSON（只读） | Reports → 统计 pre | view-logs [读] | 界面: [待渲染实测] JSON.stringify(statistics)；加载 Skeleton；失败 Something_went_wrong_try_again_later ／ 导航: 仍在 /admin/analytic-reports [读] ／ 持久化: GET statistics（useStatistics），无用户写 [读] | core | route.admin.reports | AnalyticsReports.tsx ViewLogsPage.tsx [读] |

### E19 Sounds `/admin/sounds` — `page.admin.sounds.*`

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
|---|---|---|---|---|---|---|---|
| `page.admin.sounds.search` | 搜索自定义声音 | 管理侧栏 Sounds → 搜索 | manage-sounds [读] | 界面: [待渲染实测] 表过滤 ／ 导航: /admin/sounds [读] ／ 持久化: GET 自定义声音列表 [读] | core | route.admin.custom-sounds | CustomSoundsTable.tsx [读] |
| `page.admin.sounds.sort` | 排序声音列 | Sounds → 列表头 | 同上 | 界面: [待渲染实测] 重排 ／ 导航: 仍在页 [读] ／ 持久化: 同 GET sort [读] | core | page.admin.sounds.search | CustomSoundsTable.tsx [读] |
| `page.admin.sounds.pagination` | 翻页声音 | Sounds → Pagination | 有多页 | 界面: [待渲染实测] 换页 ／ 导航: 仍在页 [读] ／ 持久化: 同 GET [读] | core | page.admin.sounds.search | CustomSoundsTable.tsx [读] |
| `page.admin.sounds.new` | 打开新建声音 | Sounds → New | 同上 | 界面: [待渲染实测] AddCustomSound ／ 导航: context=new [读] ／ 持久化: 无至 Save [读] | core | page.admin.sounds.save | CustomSoundsPage.tsx [读] |
| `page.admin.sounds.row` | 打开编辑声音 | 表 → 行 | 同上 | 界面: [待渲染实测] EditSound ／ 导航: edit [读] ／ 持久化: 无至 Save [读] | core | page.admin.sounds.save | CustomSoundsTable.tsx [读] |
| `page.admin.sounds.name` | 填声音 Name | 表单 → Name | 同上 | 界面: [待渲染实测] ／ 导航: 仍在表单 [读] ／ 持久化: 仅本地至 Save [读] | core；共享 POST /v1/custom-sounds.create 或更新 | page.admin.sounds.save | AddCustomSound.tsx EditSound.tsx [读] |
| `page.admin.sounds.file` | 上传声音文件 | 表单 → Sound File | 同上 | 界面: [待渲染实测] 文件按钮 ／ 导航: 仍在表单 [读] ／ 持久化: 仅本地至 Save [读] | core；随 create/update 上传 | page.admin.sounds.save | AddCustomSound.tsx [读] |
| `page.admin.sounds.cancel` | 取消未保存声音 | 表单 → Cancel | 同上 | 界面: [待渲染实测] 关表单 ／ 导航: 回列表 [读] ／ 持久化: 无 [读] | core | page.admin.sounds.save | AddCustomSound.tsx [读] |
| `page.admin.sounds.save` | 保存自定义声音 | 表单 → Save | Name+文件校验通过 [读] | 界面: [待渲染实测] toast ／ 导航: 回列表 [读] ／ 持久化: POST /v1/custom-sounds.create 或更新 [读] | core | page.admin.sounds.name | AddCustomSound.tsx EditSound.tsx [读] |
| `page.admin.sounds.delete` | 删除自定义声音 | 编辑 → Delete | 已有记录 | 界面: [待渲染实测] 确认 ／ 导航: 回列表 [读] ／ 持久化: 自定义声音 delete endpoint [读] | core | page.admin.sounds.row | EditSound.tsx [读] |

### E20 Emoji `/admin/emoji` — `page.admin.emoji.*`

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
|---|---|---|---|---|---|---|---|
| `page.admin.emoji.new` | 打开新建自定义 emoji | 管理侧栏 Emoji → New | manage-emoji [读] | 界面: [待渲染实测] 表单 ／ 导航: context=new [读] ／ 持久化: 无至 Save [读] | core | page.admin.emoji.save | CustomEmojiRoute.tsx [读] |
| `page.admin.emoji.row` | 打开编辑 emoji | 表 → 行 | 同上 | 界面: [待渲染实测] EditCustomEmoji ／ 导航: edit [读] ／ 持久化: 无至 Save [读] | core | page.admin.emoji.save | CustomEmojiRoute.tsx [读] |
| `page.admin.emoji.name` | 填 emoji Name | 表单 → Name | 同上 | 界面: [待渲染实测] ／ 导航: 仍在表单 [读] ／ 持久化: 仅本地至 Save [读] | core；共享 POST /v1/emoji-custom.update 或 create | page.admin.emoji.save | EditCustomEmoji.tsx [读] |
| `page.admin.emoji.aliases` | 填 Aliases | 表单 → Aliases | 同上 | 界面: [待渲染实测] ／ 导航: 仍在表单 [读] ／ 持久化: 仅本地至 Save [读] | core；共享 emoji-custom 写 | page.admin.emoji.save | EditCustomEmoji.tsx [读] |
| `page.admin.emoji.file` | 上传 emoji 图 | 表单 → 上传 | 同上 | 界面: [待渲染实测] 文件按钮 ／ 导航: 仍在表单 [读] ／ 持久化: 仅本地至 Save [读] | core；随保存上传 | page.admin.emoji.save | EditCustomEmoji.tsx [读] |
| `page.admin.emoji.cancel` | 取消未保存 emoji | 表单 → Cancel | 同上 | 界面: [待渲染实测] 关表单 ／ 导航: 回列表 [读] ／ 持久化: 无 [读] | core | page.admin.emoji.save | EditCustomEmoji.tsx [读] |
| `page.admin.emoji.save` | 保存自定义 emoji | 表单 → Save | 校验通过 | 界面: [待渲染实测] toast ／ 导航: 回列表 [读] ／ 持久化: POST /v1/emoji-custom.update（或 create）[读] | core | page.admin.emoji.name | EditCustomEmoji.tsx [读] |
| `page.admin.emoji.delete` | 删除自定义 emoji | 编辑 → Delete | 已有记录 | 界面: [待渲染实测] 确认 ／ 导航: 回列表 [读] ／ 持久化: POST /v1/emoji-custom.delete [读] | core | page.admin.emoji.row | EditCustomEmoji.tsx [读] |

### E21 Admin Feature Preview `/admin/feature-preview` — `page.admin.feature-preview.*`

`useFeaturePreviewList.ts` 现行 **2** 项：secondarySidebar、aiSearch。另有设置 `Accounts_AllowFeaturePreview`。

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
|---|---|---|---|---|---|---|---|
| `page.admin.feature-preview.allow` | 开关允许用户使用功能预览 | 管理侧栏 Feature_preview → Setting Accounts_AllowFeaturePreview | 侧栏：defaultFeaturesPreview.length>0 [读] | 界面: [待渲染实测] Setting 控件；关则下列开关 disabled [读] ／ 导航: 仍在页 [读] ／ 持久化: 仅本地至 Save [读] | core；共享 settings dispatch | page.admin.feature-preview.save | AdminFeaturePreviewPage.tsx [读] |
| `page.admin.feature-preview.secondary-sidebar` | 默认打开二级侧栏预览 | 手风琴 Navigation → Filters_and_secondary_sidebar | allow 开 [读] | 界面: [待渲染实测] switch id=secondarySidebar + 预览图 ／ 导航: 仍在页 [读] ／ 持久化: 仅本地至 Save（写入 Accounts_Default_User_Preferences_featuresPreview）[读] | core；共享 Save | page.account.feature-preview.secondary-sidebar | AdminFeaturePreviewPage.tsx useFeaturePreviewList.ts [读] |
| `page.admin.feature-preview.ai-search` | 默认打开智能搜索预览 | 手风琴 AI → Intelligent_Search | allow 开 [读] | 界面: [待渲染实测] switch id=aiSearch ／ 导航: 仍在页 [读] ／ 持久化: 仅本地至 Save [读] | core；共享 Save | page.account.feature-preview.ai-search | AdminFeaturePreviewPage.tsx [读] |
| `page.admin.feature-preview.cancel` | 放弃未保存管理端预览 | 页脚 Cancel | dirty 或 allow 脏 [读] | 界面: [待渲染实测] reset ／ 导航: 仍在页 [读] ／ 持久化: 无 [读] | core | page.admin.feature-preview.save | AdminFeaturePreviewPage.tsx [读] |
| `page.admin.feature-preview.save` | 保存管理端功能预览默认值 | 页脚 Save_changes | dirty 或 allow 脏 [读] | 界面: [待渲染实测] toast Preferences_saved ／ 导航: 仍在页 [读] ／ 持久化: settings dispatch Accounts_AllowFeaturePreview + Accounts_Default_User_Preferences_featuresPreview [读] | core | route.admin.feature-preview | AdminFeaturePreviewPage.tsx [读] |

### E22 Settings `/admin/settings` — `page.admin.settings.*`

组来自 `settingsRegistry.addGroup`（core `server/settings` + EE）。客户端 `useSettingsGroups` 滤 `type===group`。 **禁止**把组内 ~972 key 拆行。每组一行「打开」+ 共用 Save/Cancel/Reset + 具名危险动作。
本组清单 **41** 个唯一 addGroup id。

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
|---|---|---|---|---|---|---|---|
| `page.admin.settings.search` | 搜索设置组卡片 | 管理侧栏 Settings → Search | view-privileged-setting 或 edit 或 manage-selected-settings [读] | 界面: [待渲染实测] 400ms debounce 过滤卡片；空则 GenericNoResults ／ 导航: 仍在 /admin/settings [读] ／ 持久化: 无 REST，useSettingsGroups 客户端滤 [读] | core | route.admin.settings | SettingsPage.tsx [读] |
| `page.admin.settings.open.accounts` | 打开 Accounts 设置组 | Settings 索引 → 卡 Accounts | 同上；Enterprise 组另要 EE [读] | 界面: [待渲染实测] 组页字段（不在本册拆 key）／ 导航: /admin/settings/Accounts [读] ／ 持久化: 无请求至 Save [读] | core；组内字段共享 page.admin.settings.save | page.admin.settings.save | addGroup('Accounts') SettingsGroupCard [读] |
| `page.admin.settings.open.analytics` | 打开 Analytics 设置组 | Settings 索引 → 卡 Analytics | 同上；Enterprise 组另要 EE [读] | 界面: [待渲染实测] 组页字段（不在本册拆 key）／ 导航: /admin/settings/Analytics [读] ／ 持久化: 无请求至 Save [读] | core；组内字段共享 page.admin.settings.save | page.admin.settings.save | addGroup('Analytics') SettingsGroupCard [读] |
| `page.admin.settings.open.assets` | 打开 Assets 设置组 | Settings 索引 → 卡 Assets | 同上；Enterprise 组另要 EE [读] | 界面: [待渲染实测] 组页字段（不在本册拆 key）／ 导航: /admin/settings/Assets [读] ／ 持久化: 无请求至 Save [读] | core；组内字段共享 page.admin.settings.save | page.admin.settings.save | addGroup('Assets') SettingsGroupCard [读] |
| `page.admin.settings.open.atlassian-crowd` | 打开 Atlassian Crowd 设置组 | Settings 索引 → 卡 Atlassian Crowd | 同上；Enterprise 组另要 EE [读] | 界面: [待渲染实测] 组页字段（不在本册拆 key）／ 导航: /admin/settings/AtlassianCrowd [读] ／ 持久化: 无请求至 Save [读] | core；组内字段共享 page.admin.settings.save | page.admin.settings.save | addGroup('AtlassianCrowd') SettingsGroupCard [读] |
| `page.admin.settings.open.bots` | 打开 Bots 设置组 | Settings 索引 → 卡 Bots | 同上；Enterprise 组另要 EE [读] | 界面: [待渲染实测] 组页字段（不在本册拆 key）／ 导航: /admin/settings/Bots [读] ／ 持久化: 无请求至 Save [读] | core；组内字段共享 page.admin.settings.save | page.admin.settings.save | addGroup('Bots') SettingsGroupCard [读] |
| `page.admin.settings.open.cas` | 打开 CAS 设置组 | Settings 索引 → 卡 CAS | 同上；Enterprise 组另要 EE [读] | 界面: [待渲染实测] 组页字段（不在本册拆 key）／ 导航: /admin/settings/CAS [读] ／ 持久化: 无请求至 Save [读] | core；组内字段共享 page.admin.settings.save | page.admin.settings.save | addGroup('CAS') SettingsGroupCard [读] |
| `page.admin.settings.open.custom-sounds-fs` | 打开 Custom Sounds Filesystem 设置组 | Settings 索引 → 卡 Custom Sounds Filesystem | 同上；Enterprise 组另要 EE [读] | 界面: [待渲染实测] 组页字段（不在本册拆 key）／ 导航: /admin/settings/CustomSoundsFilesystem [读] ／ 持久化: 无请求至 Save [读] | core；组内字段共享 page.admin.settings.save | page.admin.settings.save | addGroup('CustomSoundsFilesystem') SettingsGroupCard [读] |
| `page.admin.settings.open.discussion` | 打开 Discussion 设置组 | Settings 索引 → 卡 Discussion | 同上；Enterprise 组另要 EE [读] | 界面: [待渲染实测] 组页字段（不在本册拆 key）／ 导航: /admin/settings/Discussion [读] ／ 持久化: 无请求至 Save [读] | core；组内字段共享 page.admin.settings.save | page.admin.settings.save | addGroup('Discussion') SettingsGroupCard [读] |
| `page.admin.settings.open.email` | 打开 Email 设置组 | Settings 索引 → 卡 Email | 同上；Enterprise 组另要 EE [读] | 界面: [待渲染实测] 组页字段（不在本册拆 key）／ 导航: /admin/settings/Email [读] ／ 持久化: 无请求至 Save [读] | core；组内字段共享 page.admin.settings.save | page.admin.settings.save | addGroup('Email') SettingsGroupCard [读] |
| `page.admin.settings.open.emoji-custom-fs` | 打开 Emoji Custom Filesystem 设置组 | Settings 索引 → 卡 Emoji Custom Filesystem | 同上；Enterprise 组另要 EE [读] | 界面: [待渲染实测] 组页字段（不在本册拆 key）／ 导航: /admin/settings/EmojiCustomFilesystem [读] ／ 持久化: 无请求至 Save [读] | core；组内字段共享 page.admin.settings.save | page.admin.settings.save | addGroup('EmojiCustomFilesystem') SettingsGroupCard [读] |
| `page.admin.settings.open.e2e` | 打开 E2E 设置组 | Settings 索引 → 卡 E2E | 同上；Enterprise 组另要 EE [读] | 界面: [待渲染实测] 组页字段（不在本册拆 key）／ 导航: /admin/settings/End-to-end_encryption [读] ／ 持久化: 无请求至 Save [读] | core；组内字段共享 page.admin.settings.save | page.admin.settings.save | addGroup('End-to-end_encryption') SettingsGroupCard [读] |
| `page.admin.settings.open.enterprise` | 打开 Enterprise 设置组 | Settings 索引 → 卡 Enterprise | 同上；Enterprise 组另要 EE [读] | 界面: [待渲染实测] 组页字段（不在本册拆 key）／ 导航: /admin/settings/Enterprise [读] ／ 持久化: 无请求至 Save [读] | core；组内字段共享 page.admin.settings.save | page.admin.settings.save | addGroup('Enterprise') SettingsGroupCard [读] |
| `page.admin.settings.open.federation` | 打开 Federation 设置组 | Settings 索引 → 卡 Federation | 同上；Enterprise 组另要 EE [读] | 界面: [待渲染实测] 组页字段（不在本册拆 key）／ 导航: /admin/settings/Federation [读] ／ 持久化: 无请求至 Save [读] | core；组内字段共享 page.admin.settings.save | page.admin.settings.save | addGroup('Federation') SettingsGroupCard [读] |
| `page.admin.settings.open.fileupload` | 打开 File Upload 设置组 | Settings 索引 → 卡 File Upload | 同上；Enterprise 组另要 EE [读] | 界面: [待渲染实测] 组页字段（不在本册拆 key）／ 导航: /admin/settings/FileUpload [读] ／ 持久化: 无请求至 Save [读] | core；组内字段共享 page.admin.settings.save | page.admin.settings.save | addGroup('FileUpload') SettingsGroupCard [读] |
| `page.admin.settings.open.general` | 打开 General 设置组 | Settings 索引 → 卡 General | 同上；Enterprise 组另要 EE [读] | 界面: [待渲染实测] 组页字段（不在本册拆 key）／ 导航: /admin/settings/General [读] ／ 持久化: 无请求至 Save [读] | core；组内字段共享 page.admin.settings.save | page.admin.settings.save | addGroup('General') SettingsGroupCard [读] |
| `page.admin.settings.open.irc` | 打开 IRC 设置组 | Settings 索引 → 卡 IRC | 同上；Enterprise 组另要 EE [读] | 界面: [待渲染实测] 组页字段（不在本册拆 key）／ 导航: /admin/settings/IRC_Federation [读] ／ 持久化: 无请求至 Save [读] | core；组内字段共享 page.admin.settings.save | page.admin.settings.save | addGroup('IRC_Federation') SettingsGroupCard [读] |
| `page.admin.settings.open.ldap` | 打开 LDAP 设置组 | Settings 索引 → 卡 LDAP | 同上；Enterprise 组另要 EE [读] | 界面: [待渲染实测] 组页字段（不在本册拆 key）／ 导航: /admin/settings/LDAP [读] ／ 持久化: 无请求至 Save [读] | core；组内字段共享 page.admin.settings.save | page.admin.settings.save | addGroup('LDAP') SettingsGroupCard [读] |
| `page.admin.settings.open.layout` | 打开 Layout 设置组 | Settings 索引 → 卡 Layout | 同上；Enterprise 组另要 EE [读] | 界面: [待渲染实测] 组页字段（不在本册拆 key）／ 导航: /admin/settings/Layout [读] ／ 持久化: 无请求至 Save [读] | core；组内字段共享 page.admin.settings.save | page.admin.settings.save | addGroup('Layout') SettingsGroupCard [读] |
| `page.admin.settings.open.logs` | 打开 Logs 设置组 | Settings 索引 → 卡 Logs | 同上；Enterprise 组另要 EE [读] | 界面: [待渲染实测] 组页字段（不在本册拆 key）／ 导航: /admin/settings/Logs [读] ／ 持久化: 无请求至 Save [读] | core；组内字段共享 page.admin.settings.save | page.admin.settings.save | addGroup('Logs') SettingsGroupCard [读] |
| `page.admin.settings.open.message` | 打开 Message 设置组 | Settings 索引 → 卡 Message | 同上；Enterprise 组另要 EE [读] | 界面: [待渲染实测] 组页字段（不在本册拆 key）／ 导航: /admin/settings/Message [读] ／ 持久化: 无请求至 Save [读] | core；组内字段共享 page.admin.settings.save | page.admin.settings.save | addGroup('Message') SettingsGroupCard [读] |
| `page.admin.settings.open.meta` | 打开 Meta 设置组 | Settings 索引 → 卡 Meta | 同上；Enterprise 组另要 EE [读] | 界面: [待渲染实测] 组页字段（不在本册拆 key）／ 导航: /admin/settings/Meta [读] ／ 持久化: 无请求至 Save [读] | core；组内字段共享 page.admin.settings.save | page.admin.settings.save | addGroup('Meta') SettingsGroupCard [读] |
| `page.admin.settings.open.mobile` | 打开 Mobile 设置组 | Settings 索引 → 卡 Mobile | 同上；Enterprise 组另要 EE [读] | 界面: [待渲染实测] 组页字段（不在本册拆 key）／ 导航: /admin/settings/Mobile [读] ／ 持久化: 无请求至 Save [读] | core；组内字段共享 page.admin.settings.save | page.admin.settings.save | addGroup('Mobile') SettingsGroupCard [读] |
| `page.admin.settings.open.oauth` | 打开 OAuth 设置组 | Settings 索引 → 卡 OAuth | 同上；Enterprise 组另要 EE [读] | 界面: [待渲染实测] 组页字段（不在本册拆 key）／ 导航: /admin/settings/OAuth [读] ／ 持久化: 无请求至 Save [读] | core；组内字段共享 page.admin.settings.save | page.admin.settings.save | addGroup('OAuth') SettingsGroupCard [读] |
| `page.admin.settings.open.omnichannel` | 打开 Omnichannel 设置组 | Settings 索引 → 卡 Omnichannel | 同上；Enterprise 组另要 EE [读] | 界面: [待渲染实测] 组页字段（不在本册拆 key）／ 导航: /admin/settings/Omnichannel [读] ／ 持久化: 无请求至 Save [读] | core；组内字段共享 page.admin.settings.save | page.admin.settings.save | addGroup('Omnichannel') SettingsGroupCard [读] |
| `page.admin.settings.open.outlook` | 打开 Outlook Calendar 设置组 | Settings 索引 → 卡 Outlook Calendar | 同上；Enterprise 组另要 EE [读] | 界面: [待渲染实测] 组页字段（不在本册拆 key）／ 导航: /admin/settings/Outlook_Calendar [读] ／ 持久化: 无请求至 Save [读] | core；组内字段共享 page.admin.settings.save | page.admin.settings.save | addGroup('Outlook_Calendar') SettingsGroupCard [读] |
| `page.admin.settings.open.push` | 打开 Push 设置组 | Settings 索引 → 卡 Push | 同上；Enterprise 组另要 EE [读] | 界面: [待渲染实测] 组页字段（不在本册拆 key）／ 导航: /admin/settings/Push [读] ／ 持久化: 无请求至 Save [读] | core；组内字段共享 page.admin.settings.save | page.admin.settings.save | addGroup('Push') SettingsGroupCard [读] |
| `page.admin.settings.open.rate-limiter` | 打开 Rate Limiter 设置组 | Settings 索引 → 卡 Rate Limiter | 同上；Enterprise 组另要 EE [读] | 界面: [待渲染实测] 组页字段（不在本册拆 key）／ 导航: /admin/settings/Rate Limiter [读] ／ 持久化: 无请求至 Save [读] | core；组内字段共享 page.admin.settings.save | page.admin.settings.save | addGroup('Rate Limiter') SettingsGroupCard [读] |
| `page.admin.settings.open.retention` | 打开 Retention Policy 设置组 | Settings 索引 → 卡 Retention Policy | 同上；Enterprise 组另要 EE [读] | 界面: [待渲染实测] 组页字段（不在本册拆 key）／ 导航: /admin/settings/RetentionPolicy [读] ／ 持久化: 无请求至 Save [读] | core；组内字段共享 page.admin.settings.save | page.admin.settings.save | addGroup('RetentionPolicy') SettingsGroupCard [读] |
| `page.admin.settings.open.saml` | 打开 SAML 设置组 | Settings 索引 → 卡 SAML | 同上；Enterprise 组另要 EE [读] | 界面: [待渲染实测] 组页字段（不在本册拆 key）／ 导航: /admin/settings/SAML [读] ／ 持久化: 无请求至 Save [读] | core；组内字段共享 page.admin.settings.save | page.admin.settings.save | addGroup('SAML') SettingsGroupCard [读] |
| `page.admin.settings.open.sms` | 打开 SMS 设置组 | Settings 索引 → 卡 SMS | 同上；Enterprise 组另要 EE [读] | 界面: [待渲染实测] 组页字段（不在本册拆 key）／ 导航: /admin/settings/SMS [读] ／ 持久化: 无请求至 Save [读] | core；组内字段共享 page.admin.settings.save | page.admin.settings.save | addGroup('SMS') SettingsGroupCard [读] |
| `page.admin.settings.open.search` | 打开 Search 设置组 | Settings 索引 → 卡 Search | 同上；Enterprise 组另要 EE [读] | 界面: [待渲染实测] 组页字段（不在本册拆 key）／ 导航: /admin/settings/Search [读] ／ 持久化: 无请求至 Save [读] | core；组内字段共享 page.admin.settings.save | page.admin.settings.save | addGroup('Search') SettingsGroupCard [读] |
| `page.admin.settings.open.setup-wizard` | 打开 Setup Wizard 设置组 | Settings 索引 → 卡 Setup Wizard | 同上；Enterprise 组另要 EE [读] | 界面: [待渲染实测] 组页字段（不在本册拆 key）／ 导航: /admin/settings/Setup_Wizard [读] ／ 持久化: 无请求至 Save [读] | core；组内字段共享 page.admin.settings.save | page.admin.settings.save | addGroup('Setup_Wizard') SettingsGroupCard [读] |
| `page.admin.settings.open.slackbridge` | 打开 SlackBridge 设置组 | Settings 索引 → 卡 SlackBridge | 同上；Enterprise 组另要 EE [读] | 界面: [待渲染实测] 组页字段（不在本册拆 key）／ 导航: /admin/settings/SlackBridge [读] ／ 持久化: 无请求至 Save [读] | core；组内字段共享 page.admin.settings.save | page.admin.settings.save | addGroup('SlackBridge') SettingsGroupCard [读] |
| `page.admin.settings.open.smarsh` | 打开 Smarsh 设置组 | Settings 索引 → 卡 Smarsh | 同上；Enterprise 组另要 EE [读] | 界面: [待渲染实测] 组页字段（不在本册拆 key）／ 导航: /admin/settings/Smarsh [读] ／ 持久化: 无请求至 Save [读] | core；组内字段共享 page.admin.settings.save | page.admin.settings.save | addGroup('Smarsh') SettingsGroupCard [读] |
| `page.admin.settings.open.threads` | 打开 Threads 设置组 | Settings 索引 → 卡 Threads | 同上；Enterprise 组另要 EE [读] | 界面: [待渲染实测] 组页字段（不在本册拆 key）／ 导航: /admin/settings/Threads [读] ／ 持久化: 无请求至 Save [读] | core；组内字段共享 page.admin.settings.save | page.admin.settings.save | addGroup('Threads') SettingsGroupCard [读] |
| `page.admin.settings.open.troubleshoot` | 打开 Troubleshoot 设置组 | Settings 索引 → 卡 Troubleshoot | 同上；Enterprise 组另要 EE [读] | 界面: [待渲染实测] 组页字段（不在本册拆 key）／ 导航: /admin/settings/Troubleshoot [读] ／ 持久化: 无请求至 Save [读] | core；组内字段共享 page.admin.settings.save | page.admin.settings.save | addGroup('Troubleshoot') SettingsGroupCard [读] |
| `page.admin.settings.open.user-data-download` | 打开 User Data Download 设置组 | Settings 索引 → 卡 User Data Download | 同上；Enterprise 组另要 EE [读] | 界面: [待渲染实测] 组页字段（不在本册拆 key）／ 导航: /admin/settings/UserDataDownload [读] ／ 持久化: 无请求至 Save [读] | core；组内字段共享 page.admin.settings.save | page.admin.settings.save | addGroup('UserDataDownload') SettingsGroupCard [读] |
| `page.admin.settings.open.video-conference` | 打开 Video Conference 设置组 | Settings 索引 → 卡 Video Conference | 同上；Enterprise 组另要 EE [读] | 界面: [待渲染实测] 组页字段（不在本册拆 key）／ 导航: /admin/settings/Video_Conference [读] ／ 持久化: 无请求至 Save [读] | core；组内字段共享 page.admin.settings.save | page.admin.settings.save | addGroup('Video_Conference') SettingsGroupCard [读] |
| `page.admin.settings.open.voip` | 打开 VoIP 设置组 | Settings 索引 → 卡 VoIP | 同上；Enterprise 组另要 EE [读] | 界面: [待渲染实测] 组页字段（不在本册拆 key）／ 导航: /admin/settings/VoIP_TeamCollab [读] ／ 持久化: 无请求至 Save [读] | core；组内字段共享 page.admin.settings.save | page.admin.settings.save | addGroup('VoIP_TeamCollab') SettingsGroupCard [读] |
| `page.admin.settings.open.webdav` | 打开 Webdav 设置组 | Settings 索引 → 卡 Webdav | 同上；Enterprise 组另要 EE [读] | 界面: [待渲染实测] 组页字段（不在本册拆 key）／ 导航: /admin/settings/Webdav Integration [读] ／ 持久化: 无请求至 Save [读] | core；组内字段共享 page.admin.settings.save | page.admin.settings.save | addGroup('Webdav Integration') SettingsGroupCard [读] |
| `page.admin.settings.open.device-management` | 打开 Device Management 设置组 | Settings 索引 → 卡 Device Management | 同上；Enterprise 组另要 EE [读] | 界面: [待渲染实测] 组页字段（不在本册拆 key）／ 导航: /admin/settings/Device_Management [读] ／ 持久化: 无请求至 Save [读] | core；组内字段共享 page.admin.settings.save | page.admin.settings.save | addGroup('Device_Management') SettingsGroupCard [读] |
| `page.admin.settings.save` | 保存当前设置组 | 任意组 → Save_changes | dirty + edit-privileged-setting [读] | 界面: [待渲染实测] toast ／ 导航: 仍在组页 [读] ／ 持久化: settings dispatch 批量 [读] | core | page.admin.settings.search | SettingsGroupPage.tsx [读] |
| `page.admin.settings.cancel` | 取消未保存设置 | 任意组 → Cancel | dirty [读] | 界面: [待渲染实测] 回滚本地 editable ／ 导航: 仍在组页 [读] ／ 持久化: 无 [读] | core | page.admin.settings.save | SettingsGroupPage.tsx [读] |
| `page.admin.settings.reset-setting` | 重置单个设置为包装默认 | 组内某字段 → Reset | 权限 [读] | 界面: [待渲染实测] 该字段回 package value ／ 导航: 仍在组 [读] ／ 持久化: 仅本地至 Save（ResetSettingButton）[读] | core | page.admin.settings.save | ResetSettingButton.tsx [读] |
| `page.admin.settings.ldap.test-connection` | LDAP 测试连接 | Settings → LDAP → Test_Connection | LDAP 组 [读] | 界面: [待渲染实测] toast ／ 导航: 仍在 LDAP [读] ／ 持久化: POST /v1/ldap.testConnection [读] | core | page.admin.settings.open.ldap | LDAPGroupPage.tsx [读] |
| `page.admin.settings.ldap.test-search` | LDAP 测试搜索 | LDAP → Test_LDAP_Search → 填用户名 → 确认 | 同上 | 界面: [待渲染实测] 用户名模态 ／ 导航: 仍在 LDAP [读] ／ 持久化: POST /v1/ldap.testSearch [读] | core | page.admin.settings.open.ldap | LDAPGroupPage.tsx [读] |
| `page.admin.settings.ldap.sync-now` | LDAP 立即同步 | LDAP → LDAP_Sync_Now | 同上 | 界面: [待渲染实测] 耗时动作 [待渲染实测] ／ 导航: 仍在 LDAP [读] ／ 持久化: LDAP sync hook [读] | core | page.admin.settings.open.ldap | LDAPGroupPage.tsx [读] |
| `page.admin.settings.oauth.refresh` | 刷新 OAuth 服务 | Settings → OAuth → Refresh_oauth_services | OAuth 组 [读] | 界面: [待渲染实测] toast ／ 导航: 仍在 OAuth [读] ／ 持久化: POST /v1/settings.refreshOAuthServices [读] | core | page.admin.settings.open.oauth | OAuthGroupPage.tsx [读] |
| `page.admin.settings.oauth.add-custom` | 添加自定义 OAuth | OAuth → Add_custom_oauth | 同上 | 界面: [待渲染实测] 新 section ／ 导航: 仍在 OAuth [读] ／ 持久化: POST /v1/settings.addCustomOAuth [读] | core | page.admin.settings.open.oauth | OAuthGroupPage.tsx [读] |
| `page.admin.settings.oauth.remove-custom` | 删除自定义 OAuth | OAuth → 自定义 section → Remove | 已有自定义 [读] | 界面: [待渲染实测] section 消失 ／ 导航: 仍在 OAuth [读] ／ 持久化: POST /v1/settings.removeCustomOAuth [读] | core | page.admin.settings.oauth.add-custom | OAuthGroupPage.tsx [读] |
| `page.admin.settings.saml.import-metadata` | 导入 SAML metadata | Settings → SAML → SAML_Import_metadata → 贴 XML → Apply | SAML 组 [读] | 界面: [待渲染实测] SamlMetadataModal ／ 导航: 仍在 SAML [读] ／ 持久化: POST /v1/saml.parseMetadata；Apply 写入可编辑设置，须再 Save_changes [读] | core | page.admin.settings.open.saml | SAMLGroupPage.tsx SamlMetadataModal.tsx [读] |
| `page.admin.settings.email.send-test` | 给自己发 SMTP 测试信 | Settings → Email → Send_a_test_mail_to_my_user | Email 组 + SMTP [读] | 界面: [待渲染实测] toast ／ 导航: 仍在 Email [读] ／ 持久化: Meteor method sendSMTPTestEmail（SMTP_Test_Button）[读] | core | page.admin.settings.open.email | server/settings/email.ts MethodActionInput [读] |

---

## F. 键盘快捷键说明模态（只显示）

02 `nav.user.keyboard`、03 `shortcut.global.showShortcutsModal` 已覆盖打开与按键绑定。本册 **一行**：模态本身只展示 9 条说明，无绑定、无 REST。绑定见 03，不在此复写 9 条 shortcut。

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
|---|---|---|---|---|---|---|---|
| `page.account.keyboard.display` | 查看键盘快捷键说明（只读） | 顶栏右→`User_menu`→`Keyboard_Shortcuts_Title` 或房间内 `Shift+?`（焦点不在 input/dialog） | 无 | 界面: `[待渲染实测]` `GenericModal` title=`Keyboard_Shortcuts_Title` `variant=info` icon=keyboard；`dl[aria-label=Keyboard_Shortcuts_Title]` 列出 9 条 `dt/dd`；`Close` 关掉 ／ 导航: 模态叠在当前页，刷新关闭 `[读]` ／ 持久化: **无 endpoint** `[读]` | core | `nav.user.keyboard` `shortcut.global.showShortcutsModal` `shortcut.global.markAllAsRead.documented-unbound` | `KeyboardShortcutsModal.tsx:17-66,89-132` `[读]` |

9 条文案 id（**不**新建 page id，关联 03）：`openKeyboardShortcuts` `openSearch` `markAllAsRead` `editPreviousMessage` `moveToBeginningHorizontal` `moveToBeginningVertical` `moveToEndHorizontal` `moveToEndVertical` `newLine`。`rg -c "id: '" KeyboardShortcutsModal.tsx` → 9。

---

## G. Audit 页内部 `page.audit.*`

父入口：`route.audit` / `route.audit-log` / `route.security-logs`（04）。本表是表单与查询控件。`AuditForm` RHF：`msg` `dateRange` + 页签字段 `rid`/`users`/`visitor`/`agent`。

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
|---|---|---|---|---|---|---|---|
| `page.audit.messages.tab.rooms` | 审计 Rooms 页签 | Audit → tab Rooms | can-audit [读] | 界面: [待渲染实测] 房间表单 ／ 导航: /audit [读] ／ 持久化: 无请求至 Apply [读] | EE:auditing | route.audit | AuditPage.tsx [读] |
| `page.audit.messages.tab.users` | 审计 Users 页签 | Audit → tab Users | 同上 | 界面: [待渲染实测] ／ 导航: 切 tab [读] ／ 持久化: 无至 Apply [读] | EE:auditing | route.audit | AuditPage.tsx [读] |
| `page.audit.messages.tab.dms` | 审计 Direct_Messages 页签 | Audit → tab Direct_Messages | 同上 | 界面: [待渲染实测] ／ 导航: 切 tab [读] ／ 持久化: 无至 Apply [读] | EE:auditing | route.audit | AuditPage.tsx [读] |
| `page.audit.messages.tab.omnichannel` | 审计 Omnichannel 页签 | Audit → tab Omnichannel | can-audit + omnichannel [读] | 界面: [待渲染实测] ／ 导航: 切 tab [读] ／ 持久化: 无至 Apply [读] | EE:auditing | route.audit | AuditPage.tsx [读] |
| `page.audit.messages.msg` | 填消息关键词 | Audit → Message | 同上 | 界面: [待渲染实测] search ／ 导航: 仍在页 [读] ／ 持久化: 仅本地至 Apply [读] | EE:auditing；共享 Apply POST | page.audit.messages.apply | AuditForm.tsx name=msg [读] |
| `page.audit.messages.daterange` | 选审计日期范围 | Audit → Date | 同上 | 界面: [待渲染实测] date-range ／ 导航: 仍在页 [读] ／ 持久化: 仅本地至 Apply [读] | EE:auditing；共享 Apply POST | page.audit.messages.apply | AuditForm.tsx name=dateRange [读] |
| `page.audit.messages.room` | 选房间 | Rooms 页签 → Channel_name | Rooms 页签 [读] | 界面: [待渲染实测] autocomplete ／ 导航: 仍在页 [读] ／ 持久化: 仅本地至 Apply [读] | EE:auditing；共享 Apply POST | page.audit.messages.apply | tabs/RoomsTab.tsx name=rid [读] |
| `page.audit.messages.users` | 选用户（Users 页签） | Users 页签 → Users | Users 页签 [读] | 界面: [待渲染实测] 多选 ／ 导航: 仍在页 [读] ／ 持久化: 仅本地至 Apply [读] | EE:auditing；共享 Apply POST | page.audit.messages.apply | tabs/UsersTab.tsx name=users [读] |
| `page.audit.messages.dm-users` | 选 DM 双方（至少 2） | DMs 页签 → Users | DMs 页签 [读] | 界面: [待渲染实测] 多选 ≥2 [读] ／ 导航: 仍在页 [读] ／ 持久化: 仅本地至 Apply [读] | EE:auditing；共享 Apply POST | page.audit.messages.apply | tabs/DirectTab.tsx name=users [读] |
| `page.audit.messages.visitor` | 选 Omnichannel 访客 | Omnichannel → Visitor | Omnichannel 页签 [读] | 界面: [待渲染实测] autocomplete ／ 导航: 仍在页 [读] ／ 持久化: 仅本地至 Apply [读] | EE:auditing；共享 Apply POST | page.audit.messages.apply | tabs/OmnichannelTab.tsx name=visitor [读] |
| `page.audit.messages.agent` | 选 Omnichannel 坐席 | Omnichannel → Agent | 同上 | 界面: [待渲染实测] autocomplete ／ 导航: 仍在页 [读] ／ 持久化: 仅本地至 Apply [读] | EE:auditing；共享 Apply POST | page.audit.messages.apply | tabs/OmnichannelTab.tsx name=agent [读] |
| `page.audit.messages.apply` | 执行审计查询 | Audit → Apply | 表单有效 [读] | 界面: [待渲染实测] 结果表或空 [读] ／ 导航: 仍在 /audit [读] ／ 持久化: POST /v1/audit.messages 或 /v1/audit.omnichannelMessages [读] | EE:auditing | page.audit.messages.msg | AuditForm.tsx useAuditMutation.ts [读] |
| `page.audit.messages.export-pdf` | 导出 PDF | Audit → Export PDF | 已有结果 [读] | 界面: [待渲染实测] 浏览器打印框 ／ 导航: 仍在页 [读] ／ 持久化: 无 REST，window.print() [读] | EE:auditing | page.audit.messages.apply | AuditForm.tsx [读] |
| `page.audit.log.daterange` | 改审计日志日期 | Audit Log → Date | can-audit-log [读] | 界面: [待渲染实测] 表刷新 ／ 导航: /audit-log [读] ／ 持久化: GET /v1/audit.auditions（改日期即拉）[读] | EE:auditing | route.audit-log | AuditLogTable.tsx [读] |
| `page.audit.security.daterange` | 改设置日志日期 | Security Logs → Date | 设置审计权限 [读] | 界面: [待渲染实测] ／ 导航: /security-logs [读] ／ 持久化: 仅本地至 Apply_filters [读] | EE:auditing；共享 GET /v1/audit.settings | page.audit.security.apply | SecurityLogsTable.tsx [读] |
| `page.audit.security.setting` | 按设置项过滤日志 | Security Logs → Setting select | 同上 | 界面: [待渲染实测] ／ 导航: 仍在页 [读] ／ 持久化: 仅本地至 Apply_filters [读] | EE:auditing；共享 audit.settings | page.audit.security.apply | SecurityLogsTable.tsx [读] |
| `page.audit.security.clear` | 清空安全日志过滤 | Security Logs → Clear_filters | 同上 | 界面: [待渲染实测] 条件复位 ／ 导航: 仍在页 [读] ／ 持久化: 重置查询 [读] | EE:auditing | page.audit.security.apply | SecurityLogsTable.tsx [读] |
| `page.audit.security.apply` | 应用安全日志过滤 | Security Logs → Apply_filters | 同上 | 界面: [待渲染实测] 表刷新 ／ 导航: 仍在页 [读] ／ 持久化: GET /v1/audit.settings [读] | EE:auditing | route.security-logs | SecurityLogsTable.tsx [读] |
| `page.audit.security.row` | 打开一条设置变更详情 | Security Logs → 行单击 | 同上 | 界面: [待渲染实测] 只读模态 ／ 导航: 模态叠在页上 [读] ／ 持久化: 无新请求（展示行数据）[读] | EE:auditing | page.audit.security.apply | SecurityLogsTable.tsx [读] |
| `page.audit.security.pagination` | 翻页设置日志 | Security Logs → Pagination | 有多页 | 界面: [待渲染实测] 换页 ／ 导航: 仍在页 [读] ／ 持久化: GET audit.settings offset [读] | EE:auditing | page.audit.security.apply | SecurityLogsTable.tsx [读] |
---

## H. 验算（按页，禁止虚荣总功能数）

命令：`rg -c '^\| \`page\.' docs/qa/pm-feature-atlas/07-page-interiors.md` 只用于核对表体是否写全，**不要**对外说成「总功能数」。下列是命名空间行数，已对照源码字段 grep。

| 命名空间 | 表体行 | 源码对照 |
|---|---|---|
| `page.create.channel.*` | 17 | CreateChannel `name=` **8**（name topic members isPrivate federated encrypted readOnly broadcast）+ 校验/cancel/submit/team-parent |
| `page.create.team.*` | 14 | CreateTeam 无 federated；字段+校验+submit |
| `page.create.discussion.*` | 10 | CreateDiscussion 字段+加密丢掉 firstMessage |
| `page.create.dm.*` | 6 | CreateDirectMessage users/校验/submit；onSettled 失败也关 |
| `page.account.profile.*` | 28 | Avatar×5 + Profile RHF + 校验 + logout-others + delete |
| `page.account.preferences.*` | 38 | Controller `name=` **30** + 桌面权限 + 3 FieldLink + My Data×2 + cancel/save；8 个 AccordionItem 均有行（Localization/Global/User_Presence/Notifications/Messages/Highlights/Sound/My Data） |
| `page.account.security.*` | 14 | password / TOTP / email 2FA / E2E |
| `page.account.accessibility.*` | 14 | theme 4 + fontSize + mentions + clock + usernames + roles + cancel/save + 3 外链 |
| `page.account.feature-preview.*` | 5 | defaultFeaturesPreview **2**（secondarySidebar aiSearch） |
| `page.account.integrations.*` | 2 | WebDAV select + remove |
| `page.account.tokens.*` | 9 | name/bypass/add/regenerate/remove/pagination |
| `page.account.sessions.*` | 5 | sort×3 + pagination + logout |
| `page.account.omnichannel.*` | 5 | 3 偏好 + cancel/save |
| `page.directory.*` | 33 | tabs + channels/users/teams 的 search/sort/row-click/empty/error/not-authorized；external 不渲染 |
| `page.home.*` | 14 | 每张卡 CTA + 自定义 body/visibility/only |
| `page.admin.workspace.*` | 9 | Download/Refresh/Register/token/intent/sync/update/subscription/instances |
| `page.admin.subscription.*` | 8 | sync/checkout/cancel/license-text/apply/upload/remove/copy |
| `page.admin.engagement.*` | 19 | timezone + 3 tab + 各图 period/download/pagination |
| `page.admin.moderation.*` | 11 | 2 tab + 行菜单/详情动作 |
| `page.admin.rooms.*` | 21 | search/filter/sort/pagination/row + EditRoom `name=` 字段各一行 |
| `page.admin.users.*` | 42 | 4 tab + search/role/sort/pagination + Invite/New + AdminUserForm 全部 `name=` + 详情动作 |
| `page.admin.ai-center.*` | 5 | View_options + 3 能力卡 + section save（组内设置不拆） |
| `page.admin.invites.*` | 3 | list/remove/reload |
| `page.admin.user-status.*` | 8 | new/presence/row + name/statusType + save/delete |
| `page.admin.permissions.*` | 18 | 矩阵 + RoleForm 4 字段 + users-in-role |
| `page.admin.abac.*` | 40 | 4 tab + Settings 具名键（abac.ts）+ 属性/房间表单字段 |
| `page.admin.devices.*` | 8 | search + 4 sort + pagination + row + logout |
| `page.admin.email-inbox.*` | 23 | EmailInboxForm `name=` **16** + new/row/cancel/save/delete/send-test |
| `page.admin.mailer.*` | 7 | from/dryRun/query/subject/body + cancel/send |
| `page.admin.oauth-apps.*` | 8 | active/name/redirectUri + new/row/save/delete |
| `page.admin.integrations.*` | 55 | Incoming `name=` **11** + Outgoing `name=` **21** + 列表/历史 |
| `page.admin.import.*` | 25 | 向导每步：type/file-type/file/url/path + prepare 勾选 + start/progress |
| `page.admin.reports.*` | 2 | 只读 JSON + 文档链（页内无可改字段） |
| `page.admin.sounds.*` | 10 | search/sort/pagination + name/file/save/delete |
| `page.admin.emoji.*` | 8 | name/aliases/file/save/delete |
| `page.admin.feature-preview.*` | 5 | Allow 设置 + 2 预览开关 + cancel/save |
| `page.admin.settings.*` | 53 | 索引 Search + **41** 个 addGroup 打开行 + Save/Cancel/Reset + LDAP/OAuth/SAML/Email 危险动作；不拆 972 key |
| `page.account.keyboard.*` | 1 | 1 行显示面，关联 03 的 9 条 shortcut |
| `page.audit.messages.*` | 13 | 4 tab + msg/date/rid/users/visitor/agent + Apply + print |
| `page.audit.log.*` | 1 | daterange → GET audit.auditions |
| `page.audit.security.*` | 6 | daterange/setting/clear/apply/row/pagination |

源码对照命令（写文档时已跑）：

```
rg -c 'i18nLabel:' apps/meteor/client/views/admin/sidebarItems.ts   # 22
rg "name=" apps/meteor/client/navbar/NavBarPagesGroup/actions/CreateChannelModal.tsx
# name topic members isPrivate federated encrypted readOnly broadcast = 8
rg "name=" apps/meteor/client/views/account/preferences/ -g '*.tsx'
# Controller 可保存 30
rg "name: '" packages/ui-client/src/hooks/useFeaturePreviewList.ts
# secondarySidebar, aiSearch
rg "name=" apps/meteor/client/views/admin/integrations/incoming/IncomingWebhookForm.tsx
# 11 字段
rg "name=" apps/meteor/client/views/admin/integrations/outgoing/OutgoingWebhookForm.tsx
# 21 字段
rg "name=" apps/meteor/client/views/admin/emailInbox/EmailInboxForm.tsx
# 16 字段
```

质量门槛自检：Create Channel **不是** 1 行（17）；Profile **不是** 1 行（28）；Preferences 8 个手风琴均有控件行；Directory 有 search/sort/row-click；22 个 admin href **没有**「只打开页」塌缩行。

## I. 待渲染实测清单

本册**每一表体行**至少有一处 `[待渲染实测]`。整页级优先补：

- 创建模态：校验文案、toast、关闭时机、DM `onSettled` 失败仍关
- Profile：头像裁剪、验证信、末位 owner 二次确认文案
- Preferences：accordion 默认开合、桌面通知权限浏览器差异
- Security：TOTP QR、E2E Meteor method vs REST
- Directory：500ms debounce、空态、`view-outside-room` 未授权页
- Home：自定义 HTML 卡在无权限时的占位
- Admin：各表分页 count、Mailer dry-run 收件人、LDAP sync 耗时、Settings 组内字段数（有意不拆）、Reports 只读 JSON 体量
- Audit：`window.print()` 打印框、omnichannel 页签许可

## J. 稳定语义 id 清单（本册新增，全部 NEW）

父入口仍在 02/04，**禁止复用**那些 id。完整 id 即各表第一列。按命名空间列出：

**page.create.channel**（17）： `page.create.channel.name` `page.create.channel.name.required` `page.create.channel.name.special-chars` `page.create.channel.name.duplicate` `page.create.channel.topic` `page.create.channel.members` `page.create.channel.members.external-rejected` `page.create.channel.private` `page.create.channel.advanced` `page.create.channel.federated` `page.create.channel.encrypted` `page.create.channel.readonly` `page.create.channel.broadcast` `page.create.channel.cancel` `page.create.channel.submit` `page.create.channel.submit.permission-denied` `page.create.channel.team-parent`

**page.create.team**（14）： `page.create.team.name` `page.create.team.name.required` `page.create.team.name.special-chars` `page.create.team.name.duplicate` `page.create.team.topic` `page.create.team.members` `page.create.team.private` `page.create.team.advanced` `page.create.team.encrypted` `page.create.team.readonly` `page.create.team.broadcast` `page.create.team.cancel` `page.create.team.submit` `page.create.team.submit.permission-denied`

**page.create.discussion**（10）： `page.create.discussion.parent` `page.create.discussion.parent.required` `page.create.discussion.name` `page.create.discussion.name.required` `page.create.discussion.topic` `page.create.discussion.members` `page.create.discussion.reply` `page.create.discussion.encrypted` `page.create.discussion.cancel` `page.create.discussion.submit`

**page.create.dm**（6）： `page.create.dm.users` `page.create.dm.users.required` `page.create.dm.users.max` `page.create.dm.cancel` `page.create.dm.submit` `page.create.dm.submit.error`

**page.account.profile**（28）： `page.account.profile.avatar.upload` `page.account.profile.avatar.url` `page.account.profile.avatar.add-url` `page.account.profile.avatar.reset` `page.account.profile.avatar.suggest` `page.account.profile.name` `page.account.profile.name.required` `page.account.profile.username` `page.account.profile.username.invalid` `page.account.profile.username.taken` `page.account.profile.status-type` `page.account.profile.status-text` `page.account.profile.status-duration` `page.account.profile.status-custom-date` `page.account.profile.status-custom-time` `page.account.profile.status-visibility` `page.account.profile.nickname` `page.account.profile.bio` `page.account.profile.email` `page.account.profile.email.invalid` `page.account.profile.resend-verification` `page.account.profile.custom-fields` `page.account.profile.cancel` `page.account.profile.save` `page.account.profile.logout-others` `page.account.profile.delete` `page.account.profile.delete.invalid-password` `page.account.profile.delete.last-owner`

**page.account.preferences**（38）： `page.account.preferences.language` `page.account.preferences.dont-ask-again` `page.account.preferences.auto-away` `page.account.preferences.idle-time` `page.account.preferences.desktop-permission` `page.account.preferences.desktop-require-interaction` `page.account.preferences.desktop-default` `page.account.preferences.desktop-voice` `page.account.preferences.push-default` `page.account.preferences.email-mode` `page.account.preferences.login-email` `page.account.preferences.calendar-notify` `page.account.preferences.mobile-ringing` `page.account.preferences.unread-alert` `page.account.preferences.threads-in-main` `page.account.preferences.thread-to-channel` `page.account.preferences.link-clock` `page.account.preferences.use-emojis` `page.account.preferences.ascii-emoji` `page.account.preferences.auto-images` `page.account.preferences.mobile-bandwidth` `page.account.preferences.collapse-media` `page.account.preferences.link-usernames` `page.account.preferences.link-roles` `page.account.preferences.hide-flextab` `page.account.preferences.display-avatars` `page.account.preferences.send-on-enter` `page.account.preferences.highlights` `page.account.preferences.master-volume` `page.account.preferences.notification-volume` `page.account.preferences.ringer-volume` `page.account.preferences.new-room-sound` `page.account.preferences.new-message-sound` `page.account.preferences.mute-focused` `page.account.preferences.download-my-data` `page.account.preferences.export-my-data` `page.account.preferences.cancel` `page.account.preferences.save`

**page.account.security**（14）： `page.account.security.password` `page.account.security.password-confirm` `page.account.security.password.cancel` `page.account.security.password.save` `page.account.security.totp.toggle` `page.account.security.totp.secret` `page.account.security.totp.verify` `page.account.security.totp.regenerate` `page.account.security.email-2fa` `page.account.security.e2e-passphrase` `page.account.security.e2e-passphrase-confirm` `page.account.security.e2e-enter-current` `page.account.security.e2e-save` `page.account.security.e2e-reset`

**page.account.accessibility**（14）： `page.account.accessibility.link-statement` `page.account.accessibility.link-glossary` `page.account.accessibility.link-docs` `page.account.accessibility.theme.light` `page.account.accessibility.theme.dark` `page.account.accessibility.theme.high-contrast` `page.account.accessibility.theme.auto` `page.account.accessibility.font-size` `page.account.accessibility.mentions-symbol` `page.account.accessibility.clock-mode` `page.account.accessibility.show-usernames` `page.account.accessibility.show-roles` `page.account.accessibility.cancel` `page.account.accessibility.save`

**page.account.feature-preview**（5）： `page.account.feature-preview.empty` `page.account.feature-preview.secondary-sidebar` `page.account.feature-preview.ai-search` `page.account.feature-preview.cancel` `page.account.feature-preview.save`

**page.account.integrations**（2）： `page.account.integrations.select` `page.account.integrations.remove`

**page.account.tokens**（9）： `page.account.tokens.name` `page.account.tokens.name.required` `page.account.tokens.bypass-2fa` `page.account.tokens.add` `page.account.tokens.regenerate` `page.account.tokens.remove` `page.account.tokens.pagination` `page.account.tokens.empty` `page.account.tokens.retry`

**page.account.sessions**（5）： `page.account.sessions.sort.client` `page.account.sessions.sort.os` `page.account.sessions.sort.login-at` `page.account.sessions.pagination` `page.account.sessions.logout`

**page.account.omnichannel**（5）： `page.account.omnichannel.hide-after-close` `page.account.omnichannel.transcript-pdf` `page.account.omnichannel.transcript-email` `page.account.omnichannel.cancel` `page.account.omnichannel.save`

**page.directory**（33）： `page.directory.tab.channels` `page.directory.tab.users` `page.directory.tab.teams` `page.directory.tab.external` `page.directory.channels.search` `page.directory.channels.sort.name` `page.directory.channels.sort.users` `page.directory.channels.sort.created` `page.directory.channels.sort.last-message` `page.directory.channels.col.belongs-to` `page.directory.channels.pagination` `page.directory.channels.row` `page.directory.channels.empty` `page.directory.channels.error` `page.directory.channels.not-authorized` `page.directory.users.search` `page.directory.users.sort.name` `page.directory.users.sort.email` `page.directory.users.sort.created` `page.directory.users.pagination` `page.directory.users.row` `page.directory.users.empty` `page.directory.users.error` `page.directory.users.not-authorized` `page.directory.teams.search` `page.directory.teams.sort.name` `page.directory.teams.col.channels` `page.directory.teams.sort.created` `page.directory.teams.pagination` `page.directory.teams.row` `page.directory.teams.empty` `page.directory.teams.error` `page.directory.teams.not-authorized`

**page.home**（14）： `page.home.customize` `page.home.add-users` `page.home.create-channel` `page.home.open-directory` `page.home.mobile.google` `page.home.mobile.apple` `page.home.desktop.windows` `page.home.desktop.linux` `page.home.desktop.mac` `page.home.docs` `page.home.custom.body` `page.home.custom.edit-layout` `page.home.custom.visibility` `page.home.custom.only`

**page.admin.workspace**（9）： `page.admin.workspace.download-info` `page.admin.workspace.refresh` `page.admin.workspace.register` `page.admin.workspace.register.token` `page.admin.workspace.register.intent` `page.admin.workspace.sync` `page.admin.workspace.update` `page.admin.workspace.manage-subscription` `page.admin.workspace.instances`

**page.admin.subscription**（8）： `page.admin.subscription.sync` `page.admin.subscription.checkout` `page.admin.subscription.cancel` `page.admin.subscription.license-text` `page.admin.subscription.apply` `page.admin.subscription.upload` `page.admin.subscription.remove` `page.admin.subscription.copy-url`

**page.admin.engagement**（19）： `page.admin.engagement.timezone` `page.admin.engagement.tab.users` `page.admin.engagement.tab.messages` `page.admin.engagement.tab.channels` `page.admin.engagement.users.new.period` `page.admin.engagement.users.new.download` `page.admin.engagement.users.active.download` `page.admin.engagement.users.tod.period` `page.admin.engagement.users.tod.download` `page.admin.engagement.users.busiest.period` `page.admin.engagement.users.busiest.prev` `page.admin.engagement.users.busiest.next` `page.admin.engagement.messages.sent.period` `page.admin.engagement.messages.sent.download` `page.admin.engagement.messages.channel.period` `page.admin.engagement.messages.channel.download` `page.admin.engagement.channels.period` `page.admin.engagement.channels.download` `page.admin.engagement.channels.pagination`

**page.admin.moderation**（11）： `page.admin.moderation.tab.messages` `page.admin.moderation.tab.users` `page.admin.moderation.row` `page.admin.moderation.see-messages` `page.admin.moderation.dismiss-user` `page.admin.moderation.delete-all-messages` `page.admin.moderation.deactivate` `page.admin.moderation.reset-avatar` `page.admin.moderation.dismiss-reports` `page.admin.moderation.goto-message` `page.admin.moderation.delete-message`

**page.admin.rooms**（21）： `page.admin.rooms.search` `page.admin.rooms.filter.type` `page.admin.rooms.sort` `page.admin.rooms.pagination` `page.admin.rooms.row` `page.admin.rooms.edit.avatar` `page.admin.rooms.edit.name` `page.admin.rooms.edit.owner` `page.admin.rooms.edit.description` `page.admin.rooms.edit.announcement` `page.admin.rooms.edit.topic` `page.admin.rooms.edit.private` `page.admin.rooms.edit.readonly` `page.admin.rooms.edit.react-when-readonly` `page.admin.rooms.edit.archived` `page.admin.rooms.edit.default` `page.admin.rooms.edit.favorite` `page.admin.rooms.edit.featured` `page.admin.rooms.edit.reset` `page.admin.rooms.edit.save` `page.admin.rooms.edit.delete`

**page.admin.users**（42）： `page.admin.users.tab.all` `page.admin.users.tab.pending` `page.admin.users.tab.active` `page.admin.users.tab.deactivated` `page.admin.users.search` `page.admin.users.filter.role` `page.admin.users.sort` `page.admin.users.pagination` `page.admin.users.invite` `page.admin.users.invite.emails` `page.admin.users.invite.send` `page.admin.users.invite.setup-smtp` `page.admin.users.new` `page.admin.users.seats` `page.admin.users.row` `page.admin.users.form.avatar` `page.admin.users.form.email` `page.admin.users.form.verified` `page.admin.users.form.name` `page.admin.users.form.username` `page.admin.users.form.voip-extension` `page.admin.users.form.set-random-pwd` `page.admin.users.form.set-manual-pwd` `page.admin.users.form.require-change` `page.admin.users.form.password` `page.admin.users.form.password-confirm` `page.admin.users.form.roles` `page.admin.users.form.join-default` `page.admin.users.form.send-welcome` `page.admin.users.form.show-additional` `page.admin.users.form.status-text` `page.admin.users.form.bio` `page.admin.users.form.nickname` `page.admin.users.form.custom-fields` `page.admin.users.form.save` `page.admin.users.action.dm` `page.admin.users.action.edit` `page.admin.users.action.admin` `page.admin.users.action.deactivate` `page.admin.users.action.reset-e2e` `page.admin.users.action.reset-totp` `page.admin.users.action.delete`

**page.admin.ai-center**（5）： `page.admin.ai-center.view-options` `page.admin.ai-center.search` `page.admin.ai-center.llm` `page.admin.ai-center.mcp` `page.admin.ai-center.section.save`

**page.admin.invites**（3）： `page.admin.invites.list` `page.admin.invites.remove` `page.admin.invites.reload`

**page.admin.user-status**（8）： `page.admin.user-status.new` `page.admin.user-status.presence-service` `page.admin.user-status.row` `page.admin.user-status.name` `page.admin.user-status.type` `page.admin.user-status.cancel` `page.admin.user-status.save` `page.admin.user-status.delete`

**page.admin.permissions**（18）： `page.admin.permissions.tab.permissions` `page.admin.permissions.tab.settings` `page.admin.permissions.search` `page.admin.permissions.toggle` `page.admin.permissions.pagination` `page.admin.permissions.role.new` `page.admin.permissions.role.name` `page.admin.permissions.role.description` `page.admin.permissions.role.scope` `page.admin.permissions.role.mandatory-2fa` `page.admin.permissions.role.save` `page.admin.permissions.role.delete` `page.admin.permissions.users-in-role` `page.admin.permissions.users-in-role.room` `page.admin.permissions.users-in-role.users` `page.admin.permissions.users-in-role.add` `page.admin.permissions.users-in-role.remove` `page.admin.permissions.users-in-role.pagination`

**page.admin.abac**（40）： `page.admin.abac.sync-ldap` `page.admin.abac.learn-more` `page.admin.abac.tab.settings` `page.admin.abac.tab.attributes` `page.admin.abac.tab.rooms` `page.admin.abac.tab.logs` `page.admin.abac.setting.enabled` `page.admin.abac.setting.pdp-type` `page.admin.abac.setting.attribute-store` `page.admin.abac.setting.show-in-rooms` `page.admin.abac.setting.banners-enabled` `page.admin.abac.setting.banners-config` `page.admin.abac.setting.cache-seconds` `page.admin.abac.setting.virtru-url` `page.admin.abac.setting.virtru-client-id` `page.admin.abac.setting.virtru-secret` `page.admin.abac.setting.virtru-oidc` `page.admin.abac.setting.virtru-entity-key` `page.admin.abac.setting.virtru-namespace` `page.admin.abac.setting.virtru-sync` `page.admin.abac.setting.test-virtru` `page.admin.abac.setting.save` `page.admin.abac.attr.search` `page.admin.abac.attr.new` `page.admin.abac.attr.pagination` `page.admin.abac.attr.name` `page.admin.abac.attr.value` `page.admin.abac.attr.remove-value` `page.admin.abac.attr.save` `page.admin.abac.attr.delete` `page.admin.abac.rooms.search` `page.admin.abac.rooms.filter` `page.admin.abac.rooms.add` `page.admin.abac.rooms.pagination` `page.admin.abac.rooms.room` `page.admin.abac.rooms.attr-key` `page.admin.abac.rooms.attr-values` `page.admin.abac.rooms.add-attr` `page.admin.abac.rooms.save` `page.admin.abac.rooms.remove`

**page.admin.devices**（8）： `page.admin.devices.search` `page.admin.devices.sort.client` `page.admin.devices.sort.os` `page.admin.devices.sort.user` `page.admin.devices.sort.login` `page.admin.devices.pagination` `page.admin.devices.row` `page.admin.devices.logout`

**page.admin.email-inbox**（23）： `page.admin.email-inbox.new` `page.admin.email-inbox.row` `page.admin.email-inbox.active` `page.admin.email-inbox.name` `page.admin.email-inbox.email` `page.admin.email-inbox.description` `page.admin.email-inbox.sender-info` `page.admin.email-inbox.department` `page.admin.email-inbox.smtp-server` `page.admin.email-inbox.smtp-port` `page.admin.email-inbox.smtp-username` `page.admin.email-inbox.smtp-password` `page.admin.email-inbox.smtp-secure` `page.admin.email-inbox.imap-server` `page.admin.email-inbox.imap-port` `page.admin.email-inbox.imap-username` `page.admin.email-inbox.imap-password` `page.admin.email-inbox.imap-retries` `page.admin.email-inbox.imap-secure` `page.admin.email-inbox.cancel` `page.admin.email-inbox.save` `page.admin.email-inbox.delete` `page.admin.email-inbox.send-test`

**page.admin.mailer**（7）： `page.admin.mailer.from` `page.admin.mailer.dry-run` `page.admin.mailer.query` `page.admin.mailer.subject` `page.admin.mailer.body` `page.admin.mailer.cancel` `page.admin.mailer.send`

**page.admin.oauth-apps**（8）： `page.admin.oauth-apps.new` `page.admin.oauth-apps.row` `page.admin.oauth-apps.active` `page.admin.oauth-apps.name` `page.admin.oauth-apps.redirect-uri` `page.admin.oauth-apps.cancel` `page.admin.oauth-apps.save` `page.admin.oauth-apps.delete`

**page.admin.integrations**（55）： `page.admin.integrations.new` `page.admin.integrations.tab.all` `page.admin.integrations.tab.incoming` `page.admin.integrations.tab.outgoing` `page.admin.integrations.tab.zapier` `page.admin.integrations.tab.bots` `page.admin.integrations.search` `page.admin.integrations.sort` `page.admin.integrations.pagination` `page.admin.integrations.row` `page.admin.integrations.incoming.enabled` `page.admin.integrations.incoming.name` `page.admin.integrations.incoming.channel` `page.admin.integrations.incoming.username` `page.admin.integrations.incoming.alias` `page.admin.integrations.incoming.avatar` `page.admin.integrations.incoming.emoji` `page.admin.integrations.incoming.override-channel` `page.admin.integrations.incoming.script-enabled` `page.admin.integrations.incoming.script-engine` `page.admin.integrations.incoming.script` `page.admin.integrations.incoming.copy-url` `page.admin.integrations.incoming.copy-token` `page.admin.integrations.incoming.copy-curl` `page.admin.integrations.incoming.cancel` `page.admin.integrations.incoming.save` `page.admin.integrations.incoming.delete` `page.admin.integrations.outgoing.event` `page.admin.integrations.outgoing.enabled` `page.admin.integrations.outgoing.name` `page.admin.integrations.outgoing.channel` `page.admin.integrations.outgoing.trigger-words` `page.admin.integrations.outgoing.target-room` `page.admin.integrations.outgoing.urls` `page.admin.integrations.outgoing.impersonate` `page.admin.integrations.outgoing.username` `page.admin.integrations.outgoing.alias` `page.admin.integrations.outgoing.avatar` `page.admin.integrations.outgoing.emoji` `page.admin.integrations.outgoing.token` `page.admin.integrations.outgoing.script-enabled` `page.admin.integrations.outgoing.script-engine` `page.admin.integrations.outgoing.script` `page.admin.integrations.outgoing.retry-failed` `page.admin.integrations.outgoing.retry-count` `page.admin.integrations.outgoing.retry-delay` `page.admin.integrations.outgoing.trigger-anywhere` `page.admin.integrations.outgoing.run-on-edits` `page.admin.integrations.outgoing.cancel` `page.admin.integrations.outgoing.save` `page.admin.integrations.outgoing.delete` `page.admin.integrations.outgoing.history` `page.admin.integrations.outgoing.history.clear` `page.admin.integrations.outgoing.history.replay` `page.admin.integrations.outgoing.history.pagination`

**page.admin.import**（25）： `page.admin.import.new` `page.admin.import.download-files` `page.admin.import.download-avatars` `page.admin.import.history.row` `page.admin.import.type` `page.admin.import.file-type` `page.admin.import.file` `page.admin.import.url` `page.admin.import.path` `page.admin.import.start-upload` `page.admin.import.prepare.tab.users` `page.admin.import.prepare.tab.contacts` `page.admin.import.prepare.tab.channels` `page.admin.import.prepare.tab.messages` `page.admin.import.prepare.users.select-all` `page.admin.import.prepare.users.toggle` `page.admin.import.prepare.users.pagination` `page.admin.import.prepare.channels.select-all` `page.admin.import.prepare.channels.toggle` `page.admin.import.prepare.channels.pagination` `page.admin.import.prepare.contacts.select-all` `page.admin.import.prepare.contacts.toggle` `page.admin.import.prepare.contacts.pagination` `page.admin.import.prepare.start` `page.admin.import.progress`

**page.admin.reports**（2）： `page.admin.reports.docs` `page.admin.reports.view-json`

**page.admin.sounds**（10）： `page.admin.sounds.search` `page.admin.sounds.sort` `page.admin.sounds.pagination` `page.admin.sounds.new` `page.admin.sounds.row` `page.admin.sounds.name` `page.admin.sounds.file` `page.admin.sounds.cancel` `page.admin.sounds.save` `page.admin.sounds.delete`

**page.admin.emoji**（8）： `page.admin.emoji.new` `page.admin.emoji.row` `page.admin.emoji.name` `page.admin.emoji.aliases` `page.admin.emoji.file` `page.admin.emoji.cancel` `page.admin.emoji.save` `page.admin.emoji.delete`

**page.admin.feature-preview**（5）： `page.admin.feature-preview.allow` `page.admin.feature-preview.secondary-sidebar` `page.admin.feature-preview.ai-search` `page.admin.feature-preview.cancel` `page.admin.feature-preview.save`

**page.admin.settings**（53）： `page.admin.settings.search` `page.admin.settings.open.accounts` `page.admin.settings.open.analytics` `page.admin.settings.open.assets` `page.admin.settings.open.atlassian-crowd` `page.admin.settings.open.bots` `page.admin.settings.open.cas` `page.admin.settings.open.custom-sounds-fs` `page.admin.settings.open.discussion` `page.admin.settings.open.email` `page.admin.settings.open.emoji-custom-fs` `page.admin.settings.open.e2e` `page.admin.settings.open.enterprise` `page.admin.settings.open.federation` `page.admin.settings.open.fileupload` `page.admin.settings.open.general` `page.admin.settings.open.irc` `page.admin.settings.open.ldap` `page.admin.settings.open.layout` `page.admin.settings.open.logs` `page.admin.settings.open.message` `page.admin.settings.open.meta` `page.admin.settings.open.mobile` `page.admin.settings.open.oauth` `page.admin.settings.open.omnichannel` `page.admin.settings.open.outlook` `page.admin.settings.open.push` `page.admin.settings.open.rate-limiter` `page.admin.settings.open.retention` `page.admin.settings.open.saml` `page.admin.settings.open.sms` `page.admin.settings.open.search` `page.admin.settings.open.setup-wizard` `page.admin.settings.open.slackbridge` `page.admin.settings.open.smarsh` `page.admin.settings.open.threads` `page.admin.settings.open.troubleshoot` `page.admin.settings.open.user-data-download` `page.admin.settings.open.video-conference` `page.admin.settings.open.voip` `page.admin.settings.open.webdav` `page.admin.settings.open.device-management` `page.admin.settings.save` `page.admin.settings.cancel` `page.admin.settings.reset-setting` `page.admin.settings.ldap.test-connection` `page.admin.settings.ldap.test-search` `page.admin.settings.ldap.sync-now` `page.admin.settings.oauth.refresh` `page.admin.settings.oauth.add-custom` `page.admin.settings.oauth.remove-custom` `page.admin.settings.saml.import-metadata` `page.admin.settings.email.send-test`

**page.account.keyboard**（1）： `page.account.keyboard.display`

**page.audit.messages**（13）： `page.audit.messages.tab.rooms` `page.audit.messages.tab.users` `page.audit.messages.tab.dms` `page.audit.messages.tab.omnichannel` `page.audit.messages.msg` `page.audit.messages.daterange` `page.audit.messages.room` `page.audit.messages.users` `page.audit.messages.dm-users` `page.audit.messages.visitor` `page.audit.messages.agent` `page.audit.messages.apply` `page.audit.messages.export-pdf`

**page.audit.log**（1）： `page.audit.log.daterange`

**page.audit.security**（6）： `page.audit.security.daterange` `page.audit.security.setting` `page.audit.security.clear` `page.audit.security.apply` `page.audit.security.row` `page.audit.security.pagination`

## K. 边界（本册不写）

- 不写消息工具栏 / composer（01、03）
- 不写房间内成员面板、讨论列表、线程面板的房间内控件（02）
- 不拆 Settings.json 的 ~972 个 key（只打开组 + Save + 具名危险动作）
- 不复制 03 的 9 条快捷键绑定（只留 `page.account.keyboard.display`）
- 不写 Marketplace / Apps 管理页内部
- 不写 Omnichannel 管理控制台整棵（除 Account 坐席偏好、Settings 组打开、Audit omnichannel 页签）
- `federationEnabled` 写死 false：不写 Directory External 页签内部
- AI Center / Settings 组内动态 setting 控件不拆行

## L. 相对 02 / 04 的 atlas diff

| 父入口（02/04，本册不复用其 id） | 本册子行 | 状态 |
|---|---|---|
| `nav.create.channel` | `page.create.channel.*` | 全部 NEW |
| `nav.create.team` / `team.create` | `page.create.team.*` | 全部 NEW |
| `nav.create.discussion` | `page.create.discussion.*` | 全部 NEW |
| `nav.create.dm` | `page.create.dm.*` | 全部 NEW |
| `nav.user.account.profile` / `account.profile` | `page.account.profile.*` | 全部 NEW |
| `nav.user.account.preferences` / `account.preferences` | `page.account.preferences.*` | 全部 NEW |
| `account.security` | `page.account.security.*` | 全部 NEW |
| `nav.user.account.accessibility` / `account.accessibility-and-appearance` | `page.account.accessibility.*` | 全部 NEW |
| `nav.user.account.feature-preview` / `account.feature-preview` | `page.account.feature-preview.*` | 全部 NEW |
| `account.integrations` | `page.account.integrations.*` | 全部 NEW |
| `account.tokens` | `page.account.tokens.*` | 全部 NEW |
| `account.omnichannel` | `page.account.omnichannel.*` | 全部 NEW |
| `account.manage-devices` | `page.account.sessions.*` | 全部 NEW |
| `nav.user.keyboard` | `page.account.keyboard.display`（1 行，关联 03） | NEW |
| `nav.pages.directory` / `route.directory` / `directory.*` | `page.directory.*` | 全部 NEW |
| `nav.pages.home` / `route.home` | `page.home.*` | 全部 NEW |
| `route.admin.*`（home + 22 sidebar） | `page.admin.*` | 全部 NEW |
| `route.audit` / `route.audit-log` / `route.security-logs` | `page.audit.*` | 全部 NEW |

无 UNCHANGED 子行（本册首次展开）。无 DROPPED（02/04 入口行仍有效）。
