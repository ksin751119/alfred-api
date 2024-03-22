import BigNumber from "bignumber.js";
import { Contract, ethers } from "ethers";
import { EventBody, EventPathParameters, Handler } from "./types";
import { Interface } from "ethers/lib/utils";
import { KEY, RPC_PROVIDER, isError } from "./utils";
import SafePluginABI from "./safePlugin.json";
import { getTokenByAddress } from "./tokens";
import * as lending from "@weizard/protocolink-lending";

type RequestParms =
  | EventPathParameters<{ account: string }> &
      EventBody<{
        leverageTokenAddress: string;
        deleverageTokenAddress: string;
        healthRate: number | [number, number]; // targetRation or [repayRatio, boostRation]
        chainId: number;
      }>;

lending.Adapter.registerProtocol(lending.protocols.aavev3.LendingProtocol);
lending.Adapter.registerSwapper(lending.swappers.paraswapv5.LendingSwapper);

export const safeAutomation: Handler<RequestParms> = async (event, context) => {
  const { account } = event.pathParameters;
  const { leverageTokenAddress, deleverageTokenAddress, healthRate } =
    event.body;

  const chainId = 137;
  const protocolId = "aave-v3";
  const marketId = "polygon";

  const adapter = new lending.Adapter(chainId);

  const portfolio = await adapter.getPortfolio(account, protocolId, marketId);

  let leverageToken, deleverageToken;
  const currentHealthRate = Number(portfolio.healthRate);

  try {
    leverageToken = getTokenByAddress(leverageTokenAddress);
    deleverageToken = getTokenByAddress(deleverageTokenAddress);
  } catch (error) {
    return { statusCode: 400, body: error };
  }

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
      return { statusCode: 400, body: "do nothing" };
    }
    adjustResult = portfolio.adjustHealthRate({
      leverageToken,
      deleverageToken,
      targetHealthRate: _healthRate,
    });
  }

  if (isError(adjustResult))
    return { statusCode: 400, body: adjustResult.error };

  const { operation, srcToken, srcAmount, destToken } = adjustResult;
  const leveragInfo = await adapter[operation]({
    account,
    portfolio,
    srcToken,
    srcAmount,
    destToken,
  });

  const { destAmount } = leveragInfo;

  const _destAmount = new BigNumber(destAmount)
    .div(1.0009)
    .toFixed(destToken.decimals, 1);

  const provider = new ethers.providers.JsonRpcProvider(RPC_PROVIDER);
  const signer = new ethers.Wallet(KEY, provider);
  const pluginAddress = "0x2409925d78E890E369df21541Cebd65afA3Db1cD";
  const safeProtocolManger = "0xa4C167816e54b013E02EEAcD858f45849eB54563";
  const iface = new Interface(SafePluginABI);
  // const contract = new Contract(pluginAddress, iface, signer);

  // console.log(
  //   "args :>> ",
  //   JSON.stringify(
  //     [
  //       safeProtocolManger,
  //       account,
  //       srcToken.address,
  //       destToken.address,
  //       new BigNumber(destAmount)
  //         .times(new BigNumber(10).pow(destToken.decimals))
  //         .toFixed(),
  //       operation === "leverageLong",
  //     ],
  //     null,
  //     2
  //   )
  // );

  // const gasPrice = await provider.getGasPrice();
  // const maxPriorityFeePerGas = gasPrice.mul(110).div(100);
  // const maxFeePerGas = gasPrice.mul(2);

  const txData = iface.encodeFunctionData("executeFromPlugin", [
    safeProtocolManger,
    account,
    srcToken.address,
    destToken.address,
    new BigNumber(destAmount)
      .times(new BigNumber(10).pow(destToken.decimals))
      .toFixed(),
    operation === "leverageLong",
  ]);

  // const tx = await contract.executeFromPlugin(
  //   safeProtocolManger,
  //   account,
  //   srcToken.address,
  //   destToken.address,
  //   new BigNumber(destAmount)
  //     .times(new BigNumber(10).pow(destToken.decimals))
  //     .toFixed(),
  //   operation === "leverageLong",
  //   {
  //     maxPriorityFeePerGas,
  //     maxFeePerGas,
  //   }
  // );

  return {
    statusCode: 200,
    body: {
      to: pluginAddress,
      data: txData,
      // tx,
      // safe: account,
      // swapToken: srcToken,
      // fAsset: destToken,
      // fAmount: _destAmount,
    },
  };
};
