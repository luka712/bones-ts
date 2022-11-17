import { FrameworkPlugin } from "../framework/plugin/FrameworkPlugin";
import { GamejoltGameApi, GamejoltScoresFetchResult } from "gamejolt-ts-sdk"

export class GamejoltPlugin extends FrameworkPlugin
{
    public readonly api: GamejoltGameApi;

    /**
     * The constructor.
     * @param { string } private_key - the private key.
     * @param { number } m_gameId - the game id.
     */
    constructor(private_key: string, private m_gameId: number)
    {
        super();
        this.api = new GamejoltGameApi(private_key, m_gameId);
    }

    /**
     * Sets a trophy as achieved for a particular user.
     * @param { string } id - the identifier of achievment.
     * @returns { Promise<void> }
     */
    public achieved (id: string): Promise<void>
    {
        return new Promise(async (resolve, reject) => 
        {
            const result = await this.api.trophies.addAchieved({
                trophy_id: id 
            });
            if (result.success)
            {
                resolve();
            }
            else
            {
                reject(result.message);
            }
        });

    }

    /**
     * Adds a score for a particular game.
     * @param { string } score - score to add. 
     * @returns { Promise<void> }
     */
    public addScore (score: number, table_id?: number): Promise<void> 
    {
        return new Promise(async (resolve, reject) => 
        {
            // game_id is passed by underlying api.
            const result = await this.api.scores.add({
                score: score.toString(), 
                sort: score, 
                table_id: table_id.toString(),
                guest: this.api.username ? null : "Guest" // if guest
            });

            if (result.success)
            {
                resolve();
            }
            else
            {
                reject(result.message);
            }
        });
    }

    /**
     * Fetch scores.
     * @returns 
     */
    public fetchScores(table_id: string, limit: number = 5) : Promise<GamejoltScoresFetchResult>
    {
        return this.api.scores.fetch({
            game_id: this.m_gameId.toString(),
            table_id: table_id,
            limit
        });
    }
}