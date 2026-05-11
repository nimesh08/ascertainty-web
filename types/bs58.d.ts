declare module "bs58" {
  const bs58: {
    encode(source: Uint8Array | Buffer | number[]): string;
    decode(str: string): Buffer;
    decodeUnsafe(str: string): Buffer | undefined;
  };
  export default bs58;
}
