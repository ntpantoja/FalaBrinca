import json, pathlib
root=pathlib.Path(__file__).resolve().parents[1]
data={
'animals': '''fazenda|Amigos da fazenda|VACA=🐮;PORCO=🐷;GALINHA=🐔
mata|Passeio pela mata|MACACO=🐒;TIGRE=🐯;URSO=🐻
mar|Amigos do mar|POLVO=🐙;GOLFINHO=🐬;BALEIA=🐳
jardim|Bichinhos do jardim|BORBOLETA=🦋;ABELHA=🐝;CARACOL=🐌
aves|Quem tem asas?|CORUJA=🦉;PAPAGAIO=🦜;PINGUIM=🐧
pets|Amigos de casa|GATO=🐱;COELHO=🐰;HAMSTER=🐹
savana|Passeio na savana|ZEBRA=🦓;GIRAFA=🦒;ELEFANTE=🐘
lago|Vida no lago|SAPO=🐸;TARTARUGA=🐢;PATO=🦆
pequenos|Pequenos exploradores|JOANINHA=🐞;FORMIGA=🐜;GRILO=🦗''',
'foods': '''fruteira|A fruteira colorida|MAÇÃ=🍎;BANANA=🍌;UVA=🍇
almoco|Vamos almoçar?|ARROZ=🍚;FRANGO=🍗;SALADA=🥗
legumes|Cesta de legumes|CENOURA=🥕;MILHO=🌽;BRÓCOLIS=🥦
lanche|Lanche da tarde|PÃO=🍞;QUEIJO=🧀;OVO=🥚
pomar|Passeio no pomar|PERA=🍐;LARANJA=🍊;PÊSSEGO=🍑
verdes|Verdinhos no prato|PEPINO=🥒;ALFACE=🥬;ERVILHA=🫛
redondas|Frutinhas redondas|MELANCIA=🍉;MELÃO=🍈;CEREJA=🍒
tigelas|Comida na tigela|SOPA=🍲;MACARRÃO=🍝;BATATA=🥔
tropicais|Sabores tropicais|ABACAXI=🍍;MANGA=🥭;COCO=🥥''',
'objects': '''brinquedos|Caixa de brinquedos|BOLA=⚽;URSO DE PELÚCIA=🧸;PIPA=🪁
escola|Minha mochila|LÁPIS=✏️;LIVRO=📚;MOCHILA=🎒
cozinha|Objetos da cozinha|COLHER=🥄;PRATO=🍽️;COPO=🥛
roupinhas|Vamos nos vestir?|CAMISETA=👕;CALÇA=👖;VESTIDO=👗
banheiro|Hora do cuidado|ESCOVA DE DENTES=🪥;SABÃO=🧼;ESPONJA=🧽
quarto|Meu quarto|CAMA=🛏️;CADEIRA=🪑;LUMINÁRIA=💡
musica|Vamos fazer música?|TAMBOR=🥁;VIOLÃO=🎸;PIANO=🎹
acessorios|Prontos para sair|BONÉ=🧢;SAPATO=👟;ÓCULOS=👓
casinha|Coisas da casinha|PORTA=🚪;CHAVE=🔑;RELÓGIO=⏰''',
'colors': '''quadrados|Quadrados coloridos|VERMELHO=🟥;AZUL=🟦;AMARELO=🟨
coracoes|Corações coloridos|VERDE=💚;ROXO=💜;LARANJA=🧡
circulos|Bolinhas coloridas|AZUL=🔵;VERMELHO=🔴;VERDE=🟢
frutascores|As cores das frutas|MAÇÃ VERMELHA=🍎;BANANA AMARELA=🍌;UVA ROXA=🍇
vegetaiscores|As cores da horta|CENOURA LARANJA=🥕;BRÓCOLIS VERDE=🥦;MILHO AMARELO=🌽
quadradosnovos|Mais quadrados coloridos|ROXO=🟪;LARANJA=🟧;MARROM=🟫
coracoesnovos|Cores para compartilhar|ROSA=🩷;AZUL CLARO=🩵;BRANCO=🤍
bolinhasnovas|Mais bolinhas coloridas|AMARELO=🟡;ROXO=🟣;LARANJA=🟠
claroseescuros|Claro e escuro|PRETO=⚫;BRANCO=⚪;MARROM=🟤''',
'emotions': '''carinhas|Como está a carinha?|FELIZ=😊;TRISTE=😢;BRAVO=😠
surpresas|Uma surpresa no rosto|SURPRESO=😮;ASSUSTADO=😨;TRANQUILO=😌
sono|O corpo pede descanso|COM SONO=🥱;DORMINDO=😴;ACORDADO=🙂
risadas|Hora de dar risada|RINDO=😄;CHORANDO=😭;SORRINDO=😀
carinho|Carinhas de carinho|MANDANDO BEIJO=😘;ABRAÇANDO=🤗;ENCANTADO=😍
curiosos|Carinhas curiosas|PENSATIVO=🤔;CURIOSO=🧐;CONFUSO=😕
animados|Muita animação|EMPOLGADO=🤩;FESTEJANDO=🥳;Satisfeito=😋
cansados|Precisando de uma pausa|CANSADO=😩;PREOCUPADO=😟;ALIVIADO=😮‍💨
timidez|Jeitos de se expressar|TÍMIDO=🫣;COM VERGONHA=😳;PISCANDO=😉''',
'transports': '''rua|Passeio pela rua|CARRO=🚗;ÔNIBUS=🚌;BICICLETA=🚲
ajuda|Veículos que ajudam|AMBULÂNCIA=🚑;CARRO DE POLÍCIA=🚓;CAMINHÃO DE BOMBEIROS=🚒
agua|Passeio na água|BARCO=⛵;CANOA=🛶;NAVIO=🚢
ceu|Viagem pelo céu|AVIÃO=✈️;HELICÓPTERO=🚁;FOGUETE=🚀
trabalho|Veículos do trabalho|TRATOR=🚜;CAMINHÃO=🚚;CAMINHONETE=🛻
rodinhas|Brincando sobre rodas|PATINETE=🛴;SKATE=🛹;PATINS=🛼
trilhos|Passeio nos trilhos|TREM=🚂;METRÔ=🚇;BONDE=🚋
cidade|Movimento na cidade|TÁXI=🚕;MOTO=🏍️;VAN=🚐
viagens|Novos caminhos|LANCHA=🚤;TELEFÉRICO=🚠;TREM RÁPIDO=🚄''',
'actions': '''movimento|Vamos nos movimentar?|CORRER=🏃;ANDAR=🚶;NADAR=🏊
maos|O que as mãos fazem?|BATER PALMAS=👏;DAR TCHAU=👋;ACENAR COM AS DUAS MÃOS=🙌
rotina|Ações da rotina|DORMIR=😴;TOMAR BANHO=🛀;ESCOVAR OS DENTES=🪥
brincar|Brincadeiras com o corpo|DANÇAR=💃;PEDALAR=🚴;JOGAR BOLA=⛹️
cuidar|Cuidando da casa|VARRER=🧹;REGAR=🚿;COZINHAR=🧑‍🍳
expressar|Meu rosto se movimenta|SORRIR=😀;CHORAR=😢;PISCAR=😉
passeio|Passeando e brincando|ESCALAR=🧗;REМAR=🚣;SURFAR=🏄
ouvir|Descobrir com o corpo|OUVIR=👂;OLHAR=👀;FALAR=🗣️
relaxar|Ações para relaxar|RESPIRAR=🌬️;ABRAÇAR=🤗;DESCANSAR=🧘''',
'nature': '''jardim|Meu pequeno jardim|FLOR=🌻;ÁRVORE=🌳;FOLHA=🍃
tempo|O tempo lá fora|SOL=☀️;CHUVA=🌧️;NUVEM=☁️
noite|O céu da noite|LUA=🌙;ESTRELA=⭐;PLANETA=🪐
agua|Lugares com água|MAR=🌊;PRAIA=🏖️;GELO=🧊
plantas|Plantas diferentes|CACTO=🌵;PALMEIRA=🌴;PINHEIRO=🌲
flores|Um jardim de flores|ROSA=🌹;TULIPA=🌷;HIBISCO=🌺
paisagens|Explorando paisagens|MONTANHA=⛰️;ILHA=🏝️;VULCÃO=🌋
ceucores|Cores no céu|ARCO-ÍRIS=🌈;RELÂMPAGO=⚡;NEVE=❄️
sementes|Da semente à planta|BROTO=🌱;TRIGO=🌾;TREVO=☘️'''
}
# Names are spoken, never required as visible reading.
packs=[]; metadata=[]; puzzle_entries=[]; memory_entries=[]
colors=['mint','peach','lavender','sky','butter']; backgrounds=['#d5f6ec','#ffe4d9','#eedeff','#dceeff','#fff0b8']
assets=root/'public/puzzles';assets.mkdir(parents=True,exist_ok=True)
for ci,(category,lines) in enumerate(data.items()):
 groups=[]
 for gi,line in enumerate(lines.splitlines()):
  slug,title,words=line.split('|'); items=[]
  for wi,pair in enumerate(words.split(';')):
   name,emoji=pair.split('=');name=name.upper().replace('М','M')
   image=f'/puzzles/{category}-{slug}-{wi}.svg'
   bg=backgrounds[(ci+gi+wi)%5]
   svg=f'''<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400"><rect width="400" height="400" rx="32" fill="{bg}"/><circle cx="42" cy="42" r="28" fill="#ffffff" opacity=".8"/><path d="M325 18 345 50 380 40 364 75 383 101 347 98 327 127 319 91 286 80 315 61Z" fill="#fff" opacity=".65"/><path d="M0 313Q90 262 178 328T400 300V400H0Z" fill="#fff" opacity=".65"/><circle cx="338" cy="344" r="25" fill="#8050e3" opacity=".18"/><circle cx="56" cy="347" r="14" fill="#36b9a4" opacity=".35"/><text x="200" y="258" text-anchor="middle" font-size="215" font-family="Noto Color Emoji,Apple Color Emoji,Segoe UI Emoji,sans-serif">{emoji}</text></svg>'''
   (root/'public'/image.lstrip('/')).write_text(svg)
   items.append({'name':name,'emoji':emoji,'image_url':image})
  id=f'figuras-{category}-{slug}';pack={'id':id,'title':title,'category':category,'items':items};packs.append(pack);groups.append(pack)
  metadata.append({'id':id,'title':title,'description':'Ouça a palavra, repita e encontre o desenho.','emoji':items[0]['emoji'],'color':colors[(ci+gi)%5],'kind':'figures','category':category,'difficulty':'beginner','minutes':3})
  if gi<3:
   pid=f'quebra-cabeca-{category}-{slug}'
   metadata.append({'id':pid,'title':f'Quebra-cabeça: {title[0].lower()+title[1:]}','description':'Monte três desenhos arrastando quatro peças, sem pressa.','emoji':'🧩','color':colors[(ci+gi)%5],'kind':'puzzle','category':category,'difficulty':'beginner','minutes':3})
   puzzle_entries.append({'id':pid,'items':items})
 mid=f'memoria-{category}'
 metadata.append({'id':mid,'title':f'Memória: { {"animals":"bichinhos","foods":"comidinhas","objects":"objetos","colors":"cores","emotions":"carinhas","transports":"veículos","actions":"ações","nature":"natureza"}[category]}','description':'Vire as cartas, ouça os nomes e encontre os pares de desenhos.','emoji':'🃏','color':colors[ci%5],'kind':'memory','category':category,'difficulty':'intermediate','minutes':3})
 memory_entries.append({'id':mid,'groups':[g['items'] for g in groups[:3]]})
def dump(v):return json.dumps(v,ensure_ascii=False,indent=2)
(root/'lib/expanded-catalog.ts').write_text('import type { Adventure } from "./catalog";\n// Metadata only: paid rounds remain in the server-only module.\nexport const expandedCatalog: Adventure[] = '+dump(metadata)+';\n')
(root/'lib/expanded-content.ts').write_text('''import "server-only";
import type { ActivityContent, Choice } from "./catalog";
const packs = '''+dump(packs)+''';
const puzzles = '''+dump(puzzle_entries)+''';
const memories = '''+dump(memory_entries)+''';
const identify = (items: Choice[]) => items.map((target, index) => ({ prompt: `Encontre ${target.name.toLowerCase()}.`, hint: "Ouça, repita se quiser e toque no desenho. Sem cobrança de pronúncia.", answer: target.name, choices: [...items.slice(index), ...items.slice(0,index)] }));
export const expandedContent: Record<string, ActivityContent> = Object.fromEntries([
 ...packs.map((p) => [p.id, { id:p.id, rounds:identify(p.items) }]),
 ...puzzles.map((p) => [p.id, { id:p.id, rounds:p.items.map((target) => ({ prompt:`Vamos montar ${target.name.toLowerCase()}?`, hint:"Arraste cada peça até o espaço correspondente. Também é possível tocar na peça e no espaço.", answer:target.name, choices:[target] })) }]),
 ...memories.map((p) => [p.id, { id:p.id, rounds:p.groups.map((items) => ({ prompt:"Vamos encontrar os pares?", hint:"Toque em duas cartas. Ouça os nomes e encontre os desenhos iguais.", answer:items[0].name, choices:items })) }]),
]);
''')
print({'new_activities':len(metadata),'total_activities':27+len(metadata),'illustrations':len(list(assets.glob('*.svg')))})
