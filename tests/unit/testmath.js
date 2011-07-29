PhiloGL.unpack();

var abs = Math.abs, delta = 0.001;

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

//test set
assert(typeof Mat4.set === 'function');
m.id();
m.set(1, 2, 3, 4,
      5, 6, 7, 8,
      9, 10, 11, 12,
      13,14, 15, 16);

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

//test add
assert(typeof Mat4.add === 'function');
m.id();
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

//test transpose
assert(typeof Mat4.transpose === 'function');
m.id();
m.set(1, 5, 9 , 13,
      2, 6, 10, 14,
      3, 7, 11, 15,
      4, 8, 12, 16);

var ans = m.transpose();

assert(abs(ans.n11 - 1) < delta);
assert(abs(ans.n12 - 2) < delta);
assert(abs(ans.n13 - 3) < delta);
assert(abs(ans.n14 - 4) < delta);
assert(abs(ans.n21 - 5) < delta);
assert(abs(ans.n22 - 6) < delta);
assert(abs(ans.n23 - 7) < delta);
assert(abs(ans.n24 - 8) < delta);
assert(abs(ans.n31 - 9) < delta);
assert(abs(ans.n32 - 10) < delta);
assert(abs(ans.n33 - 11) < delta);
assert(abs(ans.n34 - 12) < delta);
assert(abs(ans.n41 - 13) < delta);
assert(abs(ans.n42 - 14) < delta);
assert(abs(ans.n43 - 15) < delta);
assert(abs(ans.n44 - 16) < delta);

//test mulMat42
assert(typeof Mat4.mulMat42 === 'function');
var m1 = new Mat4;
m1.set(1, 2, 3 , 4,
       5, 6, 7, 8,
       9, 10, 11, 12,
       13, 14, 15, 16);

var m2 = new Mat4;
m2.set(1, 2, 3, 4,
       5, 6, 7, 8,
       9, 10, 11, 12,
       13, 14, 15, 16).$transpose();

var ans = new Mat4;
ans.mulMat42(m1, m2);

assert(abs(ans.n11 - 276) < delta);
assert(abs(ans.n12 - 304) < delta);
assert(abs(ans.n13 - 332) < delta);
assert(abs(ans.n14 - 360) < delta);
assert(abs(ans.n21 - 304) < delta);
assert(abs(ans.n22 - 336) < delta);
assert(abs(ans.n23 - 368) < delta);
assert(abs(ans.n24 - 400) < delta);
assert(abs(ans.n31 - 332) < delta);
assert(abs(ans.n32 - 368) < delta);
assert(abs(ans.n33 - 404) < delta);
assert(abs(ans.n34 - 440) < delta);
assert(abs(ans.n41 - 360) < delta);
assert(abs(ans.n42 - 400) < delta);
assert(abs(ans.n43 - 440) < delta);
assert(abs(ans.n44 - 480) < delta);


//test rotateAxis
assert(typeof Mat4.rotateAxis === 'function');
var v = [1, 2, 3],
    len = Math.sqrt(1 * 1 + 2 * 2 + 3 * 3),
    theta = Math.PI / 4,
    m = new Mat4;

    v[0] /= len;
    v[1] /= len;
    v[2] /= len;

var ans = m.rotateAxis(theta, v);

assert(abs(ans.n11 - 0.7280277013778687) < delta);
assert(abs(ans.n12 - 0.6087886095046997) < delta);
assert(abs(ans.n13 - -0.31520164012908936) < delta);
assert(abs(ans.n14 - 0) < delta);
assert(abs(ans.n21 - -0.525104820728302) < delta);
assert(abs(ans.n22 - 0.7907905578613281) < delta);
assert(abs(ans.n23 - 0.3145079016685486) < delta);
assert(abs(ans.n24 - 0) < delta);
assert(abs(ans.n31 - 0.4407272934913635) < delta);
assert(abs(ans.n32 - -0.06345657259225845) < delta);
assert(abs(ans.n33 - 0.8953952789306641) < delta);
assert(abs(ans.n34 - 0) < delta);
assert(abs(ans.n41 - 0) < delta);
assert(abs(ans.n42 - 0) < delta);
assert(abs(ans.n43 - 0) < delta);
assert(abs(ans.n44 - 1) < delta);


//test rotateXYZ
assert(typeof Mat4.rotateXYZ === 'function');
m.id();
var ans = m.rotateXYZ(1, 2, 3);
assert(abs(ans.n11 - 0.411982245665683) < delta);
assert(abs(ans.n12 - -0.8337376517741568) < delta);
assert(abs(ans.n13 - -0.36763046292489926) < delta);
assert(abs(ans.n14 - 0) < delta);
assert(abs(ans.n21 - -0.05872664492762098) < delta);
assert(abs(ans.n22 - -0.42691762127620736) < delta);
assert(abs(ans.n23 - 0.9023815854833308) < delta);
assert(abs(ans.n24 - 0) < delta);
assert(abs(ans.n31 - -0.9092974268256817) < delta);
assert(abs(ans.n32 - -0.35017548837401463) < delta);
assert(abs(ans.n33 - -0.2248450953661529) < delta);
assert(abs(ans.n34 - 0) < delta);
assert(abs(ans.n41 - 0) < delta);
assert(abs(ans.n42 - 0) < delta);
assert(abs(ans.n43 - 0) < delta);
assert(abs(ans.n44 - 1) < delta);


//test scale
assert(typeof Mat4.scale === 'function');
m.id();
var ans = m.scale(1, 2, 3);

assert(ans[0 ] === 1);
assert(ans[1 ] === 0);
assert(ans[2 ] === 0);
assert(ans[3 ] === 0);
assert(ans[4 ] === 0);
assert(ans[5 ] === 2);
assert(ans[6 ] === 0);
assert(ans[7 ] === 0);
assert(ans[8 ] === 0);
assert(ans[9 ] === 0);
assert(ans[10] === 3);
assert(ans[11] === 0);
assert(ans[12] === 0);
assert(ans[13] === 0);
assert(ans[14] === 0);
assert(ans[15] === 1);


//test translate
assert(typeof Mat4.translate === 'function');
m.id();
var ans = m.translate(1, 2, 3);
assert(abs(ans.n11 - 1) < delta);
assert(abs(ans.n12 - 0) < delta);
assert(abs(ans.n13 - 0) < delta);
assert(abs(ans.n14 - 0) < delta);
assert(abs(ans.n21 - 0) < delta);
assert(abs(ans.n22 - 1) < delta);
assert(abs(ans.n23 - 0) < delta);
assert(abs(ans.n24 - 0) < delta);
assert(abs(ans.n31 - 0) < delta);
assert(abs(ans.n32 - 0) < delta);
assert(abs(ans.n33 - 1) < delta);
assert(abs(ans.n34 - 0) < delta);
assert(abs(ans.n41 - 1) < delta);
assert(abs(ans.n42 - 2) < delta);
assert(abs(ans.n43 - 3) < delta);
assert(abs(ans.n44 - 1) < delta);


//test frustum
assert(typeof Mat4.frustum === 'function');
m.id();
var ans = m.frustum(-1, 1, -1, 1, 0.1, 100);
assert(abs(ans.n11 - 0.1) < delta);
assert(abs(ans.n12 - 0) < delta);
assert(abs(ans.n13 - 0) < delta);
assert(abs(ans.n14 - 0) < delta);
assert(abs(ans.n21 - 0) < delta);
assert(abs(ans.n22 - 0.1) < delta);
assert(abs(ans.n23 - 0) < delta);
assert(abs(ans.n24 - 0) < delta);
assert(abs(ans.n31 - 0) < delta);
assert(abs(ans.n32 - 0) < delta);
assert(abs(ans.n33 - -1.002002002002002) < delta);
assert(abs(ans.n34 - -0.20020020020020018) < delta);
assert(abs(ans.n41 - 0) < delta);
assert(abs(ans.n42 - 0) < delta);
assert(abs(ans.n43 - -1) < delta);
assert(abs(ans.n44 - 0) < delta);


//test invert
assert(typeof Mat4.invert === 'function');
m.id();
var ans = m.frustum(-1, 1, -1, 1, 0.1, 100).invert();
assert(abs(ans.n11 - 9.99999999) < delta);
assert(abs(ans.n12 - 0) < delta);
assert(abs(ans.n13 - 0) < delta);
assert(abs(ans.n14 - 0) < delta);
assert(abs(ans.n21 - 0) < delta);
assert(abs(ans.n22 - 9.99999999) < delta);
assert(abs(ans.n23 - 0) < delta);
assert(abs(ans.n24 - 0) < delta);
assert(abs(ans.n31 - 0) < delta);
assert(abs(ans.n32 - 0) < delta);
assert(abs(ans.n33 - 0) < delta);
assert(abs(ans.n34 - -4.995) < delta);
assert(abs(ans.n41 - 0) < delta);
assert(abs(ans.n42 - 0) < delta);
assert(abs(ans.n43 - -1) < delta);
assert(abs(ans.n44 - 5.005) < delta);


//test lookAt
assert(typeof Mat4.lookAt === 'function');


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


//test toFloat32Array
assert(typeof Mat4.toFloat32Array === 'function');
m.id();
assert(m.toFloat32Array().BYTES_PER_ELEMENT === 4);


var q = new PhiloGL.Quat;


var q = new PhiloGL.Quat;
assert(q[0] === 0);
assert(q[1] === 0);
assert(q[2] === 0);
assert(q[3] === 0);
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
assert(q[0] === 0);
assert(q[1] === 0);
assert(q[2] === 1);
assert(q[3] === Math.cos(Math.PI / 2));
delete q;

var q = PhiloGL.Quat.fromAxisRotation(new PhiloGL.Vec3(0, 1, 0), Math.PI);
assert(q[0] === 0);
assert(q[1] === 1);
assert(q[2] === 0);
assert(q[3] === Math.cos(Math.PI / 2));
delete q;

var q = PhiloGL.Quat.fromAxisRotation(new PhiloGL.Vec3(1, 0, 0), Math.PI);
assert(q[0] === 1);
assert(q[1] === 0);
assert(q[2] === 0);
assert(q[3] === Math.cos(Math.PI / 2));
delete q;

var q1 = PhiloGL.Quat.fromAxisRotation(new PhiloGL.Vec3(5, 0, -2), Math.PI / 3),
    q2 = PhiloGL.Quat.fromAxisRotation(new PhiloGL.Vec3(1, 3, 0), Math.PI / 4);
q1.$mulQuat(q2);
assert(q1[0] === 0.6011183144537015);
assert(q1[1] === 0.29193457751898655);
assert(q1[2] === -0.0030205353559888126);
assert(q1[3] === 0.7439232829017486);
delete q1;
delete q2;
