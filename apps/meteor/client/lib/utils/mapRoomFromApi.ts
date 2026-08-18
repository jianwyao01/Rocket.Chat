import type { IOmnichannelRoom, IRoom, Serialized } from '@rocket.chat/core-typings';

import { mapMessageFromApi } from './mapMessageFromApi';

// Livechat rooms are opened through the same flow, so their own date fields have to be covered too.
type SerializedRoom = Serialized<IRoom> & Partial<Serialized<Pick<IOmnichannelRoom, 'queuedAt' | 'closedAt'>>>;

// REST serializes Date fields to strings; the Rooms store is Date-typed. Every date-bearing key
// published by `roomFields` has to be revived, or it lands in the store as a string.
export const mapRoomFromApi = ({ _updatedAt, ts, lm, queuedAt, closedAt, lastMessage, ...room }: SerializedRoom): IRoom =>
	({
		...room,
		...(_updatedAt && { _updatedAt: new Date(_updatedAt) }),
		...(ts && { ts: new Date(ts) }),
		...(lm && { lm: new Date(lm) }),
		...(queuedAt && { queuedAt: new Date(queuedAt) }),
		...(closedAt && { closedAt: new Date(closedAt) }),
		...(lastMessage && { lastMessage: mapMessageFromApi(lastMessage) }),
	}) as unknown as IRoom;
