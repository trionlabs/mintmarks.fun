/**
 * Type declarations for ZK libraries without TypeScript support
 */

declare module '@zk-email/zkemail-nr' {
  export interface EmailVerifierInputs {
    header: unknown
    pubkey: unknown
    signature: unknown
  }

  export interface DKIMVerificationResult {
    headers: Buffer
    domain?: string
  }

  export function generateEmailVerifierInputs(
    email: Uint8Array,
    options?: { maxHeadersLength?: number; ignoreBodyHashCheck?: boolean }
  ): Promise<EmailVerifierInputs>

  export function verifyDKIMSignature(
    email: Uint8Array,
    domain?: string,
    selector?: string,
    includeHeaders?: boolean
  ): Promise<DKIMVerificationResult>
}

declare module '@aztec/bb.js' {
  export class UltraHonkBackend {
    constructor(bytecode: string)
    generateProof(
      witness: unknown,
      options?: { keccak?: boolean }
    ): Promise<{ proof: Uint8Array; publicInputs: string[] }>
    destroy(): Promise<void>
  }
}

declare module '@noir-lang/noir_js' {
  export class Noir {
    constructor(circuit: Record<string, unknown>)
    execute(inputs: Record<string, unknown>): Promise<{
      witness: unknown
      returnValue: unknown[]
    }>
  }
}

declare module '@noir-lang/acvm_js/web' {
  const init: (wasmPath: URL) => Promise<void>
  export default init
}

declare module '@noir-lang/noirc_abi/web' {
  const init: (wasmPath: URL) => Promise<void>
  export default init
}

declare module '@zkpassport/sdk' {
  export interface ZKPassportRequestOptions {
    name: string
    logo: string
    purpose: string
    scope: string
    mode: string
    devMode?: boolean
  }

  export interface ZKPassportQueryBuilder {
    gte(field: string, value: number): ZKPassportQueryBuilder
    bind(field: string, value: string): ZKPassportQueryBuilder
    done(): {
      url: string
      onProofGenerated: (callback: (proof: unknown) => void) => void
      onResult: (callback: (result: { verified: boolean; uniqueIdentifier?: string }) => void) => void
    }
  }

  export class ZKPassport {
    constructor(domain: string)
    request(options: ZKPassportRequestOptions): Promise<ZKPassportQueryBuilder>
    getSolidityVerifierParameters(options: {
      proof: unknown
      scope: string
      devMode?: boolean
    }): unknown
  }
}

declare module 'qrcode.react' {
  import { FC, SVGProps } from 'react'

  export interface QRCodeSVGProps extends SVGProps<SVGSVGElement> {
    value: string
    size?: number
    level?: 'L' | 'M' | 'Q' | 'H'
    marginSize?: number
    bgColor?: string
    fgColor?: string
  }

  export const QRCodeSVG: FC<QRCodeSVGProps>
  export const QRCodeCanvas: FC<QRCodeSVGProps>
}



