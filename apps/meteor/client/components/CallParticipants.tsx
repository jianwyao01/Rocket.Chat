import type { IUser } from '@rocket.chat/core-typings';
import { css } from '@rocket.chat/css-in-js';
import { Box } from '@rocket.chat/fuselage';
import { UserAvatar } from '@rocket.chat/ui-avatar';
import { useUserPreference } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';

/**
 * What lifts each face off the one it overlaps, so a row of them reads as several people rather than as one
 * smudge. `drop-shadow` rather than `box-shadow` because it follows the avatar's own rounded shape — the radius
 * belongs to the avatar, and guessing it here would leave a square shadow behind a rounded picture.
 *
 * `position: relative` is here only to make `z-index` apply: the faces are deliberately stacked, and which one
 * sits above which has to be said rather than left to paint order.
 */
const stackedStyles = css`
	position: relative;
	filter: drop-shadow(0 0 1px rgba(0, 0, 0, 0.24)) drop-shadow(0 1px 2px rgba(0, 0, 0, 0.32));
`;

type CallParticipantsProps = {
	/** A few of the people in the call — whoever is to get a face. Capped by the caller. */
	people: (Pick<IUser, '_id'> & Partial<Pick<IUser, 'username'>>)[];
	/** How many are in the call altogether, which is what the count after the faces is worked out from. */
	total: number;
	/** Avatar size, since a sidebar row and a full screen don't want the same one. */
	size?: 'x18' | 'x24';
};

/**
 * Who is already in a call: their faces, then how many more there are.
 *
 * Says it the way the call's own message block says it — the faces, then `+ 3 joined`, or just `joined` when they
 * are all shown. Same arrangement and the same phrases (`plus__usersCount__joined`, `joined`), because a call the
 * user meets in the sidebar and again in its room should read the same both times.
 *
 * Faces answer *who* is in there, which is usually what decides whether to walk in. With avatars turned off there
 * is nobody to show, so it falls back to the count in words, as the message block does.
 */
const CallParticipants = ({ people, total, size = 'x18' }: CallParticipantsProps) => {
	const { t } = useTranslation();
	const displayAvatars = useUserPreference<boolean>('displayAvatars');

	// The whole count, as the group's label: it is what a screen reader gets instead of the faces, and "+ 3" only
	// means something next to a total.
	const label = t('__count__people_in_the_call', { count: total });

	// Faces switched off, or a call whose members didn't travel with it — an older server, say.
	if (!displayAvatars || !people.length) {
		return (
			<Box fontScale='micro' color='hint'>
				{t('__usersCount__joined', { count: total })}
			</Box>
		);
	}

	const remaining = total - people.length;

	return (
		<Box display='flex' alignItems='center' aria-label={label} title={label} style={{ gap: 6 }}>
			<Box display='flex' alignItems='center'>
				{people.map(({ _id, username }, index) => (
					// Overlapped a little, so a row of faces reads as one group rather than a list. Each face sits
					// above the one before it, which is the direction the row is read in.
					<Box key={_id} className={stackedStyles} marginInlineStart={index === 0 ? 0 : -4} style={{ zIndex: index + 1 }}>
						<UserAvatar username={username ?? ''} size={size} />
					</Box>
				))}
			</Box>
			<Box fontScale='micro' color='hint' flexShrink={0}>
				{remaining > 0 ? t('plus__usersCount__joined', { count: remaining }) : t('joined')}
			</Box>
		</Box>
	);
};

export default CallParticipants;
