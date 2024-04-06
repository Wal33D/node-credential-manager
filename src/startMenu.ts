import { checkAndGenerateEncryptionKey } from "./encryptionInit";
import { runAllTests } from "./tests/runAllTests";

runAllTests();
checkAndGenerateEncryptionKey();