import { Vec2 } from "../bones_math";

/**
 * The rectangle class.
 */
class Rect
{
    /**
     * The constructor.
     * @param { number } x 
     * @param { number } y 
     * @param { number } w 
     * @param { number } h 
     */
    constructor(public x: number = 0, public y: number  = 0, public w: number  = 0, public h: number  = 0)
    {

    }

    /**
     * The width.
     * Same as @see {@link w}
     */
    public get width(): number 
    {
        return this.w;
    }
    
    /**
     * The height.
     * Same as @see {@link h}
     */
    public get height(): number
    {
        return this.h;
    }

    /**
     * Does the rectangle intersects other rectangle.
     * @param { RectF } other 
     */
    public intersects(other: Rect): boolean 
    {
        return this.x < other.x + other.w
            && this.x + this.w > other.x
            && this.y + this.h > other.y
            && this.y < other.y + other.h;
    }

    /**
     * Checks rectangle with position vector intersection.
     * @param position_vector - the position vector.
     */
    public intersectsVector(position_vector: Vec2) : boolean 
    {
        return this.x <= position_vector.x 
        && this.x + this.w > position_vector.x
        && this.y + this.h > position_vector.y
        && this.y <= position_vector.y;
    }

    /**
     * Checks rectangle against position with x and y
     * @param x 
     * @param y 
     * @returns true if colliding
     */
    public intersectsPosition(x: number, y: number) : boolean 
    {
        return this.x <= x 
        && this.x + this.w > x
        && this.y + this.h > y
        && this.y <= y;
    }

    /**
     * Enlarges self with specified width and height.
     * @param width - width amount.
     * @param height - height amount.
     */
    public enlarge(width: number, height: number) : Rect 
    {
        this.x -= width;
        this.h -= height;
        this.w += width * 2;
        this.h += height * 2;
        return this;
    }

    /**
     * Enlarges the rect by specified amount.
     * @param in - rect to enlarge.
     * @param width - width amount.
     * @param height - height amount.
     * @param out 
     */
    public static enlarge(in_rect: Rect, width: number, height : number, out?: Rect) : Rect 
    {
        out = out ?? new Rect();

        out.x = in_rect.x - width;
        out.y = in_rect.y - height;
        out.w = in_rect.w + (width * 2);
        out.h = in_rect.h + (height * 2);
        return out;
    }
}

export 
{
    Rect
}