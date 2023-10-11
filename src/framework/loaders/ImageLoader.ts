import { FileError } from "./FileLoader";

export class ImageLoader 
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
