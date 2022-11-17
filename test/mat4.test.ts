
import { Vec3 } from "../src/framework/math/vec/Vec3";
import { Mat4x4 } from "../src/index"

describe("mat4 tests", () => 
{
    it("orthographic camera test", () => 
    {
        const width = 800;
        const height = 600;
        const mat = Mat4x4.orthographic(0, width, height, 0, 0.1, 1000) as Mat4x4;

        expect(mat.r0c0).toBeCloseTo(0.00249999994);
        expect(mat.r1c1).toBeCloseTo(-0.00333333341);
        expect(mat.r2c2).toBeCloseTo(0.00200019986);
        expect(mat.r0c3).toBeCloseTo(-1);
        expect(mat.r1c3).toBeCloseTo(1);
        expect(mat.r2c3).toBeCloseTo(-1.00019991);
        expect(mat.r3c3).toBeCloseTo(1);
    });

    it("view camera test", () => 
    {
        const mat = Mat4x4.lookAt(new Vec3(0,0,10), Vec3.zero(), Vec3.unitY()) as Mat4x4;

        expect(mat.r1c3).toBeCloseTo(-10);
        expect(mat.r2c3).toBeCloseTo(-10);
    });
});