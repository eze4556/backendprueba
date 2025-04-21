class CodeTool {
  /**
   * Generate aleatory code (6)
   * @returns
   */
  public generateCode(): string {
    let text = '';
    const shuffle = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    for (let i = 0; i < 6; i++) text += shuffle.charAt(Math.floor(Math.random() * shuffle.length));
    return text; // Return a 6 digits random code
  }
}

export default new CodeTool();
