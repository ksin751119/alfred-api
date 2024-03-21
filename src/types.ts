import type {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Handler as LambdaHandler,
} from "aws-lambda";
import { Method } from "@middy/http-router";

export interface EventBody<T = any> {
  body: T;
}

export interface EventPathParameters<T = any> {
  pathParameters: T;
}

export interface EventQueryStringParameters<T = any> {
  queryStringParameters: T;
}

export type EventParams =
  | EventBody
  | EventPathParameters
  | EventQueryStringParameters;

export interface Event<T extends EventParams = EventParams>
  extends Omit<
    APIGatewayProxyEvent,
    "body" | "pathParameters" | "queryStringParameters"
  > {
  rawHeaders: Record<string, string>;
  body: T extends EventBody ? T["body"] : null;
  pathParameters: T extends EventPathParameters ? T["pathParameters"] : null;
  queryStringParameters: T extends EventQueryStringParameters
    ? T["queryStringParameters"]
    : null;
}

export interface Response<T> extends Omit<APIGatewayProxyResult, "body"> {
  body: T;
}

export type Handler<
  T extends EventParams = EventParams,
  TResponse = any
> = LambdaHandler<Event<T>, Response<TResponse>>;

export interface Route<T extends EventParams = EventParams> {
  method: Method;
  path: string;
  handler: Handler<T>;
}
