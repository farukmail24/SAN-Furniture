/**
 * SAN Furniture - Zero-Dependency TypeScript Runtime Stub
 * For production deployment on cPanel / LiteSpeed / Phusion Passenger.
 *
 * Prevents Next.js runtime crashes when compiling configs or checking TS preflights
 * without requiring the heavy (70MB+) typescript package in production node_modules.
 */

const noop = () => {};

module.exports = {
  version: "5.6.3",
  findConfigFile: () => undefined,
  readConfigFile: () => ({ config: {} }),
  parseJsonConfigFileContent: () => ({
    options: {},
    fileNames: [],
    errors: [],
  }),
  formatDiagnosticsWithColorAndContext: () => "",
  flattenDiagnosticMessageText: () => "",
  sys: {
    fileExists: () => false,
    readFile: () => "",
    directoryExists: () => false,
    getCurrentDirectory: () => process.cwd(),
    getDirectories: () => [],
    newLine: "\n",
    useCaseSensitiveFileNames: false,
    write: noop,
  },
};
