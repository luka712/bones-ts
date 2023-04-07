import { Texture2D } from "./bones_texture";
import { Color } from "./math/Color";

/**
 * @brief The framebuffer which renders into a texture.
 */
interface IRenderFramebuffer
{
    /**
     * @brief Initialize the frame buffer.
     */
    initialize() : void;

    /**
     * @brief Bind the framebuffer.
     */
    bind(): void;

    /**
     * Gets the texture of a framebuffer.
     * If framebuffer has multiple attachments, get the correct texter with index.
     * @param index - to be used only for framebuffers with multiple attachments. Index of an attachment starting at 0.
     */
    getOutputTexture(index?: number) : Texture2D;

    /**
     * @brief Unbind the framebuffer.
     */
    unbind(): void;

    /**
     * @brief Clear the framebuffer before it is being used to draw.
     * @param { Color } color 
     * @returns { void }
     */
    clear(color: Color): void;

    /**
     * @brief Draw the pass.
     */
    drawPass(): void;

    /**
     * @brief Delete the framebuffer and release the resources.
     */
    delete(): void;
};

export type {
    IRenderFramebuffer
}