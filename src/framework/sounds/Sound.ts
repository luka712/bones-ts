/**
 * The sound.
 */
export class Sound 
{
    private __audioBuffer: AudioBuffer;

    /**
     * Create a sound.
     * @param { AudioContext } __audioContext 
     * @param { ArrayBuffer } __data 
     */
    constructor(private readonly __audioContext: AudioContext, private readonly __data: ArrayBuffer)
    {
        this.__audioContext.decodeAudioData(this.__data, (data) =>
        {
            this.__audioBuffer = data;
        });
    }

    /**
     * Play the sound.
     */
    public play (): void
    {
        const source = this.__audioContext.createBufferSource();
        source.buffer = this.__audioBuffer;
        source.connect(this.__audioContext.destination);

        source.start();
    }
}
