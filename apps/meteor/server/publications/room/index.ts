import type { IOmnichannelRoom, IRoom, RoomType } from '@rocket.chat/core-typings';
import type { ServerMethods } from '@rocket.chat/ddp-client';
import { Rooms, Users } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';
import _ from 'underscore';

import { roomFields } from '../../../lib/publishFields';
import { canAccessRoomAsync } from '../../lib/authorization';
import { hasPermissionAsync } from '../../lib/authorization/hasPermission';
import { findDirectRoomByIdentifier } from '../../lib/rooms/findDirectRoomByIdentifier';
import { roomCoordinator } from '../../lib/rooms/roomCoordinator';
import { settings } from '../../settings';

type PublicRoomField = keyof typeof roomFields;
type PublicRoom = Pick<IRoom, PublicRoomField & keyof IRoom> & Pick<IOmnichannelRoom, PublicRoomField & keyof IOmnichannelRoom>;

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		'rooms/get'(updatedAt?: Date): IRoom[] | { update: IRoom[]; remove: IRoom[] };
		'getRoomByTypeAndName': (type: RoomType, name: string) => PublicRoom;
	}
}

const roomMap = (record: IRoom | IOmnichannelRoom) => {
	return _.pick(record, ...Object.keys(roomFields)) as PublicRoom;
};

export const roomsGetMethod = async (userId?: string | null, updatedAt?: Date): Promise<IRoom[] | { update: IRoom[]; remove: IRoom[] }> => {
	const options = { projection: roomFields };

	if (!userId) {
		if (settings.get('Accounts_AllowAnonymousRead')) {
			return Rooms.findByDefaultAndTypes(true, ['c'], options).toArray();
		}
		return [];
	}

	if (updatedAt instanceof Date) {
		return {
			update: await (await Rooms.findBySubscriptionUserIdUpdatedAfter(userId, updatedAt, options)).toArray(),
			remove: await Rooms.trashFindDeletedAfter(updatedAt, {}, { projection: { _id: 1, _deletedAt: 1 } }).toArray(),
		};
	}

	return (await Rooms.findBySubscriptionUserId(userId, options)).toArray();
};

export const findRoomByTypeAndName = async (userId: string | null, type: RoomType, name: string): Promise<PublicRoom | null> => {
	if (!type || !name) {
		return null;
	}

	const user = userId ? await Users.findOneById(userId) : null;
	const isAnonymous = !user?._id;

	if (isAnonymous) {
		const allowAnon = settings.get('Accounts_AllowAnonymousRead');
		if (!allowAnon || type !== 'c') {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'getRoomByTypeAndName',
			});
		}
	}

	let room: IRoom | IOmnichannelRoom | null | undefined;

	if (type === 'd' && user) {
		room = await findDirectRoomByIdentifier(name, user);
	} else {
		const roomFind = roomCoordinator.getRoomFind(type);
		room = roomFind ? await roomFind(name) : await Rooms.findByTypeAndNameOrId(type, name);
	}

	if (!room) {
		return null;
	}

	if (
		user &&
		!(await canAccessRoomAsync(room, user, {
			includeInvitations: true,
		}))
	) {
		throw new Meteor.Error('error-no-permission', 'No permission', {
			method: 'getRoomByTypeAndName',
		});
	}

	if (settings.get('Store_Last_Message') && user && !(await hasPermissionAsync(user, 'preview-c-room'))) {
		delete room.lastMessage;
	}

	return roomMap(room);
};

export const getRoomByTypeAndNameMethod = async (userId: string | null, type: RoomType, name: string): Promise<PublicRoom> => {
	const room = await findRoomByTypeAndName(userId, type, name);

	if (!room) {
		throw new Meteor.Error('error-invalid-room', 'Invalid room', {
			method: 'getRoomByTypeAndName',
		});
	}

	return room;
};

Meteor.methods<ServerMethods>({
	async 'rooms/get'(updatedAt) {
		return roomsGetMethod(Meteor.userId(), updatedAt);
	},

	async 'getRoomByTypeAndName'(type, name) {
		return getRoomByTypeAndNameMethod(Meteor.userId(), type, name);
	},
});
