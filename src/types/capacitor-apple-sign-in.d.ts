declare module '@capacitor-community/apple-sign-in' {
  export interface SignInWithAppleOptions {
    /**
     * The developer's client identifier, as provided by WWDR.
     */
    clientId: string;
    /**
     * The URI to which the authorization server sends the user after granting authorization.
     */
    redirectURI: string;
    /**
     * The amount of user information requested from Apple.
     * Note that the user can choose to omit some of the requested data.
     * Valid values are "name" and "email".
     */
    scopes: string;
    /**
     * Data that's returned to you unmodified in the subsequent token request.
     */
    state: string;
    /**
     * A cryptographically random value that's used to associate a client session with an ID token.
     * This value is also used to mitigate replay attacks.
     */
    nonce: string;
  }

  export interface SignInWithAppleResponse {
    response: {
      /**
       * A JSON Web Token (JWT) that securely communicates information about the user to your app.
       */
      identityToken?: string;
      /**
       * A short-lived token used by your app for validation with the App Store Connect API.
       */
      authorizationCode?: string;
      /**
       * An identifier associated with the authenticated user.
       */
      user?: string;
      /**
       * The user's email address.
       */
      email?: string;
      /**
       * The user's given name.
       */
      givenName?: string;
      /**
       * The user's family name.
       */
      familyName?: string;
      /**
       * The same value you passed during the initial request.
       */
      state?: string;
    };
  }

  export interface SignInWithApplePlugin {
    /**
     * Open Sign in with Apple flow.
     */
    authorize(options: SignInWithAppleOptions): Promise<SignInWithAppleResponse>;
  }

  declare const SignInWithApple: SignInWithApplePlugin;
  export { SignInWithApple };
} 