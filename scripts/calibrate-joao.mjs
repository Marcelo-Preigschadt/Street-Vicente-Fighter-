import {execFileSync} from 'node:child_process';
execFileSync('python3',['scripts/build-joao.py','assets/joao-base-v1.webp','assets/joao-combat-v1.webp'],{stdio:'inherit'});
