import type { JoinableVideoConference } from '@rocket.chat/core-typings';
import { Box, Icon, IconButton } from '@rocket.chat/fuselage';
import { useVideoConfIncomingCalls } from '@rocket.chat/ui-video-conf';
import { useTranslation } from 'react-i18next';

import CallListItem from './CallListItem';
import { fakeIncomingCalls, fakeOngoingCallsEnabled } from './fakeOngoingCalls';

type RingingCallItemProps = {
	call: JoinableVideoConference;
	/** Whether the user already stopped the sound for this one. */
	silenced: boolean;
	onAccept: (callId: string) => void;
	onReject: (callId: string) => void;
	onSilence: (callId: string) => void;
};

/**
 * A call that is ringing *now*, at the top of the Ongoing calls group.
 *
 * This replaces the popup that used to take over the screen for an incoming call. A popup demanded an answer before
 * anything else could happen; a row in a list can be answered, turned down, or left ringing while the user finishes
 * a sentence — and it is in the same place as every other call, so there is one place to look.
 *
 * The same row as a running call, with a green phone in place of the tick and a third action: a ring can be stopped
 * without being answered, which is the one thing a running call has no need for.
 */
const RingingCallItem = ({ call, silenced, onAccept, onReject, onSilence }: RingingCallItemProps) => {
	const { t } = useTranslation();

	// Only offer to stop a sound that is playing: a ring this client never heard — a reload, or a call rung before
	// the page loaded — has nothing to silence, and is not something the user silenced either.
	const incomingCalls = useVideoConfIncomingCalls();
	// Layout scaffolding, off unless `localStorage.rcFakeOngoingCalls === '1'` — a fake ring was never heard by the
	// manager, so without this its mute button is the one part of the row that cannot be looked at.
	const heard = fakeOngoingCallsEnabled() ? [...incomingCalls, ...fakeIncomingCalls()] : incomingCalls;
	const heardHere = heard.some(({ callId, dismissed }) => callId === call.callId && !dismissed);
	const audible = heardHere && !silenced;

	return (
		<CallListItem
			call={call}
			// When it started is no use while it is still asking: what the corner has to say is that it is ringing
			// *now*, in the blue that marks it as live rather than as history.
			timeLabel={
				<Box is='span' color='info'>
					{t('Ringing')}…
				</Box>
			}
			// The way to make it stop asking comes first, then the answer to it, then the way out of it.
			actions={
				<>
					{audible && (
						<IconButton
							mini
							secondary
							icon='bell-off'
							title={t('Silence')}
							aria-label={t('Silence')}
							onClick={() => onSilence(call.callId)}
						/>
					)}
					{/* Silenced: the same icon, with nothing left to press — it says why it went quiet. */}
					{silenced && <Icon name='bell-off' size='x16' title={t('Incoming_call_silenced')} />}
					{/* A phone rather than a tick, and green: answering a ringing call is a different act from walking
					    into one that is simply running. */}
					<IconButton
						mini
						secondary
						success
						icon='phone'
						title={t('Accept')}
						aria-label={t('Accept')}
						onClick={() => onAccept(call.callId)}
					/>
					<IconButton mini secondary icon='cross' title={t('Decline')} aria-label={t('Decline')} onClick={() => onReject(call.callId)} />
				</>
			}
		/>
	);
};

export default RingingCallItem;
