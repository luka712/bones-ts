

/**
 * The resize event.
 */
class WindowResizeEvent 
{
    width: number;
    height: number;
}

/**
 * The window manager.
 * Window is responsible for CanvasElement and event propagation.
 */
class WindowManager 
{
    private readonly __resizeEvent: WindowResizeEvent;

    /**
     * All the subscribers to window resized.
     */
    private readonly __onWindowResizedEvents: Array<(event: WindowResizeEvent) => void>;

    constructor(public readonly canvas: HTMLCanvasElement)
    {
        this.__resizeEvent = new WindowResizeEvent();
        this.__onWindowResizedEvents = [];

        // resize event function. calls resize only if width and height of canvas are really changed.
        const resize_event = () => 
        {
            const old_width = this.width;
            const old_height = this.height;

            const new_width = this.canvas.clientWidth;
            const new_height = this.canvas.clientHeight;

            if (old_width != new_width || new_height != old_height)
            {
                this.canvas.width = new_width;
                this.canvas.height = new_height;

                this.__resizeEvent.width = new_width;
                this.__resizeEvent.height = new_height;


                for (const cb of this.__onWindowResizedEvents)
                {
                    cb(this.__resizeEvent);
                }
            }
        };
        this.canvas.width = this.canvas.clientWidth;
        this.canvas.height = this.canvas.clientHeight;

        // when canvas is resized, fire off resized events.
        window.addEventListener("resize", () => resize_event());
        canvas.addEventListener("resize", () => resize_event());
    }

    /**
     * Get the window width.
     * @returns { number }
     */
    public get width (): number 
    {
        return this.canvas.width;
    }


    /**
     * Get the window height.
     * @returns { number }
     */
    public get height (): number
    {
        return this.canvas.height;
    }

    /**
     * @brief Subscribe to window resized event, whenever window is resized it get called.
     *
     * @param { (event: WindowResizeEvent) => void} on_window_resized - function to call to.
     */
    public subscribeToWindowResized (on_window_resized: (event: WindowResizeEvent) => void)
    {
        this.__onWindowResizedEvents.push(on_window_resized);
    }

    /**
     * @brief Resize a window to a new size.
     *
     * @param { number } window_width - new width of a window.
     * @param { number } window_height - new height of a window.
     */
    public resizeWindow (window_width: number, window_height: number): void  
    {
        this.canvas.style.width = window_width + "px";
        this.canvas.style.height = window_height + "px";

        this.__resizeEvent.width = window_width;
        this.__resizeEvent.height = window_height;

        for (const cb of this.__onWindowResizedEvents)
        {
            cb(this.__resizeEvent);
        }
    }
}

export 
{
    WindowManager,
    WindowResizeEvent
}