import { AdjustHealthRateOutput } from '@weizard/protocolink-lending';

export const KEY = process.env.EXECUTOR_PRIVATE_KEY!;
export const PROTOCOLINK_ROUTER = '0xDec80E988F4baF43be69c13711453013c212feA8';
export const DELEGATEDD = '0xBF2Be1ab6668A21880629aD6c259704fa566e349';
export const OP_DELEGATEDD = '0x372cb3E72bBbF1fF421045fa9096C4d590B2E939';
export const RPC_PROVIDER = `https://polygon-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_KEY}`;
export const OP_RPC_PROVIDER = `https://opt-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_KEY}`;

export function isError(result: AdjustHealthRateOutput): result is { error: string } {
  return (result as { error: string }).error !== undefined;
}
