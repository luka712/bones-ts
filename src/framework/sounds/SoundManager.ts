import { Music } from "./Music";
import { Sound } from "./Sound";

/**
 * The sound manager.
 */
export class SoundManager 
{
    private m_audioContext: AudioContext;
    private m_soundCache: { [id: string]: Sound } = {};
    private m_musicCache: { [id: string]: Music } = {};

    constructor()
    {
        this.m_audioContext = new AudioContext();
    }

    /**
     * Gets the sound from cache.
     * @param { string } key 
     */
    public getSound (key: string): Sound | undefined
    {
        return this.m_soundCache[key];
    }

    /**
    * Gets the sound from cache.
    * @param { string } key 
    */
    public getMusic (key: string): Music | undefined
    {
        return this.m_musicCache[key];
    }

    /**
     * Loads the sound.
     * @param { string } path - load a sound from path.
     * @param { string | null } key - if stored, sound can be later retrieved by key. If not specified, it can be retrieved by path.
     */
    public async loadSound (path: string, key: string = null): Promise<Sound> 
    {
        const response = await fetch(path);
        const buffer = await response.arrayBuffer();

        const sound = new Sound(this.m_audioContext, buffer);
        await sound.initialize();

        if (key)
        {
            this.m_soundCache[key] = sound;
        }
        else
        {
            this.m_soundCache[path] = sound;
        }

        return sound;
    }

    /**
   * Loads the sound.
   * @param { string } path - load a sound from path.
   * @param { string | null } key - if stored, sound can be later retrieved by key. If not specified, it can be retrieved by path.
   */
    public async loadMusic (path: string, key: string = null): Promise<Music> 
    {
        const response = await fetch(path);
        const buffer = await response.arrayBuffer();

        const music = new Music(this.m_audioContext, buffer);
        await music.initialize();

        if (key)
        {
            this.m_musicCache[key] = music;
        }
        else
        {
            this.m_musicCache[path] = music;
        }

        return music;
    }
}
