/**
 * The time manager.
 */
export class TimeManager 
{
    private m_lastFrame: Date;

    /**
     * Number of passed frames since game start.
     */
    private m_frameCount: number;

    /**
     * The get fps calculated from last frame.
     */
    public fps: number;

    /**
     * Get the average FPS since the start of game.
     */
    public averageFPS: number;

    /**
     * Get the elapsed time.
     */
    public readonly time: Time;

    constructor()
    {
        this.m_lastFrame = new Date();
        this.m_frameCount = 0;

        this.time = new Time();
    }

    /**
     * @brief The start which is to be called before all the updates and draws.
     */
    public start (): void 
    {
        const new_time = new Date();
        const delta_time_ms = new_time.getTime() - this.m_lastFrame.getTime();

        this.time.elapsedTimeMS += delta_time_ms;

        this.m_frameCount++;
        this.fps = 1000 / delta_time_ms;
        this.averageFPS = (this.m_frameCount / this.time.elapsedTimeMS) * 1000;
        this.m_lastFrame = new_time;


        this.time.deltaTimeMS = delta_time_ms;
    }
}

/**
 * How much time has passed.
 */
export class Time 
{
    constructor()
    {
        this.elapsedTimeMS = 0;
    }


    /**
   * Total elapsed time since start of game in milliseconds.
   */
    public elapsedTimeMS: number;

    /**
     * Delta time in milliseconds. Delta time show how much time has passed between current and last frame.
     */
    public deltaTimeMS: number;

    /**
     * Elapsed time in seconds.
     */
    public get elapsedTimeSec (): number
    {
        return this.elapsedTimeMS / 1000.0;
    }
};

