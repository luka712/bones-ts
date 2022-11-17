import { FileLoader } from "./bones_loaders";

enum ValueType 
{
    String,
    Number
}

/**
 * The config object.
 */
class Config 
{
    private __map: { [id: string]: string };

    constructor(private readonly __fileLoader: FileLoader, private readonly __path = "assets/game/config.txt")
    {

    }

    /**
     * Initialize the config.
     */
    public async initialize (): Promise<void>
    {
        this.__map = {};
        let text = null;
        try
        {
            text = await this.__fileLoader.loadFile(this.__path);
        }
        catch (ex)
        {
            console.error(`Config::initialize: Unable to load file under path ${this.__path}`);
            return;
        }
        if (text)
        {
            const lines = text.split("\n");
            for (const line of lines)
            {
                const start_value_index = line.indexOf("=", 0);
                const length = line.indexOf("\n");

                const key = line.substring(0, start_value_index);
                const value = line.substring(start_value_index + 1, line.length);

                if (key && value)
                {
                    this.__map[key] = value;
                }
            }
        }
    }

    /**
     * Get the value from config.
     * @param { string } key 
     * @param { ValueType } type - by default set to string 'string'. If other type is expected, pass it to type.
     * @returns { number | string  }
     */
    public getValue (key: string, type: ValueType = ValueType.String): number | string  
    {
        let value: any = this.__map[key];
        if (value === undefined)
        {
            throw new Error(`Unknown value from config ${key}!`);
        }

        if (type == ValueType.Number)
        {
            value = Number.parseFloat(value);
        }

        return value;
    }

    /**
     * Get the string value from config.
     * @param { string } key 
     * @returns { string  }
     */
    public getString (key: string): string  
    {
        return this.getValue(key) as string;
    }

    /**
     * Get the number value from config.
     * @param { string } key 
     * @returns { number  }
     */
    public getNumber (key: string): number  
    {
        return Number.parseFloat(this.getValue(key) as string);
    }


}

export
{
    Config,
    ValueType
}