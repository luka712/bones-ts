import { randomInt } from "../src/framework/bones_math";


describe("mat4 tests", () => 
{
    // Make sure that integer is number between 0 and 7 and that all of them show at least once.
    it('randomInt test', () => 
    {   
        const array : Array<number> = [];
        for(let i = 0; i < 1000; i++)
        {
            array.push(randomInt(0, 7));
        }
        
        expect(array).toContain(0);
        expect(array).toContain(1);
        expect(array).toContain(2);
        expect(array).toContain(3);
        expect(array).toContain(4);
        expect(array).toContain(5);
        expect(array).toContain(6);
        expect(array).not.toContain(7);
    });
});