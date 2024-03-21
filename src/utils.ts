import {AdjustHealthRateOutput} from "@weizard/protocolink-lending";

export const KEY =
  "0x1fe05c3955647dc830cc2b668a917e5edbab914d84535d2637c2f930a9d668dc";

export const PROTOCOLINK_ROUTER = "0xDec80E988F4baF43be69c13711453013c212feA8";

export const RPC_PROVIDER =
  "https://polygon-mainnet.g.alchemy.com/v2/IvynBlTdfqkjaKR0ZHJkkrdYGZlie8As";

export function isError(
  result: AdjustHealthRateOutput
): result is {error: string} {
  return (result as {error: string}).error !== undefined;
}
