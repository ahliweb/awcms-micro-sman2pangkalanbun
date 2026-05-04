import { join, resolve } from "node:path";

export const SERVER_INFO_PATH = resolve(join(process.cwd(), ".e2e", "emdash-pw-server.json"));
