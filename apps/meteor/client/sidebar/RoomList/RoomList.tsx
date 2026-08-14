import { Box } from '@rocket.chat/fuselage';
import { useResizeObserver } from '@rocket.chat/fuselage-hooks';
import { VirtualizedScrollbars } from '@rocket.chat/ui-client';
import { useUserPreference, useUserId } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { GroupedVirtuoso } from 'react-virtuoso';

import RoomListCollapser from './RoomListCollapser';
import RoomListRow from './RoomListRow';
import RoomListRowWrapper from './RoomListRowWrapper';
import RoomListWrapper from './RoomListWrapper';
import DeclinedCallsToggle from '../../components/OngoingCalls/DeclinedCallsToggle';
import OngoingCallRow from '../../components/OngoingCalls/OngoingCallRow';
import RingingCallItem from '../../components/OngoingCalls/RingingCallItem';
import { isDeclinedCallsToggle, useOngoingCallItems } from '../../components/OngoingCalls/useOngoingCalls';
import { useOpenedRoom } from '../../lib/RoomManager';
import { useAvatarTemplate } from '../hooks/useAvatarTemplate';
import { useCollapsedGroups } from '../hooks/useCollapsedGroups';
import { usePreventDefault } from '../hooks/usePreventDefault';
import { isJoinableCall, isRoomListRoom, useRoomList } from '../hooks/useRoomList';
import { useShortcutOpenMenu } from '../hooks/useShortcutOpenMenu';
import { useTemplateByViewMode } from '../hooks/useTemplateByViewMode';

const RoomList = () => {
	const { t } = useTranslation();
	const userId = useUserId();
	const isAnonymous = !userId;

	const { collapsedGroups, handleClick, handleKeyDown } = useCollapsedGroups();

	// The calls are a group of this list rather than a card above it, so they collapse, scroll and order with
	// everything else. Ringing first, since those are the ones asking something.
	const { ringing, items: calls, showDeclined, toggleDeclined, joinCall, decline, silence, silencedCalls } = useOngoingCallItems();
	const isRinging = useMemo(() => new Set(ringing.map(({ callId }) => callId)), [ringing]);

	const { groupsCount, groupsList, roomList, groupedUnreadInfo } = useRoomList({ collapsedGroups, calls });
	const avatarTemplate = useAvatarTemplate();
	const sideBarItemTemplate = useTemplateByViewMode();
	const { ref } = useResizeObserver<HTMLElement>({ debounceDelay: 100 });
	const openedRoom = useOpenedRoom() ?? '';
	const sidebarViewMode = useUserPreference<'extended' | 'medium' | 'condensed'>('sidebarViewMode') || 'extended';

	const extended = sidebarViewMode === 'extended';
	const itemData = useMemo(
		() => ({
			extended,
			t,
			SidebarItemTemplate: sideBarItemTemplate,
			AvatarTemplate: avatarTemplate,
			openedRoom,
			sidebarViewMode,
			isAnonymous,
			userId,
		}),
		[avatarTemplate, extended, isAnonymous, openedRoom, sideBarItemTemplate, sidebarViewMode, t, userId],
	);

	usePreventDefault(ref);
	useShortcutOpenMenu(ref);

	return (
		<Box position='relative' overflow='hidden' height='full' ref={ref}>
			<VirtualizedScrollbars>
				<GroupedVirtuoso
					groupCounts={groupsCount}
					groupContent={(index) => (
						<RoomListCollapser
							collapsedGroups={collapsedGroups}
							onClick={() => handleClick(groupsList[index])}
							onKeyDown={(e) => handleKeyDown(e, groupsList[index])}
							groupTitle={groupsList[index]}
							unreadCount={groupedUnreadInfo[index]}
						/>
					)}
					{...(roomList.length > 0 && {
						itemContent: (index) => {
							const item = roomList[index];

							if (!item) {
								return null;
							}

							if (isDeclinedCallsToggle(item)) {
								return <DeclinedCallsToggle count={item.declinedCount} expanded={showDeclined} onToggle={toggleDeclined} />;
							}

							if (isJoinableCall(item)) {
								return isRinging.has(item.callId) ? (
									<RingingCallItem
										call={item}
										silenced={silencedCalls.includes(item.callId)}
										onAccept={joinCall}
										onReject={decline}
										onSilence={silence}
									/>
								) : (
									<OngoingCallRow call={item} onJoin={joinCall} {...(!item.declined && { onDecline: decline })} />
								);
							}

							return isRoomListRoom(item) ? <RoomListRow data={itemData} item={item} /> : null;
						},
					})}
					components={{ Item: RoomListRowWrapper, List: RoomListWrapper }}
				/>
			</VirtualizedScrollbars>
		</Box>
	);
};

export default RoomList;
