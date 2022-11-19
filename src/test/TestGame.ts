import { stat } from "fs";
import { Framework } from "../framework/Framework";
import { WebGLScreenTestState } from "./state/WebGLScreenTestState";

export class TestGame extends Framework
{
    public async initialize (): Promise<void>
    {
        const state = new WebGLScreenTestState(this);
        await this.addState("test-webgl-rendering", state);
        this.useState("test-webgl-rendering");
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