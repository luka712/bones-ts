import { BaseMatrix } from "../BaseMatrix";

// https://math.stackexchange.com/questions/2975109/how-to-convert-euler-angles-to-quaternions-and-get-the-same-euler-angles-back-fr

export class Quaternion extends BaseMatrix<Quaternion>
{
    constructor(x: number = 0,
        y: number = 0,
        z: number = 0,
        w: number = 1)
    {
        super(4);
        this[0] = x;
        this[1] = y;
        this[2] = z;
        this[3] = w;
    }

    public get x (): number { return this[0] }
    public get y (): number { return this[1] }
    public get z (): number { return this[2] }
    public get w (): number { return this[3] }

    /**
     * Creates a quaternion from yaw, pitch and roll.
     * @param yaw 
     * @param pitch 
     * @param roll 
     */
    public static fromYawPitchRoll (yaw: number, pitch: number, roll: number, out?: Quaternion)
    {
        out = out ?? new Quaternion();

        const half_roll = roll * .5;
        const half_pitch = pitch * .5;
        const half_yaw = yaw * .5;

        const sin_roll = Math.sin(half_roll);
        const cos_roll = Math.cos(half_roll);

        const sin_pitch = Math.sin(half_pitch);
        const cos_pitch = Math.cos(half_pitch);

        const sin_yaw = Math.sin(half_yaw);
        const cos_yaw = Math.cos(half_yaw);

        out[0] = (cos_yaw * sin_pitch * cos_roll) + (sin_yaw * cos_pitch * sin_roll);
        out[1] = (sin_yaw * cos_pitch * cos_roll) - (cos_yaw * sin_pitch * sin_roll);
        out[2] = (cos_yaw * cos_pitch * sin_roll) - (sin_yaw * sin_pitch * cos_roll);
        out[3] = (cos_yaw * cos_pitch * cos_roll) + (sin_yaw * sin_pitch * sin_roll);

        return out;
    }
}