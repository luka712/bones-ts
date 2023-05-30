import {  BlendMode } from "../../../framework/SpriteRenderer";

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
    public static setBlendMode (gl: WebGL2RenderingContext, mode: BlendMode): void 
    {

        let source: number;
        let dest: number;

        if (mode == BlendMode.AlphaBlending)
        {
            source = gl.SRC_ALPHA;
            dest = gl.ONE_MINUS_SRC_ALPHA;
        }
        else if(mode == BlendMode.AdditiveBlending)
        {
            source = gl.ONE;
            dest = gl.ONE;
        }
        else if (mode == BlendMode.MultiplicativeBlending)
        {
            source = gl.DST_COLOR;
            dest = gl.ZERO;
        }
        else if(mode == BlendMode.PreMultipliedAlphaBlending)
        {
            source = gl.ONE;
            dest = gl.ONE_MINUS_SRC_ALPHA;
        }
        else if(mode == BlendMode.InteropolativeBlending)
        {
            source = gl.SRC_ALPHA;
            dest = gl.ONE_MINUS_SRC_ALPHA;
        }
        else
        {
            throw new Error("Not implemented");
        }

        gl.enable(gl.BLEND);
        gl.blendFunc(source, dest);
    }

}