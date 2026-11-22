import * as THREE from './vendor/three.module.js';
import {createModelKit} from './models.js';
const smallScreen=matchMedia('(max-width: 700px)').matches;const modelKit=createModelKit();
const viewport=document.querySelector('#viewport'), works=window.WORKS.filter(w=>!w.video), bridge=window.galleryBridge;
try {
const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio,smallScreen?1.15:1.6));renderer.shadowMap.enabled=true;renderer.shadowMap.autoUpdate=false;renderer.shadowMap.type=THREE.PCFShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.0;renderer.domElement.id='galleryCanvas';renderer.domElement.setAttribute('aria-hidden','true');viewport.prepend(renderer.domElement);
const scene=new THREE.Scene();scene.background=new THREE.Color('#272925');scene.fog=new THREE.Fog('#393b34',18,45);const camera=new THREE.PerspectiveCamera(44,1,.05,80);const loader=new THREE.TextureLoader();const hemi=new THREE.HemisphereLight('#ffffff','#747474',1.8);scene.add(hemi);scene.add(new THREE.AmbientLight('#eeeeee',.35));
// A small studio environment is baked once for reflections on glass and metal.
const envScene=new THREE.Scene();envScene.background=new THREE.Color('#727577');
for(const [x,y,z,w,h] of [[0,5,0,8,8],[-5,2,1,4,3],[5,2,-2,4,3]]){const panel=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({color:'#e7eaec',side:THREE.DoubleSide}));panel.position.set(x,y,z);panel.lookAt(0,0,0);envScene.add(panel)}
const pmrem=new THREE.PMREMGenerator(renderer),envTarget=pmrem.fromScene(envScene,.05,.1,30);scene.environment=envTarget.texture;scene.environmentIntensity=.42;pmrem.dispose();envScene.traverse(o=>{if(o.isMesh){o.geometry.dispose();o.material.dispose()}});

let seed=71;function rand(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296}
function texture(kind){const c=document.createElement('canvas');c.width=kind==='wood'?1024:512;c.height=512;const ctx=c.getContext('2d');ctx.fillStyle=kind==='wood'?'#818181':'#aaa79f';ctx.fillRect(0,0,c.width,c.height);if(kind==='wood'){for(let y=0;y<512;y++){const tone=105+rand()*45;ctx.strokeStyle=`rgba(${tone},${tone},${tone},.3)`;ctx.lineWidth=rand()*1.6;ctx.beginPath();for(let x=0;x<=1024;x+=16){let yy=y+Math.sin(x*.006+y*.15)*2.8;ctx.lineTo(x,yy)}ctx.stroke()}for(let i=0;i<13000;i++){ctx.fillStyle=rand()>.5?'#ffffff07':'#00000009';ctx.fillRect(rand()*1024,rand()*512,rand()*24+1,1)}}else{const im=ctx.getImageData(0,0,512,512);for(let i=0;i<im.data.length;i+=4){let n=(rand()-.5)*19;im.data[i]=171+n;im.data[i+1]=171+n;im.data[i+2]=171+n;}ctx.putImageData(im,0,0)}const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());return t}
const plaster=texture('plaster');plaster.repeat.set(20,2);const wood=texture('wood');wood.repeat.set(2,1);const wallMat=new THREE.MeshStandardMaterial({color:'#bcbcbc',roughness:.94,map:plaster,bumpMap:plaster,bumpScale:.003});const darkMat=new THREE.MeshStandardMaterial({color:'#20231f',roughness:.8});const metal=new THREE.MeshStandardMaterial({color:'#191b19',roughness:.42,metalness:.65});const frameMat=new THREE.MeshStandardMaterial({color:'#272620',roughness:.38,metalness:.24});const matMat=new THREE.MeshStandardMaterial({color:'#e8e8e8',roughness:1});
function box(w,h,d,material,x,y,z,cast=false){const mesh=new THREE.Mesh(modelKit.bevel(w,h,d,Math.min(.012,w/5,h/5,d/5)),material);mesh.position.set(x,y,z);mesh.castShadow=cast;mesh.receiveShadow=true;scene.add(mesh);return mesh}
const dimensions=works.map(w=>{let aspect=w.width/w.height,iw=aspect>1?1.44:1.16*aspect,ih=aspect>1?1.44/aspect:1.16;return {iw,ih,w:iw+.22,h:ih+.22}});let xx=0;const positions=[];dimensions.forEach((d,i)=>{if(i)xx+=dimensions[i-1].w/2+.94+d.w/2;positions.push(xx)});const centres=[];for(let i=0;i<works.length;i+=2)centres.push((positions[i]+positions[i+1])/2);const movieWorks=window.WORKS.filter(w=>w.video);const moviePositions=movieWorks.map((w,i)=>positions.at(-1)+3.7+i*3.6);centres.push(...moviePositions);const total=moviePositions.at(-1)+3,start=-3.1,length=total-start;
box(length,3.45,.16,wallMat,(start+total)/2,1.725,-3.1);box(.16,3.45,10,wallMat,start,1.725,1.8);box(length,.12,10,new THREE.MeshStandardMaterial({color:'#454740',roughness:.9,emissive:'#292b24',emissiveIntensity:.12}),(start+total)/2,3.51,1.8);box(length,.075,.025,new THREE.MeshStandardMaterial({color:'#4b4a41',roughness:.8}),(start+total)/2,.038,-2.998);box(length,.018,.035,darkMat,(start+total)/2,.09,-2.997);
// Individual staggered oak planks, with a small physical joint and subtle finish variation.
const plankGeo=new THREE.BoxGeometry(1.79,.035,.225),floorBatches=[];for(let k=0;k<8;k++){const material=new THREE.MeshStandardMaterial({map:wood,color:new THREE.Color().setHSL(0,0,.63+k*.016),roughness:.68,bumpMap:wood,bumpScale:.009});const mesh=new THREE.InstancedMesh(plankGeo,material,198);mesh.receiveShadow=true;scene.add(mesh);floorBatches.push(mesh)}const counts=Array(8).fill(0),dummy=new THREE.Object3D();for(let row=0;row<44;row++){for(let col=-3;col<33;col++){let batch=(row*20+col+3)%8;dummy.position.set(col*1.8+(row%3)*.6,0,-2.87+row*.23);dummy.updateMatrix();floorBatches[batch].setMatrixAt(counts[batch]++,dummy.matrix)}}floorBatches.forEach(m=>{m.instanceMatrix.needsUpdate=true;m.computeBoundingSphere()});
// Ceiling track: recessed channel, suspension stems, and aimable cylindrical heads.
box(length,.045,.07,metal,(start+total)/2,3.32,-1.45,true);for(let x=start+.5;x<total;x+=2.4){box(.012,.18,.012,metal,x,3.42,-1.45)}
const lights=[],artMeshes=[],targetButtons=[],imageMeta=[];const targetLayer=document.createElement('div');targetLayer.id='artTargets';viewport.append(targetLayer);
function makeLabel(w,i,d,x){const c=document.createElement('canvas');c.width=640;c.height=200;const g=c.getContext('2d');g.fillStyle='#d8d2c4';g.fillRect(0,0,640,200);g.fillStyle='#35372f';g.font='27px sans-serif';g.fillText(String(i+1).padStart(2,'0')+'   '+w.title,25,65);g.font='18px sans-serif';g.fillStyle='#77796d';g.fillText(w.category==='account'?'账号运营':w.category==='design'?'GRAPHIC DESIGN':'PHOTOGRAPHY',25,115);g.font='17px sans-serif';const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;const p=new THREE.Mesh(new THREE.PlaneGeometry(.32,.10),new THREE.MeshStandardMaterial({map:t,roughness:1}));p.position.set(x+d.w/2-.16,1.6-d.h/2-.16,-2.995);scene.add(p)}
const accountStart = works.findIndex(work => work.category === 'account');
if (accountStart >= 0) {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 148;
  const brush = canvas.getContext('2d');
  brush.font = '500 104px "Microsoft YaHei", sans-serif';
  brush.fillStyle = '#242322';
  brush.textAlign = 'center';
  brush.textBaseline = 'middle';
  brush.fillText('运营过的账号', 512, 74);
  const ink = new THREE.CanvasTexture(canvas);
  ink.colorSpace = THREE.SRGBColorSpace;
  const heading = new THREE.Mesh(new THREE.PlaneGeometry(1.85,.267),
    new THREE.MeshBasicMaterial({map:ink,transparent:true,depthWrite:false,toneMapped:false}));
  const center = (positions[accountStart]+positions[accountStart+1])/2;
  heading.position.set(smallScreen?positions[accountStart]:center,2.53,-2.99);
  scene.add(heading);
}
works.forEach((w,i)=>{const d=dimensions[i],x=positions[i],y=1.6,z=-2.975;
box(d.w,d.h,.048,darkMat,x,y,z-.025,true);box(d.w-.035,d.h-.035,.022,matMat,x,y,z+.01,true);
const bw=.027;box(d.w,bw,.06,frameMat,x,y+d.h/2-bw/2,z+.025,true);box(d.w,bw,.06,frameMat,x,y-d.h/2+bw/2,z+.025,true);box(bw,d.h-.054,.06,frameMat,x-d.w/2+bw/2,y,z+.025,true);box(bw,d.h-.054,.06,frameMat,x+d.w/2-bw/2,y,z+.025,true);
const tex=loader.load(w.src,()=>{renderDirty=true});tex.colorSpace=THREE.SRGBColorSpace;tex.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());const image=new THREE.Mesh(new THREE.PlaneGeometry(d.iw,d.ih),new THREE.MeshBasicMaterial({map:tex,toneMapped:false}));image.position.set(x,y,z+.026);scene.add(image);artMeshes.push(image);imageMeta.push({x,y,z:z+.026,w:d.iw,h:d.ih});
// A restrained glazing sheen lives over the mat and print, without obscuring the photograph.
const glass=new THREE.Mesh(new THREE.PlaneGeometry(d.w-.054,d.h-.054),new THREE.MeshPhysicalMaterial({color:'#ffffff',transparent:true,opacity:.035,roughness:.12,metalness:.1,depthWrite:false}));glass.position.set(x,y,z+.057);scene.add(glass);makeLabel(w,i,d,x);
const light=new THREE.SpotLight('#ffffff',13,8,.66,1,2);light.position.set(x,3.15,-1.47);light.target.position.set(x,1.58,-3.02);light.castShadow=true;light.shadow.mapSize.set(smallScreen?512:1024,smallScreen?512:1024);light.shadow.bias=-.0003;light.shadow.normalBias=.003;light.shadow.camera.near=.3;light.shadow.camera.far=6;scene.add(light,light.target);lights.push(light);
const lamp=modelKit.lamp();lamp.position.copy(light.position);lamp.quaternion.setFromUnitVectors(new THREE.Vector3(0,-1,0),light.target.position.clone().sub(light.position).normalize());scene.add(lamp);
const b=document.createElement('button');b.className='art-target';b.setAttribute('aria-label','靠近观看 '+w.title);b.dataset.id=w.id;b.onclick=()=>{if(!bridge.swiped())bridge.open(i,{getBoundingClientRect:()=>projectRect(i)})};b.onmouseenter=()=>{renderer.domElement.style.cursor='pointer'};b.onmouseleave=()=>{renderer.domElement.style.cursor='default'};targetLayer.append(b);targetButtons.push(b);
});

const filmVideo=document.querySelector('#film'),videoTexture=new THREE.VideoTexture(filmVideo);videoTexture.colorSpace=THREE.SRGBColorSpace;
const projections=[],projectionButtons=[],deviceMeshes=[],beams=[];
const haloCanvas=document.createElement('canvas');
haloCanvas.width=haloCanvas.height=128;
const haloContext=haloCanvas.getContext('2d');
const haloGradient=haloContext.createRadialGradient(64,64,0,64,64,64);
haloGradient.addColorStop(0,'rgba(237,245,255,1)');
haloGradient.addColorStop(.16,'rgba(223,237,255,.42)');
haloGradient.addColorStop(.48,'rgba(208,226,255,.07)');
haloGradient.addColorStop(1,'rgba(208,226,255,0)');
haloContext.fillStyle=haloGradient;
haloContext.fillRect(0,0,128,128);
const haloTexture=new THREE.CanvasTexture(haloCanvas);
movieWorks.forEach((w,i)=>{const x=moviePositions[i],aspect=w.width/w.height,h=aspect>1?1.22:1.85,width=h*aspect,y=1.85,z=-3.008;const poster=loader.load(w.src,()=>renderDirty=true);poster.colorSpace=THREE.SRGBColorSpace;const mat=new THREE.MeshBasicMaterial({map:poster,toneMapped:false,fog:false,transparent:true,blending:THREE.NoBlending});const plane=new THREE.Mesh(new THREE.PlaneGeometry(width,h),mat);plane.position.set(x,y,z);plane.renderOrder=2;scene.add(plane);projections.push({plane,poster,x,y,z,w:width,h});
const px=x+(smallScreen?.47:1.06),pz=smallScreen?-1.55:-.86;const stand=modelKit.stand();stand.position.set(px,0,pz);scene.add(stand);
const device=modelKit.projector();device.position.set(px,.985,pz);device.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,-1),new THREE.Vector3(x,1.85,z).sub(device.position).normalize());scene.add(device);device.updateMatrixWorld(true);deviceMeshes.push(device);
const origin=device.localToWorld(new THREE.Vector3(-.16,.005,-.362)),corners=[new THREE.Vector3(x-width/2,y-h/2,z+.01),new THREE.Vector3(x+width/2,y-h/2,z+.01),new THREE.Vector3(x+width/2,y+h/2,z+.01),new THREE.Vector3(x-width/2,y+h/2,z+.01)];const verts=[];for(let k=0;k<4;k++)verts.push(...origin.toArray(),...corners[k].toArray(),...corners[(k+1)%4].toArray());const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));const beam=new THREE.Mesh(geometry,new THREE.MeshBasicMaterial({color:'#dae3f0',transparent:true,opacity:.018,side:THREE.DoubleSide,depthWrite:false,blending:THREE.AdditiveBlending}));const distances=[];
for(let face=0;face<4;face++) distances.push(0,1,1);
geometry.setAttribute('travel',new THREE.Float32BufferAttribute(distances,1));
beam.material.side=THREE.FrontSide;
beam.material.onBeforeCompile = shader => {
  shader.vertexShader = 'attribute float travel; varying float vTravel;\n'+shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvTravel=travel;');
  shader.fragmentShader = 'varying float vTravel;\n'+shader.fragmentShader.replace('#include <alphamap_fragment>','#include <alphamap_fragment>\ndiffuseColor.a *= exp(-3.4*vTravel);');
};
const flare=new THREE.Sprite(new THREE.SpriteMaterial({map:haloTexture,blending:THREE.AdditiveBlending,depthWrite:false}));
flare.position.copy(origin);
flare.scale.setScalar(.28);
scene.add(flare,beam);
beams.push(beam);
const button=document.createElement('button');button.className='projection-target';button.setAttribute('aria-label','播放投影 '+(i+1));button.innerHTML='<span>▶</span>';button.onclick=()=>{if(bridge.stop()!==6+i)bridge.go(6+i);else bridge.play()};targetLayer.append(button);projectionButtons.push(button);
});
function projectionTargets(){const vr=viewport.getBoundingClientRect();projections.forEach((p,i)=>{const a=new THREE.Vector3(p.x-p.w/2,p.y+p.h/2,p.z).project(camera),b=new THREE.Vector3(p.x+p.w/2,p.y-p.h/2,p.z).project(camera),left=(a.x+1)/2*vr.width,top=(1-a.y)/2*vr.height,w=(b.x-a.x)/2*vr.width,h=(a.y-b.y)/2*vr.height,button=projectionButtons[i];button.hidden=inspectMix>.01||activeStop<6||left+w<0||left>vr.width;Object.assign(button.style,{left:left+'px',top:top+'px',width:w+'px',height:h+'px'});button.querySelector('span').style.opacity=(activeStop===6+i&&!filmVideo.paused)?'0':'1';beams[i].material.opacity=activeStop===6+i&&!filmVideo.paused?.075:.022;});}
window.addEventListener('projection:select',e=>{projections.forEach((p,i)=>{p.plane.material.map=i===e.detail?videoTexture:p.poster;p.plane.material.needsUpdate=true});renderDirty=true});['loadeddata','seeked','play','pause','ended'].forEach(event=>filmVideo.addEventListener(event,()=>renderDirty=true));
// End wall, structural ceiling bays, cable trays and benches are all solid meshes.
box(.18,3.45,10,wallMat,total,1.725,1.8);
box(length,3.45,.16,wallMat,(start+total)/2,1.725,6.88);
const fill=new THREE.DirectionalLight('#f1f3f4',1.1);fill.position.set(centres[0]-3,6,2);fill.target.position.set(centres[0],0,-1);fill.castShadow=true;fill.shadow.mapSize.set(smallScreen?512:1024,smallScreen?512:1024);Object.assign(fill.shadow.camera,{left:-5,right:5,top:5,bottom:-5,near:.5,far:18});fill.shadow.bias=-.00015;fill.shadow.normalBias=.018;scene.add(fill,fill.target);
for(let x=start+1.2;x<total;x+=4.8){box(.09,.13,8,metal,x,3.38,1.1);box(.012,.12,7.8,modelKit.materials.top,x+.048,3.36,1.1)}
box(length,.10,.09,modelKit.materials.top,(start+total)/2,3.25,1.7);
for(const x of [centres[0]+.8,centres[2]+.6,centres[4]]){const bench=modelKit.bench();bench.position.set(x,0,-.35);scene.add(bench)}
// Projection cables run along the floor from each tripod toward the skirting.
for(const x of moviePositions){const curve=new THREE.CatmullRomCurve3([new THREE.Vector3(x+(smallScreen?.47:1.06),.025,smallScreen?-1.55:-.86),new THREE.Vector3(x+1.3,.025,-1.78),new THREE.Vector3(x+1.45,.025,-2.2),new THREE.Vector3(x+1.45,.025,-2.96)]);const cable=new THREE.Mesh(new THREE.TubeGeometry(curve,18,.007,5,false),modelKit.materials.rubber);scene.add(cable)}
let inspect=false,inspectMix=0,orbit=.9,orbitPitch=.38,drag=null,lastFrame=0;
const inspectButton=document.getElementById('inspectDevice');inspectButton.onclick=()=>{inspect=!inspect;inspectButton.textContent=inspect?'返回观展':'查看设备';document.body.classList.toggle('inspect-device',inspect);renderDirty=true};
viewport.addEventListener('pointerdown',e=>{if(!inspect||e.target.closest('button'))return;drag={x:e.clientX,y:e.clientY};viewport.setPointerCapture(e.pointerId)},true);
viewport.addEventListener('pointermove',e=>{if(!drag)return;orbit+=(e.clientX-drag.x)*.007;orbitPitch=Math.max(-.05,Math.min(.85,orbitPitch+(e.clientY-drag.y)*.005));drag={x:e.clientX,y:e.clientY};renderDirty=true});viewport.addEventListener('pointerup',()=>drag=null);viewport.addEventListener('pointercancel',()=>drag=null);
if(filmVideo.requestVideoFrameCallback){const onFrame=()=>{renderDirty=true;filmVideo.requestVideoFrameCallback(onFrame)};filmVideo.requestVideoFrameCallback(onFrame)}
document.addEventListener('visibilitychange',()=>{if(document.hidden)filmVideo.pause();renderDirty=true});
let currentX=centres[0],fromX=currentX,toX=currentX,startTime=0,moving=false,activeStop=0,renderDirty=true,shadowKey="";const clock=()=>performance.now();const reduced=matchMedia('(prefers-reduced-motion: reduce)');function move(n){inspect=false;inspectButton.textContent="查看设备";document.body.classList.remove("inspect-device");activeStop=n;fromX=currentX;toX=smallScreen&&n<6?positions[n*2+(window.galleryPhotoSide||0)]:centres[n];startTime=clock();moving=true;renderDirty=true;document.body.classList.toggle('webgl-cinema',n>=6)}
function projectRect(i,frame=false){const m=imageMeta[i],d=frame?dimensions[i]:m,tl=new THREE.Vector3(m.x-d.w/2,m.y+d.h/2,m.z).project(camera),br=new THREE.Vector3(m.x+d.w/2,m.y-d.h/2,m.z).project(camera),r=viewport.getBoundingClientRect();const left=(tl.x+1)/2*r.width+r.left,top=(1-tl.y)/2*r.height+r.top,right=(br.x+1)/2*r.width+r.left,bottom=(1-br.y)/2*r.height+r.top;return {left,top,right,bottom,width:right-left,height:bottom-top,x:left,y:top}}
function targets(){const vr=viewport.getBoundingClientRect();for(let i=0;i<works.length;i++){const r=projectRect(i,true),b=targetButtons[i],visible=activeStop<6&&r.right>vr.left&&r.left<vr.right;b.hidden=!visible;if(visible)Object.assign(b.style,{left:r.left-vr.left+'px',top:r.top-vr.top+'px',width:r.width+'px',height:r.height+'px'})}}
function size(){const r=viewport.getBoundingClientRect();renderer.setSize(r.width,r.height);camera.aspect=r.width/r.height;camera.fov=r.width<700?54:44;camera.updateProjectionMatrix();renderDirty=true}new ResizeObserver(size).observe(viewport);size();
function tick(now){requestAnimationFrame(tick);if(document.hidden)return;if(moving){const t=reduced.matches?1:Math.min(1,(now-startTime)/1550),e=1-Math.pow(1-t,4);currentX=fromX+(toX-fromX)*e;moving=t<1;renderDirty=true}if(!filmVideo.paused&&!filmVideo.requestVideoFrameCallback&&now-lastFrame>33)renderDirty=true;
const desiredInspect=inspect?1:0;if(Math.abs(inspectMix-desiredInspect)>.001){inspectMix+= (desiredInspect-inspectMix)*(reduced.matches?1:.1);renderDirty=true}else inspectMix=desiredInspect;if(!renderDirty)return;const mobile=viewport.clientWidth<700;const look=new THREE.Vector3();
const halfFov=Math.tan(THREE.MathUtils.degToRad(camera.fov/2));
function viewAt(index){
  const screen=projections[index-6];
  if (!screen) {
    const first=index*2, last=first+1;
    const pairWidth=positions[last]-positions[first]+(dimensions[first].w+dimensions[last].w)/2;
    const width=mobile?Math.max(dimensions[first].w,dimensions[last].w):pairWidth;
    const distance=Math.max(2.32,width/(2*halfFov*camera.aspect*.90));
    return [-2.97+distance,1.50,0,1.63,0];
  }
  const distance=Math.max(mobile?4.0:4.4,screen.w/(2*halfFov*camera.aspect*.82));
  return [screen.z+distance,mobile?1.49:1.43,mobile?.11:.20,mobile?1.48:1.56,mobile?.36:1.56];
}
let right=centres.findIndex(x=>x>=currentX);
if(right<0)right=centres.length-1;
const left=Math.max(0,right-1);
const mix=left===right?1:THREE.MathUtils.smoothstep(currentX,centres[left],centres[right]);
const a=viewAt(left),b=viewAt(right);
const [depth,aim,offset,eye,side]=a.map((v,i)=>THREE.MathUtils.lerp(v,b[i],mix));
camera.position.set(currentX+side,eye,depth);
look.set(currentX+offset,aim,-3);
if(inspectMix>0&&activeStop>=6){const center=deviceMeshes[activeStop-6].position.clone();const r=smallScreen?1.7:1.2;const close=center.clone().add(new THREE.Vector3(Math.sin(orbit)*Math.cos(orbitPitch)*r,Math.sin(orbitPitch)*r,-Math.cos(orbit)*Math.cos(orbitPitch)*r));camera.position.lerp(close,inspectMix);look.lerp(center,inspectMix)}
camera.lookAt(look);camera.updateMatrixWorld();const nearest=positions.map((x,i)=>({i,d:Math.abs(x-currentX)})).sort((a,b)=>a.d-b.d).slice(0,smallScreen?2:3).map(a=>a.i);const key=activeStop+":"+nearest.slice().sort().join(",");if(key!==shadowKey){fill.position.set(centres[activeStop]-3,6,2);fill.target.position.set(centres[activeStop],0,-1);fill.target.updateMatrixWorld();lights.forEach((l,i)=>l.castShadow=nearest.includes(i));renderer.shadowMap.needsUpdate=true;shadowKey=key;}targets();projectionTargets();renderer.render(scene,camera);lastFrame=now;renderDirty=false}
window.galleryView={rect:i=>projectRect(i),move,dimensions,positions,centres,renderer,projections,deviceMeshes,scene,camera,quality:{mobile:smallScreen,pixelRatio:renderer.getPixelRatio(),shadowSize:smallScreen?512:1024},stats:()=>({drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles,geometries:renderer.info.memory.geometries,textures:renderer.info.memory.textures})};window.addEventListener('gallery:move',e=>move(e.detail));document.body.classList.add('webgl-ready');move(bridge.stop());requestAnimationFrame(tick);renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();document.body.classList.remove('webgl-ready');targetLayer.hidden=true});
} catch(error){console.warn('Gallery uses its compatible view.',error);document.querySelector('#galleryCanvas')?.remove();}
