var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddRazorPages();

// Add OIDC Authentication services
builder.Services.AddAuthentication(options =>
{
    options.DefaultScheme = "Cookies";
    options.DefaultChallengeScheme = "oidc";
})
.AddCookie("Cookies", options => 
{
    options.Cookie.SameSite = SameSiteMode.None;
    options.Cookie.SecurePolicy = CookieSecurePolicy.Always;
})
.AddOpenIdConnect("oidc", options =>
{
    // Point to the PROXY URL (Same Origin as Login App)
    options.Authority = "https://localhost:3000"; 
    
    // Use the NEW Client ID for this sample
    options.ClientId = "door-auth-sample"; 
    options.ClientSecret = "sample-secret-key";
    
    options.ResponseType = "code";
    options.ResponseMode = "query"; 
    
    options.SaveTokens = true;
    options.GetClaimsFromUserInfoEndpoint = true;
    
    // Callback path
    options.CallbackPath = "/signin-oidc";
    
    // Hardcode metadata because we use self-signed certs
    options.MetadataAddress = "https://localhost:3000/.well-known/openid-configuration";
    options.RequireHttpsMetadata = false;

    // Explicitly configure endpoints to fix "Cannot redirect to the end session endpoint" error
    options.Configuration = new Microsoft.IdentityModel.Protocols.OpenIdConnect.OpenIdConnectConfiguration
    {
        Issuer = "https://localhost:3000",
        AuthorizationEndpoint = "https://localhost:3000/api/oauth/authorize",
        TokenEndpoint = "https://localhost:3000/api/oauth/token",
        UserInfoEndpoint = "https://localhost:3000/api/oauth/userinfo",
        EndSessionEndpoint = "https://localhost:3000/api/oauth/revoke",
        JwksUri = "https://localhost:3000/.well-known/jwks.json"
    };

    // Use PKCE
    options.UsePkce = true;
    
    options.TokenValidationParameters = new Microsoft.IdentityModel.Tokens.TokenValidationParameters
    {
        NameClaimType = "name",
        RoleClaimType = "role",
        ValidateIssuer = false, // Dev
        ValidateAudience = false, // Dev
        SignatureValidator = (token, parameters) => new Microsoft.IdentityModel.JsonWebTokens.JsonWebToken(token)
    };

    // Fix IDX21320 + IDX21329: Disable Nonce + State validation for localhost debugging
    options.ProtocolValidator = new Microsoft.IdentityModel.Protocols.OpenIdConnect.OpenIdConnectProtocolValidator
    {
        RequireNonce = false,
        RequireState = false,
        RequireStateValidation = false
    };
    
    // Bypass Self-Signed Cert errors for Backchannel
    var httpClientHandler = new HttpClientHandler();
    httpClientHandler.ServerCertificateCustomValidationCallback = HttpClientHandler.DangerousAcceptAnyServerCertificateValidator;
    options.BackchannelHttpHandler = httpClientHandler;
    
    // Cookie Policies for Correlation
    options.CorrelationCookie.SameSite = SameSiteMode.None;
    options.CorrelationCookie.SecurePolicy = CookieSecurePolicy.Always;
    options.NonceCookie.SameSite = SameSiteMode.None;
    options.NonceCookie.SecurePolicy = CookieSecurePolicy.Always;
    
    // Debugging Events
    options.Events = new Microsoft.AspNetCore.Authentication.OpenIdConnect.OpenIdConnectEvents
    {
        OnRedirectToIdentityProvider = context => 
        {
            Console.WriteLine($"[Sample OIDC] Redirecting to: {context.ProtocolMessage.RedirectUri}");
            return Task.CompletedTask;
        },
        OnAuthenticationFailed = context =>
        {
            Console.WriteLine($"[Sample OIDC] Auth Failed: {context.Exception.Message}");
            return Task.CompletedTask;
        },
        OnTicketReceived = context =>
        {
             Console.WriteLine($"[Sample OIDC] Ticket Received. User: {context.Principal.Identity.Name}");
             return Task.CompletedTask;   
        },
        OnRemoteFailure = context =>
        {
             Console.WriteLine($"[Sample OIDC] Remote Failure: {context.Failure?.Message}");
             context.Response.Redirect("/");
             context.HandleResponse();
             return Task.CompletedTask;
        }
    };
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Error");
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseStaticFiles();

app.UseRouting();

app.UseAuthentication(); // IMPORTANT: Add UseAuthentication
app.UseAuthorization();

app.MapRazorPages();

// Inline root handler removed to allow Pages/Index.cshtml to serve the Dashboard UI


// Login Trigger
app.MapGet("/login", (HttpContext context) =>
{
    return Results.Challenge(new Microsoft.AspNetCore.Authentication.AuthenticationProperties 
    { 
        RedirectUri = "/" 
    }, authenticationSchemes: new List<string> { "oidc" });
});

// Logout Trigger
app.MapGet("/logout", (HttpContext context) =>
{
    return Results.SignOut(new Microsoft.AspNetCore.Authentication.AuthenticationProperties 
    { 
        RedirectUri = "/" 
    }, authenticationSchemes: new List<string> { "Cookies", "oidc" });
});

app.Run();
