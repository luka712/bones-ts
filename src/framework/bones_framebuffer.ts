import { Color } from "./bones_math";

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

export 
{
    IRenderFramebuffer
}