import type { JoinableVideoConference } from '@rocket.chat/core-typings';
import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

import CallParticipants from '../CallParticipants';

type CallSummaryProps = {
	call: JoinableVideoConference;
	/** Ringing calls say so in red; the rest are just calls. */
	ringing?: boolean;
	/** What to offer about the call — at the end of the second line, opposite the faces. */
	children?: ReactNode;
};

/**
 * What a call in the list says about itself: what it is called, who is in it, and what can be done about it.
 *
 * Two lines, because the name is what identifies a call and it was the thing being squeezed: with the actions
 * beside it, a name like "Meeting in \"20 August planning\"" had a third of the row to say itself in and was
 * truncated to nothing useful. It now has the line to itself, and the second line carries the faces from the start
 * and the actions from the end — neither of which needs the width the name does.
 *
 * Shared by the ringing item and the ordinary row, because that much is the same for both. A ringing call is red
 * rather than iconned: it is one line of difference, and the sidebar has no room to spend on decoration.
 */
const CallSummary = ({ call, ringing, children }: CallSummaryProps) => (
	<Box display='flex' flexDirection='column' minWidth={0}>
		<Box fontScale='p2b' color={ringing ? 'danger' : 'default'} withTruncatedText>
			{call.name}
		</Box>
		<Box display='flex' alignItems='center' justifyContent='space-between' style={{ gap: 8 }}>
			<CallParticipants people={call.participants} total={call.usersCount} />
			{children}
		</Box>
	</Box>
);

export default CallSummary;
