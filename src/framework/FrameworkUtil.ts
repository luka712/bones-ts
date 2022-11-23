export class FrameworkUtils 
{
    /**
     * Generates unique id.
     */
    public static generateId(): string 
    {
        return Date.now().toString(36) + Math.random().toString(36).substring(2);
    }
}