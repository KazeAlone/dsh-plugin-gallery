import {
  Client,
  StreamableHTTPClientTransport,
} from "@modelcontextprotocol/client";
import { StdioClientTransport } from "@modelcontextprotocol/client/stdio";
import { resolveMcpConfig } from "./mcp-config.mjs";
/** Owner-initiated probe only; always closes the connection and child process. */
export async function checkMcpConnection(input) {
  const config = resolveMcpConfig(input);
  const client = new Client(
    { name: "dsh-plugin-gallery", version: "0.1.0" },
    { capabilities: {}, versionNegotiation: { mode: "auto" } },
  );
  const transport =
    config.transport === "stdio"
      ? new StdioClientTransport({
          command: config.command,
          args: config.args,
          cwd: config.cwd || undefined,
          env: {
            ...Object.fromEntries(
              Object.entries(process.env).filter(
                ([key]) =>
                  !/KEY|PASSWORD|SECRET|TOKEN/i.test(key) &&
                  !key.startsWith("DSH_"),
              ),
            ),
            ...config.env,
          },
        })
      : new StreamableHTTPClientTransport(new URL(config.url), {
          requestInit: { headers: config.headers },
        });
  const timeout = AbortSignal.timeout(12000);
  try {
    await client.connect(transport, { signal: timeout });
    const response = client.getServerCapabilities()?.tools
      ? await client.listTools(undefined, { signal: timeout })
      : { tools: [] };
    return {
      connected: true,
      tools: (response.tools || []).map((tool) => ({
        name: tool.name,
        description: tool.description || "",
      })),
    };
  } finally {
    await client.close().catch(() => {});
  }
}
