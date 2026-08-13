import type { JoinableVideoConference } from '@rocket.chat/core-typings';
import { Box, Icon } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import CallParticipants from '../CallParticipants';

type CallSummaryProps = {
	call: JoinableVideoConference;
	/** Ringing calls say so in red; the rest are just calls. */
	ringing?: boolean;
	/** Anything that belongs on the same line as the name, at the inline end. */
	children?: ReactNode;
};

/**
 * What a call in the list says about itself: that it is a conference, what it is called, and who is in it.
 *
 * Shared by the ringing item and the ordinary row, because that much is the same for both — what differs is what
 * they offer, and a ringing call gets its actions on a line of their own.
 */
const CallSummary = ({ call, ringing, children }: CallSummaryProps) => {
	const { t } = useTranslation();

	return (
		<Box display='flex' alignItems='center' style={{ gap: 8 }}>
			<Icon name='video' size='x20' color={ringing ? 'status-font-on-danger' : undefined} />
			<Box minWidth={0} flexGrow={1}>
				<Box fontScale='p2b' color='default' withTruncatedText>
					{call.name}
				</Box>
				{/* Named as well as shown: under a call's title, a bare row of faces is a row of faces of nobody in
				    particular until you know it is the people already in there. */}
				<Box display='flex' alignItems='center' style={{ gap: 4 }}>
					<Box fontScale='micro' color='hint' flexShrink={0}>
						{t('Participants')}
					</Box>
					<CallParticipants people={call.participants} total={call.usersCount} />
				</Box>
			</Box>
			{children}
		</Box>
	);
};

export default CallSummary;
