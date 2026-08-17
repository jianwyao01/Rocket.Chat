import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import RingingCallItem from './RingingCallItem';
import { buildJoinableCall } from '../../views/conference/testFixtures';

const onAccept = jest.fn();
const onReject = jest.fn();
const onSilence = jest.fn();
const onOpen = jest.fn();

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
			onOpen={onOpen}
		/>,
		{ wrapper: mockAppRoot().withJohnDoe().withUserPreference('displayAvatars', true).build() },
	);

beforeEach(() => {
	onAccept.mockClear();
	onReject.mockClear();
	onSilence.mockClear();
	onOpen.mockClear();
	incomingCalls = [{ callId: 'ringing', dismissed: false }];
});

// This item replaced a popup that took over the screen: a ringing call can be answered, turned down, or left
// ringing while the user finishes what they were doing.
it('offers an answer', async () => {
	renderItem();

	await userEvent.click(screen.getByRole('button', { name: 'Accept' }));

	expect(onAccept).toHaveBeenCalledWith('ringing');
});

// Silencing is not answering: the ring stops so the user can decide in their own time, and the call stays.
//
// While it is sounding, that is the *only* thing on offer besides answering — the press a user reaches for to stop
// the noise must not be the press that ends the call.
it('offers silence rather than decline while it is still sounding', async () => {
	renderItem();

	expect(screen.queryByRole('button', { name: 'Decline' })).not.toBeInTheDocument();

	await userEvent.click(screen.getByRole('button', { name: 'Silence' }));

	expect(onSilence).toHaveBeenCalledWith('ringing');
	expect(onAccept).not.toHaveBeenCalled();
	expect(onReject).not.toHaveBeenCalled();
});

// Once it is quiet the same slot becomes the decline, so turning a ringing call down takes two presses and the
// second one is a decision rather than a reflex.
it('becomes the decline once it has been silenced', async () => {
	renderItem(true);

	expect(screen.queryByRole('button', { name: 'Silence' })).not.toBeInTheDocument();
	// The bell stays as a plain icon at the head of the row: it is what says why the call went quiet.
	expect(screen.getByTitle('Incoming_call_silenced')).toBeInTheDocument();

	await userEvent.click(screen.getByRole('button', { name: 'Decline' }));

	expect(onReject).toHaveBeenCalledWith('ringing');
});

// Every other row keeps its dismissal last; a ringing one is no different, whichever of the two it is showing.
it('keeps the way to make it stop at the end of the row', () => {
	const { container } = renderItem();
	const buttons = [...container.querySelectorAll('button')].map((button) => button.getAttribute('aria-label'));

	expect(buttons).toEqual(['Accept', 'Silence']);
});

// While it is still asking, when it started is no use: the corner says that it is ringing now.
it('says it is ringing where the time would be', () => {
	renderItem();

	expect(screen.getByText(/Ringing/)).toBeInTheDocument();
});

// A ring this client never heard — a reload, or a call rung before the page loaded — has no sound to stop, and is
// not something the user silenced either.
it('offers the decline straight away for a ring it never heard', () => {
	incomingCalls = [];

	renderItem();

	expect(screen.queryByRole('button', { name: 'Silence' })).not.toBeInTheDocument();
	expect(screen.getByRole('button', { name: 'Decline' })).toBeInTheDocument();
});

// Clicking the row shows the call rather than answering it: the same bargain the rooms under it offer, and the
// reason a mis-click there costs a window rather than putting someone into a call.
it('opens the call without answering it when the row is clicked', async () => {
	renderItem();

	await userEvent.click(screen.getByText('Alice'));

	expect(onOpen).toHaveBeenCalledWith('ringing');
	expect(onAccept).not.toHaveBeenCalled();
});
