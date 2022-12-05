
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
}

export 
{
    Rect
}