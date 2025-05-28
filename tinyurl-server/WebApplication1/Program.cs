using Microsoft.AspNetCore.Hosting.Server;
using Microsoft.AspNetCore.Hosting.Server.Features;
using System.Text.Json;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddSingleton<ShortUrlService>();

builder.Services.AddCors(opts =>
{
    opts.AddPolicy("AllowAll", p => p
        .AllowAnyOrigin()
        .AllowAnyHeader()
        .AllowAnyMethod());
});

var app = builder.Build();
app.UseCors("AllowAll");
app.UseHttpsRedirection();

string? baseUrl = null;
app.Lifetime.ApplicationStarted.Register(() =>
{
    var addresses = app.Services.GetRequiredService<IServer>().Features.Get<IServerAddressesFeature>()?.Addresses;
    baseUrl = addresses?.FirstOrDefault();
});

// POST /api/shorturls  → create
app.MapPost("/api/v1/shorturls", async (HttpContext ctx, ShortUrlService svc) =>
{
    var dto = await ctx.Request.ReadFromJsonAsync<JsonElement>();
    var longUrl = dto.GetProperty("longUrl").GetString();
    string? customCode = null;
    if (dto.TryGetProperty("customCode", out var customCodeProperty))
    {
        customCode = customCodeProperty.GetString();
    }

    try
    {
        var entry = svc.Create(longUrl, customCode);

        var shortUrl = $"{baseUrl}/{entry.Code}";

        return Results.Created(shortUrl, new
        {
            shortUrl,
            shortCode = entry.Code,
            longUrl = entry.LongUrl,
            clicks = entry.ClickCount
        });
    }
    catch (ArgumentException ex)        { return Results.BadRequest(ex.Message); }
    catch (InvalidOperationException ex){ return Results.Conflict(ex.Message);    }
});

// GET /api/shorturls  → list all (with stats)
app.MapGet("/api/v1/shorturls", (ShortUrlService svc) =>
{
    // Use the baseUrl captured at startup
    var entries = svc.GetAllEntries()
        .Select(entry => new
        {
            shortUrl = $"{baseUrl}/{entry.Code}",
            shortCode = entry.Code,
            longUrl = entry.LongUrl,
            clicks = entry.ClickCount
        });
    return Results.Ok(entries);
});

// DELETE /api/shorturls/{code}  → remove
app.MapDelete("/api/v1/shorturls/{code}", (string code, ShortUrlService svc) =>
    svc.Delete(code) ? Results.NoContent() : Results.NotFound());

// GET /{code}  → redirect & count click
app.MapGet("/{code}", (string code, ShortUrlService svc) =>
{
    var longUrl = svc.Resolve(code);
    if (longUrl is null) return Results.NotFound();

    svc.IncrementClick(code);
    return Results.Redirect(longUrl);
});

app.Run();
