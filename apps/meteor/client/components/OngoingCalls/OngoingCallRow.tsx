import type { JoinableVideoConference } from '@rocket.chat/core-typings';
import { IconButton } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

import CallListItem from './CallListItem';

type OngoingCallRowProps = {
	call: JoinableVideoConference;
	onJoin: (callId: string) => void;
	/** Absent for a call that was already turned down: there is nothing left to turn down. */
	onDecline?: (callId: string) => void;
};

/**
 * A call that is simply running, as a row of the sidebar's list.
 *
 * Every row is something to act on — the group leaves out the call the reader is already in, so there is no state
 * here that offers nothing to do. Joining is the offer; turning the call down is the way to be rid of the row,
 * which is a smaller thing and reads as one.
 */
const OngoingCallRow = ({ call, onJoin, onDecline }: OngoingCallRowProps) => {
	const { t } = useTranslation();

	return (
		<CallListItem
			call={call}
			actions={
				<>
					<IconButton mini secondary icon='check' title={t('Join')} aria-label={t('Join')} onClick={() => onJoin(call.callId)} />
					{onDecline && (
						<IconButton mini secondary icon='cross' title={t('Decline')} aria-label={t('Decline')} onClick={() => onDecline(call.callId)} />
					)}
				</>
			}
		/>
	);
};

export default OngoingCallRow;
