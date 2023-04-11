
/**
 * Helper class for working with rectangle instance data, since WebGL and WebGPU implementations are using instance data in same way.
 */
export class RectangleInstanceData 
{

    /**
     * The instance data.
     * Holds information about instance position and size, for 5 rectangles.
     * pos(vec2), size(vec2) * 5
     */
    public readonly data = new Float32Array(20);

   /**
     * Draws the left sub-rect of a rectangle
     */
   private drawLeftRect (x: number, y: number, h: number, tlr: number, blr: number)
   {
       const d = this.data;

       // must draw a longer radius for x positions. since rect is drawn from top left clock wise
       const rw = Math.max(tlr, blr);

       // pos
       d[0] = x;       // x
       d[1] = y + tlr; // y + r

       // size
       d[2] = rw;
       d[3] = h - tlr - blr // h - r - r;
   }

   /**
    * Draws the top sub-rect of a rectangle
    */
   private drawTopRect (x: number, y: number, w: number, tlr: number, trr: number)
   {
       const d = this.data;

       // must draw a longer radius for x positions. since rect is drawn from top left clock wise
       const rh = Math.max(tlr, trr);

       // pos 
       d[4] = x + tlr; // x + r
       d[5] = y; // y

       // size 
       d[6] = w - tlr - trr;     // w - r - r
       d[7] = rh;           // h
   }

   /**
    * Draws the right sub-rect of a rectangle
    */
   private drawRightRect (x: number, y: number, w: number, h: number, trr: number, brr: number)
   {
       const d = this.data;

       // must draw a longer radius for x positions. since rect is drawn from top left clock wise
       const rw = Math.max(brr, trr);

       // pos
       d[8] = x + w - rw; // x + w - r
       d[9] = y + trr; // y + r

       // size
       d[10] = rw;     // w 
       d[11] = h - trr - brr;  // h - r - r
   }

   /**
    * Draws the bottom sub-rect of a rectangle
    */
   private drawBottomRect (x: number, y: number, w: number, h: number, brr: number, blr: number)
   {
       const d = this.data;

       // must draw a longer radius for x positions. since rect is drawn from top left clock wise
       const rh = Math.max(brr, blr);

       // pos
       d[12] = x + blr; // x + r
       d[13] = y + h - rh; // y + h - r

       // size
       d[14] = w - blr - brr; // w - r - r
       d[15] = rh;
   }

   /**
    * Draws the inner rect of a rectangle.
    */
   private drawInnerRect (x: number, y: number, w: number, h: number, tl: number, tr: number, br: number, bl: number)
   {
       const d = this.data;

       const mt = Math.min(tl, tr); // min top
       const ml = Math.min(tl, bl); // min left

       // pos 
       d[16] = x + ml
       d[17] = y + mt;

       // size
       d[18] = w - ml - Math.min(br, tr); 
       d[19] = h - mt - Math.min(bl, br);
   }

   /**
    * Fills the instance rect with data.
    * @param x - the x position.
    * @param y - the y position.
    * @param w - the width of a rect.
    * @param h - the height of a rect. 
    * @param tl - the top left corner radius.
    * @param tr - the top right corner radius.
    * @param br - the bottom right corner radius.
    * @param bl - the bottom left corner radius.
    */
    public fillInstance (
        x: number, y: number, w: number, h: number,
        tl: number, tr: number, br: number, bl: number): void 
    {

        // rects
        this.drawLeftRect(x, y, h, tl, bl);
        this.drawTopRect(x, y, w, tl, tr);
        this.drawRightRect(x, y, w, h, tr, br);
        this.drawBottomRect(x, y, w, h, br, bl);
        this.drawInnerRect(x, y, w, h, tl, tr, br, bl);
    }
}