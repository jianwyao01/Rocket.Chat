import type { JoinableVideoConference } from '@rocket.chat/core-typings';
import { isRingingVideoConferenceMember } from '@rocket.chat/core-typings';
import { useEndpoint, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useVideoConfDismissCall } from '@rocket.chat/ui-video-conf';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo, useState } from 'react';

import { fakeOngoingCalls, fakeOngoingCallsEnabled } from './fakeOngoingCalls';
import { useRingingExpiry } from '../../hooks/useRingingExpiry';
import { videoConferenceQueryKeys } from '../../lib/queryKeys';
import { useJoinCall } from '../../views/conference/hooks/useJoinCall';
import { useJoinableCalls } from '../../views/conference/hooks/useJoinableCalls';

/**
 * The calls worth offering the user, split into the ones asking something of them and the ones simply running.
 *
 * A call ringing now is being asked of the user; the rest are there to be joined. Both lists are freshest first.
 *
 * Separate from the actions below because the sidebar's card only needs to know whether there is anything to
 * make room for, and how much is ringing. Wiring up a decline and a silence list to answer that gave it a
 * second, unused copy of both.
 */
export const useOngoingCallsList = () => {
	const { calls: realCalls } = useJoinableCalls();

	// Layout scaffolding, off unless `localStorage.rcFakeOngoingCalls === '1'`. See `fakeOngoingCalls`, which is
	// meant to be deleted along with these two lines.
	const calls = useMemo(() => (fakeOngoingCallsEnabled() ? [...fakeOngoingCalls(), ...realCalls] : realCalls), [realCalls]);

	// A call the reader is already in is not something to reach — they are in it.
	const reachable = useMemo(() => calls.filter((call) => !call.joined), [calls]);

	const { ringing, ongoing, declined } = useMemo(() => {
		const isRinging = (call: JoinableVideoConference) => isRingingVideoConferenceMember({ ringingAt: call.ringingAt });

		// Declining quiets a call rather than losing it: it drops out of the list proper and waits under it, so
		// turning one down by accident is not the end of the road back to it.
		const asked = reachable.filter((call) => !call.declined);

		return {
			ringing: asked.filter(isRinging),
			ongoing: asked.filter((call) => !isRinging(call)),
			declined: reachable.filter((call) => call.declined),
		};
	}, [reachable]);

	// So a call whose ring lapses settles into an ordinary one without waiting for something else to move.
	useRingingExpiry(ringing.map(({ ringingAt }) => ringingAt));

	return { ringing, ongoing, declined };
};

/**
 * The calls, and what can be done with each of them. For whoever actually renders the list.
 */
export const useOngoingCalls = () => {
	const { ringing, ongoing, declined } = useOngoingCallsList();
	const joinCall = useJoinCall();
	const declineCall = useEndpoint('POST', '/v1/video-conference.decline');
	const dispatchToastMessage = useToastMessageDispatch();
	const queryClient = useQueryClient();

	const { mutate: decline } = useMutation({
		mutationFn: (callId: string) => declineCall({ callId }),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: videoConferenceQueryKeys.joinable() }),
		onError: (error) => dispatchToastMessage({ type: 'error', message: error }),
	});

	/**
	 * Silencing is not answering: the ring stops so the user can decide in their own time, and the call stays.
	 *
	 * Remembered here because the manager forgets a dismissed call entirely — and without remembering, a silenced
	 * call would be indistinguishable from one whose ring this client never heard.
	 */
	const dismissCall = useVideoConfDismissCall();
	const [silencedCalls, setSilencedCalls] = useState<string[]>([]);

	const silence = useCallback(
		(callId: string) => {
			dismissCall(callId);
			setSilencedCalls((silenced) => (silenced.includes(callId) ? silenced : [...silenced, callId]));
		},
		[dismissCall],
	);

	return { ringing, ongoing, declined, joinCall, decline, silence, silencedCalls };
};

/** The foot of the list: how many declined calls are waiting under it. Not a call, and not a room. */
export type DeclinedCallsToggleItem = { declinedCount: number };

/** What the list is made of — the calls themselves, and the toggle that reveals the declined ones. */
export type CallGroupItem = JoinableVideoConference | DeclinedCallsToggleItem;

export const isDeclinedCallsToggle = (item: object): item is DeclinedCallsToggleItem => 'declinedCount' in item;

/**
 * The calls in the order they should read, wherever they are shown: ringing first, then the ones simply running,
 * then — behind a toggle at the foot — whatever was turned down.
 *
 * Shared by the sidebar's group and the navbar's dropdown so the two can't drift into different orders or different
 * ideas of what a declined call does. Each caller renders the items its own way; this only says what they are.
 */
export const useOngoingCallItems = () => {
	const { ringing, ongoing, declined, ...actions } = useOngoingCalls();
	const [showDeclined, setShowDeclined] = useState(false);

	const items = useMemo(() => {
		const list: CallGroupItem[] = [...ringing, ...ongoing, ...(showDeclined ? declined : [])];

		if (declined.length) {
			list.push({ declinedCount: declined.length });
		}

		return list;
	}, [ringing, ongoing, declined, showDeclined]);

	const toggleDeclined = useCallback(() => setShowDeclined((shown) => !shown), []);

	return { ...actions, ringing, ongoing, declined, items, showDeclined, toggleDeclined };
};
