import { LifecycleState } from "../bones_common";

/**
 * The sound.
 */
export class Sound 
{
    private m_audioBuffer: AudioBuffer;

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
    public get state (): LifecycleState 
    {
        return this.m_state;
    }

    /**
    * The volume of a sound.
    */
    public volume: number = 1;

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
        const gain_node = this.m_audioContext.createGain();
        gain_node.gain.value = this.volume;
        gain_node.connect(this.m_audioContext.destination);

        const source = this.m_audioContext.createBufferSource();
        source.buffer = this.m_audioBuffer;
        source.connect(gain_node);

        source.start();
    }
}
