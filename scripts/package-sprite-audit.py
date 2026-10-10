"""Package review sheets; runtime/source art stays lossless and untouched."""
from pathlib import Path
from PIL import Image, ImageDraw
import json, html, shutil, subprocess, sys
ROOT=Path(__file__).resolve().parents[1]
BEFORE=Path(sys.argv[1]);AFTER=Path(sys.argv[2]);DEST=ROOT/'docs/sprite-audit'
DEST.mkdir(parents=True,exist_ok=True)
for name,source in [('before',BEFORE),('after',AFTER)]:
    target=DEST/name;target.mkdir(exist_ok=True)
    for p in source.glob('*.png'):
        image=Image.open(p).convert('RGB');image.save(target/(p.stem+'.webp'),quality=92,method=6)
    shutil.copy2(source/'inventory.json',target/'inventory.json')
enemy=json.loads(subprocess.check_output(['node','--input-type=module','-e','import {ENEMY_TYPES} from "./src/story-data.js";process.stdout.write(JSON.stringify(ENEMY_TYPES));'],cwd=ROOT))
old=json.loads((BEFORE/'inventory.json').read_text());new=json.loads((AFTER/'inventory.json').read_text())
old_enemies={e['kind']:e for e in old['enemies']}
for kind,p in enemy.items():
    if old_enemies[kind]['frames']:continue
    im=Image.open(ROOT/f'assets/story/enemy-{p["cell"]}.webp').convert('RGBA');s=p['h']/im.height*.8
    im=im.resize((round(im.width*s),round(im.height*s)),Image.Resampling.LANCZOS)
    board=Image.new('RGB',(600,400),'#253441');board.paste(im,((600-im.width)//2,335-im.height),im)
    ImageDraw.Draw(board).text((15,365),f'{kind}: original model / static reference',fill='#eaf4ff')
    board.save(DEST/'before'/f'enemy-{kind}.webp',quality=94)
def figure(path,label):
    return f'<figure><a href="{path}"><img src="{path}" loading="lazy" alt="{html.escape(label)}"></a><figcaption>{html.escape(label)}</figcaption></figure>'
def pair(file,label):
    a=DEST/'before'/f'{file}.webp';b=DEST/'after'/f'{file}.webp'
    return '<div class="pair">'+(figure('before/'+a.name,'Antes · '+label) if a.exists() else '<p>Este clip ainda não integrava o atlas utilizado pelo renderer.</p>')+(figure('after/'+b.name,'Depois · '+label) if b.exists() else '')+'</div>'
body='<h1>Street Vicente Fighter · Auditoria visual 4.7.0</h1><p>Branch de revisão. Pranchas de 688 quadros dos 12 lutadores, 208 quadros nativos de 13 inimigos e três mecanismos articulados. Clique na imagem para ampliar. As prévias são comprimidas; arte-fonte e atlas do jogo estão preservados.</p><p><a href="../../tests/visual-review.html">Executar combate com a engine real</a> · <a href="RELATORIO.md">Relatório e limites da verificação</a> · <a href="metrics/painted-render.json">Medição de pixels e contatos</a> · <a href="metrics/combat-render.json">Cenários de combate</a></p><p>A inspeção em Chrome da versão corrigida permanece pendente de acesso à cópia privada. Fotografias originais não estão no repositório; retratos aprovados são a referência facial.</p>'
for character in new['characters']:
    id=character['id'];body+=f'<details id="{id}"><summary>{id.title()} · {character["frames"]} quadros</summary>'
    body+='<h2>Identidade e contato no chão</h2>'+pair(id+'-identity','Retrato aprovado, postura original e postura renderizada')+pair(id+'-locomotion','Passadas reais; círculos verdes são os pés físicos')
    body+=figure('after/'+id+'-joints.webp','Juntas estimadas na arte e centros das solas medidos; não é certificação de anatomia')
    for atlas in character['atlases']:body+=f'<h2>{atlas}</h2>'+pair(id+'-'+atlas,f'{id} / {atlas} / todos os quadros')
    body+='<h2>Estados e espelhamento</h2>'+pair(id+'-states','27 estados amostrados; para transições reais, use a tela de combate')+'</details>'
body+='<h2>Os 16 modelos da campanha</h2>'
for e in new['enemies']:
    kind=e['kind'];body+=f'<details><summary>{html.escape(enemy[kind]["name"])} · {kind}</summary>'+pair('enemy-'+kind,'Arte anterior / sequência atual ou mecanismo articulado')+figure('after/enemy-'+kind+'-states.webp','Renderer real: caminhar, atacar, receber dano e derrotar; IA original')+'</details>'
body+='<h2>Cenas completas e objetos da campanha</h2><details><summary>Quatro atos e quatro chefes</summary><div class="pair">'
for kind in ['act','boss']:
    for index in range(1,5):
        file=f'campaign/svf-story-{kind}-{index}.webp'
        if (DEST/file).exists():body+=figure(file,f'Campanha / {kind} / {index} / Renderer do jogo')
body+='</div></details>'
for character in new['characters']:
    id=character['id'];body+=f'<details><summary>{id.title()} · cadeira e deslocamento</summary><div class="pair">'
    for side in ['1','-1','walk']:
        file=f'campaign/svf-carry-{id}-{side}.webp'
        if (DEST/file).exists():body+=figure(file,f'{id} / {side} / compositor real; deslocamento usa a simulação')
    body+='</div></details>'
style='body{background:#12222d;color:#edf4f7;font:16px system-ui;margin:0 auto;max-width:1500px;padding:25px}p{line-height:1.5;color:#b9ced8}a{color:#9ee2bd}h1{font-size:28px}h2{font-size:20px}.pair{display:grid;grid-template-columns:1fr 1fr;gap:15px}figure{margin:12px 0}img{display:block;width:100%;height:auto;background:#253441}figcaption{font-size:13px;color:#bfd2dc;margin-top:5px}details{padding:18px 0;border-top:1px solid #3d5565}summary{cursor:pointer;font-size:20px;font-weight:700}@media(max-width:900px){.pair{grid-template-columns:1fr}}'
(DEST/'index.html').write_text('<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Street Vicente Fighter · Evidências</title><style>'+style+'</style><main>'+body+'</main></html>')
print('Review gallery packaged at',DEST)
