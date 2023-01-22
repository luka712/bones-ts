import { Vec2 } from '../math/vec/Vec2';

/**
 * Physics component using Verlet integration.
 */
export class Physics2DVerlet 
{
	public position: Vec2;

	private m_mass: number = 0;
	private m_invMass: number = 0;
	private m_netForce: Vec2 = Vec2.zero();
	private m_acceleration: Vec2 = Vec2.zero();


	/**
	 * Remember the previous position, for correct integration.
	 */
	private o_prevPos: Vec2;

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
		this.position[0] = this.position[0] * 2 - this.o_prevPos[0] + this.m_acceleration[0] * dtSq;
		this.position[1] = this.position[1] * 2 - this.o_prevPos[1] + this.m_acceleration[1] * dtSq;

		this.o_prevPos[0] = prevX;
		this.o_prevPos[1] = prevY;
	}

}