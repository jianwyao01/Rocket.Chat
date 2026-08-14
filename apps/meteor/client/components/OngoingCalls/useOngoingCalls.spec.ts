import type { JoinableVideoConference } from '@rocket.chat/core-typings';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { renderHook, waitFor } from '@testing-library/react';

import { useOngoingCallsList } from './useOngoingCalls';
import { buildJoinableCall } from '../../views/conference/testFixtures';

const renderList = (calls: JoinableVideoConference[]) =>
	renderHook(() => useOngoingCallsList(), {
		wrapper: mockAppRoot()
			.withJohnDoe()
			.withEndpoint('GET', '/v1/video-conference.joinable', () => ({ calls, success: true }) as any)
			.build(),
	});

// The three states a call can be in for this list, and each belongs somewhere different: one is asking, one is
// simply there, and one was turned down and waits under the rest.
it('splits the calls into ringing, running and declined', async () => {
	const { result } = renderList([
		buildJoinableCall({ callId: 'ringing', ringingAt: new Date() }),
		buildJoinableCall({ callId: 'running' }),
		buildJoinableCall({ callId: 'refused', declined: true }),
	]);

	await waitFor(() => expect(result.current.ongoing).toHaveLength(1));

	expect(result.current.ringing.map(({ callId }) => callId)).toEqual(['ringing']);
	expect(result.current.ongoing.map(({ callId }) => callId)).toEqual(['running']);
	expect(result.current.declined.map(({ callId }) => callId)).toEqual(['refused']);
});

// Declining quiets a call rather than losing it: it leaves the list proper, and the way back to it is the toggle
// under the group rather than a trip to the call history.
it('keeps a declined call out of the list proper', async () => {
	const { result } = renderList([buildJoinableCall({ callId: 'refused', declined: true })]);

	await waitFor(() => expect(result.current.declined).toHaveLength(1));

	expect(result.current.ringing).toHaveLength(0);
	expect(result.current.ongoing).toHaveLength(0);
});

// A call the reader is already in is not something to reach — they are in it, and there is nothing to offer.
it('leaves out the call the reader is already in', async () => {
	const { result } = renderList([buildJoinableCall({ callId: 'here', joined: true }), buildJoinableCall({ callId: 'elsewhere' })]);

	await waitFor(() => expect(result.current.ongoing).toHaveLength(1));

	expect(result.current.ongoing.map(({ callId }) => callId)).toEqual(['elsewhere']);
	expect(result.current.declined).toHaveLength(0);
});
