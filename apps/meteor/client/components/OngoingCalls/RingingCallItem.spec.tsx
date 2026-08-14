import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import RingingCallItem from './RingingCallItem';
import { buildJoinableCall } from '../../views/conference/testFixtures';

const onAccept = jest.fn();
const onReject = jest.fn();
const onSilence = jest.fn();

/** What the manager remembers about rings this client actually heard — the only thing there is to silence. */
let incomingCalls: { callId: string; dismissed: boolean }[] = [];

jest.mock('@rocket.chat/ui-video-conf', () => ({
	...jest.requireActual('@rocket.chat/ui-video-conf'),
	useVideoConfIncomingCalls: () => incomingCalls,
}));

const renderItem = (silenced = false) =>
	render(
		<RingingCallItem
			call={buildJoinableCall({ callId: 'ringing', name: 'Alice', ringingAt: new Date() })}
			silenced={silenced}
			onAccept={onAccept}
			onReject={onReject}
			onSilence={onSilence}
		/>,
		{ wrapper: mockAppRoot().withJohnDoe().withUserPreference('displayAvatars', true).build() },
	);

beforeEach(() => {
	onAccept.mockClear();
	onReject.mockClear();
	onSilence.mockClear();
	incomingCalls = [{ callId: 'ringing', dismissed: false }];
});

// This item replaced a popup that took over the screen: a ringing call can be answered, turned down, or left
// ringing while the user finishes what they were doing.
it('offers an answer and a way out', async () => {
	renderItem();

	await userEvent.click(screen.getByRole('button', { name: 'Accept' }));
	expect(onAccept).toHaveBeenCalledWith('ringing');

	await userEvent.click(screen.getByRole('button', { name: 'Decline' }));
	expect(onReject).toHaveBeenCalledWith('ringing');
});

// Silencing is not answering: the ring stops so the user can decide in their own time, and the call stays.
it('can be silenced while it is still sounding', async () => {
	renderItem();

	await userEvent.click(screen.getByRole('button', { name: 'Silence' }));

	expect(onSilence).toHaveBeenCalledWith('ringing');
	expect(onAccept).not.toHaveBeenCalled();
	expect(onReject).not.toHaveBeenCalled();
});

// Already silenced: the same icon with nothing left to press, which is what says why it went quiet.
it('says it was silenced, without offering to do it again', () => {
	renderItem(true);

	expect(screen.queryByRole('button', { name: 'Silence' })).not.toBeInTheDocument();
	expect(screen.getByTitle('Incoming_call_silenced')).toBeInTheDocument();
});

// While it is still asking, when it started is no use: the corner says that it is ringing now.
it('says it is ringing where the time would be', () => {
	renderItem();

	expect(screen.getByText(/Ringing/)).toBeInTheDocument();
});

// A ring this client never heard — a reload, or a call rung before the page loaded — has no sound to stop, and is
// not something the user silenced either.
it('offers no silence for a ring it never heard', () => {
	incomingCalls = [];

	renderItem();

	expect(screen.queryByRole('button', { name: 'Silence' })).not.toBeInTheDocument();
	expect(screen.queryByTitle('Incoming_call_silenced')).not.toBeInTheDocument();
});
