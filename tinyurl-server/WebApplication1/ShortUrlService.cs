using System.Collections.Concurrent;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading;

public class ShortUrlService
{
    public class ShortUrlEntry
    {
        private long _clickCount = 0;
        public string Code { get; set; } = string.Empty;
        public string LongUrl  { get; set; } = string.Empty;
        public long ClickCount => Interlocked.Read(ref _clickCount);

        public ShortUrlEntry(string code, string longUrl)
        {
            Code     = code;
            LongUrl  = longUrl;
        }

        public void Increment() =>
            Interlocked.Increment(ref _clickCount);
    }

    private readonly ConcurrentDictionary<string, ShortUrlEntry> _store = new();

    private static readonly Regex CodeRegex = new("^[0-9A-Za-z]{1,16}$",
                                                  RegexOptions.Compiled);
    private const string Alphabet = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
    private static readonly Random Rnd = new();
    private const int codeLength = 7; // length of auto-generated codes
    // Base-62 encode
    private static string ToBase62()
    {
        var codeChars = new char[codeLength];
        for (int i = 0; i < codeLength; i++)
        {
            // Randomize the order of the characters
            int randomIndex = Rnd.Next(0, 62);
            codeChars[i] = Alphabet[randomIndex];
        }
        return new string(codeChars);
    }

    // Validate & normalize a long URL
    private static string ValidateLongUrl(string input)
    {
        if (!Uri.TryCreate(input, UriKind.Absolute, out var uri) ||
            !(uri.Scheme == Uri.UriSchemeHttp || uri.Scheme == Uri.UriSchemeHttps))
            throw new ArgumentException("Invalid URL: only absolute http/https URLs allowed.");

        return uri.AbsoluteUri;
    }

    private static void ValidateShortCode(string code)
    {
        if (!CodeRegex.IsMatch(code))
            throw new ArgumentException("Short code must be 1-16 chars [0-9A-Z a-z] only.");
    }

    public ShortUrlEntry Create(string longUrl, string? customCode)
    {
        var normalizedUrl = ValidateLongUrl(longUrl);

        string code;
        if (!string.IsNullOrWhiteSpace(customCode))
        {
            ValidateShortCode(customCode);
            code = customCode;
            if (_store.ContainsKey(code))
                throw new InvalidOperationException($"Custom code \"{code}\" is already in use.");
        }
        else
        {
            // auto-generate unique code
            do
            {
                code = ToBase62();
            }
            while (_store.ContainsKey(code));
        }

        var entry = new ShortUrlEntry(code, normalizedUrl);
        if (!_store.TryAdd(code, entry))
            throw new InvalidOperationException($"Code \"{code}\" is already in use."); // race-condition fallback

        return entry;
    }

    public IEnumerable<ShortUrlEntry> GetAllEntries() => _store.Values;

    public bool Delete(string code)
    {
        ValidateShortCode(code);
        return _store.TryRemove(code, out _);
    }

    public string? Resolve(string code)
    {
        if (!CodeRegex.IsMatch(code)) return null;
        return _store.TryGetValue(code, out var entry) ? entry.LongUrl : null;
    }

    public void IncrementClick(string code)
    {
        if (_store.TryGetValue(code, out var entry))
            entry.Increment();
    }
}
