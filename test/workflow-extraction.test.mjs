import test from "node:test";
import assert from "node:assert/strict";
import {
  parseWorkflowAgent,
  extractWorkflowAgent,
} from "../src/workflow-extraction.mjs";
const fields = {
  name: "researcher",
  summary: "整理资料",
  role: "研究与证据核对",
  executionPrompt: "先读取资料，标注不确定性",
  specificPrompt: "",
};
test("Agent extraction validates TeamFlow fields and reuses exactly the chosen host route", async () => {
  let request;
  const llm = {
    async *stream(options) {
      request = options;
      yield { type: "text-delta", text: JSON.stringify(fields) };
    },
  };
  const agent = {
    options: { provider: "host-provider", model: "host-model" },
    ctx: { get: () => llm },
  };
  const result = await extractWorkflowAgent(
    { get: () => ({ get: () => agent }) },
    {
      type: "agent",
      name: "研究助手",
      description: "研究",
      files: [{ path: "AGENT.md", encoding: "utf8", content: "# 研究职责" }],
    },
    "session",
  );
  assert.deepEqual(result, fields);
  assert.equal(request.provider, "host-provider");
  assert.equal(request.model, "host-model");
  assert.equal(request.tools, undefined);
  assert.equal(request.messages.length, 1);
  assert.throws(
    () => parseWorkflowAgent(JSON.stringify({ ...fields, name: "bad name" })),
    /名称/,
  );
  await assert.rejects(
    () => extractWorkflowAgent({ get: () => undefined }, {}, "missing"),
    /会话/,
  );
});
