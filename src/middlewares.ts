import "dotenv/config";

import httpErrorHandler from "@middy/http-error-handler";
import httpResponseSerializer from "@middy/http-response-serializer";
import inputOutputLogger from "@middy/input-output-logger";

export const responseSerializer = httpResponseSerializer({
  serializers: [
    {
      regex: /^application\/json$/,
      serializer: ({ body }) => JSON.stringify(body),
    },
    {
      regex: /^text\/plain$/,
      serializer: ({ body }) => body,
    },
  ],
  defaultContentType: "application/json",
});

const enableLogger =
  (process.env.ENABLE_LOGGER ?? "true").toLowerCase() === "true"
    ? console.error
    : undefined;

export const errorHandler = httpErrorHandler({
  logger: enableLogger,
  fallbackMessage: "internal server error",
});

export const logger = inputOutputLogger({
  logger: ({ event }) => {
    // event &&
    //   console.log(
    //     `[Log] [${event.httpMethod}]${event.path}
    //       queryStringParameters:${JSON.stringify(
    //         event.queryStringParameters,
    //         null,
    //         2
    //       )}
    //       body:${JSON.stringify(event.body, null, 2)}`
    //   );
  },
});
