import { AdjustHealthRateOutput } from '@weizard/protocolink-lending';

export const KEY = process.env.EXECUTOR_PRIVATE_KEY!;
export const PROTOCOLINK_ROUTER = '0xDec80E988F4baF43be69c13711453013c212feA8';
export const DELEGATEDD = '0x4C256312B26956ebA6A705134AC8ff2bAe398335';
export const RPC_PROVIDER = 'https://polygon-mainnet.g.alchemy.com/v2/IvynBlTdfqkjaKR0ZHJkkrdYGZlie8As';

export function isError(result: AdjustHealthRateOutput): result is { error: string } {
  return (result as { error: string }).error !== undefined;
}
