
// TODO: CREATE SBF ( simple but fast ) physics components
// needs to only have following 
// acceleration - set by user.
// velocity  = acc * dt
// position = vel * dt

import { PhysicsBoundsBehavior } from "../common/PhysicsBoundsBehavior";
import { Vec2, Rect } from "../../bones_math";
import { MathUtil } from '../../math/MathUtil';


/**
 * Physics using Euler integration.
 */
export class Physics2D 
{
    public position: Vec2 = Vec2.zero();
    public velocity: Vec2 = Vec2.zero();

    /**
     * The mass of a object. By default 1.
     */
    public mass: number = 1;

    /**
     * Limits the velocity. Only imposses limit if velocity magnitude is greater then 0.
     */
    public maxVelocityStrength = 0;

    /**
     * If set, positions won't leave the bounds.
     */
    public bounds?: Rect = null;

    /**
     * How entity should behave within given bounds.
     */
    public boundsBehaviour = PhysicsBoundsBehavior.Clamp;

    /**
     * The acceleration which is sum of all forces divided by mass.
     * acc = net_forces / mass
     */
    private m_acceleration: Vec2 = Vec2.zero();

    /**
     * Total net force applied to physics object, via {@link SBFPhysicsComponent.applyForce}
     */
    private m_netForce: Vec2 = Vec2.zero();

    // Optimization vec
    private o_vec: Vec2 = Vec2.zero();

    /**
     * Holds different implementations on bounds hit.
     */
    private m_boundsBehaviourMethod = {
        // clamp to bounds.
        [PhysicsBoundsBehavior.Clamp]: () => this.position.clampToBounds(this.bounds),
        [PhysicsBoundsBehavior.None]: () => { },
        [PhysicsBoundsBehavior.ChangeDirection]: () => 
        {
            if (this.position.x > this.bounds.w)
            {
                this.position.x = this.bounds.w;
                this.velocity.x *= -1;
            }
            else if (this.position.x < this.bounds.x)
            {
                this.position.x = this.bounds.x;
                this.velocity.x *= -1;
            }

            if (this.position.y > this.bounds.h)
            {
                this.position.y = this.bounds.h;
                this.velocity.y *= -1;
            }
            else if (this.position.y < this.bounds.y)
            {
                this.position.y = this.bounds.y;
                this.velocity.y *= -1;
            }
        }
    }

    /**
     * The update loop.
     * @param delta_time 
     */
    public update (delta_time: number): void 
    {
        // Update the position and velocity of an object using Euler integration

        // acceleration is sum of all forces divides by mass
        // acc = net_forces / mass.
        Vec2.divideWithScalar(this.m_netForce, this.mass, this.m_acceleration);

        // Update the velocity of the object based on its acceleration
        // vel += acc * dt
        Vec2.addVec2MultipledWithScalar(this.velocity, this.m_acceleration, delta_time, this.velocity);

        // clamp velocity.
        if (this.maxVelocityStrength > 0 && this.velocity.magnitudeSq() > this.maxVelocityStrength * this.maxVelocityStrength)
        {
            this.velocity.setMagnitude(this.maxVelocityStrength);
        }

        // Update the position of the object based on its velocity
        // pos += vel * dt
        Vec2.addVec2MultipledWithScalar(this.position, this.velocity, delta_time, this.position);


        // clamp to bounds if there are any.
        if (this.bounds) 
        {
            // finds bound behaviour by key and calls it.
            this.m_boundsBehaviourMethod[this.boundsBehaviour]();
        }


        /************ RESET PROPS HERE **********************/
        this.m_netForce.setLengthToZero();
    }

    /**
     * Applies force to physics object.
     * @param force 
     */
    public applyForce (force: Vec2): void 
    {
        this.m_netForce.add(force);
    }


    /**
     * Applies a weight force to the physics engine. 
     * Gravitational force is multiplied by particle mass.
     * @param gravitational_force 
     */
    public applyWeightForce (gravitational_force: Vec2)
    {
        // add gravity 
        // weight = gravitational_force * mass 
        // note that later it's divided by mass, therefore gravitational force will cancel out.
        Vec2.multiplyWithScalar(gravitational_force, this.mass, this.o_vec);
        this.applyForce(this.o_vec);
    }


    /**
     * Applies the simplified drag force.
     * @param coefficient  - the drag force coefficient. Should be between 0 and 1.
     */
    public applyDragForce (coefficient: number): void 
    {
        const mag_sq = this.velocity.magnitudeSq();
        if (mag_sq > 0)
        {
            // simplified formula
            // F = |v|^2 * c * v^ * -1

            // get opposite unit vector. v^ * -1 ... note it is multiplied late with -drag_mag instead of drag_mag in order to reverse the direction. 
            this.o_vec = Vec2.normalize(this.velocity, this.o_vec);

            // constant |v|^2 * c
            const drag_mag = mag_sq * coefficient;
            this.o_vec.multiplyWithScalar(-drag_mag);  // -drag_mag it order to reverse direction.

            this.applyForce(this.o_vec);
        }
    }

    /**
     * More robust version of {@link Physics2D.applyDragForce} which models real world more closely.
     * @param density - density of the liquid.
     * @param cross_sectional_area - frontal area of the object that is pushing through the liquid (or gas).
     * @param coefficient - coefficient of drag.
     */
    public applyRealDragForce (density: number, cross_sectional_area: number, coefficient: number): void 
    {
        const mag_sq = this.velocity.magnitudeSq();
        if (mag_sq > 0)
        {
            // simplified formula
            // F = |v|^2 * c * v^ * -1

            // get opposite unit vector. v^ * -1
            this.o_vec = Vec2.normalize(this.velocity, this.o_vec);

            // constant |v|^2 * c
            const k = -0.5 * density * mag_sq * cross_sectional_area * coefficient;
            this.o_vec.multiplyWithScalar(k);

            this.applyForce(this.o_vec);
        }
    }


    /**
     * Applies the simplified friction force.
     * @param coefficient  - the friction force coefficient.
     */
    public applyFrictionForce (coefficient: number): void 
    {
        // calculate the friction direction.
        // is it the force opposite of direction * coeff.

        // it is F = |v|^2 * c * -1
        this.o_vec = Vec2.normalize(this.velocity, this.o_vec);
        this.o_vec.multiplyWithScalar(-coefficient);

        this.applyForce(this.o_vec);
    }

    /**
     * Applies the gravitational force towards other object.
     * @param other - the other physics object.
     * @param gravityConstant - the gravity constants. Use it to control gravity strength between two objects.
     * @param minDistance - clamp lower distance bound between objects.
     * @param maxDistance - clamp upper distance bound between objects.
     */
    public applyGravitationalForce (other: Physics2D, gravityConstant: number, minDistance: number, maxDistance: number): void 
    {
        // calculate the distance between two objects
        Vec2.subtract(other.position, this.position, this.o_vec);
        let distanceSq = this.o_vec.magnitudeSq();

        // clamp the value of a distance, between min and max ( to allow for some interesting visual effects )
        distanceSq = MathUtil.clamp(distanceSq, minDistance, maxDistance);

        // calculate the direction of attraction force.
        this.o_vec.normalize(); // direction can be just o_vec, since previous value is not needed anymore.

        // calcualte the strength of attraction force
        const attrMag = gravityConstant * (this.mass * other.mass) / distanceSq;

        // final force
        this.o_vec.multiplyWithScalar(attrMag);
        this.applyForce(this.o_vec);
    }

    /**
     * Applies the spring force to an object.
     * @param anchor - the anchor. Object to which spring would be attached to.
     * @param restLength - the length of a rest position. Where would spring be at equlibrium.
     * @param coeff - the spring coeff. How stiff spring is.
     */
    public applySpringForce (anchor: Vec2, restLength: number, coeff: number): void 
    {
        // distance between anchor and self position
        Vec2.subtract(this.position, anchor, this.o_vec);

        // spring displacement considering the rest length 
        const displacement = this.o_vec.magnitude() - restLength;

        // calculate the direction and the magnitude of the spring force.
        this.o_vec.normalize(); // can be used now for direction
        const springMag = -coeff * displacement;

        // final spring force
        this.o_vec.multiplyWithScalar(springMag);
        this.applyForce(this.o_vec);
    }
}

