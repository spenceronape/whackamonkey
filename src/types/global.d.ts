declare module '@chakra-ui/react';
declare module 'react-confetti';
declare module '@use-glyph/sdk-react';
declare module 'ethers' {
  export class Contract {
    constructor(address: string, abi: any[], signerOrProvider: any);
    startGame(options: { value: any }): Promise<any>;
    submitScore(score: number, nonce: number, signature: string): Promise<any>;
    getPrizePool(): Promise<any>;
    highScore(): Promise<any>;
    highScoreHolder(): Promise<any>;
  }
  export namespace providers {
    class Web3Provider {
      constructor(provider: any);
      getSigner(): any;
    }
    function getDefaultProvider(): any;
  }
  export namespace utils {
    function parseEther(value: string): any;
    function formatEther(value: any): string;
  }
  const ethers: {
    Contract: typeof Contract;
    providers: typeof providers;
    utils: typeof utils;
    getDefaultProvider: typeof providers.getDefaultProvider;
  };
  export { ethers };
  export default ethers;
}
declare module '*.json' {
  const value: any;
  export default value;
} 