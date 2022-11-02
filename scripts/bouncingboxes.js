let camera, scene, renderer, aspectRatio;
let mesh, border, bb_arr;

const count = 2;
const dummy = new THREE.Object3D();
const velocity_arr = [];
const size = new THREE.Vector2(1,1)

init();
animate();

function init() {
    scene = new THREE.Scene();

    viewSize = 10;
    aspectRatio = window.innerWidth / window.innerHeight;
    camera = new THREE.OrthographicCamera(
        -aspectRatio * viewSize / 2, // X-
        aspectRatio * viewSize / 2, // X+
        viewSize / 2, // Y+
        -viewSize / 2, // Y-
        -1000, // Scene Z
        1000  // Camera Z
    );
    scene.add( camera );

    renderer = new THREE.WebGLRenderer();
    renderer.setSize( window.innerWidth, window.innerHeight );
    document.body.appendChild( renderer.domElement );

    // Create box instanced mesh
    const geometry = new THREE.PlaneGeometry( 1,1 );
    const material = new THREE.MeshBasicMaterial();
    mesh = new THREE.InstancedMesh( geometry, material, count );
    mesh.instanceMatrix.setUsage( THREE.DynamicDrawUsage );
    scene.add(mesh);

    // Randomly set the start positions of boxes
    let pos;
    bb_arr = [];
    for(let i = 0; i < count; i++) {
        // Set starting position
        pos = genPosOnScreen();
        dummy.position.set( pos.x,pos.y );
        dummy.updateMatrix();
        mesh.setMatrixAt( i, dummy.matrix );

        // Create bounding boxes
        const bb = new THREE.Box2( new THREE.Vector3(), new THREE.Vector3() );
        bb.setFromCenterAndSize(pos, size);
        bb_arr.push( bb );

        // Create velocity vectors
        let velocity = genVelocityVector();
        velocity_arr.push(velocity);
    }
    
    // Create border wall boundary box
    const bb = new THREE.Box2( new THREE.Vector2(), new THREE.Vector2() );
    bb.setFromCenterAndSize( new THREE.Vector2(0,0), new THREE.Vector2(aspectRatio*viewSize,viewSize) );
    bb_arr.push( bb );
}


function animate() {
    // Update positions based on acceleration array
    let position = new THREE.Vector3();
    let quaternion = new THREE.Quaternion();
    let scale = new THREE.Vector3();
    for( let i = 0; i < count; i++ ) {
        mesh.getMatrixAt( i, dummy.matrix );
        dummy.matrix.decompose( position, quaternion, scale );
        position.x += velocity_arr[ i ].x;
        position.y += velocity_arr[ i ].y;
        dummy.matrix.compose( position, quaternion, scale );
        mesh.setMatrixAt( i, dummy.matrix );

        // update bounding box
        bb_arr[ i ].setFromCenterAndSize(position, size);
    }

    // Check Collisions & update acceleration array
    // For each 2D square,
    for( let i = 0; i < count; i++ ) {
        /* Check with every other bounding box not yet checked
           Count + 1 is count of 2D squares & the border wall */
        for ( let j = i + 1; j < count + 1; j++ ) {
            if(detectCollision( i,j )  && j < count) {
                
                mesh.getMatrixAt( i, dummy.matrix );
                dummy.matrix.decompose( position, quaternion, scale );
                
                if( violence(i,j) ) {
                    velocity_arr[ i ].x *= -1;
                    velocity_arr[ j ].x *= -1;

                    position.x += (-velocity_arr[i].x + velocity_arr[j].x + 0.1);             
                }
                else {
                    velocity_arr[ i ].y *= -1;
                    velocity_arr[ j ].y *= -1;

                    position.y += (-velocity_arr[i].y + velocity_arr[j].y + 0.1); 
                }
                dummy.matrix.compose( position, quaternion, scale );
                mesh.setMatrixAt( i, dummy.matrix );
                bb_arr[ i ].setFromCenterAndSize(position, size);
            } 
            else if(detectCollision( i,j )) {

                mesh.getMatrixAt( i, dummy.matrix );
                dummy.matrix.decompose( position, quaternion, scale );

                if ( position.y > viewSize / 2 - 1 ) {
                    velocity_arr[ i ].y *= -1;
                    position.y = viewSize / 2 - 1
                }
                if ( position.y < -viewSize / 2 + 1 ) {
                    velocity_arr[ i ].y *= -1;
                    position.y = -viewSize / 2 + 1
                }
                if ( position.x > aspectRatio * viewSize / 2 - 1 ) {
                    velocity_arr[ i ].x *= -1;
                    position.x = aspectRatio * viewSize / 2 - 1
                }
                if ( position.x < -aspectRatio * viewSize / 2 + 1 ){
                    velocity_arr[ i ].x *= -1;
                    position.x = -aspectRatio * viewSize / 2 + 1
                }
                dummy.matrix.compose( position, quaternion, scale );
                mesh.setMatrixAt( i, dummy.matrix );
                bb_arr[ i ].setFromCenterAndSize(position, size);
            }
        }
    }

    mesh.instanceMatrix.needsUpdate = true;
    // --
    requestAnimationFrame( animate );
	renderer.render( scene, camera );
}


// Generate a Screen Position for Square Placement
function genPosOnScreen() {
    const maxX = (aspectRatio * viewSize / 2) - 1;
    const minX = (-aspectRatio * viewSize / 2) + 1;
    const maxY = (viewSize / 2) - 1;
    const minY = (-viewSize / 2) + 1;

    let x = Math.random() * (maxX - minX) + minX;
    let y = Math.random() * (maxY - minY) + minY;

    const res = new THREE.Vector2();
    res.x = x;
    res.y = y;

    return res;
}


// Detects if 2 objects are intersecting & which edge first intersected
function detectCollision(i, j) {
    if(j < count) {
        // If hitting another box
        return bb_arr[ i ].intersectsBox( bb_arr[ j ] )
    }
    // Box w/ Wall Containment
    else {
        // If not inside border
        return !bb_arr[ j ].containsBox( bb_arr[ i ] )
    }
}


function genVelocityVector() {
    let velocity = new THREE.Vector2();
    let max = 0.05;
    let min = 0.03;
    velocity.x = Math.random() * (max - min) + min
    velocity.y = Math.random() * (max - min) + min
    return velocity;
}


function violence(i, j) {
    const intersect_box = new THREE.Box2();
    intersect_box.copy( bb_arr[ i ] );
    intersect_box.intersect( bb_arr[ j ] );

    const size = new THREE.Vector2();
    intersect_box.getSize(size);

    const v1 = velocity_arr[ i ];
    const v2 = velocity_arr[ j ];
    const x_sum = v1.x + v2.x;
    const y_sum = v1.y + v2.y;

    if ( size.x / x_sum > size.y / y_sum ) {
        console.log("X");
        return true;
    }
    else {
        console.log("Y")
        return false;
    }
}
