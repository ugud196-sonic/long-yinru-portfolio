import * as THREE from './vendor/three.module.js';

// Reusable solid geometry. Detail meshes are baked by material, keeping draw calls low.
export function createModelKit() {
  const materials = {
    shell: new THREE.MeshStandardMaterial({color:0x34383b,roughness:.38,metalness:.38}),
    top: new THREE.MeshStandardMaterial({color:0x51575b,roughness:.43,metalness:.42}),
    black: new THREE.MeshStandardMaterial({color:0x111417,roughness:.7}),
    steel: new THREE.MeshStandardMaterial({color:0x90999e,roughness:.25,metalness:.88}),
    rubber: new THREE.MeshStandardMaterial({color:0x161819,roughness:.96}),
    glass: new THREE.MeshPhysicalMaterial({color:0x172d46,roughness:.09,metalness:.65,clearcoat:1,clearcoatRoughness:.08}),
    lens: new THREE.MeshStandardMaterial({color:0x87b6dc,emissive:0x51758f,emissiveIntensity:.45,roughness:.15,metalness:.55}),
    led: new THREE.MeshBasicMaterial({color:0x86c8b0}),
    wood: new THREE.MeshStandardMaterial({color:0x77716a,roughness:.6}),
    light: new THREE.MeshBasicMaterial({color:0xf4f3ec})
  };
  function bevel(w,h,d,r=.012) {
    const shape=new THREE.Shape(),x=-w/2,y=-h/2;
    shape.moveTo(x+r,y);shape.lineTo(x+w-r,y);shape.quadraticCurveTo(x+w,y,x+w,y+r);
    shape.lineTo(x+w,y+h-r);shape.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
    shape.lineTo(x+r,y+h);shape.quadraticCurveTo(x,y+h,x,y+h-r);
    shape.lineTo(x,y+r);shape.quadraticCurveTo(x,y,x+r,y);
    const g=new THREE.ExtrudeGeometry(shape,{depth:Math.max(.001,d-r*.4),bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:r*.2,bevelThickness:r*.2,curveSegments:3});
    g.translate(0,0,-d/2+r*.2);return g;
  }
  function part(group,geometry,material,x=0,y=0,z=0,rx=0,ry=0,rz=0) {
    const m=new THREE.Mesh(geometry,material);m.position.set(x,y,z);m.rotation.set(rx,ry,rz);m.castShadow=true;m.receiveShadow=true;group.add(m);return m;
  }
  function block(g,w,h,d,mat,x=0,y=0,z=0,r=.008) {return part(g,bevel(w,h,d,r),mat,x,y,z)}
  function cylinder(g,r1,r2,h,mat,x,y,z,rx=0) {return part(g,new THREE.CylinderGeometry(r1,r2,h,24),mat,x,y,z,rx)}
  function rod(g,a,b,r,mat) {const av=new THREE.Vector3(...a),bv=new THREE.Vector3(...b),m=cylinder(g,r,r,av.distanceTo(bv),mat,...av.clone().add(bv).multiplyScalar(.5).toArray());m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),bv.sub(av).normalize());return m}
  function bake(group,name) {
    group.updateMatrixWorld(true);const batches=new Map();
    group.traverse(m=>{if(!m.isMesh)return;const geometry=(m.geometry.index?m.geometry.toNonIndexed():m.geometry.clone()).applyMatrix4(m.matrixWorld);const list=batches.get(m.material)||[];list.push(geometry);batches.set(m.material,list)});
    const result=new THREE.Group();result.name=name;
    for(const [material,list] of batches){const geo=new THREE.BufferGeometry();for(const key of ['position','normal','uv']){const size=key==='uv'?2:3;const length=list.reduce((n,g)=>n+g.getAttribute(key).array.length,0);const array=new Float32Array(length);let offset=0;for(const g of list){array.set(g.getAttribute(key).array,offset);offset+=g.getAttribute(key).array.length}geo.setAttribute(key,new THREE.BufferAttribute(array,size))}geo.computeBoundingSphere();const m=new THREE.Mesh(geo,material);m.castShadow=!['led','lens','light'].some(k=>materials[k]===material);m.receiveShadow=true;result.add(m);list.forEach(g=>g.dispose())}return result;
  }
  const projector=new THREE.Group();
  block(projector,.66,.19,.46,materials.shell,0,0,0,.035);
  block(projector,.645,.025,.445,materials.top,0,.107,0,.025);
  block(projector,.63,.018,.435,materials.black,0,-.103,0,.018);
  // Front is -Z; the barrel and optical elements all share this axis.
  cylinder(projector,.106,.112,.07,materials.black,-.16,.005,-.24,Math.PI/2);
  cylinder(projector,.094,.099,.075,materials.shell,-.16,.005,-.285,Math.PI/2);
  cylinder(projector,.087,.087,.018,materials.steel,-.16,.005,-.326,Math.PI/2);
  cylinder(projector,.080,.080,.026,materials.black,-.16,.005,-.341,Math.PI/2);
  part(projector,new THREE.CircleGeometry(.072,32),materials.glass,-.16,.005,-.355,0,Math.PI);
  part(projector,new THREE.CircleGeometry(.046,24),materials.lens,-.16,.005,-.357,0,Math.PI);
  for(let j=0;j<22;j++){const a=j*Math.PI*2/22;block(projector,.006,.014,.041,materials.black,-.16+Math.cos(a)*.096,.005+Math.sin(a)*.096,-.291,.001)}
  // Cooling grilles have a dark recess with individual fins on both sides.
  for(const sign of [-1,1]){block(projector,.009,.103,.28,materials.black,sign*.331,-.005,.015,.002);for(let j=0;j<15;j++)block(projector,.014,.084,.007,materials.top,sign*.338,-.005,-.115+j*.019,.001)}
  block(projector,.29,.095,.006,materials.black,.14,0,-.234,.006);
  for(let j=0;j<12;j++)block(projector,.008,.082,.012,materials.shell,.005+j*.024,0,-.24,.001);
  // Rear sockets, power inlet, status LEDs, recessed controls, and screws.
  block(projector,.47,.105,.012,materials.black,0,-.005,.235,.004);
  for(let j=0;j<3;j++){block(projector,.053,.025,.014,materials.steel,-.15+j*.083,.01,.244,.003);block(projector,.043,.015,.016,materials.black,-.15+j*.083,.01,.252,.002)}
  block(projector,.06,.044,.018,materials.black,.20,-.014,.251,.005);
  block(projector,.15,.008,.075,materials.black,.14,.126,.05,.012);
  for(let j=0;j<3;j++)cylinder(projector,.014,.014,.006,materials.top,.095+j*.042,.133,.05);
  cylinder(projector,.005,.005,.004,materials.led,.24,.124,.06);
  for(const x of [-.27,.27])for(const z of [-.17,.17]){cylinder(projector,.018,.021,.025,materials.rubber,x,-.124,z);cylinder(projector,.005,.005,.003,materials.steel,x,.122,z)}
  const projectorModel=bake(projector,'Projector · solid casing / lens / vents / ports');
  const stand=new THREE.Group();
  cylinder(stand,.028,.032,.55,materials.shell,0,.34,0);cylinder(stand,.019,.019,.29,materials.steel,0,.66,0);cylinder(stand,.044,.044,.055,materials.black,0,.53,0);
  block(stand,.06,.024,.035,materials.shell,.052,.54,0);cylinder(stand,.021,.021,.025,materials.black,.09,.54,0,Math.PI/2);
  block(stand,.58,.035,.40,materials.top,0,.807,0,.018);
  for(let i=0;i<3;i++){const a=i*Math.PI*2/3;const end=[Math.cos(a)*.36,.045,Math.sin(a)*.36];rod(stand,[0,.29,0],end,.018,materials.shell);block(stand,.09,.032,.06,materials.rubber,...end,.012)}
  const standModel=bake(stand,'Adjustable projector tripod');
  const bench=new THREE.Group();
  for(let j=0;j<5;j++)block(bench,1.8,.065,.071,materials.wood,0,.44,-.16+j*.08,.012);
  for(const x of [-.65,.65]){block(bench,.055,.39,.055,materials.shell,x,.22,-.13);block(bench,.055,.39,.055,materials.shell,x,.22,.13);block(bench,.07,.05,.36,materials.shell,x,.414,0);block(bench,.09,.022,.37,materials.rubber,x,.022,0)}
  block(bench,1.35,.028,.035,materials.shell,0,.17,0);
  const benchModel=bake(bench,'Slatted bench with metal underframe');
  const lamp=new THREE.Group();
  block(lamp,.085,.035,.085,materials.black,0,.16,0);cylinder(lamp,.014,.014,.10,materials.steel,0,.095,0);
  cylinder(lamp,.057,.057,.02,materials.top,0,.04,0,Math.PI/2);
  cylinder(lamp,.066,.059,.16,materials.shell,0,-.015,0);cylinder(lamp,.061,.061,.012,materials.black,0,-.10,0);
  cylinder(lamp,.049,.049,.004,materials.light,0,-.107,0);
  for(let j=0;j<5;j++)cylinder(lamp,.067,.067,.004,materials.black,0,.02+j*.012,0);
  const lampModel=bake(lamp,'Track spotlight / articulated mount / cooling rings');
  return {materials,projector:()=>projectorModel.clone(true),stand:()=>standModel.clone(true),bench:()=>benchModel.clone(true),lamp:()=>lampModel.clone(true),bevel};
}
