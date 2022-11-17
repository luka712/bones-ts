import { Sound } from "./Sound";

/**
 * The sound manager.
 */
 export class SoundManager 
 {
     private m_audioContext: AudioContext;
     private m_soundCache: { [id: string]: Sound } = {};
 
     constructor()
     {
         this.m_audioContext = new AudioContext();
     }
 
     /**
      * Gets the sound from cache.
      * @param { string } key 
      * @returns { Sound }
      */
     public getSound(key: string): Sound 
     {
         return this.m_soundCache[key];
     }
 
     /**
      * Loads the sound.
      * @param { string } path - load a sound from path.
      * @param { string | null } key - if stored, sound can be later retrieved by key. If not specified, it can be retrieved by path.
      */
     public async loadSound(path: string, key: string = null): Promise<Sound> 
     {
         const response = await fetch(path);
         const buffer = await response.arrayBuffer();
 
         const sound = new Sound(this.m_audioContext, buffer);
 
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
 }
 