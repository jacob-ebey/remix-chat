import type ChatRoomDO from "chat-room-do";
import type RateLimiterDO from "rate-limiter-do";
import type UserDO from "user-do";

export interface Env {
	__STATIC_CONTENT: KVNamespace;

	CHAT_ROOM: TypedDurableObjectNamespace<ChatRoomDO>;
	RATE_LIMITER: TypedDurableObjectNamespace<RateLimiterDO>;
	USER: TypedDurableObjectNamespace<UserDO>;

	SESSION_SECRET: string;
}

export interface TypedDurableObjectNamespace<D> extends DurableObjectNamespace {
	get(id: DurableObjectId): TypedDurableObjectStub<D>;
}

export interface TypedDurableObjectStub<D extends DurableObject>
	extends DurableObjectStub {
	fetch(
		requestOrUrl: Request | string,
		requestInit?: RequestInit | Request
	): TypedDurableObjectResponse<D>;
}

export type TypedResponse<T extends unknown = unknown> = Response & {
	json(): Promise<T>;
};

export interface TypedDurableObjectResponse<
	D extends DurableObject,
	R = Awaited<ReturnType<D["fetch"]>>
> extends Response {
	json(): R extends TypedResponse<infer T> ? Promise<T> : Promise<unknown>;
}
