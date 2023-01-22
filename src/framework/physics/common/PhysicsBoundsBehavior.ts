
export enum PhysicsBoundsBehavior
{
    /**
     * Clamps to bounds.
     */
    Clamp,

    /**
     * Does nothing with bounds.
     */
    None,

    /**
     * If left/right bounds are hit, changes x direction.
     * If top/bottom bounds are hit, changes y direction.
     */
    ChangeDirection,
}