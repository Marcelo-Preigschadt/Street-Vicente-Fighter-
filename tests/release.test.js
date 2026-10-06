import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {CHARACTERS} from '../src/engine.js';
test('HTML, catálogo e módulos publicados pertencem à mesma versão sem importar código antigo',async()=>{
  const root=new URL('../',import.meta.url),{version}=JSON.parse(await readFile(new URL('package.json',root),'utf8'));
  const prefix=`releases/v${version}/`,html=await readFile(new URL('index.html',root),'utf8');
  assert.ok(html.includes(`src="${prefix}main.js"`));assert.ok(html.includes(`href="${prefix}style.css"`));
  const manifest=JSON.parse(await readFile(new URL(prefix+'manifest.json',root),'utf8'));
  assert.equal(manifest.version,version);
  for(const [file,digest]of Object.entries(manifest.files)){
    const bytes=await readFile(new URL(prefix+file,root));assert.equal(createHash('sha256').update(bytes).digest('hex'),digest);
    if(file.endsWith('.js'))for(const match of bytes.toString().matchAll(/from\s+['"]([^'"]+)['"]/g)){
      assert.match(match[1],/^\.\/[^/?]+\.js$/);assert.ok(Object.hasOwn(manifest.files,match[1].slice(2)));
    }
  }
  const published=await import(new URL(prefix+'engine.js',root));assert.deepEqual(published.CHARACTERS,CHARACTERS);
});
