import { Vec2 } from "../vec/Vec2";

/**
 * Define a quad for 2 dimensional points.
 */
export class Quad2D 
{
    /**
     * Constructs a 2d quad.
     * @param { Vec2 } topLeft 
     * @param { Vec2 } topRight 
     * @param { Vec2 } bottomRight 
     * @param { Vec2 } bottomLeft 
     */
    constructor(
        public topLeft: Vec2,
        public topRight: Vec2,
        public bottomRight: Vec2,
        public bottomLeft: Vec2
    ) { }
}