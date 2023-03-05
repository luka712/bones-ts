import { Color, Mat4x4, Vec3 } from "../bones_math";

export abstract class RectangleRenderer 
{
     /**
      * @brief Initialize the renderer. Initialize must be called in order to properly initialize all the variables.
      */
     public abstract initialize (): void;

     /**
      * Draws the rectangle.
      * @param x - the x position.
      * @param y - the y position.
      * @param w - the rectangle width.
      * @param h - the rectangle height
      * @param color - the color of a rectangle. By default white.
      * @param tl - the top left corner radius.
      * @param tr - the top right corner radius.
      * @param br - the bottom right corner radius.
      * @param bl - the bottom left corner radius.
      */
     public abstract draw (
          x: number, y: number, w: number, h: number,
          color?: Color,
          tl?: number, tr?: number, br?: number, bl?: number): void;


     /**
     * Draws the rectangle.
     * @param x - the x position.
     * @param y - the y position.
     * @param w - the rectangle width.
     * @param h - the rectangle height
     * @param color - the color of a rectangle. By default white.
     * @param stroke_width - the width of a stroke. By default 2.
     * @param stroke_color - the color of a stroke. By default black.
     * @param tl - the top left corner radius.
     * @param tr - the top right corner radius.
     * @param br - the bottom right corner radius.
     * @param bl - the bottom left corner radius.
     */
     public abstract drawWithStroke (x: number, y: number, w: number, h: number,
          color?: Color, stroke_width?: number, stroke_color?: Color,
          tl?: number, tr?: number, br?: number, bl?: number): void;
}