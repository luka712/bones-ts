import { Vec2 } from "../vec/Vec2";

/**
 * Define a quad for 2 dimensional points.
 */
export class Quad2D 
{
    /**
     * Constructs a 2d quad.
     * @param { Vec2 } a 
     * @param { Vec2 } b 
     * @param { Vec2 } c 
     * @param { Vec2 } d 
     */
    constructor(
        public a: Vec2,
        public b: Vec2,
        public c: Vec2,
        public d: Vec2
    ) { }
}