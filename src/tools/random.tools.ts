class RandomTool {
  /**
   * Generate a randon link of 40 characters
   * @returns
   */
  public generateLink() {
    let text = '';
    const shuffle = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    for (let i = 0; i < 50; i++) text += shuffle.charAt(Math.floor(Math.random() * shuffle.length));
    return text;
  }
}

export default new RandomTool();
