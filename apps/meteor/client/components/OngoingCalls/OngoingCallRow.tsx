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
 * Opening it is the offer — the row itself, or the button on it — and it opens the call *window*, on the preflight
 * where the call is described and the devices are chosen. Turning the call down is the way to be rid of the row,
 * which is a smaller thing and reads as one; a call the reader is already in has nothing to turn down, and keeps
 * only the way back into it.
 */
const OngoingCallRow = ({ call, onJoin, onDecline }: OngoingCallRowProps) => {
	const { t } = useTranslation();

	return (
		<CallListItem
			call={call}
			onOpen={() => onJoin(call.callId)}
			actions={
				<>
					{/* A window rather than a tick, and *details* rather than *join*: this opens the call window on its
					    preflight, where the call is described and the devices are chosen. Nothing about pressing it puts
					    the reader in the call. */}
					<IconButton
						mini
						secondary
						icon='new-window'
						title={t('See_call_details')}
						aria-label={t('See_call_details')}
						onClick={() => onJoin(call.callId)}
					/>
					{onDecline && (
						<IconButton mini secondary icon='cross' title={t('Decline')} aria-label={t('Decline')} onClick={() => onDecline(call.callId)} />
					)}
				</>
			}
		/>
	);
};

export default OngoingCallRow;
