PhiloGL.unpack();

assert(typeof PhiloGL.Vec3 === 'function');
assert(typeof PhiloGL.Mat4 === 'function');
assert(typeof PhiloGL.Quat === 'function');

var v = new PhiloGL.Vec3;
assert(v.x === 0);
assert(v.y === 0);
assert(v.z === 0);
assert(typeof v.add === 'function');
assert(typeof v.add2 === 'function');
assert(typeof v.clone === 'function');
assert(typeof v.cross === 'function');
assert(typeof v.distTo === 'function');
assert(typeof v.distToSq === 'function');
assert(typeof v.dot === 'function');
assert(typeof v.neg === 'function');
assert(typeof v.norm === 'function');
assert(typeof v.normSq === 'function');
assert(typeof v.scale === 'function');
assert(typeof v.setVec3 === 'function');
assert(typeof v.sub === 'function');
assert(typeof v.sub2 === 'function');
assert(typeof v.unit === 'function');

var m = new PhiloGL.Mat4;
//test getters and setters
assert(m.n11 === 1);
assert(m.n12 === 0);
assert(m.n13 === 0);
assert(m.n14 === 0);
assert(m.n21 === 0);
assert(m.n22 === 1);
assert(m.n23 === 0);
assert(m.n24 === 0);
assert(m.n31 === 0);
assert(m.n32 === 0);
assert(m.n33 === 1);
assert(m.n34 === 0);
assert(m.n41 === 0);
assert(m.n42 === 0);
assert(m.n43 === 0);
assert(m.n44 === 1);

//test id
assert(typeof Mat4.id === 'function');
m.id();
assert(m[0 ] === 1);
assert(m[1 ] === 0);
assert(m[2 ] === 0);
assert(m[3 ] === 0);
assert(m[4 ] === 0);
assert(m[5 ] === 1);
assert(m[6 ] === 0);
assert(m[7 ] === 0);
assert(m[8 ] === 0);
assert(m[9 ] === 0);
assert(m[10] === 1);
assert(m[11] === 0);
assert(m[12] === 0);
assert(m[13] === 0);
assert(m[14] === 0);
assert(m[15] === 1);

//test add
assert(typeof Mat4.add === 'function');
m = m.add(m);
assert(m[0 ] === 2);
assert(m[1 ] === 0);
assert(m[2 ] === 0);
assert(m[3 ] === 0);
assert(m[4 ] === 0);
assert(m[5 ] === 2);
assert(m[6 ] === 0);
assert(m[7 ] === 0);
assert(m[8 ] === 0);
assert(m[9 ] === 0);
assert(m[10] === 2);
assert(m[11] === 0);
assert(m[12] === 0);
assert(m[13] === 0);
assert(m[14] === 0);
assert(m[15] === 2);

//test $add
assert(typeof Mat4.$add === 'function');
m.id();
m.$add(m);
assert(m[0 ] === 2);
assert(m[1 ] === 0);
assert(m[2 ] === 0);
assert(m[3 ] === 0);
assert(m[4 ] === 0);
assert(m[5 ] === 2);
assert(m[6 ] === 0);
assert(m[7 ] === 0);
assert(m[8 ] === 0);
assert(m[9 ] === 0);
assert(m[10] === 2);
assert(m[11] === 0);
assert(m[12] === 0);
assert(m[13] === 0);
assert(m[14] === 0);
assert(m[15] === 2);

//test frustum
assert(typeof Mat4.frustum === 'function');

//test invert
assert(typeof Mat4.invert === 'function');
m.id();
m = m.invert();
assert(m[0 ] === 1);
assert(m[1 ] === 0);
assert(m[2 ] === 0);
assert(m[3 ] === 0);
assert(m[4 ] === 0);
assert(m[5 ] === 1);
assert(m[6 ] === 0);
assert(m[7 ] === 0);
assert(m[8 ] === 0);
assert(m[9 ] === 0);
assert(m[10] === 1);
assert(m[11] === 0);
assert(m[12] === 0);
assert(m[13] === 0);
assert(m[14] === 0);
assert(m[15] === 1);

//test $invert
assert(typeof Mat4.$invert === 'function');
m.id();
m.$invert();
assert(m[0 ] === 1);
assert(m[1 ] === 0);
assert(m[2 ] === 0);
assert(m[3 ] === 0);
assert(m[4 ] === 0);
assert(m[5 ] === 1);
assert(m[6 ] === 0);
assert(m[7 ] === 0);
assert(m[8 ] === 0);
assert(m[9 ] === 0);
assert(m[10] === 1);
assert(m[11] === 0);
assert(m[12] === 0);
assert(m[13] === 0);
assert(m[14] === 0);
assert(m[15] === 1);

//test lookAt
assert(typeof Mat4.lookAt === 'function');

//test mulMat4
assert(typeof Mat4.mulMat4 === 'function');
var m1 = new Mat4;
var m2 = new Mat4;
m1 = m1.mulMat4(m2);
assert(m1[0 ] === 1);
assert(m1[1 ] === 0);
assert(m1[2 ] === 0);
assert(m1[3 ] === 0);
assert(m1[4 ] === 0);
assert(m1[5 ] === 1);
assert(m1[6 ] === 0);
assert(m1[7 ] === 0);
assert(m1[8 ] === 0);
assert(m1[9 ] === 0);
assert(m1[10] === 1);
assert(m1[11] === 0);
assert(m1[12] === 0);
assert(m1[13] === 0);
assert(m1[14] === 0);
assert(m1[15] === 1);

//test $mulMat4
assert(typeof Mat4.$mulMat4 === 'function');
var m1 = new Mat4;
var m2 = new Mat4;
m1.$mulMat4(m2);
assert(m1[0 ] === 1);
assert(m1[1 ] === 0);
assert(m1[2 ] === 0);
assert(m1[3 ] === 0);
assert(m1[4 ] === 0);
assert(m1[5 ] === 1);
assert(m1[6 ] === 0);
assert(m1[7 ] === 0);
assert(m1[8 ] === 0);
assert(m1[9 ] === 0);
assert(m1[10] === 1);
assert(m1[11] === 0);
assert(m1[12] === 0);
assert(m1[13] === 0);
assert(m1[14] === 0);
assert(m1[15] === 1);

//test mulMat42
assert(typeof Mat4.mulMat42 === 'function');
var m1 = new Mat4;
var m2 = new Mat4;
var ans = new Mat4;
ans.mulMat42(m1, m2);

assert(ans[0 ] === 1);
assert(ans[1 ] === 0);
assert(ans[2 ] === 0);
assert(ans[3 ] === 0);
assert(ans[4 ] === 0);
assert(ans[5 ] === 1);
assert(ans[6 ] === 0);
assert(ans[7 ] === 0);
assert(ans[8 ] === 0);
assert(ans[9 ] === 0);
assert(ans[10] === 1);
assert(ans[11] === 0);
assert(ans[12] === 0);
assert(ans[13] === 0);
assert(ans[14] === 0);
assert(ans[15] === 1);

//test mulVec3
assert(typeof Mat4.mulVec3 === 'function');
var v = new Vec3(1, 1, 1),
    m = new Mat4,
    ans = m.mulVec3(v);

assert(ans[0] === 1);
assert(ans[1] === 1);
assert(ans[2] === 1);

//test $mulVec3
assert(typeof Mat4.$mulVec3 === 'function');
var v = new Vec3(1, 1, 1),
    m = new Mat4;

m.$mulVec3(v);

assert(v[0] === 1);
assert(v[1] === 1);
assert(v[2] === 1);

//test perspective
assert(typeof Mat4.perspective === 'function');

//test rotateAxis
assert(typeof Mat4.rotateAxis === 'function');
var v = [1, 1, 1],
    theta = 0,
    m = new Mat4,
    ans = m.rotateAxis(theta, v);

assert(m[0 ] === 1);
assert(m[1 ] === 0);
assert(m[2 ] === 0);
assert(m[3 ] === 0);
assert(m[4 ] === 0);
assert(m[5 ] === 1);
assert(m[6 ] === 0);
assert(m[7 ] === 0);
assert(m[8 ] === 0);
assert(m[9 ] === 0);
assert(m[10] === 1);
assert(m[11] === 0);
assert(m[12] === 0);
assert(m[13] === 0);
assert(m[14] === 0);
assert(m[15] === 1);

//test $rotateAxis
assert(typeof Mat4.$rotateAxis === 'function');
var v = [1, 1, 1],
    theta = 0,
    m = new Mat4;
    
m.$rotateAxis(theta, v);

assert(m[0 ] === 1);
assert(m[1 ] === 0);
assert(m[2 ] === 0);
assert(m[3 ] === 0);
assert(m[4 ] === 0);
assert(m[5 ] === 1);
assert(m[6 ] === 0);
assert(m[7 ] === 0);
assert(m[8 ] === 0);
assert(m[9 ] === 0);
assert(m[10] === 1);
assert(m[11] === 0);
assert(m[12] === 0);
assert(m[13] === 0);
assert(m[14] === 0);
assert(m[15] === 1);

//test rotateXYZ
assert(typeof Mat4.rotateXYZ === 'function');
m.id();
var ans = m.rotateXYZ(0, 0, 0);

assert(ans[0 ] === 1);
assert(ans[1 ] === 0);
assert(ans[2 ] === 0);
assert(ans[3 ] === 0);
assert(ans[4 ] === 0);
assert(ans[5 ] === 1);
assert(ans[6 ] === 0);
assert(ans[7 ] === 0);
assert(ans[8 ] === 0);
assert(ans[9 ] === 0);
assert(ans[10] === 1);
assert(ans[11] === 0);
assert(ans[12] === 0);
assert(ans[13] === 0);
assert(ans[14] === 0);
assert(ans[15] === 1);

//test $rotateXYZ
assert(typeof Mat4.$rotateXYZ === 'function');
m.id();
m.$rotateXYZ(0, 0, 0);

assert(m[0 ] === 1);
assert(m[1 ] === 0);
assert(m[2 ] === 0);
assert(m[3 ] === 0);
assert(m[4 ] === 0);
assert(m[5 ] === 1);
assert(m[6 ] === 0);
assert(m[7 ] === 0);
assert(m[8 ] === 0);
assert(m[9 ] === 0);
assert(m[10] === 1);
assert(m[11] === 0);
assert(m[12] === 0);
assert(m[13] === 0);
assert(m[14] === 0);
assert(m[15] === 1);

//test scale
assert(typeof Mat4.scale === 'function');
m.id();
var ans = m.scale(2, 2, 2);

assert(ans[0 ] === 2);
assert(ans[1 ] === 0);
assert(ans[2 ] === 0);
assert(ans[3 ] === 0);
assert(ans[4 ] === 0);
assert(ans[5 ] === 2);
assert(ans[6 ] === 0);
assert(ans[7 ] === 0);
assert(ans[8 ] === 0);
assert(ans[9 ] === 0);
assert(ans[10] === 2);
assert(ans[11] === 0);
assert(ans[12] === 0);
assert(ans[13] === 0);
assert(ans[14] === 0);
assert(ans[15] === 1);

//test $scale
assert(typeof Mat4.$scale === 'function');
m.id();
m.$scale(2, 2, 2);

assert(m[0 ] === 2);
assert(m[1 ] === 0);
assert(m[2 ] === 0);
assert(m[3 ] === 0);
assert(m[4 ] === 0);
assert(m[5 ] === 2);
assert(m[6 ] === 0);
assert(m[7 ] === 0);
assert(m[8 ] === 0);
assert(m[9 ] === 0);
assert(m[10] === 2);
assert(m[11] === 0);
assert(m[12] === 0);
assert(m[13] === 0);
assert(m[14] === 0);
assert(m[15] === 1);

//test set
assert(typeof Mat4.set === 'function');
m.id();
m.set(1, 5, 9 , 13,
      2, 6, 10, 14,
      3, 7, 11, 15,
      4, 8, 12, 16);

assert(m[0 ] === 1);
assert(m[1 ] === 2);
assert(m[2 ] === 3);
assert(m[3 ] === 4);
assert(m[4 ] === 5);
assert(m[5 ] === 6);
assert(m[6 ] === 7);
assert(m[7 ] === 8);
assert(m[8 ] === 9);
assert(m[9 ] === 10);
assert(m[10] === 11);
assert(m[11] === 12);
assert(m[12] === 13);
assert(m[13] === 14);
assert(m[14] === 15);
assert(m[15] === 16);

//test toFloat32Array
assert(typeof Mat4.toFloat32Array === 'function');
m.id();
assert(m.toFloat32Array().BYTES_PER_ELEMENT === 4);

//test translate
assert(typeof Mat4.translate === 'function');
m.id();
var ans = m.translate(1, 2, 3);

assert(ans[0 ] === 1);
assert(ans[1 ] === 0);
assert(ans[2 ] === 0);
assert(ans[3 ] === 0);
assert(ans[4 ] === 0);
assert(ans[5 ] === 1);
assert(ans[6 ] === 0);
assert(ans[7 ] === 0);
assert(ans[8 ] === 0);
assert(ans[9 ] === 0);
assert(ans[10] === 1);
assert(ans[11] === 0);
assert(ans[12] === 1);
assert(ans[13] === 2);
assert(ans[14] === 3);
assert(ans[15] === 1);

//test $translate
assert(typeof Mat4.$translate === 'function');
m.id();
m.$translate(1, 2, 3);

assert(m[0 ] === 1);
assert(m[1 ] === 0);
assert(m[2 ] === 0);
assert(m[3 ] === 0);
assert(m[4 ] === 0);
assert(m[5 ] === 1);
assert(m[6 ] === 0);
assert(m[7 ] === 0);
assert(m[8 ] === 0);
assert(m[9 ] === 0);
assert(m[10] === 1);
assert(m[11] === 0);
assert(m[12] === 1);
assert(m[13] === 2);
assert(m[14] === 3);
assert(m[15] === 1);

//test transpose
assert(typeof Mat4.transpose === 'function');
m.id();
var ans = m.transpose();

assert(ans[0 ] === 1);
assert(ans[1 ] === 0);
assert(ans[2 ] === 0);
assert(ans[3 ] === 0);
assert(ans[4 ] === 0);
assert(ans[5 ] === 1);
assert(ans[6 ] === 0);
assert(ans[7 ] === 0);
assert(ans[8 ] === 0);
assert(ans[9 ] === 0);
assert(ans[10] === 1);
assert(ans[11] === 0);
assert(ans[12] === 0);
assert(ans[13] === 0);
assert(ans[14] === 0);
assert(ans[15] === 1);

//test $transpose
assert(typeof Mat4.$transpose === 'function');
m.id();
m.$transpose();

assert(m[0 ] === 1);
assert(m[1 ] === 0);
assert(m[2 ] === 0);
assert(m[3 ] === 0);
assert(m[4 ] === 0);
assert(m[5 ] === 1);
assert(m[6 ] === 0);
assert(m[7 ] === 0);
assert(m[8 ] === 0);
assert(m[9 ] === 0);
assert(m[10] === 1);
assert(m[11] === 0);
assert(m[12] === 0);
assert(m[13] === 0);
assert(m[14] === 0);
assert(m[15] === 1);

var q = new PhiloGL.Quat;


var q = new PhiloGL.Quat;
assert(q.x === 0);
assert(q.y === 0);
assert(q.z === 0);
assert(q.w === 0);
assert(typeof q.add === 'function');
assert(typeof q.clone === 'function');
assert(typeof q.conjugate === 'function');
assert(typeof q.divQuat === 'function');
assert(typeof q.invert === 'function');
assert(typeof q.mulQuat === 'function');
assert(typeof q.neg === 'function');
assert(typeof q.norm === 'function');
assert(typeof q.normSq === 'function');
assert(typeof q.scale === 'function');
assert(typeof q.set === 'function');
assert(typeof q.setQuat === 'function');
assert(typeof q.sub === 'function');
assert(typeof q.unit === 'function');
delete q;

var q = PhiloGL.Quat.fromAxisRotation(new PhiloGL.Vec3(0, 0, 1), Math.PI);
assert(q.x === 0);
assert(q.y === 0);
assert(q.z === 1);
assert(q.w === Math.cos(Math.PI / 2));
delete q;

var q = PhiloGL.Quat.fromAxisRotation(new PhiloGL.Vec3(0, 1, 0), Math.PI);
assert(q.x === 0);
assert(q.y === 1);
assert(q.z === 0);
assert(q.w === Math.cos(Math.PI / 2));
delete q;

var q = PhiloGL.Quat.fromAxisRotation(new PhiloGL.Vec3(1, 0, 0), Math.PI);
assert(q.x === 1);
assert(q.y === 0);
assert(q.z === 0);
assert(q.w === Math.cos(Math.PI / 2));
delete q;

var q1 = PhiloGL.Quat.fromAxisRotation(new PhiloGL.Vec3(5, 0, -2), Math.PI / 3),
    q2 = PhiloGL.Quat.fromAxisRotation(new PhiloGL.Vec3(1, 3, 0), Math.PI / 4);
q1.$mulQuat(q2);
assert(q1.x === 0.6011183144537015);
assert(q1.y === 0.29193457751898655);
assert(q1.z === -0.0030205353559888126);
assert(q1.w === 0.7439232829017486);
delete q1;
delete q2;
