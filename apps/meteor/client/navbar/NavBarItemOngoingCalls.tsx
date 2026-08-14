import { Box, Button, Dropdown, Icon } from '@rocket.chat/fuselage';
import { useLayout } from '@rocket.chat/ui-contexts';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import OngoingCallsList from '../components/OngoingCalls/OngoingCallsList';
import { useOngoingCallsList } from '../components/OngoingCalls/useOngoingCalls';
import { useDropdownVisibility } from '../views/room/Header/Omnichannel/QuickActions/hooks/useDropdownVisibility';

/**
 * The calls, wherever the user is looking: a button in the navbar with the same rows behind it.
 *
 * Shown whenever there is a call at all, sidebar or no sidebar — the sidebar's group is easy to scroll past, and a
 * call is worth a fixed place. Red while something is ringing, blue while something is on offer, and quieter when
 * every call has been turned down: those are still reachable, but none of them is asking any more.
 *
 * It opens itself when a ring starts, but only with the sidebar collapsed — a ringing call the user has to go
 * looking for is a missed call, while one the sidebar is already showing needs no dropdown thrown over the app.
 */
const NavBarItemOngoingCalls = () => {
	const { t } = useTranslation();
	const { sidebar } = useLayout();
	const { ringing, ongoing, declined } = useOngoingCallsList();

	const reference = useRef<HTMLButtonElement>(null);
	const target = useRef(null);
	const { isVisible, toggle } = useDropdownVisibility({ reference, target });

	const isRinging = ringing.length > 0;
	// Anything on offer, as opposed to a call that is only still reachable because declining did not delete it.
	const isOffering = isRinging || ongoing.length > 0;

	const wasRinging = useRef(false);

	useEffect(() => {
		if (sidebar.isCollapsed && isRinging && !wasRinging.current) {
			toggle(true);
		}

		wasRinging.current = isRinging;
	}, [isRinging, sidebar.isCollapsed, toggle]);

	// Only what is on offer is counted as ongoing: a call the reader turned down is still reachable, but calling it
	// ongoing at them is asking again about the thing they just answered.
	const offered = ringing.length + ongoing.length;

	if (offered + declined.length === 0) {
		return null;
	}

	// Nothing on offer, and yet calls to reach: the camera alone says they are there. A number would be counting
	// calls at someone who already turned them down.
	const label = (() => {
		if (isRinging) {
			return `${t('__count__ringing', { count: ringing.length })} · ${offered}`;
		}

		return offered > 0 ? t('__count__ongoing', { count: offered }) : undefined;
	})();

	// The button still needs a name when it carries no text.
	const name = label ?? t('Declined');

	return (
		<>
			<Button
				ref={reference}
				small
				danger={isRinging}
				primary={isOffering && !isRinging}
				onClick={() => toggle()}
				title={name}
				aria-label={name}
			>
				<Box display='flex' alignItems='center' style={{ gap: 4 }}>
					<Icon name='video' size='x16' />
					{label}
					<Icon name={isVisible ? 'chevron-up' : 'chevron-down'} size='x16' />
				</Box>
			</Button>
			{isVisible && (
				// Anchored to the button's own end, since it sits at the end of the navbar: a dropdown hanging off the
				// right of the window is a dropdown with its buttons outside it.
				<Dropdown reference={reference} ref={target} placement='bottom-end'>
					{/* The rows are sidebar items, which paint no background of their own — so this gives them one, and
					    the width a sidebar would have given them. */}
					<Box paddingBlock={8} width='x280' borderRadius='x8' backgroundColor='surface-light'>
						<OngoingCallsList />
					</Box>
				</Dropdown>
			)}
		</>
	);
};

export default NavBarItemOngoingCalls;
