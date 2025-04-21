import passwordValidator from 'password-validator';

class PasswordTool {
  /**
   * Validate password
   * @param password
   * @returns
   */
  public validatePassword(password: string): Boolean {
    const result = new passwordValidator()
      .is()
      .min(8) // Minimum length 8
      .is()
      .max(100) // Maximum length 100
      .has()
      .uppercase() // Must have uppercase letters
      .has()
      .lowercase() // Must have lowercase letters
      .has()
      .digits(2) // Must have at least 2 digits
      .has()
      .not()
      .spaces() // Should not have spaces
      .is()
      .not()
      .oneOf(['Passw0rd', 'Password123']); // Black list
    return result.validate(password) ? true : false;
  }
}

export default new PasswordTool();
