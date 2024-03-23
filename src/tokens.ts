import * as common from '@protocolink/common';
import opTokens from './op-tokens.json';
import polygonTokens from './polygon-tokens.json';

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

const opTokenAddressMap = Object.keys(opTokens).reduce((accmulator, key) => {
  const token = (opTokens as Record<string, Token>)[key];
  accmulator[token.address] = token;
  return accmulator;
}, {} as Record<string, Token>);

export function getTokenByAddress(address: string) {
  return new common.Token(tokenAddressMap[address]);
}

export function getOpTokenByAddress(address: string) {
  return new common.Token(opTokenAddressMap[address]);
}
