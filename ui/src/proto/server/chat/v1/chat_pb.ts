// @generated by protoc-gen-es v1.10.0 with parameter "target=ts"
// @generated from file server/chat/v1/chat.proto (package server.chat.v1, syntax proto3)
/* eslint-disable */
// @ts-nocheck

import type { BinaryReadOptions, FieldList, JsonReadOptions, JsonValue, PartialMessage, PlainMessage } from "@bufbuild/protobuf";
import { Message, proto3, Timestamp } from "@bufbuild/protobuf";

/**
 * @generated from message server.chat.v1.Msg
 */
export class Msg extends Message<Msg> {
  /**
   * @generated from field: google.protobuf.Timestamp timestamp = 1;
   */
  timestamp?: Timestamp;

  /**
   * @generated from field: string content = 2;
   */
  content = "";

  /**
   * @generated from field: string user_name = 3;
   */
  userName = "";

  /**
   * @generated from field: string room_name = 4;
   */
  roomName = "";

  constructor(data?: PartialMessage<Msg>) {
    super();
    proto3.util.initPartial(data, this);
  }

  static readonly runtime: typeof proto3 = proto3;
  static readonly typeName = "server.chat.v1.Msg";
  static readonly fields: FieldList = proto3.util.newFieldList(() => [
    { no: 1, name: "timestamp", kind: "message", T: Timestamp },
    { no: 2, name: "content", kind: "scalar", T: 9 /* ScalarType.STRING */ },
    { no: 3, name: "user_name", kind: "scalar", T: 9 /* ScalarType.STRING */ },
    { no: 4, name: "room_name", kind: "scalar", T: 9 /* ScalarType.STRING */ },
  ]);

  static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Msg {
    return new Msg().fromBinary(bytes, options);
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Msg {
    return new Msg().fromJson(jsonValue, options);
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Msg {
    return new Msg().fromJsonString(jsonString, options);
  }

  static equals(a: Msg | PlainMessage<Msg> | undefined, b: Msg | PlainMessage<Msg> | undefined): boolean {
    return proto3.util.equals(Msg, a, b);
  }
}

/**
 * @generated from message server.chat.v1.NewChatSessionRequest
 */
export class NewChatSessionRequest extends Message<NewChatSessionRequest> {
  /**
   * @generated from field: string user_name = 1;
   */
  userName = "";

  /**
   * @generated from field: string room_name = 2;
   */
  roomName = "";

  constructor(data?: PartialMessage<NewChatSessionRequest>) {
    super();
    proto3.util.initPartial(data, this);
  }

  static readonly runtime: typeof proto3 = proto3;
  static readonly typeName = "server.chat.v1.NewChatSessionRequest";
  static readonly fields: FieldList = proto3.util.newFieldList(() => [
    { no: 1, name: "user_name", kind: "scalar", T: 9 /* ScalarType.STRING */ },
    { no: 2, name: "room_name", kind: "scalar", T: 9 /* ScalarType.STRING */ },
  ]);

  static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): NewChatSessionRequest {
    return new NewChatSessionRequest().fromBinary(bytes, options);
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): NewChatSessionRequest {
    return new NewChatSessionRequest().fromJson(jsonValue, options);
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): NewChatSessionRequest {
    return new NewChatSessionRequest().fromJsonString(jsonString, options);
  }

  static equals(a: NewChatSessionRequest | PlainMessage<NewChatSessionRequest> | undefined, b: NewChatSessionRequest | PlainMessage<NewChatSessionRequest> | undefined): boolean {
    return proto3.util.equals(NewChatSessionRequest, a, b);
  }
}

/**
 * @generated from message server.chat.v1.NewChatSessionResponse
 */
export class NewChatSessionResponse extends Message<NewChatSessionResponse> {
  /**
   * @generated from field: server.chat.v1.Msg msg = 1;
   */
  msg?: Msg;

  constructor(data?: PartialMessage<NewChatSessionResponse>) {
    super();
    proto3.util.initPartial(data, this);
  }

  static readonly runtime: typeof proto3 = proto3;
  static readonly typeName = "server.chat.v1.NewChatSessionResponse";
  static readonly fields: FieldList = proto3.util.newFieldList(() => [
    { no: 1, name: "msg", kind: "message", T: Msg },
  ]);

  static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): NewChatSessionResponse {
    return new NewChatSessionResponse().fromBinary(bytes, options);
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): NewChatSessionResponse {
    return new NewChatSessionResponse().fromJson(jsonValue, options);
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): NewChatSessionResponse {
    return new NewChatSessionResponse().fromJsonString(jsonString, options);
  }

  static equals(a: NewChatSessionResponse | PlainMessage<NewChatSessionResponse> | undefined, b: NewChatSessionResponse | PlainMessage<NewChatSessionResponse> | undefined): boolean {
    return proto3.util.equals(NewChatSessionResponse, a, b);
  }
}

/**
 * @generated from message server.chat.v1.BroadcastChatRequest
 */
export class BroadcastChatRequest extends Message<BroadcastChatRequest> {
  /**
   * @generated from field: server.chat.v1.Msg msg = 1;
   */
  msg?: Msg;

  constructor(data?: PartialMessage<BroadcastChatRequest>) {
    super();
    proto3.util.initPartial(data, this);
  }

  static readonly runtime: typeof proto3 = proto3;
  static readonly typeName = "server.chat.v1.BroadcastChatRequest";
  static readonly fields: FieldList = proto3.util.newFieldList(() => [
    { no: 1, name: "msg", kind: "message", T: Msg },
  ]);

  static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): BroadcastChatRequest {
    return new BroadcastChatRequest().fromBinary(bytes, options);
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): BroadcastChatRequest {
    return new BroadcastChatRequest().fromJson(jsonValue, options);
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): BroadcastChatRequest {
    return new BroadcastChatRequest().fromJsonString(jsonString, options);
  }

  static equals(a: BroadcastChatRequest | PlainMessage<BroadcastChatRequest> | undefined, b: BroadcastChatRequest | PlainMessage<BroadcastChatRequest> | undefined): boolean {
    return proto3.util.equals(BroadcastChatRequest, a, b);
  }
}

/**
 * @generated from message server.chat.v1.BroadcastChatResponse
 */
export class BroadcastChatResponse extends Message<BroadcastChatResponse> {
  constructor(data?: PartialMessage<BroadcastChatResponse>) {
    super();
    proto3.util.initPartial(data, this);
  }

  static readonly runtime: typeof proto3 = proto3;
  static readonly typeName = "server.chat.v1.BroadcastChatResponse";
  static readonly fields: FieldList = proto3.util.newFieldList(() => [
  ]);

  static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): BroadcastChatResponse {
    return new BroadcastChatResponse().fromBinary(bytes, options);
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): BroadcastChatResponse {
    return new BroadcastChatResponse().fromJson(jsonValue, options);
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): BroadcastChatResponse {
    return new BroadcastChatResponse().fromJsonString(jsonString, options);
  }

  static equals(a: BroadcastChatResponse | PlainMessage<BroadcastChatResponse> | undefined, b: BroadcastChatResponse | PlainMessage<BroadcastChatResponse> | undefined): boolean {
    return proto3.util.equals(BroadcastChatResponse, a, b);
  }
}

