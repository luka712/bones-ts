export class FileError extends Error 
{
    constructor(path: string)
    {
        super(`File with ${path} not found.`);
    }
}


export class FileLoader 
{
    /**
     *  Load the file from path into string. If the file is not found, error is thrown.
     *
     * @param { string } path - file path
     * @return { Promise<string> }
     */
    public async loadFile(path: string): Promise<string>
    {

        var response: Response = null;

        try
        {
            response = await fetch(path);
        }
        catch (e)
        {
            throw new FileError(path);
        }

        return response.text();
    }
}