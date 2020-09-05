import _Ammo from 'libraries/ammo'
import {
    brickMass,
    brickLength,
    brickDepth
} from './constants'

let initializedAmmoLib = false


export function checkInitialisation() {
    return initializedAmmoLib
}

let Ammo = false

_Ammo().then((lib) => {
    Ammo = lib
    initializedAmmoLib = true
})

var gravityConstant = -9.8
var collisionConfiguration = false
var dispatcher = false
var broadphase = false
var solver = false
var softBodySolver = false
var physicsWorld = false
var rigidBodies = []
var margin = 0.05
var hinge = false
var cloth = false
var transformAux1 = false
var trans = false 


var time = 0
var armMovement = 0

export function init() {
    if(initializedAmmoLib) {
        initPhysics()
    } else {
        console.log('try initialisation again in 50ms')
        setTimeout(() => {
            init()
        }, 50)
    }
    
}



function initPhysics() {
    console.log('init physics')
    transformAux1 = new Ammo.btTransform()
    collisionConfiguration = new Ammo.btSoftBodyRigidBodyCollisionConfiguration();
    dispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration)
    broadphase = new Ammo.btDbvtBroadphase()
    solver = new Ammo.btSequentialImpulseConstraintSolver()
    softBodySolver = new Ammo.btDefaultSoftBodySolver()
    physicsWorld = new Ammo.btSoftRigidDynamicsWorld(dispatcher, broadphase, solver, collisionConfiguration, softBodySolver)
    physicsWorld.setGravity(new Ammo.btVector3(0, gravityConstant, 0))

    physicsWorld.getWorldInfo().set_m_gravity(new Ammo.btVector3(0, gravityConstant, 0))
    trans = new Ammo.btTransform()
}

var bodies = []


export function createBrick(sx, sy, sz, mass, pos, quat, id) {
    var brickShape = new Ammo.btBoxShape(new Ammo.btVector3(sx/2, sy/2, sz/2))
    var brickTransform = new Ammo.btTransform()
    brickTransform.setIdentity()
    brickTransform.setOrigin(new Ammo.btVector3(pos[0], pos[1], pos[2]))
    brickTransform.setRotation(new Ammo.btQuaternion(quat[0], quat[1], quat[2], quat[3]))
    var mass = mass
    var isDynamic = (mass !== 0)
    var localInertia = new Ammo.btVector3(0, 0, 0)
    if (isDynamic) brickShape.calculateLocalInertia(mass, localInertia)

    var myMotionState = new Ammo.btDefaultMotionState(brickTransform)
    var rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, myMotionState, brickShape, localInertia)
    var body = new Ammo.btRigidBody(rbInfo)
    physicsWorld.addRigidBody(body)
    body._id = id
    bodies.push(body)
}

export function physicsTick() {
    physicsWorld.stepSimulation(1/30, 10);
    let returnBodiesByKey = {}
    let mappedBodies = bodies.map(body => getParams(body))
    mappedBodies.forEach(body => {
        returnBodiesByKey[body._id] = body
    })
    return returnBodiesByKey
}



function getParams(body) {
    body.getMotionState().getWorldTransform(trans);
    const origin = trans.getOrigin()
    const rotation = trans.getRotation()
    return {
        _id: body._id,
        x: origin.x(),
        y: origin.y(),
        z: origin.z(),
        r: {
            x: rotation.x(),
            y: rotation.y(),
            z: rotation.z(),
            w: rotation.w()
        }
    }
}