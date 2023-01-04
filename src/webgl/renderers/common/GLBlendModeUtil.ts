import { Blend, BlendFactor } from "../../../framework/SpriteRenderer";

/**
 * Utility for working with blends.
 */
export class GLBlendModeUtil 
{
    /**
     * Sets the blend mode
     * @param gl - the webgl context
     * @param mode - the mode
     */
    public static setBlendMode (gl: WebGL2RenderingContext, mode: Blend): void 
    {

        let source = gl.SRC_ALPHA;
        let dest = gl.ONE_MINUS_SRC_ALPHA;

        switch (mode.srcFactor)
        {
            case BlendFactor.SRC_ALPHA:
                source = gl.SRC_ALPHA;
                break;
            case BlendFactor.ONE_MINUS_SRC_ALPHA:
                source = gl.ONE_MINUS_SRC_ALPHA;
                break;
            case BlendFactor.ONE:
                source = gl.ONE;
                break;
            default:
                throw new Error("GLSpriteRenderer::setBlendingMode:  Unable to resolve source blending mode!");
        }

        switch (mode.destFactor)
        {
            case BlendFactor.SRC_ALPHA:
                dest = gl.SRC_ALPHA;
                break;
            case BlendFactor.ONE_MINUS_SRC_ALPHA:
                dest = gl.ONE_MINUS_SRC_ALPHA;
                break;
            case BlendFactor.ONE:
                dest = gl.ONE;
                break;
            default:
                throw new Error("GLSpriteRenderer::setBlendingMode:  Unable to resolve destination blending mode!");

        }


        gl.blendFunc(source, dest);
        gl.enable(gl.BLEND);
    }

}