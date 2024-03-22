import { EventQueryStringParameters, Handler } from "./types";
import * as lending from "@weizard/protocolink-lending";

type RequestParms = EventQueryStringParameters<{
  account: string;
  chainId: number;
}>;

lending.Adapter.registerProtocol(lending.protocols.aavev3.LendingProtocol);
lending.Adapter.registerSwapper(lending.swappers.paraswapv5.LendingSwapper);

export const getHealthRate: Handler<RequestParms> = async (event, context) => {
  const { account } = event.queryStringParameters;

  const protocolId = "aave-v3";
  const marketId = "polygon";

  const adapter = new lending.Adapter(137);
  const portfolio = await adapter.getPortfolio(account, protocolId, marketId);
  const healthRate = Number(portfolio.healthRate);

  return {
    statusCode: 200,
    body: { healthRate },
  };
};
