import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';

import CallParticipants from './CallParticipants';

const person = (username: string) => ({ _id: username, username });

const renderParticipants = (props: Parameters<typeof CallParticipants>[0]) =>
	render(<CallParticipants {...props} />, { wrapper: mockAppRoot().withJohnDoe().build() });

// Faces say *who* is in the call, which is usually what decides whether to join. The count alone never did.
it('shows a face for each of the people it was given', () => {
	const { container } = renderParticipants({ people: [person('alice'), person('bob')], total: 2 });

	expect(container.querySelectorAll('img')).toHaveLength(2);
	expect(screen.queryByText(/^\+/)).not.toBeInTheDocument();
});

// Only a few travel with the call, so whatever is left over is a number at the end of the row.
it('counts off the ones it has no room for', () => {
	renderParticipants({ people: [person('alice'), person('bob'), person('carol')], total: 12 });

	expect(screen.getByText('+9')).toBeInTheDocument();
});

it('still says how many there are, for anyone who cannot see the faces', () => {
	renderParticipants({ people: [person('alice')], total: 4 });

	expect(screen.getByTitle('__count__people_in_the_call')).toBeInTheDocument();
});

// An older server, or a call whose members did not travel with it.
it('falls back to the number when there are no faces to show', () => {
	const { container } = renderParticipants({ people: [], total: 3 });

	expect(screen.getByText('__count__people_in_the_call')).toBeInTheDocument();
	expect(container.querySelectorAll('img')).toHaveLength(0);
});
