import type { IRoom, IUser } from '@rocket.chat/core-typings';
import { Rooms, Users } from '@rocket.chat/models';

export const parseDirectRoomTargets = (identifier: string): string[] => identifier.split(',').map((username) => username.trim());

const resolveUsernames = async (usernames: string[]): Promise<Pick<IUser, '_id' | 'username'>[] | null> => {
	const users = await Users.findUsersByUsernames<Pick<IUser, '_id' | 'username'>>(usernames, {
		projection: { _id: 1, username: 1 },
	}).toArray();

	return users.length === usernames.length ? users : null;
};

export const resolveDirectRoomTargets = async (identifier: string): Promise<string[] | null> => {
	const targets = [...new Set(parseDirectRoomTargets(identifier))];

	return (await resolveUsernames(targets)) ? targets : null;
};

export const findDirectRoomByIdentifier = async (identifier: string, user: Pick<IUser, '_id' | 'username'>): Promise<IRoom | null> => {
	const targets = parseDirectRoomTargets(identifier);

	if (targets.length === 1) {
		const byId = await Rooms.findByTypeAndNameOrId('d', targets[0]);
		if (byId) {
			return byId;
		}
	}

	if (!user.username) {
		return null;
	}

	const members = await resolveUsernames([...new Set([user.username, ...targets])]);
	if (!members) {
		return null;
	}

	const uids = members.map(({ _id }) => _id).sort();

	return Rooms.findOneDirectRoomContainingAllUserIDs(uids);
};
