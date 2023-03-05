
import { Mat4x4, Vec3 } from "../bones_math";
import { Framework } from "../Framework";
import { InputManager } from "../input/InputManager";
import { Keys } from "../input/InputManagerEnums";
import { MathUtil } from "../math/MathUtil";
import { Camera } from "./Camera";

export class FreeCamera extends Camera 
{
    /**
     * The current position.
     */
    public position: Vec3 =  new Vec3(0,0,3);

    /**
     * The turning speed.
     */
    public turnSpeed: number = 0.05;

    /**
     * The speed of movement.
     */
    public moveSpeed: number = 0.005;

    /**
     * Keys for moving left.
     */
    public moveLeftKey: Array<string | Keys> = ["a", Keys.ARROW_LEFT];

    /**
     * Keys for moving right.
     */
    public moveRightKey: Array<string | Keys> = ["d", Keys.ARROW_RIGHT];

    /**
     * Keys for moving forward.
     */
    public moveForwardkey: Array<string | Keys> = ["w", Keys.ARROW_UP];

    /**
     * Keys for moving backwards.
     */
    public moveBackwardsKey: Array<string | Keys> = ["s", Keys.ARROW_DOWN];


    private readonly m_input: InputManager
    private m_right = Vec3.unitX()
    private m_forward = Vec3.unitZ();
    private m_up = Vec3.zero();
    private m_worldUp = Vec3.unitY();
    private m_yaw = -90;
    private m_pitch = 0;

    // just to optimize operations.
    private o_vec3 = Vec3.zero();
    private o_mat4x4 = Mat4x4.identity();

    constructor(framework: Framework)
    {
        super();
        this.m_input = framework.input;
        this.projectionMatrix = Mat4x4.perspective(MathUtil.radians(75), framework.canvas.width / framework.canvas.height, 0.1, 1000);
        this.viewMatrix = Mat4x4.lookAt(new Vec3(0,0,3), new Vec3(0,0,-1), Vec3.unitY());
    }

    private updateMouse (deltaTime: number): void 
    {
        const mouseState = this.m_input.getMouseState();

        this.m_yaw += mouseState.deltaX * this.turnSpeed * deltaTime;
        this.m_pitch -= mouseState.deltaY * this.turnSpeed * deltaTime;

        if (this.m_pitch > 89)
        {
            this.m_pitch = 89;
        }
        else if (this.m_pitch < -89)
        {
            this.m_pitch = -89;
        }

        /*
        if (mouseScroll.Y > 0)
    {
        m_fov -= m_zoomSpeed;
        m_projectionMatrix = perspective(radians(m_fov), m_width / m_height, m_near, m_far);
    }
    else if (mouseScroll.Y < 0)
    {
        m_fov += m_zoomSpeed;
        m_projectionMatrix = perspective(radians(m_fov), m_width / m_height, m_near, m_far);
    }
    */
    }

    private updateKeys (deltaTime: number): void 
    {
        if (this.m_input.isKeyDown(this.moveLeftKey, false))
        {
            Vec3.multiplyWithScalar(this.m_right, this.moveSpeed * deltaTime, this.o_vec3);
            this.position.subtract(this.o_vec3);
        }
        else if (this.m_input.isKeyDown(this.moveRightKey, false))
        {
            Vec3.multiplyWithScalar(this.m_right, this.moveSpeed * deltaTime, this.o_vec3);
            this.position.add(this.o_vec3);
        }

        if (this.m_input.isKeyDown(this.moveForwardkey, false))
        {
            Vec3.multiplyWithScalar(this.m_forward, this.moveSpeed * deltaTime, this.o_vec3);
            this.position.add(this.o_vec3);
        }
        else if (this.m_input.isKeyDown(this.moveBackwardsKey, false))
        {
            Vec3.multiplyWithScalar(this.m_forward, this.moveSpeed * deltaTime, this.o_vec3);
            this.position.subtract(this.o_vec3);
        }
    }

    public update (deltaTime: number): void 
    {
        this.updateMouse(deltaTime);

        const yaw = MathUtil.radians(this.m_yaw);
        const pitch = MathUtil.radians(this.m_pitch);

        this.m_forward[0] = Math.cos(yaw) * Math.cos(pitch);
        this.m_forward[1] = Math.sin(pitch);
        this.m_forward[2] = Math.sin(yaw) * Math.cos(pitch);

        Vec3.cross(this.m_forward, this.m_worldUp, this.m_right);

        Vec3.cross(this.m_right, this.m_forward, this.m_up);

        this.updateKeys(deltaTime);

        Vec3.add(this.position, this.m_forward, this.o_vec3);

    
        Mat4x4.lookAt(this.position, this.o_vec3, this.m_worldUp, this.viewMatrix);

        Mat4x4.multiply(this.projectionMatrix, this.viewMatrix, this.projectionViewMatrix);
    }
}