import type { JoinableVideoConference } from '@rocket.chat/core-typings';
import { Icon } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

import { CALL_FACES_SHOWN } from '../../../lib/videoConference/constants';
import Extended from '../../sidebar/Item/Extended';
import CallParticipants from '../CallParticipants';

type CallListItemProps = {
	call: JoinableVideoConference;
	/** Said where the time would be, when a call has something more useful to put there than when it started. */
	timeLabel?: ReactNode;
	/** What to offer about it, as icon buttons on the second line. */
	actions: ReactNode;
	/** What clicking the row does: open the call window on its preflight, the same as the row's own button. */
	onOpen: () => void;
};

/**
 * A call as a row of the sidebar's list — the room item's own component, with a call's things in its slots.
 *
 * Reusing `Extended` rather than arranging a row of our own is what keeps a call proportional to the channels under
 * it: the same title tokens, the same timestamp in the same corner, the same insets, the same second line for
 * whatever else the row has to say. What a call puts in those slots is a camera in front of the name, when the call
 * started, and the faces of whoever is already in it.
 *
 * **No avatar, ever.** A call has no one face to show — its faces are on the second line, all of them — and the
 * avatar column would indent every call by an avatar's width to say nothing.
 *
 * Clicking the row opens the call window on its preflight — the same thing the row's own button does, and the same
 * bargain the rooms under it offer, where clicking a row opens what it describes. It is deliberately *not* a join:
 * the preflight describes the call and chooses the devices, so a mis-click costs a window rather than putting
 * someone into a call with their camera on. A ringing call is this same row — what says it is ringing is the green
 * phone on it, not a colour behind it.
 */
const CallListItem = ({ call, timeLabel, actions, onOpen }: CallListItemProps) => (
	<Extended
		// The item renders as an anchor, and there is no href to navigate to: the call window is opened by hand.
		//
		// A press on one of the row's own buttons is not a press on the row. The buttons sit inside it, so their
		// clicks arrive here too, and without this declining a call also opened it. Asked of the event rather than
		// stopped at each button, so a button added later cannot forget to do it — and without a wrapper element,
		// which is what last broke the buttons' own layout.
		onClick={(event) => {
			event.preventDefault();

			if ((event.target as HTMLElement).closest('button')) {
				return;
			}

			onOpen();
		}}
		icon={<Icon name='video' size='x16' />}
		title={call.name}
		time={call.createdAt}
		timeLabel={timeLabel}
		// Sliced here as well as on the server: what a row has space for is this component's business, and a payload
		// from an older server — or a fake one — should not be able to widen it.
		subtitle={<CallParticipants people={call.participants.slice(0, CALL_FACES_SHOWN)} total={call.usersCount} />}
		// Handed over bare, so they sit side by side in the item's own row. Wrapped in anything of their own
		// they stack, since a plain box is not a flex row.
		actions={actions}
	/>
);

export default CallListItem;
