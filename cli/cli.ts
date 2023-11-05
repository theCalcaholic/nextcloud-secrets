import { webcrypto } from 'crypto'
import console from "console"
import CryptoLib from "../src/crypto.js";

/**
 *
 * @param cryptomodule
 */

const cryptolib = new CryptoLib(webcrypto, true)

const privKey = await cryptolib.generateCryptoKey()
const iv = await cryptolib.generateIv()
const plaintext = 'hello world'
const payload = await cryptolib.encrypt(plaintext, privKey, iv)

