// Bouncing Squares
const scene = new THREE.Scene();

const viewSize = 10;
const aspectRatio = window.innerWidth/window.innerHeight;
const camera = new THREE.OrthographicCamera(-aspectRatio*viewSize / 2, aspectRatio*viewSize/2, viewSize/2, -viewSize/2, -1000, 1000 );


const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );


// Make Squares
const squareCount = 10;
const squareColl = [];
let square;
for(let i = 0; i < squareCount; i++) {
    square = makeSquare();
    square.userData.spin = getSpin();
    const color = genColor();
    square.material.color = color;
    const pos = genPosOnScreen();
    square.position.x = pos.x;
    square.position.y = pos.y;
    scene.add(square);
    squareColl.push(square);
}


// Animation Loop
function animate() {
    for(square of squareColl) {
        square.rotation.z += square.userData.spin;
    }
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
    // const intersects = raycaster.intersectObjects(scene.children);


    //const intersection = raycaster.intersectObject( mesh );
    const normal = raycaster.intersectObjects( scene.children );

    if ( normal.length > 0 ) {
        console.log(normal[0].instanceId);
        normal[ 0 ].object.material.color.set(genColor())
    }
    // for( let i = 0; i < intersects.length; i ++ ) {
    //     console.log();  
    // }
})
// RAYCASTING END