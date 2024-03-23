import { EventBody, EventPathParameters, Handler } from './types';
import { Interface } from 'ethers/lib/utils';
import { KEY, RPC_PROVIDER, isError, DELEGATEDD } from './utils';
import ProtocolinkABI from './protocolink.json';
import DelegateeABI from './delegatee.json';
import * as apisdk from '@protocolink/api';
import { ethers } from 'ethers';
import { getTokenByAddress } from './tokens';
import { PrismaClient } from '@prisma/client';
import * as lending from '@weizard/protocolink-lending';

const prismaClient = new PrismaClient();

// type RequestParms =
//   | EventPathParameters<{ account: string }> &
//       EventBody<{
//         leverageTokenAddress: string;
//         deleverageTokenAddress: string;
//         healthRate: number | [number, number]; // targetRation or [repayRatio, boostRation]
//         chainId: number;
//       }>;

type DataType = {
  targetRatio: number;
  floorRatio: number;
  ceilingRatio: number;
  deadline: number;
};

lending.Adapter.registerProtocol(lending.protocols.aavev3.LendingProtocol);
lending.Adapter.registerSwapper(lending.swappers.paraswapv5.LendingSwapper);

export const handler = async () => {
  // const { account } = event.pathParameters;
  // const { leverageTokenAddress, deleverageTokenAddress, healthRate } = event.body;
  //

  console.log('aaa');
  const protocolId = 'aave-v3';
  const marketId = 'polygon';
  const provider = new ethers.providers.JsonRpcProvider(RPC_PROVIDER);
  console.log('KEY', KEY);
  const signer = new ethers.Wallet(KEY, provider);

  const tasks = await getTasks();
  for (let task of tasks) {
    // TODO: get current ratio
    const account = task.sender;
    const chainId = task.chain_id;
    const adapter = new lending.Adapter(chainId);

    console.time('getPortfolio');
    const portfolio = await adapter.getPortfolio(account, protocolId, marketId);
    console.timeEnd('getPortfolio');

    let leverageToken, deleverageToken;
    var currentHealthRate = Number(portfolio.healthRate);
    var ceilingRatio = Number(task.ceiling_ratio / 10000);
    var floorRatio = Number(task.floor_ratio / 10000);
    var targetRatio = Number(task.target_ratio / 10000);
    console.log(`currentHealthRate:${currentHealthRate}`);
    console.log(`ceiling_ratio:${task.ceiling_ratio}`);
    console.log(`floor_ratio:${task.floor_ratio}`);
    console.log(`ceilingRatio:${ceilingRatio}`);
    console.log(`floorRatio:${floorRatio}`);
    console.log(`targetRatio:${targetRatio}`);

    // TODO: determine condition
    // currentHealthRate = currentHealthRate * 10000;
    if (currentHealthRate < ceilingRatio && currentHealthRate > floorRatio) {
      console.log('// do nothing');
      continue;
    }

    console.log('###');

    // TODO: get adjustment ratio
    try {
      console.log('task.collateral_token', task.collateral_token);
      console.log('task.borrow_token', task.borrow_token);
      leverageToken = getTokenByAddress(task.collateral_token);
      deleverageToken = getTokenByAddress(task.borrow_token);
    } catch (error) {
      console.log(error);
      return { statusCode: 400, body: error };
    }

    const adjustResult = portfolio.adjustHealthRate({
      leverageToken,
      deleverageToken,
      targetHealthRate: targetRatio,
    });
    // console.log('adjustResult', adjustResult);

    if (isError(adjustResult)) return { statusCode: 400, body: adjustResult.error };
    console.timeEnd('calcAdjustHealthRate');
    // console.log('adjustResult', adjustResult);

    console.time('buildLogic');
    const { operation, srcToken, srcAmount, destToken } = adjustResult;
    const leveragInfo = await adapter[operation]({
      account,
      portfolio,
      srcToken,
      srcAmount,
      destToken,
    });
    console.timeEnd('buildLogic');

    const routerData: apisdk.RouterData = {
      chainId,
      account,
      logics: leveragInfo.logics,
    };

    console.time('askTxData');
    const transactionRequest = await apisdk.buildRouterTransactionRequest(routerData);
    console.timeEnd('askTxData');

    console.time('adjustTxData');
    const txdataOri = transactionRequest.data;
    const iface = new Interface(ProtocolinkABI);
    const data = iface.decodeFunctionData('executeWithSignerFee', txdataOri.toString());

    const executeForWithSignerFeeData = iface.encodeFunctionData('executeForWithSignerFee', [account, ...data]);
    //   console.log(`postTxdata:${postTxdata}`);
    console.timeEnd('adjustTxData');

    console.log('executeForWithSignerFeeData', executeForWithSignerFeeData);

    // struct Task {
    //   uint256 targetRatio;
    //   uint256 floorRatio;
    //   uint256 ceilingRatio;
    //   uint256 deadline;
    // }
    let taskData: DataType = {
      targetRatio: task.target_ratio,
      floorRatio: task.floor_ratio,
      ceilingRatio: task.ceiling_ratio,
      deadline: task.deadline,
    };

    const delegateeIface = new Interface(DelegateeABI);
    // const data = DelegateeIface.decodeFunctionData('executeWithSignerFee', txdataOri.toString());

    // executeTask(address user, DataType.Task calldata task, bytes calldata taskSignature, bytes calldata data)

    const postTxdata = delegateeIface.encodeFunctionData('executeTask', [
      account,
      taskData,
      task.signature,
      executeForWithSignerFeeData,
    ]);

    console.log('postTxdata', postTxdata);

    // send transaction

    const gasPrice = await provider.getGasPrice();
    const maxPriorityFeePerGas = gasPrice.mul(110).div(100);
    const maxFeePerGas = gasPrice.mul(2);

    const tx = await signer.sendTransaction({
      to: DELEGATEDD,
      data: postTxdata,
      value: transactionRequest.value,
      gasLimit: 1800000,
      maxPriorityFeePerGas,
      maxFeePerGas,
    });

    console.log(`tx:${tx.hash}`);

    // TODO: gen tx
    // TODO: generate execute tx data
    // TODO: send tx
  }

  // const chainId = 137;
  // const protocolId = 'aave-v3';
  // const marketId = 'polygon';

  // const adapter = new lending.Adapter(chainId);

  // console.time('getPortfolio');
  // const portfolio = await adapter.getPortfolio(account, protocolId, marketId);
  // console.timeEnd('getPortfolio');

  // let leverageToken, deleverageToken;
  // const currentHealthRate = Number(portfolio.healthRate);
  // console.log(`currentHealthRate:${currentHealthRate}`);
  // try {
  //   leverageToken = getTokenByAddress(leverageTokenAddress);
  //   deleverageToken = getTokenByAddress(deleverageTokenAddress);
  // } catch (error) {
  //   return { statusCode: 400, body: error };
  // }

  // console.time('calcAdjustHealthRate');
  // let adjustResult;
  // if (typeof healthRate === 'number') {
  //   adjustResult = portfolio.adjustHealthRate({
  //     leverageToken,
  //     deleverageToken,
  //     targetHealthRate: healthRate,
  //   });
  // } else {
  //   let _healthRate = currentHealthRate;
  //   if (healthRate[1] < currentHealthRate) _healthRate = healthRate[1];
  //   else if (healthRate[0] > currentHealthRate) _healthRate = healthRate[0];
  //   else {
  //     return { statusCode: 400, body: 'do nothing' };
  //   }
  //   adjustResult = portfolio.adjustHealthRate({
  //     leverageToken,
  //     deleverageToken,
  //     targetHealthRate: _healthRate,
  //   });
  // }
  // if (isError(adjustResult)) return { statusCode: 400, body: adjustResult.error };
  // console.timeEnd('calcAdjustHealthRate');

  // console.time('buildLogic');
  // const { operation, srcToken, srcAmount, destToken } = adjustResult;
  // const leveragInfo = await adapter[operation]({
  //   account,
  //   portfolio,
  //   srcToken,
  //   srcAmount,
  //   destToken,
  // });
  // console.timeEnd('buildLogic');

  // const routerData: apisdk.RouterData = {
  //   chainId,
  //   account,
  //   logics: leveragInfo.logics,
  // };

  // console.time('askTxData');
  // const transactionRequest = await apisdk.buildRouterTransactionRequest(routerData);
  // console.timeEnd('askTxData');

  // console.time('adjustTxData');
  // const txdataOri = transactionRequest.data;
  // const iface = new Interface(ProtocolinkABI);
  // const data = iface.decodeFunctionData('executeWithSignerFee', txdataOri.toString());

  // const postTxdata = iface.encodeFunctionData('executeForWithSignerFee', [account, ...data]);
  // //   console.log(`postTxdata:${postTxdata}`);
  // console.timeEnd('adjustTxData');

  // // send transaction
  // const provider = new ethers.providers.JsonRpcProvider(RPC_PROVIDER);
  // const signer = new ethers.Wallet(KEY, provider);

  // const gasPrice = await provider.getGasPrice();
  // const maxPriorityFeePerGas = gasPrice.mul(110).div(100);
  // const maxFeePerGas = gasPrice.mul(2);

  // const tx = await signer.sendTransaction({
  //   to: transactionRequest.to,
  //   data: postTxdata,
  //   value: transactionRequest.value,
  //   gasLimit: 1800000,
  //   maxPriorityFeePerGas,
  //   maxFeePerGas,
  // });

  // console.log(`tx:${tx.hash}`);

  // return {
  //   statusCode: 200,
  //   body: {
  //     to: transactionRequest.to,
  //     data: postTxdata,
  //     value: transactionRequest.value?.toString() ?? '0',
  //   },
  // };
};

async function getTasks() {
  return await prismaClient.tasks.findMany();
}

handler();
