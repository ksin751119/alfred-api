import {EventBody, EventPathParameters, Handler} from "./types";
import {Interface} from "ethers/lib/utils";
import {KEY, RPC_PROVIDER, isError} from "./utils";
import ProtocolinkABI from "./protocolink.json";
import * as apisdk from "@protocolink/api";
import {ethers} from "ethers";
import {getTokenByAddress} from "./tokens";
import * as lending from "@weizard/protocolink-lending";

type RequestParms =
  | EventPathParameters<{account: string}> &
      EventBody<{
        leverageTokenAddress: string;
        deleverageTokenAddress: string;
        healthRate: number | [number, number]; // targetRation or [repayRatio, boostRation]
        chainId: number;
      }>;

lending.Adapter.registerProtocol(lending.protocols.aavev3.LendingProtocol);
lending.Adapter.registerSwapper(lending.swappers.paraswapv5.LendingSwapper);

export const eoaAutomation: Handler<RequestParms> = async (event, context) => {
  const {account} = event.pathParameters;
  const {leverageTokenAddress, deleverageTokenAddress, healthRate} = event.body;

  const chainId = 137;
  const protocolId = "aave-v3";
  const marketId = "polygon";

  const adapter = new lending.Adapter(chainId);

  console.time("getPortfolio");
  const portfolio = await adapter.getPortfolio(account, protocolId, marketId);
  console.timeEnd("getPortfolio");

  let leverageToken, deleverageToken;
  const currentHealthRate = Number(portfolio.healthRate);
  console.log(`currentHealthRate:${currentHealthRate}`);
  try {
    leverageToken = getTokenByAddress(leverageTokenAddress);
    deleverageToken = getTokenByAddress(deleverageTokenAddress);
  } catch (error) {
    return {statusCode: 400, body: error};
  }

  console.time("calcAdjustHealthRate");
  let adjustResult;
  if (typeof healthRate === "number") {
    adjustResult = portfolio.adjustHealthRate({
      leverageToken,
      deleverageToken,
      targetHealthRate: healthRate,
    });
  } else {
    let _healthRate = currentHealthRate;
    if (healthRate[1] < currentHealthRate) _healthRate = healthRate[1];
    else if (healthRate[0] > currentHealthRate) _healthRate = healthRate[0];
    else {
      return {statusCode: 400, body: "do nothing"};
    }
    adjustResult = portfolio.adjustHealthRate({
      leverageToken,
      deleverageToken,
      targetHealthRate: _healthRate,
    });
  }
  if (isError(adjustResult)) return {statusCode: 400, body: adjustResult.error};
  console.timeEnd("calcAdjustHealthRate");

  console.time("buildLogic");
  const {operation, srcToken, srcAmount, destToken} = adjustResult;
  const leveragInfo = await adapter[operation]({
    account,
    portfolio,
    srcToken,
    srcAmount,
    destToken,
  });
  console.timeEnd("buildLogic");

  const routerData: apisdk.RouterData = {
    chainId,
    account,
    logics: leveragInfo.logics,
  };

  console.time("askTxData");
  const transactionRequest = await apisdk.buildRouterTransactionRequest(
    routerData
  );
  console.timeEnd("askTxData");

  console.time("adjustTxData");
  const txdataOri = transactionRequest.data;
  const iface = new Interface(ProtocolinkABI);
  const data = iface.decodeFunctionData(
    "executeWithSignerFee",
    txdataOri.toString()
  );

  const postTxdata = iface.encodeFunctionData("executeForWithSignerFee", [
    account,
    ...data,
  ]);
  //   console.log(`postTxdata:${postTxdata}`);
  console.timeEnd("adjustTxData");

  // send transaction
  const provider = new ethers.providers.JsonRpcProvider(RPC_PROVIDER);
  const signer = new ethers.Wallet(KEY, provider);

  const gasPrice = await provider.getGasPrice();
  const maxPriorityFeePerGas = gasPrice.mul(110).div(100);
  const maxFeePerGas = gasPrice.mul(2);

  const tx = await signer.sendTransaction({
    to: transactionRequest.to,
    data: postTxdata,
    value: transactionRequest.value,
    gasLimit: 1800000,
    maxPriorityFeePerGas,
    maxFeePerGas,
  });

  console.log(`tx:${tx.hash}`);

  return {
    statusCode: 200,
    body: {
      to: transactionRequest.to,
      data: postTxdata,
      value: transactionRequest.value?.toString() ?? "0",
    },
  };
};
