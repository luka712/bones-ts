import { LifecycleState } from "../bones_common";

/**
 * The music.
 */
export class Music 
{
    private m_audioBuffer: AudioBuffer;
    private m_sourceNode: AudioBufferSourceNode;
    private m_gainNode: GainNode;

    private m_state: LifecycleState = LifecycleState.Created;


    /**
     * Create a sound.
     * @param { AudioContext } m_audioContext 
     * @param { ArrayBuffer } m_data 
     */
    constructor(private readonly m_audioContext: AudioContext, private readonly m_data: ArrayBuffer)
    {

    }

    /**
     * Gets the current lifecycle state.
     */
    public get state(): LifecycleState 
    {
        return this.m_state;
    }

    private m_volume: number = 1;

    /**
     * The volume of a sound.
     */
    public get volume (): number 
    {
        return this.m_volume;
    }

    public set volume (v: number)
    {
        this.m_volume = v;
        if (this.m_gainNode)
        {
            this.m_gainNode.gain.value = v;
        }
    }

    private m_loop: boolean = true;


    /**
     * Should music loop. True by default.
     */
    public get loop (): boolean
    {
        return this.m_loop;
    }

    public set loop (v: boolean)
    {
        this.m_loop = v;
        if (this.m_sourceNode)
        {
            this.m_sourceNode.loop = v;
        }
    }

    /**
     * Initialize source and gain node.
     */
    private createBuffer (): void 
    {
        this.m_gainNode = this.m_audioContext.createGain();
        this.m_gainNode.gain.value = this.volume;
        this.m_gainNode.connect(this.m_audioContext.destination);

        this.m_sourceNode = this.m_audioContext.createBufferSource();
        this.m_sourceNode.buffer = this.m_audioBuffer;
        this.m_sourceNode.loop = this.loop;
        this.m_sourceNode.connect(this.m_gainNode);
    }

    /**
     * Initialize the music.
     */
    public async initialize (): Promise<void> 
    {
        this.m_audioBuffer = await this.m_audioContext.decodeAudioData(this.m_data);
        this.m_state = LifecycleState.Initialized;
    }



    /**
     * Play the sound.
     */
    public play (): void
    {


        // audio buffer must be created.
        if (!this.m_sourceNode)
        {
            this.createBuffer();
            this.m_sourceNode.start();
        }
    }
}
