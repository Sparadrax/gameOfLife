/**
 * Original Game of Life experiment. A grid of live/dead cells is updated from a copy of the previous board.
 */
import * as THREE from 'three';
import GUI from 'https://cdn.jsdelivr.net/npm/lil-gui@0.20/+esm';
import { MapControls } from '../../Lib/Three/MapControls.js';


let isrunning = false;
let settings = {
    gridSize: 900,
    numberOfCells: 50,
    speed: 10,
    /**
     * Initialize the scene or simulation before it starts.
     *
     * Inputs: None; uses enclosing state where needed.
     * @returns No value is returned; updates the current state, scene, or interface.
     */
    init : function() {init()},
    /**
     * Toggle whether the legacy cellular simulation is running.
     *
     * Inputs: None; uses enclosing state where needed.
     * @returns No value is returned; updates the current state, scene, or interface.
     */
    run  : function() {isrunning = !isrunning},
    /**
     * Log the current scene object collection for inspection.
     *
     * Inputs: None; uses enclosing state where needed.
     * @returns No value is returned; updates the current state, scene, or interface.
     */
    listobj  : function() {console.log(cells)},
}

let cells = [];

let gui = new GUI();


const scene = new THREE.Scene();
let camera = new THREE.OrthographicCamera( window.innerWidth / - 2, window.innerWidth / 2, window.innerHeight / 2, window.innerHeight / - 2, 1, 1000 );
// camera.position.set(0,0,6);
// camera.rotation.z= 90 * Math.PI / 180 ;

const renderer = new THREE.WebGLRenderer();

let offset = window.innerHeight * 0.06;
renderer.setSize( window.innerWidth, window.innerHeight - offset);
// Keep visual frames separate from the simulation's own update timing.
renderer.setAnimationLoop( animate );
document.body.appendChild( renderer.domElement );
let controls = new MapControls( camera, renderer.domElement );

// controls.addEventListener( 'change', animate ); // call this only in static scenes (i.e., if there is no animation loop)

controls.enableDamping = false; // an animation loop is required when either damping or auto-rotation are enabled
controls.zoomToCursor = true;
controls.dampingFactor = 0.05;
// controls.zoom = 10;
// controls.zoom0 = 10;

// controls.zoomSpeed = 0.001;
controls.screenSpacePanning = true;
 
controls.minDistance = 100;
controls.maxDistance = 500;
// camera.position.set(1, 500, -500);

let testcell;

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector3( 5000,5000, 0);

initGui();
init();

/**
 * Initialize the scene or simulation before it starts.
 *
 * Inputs: None; uses enclosing state where needed.
 * @returns No value is returned; updates the current state, scene, or interface.
 */
function init() {
    createGrid();
}

/**
 * Connect editable simulation settings to the GUI controls.
 *
 * Inputs: None; uses enclosing state where needed.
 * @returns No value is returned; updates the current state, scene, or interface.
 */
function initGui() {
    gui.add( settings, 'gridSize');
    gui.add( settings, 'numberOfCells');
    gui.add( settings, 'speed', [10,50, 100,1000]);
    gui.add( settings, 'init');
    gui.add( settings, 'run');
    gui.add( settings, 'listobj');

}


let secondTracker = Math.floor((new Date()).getTime() / 1000);
/**
 * Advance time-dependent simulation work and redraw the view on the next animation frame.
 *
 * Inputs: None; uses enclosing state where needed.
 * @returns No value is returned; updates the current state, scene, or interface.
 */
function animate() {
    // controls.update( );
    raycaster.setFromCamera( pointer, camera );

	// calculate objects intersecting the picking ray
	const intersects = raycaster.intersectObjects( scene.children );

	for ( let i = 0; i < intersects.length; i ++ ) {
        if(intersects[i].object.type != "GridHelper") {
            try {
                console.log(intersects[ i ]);
                let tmpPointer = pointer;
                console.log(tmpPointer.unproject( camera ));
                let cellSize   = settings.gridSize / settings.numberOfCells;
                let refX = Math.floor(tmpPointer.x/cellSize);
                let refY = Math.floor(tmpPointer.y/cellSize);
                console.log(refX + '/'+refY);
                cells[refX][refY].isActive = !cells[refX][refY].isActive;
                console.log(cells[refX][refY]);
                if(cells[refX][refY].isActive) {
                    intersects[ i ].object.material.color.set( 0xff0000 );
                } else {
                    intersects[ i ].object.material.color.set( 0x000000 );
                }
                console.log(cells[refX][refY]);
            } catch (e) {
                continue;
            }
        }
	}
    pointer.x = 4000;
    pointer.y = 4000;

    let currentTime = Math.floor((new Date()).getTime() / settings.speed);
    if(isrunning && secondTracker != currentTime) {
        secondTracker = currentTime;
        gameLoop();
    }
    // console.log();
    renderer.render( scene, camera );
}

/**
 * Read a snapshot of the previous generation so cell updates do not influence neighbors mid-step.
 *
 * Inputs: None; uses enclosing state where needed.
 * @returns No value is returned; updates the current state, scene, or interface.
 */
function gameLoop() {
    // console.log('running');
    let cpCells = JSON.parse(JSON.stringify(cells));
    for(let i = 0; i < settings.numberOfCells; i++) {
        for(let j = 0; j < settings.numberOfCells; j++) {
            // rule 1
            let counter = checkValueFromTo(i-1, j-1, i+1, j+1, i, j, cpCells);
            if(cpCells[i][j].isActive) {
                if(counter == 3) {
                    activateCell(i,j);
                } else if(counter < 2 || counter > 3) {
                    deactivateCell(i,j);
                }
            } else {
                if(counter == 3) {
                    activateCell(i,j);
                }
            }
        }
    }
    // console.log('end loop');
}

/**
 * Mark a cell alive and update its displayed color.
 *
 * @param i - Zero-based first grid coordinate.
 * @param j - Zero-based second grid coordinate.
 * @returns No value is returned; updates the current state, scene, or interface.
 */
function activateCell(i, j) {
    cells[i][j].isActive = true;
    cells[i][j].mesh.material.color.set(0xff0000);
}
/**
 * Mark a cell dead and update its displayed color.
 *
 * @param i - Zero-based first grid coordinate.
 * @param j - Zero-based second grid coordinate.
 * @returns No value is returned; updates the current state, scene, or interface.
 */
function deactivateCell(i, j) {
    cells[i][j].isActive = false;
    cells[i][j].mesh.material.color.set(0x000000);
}

/**
 * Count active neighbors in a rectangular neighborhood, excluding the current cell.
 *
 * @param indexIStart - First included row in the neighbor scan.
 * @param indexJStart - First included column in the neighbor scan.
 * @param indexIEnd - Last included row in the neighbor scan.
 * @param indexJEnd - Last included column in the neighbor scan.
 * @param indexIToIgnore - Row of the current cell, which must not count as its own neighbor.
 * @param indexJToIgnore - Column of the current cell, excluded from the neighbor count.
 * @param cpCells - Snapshot of the prior generation, used for consistent neighbor counting.
 * @returns Number of live neighbors in the requested rectangle, excluding the current cell.
 */
function checkValueFromTo(indexIStart, indexJStart, indexIEnd, indexJEnd, indexIToIgnore, indexJToIgnore, cpCells) {
    let counter = 0;
    for(let i = indexIStart; i <= indexIEnd; i++) {
        for(let j = indexJStart; j <= indexJEnd; j++) {
            if((i != indexIToIgnore || j != indexJToIgnore) && checkValue(i, j, cpCells) == true) {
                counter += 1;
            }
        }
    }
    return counter;
}

/**
 * Safely read a cell; positions outside the finite board have no live state.
 *
 * @param indexI - First coordinate of the cell to read.
 * @param indexJ - Second coordinate of the cell to read.
 * @param cpCells - Snapshot of the prior generation, used for consistent neighbor counting.
 * @returns True for a live in-bounds cell, false for a dead cell, or null outside the board.
 */
function checkValue(indexI, indexJ, cpCells) {
    if(indexI < 0 || indexI >= settings.numberOfCells || indexJ < 0 || indexJ >= settings.numberOfCells) {
        return null;
    } else if (cpCells[indexI][indexJ].isActive == true) {
        return true;
    } else {
        return false;
    }
}

document.addEventListener(
    "click",
    event => {
        pointer.set(
            ( event.clientX / window.innerWidth ) * 2 - 1,
            - ( (event.clientY - offset) / (window.innerHeight-offset) ) * 2 + 1,
            0.5
        );
    },
    false
);

/**
 * Recreate grid helpers and cell meshes using the current dimensions.
 *
 * Inputs: None; uses enclosing state where needed.
 * @returns No value is returned; updates the current state, scene, or interface.
 */
function createGrid() {
    while(scene.children.length > 0){ 
        scene.remove(scene.children[0]); 
    }
    cells = [];
    // generate grid
    const gridHelper = new THREE.GridHelper(settings.gridSize, settings.numberOfCells, 0x5c5c5c, 0x5c5c5c);
    gridHelper.rotation.x=Math.PI/2;
    gridHelper.position.z = 2;
    gridHelper.position.x = settings.gridSize / 2;
    gridHelper.position.y = settings.gridSize / 2;
    scene.add( gridHelper );

    let referenceX = 0;
    let referenceY = 0;
    let cellSize   = settings.gridSize / settings.numberOfCells;
    for(let column = 0; column < settings.numberOfCells; column++) {
        let meshs = [];
        let tmpRefY = referenceY;
        for(let line = 0; line < settings.numberOfCells; line++) {
            // generate plane
            const cellGeometry = new THREE.PlaneGeometry( cellSize, cellSize );
            const cellMaterial = new THREE.MeshBasicMaterial( {color: 0x000000, side: THREE.DoubleSide} );
            const cell = new THREE.Mesh( cellGeometry, cellMaterial );
            cell.position.z = 1;
            cell.position.x = referenceX + cellSize/2;
            cell.position.y = tmpRefY + cellSize/2;
            meshs.push(
                {
                    isActive : false,
                    mesh: cell
                }
            );
            scene.add( cell );
            tmpRefY += cellSize;
        }
        referenceX += cellSize;
        cells.push(meshs);
    }

    camera.position.z = 6;
    camera.position.x = settings.gridSize / 2;
    camera.position.y = settings.gridSize /2 ;
    controls.target.x = settings.gridSize / 2;
    controls.target.y = settings.gridSize / 2;
    controls.update();
}

