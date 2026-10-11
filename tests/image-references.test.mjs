import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';

// Run the production helper using the same native FormData/File APIs as fetch.
const source = fs.readFileSync('supabase/functions/_shared/image-references.ts', 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const exports = {};
new Function('exports', compiled)(exports);
const { appendImageReferences } = exports;

for (const withModelo of [false, true]) {
  test(withModelo ? 'model references use image[] in original/model order' : 'editorial keeps a single image field', async () => {
    const original = new File(['original-photo'], 'original.jpg', { type: 'image/jpeg' });
    const modelo = withModelo ? new File(['model-photo'], 'modelo.png', { type: 'image/png' }) : null;
    const formData = new FormData();
    formData.append('model', 'gpt-image-1');
    formData.append('prompt', 'existing prompt');
    appendImageReferences(formData, original, modelo);
    formData.append('n', '1');
    formData.append('size', '1024x1024');

    // Round-trip through actual multipart encoding, without making a network call.
    const request = new Request('https://api.openai.com/v1/images/edits', { method: 'POST', body: formData });
    const received = await request.formData();
    const field = withModelo ? 'image[]' : 'image';
    assert.equal(received.has(withModelo ? 'image' : 'image[]'), false);
    const images = received.getAll(field);
    assert.equal(images.length, withModelo ? 2 : 1);
    assert.deepEqual(images.map(file => file.name), withModelo ? ['original.jpg', 'modelo.png'] : ['original.jpg']);
    assert.deepEqual(images.map(file => file.type), withModelo ? ['image/jpeg', 'image/png'] : ['image/jpeg']);
    assert.deepEqual(await Promise.all(images.map(file => file.text())), withModelo ? ['original-photo', 'model-photo'] : ['original-photo']);
    assert.equal(received.get('model'), 'gpt-image-1');
    assert.equal(received.get('prompt'), 'existing prompt');
    assert.equal(received.get('n'), '1');
    assert.equal(received.get('size'), '1024x1024');
  });
}
