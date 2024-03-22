import * as common from "@protocolink/common";
import polygonTokens from "./polygon-tokens.json";

export type Token = {
  chainId: number;
  address: string;
  decimals: number;
  symbol: string;
  name: string;
};

const tokenAddressMap = Object.keys(polygonTokens).reduce((accmulator, key) => {
  const token = (polygonTokens as Record<string, Token>)[key];
  accmulator[token.address] = token;
  return accmulator;
}, {} as Record<string, Token>);

export function getTokenByAddress(address: string) {
  return new common.Token(tokenAddressMap[address]);
}
