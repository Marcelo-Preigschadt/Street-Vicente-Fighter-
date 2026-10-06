import {mkdir,readFile,readdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const {version}=JSON.parse(await readFile('package.json','utf8'));
if(!/^\d+\.\d+\.\d+$/.test(version))throw Error('Versão inválida para publicação.');
const directory=`releases/v${version}`;await mkdir(directory,{recursive:true});
const manifest={version,files:{}};
for(const file of (await readdir('src')).filter(file=>file.endsWith('.js')).sort()){
  // Every relative module resolves inside one immutable release namespace.
  const source=(await readFile(`src/${file}`,'utf8')).replace(/((?:from\s*|import\s*\(?\s*)['"][^'"]+)\?v=\d+(['"])/g,'$1$2');
  await writeFile(`${directory}/${file}`,source);
  manifest.files[file]=createHash('sha256').update(source).digest('hex');
}
const css=await readFile('style.css');await writeFile(`${directory}/style.css`,css);
manifest.files['style.css']=createHash('sha256').update(css).digest('hex');
await writeFile(`${directory}/manifest.json`,JSON.stringify(manifest,null,2)+'\n');
let html=await readFile('index.html','utf8');
html=html.replace(/src="(?:src|releases\/v[\d.]+)\/main\.js(?:\?v=\d+)?"/,`src="${directory}/main.js"`)
  .replace(/href="(?:releases\/v[\d.]+\/)?style\.css(?:\?v=\d+)?"/,`href="${directory}/style.css"`)
  .replace(/data-game-version="[\d.]+"/,`data-game-version="${version}"`);
await writeFile('index.html',html);console.log(`${version}: ${Object.keys(manifest.files).length} arquivos publicados juntos.`);
