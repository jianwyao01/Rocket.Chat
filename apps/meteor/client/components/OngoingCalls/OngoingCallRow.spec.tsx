import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import OngoingCallRow from './OngoingCallRow';
import { buildJoinableCall } from '../../views/conference/testFixtures';

const onJoin = jest.fn();
const onDecline = jest.fn();

const renderRow = (name = 'Standup') =>
	render(<OngoingCallRow call={buildJoinableCall({ callId: 'call-1', name })} onJoin={onJoin} onDecline={onDecline} />, {
		wrapper: mockAppRoot().withJohnDoe().withUserPreference('displayAvatars', true).build(),
	});

beforeEach(() => {
	onJoin.mockClear();
	onDecline.mockClear();
});

it('says what the call is and who is in it', () => {
	renderRow('Sprint planning');

	expect(screen.getByText('Sprint planning')).toBeInTheDocument();
	expect(screen.getByTitle('__count__people_in_the_call')).toBeInTheDocument();
});

// A row in the sidebar is a route to a call: joining is the offer, and turning it down is how to be rid of the row.
it('opens the call window on its preflight', async () => {
	renderRow();

	await userEvent.click(screen.getByRole('button', { name: 'See_call_details' }));

	expect(onJoin).toHaveBeenCalledWith('call-1');
	expect(onDecline).not.toHaveBeenCalled();
});

// Clicking the row itself does nothing: what the call offers is on the buttons, and a whole row that joined a call
// would be a large target for something the reader may not have meant.
// Clicking the row opens the call, the same as the button on it and the same as the rooms under it. What it must
// never do is navigate: the item is an anchor with nowhere to go, and an unhandled click on it reloaded the page
// out from under the call list.
it('opens the call, without navigating, when the row itself is clicked', async () => {
	const { container } = renderRow();
	const row = container.querySelector('.rcx-sidebar-v2-item') as HTMLElement;

	const click = new MouseEvent('click', { bubbles: true, cancelable: true });
	row.dispatchEvent(click);

	expect(click.defaultPrevented).toBe(true);
	expect(onJoin).toHaveBeenCalledWith('call-1');
	expect(onDecline).not.toHaveBeenCalled();
});

// The buttons sit inside a row that is itself clickable, so their clicks arrive there too. Turning a call down must
// not also open it, which is what happened before the row learned to tell the two apart.
it('turns the call down', async () => {
	renderRow();

	await userEvent.click(screen.getByRole('button', { name: 'Decline' }));

	expect(onDecline).toHaveBeenCalledWith('call-1');
	expect(onJoin).not.toHaveBeenCalled();
});

// It is the sidebar's own room item, so a call is proportional to the channels under it: the same title tokens, the
// timestamp in the same corner, the same insets. The one slot it never takes is the avatar — a call has no single
// face to put there, and its faces are on the second line.
it('is the room item, with the time in its corner and no avatar', () => {
	const { container } = renderRow('Standup');

	expect(container.querySelector('.rcx-sidebar-v2-item')).not.toBeNull();
	expect(container.querySelector('.rcx-sidebar-v2-item__timestamp')).not.toBeNull();
	expect(container.querySelector('.rcx-sidebar-v2-item__avatar')).toBeNull();
});

// The name has the item's first line; the faces and the actions share the second.
it('keeps the actions with the faces rather than with the name', () => {
	renderRow('Standup');

	const secondRow = screen.getByTitle('__count__people_in_the_call').closest('.rcx-sidebar-v2-item__row') as HTMLElement;

	expect(secondRow).toContainElement(screen.getByRole('button', { name: 'See_call_details' }));
	expect(secondRow).toContainElement(screen.getByRole('button', { name: 'Decline' }));
	expect(secondRow).not.toContainElement(screen.getByText('Standup'));
});
