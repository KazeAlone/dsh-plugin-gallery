import * as mcpClient from '@deepseek-ai/dsh-mcp-client';
import { resolveMcpConfig } from './mcp-config.mjs';

/** Keep official DSH MCP plugin instances in sync with Gallery's saved resources. */
export class GalleryMcpRuntime {
  constructor(ctx, store) {
    this.ctx = ctx;
    this.store = store;
    this.active = new Map();
    this.connecting = new Set();
    this.pending = Promise.resolve();
  }
  refresh() {
    this.pending = this.pending.catch(() => {}).then(() => this.sync());
    return this.pending;
  }
  async sync() {
    const resources = this.store.adapter().read().resources.filter(r => r.type === 'mcp');
    const wanted = new Map(resources.map(r => [r.id, r]));
    for (const [id, current] of this.active) {
      const resource = wanted.get(id);
      if (resource && JSON.stringify(resource.metadata?.mcp) === current.serialized) continue;
      await current.fiber.dispose();
      this.active.delete(id);
    }
    for (const resource of resources) {
      if (this.active.has(resource.id)) continue;
      const serialized = JSON.stringify(resource.metadata?.mcp);
      try {
        const safe = resolveMcpConfig(resource.metadata?.mcp);
        const config = safe.transport === 'stdio'
          ? { transport: safe.transport, serverName: safe.serverName, command: safe.command, args: safe.args, cwd: safe.cwd, env: safe.env }
          : { transport: safe.transport, serverName: safe.serverName, url: safe.url, headers: safe.headers };
        this.connecting.add(safe.serverName);
        try {
          const fiber = await this.ctx.plugin(mcpClient, config);
          this.active.set(resource.id, { serialized, fiber, serverName: safe.serverName });
        } finally {
          this.connecting.delete(safe.serverName);
        }
      } catch (error) {
        this.ctx.logger?.warn?.(`gallery: MCP ${resource.id} could not activate: ${error.message}`);
      }
    }
  }
  ownsServer(name) {
    return this.connecting.has(name) || [...this.active.values()].some(entry => entry.serverName === name);
  }
  ownsTool(name) {
    return [...this.connecting, ...Array.from(this.active.values(), entry => entry.serverName)]
      .some(serverName => name.startsWith(`mcp__${serverName}__`));
  }
  resourceForTool(name) {
    const matches = [...this.active].filter(([, entry]) =>
      name.startsWith(`mcp__${entry.serverName}__`),
    );
    return matches.length === 1 ? matches[0][0] : undefined;
  }
  async dispose() {
    await this.pending.catch(() => {});
    for (const { fiber } of this.active.values()) await fiber.dispose();
    this.active.clear();
  }
}
