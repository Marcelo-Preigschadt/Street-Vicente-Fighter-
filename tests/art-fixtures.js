import {readFileSync} from 'node:fs';
import {RUNTIME_VERSIONS} from '../src/sprite-loader.js';
export function artMetadata(id){
 const meta=JSON.parse(readFileSync(`assets/runtime/${id}-v${RUNTIME_VERSIONS[id]??1}.json`));
 const walk=JSON.parse(readFileSync(`assets/story/${id}-walk-v5.json`)).atlases.walk;
 const extras=meta.atlases.motion?.frames.slice(8)??[];
 meta.atlases.motion={scale:walk.scale,frames:[...walk.frames,...extras]};
 return meta;
}
