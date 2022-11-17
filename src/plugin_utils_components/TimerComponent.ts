export class TimerComponent
{
    /**
     * Set from window.setTimeout!
     */
    private m_timeoutHandle: number = 0;

    /**
     * Was timer called after restart ? 
     */
    private m_called: boolean;

    /**
     * Construct a new Timer object.
     * @param { ((TimerComponent) : void) | undefined  } m_callback 
     * @param { number  } m_notifyTime - in milliseconds.
     */
    constructor(private m_callback?: (timer: TimerComponent) => void, private m_notifyTime = 2500)
    {
        this.m_called = false;
    }

    /**
     * Has time expired 
     * @return { boolean }
     */
    public get timeExpired (): boolean 
    {
        return this.m_called;
    }

    /**
    * Start the timer. Same as restart.
    */
    public start (): void
    {
        this.restart();
    }

    /**
     * Restart the timer.
     * @returns { void }
     */
    public restart (): void 
    {
        this.m_called = false;
        this.m_timeoutHandle = window.setTimeout(() => 
        {
            this.m_called = true;
            if (this.m_callback)
            {
                this.m_callback(this)
            }
            window.clearTimeout(this.m_timeoutHandle);

        }, this.m_notifyTime);
    }
}