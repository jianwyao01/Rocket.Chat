import type { IUser } from '@rocket.chat/core-typings';
import { Box } from '@rocket.chat/fuselage';
import { UserAvatar } from '@rocket.chat/ui-avatar';
import { useTranslation } from 'react-i18next';

type CallParticipantsProps = {
	/** A few of the people in the call — whoever is to get a face. Capped by `CALL_FACES_SHOWN`. */
	people: (Pick<IUser, '_id'> & Partial<Pick<IUser, 'username'>>)[];
	/** How many are in the call altogether, which is what the "+N" is worked out from. */
	total: number;
	/** Avatar size, since a sidebar row and a full screen don't want the same one. */
	size?: 'x18' | 'x24';
};

/**
 * Who is already in a call, as faces rather than a number.
 *
 * Faces say *who* is in there, which is usually what decides whether to walk in; a count never did. Only a few of
 * them are shown, so whatever is left over becomes a "+N" at the end — shaped and sized like one more avatar, so
 * the row reads as a group of people rather than as faces followed by a statistic.
 *
 * The count is still there as the group's label, both for anyone who cannot see the avatars and because "+2" only
 * means something next to a total.
 */
const CallParticipants = ({ people, total, size = 'x18' }: CallParticipantsProps) => {
	const { t } = useTranslation();

	const label = t('__count__people_in_the_call', { count: total });

	// Nothing to show faces from — an older server, or a call whose members didn't travel with it.
	if (!people.length) {
		return (
			<Box fontScale='micro' color='hint'>
				{label}
			</Box>
		);
	}

	const remaining = total - people.length;

	return (
		<Box display='flex' alignItems='center' aria-label={label} title={label}>
			{people.map(({ _id, username }, index) => (
				// Overlapped a little, so a row of faces reads as one group rather than a list.
				<Box key={_id} marginInlineStart={index === 0 ? 0 : -4}>
					<UserAvatar username={username ?? ''} size={size} />
				</Box>
			))}
			{remaining > 0 && (
				// One more avatar in the row, carrying a number instead of a face. It keeps the avatar's shape and
				// size but is allowed to grow with its digits, since a call can hold a lot of people.
				<Box
					marginInlineStart={-4}
					minWidth={size}
					height={size}
					paddingInline={4}
					display='flex'
					alignItems='center'
					justifyContent='center'
					borderRadius='x4'
					backgroundColor='surface-neutral'
					color='hint'
					fontScale='micro'
				>
					{`+${remaining}`}
				</Box>
			)}
		</Box>
	);
};

export default CallParticipants;
