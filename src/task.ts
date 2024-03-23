import { EventBody, EventPathParameters, Handler } from './types';
import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();
type RequestParms =
  | EventPathParameters<{ account: string }> &
      EventBody<{
        collateral_token_address: string;
        borrow_token_address: string;
        signature: string;
        target_ratio: number;
        floor_ratio: number;
        ceiling_ratio: number;
        chain_id: number;
        deadline: number;
      }>;

export const taskAutomation: Handler<RequestParms> = async (event, context) => {
  const { account } = event.pathParameters;
  const collateralTokenAddress = event.body.collateral_token_address;
  const borrowTokenAddress = event.body.borrow_token_address;
  const signature = event.body.signature;
  const floorRatio = event.body.floor_ratio;
  const ceilingRatio = event.body.ceiling_ratio;
  const targetRatio = event.body.target_ratio;
  const chainId = event.body.chain_id;
  const deadline = event.body.deadline;

  console.log('account', account);
  console.log('collateralTokenAddress', collateralTokenAddress);
  console.log('borrowTokenAddress', borrowTokenAddress);
  console.log('signature', signature);
  console.log('targetRatio', targetRatio);
  console.log('floorRatio', floorRatio);
  console.log('ceilingRatio', ceilingRatio);
  console.log('chainId', chainId);
  console.log('deadline', deadline);

  try {
    const task = await prisma.tasks.upsert({
      where: {
        sender_collateral_token_borrow_token_chain_id: {
          sender: account,
          collateral_token: collateralTokenAddress,
          borrow_token: borrowTokenAddress,
          chain_id: chainId,
        },
      },
      update: {
        target_ratio: targetRatio,
        floor_ratio: floorRatio,
        ceiling_ratio: ceilingRatio,
        signature: signature,
        deadline: deadline,
      },
      create: {
        sender: account,
        target_ratio: targetRatio,
        floor_ratio: floorRatio,
        ceiling_ratio: ceilingRatio,
        collateral_token: collateralTokenAddress,
        borrow_token: borrowTokenAddress,
        signature: signature,
        chain_id: chainId,
        deadline: deadline,
      },
    });
    console.log(task);
  } catch (error) {
    console.log('[Error]', error?.toString() ?? error);
    return { statusCode: 500, body: error };
  }

  return {
    statusCode: 200,
    body: {},
  };
};
