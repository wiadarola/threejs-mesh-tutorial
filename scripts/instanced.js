// Bouncing Squares
const scene = new THREE.Scene();

const viewSize = 10;
const aspectRatio = window.innerWidth/window.innerHeight;
const camera = new THREE.OrthographicCamera(-aspectRatio*viewSize / 2, aspectRatio*viewSize/2, viewSize/2, -viewSize/2, -1000, 1000 );
scene.add( camera );

const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

const count = 2;
const dummy = new THREE.Object3D();
// Make Square Instanced Mesh
const geometry = new THREE.PlaneGeometry(1,1);
const material = new THREE.MeshBasicMaterial( { wireframe: false } );
const mesh = new THREE.InstancedMesh( geometry, material, count );
mesh.instanceMatrix.setUsage( THREE.DynamicDrawUsage );
scene.add(mesh);

const g = new THREE.PlaneGeometry(1,1);
const m = new THREE.MeshBasicMaterial( { wireframe: false } );
const regMesh = new THREE.Mesh( g, m );
scene.add(regMesh);

let arr = [regMesh];


// Positions
let pos;
pos = genPosOnScreen();
regMesh.position.set(pos.x, pos.y);
for(let i = 0; i < count; i++) {
    pos = genPosOnScreen();
    dummy.position.set(pos.x,pos.y);
    dummy.updateMatrix();
    mesh.setMatrixAt( i, dummy.matrix );
}


// Colors
for(let i = 0; i < count; i++) {
    mesh.setColorAt(i, genColor());
}
mesh.instanceColor.needsUpdate = true;
mesh.instanceMatrix.needsUpdate = true;


// Animation Loop
const color = new THREE.Color();
const position = new THREE.Vector3();
const quaternion = new THREE.Quaternion();
const euler = new THREE.Euler();
const scale = new THREE.Vector3();

function animate() {
    //regMesh.rotation.z += 0.01;

    for(let i = 0; i < count; i++) {
        mesh.getColorAt( i, color );
        mesh.getMatrixAt( i, dummy.matrix );
        
        dummy.matrix.decompose(position, quaternion, scale);
        euler.setFromQuaternion(quaternion)
        
        if(color.getHex() < 8947848) { 
            euler.z += Math.PI/120;
        } else {
            euler.z -= Math.PI/120;
        }
        quaternion.setFromEuler(euler);
        dummy.matrix.compose(position, quaternion, scale);

        mesh.setMatrixAt( i, dummy.matrix );
    }
    mesh.instanceMatrix.needsUpdate = true;

	requestAnimationFrame( animate );
	renderer.render( scene, camera );
}
animate()


// Get Spin Value
function getSpin() {
    let spin = (Math.round(Math.random())) ? 0.05 : -0.05;
    
    return spin
}


// Generate a Random Color
function genColor() {
    const color = new THREE.Color( 0xffffff );
    color.setHex( Math.random() * 0xffffff );
    
    return color;
}


// Make 2D Square Mesh
function makeSquare() {
    const geometry = new THREE.PlaneGeometry( 1, 1 );
    const material = new THREE.MeshBasicMaterial( {color: 0xff0000, side: THREE.DoubleSide} );
    const square = new THREE.Mesh( geometry, material );
    
    return square
}


// Generate a Screen Position for Square Placement
function genPosOnScreen() {
    const maxX = (aspectRatio * viewSize / 2) - 1;
    const minX = (-aspectRatio * viewSize / 2) + 1;
    const maxY = (viewSize / 2) - 1;
    const minY = (-viewSize / 2) + 1;

    let x = Math.random() * (maxX - minX) + minX;
    let y = Math.random() * (maxY - minY) + minY;

    const res = new THREE.Vector3();
    res.x = x;
    res.y = y;
    res.z = 0;

    return res;
}


// Window Resizing
window.addEventListener( 'resize', onWindowResize, false );
function onWindowResize(){

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );

}

// RAYCASTING START
const moveMouse = new THREE.Vector2();
const clickMouse = new THREE.Vector2();
raycaster = new THREE.Raycaster();

window.addEventListener('click', event => {
    clickMouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    clickMouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
    raycaster.setFromCamera(clickMouse, camera);

    // const intersection = raycaster.intersectObject( mesh );
    // if ( intersection.length > 0 ) {

    //     const instanceId = intersection[ 0 ].instanceId;

    //     mesh.setColorAt( instanceId, genColor() );
    //     mesh.instanceColor.needsUpdate = true;

    // }

    const intersects = raycaster.intersectObjects( scene.children );
    if ( intersects.length > 0 ) {
        console.log(intersects)
        if ( intersects[ 0 ].instanceId == undefined ) {
            
            intersects[ 0 ].object.material.color.set(genColor())
        }
        else {
            const instanceId = intersects[ 0 ].instanceId;
            mesh.setColorAt( instanceId, genColor() );
            mesh.instanceColor.needsUpdate = true;
        }
        
    }
})
// RAYCASTING END
