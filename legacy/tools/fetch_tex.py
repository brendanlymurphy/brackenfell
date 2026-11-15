#!/usr/bin/env python3
# Downloads the selected CC0 source textures (file names taken from the repos' own listings) and writes a provenance record.
import os, sys, subprocess, json, urllib.parse
out = sys.argv[1]; trees = sys.argv[2]
RAW = 'https://raw.githubusercontent.com/'
def tree(n): return set(open(os.path.join(trees, n + '.txt'), encoding='utf8', errors='replace').read().split('\n'))
jobs = []   # (group, repo, branch, path, provenance)
sr = tree('stuntrally__stuntrally3')
sr_names = '''grass_green grass_green2y grass_ground grass_mix grass_rocky grass_autumn grass_autumn_orn moss_plants moss_ground ground_leaves ground_ferns ground_mud ground_mud2 ground_mud3 ground_dirty ground_dry ground_dry2 ground_white stones_gray stones_brown stones_color mntn_dark mntn_dark2 mntn_gray mntn_brown mntn_black mntn_green mntn_forest mntn_canyon mntn_x1 mntn_x2 jungle_stone jungle_mntn savanna_dry savanna_green snow1 snow2 snow_rough snow_bumpy ground_cracked ground_crackedo ground_cracks2 ground_cracks2v'''.split()
for n in sr_names:
    for suf in 'dnsh':
        p = f'data/textures/terrain/{n}_{suf}.jpg'
        if p in sr: jobs.append(('sr3', 'stuntrally/stuntrally3', 'main', p, 'Stunt Rally 3 terrain set: Nobiax/yughues "Free tiling textures pack" (CC0), edited by CryHam (CC0); mntn_dark2/ground_mud3/ground_dirty from ambientCG (CC0); snow1/snow2/snow_rough/snow_bumpy/ground_cracks from rubberduck "50 free textures" (CC0). See data/textures/terrain/_terrain.txt'))
for n in ['grass2','grass3','grass5','grass10','grass15','grass17','grass19','grass20','grassForest','flower01','flower01b','flower02']:
    p = f'data/textures/grass/{n}.png'
    if p in sr: jobs.append(('sr3grass', 'stuntrally/stuntrally3', 'main', p, 'Stunt Rally 3 grass sprites: yughues "Plants textures Pack 01-04" (CC0), coloured by CryHam; flower01 = Poly Haven shrub_sorrel_01 (CC0), flower02 = Poly Haven dandelion_01 (CC0). See data/textures/grass/_grass.txt'))
for n in ['sparse_grass','aerial_grass_rock','dirt_aerial_02','rock_face_03','aerial_rocks_02']:
    for s in ['diff','nor']: jobs.append(('polyhaven', 'playcanvas/engine', 'main', f'examples/assets/textures/terrain/{n}_{s}_1k.jpg', 'Poly Haven texture (CC0), as shipped in the PlayCanvas engine examples'))
for n in ['rocky_trail','coast_sand_rocks_02','rock_boulder_cracked']:
    jobs.append(('polyhaven', 'playcanvas/engine', 'main', f'examples/assets/textures/{n}_diff_1k.jpg', 'Poly Haven texture (CC0), as shipped in the PlayCanvas engine examples'))
for n in ['bricks076a','ground092c']:
    for s in ['color','normal','roughness','ao','height']: jobs.append(('ambientcg_pc', 'playcanvas/engine', 'main', f'examples/assets/textures/{n}/{s}.webp', 'ambientCG material (CC0), as shipped in the PlayCanvas engine examples'))
for n in ['Moss_01','Sandy_gravel_01','Parquet_flooring_05']:
    for s in ['Color','Normal','Roughness','AO']: jobs.append(('cgbookcase', 'google/filament', 'main', f'third_party/textures/{n}/{n}_{s}.png', 'cgbookcase texture (CC0), as shipped in google/filament third_party/textures'))
jobs.append(('cgbookcase', 'google/filament', 'main', 'third_party/textures/CC0.html', 'licence note')); jobs.append(('cgbookcase', 'google/filament', 'main', 'third_party/textures/URL.txt', 'licence note'))
for n in ['wall_plaster_dirty','wall_brick']:
    for s, e in [('Color','png'),('NormalGL','jpg'),('NormalGL','png'),('Roughness','jpg'),('Roughness','png')]:
        jobs.append(('ambientcg_tls', 'itz019/tls-textures', 'main', f'{n}_{s}.{e}', 'ambientCG material (CC0), from itz019/tls-textures'))
jobs.append(('ambientcg_tls', 'itz019/tls-textures', 'main', 'README.md', 'licence note'))
for d, n in [('grass','Grass001'),('rock','Rock020'),('tiles','Tiles036'),('wood-floor-43','WoodFloor043')]:
    for s in ['Color','Normal','Roughness','AmbientOcclusion','Displacement']: jobs.append(('ambientcg_mk', 'pmndrs/market-assets', 'main', f'files/materials/{d}/{n}_1K_{s}.jpg', 'ambientCG material (CC0), from pmndrs/market-assets'))
    jobs.append(('ambientcg_mk', 'pmndrs/market-assets', 'main', f'files/materials/{d}/info.json', 'licence note'))
for n in ['ground037','rock023']:
    for s in ['alb_ht','nrm_rgh']: jobs.append(('ambientcg_t3d', 'TokisanGames/Terrain3D', 'main', f'project/demo/assets/textures/{n}_{s}.png', 'ambientCG material (CC0), packed, from TokisanGames/Terrain3D demo'))
ok = 0; rec = []
for g, repo, br, path, prov in jobs:
    dst = os.path.join(out, g, os.path.basename(path) if g not in ('ambientcg_pc','ambientcg_mk') else path.split('/')[-2] + '__' + os.path.basename(path))
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    if not os.path.exists(dst) or os.path.getsize(dst) < 200:
        url = RAW + repo + '/' + br + '/' + urllib.parse.quote(path)
        r = subprocess.run(['curl', '-sS', '-f', '-m', '90', '-o', dst, url], capture_output=True, text=True)
        if r.returncode != 0:
            if os.path.exists(dst): os.remove(dst)
            continue
    ok += 1; rec.append({'file': os.path.relpath(dst, out), 'repo': repo, 'path': path, 'provenance': prov, 'bytes': os.path.getsize(dst)})
json.dump(rec, open(os.path.join(out, 'provenance.json'), 'w'), indent=1)
print('downloaded', ok, 'of', len(jobs), 'total MB', round(sum(r['bytes'] for r in rec) / 1e6, 1))
