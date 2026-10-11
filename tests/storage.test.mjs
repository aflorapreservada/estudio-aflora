import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';

const project = 'https://example.supabase.co';
function compile(file, imports = {}) {
  let source = fs.readFileSync(file, 'utf8').replaceAll('import.meta.env.VITE_SUPABASE_URL', JSON.stringify(project));
  const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const exports = {};
  new Function('require', 'exports', js)(name => imports[name], exports);
  return exports;
}
const paths = compile('supabase/functions/_shared/storage-path.ts');
test('permanent paths preserve case; old signed URLs recover bucket and decoded path', () => {
  assert.deepEqual(paths.storageReference('/modelos-referencias/Jade.png', 'modelos-referencias', project), { bucket: 'modelos-referencias', path: 'Jade.png' });
  assert.deepEqual(paths.storageReference(`${project}/storage/v1/object/sign/pecas-fotos/user/Pe%C3%A7a.png?token=expired`, 'geracoes-imagens', project), { bucket: 'pecas-fotos', path: 'user/Peça.png' });
  assert.equal(paths.storageReference('https://other.test/storage/v1/object/sign/pecas-fotos/file', 'pecas-fotos', project), null);
  assert.throws(() => paths.storageReference('../secret', 'pecas-fotos', project));
});
function setup(handler) {
  const calls = [];
  let account = 'user-a';
  let authChange;
  const supabase = {
    auth: { onAuthStateChange(fn) { authChange = fn; }, async getSession() { return { data: { session: account ? { user: { id: account } } : null } }; } },
    storage: { from(bucket) { return { async createSignedUrl(path, duration) { calls.push({ bucket, path, duration }); return handler(bucket, path, calls.length); } }; } },
  };
  const storage = compile('src/lib/storage.ts', { '@/lib/supabase': { supabase }, '../../supabase/functions/_shared/storage-path': paths });
  return { storage, calls, changeAccount(value) { account = value; authChange(); } };
}
test('renewal, cache, deduplication and account isolation', async () => {
  const { storage, calls, changeAccount } = setup(async (_, __, n) => ({ data: { signedUrl: `signed-${n}` }, error: null }));
  const first = await Promise.all([storage.resolveImageUrl('pecas-fotos', 'user-a/a.png'), storage.resolveImageUrl('pecas-fotos', 'user-a/a.png')]);
  assert.deepEqual(first, ['signed-1', 'signed-1']);
  assert.equal(await storage.resolveImageUrl('pecas-fotos', 'user-a/a.png'), 'signed-1');
  assert.equal(await storage.resolveImageUrl('pecas-fotos', 'user-a/a.png', null, true), 'signed-2');
  changeAccount('user-b');
  assert.equal(await storage.resolveImageUrl('pecas-fotos', 'user-a/a.png'), 'signed-3');
  changeAccount(null);
  await assert.rejects(storage.resolveImageUrl('pecas-fotos', 'user-a/a.png'), /login/);
  assert.equal(calls.length, 3);
});
test('legacy generated files remain readable in original bucket without uploads', async () => {
  const { storage, calls } = setup(async bucket => bucket === 'pecas-fotos' ? { data: { signedUrl: 'legacy-renewed' }, error: null } : { data: null, error: { message: 'Object not found' } });
  assert.equal(await storage.resolveImageUrl('geracoes-imagens', 'user/peca/old.png'), 'legacy-renewed');
  assert.deepEqual(calls.map(c => c.bucket), ['geracoes-imagens', 'pecas-fotos']);
});
test('storage denial exposes actionable diagnostics instead of expired URL fallback', async () => {
  const { storage } = setup(async () => ({ data: null, error: { message: 'Object not found' } }));
  await assert.rejects(storage.resolveImageUrl('modelos-referencias', 'Jade.png', 'old-url'), /modelos-referencias\/Jade.png.*Object not found/);
});

test('URLs renew before expiration and local legacy assets remain usable', async () => {
  const { storage, calls } = setup(async (_, __, n) => ({ data: { signedUrl: `signed-${n}` }, error: null }));
  const originalNow = Date.now;
  let now = originalNow();
  Date.now = () => now;
  try {
    assert.equal(await storage.resolveImageUrl('pecas-fotos', 'user/a.png'), 'signed-1');
    now += 59 * 60 * 1000;
    assert.equal(await storage.resolveImageUrl('pecas-fotos', 'user/a.png'), 'signed-2');
    assert.equal(await storage.resolveImageUrl('modelos-referencias', null, '/images/modelos/Jade.png'), '/images/modelos/Jade.png');
    assert.equal(calls.length, 2);
  } finally { Date.now = originalNow; }
});
