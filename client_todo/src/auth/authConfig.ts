export const authConfig = {
    authority: 'http://localhost:3000',
    clientId: 'todo-app-client',
    redirectUri: 'http://localhost:5175/callback',
    responseType: 'code',
    scope: 'openid profile email'
};
