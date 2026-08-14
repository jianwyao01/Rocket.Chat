import type { JoinableVideoConference } from '@rocket.chat/core-typings';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import NavBarItemOngoingCalls from './NavBarItemOngoingCalls';
import { buildJoinableCall as call } from '../views/conference/testFixtures';

const joinCall = jest.fn();

jest.mock('@rocket.chat/ui-video-conf', () => ({
	...jest.requireActual('@rocket.chat/ui-video-conf'),
	useVideoConfJoinCall: () => joinCall,
}));

let sidebarCollapsed = true;

jest.mock('@rocket.chat/ui-contexts', () => ({
	...jest.requireActual('@rocket.chat/ui-contexts'),
	useLayout: () => ({ sidebar: { isCollapsed: sidebarCollapsed } }),
}));

const renderButton = (calls: JoinableVideoConference[]) =>
	render(<NavBarItemOngoingCalls />, {
		wrapper: mockAppRoot()
			.withJohnDoe()
			.withUserPreference('displayAvatars', true)
			.withEndpoint('GET', '/v1/video-conference.joinable', () => ({ calls, success: true }) as any)
			.withEndpoint('POST', '/v1/video-conference.decline', () => ({ success: true }) as any)
			.build(),
	});

beforeEach(() => {
	joinCall.mockClear();
	sidebarCollapsed = true;
});

// A call is worth a fixed place: the sidebar's group is easy to scroll past, and easy to have collapsed entirely.
it('shows the calls whether or not the sidebar is', async () => {
	sidebarCollapsed = false;
	renderButton([call({ callId: 'one' })]);

	expect(await screen.findByRole('button', { name: /__count__ongoing/ })).toBeInTheDocument();
});

it('says nothing when there are no calls to reach', async () => {
	const { container } = renderButton([]);

	await waitFor(() => expect(container).toBeEmptyDOMElement());
});

it('counts the calls that are running', async () => {
	renderButton([call({ callId: 'one' }), call({ callId: 'two' })]);

	expect(await screen.findByRole('button', { name: /__count__ongoing/ })).toBeInTheDocument();
});

it('opens the same list the sidebar docks', async () => {
	renderButton([call({ callId: 'one', name: 'Standup' })]);

	await userEvent.click(await screen.findByRole('button', { name: /__count__ongoing/ }));

	expect(await screen.findByText('Standup')).toBeInTheDocument();
	expect(screen.getByRole('button', { name: 'Join' })).toBeInTheDocument();
});

// A ringing call the user has to go looking for is a missed call.
describe('when something is ringing', () => {
	const ringing = [call({ callId: 'ringing', name: 'Alice', ringingAt: new Date() })];

	it('says so on the button', async () => {
		renderButton(ringing);

		expect(await screen.findByRole('button', { name: /__count__ringing/ })).toBeInTheDocument();
	});

	it('opens itself without being asked', async () => {
		renderButton(ringing);

		expect(await screen.findByText('Alice')).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Accept' })).toBeInTheDocument();
	});
});

// Declining quiets a call rather than losing it here too: it waits behind the same toggle the sidebar's group uses.
it('keeps a declined call behind the toggle', async () => {
	renderButton([call({ callId: 'one', name: 'Standup' }), call({ callId: 'refused', name: 'Design review', declined: true })]);

	await userEvent.click(await screen.findByRole('button', { name: /__count__ongoing/ }));

	expect(await screen.findByText('Standup')).toBeInTheDocument();
	expect(screen.queryByText('Design review')).not.toBeInTheDocument();

	await userEvent.click(screen.getByRole('button', { name: /Show__count__declined_calls/ }));

	expect(await screen.findByText('Design review')).toBeInTheDocument();
});

// Declining quiets a call; it does not end it. So it still counts, and the button stops being an offer without
// pretending the call is gone.
describe('when every call has been turned down', () => {
	const onlyDeclined = [call({ callId: 'refused', name: 'Design review', declined: true })];

	// Still reachable, so still shown — but with no count at all: a number here would be counting calls at someone
	// who already turned them down. The camera alone says they are there.
	it('shows the camera without a count', async () => {
		renderButton(onlyDeclined);

		const button = await screen.findByRole('button', { name: 'Declined' });

		expect(button).toBeInTheDocument();
		// Icons are a font, so the button is never textually empty — what matters is that it carries no count.
		expect(button.textContent).not.toMatch(/\d/);
		expect(screen.queryByRole('button', { name: /__count__ongoing/ })).not.toBeInTheDocument();
	});

	it('stops offering: neither ringing red nor the blue of a call on offer', async () => {
		renderButton(onlyDeclined);

		const button = await screen.findByRole('button', { name: 'Declined' });

		expect(button.className).not.toMatch(/rcx-button--(danger|primary)\b/);
	});
});

// Red is for the one thing asking something of the reader; blue for calls that are simply there to be walked into.
it('is red while something is ringing and blue while something is merely running', async () => {
	const { unmount } = renderButton([call({ callId: 'ringing', ringingAt: new Date() })]);

	expect((await screen.findByRole('button', { name: /__count__ringing/ })).className).toMatch(/rcx-button--danger/);

	unmount();
	renderButton([call({ callId: 'running' })]);

	expect((await screen.findByRole('button', { name: /__count__ongoing/ })).className).toMatch(/rcx-button--primary/);
});

// A declined call is reachable, not on offer: counting it as ongoing would ask again about the thing just answered.
it('leaves declined calls out of the ongoing count', async () => {
	renderButton([call({ callId: 'running' }), call({ callId: 'refused', declined: true })]);

	const button = await screen.findByRole('button', { name: /__count__ongoing/ });

	expect(button).toHaveAttribute('title', expect.stringContaining('__count__ongoing'));
	expect(screen.queryByRole('button', { name: 'Declined' })).not.toBeInTheDocument();
});
