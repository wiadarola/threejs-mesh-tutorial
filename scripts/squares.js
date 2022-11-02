let camera, scene, renderer, aspectRatio;
let squares, border, bounds_arr, velocity_arr;
let animateFlag = false;

const count = 10;
const dummy = new THREE.Object3D();
const size = new THREE.Vector2(1,1);

init();
animate();

function init() {
    scene = new THREE.Scene();

    // Create camera
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

    // Create renderer
    renderer = new THREE.WebGLRenderer();
    renderer.setSize( window.innerWidth, window.innerHeight );
    document.body.appendChild( renderer.domElement );

    // Create square instanced mesh
    const square_geom = new THREE.PlaneGeometry( 1,1 );
    const square_matl = new THREE.MeshBasicMaterial();
    squares = new THREE.InstancedMesh( square_geom, square_matl, count );
    squares.instanceMatrix.setUsage( THREE.DynamicDrawUsage );
    scene.add(squares);

    let pos;
    bounds_arr = [];
    velocity_arr = [];
    for(let i = 0; i < count; i++) {
        // Set starting positions of each square
        pos = genPosOnScreen();
        dummy.position.set( pos.x,pos.y );
        dummy.updateMatrix();
        squares.setMatrixAt( i, dummy.matrix );

        // Create bounding squares for each square
        const bound = new THREE.Box2( new THREE.Vector3(), new THREE.Vector3() );
        bound.setFromCenterAndSize(pos, size);
        bounds_arr.push( bound );

        // Create velocity vectors
        let velocity = genVelocityVector();
        velocity_arr.push(velocity);
    }

    // Create bounding box for border
    const bound = new THREE.Box2( new THREE.Vector2(), new THREE.Vector2() );
    bound.setFromCenterAndSize( new THREE.Vector2(0,0), new THREE.Vector2(aspectRatio*viewSize,viewSize) );
    bounds_arr.push( bound );
}

function animate() {
    if ( animateFlag ) {
        // Create matrix decomposition variables
        const position = new THREE.Vector3();
        const quaternion = new THREE.Quaternion();
        const scale = new THREE.Vector3();

        // Update position & bounding box of each square
        for( let i = 0; i < count; i++ ) {
            /* Position */
            squares.getMatrixAt( i, dummy.matrix );
            dummy.matrix.decompose( position, quaternion, scale );

            position.x += velocity_arr[ i ].x;
            position.y += velocity_arr[ i ].y;

            dummy.matrix.compose( position, quaternion, scale );
            squares.setMatrixAt( i, dummy.matrix );

            /* Bounding box */
            bounds_arr[ i ].setFromCenterAndSize(position, size);
        }

        // Check for collisions & update velocities
        for( let i = 0; i < count; i++ ) {
            for ( let j = i + 1; j < count + 1; j++ ) {
                // If collision between two squares
                if ( detectCollision( i, j ) && j < count ) {
                    // Decompose mesh[i] to get position
                    squares.getMatrixAt( i, dummy.matrix );
                    dummy.matrix.decompose( position, quaternion, scale );
                    
                    // Process
                    handleBoxCollision( position, i, j );

                    
                    // Compose i, set mesh[i], & update bounds[i]
                    dummy.matrix.compose( position, quaternion, scale );
                    squares.setMatrixAt( i, dummy.matrix );
                    bounds_arr[ i ].setFromCenterAndSize(position, size);
                }
                // If collision between square & border
                else if ( detectCollision( i, j ) ) {
                    // Decompose mesh[i] to get position
                    squares.getMatrixAt( i, dummy.matrix );
                    dummy.matrix.decompose( position, quaternion, scale );

                    // Process
                    handleBorderCollision( position, i );

                    // Compose i, set mesh[i], & update bounds[i]
                    dummy.matrix.compose( position, quaternion, scale );
                    squares.setMatrixAt( i, dummy.matrix );
                    bounds_arr[ i ].setFromCenterAndSize(position, size);
                }
            }
        }

        squares.instanceMatrix.needsUpdate = true;
    }
    animateFlag = true;

    requestAnimationFrame( animate );
    renderer.render( scene, camera );
}

// Generate random x,y position within border
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

// Generate a random x,y pair to represent a velocity
function genVelocityVector() {
    let velocity = new THREE.Vector2();
    let max = 0.05;
    let min = 0.03;
    velocity.x = Math.random() * (max - min) + min
    velocity.y = Math.random() * (max - min) + min
    return velocity;
}


// Detects if a collision exists between two bounds
function detectCollision( i, j ) {
    // Test for box-box collision
    if( j < count ) {
        return bounds_arr[ i ].intersectsBox( bounds_arr[ j ] )
    }
    // Test for box-border collision
    else {
        return !bounds_arr[ j ].containsBox( bounds_arr[ i ] )
    }
}

// Determines which edges escaped border & adjusts
function handleBorderCollision( position, i ) {
    // If North:
    if ( position.y > viewSize / 2 - 0.5 ) {
        velocity_arr[ i ].y *= -1;
        position.y = viewSize / 2 - 0.5;
    }

    // If South:
    if ( position.y < -viewSize / 2 + 0.5 ) {
        velocity_arr[ i ].y *= -1;
        position.y = -viewSize / 2 + 0.5;
    }

    // If West:
    if ( position.x > aspectRatio * viewSize / 2 - 0.5 ) {
        velocity_arr[ i ].x *= -1;
        position.x = aspectRatio * viewSize / 2 - 0.5;
    }

    // If East
    if ( position.x < -aspectRatio * viewSize / 2 + 0.5 ) {
        velocity_arr[ i ].x *= -1;
        position.x = -aspectRatio * viewSize / 2 + 0.5;
    }
}

// ???
function handleBoxCollision( position, i, j ) {
    // If horizontal collision
    if ( calculateDirection( i, j ) ) {
        velocity_arr[ i ].x *= -1;
        velocity_arr[ j ].x *= -1;
    }
    else {
        velocity_arr[ i ].y *= -1;
        velocity_arr[ j ].y *= -1;
    }
    position.y -= (velocity_arr[i].y + velocity_arr[j].y);
    position.x -= (velocity_arr[i].x + velocity_arr[j].x);
}

// Calculate direction of collision (x or y)
function calculateDirection( i, j ) {
    const intersect_box = new THREE.Box2();
    intersect_box.copy( bounds_arr[ i ] );
    intersect_box.intersect( bounds_arr[ j ] );

    const size = new THREE.Vector2();
    intersect_box.getSize(size);

    const v1 = velocity_arr[ i ];
    const v2 = velocity_arr[ j ];
    const x_sum = Math.abs(v1.x - v2.x);
    const y_sum = Math.abs(v1.y - v2.y);

    return size.x / x_sum < size.y / y_sum;
}

// Key Controls
document.onkeydown = function(e) {
    if (e.key === '=') {
        animateFlag = true;
    }
}

