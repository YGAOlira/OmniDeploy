using System.Diagnostics;
using System.Globalization;
using System.IO;
using System.Text;

namespace OmniDeploy.Services;

/// <summary>Executa processos externos (diskpart, dism, bcdboot…) transmitindo a saída em tempo real.</summary>
public static class ProcessRunner
{
    private static Encoding? _oem;

    public static Encoding OemEncoding
    {
        get
        {
            if (_oem is not null) return _oem;
            try
            {
                Encoding.RegisterProvider(CodePagesEncodingProvider.Instance);
                _oem = Encoding.GetEncoding(CultureInfo.CurrentCulture.TextInfo.OEMCodePage);
            }
            catch
            {
                _oem = Encoding.GetEncoding(437);
            }
            return _oem;
        }
    }

    public static string Resolve(string exe)
    {
        if (Path.IsPathRooted(exe)) return exe;
        var sys = Environment.GetFolderPath(Environment.SpecialFolder.System);
        var candidato = Path.Combine(sys, exe);
        return File.Exists(candidato) ? candidato : exe;
    }

    /// <summary>
    /// Executa e devolve o código de saída. Cada linha (separada por \r ou \n) é enviada para <paramref name="onLine"/>.
    /// </summary>
    public static async Task<int> RunAsync(string exe, string args, Action<string>? onLine, CancellationToken ct = default,
        string? workingDir = null)
    {
        var psi = new ProcessStartInfo
        {
            FileName = Resolve(exe),
            Arguments = args,
            UseShellExecute = false,
            CreateNoWindow = true,
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            StandardOutputEncoding = OemEncoding,
            StandardErrorEncoding = OemEncoding,
            WorkingDirectory = workingDir ?? Environment.GetFolderPath(Environment.SpecialFolder.System)
        };

        using var p = new Process { StartInfo = psi, EnableRaisingEvents = true };
        p.Start();

        using var reg = ct.Register(() =>
        {
            try { if (!p.HasExited) p.Kill(true); } catch { }
        });

        var t1 = Pump(p.StandardOutput, onLine);
        var t2 = Pump(p.StandardError, onLine);
        await Task.WhenAll(t1, t2).ConfigureAwait(false);
        await p.WaitForExitAsync(CancellationToken.None).ConfigureAwait(false);
        ct.ThrowIfCancellationRequested();
        return p.ExitCode;
    }

    /// <summary>Executa e captura toda a saída como texto.</summary>
    public static async Task<(int Codigo, string Saida)> CaptureAsync(string exe, string args, CancellationToken ct = default)
    {
        var sb = new StringBuilder();
        var code = await RunAsync(exe, args, l => { lock (sb) sb.AppendLine(l); }, ct).ConfigureAwait(false);
        return (code, sb.ToString());
    }

    private static async Task Pump(StreamReader reader, Action<string>? onLine)
    {
        var buffer = new char[4096];
        var linha = new StringBuilder();
        int n;
        while ((n = await reader.ReadAsync(buffer, 0, buffer.Length).ConfigureAwait(false)) > 0)
        {
            for (var i = 0; i < n; i++)
            {
                var c = buffer[i];
                if (c is '\r' or '\n')
                {
                    if (linha.Length > 0)
                    {
                        onLine?.Invoke(linha.ToString());
                        linha.Clear();
                    }
                }
                else if (c != '\0')
                {
                    linha.Append(c);
                }
            }
        }
        if (linha.Length > 0) onLine?.Invoke(linha.ToString());
    }
}

