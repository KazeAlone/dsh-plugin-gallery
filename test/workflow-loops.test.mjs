import test from "node:test";
import assert from "node:assert/strict";
import { readFile, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { validateWorkflowTemplate } from "../src/workflow-template.mjs";
import { workflowLoopBody } from "../src/workflow-loops.mjs";
import { publishToTeamflow } from "../src/teamflow-publish.mjs";
const fixture = JSON.parse(
  await readFile(
    new URL("./fixtures/workflow-gated.json", import.meta.url),
    "utf8",
  ),
);
const fresh = () => structuredClone(fixture);

test("gated templates preserve review, archive and portable loop settings on repeated validation", () => {
  const value = validateWorkflowTemplate(fresh());
  assert.deepEqual(value, fixture);
  assert.deepEqual(validateWorkflowTemplate(value), value);
  assert.deepEqual(workflowLoopBody(value.tasks, value.loops[0]), [
    "write",
    "verify",
  ]);
  const runtime = fresh();
  Object.assign(runtime.loops[0], {
    status: "running",
    runId: "session",
    round: 3,
    historyCount: 2,
  });
  assert.deepEqual(validateWorkflowTemplate(runtime).loops, fixture.loops);
  const long = fresh();
  long.members[0].executionPrompt = "x".repeat(64000);
  long.tasks[0].general.requirements = "x".repeat(64000);
  assert.equal(
    validateWorkflowTemplate(long).members[0].executionPrompt.length,
    64000,
  );
});
test("loops reject cycles, overlaps, invalid topology, review conflicts and unbounded execution", () => {
  const cases = [
    (v) => {
      v.tasks[0].dependencies = ["gate"];
    },
    (v) => {
      v.loops[0].entryId = "archive";
    },
    (v) => {
      v.tasks[2].checkpointKind = "acceptance";
    },
    (v) => {
      v.tasks[0].assignee = "";
    },
    (v) => {
      v.tasks[0].assignee = "captain";
    },
    (v) => {
      v.loops[0].reviewer = "writer";
    },
    (v) => {
      v.loops[0].reviewer = "missing";
    },
    (v) => {
      v.tasks[3].dependencies = ["write"];
    },
    (v) => {
      v.tasks[1].checkpoint = true;
      v.tasks[1].assignee = "";
    },
    (v) => {
      v.tasks[1].kind = "archive";
      v.tasks[1].assignee = "";
    },
    (v) => {
      v.loops.push({ ...v.loops[0] });
    },
    (v) => {
      v.loops[0].maxRounds = 0;
    },
    (v) => {
      v.loops[0].maxRounds = 21;
    },
    (v) => {
      v.loops[0].timeoutMinutes = 1441;
    },
    (v) => {
      v.tasks[3].assignee = "writer";
    },
    (v) => {
      v.tasks[3].archive.copyFiles = "yes";
    },
    (v) => {
      v.tasks[0].reviewMode = "human";
    },
    (v) => {
      v.tasks[3].archive.paths = [null];
    },
  ];
  for (const mutate of cases) {
    const input = fresh();
    mutate(input);
    assert.throws(() => validateWorkflowTemplate(input), {
      code: "INVALID_WORKFLOW",
    });
  }
});
test("human loops and disjoint loops remain valid and include finite limits", () => {
  const input = fresh();
  input.loops[0].mode = "human";
  delete input.loops[0].reviewer;
  input.tasks[2].reviewMode = "human";
  input.loops[0].rejectToEntry = false;
  const clean = validateWorkflowTemplate(input);
  assert.equal(clean.loops[0].rejectToEntry, undefined);
  const extra = fresh();
  const other = extra.tasks.map((t) => ({
    ...t,
    id: "second_" + t.id,
    dependencies: t.dependencies.map((d) => "second_" + d),
  }));
  input.tasks.push(...other);
  input.loops.push({
    ...extra.loops[0],
    gateId: "second_gate",
    entryId: "second_write",
  });
  assert.equal(validateWorkflowTemplate(input).loops.length, 2);
});
test("publishing retains gate, acceptance, archive and loop fields in each immutable TeamFlow version", async () => {
  const root = await mkdtemp(join(tmpdir(), "gallery-gated-publish-"));
  try {
    const resource = {
      id: "gated-resource",
      files: [
        {
          path: "workflow.json",
          encoding: "utf8",
          content: JSON.stringify(fixture),
        },
      ],
    };
    const first = await publishToTeamflow(resource, root),
      second = await publishToTeamflow(resource, root);
    const record = JSON.parse(
      await readFile(join(root, first.id + ".json"), "utf8"),
    );
    assert.equal(second.version, 2);
    for (const version of record.versions) {
      assert.deepEqual(version.loops, fixture.loops);
      assert.deepEqual(version.tasks, fixture.tasks);
      assert.deepEqual(version.members, fixture.members);
    }
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
test(
  "native TeamFlow main parser accepts Gallery output and all native built-in templates round-trip",
  { skip: !process.env.TEAMFLOW_SOURCE },
  async () => {
    const root = process.env.TEAMFLOW_SOURCE;
    const { parseTemplate } = await import(
      pathToFileURL(join(root, "lib/templates.js"))
    );
    const { builtinTemplates } = await import(
      pathToFileURL(join(root, "lib/builtin-templates.js"))
    );
    const { builtinLoopTemplates } = await import(
      pathToFileURL(join(root, "lib/builtin-loop-templates.js"))
    );
    for (const template of [
      fixture,
      ...builtinTemplates(),
      ...builtinLoopTemplates("en"),
    ]) {
      assert.deepEqual(
        parseTemplate(validateWorkflowTemplate(template)),
        parseTemplate(template),
        template.name,
      );
    }
  },
);
