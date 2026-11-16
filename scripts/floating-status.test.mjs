import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import ts from 'typescript'

// Exercise the production event handlers with deterministic hooks and host geometry.
function mount() {
  const slots = []; let cursor = 0, resize, cleanup
  const parent = { clientWidth: 500, clientHeight: 400 }
  const element = { offsetParent: parent, offsetWidth: 300, offsetHeight: 160 }
  const hooks = {
    useRef(value) { const i = cursor++; return slots[i] ??= { current: value } },
    useState(value) { const i = cursor++; if (!(i in slots)) slots[i] = value; return [slots[i], v => { slots[i] = typeof v === 'function' ? v(slots[i]) : v }] },
    useLayoutEffect(fn) { resize = fn },
  }
  const exports = {}
  const code = ts.transpileModule(readFileSync(new URL('../src/client/FloatingStatus.tsx', import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText
  runInNewContext(code, { exports, require: name => name === 'react' ? hooks : name === 'react/jsx-runtime' ? { jsx: (type, props) => ({type, props}), jsxs: (type, props) => ({type, props}) } : { default: {} }, ResizeObserver: class { constructor(fn) { this.fn = fn; mount.fit = fn } observe() {} disconnect() { mount.disconnected = true } } })
  let focused = false
  const render = () => { cursor = 0; const tree = exports.FloatingStatus({children:'card', t:k=>k, title:'status'}); tree.props.ref.current = element; tree.props.children[1].props.ref.current = {focus(){focused=true}}; return tree.props }
  let props = render(); cleanup = resize()
  const pointer = (x, y) => ({button:0,isPrimary:true,pointerId:1,clientX:x,clientY:y,currentTarget:{setPointerCapture(){},hasPointerCapture(){return true},releasePointerCapture(){}}})
  return {render, element, parent, pointer, cleanup, get focused(){return focused}}
}
test('minimize to a dot and restore without changing card contents; retain keyboard focus',()=>{
  const m=mount(); let p=m.render()
  p.children[1].props.onClick(); p=m.render()
  assert.equal(p['data-minimized'],true); assert.equal(p.children[0].props.hidden,true)
  assert.equal(p.children[1].props['aria-label'],'activity.restore'); assert.ok(m.focused)
  p.children[1].props.onClick(); p=m.render()
  assert.equal(p.children[0].props.hidden,false); assert.equal(p.children[0].props.children,'card')
  m.cleanup(); assert.ok(mount.disconnected)
})
test('drag clamps to host boundaries, suppresses drag clicks, and allows ordinary clicks',()=>{
  const m=mount(); let p=m.render()
  p.onPointerDown(m.pointer(100,100)); p.onPointerMove(m.pointer(-900,900)); p.onPointerUp(m.pointer(-900,900)); p=m.render()
  assert.equal(p.style.right,200); assert.equal(p.style.top,240)
  let suppressed=0; const click={detail:1,preventDefault(){suppressed++},stopPropagation(){suppressed++}}
  p.onClickCapture(click); assert.equal(suppressed,2)
  p.onPointerDown(m.pointer(10,10)); p.onPointerMove(m.pointer(12,11)); p.onPointerUp(m.pointer(12,11)); p.onClickCapture(click)
  assert.equal(suppressed,2)
})
test('restoring at an edge and shrinking the host keeps the full card reachable',()=>{
  const m=mount(); m.element.offsetWidth=28; m.element.offsetHeight=28
  let p=m.render(); p.onPointerDown(m.pointer(0,0)); p.onPointerMove(m.pointer(-800,800)); p.onPointerUp(m.pointer(-800,800))
  p=m.render(); assert.equal(p.style.right,472)
  m.element.offsetWidth=300; m.element.offsetHeight=160; mount.fit(); p=m.render()
  assert.equal(p.style.right,200); assert.equal(p.style.top,240)
  m.parent.clientWidth=250; m.parent.clientHeight=200; mount.fit(); p=m.render()
  assert.equal(p.style.right,0); assert.equal(p.style.top,40)
})
