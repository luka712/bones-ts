class FileError extends Error 
{
    constructor(path: string)
    {
        super(`File with ${path} not found.`);
    }
}


class FileLoader 
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

class ImageLoader 
{
    /**
       * @brief Load the image data from path.
       *
       * @param { string } path - file path
       * @return { Promise<HTMLImageElement> } the image data.
       */
    public async loadImage(path: string): Promise<HTMLImageElement>
    {
        return new Promise((resolve, reject) => 
        {
            var image = new Image();
            image.onload = () => resolve(image);
            image.onerror = () => { throw new FileError(path); };
            image.src = path;
        });
    }
}

export 
{
    FileError,
    FileLoader,
    ImageLoader,
}