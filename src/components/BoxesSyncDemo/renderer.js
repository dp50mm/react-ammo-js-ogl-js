//eslint-disable-next-line import/no-webpack-loader-syntax
import physicsWorker from 'workerize-loader!./physicsWorker'
import {
    Renderer,
    Camera,
    Transform,
    Box,
    Program,
    Mesh,
    Vec3,
    Quat,
    Orbit,
    Color
} from 'ogl'
import {
    brickMass,
    brickLength,
    brickDepth,
    brickHeight,
    numBricksLength,
    numBricksHeight,
    z0
} from './constants'
import {
    vertex,
    fragment
} from './shader'
import _ from 'lodash'

let worker = physicsWorker()


let size = {
    width: 100,
    height: 100
}

let renderer = new Renderer({ dpr: 2})
let gl = renderer.gl
gl.clearColor(50/255,50/255,50/255,1)

const camera = new Camera(gl, {
    fov: 45,
    far: 10000
})

camera.position.z = 200
camera.position.y = 100
camera.lookAt(new Vec3(0))
const controls = new Orbit(camera, {
    target: new Vec3(0)
})

const scene = new Transform()

const program = new Program(gl, {
    vertex, fragment
})

const boxGeometry = new Box(gl, {
    width: 99.9,
    height: 100,
    depth: 99.9
})

const boundsColorVec = [0.5,0.5,0.5]
let boundsColor = new Float32Array(boxGeometry.attributes.position.data.length)
for (let i = 0; i < boundsColor.length / 3; i++) {
    boundsColor.set(boundsColorVec, i * 3)
}
boxGeometry.addAttribute('color', {
    size: 3, data: boundsColor
})

let boxMesh = new Mesh(gl, {
    mode: gl.LINE_LOOP,
    geometry: boxGeometry,
    program
})
boxMesh.setParent(scene)

let canvasCreated = false

export var animating = false

export function start(canvasContainer, _size) {
    console.log('start')
    size = _size
    animating = true
    if(canvasCreated === false) {
        console.log(canvasContainer)
        canvasCreated = true
        canvasContainer.appendChild(gl.canvas)
        resize()
        render()
        worker.init()
        intialisePhysics()
        
        
    }

}

let initialisedPhysics = false

function intialisePhysics() {
    worker.checkInitialisation().then(ammo_initialized => {
        console.log(ammo_initialized)
        if(ammo_initialized && initialisedPhysics === false) {
            createObjects()
            initialisedPhysics = true
        } else {
            console.log('worker physics not initialised yet, try again in 200ms')
            setTimeout(() => {
                intialisePhysics()
            }, 200)
        }
    })
}

export function stop() {
    console.log('stop')
}

export function windowResize(_size) {
    size = _size
    resize()
}

function resize() {
    renderer.setSize(size.width, size.height)
    camera.perspective({
        aspect: size.width / size.height
    })
    renderer.render({scene, camera})
}

/**
 * Sync functions
 */


 const colorOptions = [
     [234/255, 52/255, 76/255],
     [222/255, 240/255, 241/255],
     [168/255, 130/255, 186/255],
     [21/255, 35/255, 46/255]
 ]

function createObjects() {
    var pos = new Vec3()
    var quat = new Quat()
    console.log(pos)
    pos.y = -50
    createParallelBrick(
        100,
        1,
        100,
        0,
        pos,
        quat,
        [21/255, 35/255, 46/255]
    )

    _.range(100).map(val => {
        //var pos = new Vec3(Math.random() * 200 - 100, -20 + val * 3, Math.random() * 200 - 100)
        var pos = new Vec3(Math.random() * 5, -20 + val * 3, Math.random() * 5)
        var quat = new Quat()
        quat.rotateY(Math.random() * Math.PI)
        quat.rotateZ(Math.random() - 0.5)
        createParallelBrick(
            20,
            2,
            2,
            1,
            pos,
            quat,
            _.cloneDeep(colorOptions[Math.floor(Math.random() * 3.999)])
        )
    })

    for (var j = 0; j < numBricksHeight; j++) {
        var oddRow = (j % 2) == 1
        // console.log(j, oddRow)
    }
}

let brickCounter = 0

function brickId() {
    brickCounter += 1
    return `brick-${brickCounter}`.slice()
}

// function that creates the OGL object and calls the 
function createParallelBrick(sx, sy, sz, mass, pos, quat, blockColor) {
    let id = brickId()

    let geometry = new Box(gl, {
        width: sx,
        height: sy,
        depth: sz
    })
    
    const colorVec = blockColor
    let color = new Float32Array(geometry.attributes.position.data.length)
    for (let i = 0; i < color.length / 3; i++) {
        color.set(colorVec, i * 3)
    }
    geometry.addAttribute('color', {
        size: 3, data: color
    })
    let boxMesh = new Mesh(gl, {
        geometry,
        program
    })
    boxMesh.position.set(pos)
    boxMesh.quaternion.set(quat)
    boxMesh._id = id
    boxMesh.setParent(scene)
    worker.createBrick(sx, sy, sz, mass, pos, quat.toArray(), id)
    // worker.createBrick(sx, sy, sz, mass, pos, quat, id)
}

let frame = 0

const frameRate = 1/60 * 1000

function render() {
    if(initialisedPhysics) {
        worker.physicsTick().then(bodies => {
            scene.children.forEach(child => {
                const child_id = _.get(child, '_id', false)
                if(child_id) {
                    if(_.has(bodies, child_id)) {
                        const p = bodies[child_id]
                        child.position.x = p.x
                        child.position.y = p.y
                        child.position.z = p.z

                        child.quaternion.x = p.r.x
                        child.quaternion.y = p.r.y
                        child.quaternion.z = p.r.z
                        child.quaternion.w = p.r.w
                    }
                }
                
            })
            frame += 1
            controls.update()
            renderer.render({scene, camera})
            if(animating) {
                setTimeout(() => {
                    render()
                }, frameRate)
            }
        })
    } else {
        frame += 1
        controls.update()
        renderer.render({scene, camera})
        if(animating) {
            setTimeout(() => {
                render()
            }, frameRate)
        }
    }
}