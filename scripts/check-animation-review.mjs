// Build success is separate from visual release acceptance. This review must
// be replaced by evidence of a passing result before publication is allowed.
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const review=JSON.parse(await readFile('docs/animation-review.json','utf8'));
const {version}=JSON.parse(await readFile('package.json','utf8'));
const problems=[];
if(review.version!==version)problems.push('A revisão não corresponde à versão do pacote.');
for(const [file,expected]of Object.entries(review.inputs)){
 const actual=createHash('sha256').update(await readFile(file)).digest('hex');
 if(actual!==expected)problems.push(`Evidência desatualizada: ${file}`);
}
for(const key of ['heroMotion','nativeCarry','browserPlaytest','identityReferences','sourceIntegrity','automatedTests','online']){
 const check=review.checks[key];if(check?.status!=='passed')problems.push(`${key}: ${check?.reason??'sem aprovação registrada'}`);
}
if(review.status!=='approved')problems.push('A revisão visual está em HOLD.');
if(problems.length){console.error('PUBLICAÇÃO SUSPENSA\n'+problems.map(problem=>`- ${problem}`).join('\n'));process.exitCode=1;}
else console.log(`${version}: revisão de animação aprovada e fontes conferidas.`);
