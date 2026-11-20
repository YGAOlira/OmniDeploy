using System.Collections.ObjectModel;
using System.ComponentModel;
using System.Runtime.CompilerServices;
using System.Text.Json.Serialization;
using System.Windows.Input;

namespace OmniDeploy.Models;

/// <summary>Base simples de notificação para bindings WPF.</summary>
public abstract class ObservableObject : INotifyPropertyChanged
{
    public event PropertyChangedEventHandler? PropertyChanged;

    protected void OnPropertyChanged([CallerMemberName] string? name = null)
        => PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(name));

    protected bool Set<T>(ref T field, T value, [CallerMemberName] string? name = null)
    {
        if (EqualityComparer<T>.Default.Equals(field, value)) return false;
        field = value;
        OnPropertyChanged(name);
        return true;
    }
}

public sealed class RelayCommand : ICommand
{
    private readonly Action<object?> _exec;
    private readonly Func<object?, bool>? _can;

    public RelayCommand(Action<object?> exec, Func<object?, bool>? can = null)
    {
        _exec = exec;
        _can = can;
    }

    public RelayCommand(Action exec, Func<bool>? can = null)
        : this(_ => exec(), can is null ? null : _ => can()) { }

    public event EventHandler? CanExecuteChanged
    {
        add => CommandManager.RequerySuggested += value;
        remove => CommandManager.RequerySuggested -= value;
    }

    public bool CanExecute(object? parameter) => _can?.Invoke(parameter) ?? true;
    public void Execute(object? parameter) => _exec(parameter);
}

/// <summary>Conteúdo de 04_Config\config.json.</summary>
public sealed class AppConfig
{
    [JsonPropertyName("titulo_midia")] public string TituloMidia { get; set; } = "OmniDeploy - Mídia de Implantação";
    [JsonPropertyName("versao")] public string Versao { get; set; } = "1.0";
    [JsonPropertyName("autor")] public string Autor { get; set; } = "Ygor Paes";
    [JsonPropertyName("chave_padrao_windows")] public string ChavePadraoWindows { get; set; } = "";
    [JsonPropertyName("usuario_zerotouch")] public string UsuarioZeroTouch { get; set; } = "SuporteLocal";
    [JsonPropertyName("senha_zerotouch")] public string SenhaZeroTouch { get; set; } = "";
    [JsonPropertyName("servidor_ntp")] public string ServidorNtp { get; set; } = "a.ntp.br";
    [JsonPropertyName("fuso_horario")] public string FusoHorario { get; set; } = "E. South America Standard Time";
    [JsonPropertyName("tamanho_winre_mb")] public int TamanhoWinReMb { get; set; } = 1024;
}

public sealed class HardwareInfo
{
    public string Fabricante { get; set; } = "—";
    public string Modelo { get; set; } = "—";
    public string ModeloAmigavel { get; set; } = "";
    public string Processador { get; set; } = "—";
    public string NumeroSerie { get; set; } = "—";
    public string MemoriaRam { get; set; } = "—";
    public string VersaoBios { get; set; } = "";

    public string FabricanteModelo
    {
        get
        {
            var modelo = string.IsNullOrWhiteSpace(ModeloAmigavel) || ModeloAmigavel.Equals(Modelo, StringComparison.OrdinalIgnoreCase)
                ? Modelo
                : $"{ModeloAmigavel} ({Modelo})";
            return $"{Fabricante} {modelo}".Trim();
        }
    }

    /// <summary>Texto concatenado usado para casar pastas de drivers com o hardware.</summary>
    public string Assinatura => $"{Fabricante} {Modelo} {ModeloAmigavel}";
}

public sealed class DiskInfo
{
    public int Numero { get; set; }
    public string Modelo { get; set; } = "";
    public ulong TamanhoBytes { get; set; }
    public string Barramento { get; set; } = "";
    public string EstiloParticao { get; set; } = "";
    public string Midia { get; set; } = "";
    public bool Sistema { get; set; }
    public bool Boot { get; set; }

    public double TamanhoGb => TamanhoBytes / 1024d / 1024d / 1024d;
    public string TamanhoTexto => TamanhoGb >= 1000 ? $"{TamanhoGb / 1024d:0.00} TB" : $"{TamanhoGb:0.0} GB";
    public string Titulo => $"Disco {Numero}  •  {Modelo}";
    public string Detalhes
    {
        get
        {
            var partes = new List<string> { TamanhoTexto };
            if (!string.IsNullOrWhiteSpace(Barramento)) partes.Add(Barramento);
            if (!string.IsNullOrWhiteSpace(Midia)) partes.Add(Midia);
            if (!string.IsNullOrWhiteSpace(EstiloParticao)) partes.Add($"Atual: {EstiloParticao}");
            return string.Join("  •  ", partes);
        }
    }
}

public sealed class ImageFileItem
{
    public string Caminho { get; set; } = "";
    public string Nome => Path.GetFileName(Caminho);
    public long TamanhoBytes { get; set; }
    public string TamanhoTexto => $"{TamanhoBytes / 1024d / 1024d / 1024d:0.00} GB";
    public string Tipo => Path.GetExtension(Caminho).TrimStart('.').ToUpperInvariant();
}

public sealed class ImageEdition
{
    public int Indice { get; set; }
    public string Nome { get; set; } = "";
    public string Descricao { get; set; } = "";
    public string Tamanho { get; set; } = "";
    public string Titulo => $"[{Indice}]  {Nome}";
}

public sealed class DriverFolder : ObservableObject
{
    private bool _selecionado;

    public string Nome { get; set; } = "";
    public string Caminho { get; set; } = "";
    public int QtdInf { get; set; }
    public int QtdScripts { get; set; }
    public bool Recomendado { get; set; }

    public bool Selecionado
    {
        get => _selecionado;
        set => Set(ref _selecionado, value);
    }

    public string Resumo
    {
        get
        {
            var p = new List<string>();
            if (QtdInf > 0) p.Add($"{QtdInf} INF (DISM /Add-Driver)");
            if (QtdScripts > 0) p.Add($"{QtdScripts} script(s)/registro");
            if (p.Count == 0) p.Add("Pasta vazia");
            return string.Join("  •  ", p);
        }
    }
}

public sealed class PartitionSegment
{
    public string Nome { get; set; } = "";
    public string Detalhe { get; set; } = "";
    public string Cor { get; set; } = "#3B82F6";
    public double Peso { get; set; } = 1;
}

public enum DeployMode
{
    Intune,
    Bypass,
    ZeroTouch
}

public enum LogLevel
{
    Info,
    Comando,
    Sucesso,
    Aviso,
    Erro,
    Etapa,
    Saida
}

public sealed class LogEntry
{
    public DateTime Hora { get; init; } = DateTime.Now;
    public LogLevel Nivel { get; init; }
    public string Texto { get; init; } = "";
    public string HoraTexto => Hora.ToString("HH:mm:ss");
}

/// <summary>Tudo o que é necessário para executar uma implantação.</summary>
public sealed class DeployPlan
{
    public required DiskInfo Disco { get; init; }
    public required bool Uefi { get; init; }
    public required string ArquivoImagem { get; init; }
    public required ImageEdition Edicao { get; init; }
    public required DeployMode Modo { get; init; }
    public required IReadOnlyList<DriverFolder> Drivers { get; init; }
    public bool SincronizarNtp { get; init; }
    public bool AtivarWindows { get; init; }
    public string ChaveWindows { get; init; } = "";
    public required AppConfig Config { get; init; }
    public required string RaizDados { get; init; }
    public required HardwareInfo Hardware { get; init; }
}

public sealed class ObservableLog : ObservableCollection<LogEntry> { }

