import { FrameworkPlugin } from "../framework/plugin/FrameworkPlugin";
import { GLLineCapsDiamondShape } from "./caps/GLLineCapsDiamondShape";
import { GLLineJoinDiamondShape } from "./join/GLLineJoinDiamondShape";

export class BonesLinesPlugin extends FrameworkPlugin
{
    /**
     * Creates the {@link GLLineJoinDiamondShape}.
     */
    public createWebGLDiamonShapeJoin(): GLLineJoinDiamondShape 
    {
        return new GLLineJoinDiamondShape();
    }

    
    /**
     * Creates the {@link GLLineJoinDiamondShape}.
     */
    public createWebGLDiamonShapeCaps(): GLLineCapsDiamondShape 
    {
        return new GLLineCapsDiamondShape();
    }
}