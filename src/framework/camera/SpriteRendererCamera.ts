import { Mat4x4 } from "../bones_math";
import { Camera } from "./Camera";

export class SpriteRendereCamera extends Camera 
{
    constructor(width: number, height: number) {
        super();

        this.m_projectionMatrix = Mat4x4.orthographic(0, width, height, 0, -1, 1);
    }

    public update (deltaTime: number): void {
        this.projectionViewMatrix = this.m_projectionMatrix;
    }
   
}