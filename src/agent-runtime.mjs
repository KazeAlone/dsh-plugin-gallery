import { defineTool } from '@deepseek-ai/dsh-tools';
import { readAgent, agentIssues } from './client/agent-format.mjs';
import { materializeSkill } from './skill-provider.mjs';

export function galleryAgents(store) {
  return store.adapter().read().resources.filter(r => r.type === 'agent').flatMap(row => {
    try {
      const resource = store.getResource(row.id), parsed = readAgent(resource);
      const issues = agentIssues({ slug: parsed.slug, name: resource.name, description: parsed.description, goal: parsed.goal, instructions: parsed.instructions, files: resource.files.filter(f => !['AGENT.md', 'config.json'].includes(f.path)), config: resource.metadata?.agent?.config || {}, tags: resource.tags, error: parsed.error });
      return issues.length ? [] : [{ resource, parsed }];
    } catch { return []; }
  });
}
export function registerGalleryAgentListTool(ctx, store) {
  const list = defineTool({
    name: 'gallery_agent_list',
    description: 'List Agent personas saved in Gallery. Use gallery_agent_run to delegate a task to one.',
    parameters: {},
    output: { schema: { type: 'object', additionalProperties: false, properties: { agents: { type: 'array', required: true, items: { type: 'object', additionalProperties: false, properties: { id: { type: 'string', required: true }, name: { type: 'string', required: true }, description: { type: 'string', required: true } } } } } }, render: (_args, value) => [{ type: 'text', text: value.agents.length ? value.agents.map(a => `${a.name} (${a.id}): ${a.description}`).join('\n') : 'Gallery 中没有可用 Agent。' }] },
    async execute() { return { agents: galleryAgents(store).map(({ resource, parsed }) => ({ id: resource.id, name: resource.name, description: parsed.description })) }; },
  });
  return ctx.tools.register(list);
}
export function registerGalleryAgentRunTool(ctx, store) {
  const run = defineTool({
    name: 'gallery_agent_run',
    description: 'Start a DSH subagent using a Gallery Agent definition. Pass the Gallery Agent ID and a concrete task. The child reports back to this conversation.',
    parameters: { id: { type: 'string', required: true, description: 'Gallery Agent resource ID from gallery_agent_list.' }, task: { type: 'string', required: true, description: 'Concrete task for the child Agent.' } },
    output: { schema: { type: 'object', additionalProperties: false, properties: { child_id: { type: 'string', required: true }, agent: { type: 'string', required: true } } }, render: (_args, value) => [{ type: 'text', text: `Gallery Agent ${value.agent} 已启动，子会话 ${value.child_id}。结果会返回当前会话。` }] },
    async execute(args, exec) {
      if (!exec.agent) throw new Error('需要 DSH 会话才能调用 Gallery Agent');
      const entry = galleryAgents(store).find(({ resource }) => resource.id === args.id);
      if (!entry) throw new Error('Gallery Agent 不存在或配置无效');
      if (!args.task.trim()) throw new Error('请提供具体任务');
      if (!ctx.subagents.getProvider('spawn')) throw new Error('DSH spawn 子 Agent 服务未启用');
      const directory = materializeSkill(store.directory, entry.resource);
      const instructions = entry.resource.files.find(f => f.path === 'AGENT.md')?.content || '';
      const prompt = `请按照以下 Gallery Agent 定义执行任务。定义文件：${directory}/AGENT.md。附件位于同一目录，按需读取。\n\n${instructions}\n\n本次任务：\n${args.task.trim()}`;
      const activation = await ctx.subagents.startActivation({ provider: 'spawn', label: entry.resource.name, request: { parent: exec.agent, prompt: [{ type: 'text', text: prompt }] }, signal: exec.signal, delivery: 'parent' });
      return { child_id: activation.childId, agent: entry.resource.name };
    },
  });
  return ctx.tools.register(run);
}
export function registerGalleryAgentTools(ctx, store) {
  const offList = registerGalleryAgentListTool(ctx, store);
  const offRun = registerGalleryAgentRunTool(ctx, store);
  return () => { offRun(); offList(); };
}
