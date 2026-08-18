import type { IRoom, IUser } from '@rocket.chat/core-typings';
import { Rooms, Users } from '@rocket.chat/models';

// `/direct/:rid` carries either a room id or the participants themselves: one username for a
// regular DM, a comma separated list for a group one. Lookup and creation must read it the same
// way, so both go through here.
export const parseDirectRoomTargets = (identifier: string): string[] => identifier.split(',').map((username) => username.trim());

// Direct rooms carry no `name`; the member set is what identifies them, and it is the same
// primitive `createDirectRoom` resolves against.
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

	const usernames = [...new Set([user.username, ...targets])];
	const members = await Users.findUsersByUsernames(usernames, { projection: { _id: 1 } }).toArray();
	if (members.length !== usernames.length) {
		return null;
	}

	const uids = members.map(({ _id }) => _id).sort();

	return Rooms.findOneDirectRoomContainingAllUserIDs(uids);
};
