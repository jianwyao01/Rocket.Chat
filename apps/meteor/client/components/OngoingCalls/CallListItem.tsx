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
 * The row itself does nothing when clicked: what a call offers is on the buttons, and a whole row that joins a call
 * is a large target for something the reader may not have meant. A ringing call is this same row — what says it is
 * ringing is the green phone on it, not a colour behind it.
 */
const CallListItem = ({ call, timeLabel, actions }: CallListItemProps) => (
	<Extended
		// The item renders as an anchor, so a click on it is a navigation waiting to happen. Nothing here navigates:
		// what a call offers is on the buttons, and the row itself is only a description.
		onClick={(event) => event.preventDefault()}
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
