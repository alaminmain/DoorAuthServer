using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using System.Net.Http.Headers;
using System.Text.Json.Serialization;

namespace DoorAuthSample.Pages;

public class IndexModel : PageModel
{
    private readonly ILogger<IndexModel> _logger;

    public IndexModel(ILogger<IndexModel> logger)
    {
        _logger = logger;
    }

    public List<ApplicationViewModel> Applications { get; set; } = new();

    public async Task OnGetAsync()
    {
        if (User.Identity?.IsAuthenticated == true)
        {
            var accessToken = await HttpContext.GetTokenAsync("access_token");
            
            if (!string.IsNullOrEmpty(accessToken))
            {
                try
                {
                    // Bypass self-signed certs for Dev
                    var handler = new HttpClientHandler 
                    { 
                        ServerCertificateCustomValidationCallback = HttpClientHandler.DangerousAcceptAnyServerCertificateValidator 
                    };
                    
                    using var client = new HttpClient(handler);
                    client.BaseAddress = new Uri("https://localhost:3000");
                    client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

                    var response = await client.GetAsync("/api/users/me/applications");
                    if (response.IsSuccessStatusCode)
                    {
                        var jsonString = await response.Content.ReadAsStringAsync();
                        Console.WriteLine($"[DEBUG] Raw API Response: {jsonString}");
                        
                        var options = new System.Text.Json.JsonSerializerOptions
                        {
                            PropertyNameCaseInsensitive = true
                        };
                        var result = System.Text.Json.JsonSerializer.Deserialize<ApiResult<List<ApplicationViewModel>>>(jsonString, options);
                        
                        Applications = result?.Data ?? new();
                    }
                    else
                    {
                        _logger.LogWarning($"API Error: {response.StatusCode}");
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to fetch applications");
                }
            }
        }
    }

    public class ApplicationViewModel
    {
        public string Id { get; set; }
        public string Name { get; set; }
        public string Description { get; set; }
        
        [JsonPropertyName("appUrl")]
        public string AppUrl { get; set; }
        
        public string LogoUrl { get; set; }
    }

    public class ApiResult<T>
    {
        public bool Success { get; set; }
        public T Data { get; set; }
        public string Message { get; set; }
    }
}
