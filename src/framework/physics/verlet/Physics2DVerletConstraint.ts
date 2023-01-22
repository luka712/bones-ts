import { Physics2DVerlet } from './Physics2DVerlet';
import { Vec2 } from '../../math/vec/Vec2';
import { Rect } from '../../math/Rect';

export class Physics2DVerletContraint 
{
	// for optimization stuff
	private o_vec: Vec2 = Vec2.zero();

	constructor(private a: Physics2DVerlet, private b: Physics2DVerlet, private length: number)
	{

	}


	/**
	 * Updates the contraint.
	 * @param deltaTime 
	 */
	public update (deltaTime: number): void 
	{
		// diff 
		Vec2.subtract(this.a.position, this.b.position, this.o_vec);

		const mag = this.o_vec.magnitude();
		const diffFactor = (this.length - mag) / mag * 0.5;

		const offsetX = this.o_vec[0] * diffFactor;
		const offsetY = this.o_vec[1] * diffFactor;

		this.a.position[0] += offsetX;
		this.a.position[1] += offsetY;
		this.b.position[0] -= offsetX;
		this.b.position[1] -= offsetY;
	}

	/**
	 * Creates array of 4 Verlet physics constraint components where each is joined with adjecent ones, thus forming a rectangle.
	 * @param topLeft
	 * @param topRight
	 * @param bottomRight
	 * @param bottomLeft
	 */
	public static createSoftBodyRect (topLeft: Physics2DVerlet, topRight: Physics2DVerlet, bottomRight: Physics2DVerlet, bottomLeft:Physics2DVerlet): Array<Physics2DVerletContraint> 
	{
		const a = new Physics2DVerletContraint(topLeft, topRight, topLeft.position.distance(topRight.position));
		const b = new Physics2DVerletContraint(topRight, bottomRight, topRight.position.distance(bottomRight.position));
		const c = new Physics2DVerletContraint(bottomRight, bottomLeft, bottomRight.position.distance(bottomLeft.position));
		const d = new Physics2DVerletContraint(bottomLeft, topLeft, bottomLeft.position.distance(topLeft.position));

		// cross 
		const ac = new Physics2DVerletContraint(topLeft, bottomRight, topLeft.position.distance(bottomRight.position));
		const bd = new Physics2DVerletContraint(topRight, bottomLeft, topRight.position.distance(bottomLeft.position));

		topLeft.constraints.push(a);
		topRight.constraints.push(b);
		bottomRight.constraints.push(c);
		bottomLeft.constraints.push(d);

		return [a,b,c,d, ac, bd];
	}
}