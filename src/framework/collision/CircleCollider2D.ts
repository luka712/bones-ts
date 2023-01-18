import { Vec2 } from "../bones_math";
import { ColliderType } from "./ColliderTypes";

/**
 * The simple circle collider.
 */
export class CircleCollider2D 
{
    public position: Vec2;
    public radius: number;

    /**
     * The type.
     */
    public readonly type = ColliderType.CIRCLE;

    /**
     * Is circle colliding a point.
     * @param point - the point 
     * @returns true if colliding, false otherwise.
     */
    public collidesPoint(point: Vec2) : boolean 
    {
        const distanceSq = this.position.distanceSq(point);

        // radius must be squared here.
        return distanceSq < this.radius * this.radius;
    }
}