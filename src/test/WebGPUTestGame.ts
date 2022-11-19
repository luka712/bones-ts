import { Framework, UseRendererOption} from "../framework/Framework";
import { WebGPUScreenTestState } from "./state/WebGPUScreenTestState";

export class WebGPUTestGame extends Framework
{
    constructor(canvas: HTMLCanvasElement)
    {
        super(canvas, {
            renderer: UseRendererOption.WebGPU 
        })
    }

    public async initialize (): Promise<void>
    {
        const state = new WebGPUScreenTestState(this);
        await this.addState("test-webgpu-rendering", state);
        this.useState("test-webgpu-rendering");
    }
    public update (delta_time: number): void
    {
        // throw new Error("Method not implemented.");
    }
    public draw (): void
    {
      // throw new Error("Method not implemented.");
    }

}