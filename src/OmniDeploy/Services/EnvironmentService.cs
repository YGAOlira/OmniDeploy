using System.Runtime.InteropServices;
using System.Security.Principal;
using System.Text.Json;
using OmniDeploy.Models;
using Microsoft.Win32;

namespace OmniDeploy.Services;

/// <summary>Detecção do ambiente: WinPE, modo de boot, raiz de dados do pendrive, configuração.</summary>
public static class EnvironmentService
{
    public const string PastaImagens = "01_ISOs_Imagens";
    public const string PastaDrivers = "02_Drivers";
    public const string PastaScripts = "03_Scripts";
    public const string PastaConfig = "04_Config";
    public const string PastaApp = "05_App_Sistema";
    public const string RotuloDados = "OMNI_DADOS";

    [DllImport("kernel32.dll", SetLastError = true)]
    private static extern bool GetFirmwareType(out uint firmwareType);

    /// <summary>True quando rodando dentro do Windows PE.</summary>
    public static bool IsWinPE
    {
        get
        {
            try
            {
                using var k = Registry.LocalMachine.OpenSubKey(@"SYSTEM\CurrentControlSet\Control\MiniNT");
                return k is not null;
            }
            catch { return false; }
        }
    }

    public static bool IsAdmin
    {
        get
        {
            try
            {
                using var id = WindowsIdentity.GetCurrent();
                return new WindowsPrincipal(id).IsInRole(WindowsBuiltInRole.Administrator) || id.IsSystem;
            }
            catch { return false; }
        }
    }

    /// <summary>Detecta UEFI x Legacy. 1 = BIOS, 2 = UEFI.</summary>
    public static bool DetectUefi()
    {
        try
        {
            if (GetFirmwareType(out var t))
                return t == 2;
        }
        catch { /* API indisponível */ }

        try
        {
            using var k = Registry.LocalMachine.OpenSubKey(@"SYSTEM\CurrentControlSet\Control");
            if (k?.GetValue("PEFirmwareType") is int v)
                return v == 2;
        }
        catch { }

        return false;
    }

    /// <summary>
    /// Localiza a raiz OMNI_DADOS: primeiro pelo caminho do próprio executável
    /// (…\05_App_Sistema\OmniDeploy.exe), depois varrendo as unidades.
    /// </summary>
    public static string? FindDataRoot()
    {
        static bool EhRaiz(string? dir) =>
            !string.IsNullOrEmpty(dir) && Directory.Exists(Path.Combine(dir, PastaConfig)) &&
            File.Exists(Path.Combine(dir, PastaConfig, "config.json"));

        try
        {
            var exeDir = Path.GetDirectoryName(Environment.ProcessPath ?? AppContext.BaseDirectory);
            var parent = exeDir is null ? null : Directory.GetParent(exeDir)?.FullName;
            if (EhRaiz(parent)) return parent;
            if (EhRaiz(exeDir)) return exeDir;
        }
        catch { }

        var env = Environment.GetEnvironmentVariable("OMNI_DADOS");
        if (EhRaiz(env)) return env;

        foreach (var d in DriveInfo.GetDrives())
        {
            try
            {
                if (!d.IsReady) continue;
                if (string.Equals(d.VolumeLabel, RotuloDados, StringComparison.OrdinalIgnoreCase) && EhRaiz(d.RootDirectory.FullName))
                    return d.RootDirectory.FullName;
            }
            catch { }
        }

        foreach (var d in DriveInfo.GetDrives())
        {
            try
            {
                if (d.IsReady && EhRaiz(d.RootDirectory.FullName))
                    return d.RootDirectory.FullName;
            }
            catch { }
        }
        return null;
    }

    public static string DriveLetterOf(string path)
    {
        var root = Path.GetPathRoot(path) ?? "";
        return root.Length >= 2 && root[1] == ':' ? root[..2].ToUpperInvariant() : root;
    }

    public static AppConfig LoadConfig(string? dataRoot)
    {
        if (dataRoot is null) return new AppConfig();
        var file = Path.Combine(dataRoot, PastaConfig, "config.json");
        try
        {
            var json = File.ReadAllText(file);
            return JsonSerializer.Deserialize<AppConfig>(json, new JsonSerializerOptions
            {
                ReadCommentHandling = JsonCommentHandling.Skip,
                AllowTrailingCommas = true,
                PropertyNameCaseInsensitive = true
            }) ?? new AppConfig();
        }
        catch
        {
            return new AppConfig();
        }
    }

    /// <summary>Retorna a primeira letra livre, priorizando a preferida.</summary>
    public static char GetFreeLetter(char preferida, params char[] reservadas)
    {
        var usadas = new HashSet<char>(DriveInfo.GetDrives().Select(d => char.ToUpperInvariant(d.Name[0])));
        foreach (var r in reservadas) usadas.Add(char.ToUpperInvariant(r));
        usadas.Add('X'); // RAM disk do WinPE
        preferida = char.ToUpperInvariant(preferida);
        if (!usadas.Contains(preferida)) return preferida;
        for (var c = 'Z'; c >= 'G'; c--)
            if (!usadas.Contains(c)) return c;
        throw new InvalidOperationException("Não há letras de unidade livres.");
    }

    public static string SystemDriveLetter =>
        (Environment.GetEnvironmentVariable("SystemDrive") ?? "C:").ToUpperInvariant();
}

