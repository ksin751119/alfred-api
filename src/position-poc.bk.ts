// import { Interface } from "ethers/lib/utils";
// import ProtocolinkABI from "./protocolink.json";
// import * as apisdk from "@protocolink/api";
// import * as common from "@protocolink/common";
// import * as lending from "@weizard/protocolink-lending";
// import { polygonTokens } from "@protocolink/test-helpers";

// lending.Adapter.registerProtocol(lending.protocols.aavev3.LendingProtocol);
// lending.Adapter.registerSwapper(lending.swappers.paraswapv5.LendingSwapper);

// const chainId = common.ChainId.polygon;
// const adapter = new lending.Adapter(chainId /*, provider*/);

// const account = "0xa3C1C91403F0026b9dd086882aDbC8Cdbc3b3cfB";
// const protocolId = "aave-v3";
// const marketId = "polygon";

// const boostRatio = 2.5;
// const repayRatio = 2;

// const permit2Type: apisdk.Permit2Type = "approve";

// async function main() {
//   const portfolio = await adapter.getPortfolio(account, protocolId, marketId);
//   const healthRate = Number(portfolio.healthRate);
//   console.log(`current helath rate:${healthRate}`);

//   const leverageToken = polygonTokens.USDC;
//   const deleverageToken = polygonTokens.WETH;
//   let adjustInfo;
//   if (healthRate > boostRatio) {
//     adjustInfo = portfolio.adjustHealthRate({
//       leverageToken,
//       deleverageToken,
//       targetHealthRate: boostRatio,
//     });
//   } else if (healthRate < repayRatio) {
//     adjustInfo = portfolio.adjustHealthRate({
//       leverageToken,
//       deleverageToken,
//       targetHealthRate: repayRatio,
//     });
//   } else {
//     return;
//   }

//   if (isError(adjustInfo)) return;

//   const { operation, srcToken, srcAmount, destToken } = adjustInfo;
//   let leveragInfo = await adapter[operation]({
//     account,
//     portfolio,
//     srcToken,
//     srcAmount,
//     destToken,
//   });

//   // User obtains a leverage long/short transaction request
//   const routerData: apisdk.RouterData = {
//     chainId,
//     account,
//     logics: leveragInfo.logics,
//   };

//   const transactionRequest = await apisdk.buildRouterTransactionRequest(
//     routerData
//   );

//   console.log(`transactionRequest to:${transactionRequest.to}`);
//   console.log(JSON.stringify(transactionRequest, null, 2));

//   //=======================
//   const txdataOri = transactionRequest.data;
//   const iface = new Interface(ProtocolinkABI);
//   const data = iface.decodeFunctionData("execute", txdataOri.toString());

//   const postTxdata = iface.encodeFunctionData("executeFor", [account, ...data]);
//   console.log(`postTxdata :${postTxdata}`);
// }

// async function buildTxData(afterPortfolio: lending.OperationOutput) {
//   const estimateResult = await apisdk.estimateRouterData(
//     { chainId, account, logics: afterPortfolio.logics },
//     { permit2Type }
//   );
//   console.log("estimateResult:");
//   console.log(JSON.stringify(estimateResult.fees, null, 2));

//   // User obtains a leverage long transaction request
//   const routerData: apisdk.RouterData = {
//     chainId,
//     account,
//     logics: afterPortfolio.logics,
//   };

//   const transactionRequest = await apisdk.buildRouterTransactionRequest(
//     routerData
//   );

//   console.log(`transactionRequest to:${transactionRequest.to}`);
//   // console.log(JSON.stringify(transactionRequest, null, 2));
// }

// main();

// function isError(
//   result: lending.AdjustHealthRateOutput
// ): result is { error: string } {
//   return (result as { error: string }).error !== undefined;
// }
