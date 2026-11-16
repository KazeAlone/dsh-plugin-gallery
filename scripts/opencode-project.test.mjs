import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, readFile, writeFile, rm, mkdir, symlink } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { openCodeFiles } from '../lib/opencode-export.js'
import { writeOpenCodeProject } from '../lib/opencode-project.js'
const team = { id:'export-test', name:'Example', members:[], tasks:[{id:'a', subject:'Test', description:'Build', dependencies:[],status:'pending'}] }
test('project output matches ZIP files byte for byte and supports safe retries', async () => {
 const root=await mkdtemp(join(tmpdir(),'teamflow-export-'))
 try {
  const pack=openCodeFiles(team),result=await writeOpenCodeProject(root,team)
  assert.equal(result.name,pack.name)
  for(const [path,value] of Object.entries(pack.files)) assert.equal(await readFile(join(root,path),'utf8'),value)
  await writeFile(join(root,'teamflow',pack.name,'progress.md'),'keep run')
  await writeOpenCodeProject(root,team)
  assert.equal(await readFile(join(root,'teamflow',pack.name,'progress.md'),'utf8'),'keep run')
 } finally { await rm(root,{recursive:true,force:true}) }
})
test('a conflicting export is rejected before any new package files are written', async () => {
 const root=await mkdtemp(join(tmpdir(),'teamflow-export-'))
 try {
  const pack=openCodeFiles(team),dir=join(root,'teamflow',pack.name)
  await mkdir(dir,{recursive:true});await writeFile(join(dir,'README.md'),'user changes')
  await assert.rejects(writeOpenCodeProject(root,team),/已有同名/)
  assert.equal(await readFile(join(dir,'README.md'),'utf8'),'user changes')
  await assert.rejects(readFile(join(root,'.opencode','commands',pack.name+'.md')), {code:'ENOENT'})
 } finally { await rm(root,{recursive:true,force:true}) }
})

test('project export rejects directory links without writing outside the workspace', async () => {
 const root=await mkdtemp(join(tmpdir(),'teamflow-export-')),outside=await mkdtemp(join(tmpdir(),'teamflow-outside-'))
 try {
  await symlink(outside,join(root,'.opencode'),process.platform==='win32'?'junction':'dir')
  await assert.rejects(writeOpenCodeProject(root,team),/链接/)
  await assert.rejects(readFile(join(outside,'commands',openCodeFiles(team).name+'.md')), {code:'ENOENT'})
 } finally { await rm(root,{recursive:true,force:true});await rm(outside,{recursive:true,force:true}) }
})
