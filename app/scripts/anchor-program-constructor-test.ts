// @ts-nocheck
import { Program, AnchorProvider, Idl } from "@coral-xyz/anchor";
import { PublicKey, Connection } from "@solana/web3.js";
import idl from "../idl/solana_dai.json";

const provider = {} as AnchorProvider;
const programId = new PublicKey("H4TppkUN6CSgNBm4VWmccwF2UJ7qV1BpunbZV3vXkehB");

console.log("Program.length:", Program.length);
try {
  // Try (idl, provider, programId)
  new Program(idl as Idl, provider, programId);
  console.log("Order: idl, provider, programId -- OK");
} catch (e) {
  console.log("Order: idl, provider, programId -- FAIL", e);
}
try {
  // Try (idl, programId, provider)
  new Program(idl as Idl, programId, provider);
  console.log("Order: idl, programId, provider -- OK");
} catch (e) {
  console.log("Order: idl, programId, provider -- FAIL", e);
}
