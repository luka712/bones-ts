
import sourceCode from "../../shaders/effects/grayscale.wgsl?raw"
import { Effect } from "./Effect";

export class GrayscaleEffect extends Effect {


    protected sourceCode (): string {
        return sourceCode;
    }
}