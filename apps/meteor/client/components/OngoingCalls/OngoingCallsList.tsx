import { isRingingVideoConferenceMember } from '@rocket.chat/core-typings';
import { Box } from '@rocket.chat/fuselage';

import DeclinedCallsToggle from './DeclinedCallsToggle';
import OngoingCallRow from './OngoingCallRow';
import RingingCallItem from './RingingCallItem';
import { isDeclinedCallsToggle, useOngoingCallItems } from './useOngoingCalls';

/**
 * The calls as a plain list, for somewhere that isn't the sidebar's own.
 *
 * The sidebar renders these rows itself, one at a time, because its list is virtualised and they are a group of it.
 * A dropdown has no such machinery and wants the whole thing at once — so this walks the same items, in the same
 * order, through the same rows. What differs between the two places is only how the rows are handed over.
 */
const OngoingCallsList = () => {
	const { items, showDeclined, toggleDeclined, joinCall, decline, silence, silencedCalls } = useOngoingCallItems();

	return (
		<Box display='flex' flexDirection='column'>
			{items.map((item) => {
				if (isDeclinedCallsToggle(item)) {
					return <DeclinedCallsToggle key='declined-toggle' count={item.declinedCount} expanded={showDeclined} onToggle={toggleDeclined} />;
				}

				if (isRingingVideoConferenceMember({ ringingAt: item.ringingAt })) {
					return (
						<RingingCallItem
							key={item.callId}
							call={item}
							silenced={silencedCalls.includes(item.callId)}
							onAccept={joinCall}
							onReject={decline}
							onSilence={silence}
						/>
					);
				}

				return <OngoingCallRow key={item.callId} call={item} onJoin={joinCall} {...(!item.declined && { onDecline: decline })} />;
			})}
		</Box>
	);
};

export default OngoingCallsList;
