import { PhysicsBoundsBehavior, Rect } from '../../..';
import { Vec2 } from '../../math/vec/Vec2';
import { VELOCITY_EPSILON } from '../common/PhysicsConstants';
import { Physics2DVerletContraint } from './Physics2DVerletConstraint';


/**
 * Holds information about created physics components and their constraints.
 */
export interface CreatePhysics2DVerletWithConstraintsResult 
{
	readonly physicsComponents: Array<Physics2DVerlet>;
	readonly physicsConstraintComponents: Array<Physics2DVerletContraint>;
}

/**
 * Physics component using Verlet integration.
 */
export class Physics2DVerlet 
{
	public position: Vec2;

	/**
	 * If set, positions won't leave the bounds.
	 */
	public bounds?: Rect = null;

	/**
	 * How entity should behave within given bounds.
	 */
	public boundsBehaviour = PhysicsBoundsBehavior.Clamp;

	/**
	 * Friction factor.
	 */
	public frictionFactor = 1;

	/**
	 * List of attached constraints. Does nothing internally, needs to be updated by user.
	 */
	public constraints: Array<Physics2DVerletContraint> = [];

	private m_mass: number = 0;
	private m_invMass: number = 0;
	private m_netForce: Vec2 = Vec2.zero();
	private m_acceleration: Vec2 = Vec2.zero();

	/**
	 * Holds different implementations on bounds hit.
	 */
	private m_boundsBehaviourMethod = {
		// clamp to bounds.
		[PhysicsBoundsBehavior.Clamp]: () => this.position.clampToBounds(this.bounds),
		[PhysicsBoundsBehavior.None]: () => { },
		[PhysicsBoundsBehavior.ChangeDirection]: () => this.position.clampToBounds(this.bounds)
	}

	/**
	 * Remember the previous position, for correct integration.
	 */
	private o_prevPos: Vec2;

	// just for optimizations.
	private o_vec: Vec2 = Vec2.zero();

	/**
	 * Gets the mass.
	 */
	public get mass (): number 
	{
		return this.m_mass;
	}

	/**
	 * Sets the mass.
	 */
	public set mass (v: number) 
	{
		this.m_mass = v;
		this.m_invMass = 1 / v;
	}

	/**
	 * The constructor.
	 * @param posX - the x position.
	 * @param posY - the y position.
	 */
	constructor(posX: number, posY: number)
	{
		this.position = new Vec2(posX, posY);
		this.mass = 1;
		this.internalReset();
	}

	/**
	 * Must be called whenever position is changed directly.
	 */
	public internalReset (): void 
	{
		this.o_prevPos = Vec2.copy(this.position, this.o_prevPos);
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
	 * The update loop.
	 * @param deltaTime 
	 */
	public update (deltaTime: number): void 
	{
		// a = nf / mass 
		Vec2.multiplyWithScalar(this.m_netForce, this.m_invMass, this.m_acceleration);

		// Save position for previous one.
		const prevX = this.position[0];
		const prevY = this.position[1];

		const dtSq = deltaTime * deltaTime;

		// Formula is here https://en.wikipedia.org/wiki/Verlet_integration where n is current step, n-1 is previous step, A is acceleration, dt is delta time
		// pos(n) = pos(n) * 2 - pos(n-1) + A * (dt^2)
		// this.position[0] = this.position[0] * 2 - this.o_prevPos[0] + this.m_acceleration[0] * dtSq;
		// this.position[1] = this.position[1] * 2 - this.o_prevPos[1] + this.m_acceleration[1] * dtSq;

		// but break it into step
		let deltaStepX = this.position[0] - this.o_prevPos[0] + this.m_acceleration[0] * dtSq;
		let deltaStepY = this.position[1] - this.o_prevPos[1] + this.m_acceleration[1] * dtSq;

		deltaStepX *= this.frictionFactor;
		deltaStepY *= this.frictionFactor;

		// avoid dithering of physics, use really small steps.
		if (this.m_acceleration[0] != 0 && Math.abs(deltaStepX) < VELOCITY_EPSILON)
		{
			deltaStepX = 0;
		}
		if (this.m_acceleration[1] != 0 && Math.abs(deltaStepY) < VELOCITY_EPSILON)
		{
			deltaStepY = 0;
		}

		this.position[0] += deltaStepX;
		this.position[1] += deltaStepY;

		this.o_prevPos[0] = prevX;
		this.o_prevPos[1] = prevY;

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
	 * Creates array of 4 Verlet physics components where each is cross joined with each other, thus forming a rectangle.
	 * Sorted as 
	 * - top left
	 * - top right
	 * - bottom right
	 * - bottom left
	 * 
	 */
	public static createSoftBodyRect (rect: Rect): CreatePhysics2DVerletWithConstraintsResult
	{
		const a = new Physics2DVerlet(rect.x, rect.y);
		const b = new Physics2DVerlet(rect.x + rect.w, rect.y);
		const c = new Physics2DVerlet(rect.x + rect.w, rect.y + rect.h);
		const d = new Physics2DVerlet(rect.x, rect.y + rect.h);

		const constraints = Physics2DVerletContraint.createSoftBodyRect(a, b, c, d);

		return {
			physicsComponents: [a, b, c, d],
			physicsConstraintComponents: constraints
		};
	}
}