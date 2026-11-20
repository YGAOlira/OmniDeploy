using System.Collections.ObjectModel;
using System.Diagnostics;
using System.IO;
using System.Text;
using System.Text.RegularExpressions;
using System.Windows;
using System.Windows.Threading;
using OmniDeploy.Models;
using OmniDeploy.Services;

namespace OmniDeploy.ViewModels;

public sealed class StepItem : ObservableObject
{
    private bool _ativo, _concluido;
    public int Indice { get; init; }
    public string Numero => (Indice + 1).ToString();
    public string Titulo { get; init; } = "";
    public string Subtitulo { get; init; } = "";
    public bool Ativo { get => _ativo; set => Set(ref _ativo, value); }
    public bool Concluido { get => _concluido; set => Set(ref _concluido, value); }
}

public sealed class SummaryLine
{
    public string Rotulo { get; init; } = "";
    public string Valor { get; init; } = "";
}

public sealed class MainViewModel : ObservableObject
{
    private static readonly Regex RxChave = new(@"^[A-Z0-9]{5}(-[A-Z0-9]{5}){4}$", RegexOptions.Compiled);

    private readonly Dispatcher _ui = Application.Current.Dispatcher;
    private StreamWriter? _logFile;
    private readonly object _logLock = new();
    private CancellationTokenSource? _cts;
    private int? _discoPendrive;

    public MainViewModel()
    {
        RaizDados = EnvironmentService.FindDataRoot();
        Config = EnvironmentService.LoadConfig(RaizDados);
        IsUefi = EnvironmentService.DetectUefi();
        IsWinPE = EnvironmentService.IsWinPE;

        Etapas = new ObservableCollection<StepItem>
        {
            new() { Indice = 0, Titulo = "Disco de destino", Subtitulo = "Seleção e particionamento" },
            new() { Indice = 1, Titulo = "Imagem e edição", Subtitulo = "WIM / ESD + índice" },
            new() { Indice = 2, Titulo = "Modo de implantação", Subtitulo = "Intune, Bypass ou Zero-Touch" },
            new() { Indice = 3, Titulo = "Drivers", Subtitulo = "Injeção sob demanda" },
            new() { Indice = 4, Titulo = "Pós-instalação", Subtitulo = "NTP e ativação" },
            new() { Indice = 5, Titulo = "Execução", Subtitulo = "Resumo e console ao vivo" },
        };
        Etapas[0].Ativo = true;

        ProximoCommand = new RelayCommand(Proximo, () => PodeAvancar && !Executando);
        VoltarCommand = new RelayCommand(Voltar, () => EtapaAtual > 0 && !Executando && !Concluido);
        IrParaEtapaCommand = new RelayCommand(o => IrPara(Convert.ToInt32(o)), o => !Executando && !Concluido && PodeIrPara(Convert.ToInt32(o)));
        AtualizarDiscosCommand = new RelayCommand(async () => await CarregarDiscosAsync(), () => !Executando);
        AtualizarImagensCommand = new RelayCommand(CarregarImagens, () => !Executando);
        AtualizarDriversCommand = new RelayCommand(CarregarDrivers, () => !Executando);
        CopiarSerialCommand = new RelayCommand(CopiarSerial);
        AlternarChaveCommand = new RelayCommand(() => MostrarChave = !MostrarChave);
        SolicitarInicioCommand = new RelayCommand(() => ConfirmacaoVisivel = true, () => !Executando && !Concluido && ResumoValido);
        CancelarConfirmacaoCommand = new RelayCommand(() => ConfirmacaoVisivel = false);
        IniciarCommand = new RelayCommand(async () => await IniciarAsync(), () => !Executando && !Concluido);
        ReiniciarCommand = new RelayCommand(() => Energia(reiniciar: true), () => !Executando);
        DesligarCommand = new RelayCommand(() => Energia(reiniciar: false), () => !Executando);
        AbrirCmdCommand = new RelayCommand(AbrirCmd);
        NovaImplantacaoCommand = new RelayCommand(NovaImplantacao, () => !Executando && (Concluido || Falhou));
        FecharCommand = new RelayCommand(() => Application.Current.Shutdown(), () => !Executando);
    }

    // ================================================================ cabeçalho / ambiente

    public AppConfig Config { get; }
    public string? RaizDados { get; }
    public bool IsUefi { get; }
    public bool IsWinPE { get; }
    public string Titulo => Config.TituloMidia;
    public string VersaoBadge => "v" + Config.Versao;
    public string Subtitulo => "Desenvolvido por " + Config.Autor;
    public string ModoBootTexto => IsUefi ? "UEFI (GPT)" : "Legacy (MBR)";
    public string UnidadeDadosTexto => RaizDados is null ? "OMNI_DADOS não encontrada" : $"{EnvironmentService.RotuloDados} em {EnvironmentService.DriveLetterOf(RaizDados)}";
    public bool DadosEncontrados => RaizDados is not null;
    public string AmbienteTexto => IsWinPE ? "Windows PE" : (EnvironmentService.IsAdmin ? "Modo teste (Windows)" : "Modo teste (sem admin)");

    // ================================================================ hardware

    private HardwareInfo _hardware = new();
    private bool _carregandoHardware = true;
    public HardwareInfo Hardware { get => _hardware; private set => Set(ref _hardware, value); }
    public bool CarregandoHardware { get => _carregandoHardware; private set => Set(ref _carregandoHardware, value); }

    private string _toast = "";
    public string Toast { get => _toast; set => Set(ref _toast, value); }

    // ================================================================ etapas

    public ObservableCollection<StepItem> Etapas { get; }
    private int _etapaAtual;
    public int EtapaAtual
    {
        get => _etapaAtual;
        private set
        {
            if (!Set(ref _etapaAtual, value)) return;
            for (var i = 0; i < Etapas.Count; i++)
            {
                Etapas[i].Ativo = i == value;
                Etapas[i].Concluido = i < value;
            }
            OnPropertyChanged(nameof(EhUltimaEtapa));
            OnPropertyChanged(nameof(TituloEtapa));
            if (value == 5) MontarResumo();
        }
    }
    public bool EhUltimaEtapa => EtapaAtual == Etapas.Count - 1;
    public string TituloEtapa => $"Etapa {EtapaAtual + 1} de {Etapas.Count}  •  {Etapas[EtapaAtual].Titulo}";

    public bool PodeAvancar => EtapaValida(EtapaAtual);

    private bool EtapaValida(int etapa) => etapa switch
    {
        0 => DiscoSelecionado is not null,
        1 => ImagemSelecionada is not null && EdicaoSelecionada is not null,
        2 => true,
        3 => true,
        4 => !AtivarWindows || ChaveValida,
        _ => false
    };

    private bool PodeIrPara(int etapa)
    {
        for (var i = 0; i < etapa; i++)
            if (!EtapaValida(i)) return false;
        return true;
    }

    private void Proximo()
    {
        if (EtapaAtual < Etapas.Count - 1 && PodeAvancar) EtapaAtual++;
    }

    private void Voltar()
    {
        if (EtapaAtual > 0) EtapaAtual--;
    }

    private void IrPara(int etapa)
    {
        if (etapa >= 0 && etapa < Etapas.Count && PodeIrPara(etapa)) EtapaAtual = etapa;
    }

    // ================================================================ etapa 1 – disco

    public ObservableCollection<DiskInfo> Discos { get; } = new();
    public ObservableCollection<PartitionSegment> MapaParticoes { get; } = new();
    private DiskInfo? _discoSelecionado;
    private string _discosOcultos = "";
    private bool _carregandoDiscos;

    public DiskInfo? DiscoSelecionado
    {
        get => _discoSelecionado;
        set
        {
            if (Set(ref _discoSelecionado, value)) MontarMapa();
        }
    }
    public string DiscosOcultosTexto { get => _discosOcultos; private set => Set(ref _discosOcultos, value); }
    public bool CarregandoDiscos { get => _carregandoDiscos; private set => Set(ref _carregandoDiscos, value); }
    public string LayoutTexto => IsUefi
        ? "UEFI detectado → tabela GPT: EFI 100 MB (FAT32) + MSR 16 MB + Windows (NTFS) + WinRE"
        : "Legacy detectado → tabela MBR: Reservado pelo Sistema 100 MB (ativa) + Windows (NTFS)";

    private void MontarMapa()
    {
        MapaParticoes.Clear();
        var totalMb = (DiscoSelecionado?.TamanhoBytes ?? 0) / 1024d / 1024d;
        var winRe = Math.Clamp(Config.TamanhoWinReMb, 500, 4096);
        if (IsUefi)
        {
            var winMb = Math.Max(0, totalMb - 100 - 16 - winRe);
            MapaParticoes.Add(new PartitionSegment { Nome = "EFI", Detalhe = "100 MB • FAT32", Cor = "#F59E0B", Peso = 1.3 });
            MapaParticoes.Add(new PartitionSegment { Nome = "MSR", Detalhe = "16 MB", Cor = "#64748B", Peso = 1 });
            MapaParticoes.Add(new PartitionSegment { Nome = "Windows (C:)", Detalhe = totalMb > 0 ? $"{winMb / 1024d:0.0} GB • NTFS" : "Restante • NTFS", Cor = "#3B82F6", Peso = 6 });
            MapaParticoes.Add(new PartitionSegment { Nome = "WinRE", Detalhe = $"{winRe / 1024d:0.#} GB • NTFS", Cor = "#10B981", Peso = 1.5 });
        }
        else
        {
            var winMb = Math.Max(0, totalMb - 100);
            MapaParticoes.Add(new PartitionSegment { Nome = "Reservado", Detalhe = "100 MB • NTFS • Ativa", Cor = "#F59E0B", Peso = 1.6 });
            MapaParticoes.Add(new PartitionSegment { Nome = "Windows (C:)", Detalhe = totalMb > 0 ? $"{winMb / 1024d:0.0} GB • NTFS" : "Restante • NTFS", Cor = "#3B82F6", Peso = 7 });
        }
        OnPropertyChanged(nameof(AvisoMbr2Tb));
    }

    public bool AvisoMbr2Tb => !IsUefi && (DiscoSelecionado?.TamanhoBytes ?? 0) > 2UL * 1024 * 1024 * 1024 * 1024;

    public async Task CarregarDiscosAsync()
    {
        CarregandoDiscos = true;
        try
        {
            if (RaizDados is not null && _discoPendrive is null)
                _discoPendrive = await Task.Run(() => WmiService.GetDiskNumberOfLetter(EnvironmentService.DriveLetterOf(RaizDados)));

            var todos = await Task.Run(WmiService.GetDisks);
            var ocultos = new List<string>();
            int? discoSistema = null;
            if (!IsWinPE)
                discoSistema = await Task.Run(() => WmiService.GetDiskNumberOfLetter(EnvironmentService.SystemDriveLetter));

            var anterior = DiscoSelecionado?.Numero;
            Discos.Clear();
            foreach (var d in todos)
            {
                if (_discoPendrive == d.Numero) { ocultos.Add($"Disco {d.Numero} (pendrive OmniDeploy)"); continue; }
                if (!IsWinPE && (d.Sistema || d.Boot || discoSistema == d.Numero)) { ocultos.Add($"Disco {d.Numero} (Windows em execução)"); continue; }
                Discos.Add(d);
            }
            DiscosOcultosTexto = ocultos.Count == 0 ? "" : "Ocultos por segurança: " + string.Join(", ", ocultos);
            DiscoSelecionado = Discos.FirstOrDefault(x => x.Numero == anterior) ?? (Discos.Count == 1 ? Discos[0] : null);
            if (DiscoSelecionado is null) MontarMapa();
        }
        catch (Exception ex)
        {
            DiscosOcultosTexto = "Falha ao listar discos: " + ex.Message;
        }
        finally
        {
            CarregandoDiscos = false;
        }
    }

    // ================================================================ etapa 2 – imagem

    public ObservableCollection<ImageFileItem> Imagens { get; } = new();
    public ObservableCollection<ImageEdition> Edicoes { get; } = new();
    private ImageFileItem? _imagemSel;
    private ImageEdition? _edicaoSel;
    private bool _carregandoEdicoes;
    private string _statusEdicoes = "";

    public ImageFileItem? ImagemSelecionada
    {
        get => _imagemSel;
        set
        {
            if (Set(ref _imagemSel, value)) _ = CarregarEdicoesAsync();
        }
    }
    public ImageEdition? EdicaoSelecionada { get => _edicaoSel; set => Set(ref _edicaoSel, value); }
    public bool CarregandoEdicoes { get => _carregandoEdicoes; private set => Set(ref _carregandoEdicoes, value); }
    public string StatusEdicoes { get => _statusEdicoes; private set => Set(ref _statusEdicoes, value); }
    public string PastaImagensTexto => RaizDados is null ? "—" : Path.Combine(RaizDados, EnvironmentService.PastaImagens);

    private void CarregarImagens()
    {
        Imagens.Clear();
        if (RaizDados is null) return;
        var pasta = Path.Combine(RaizDados, EnvironmentService.PastaImagens);
        if (!Directory.Exists(pasta)) return;
        foreach (var f in Directory.EnumerateFiles(pasta, "*.*", SearchOption.AllDirectories)
                     .Where(f => f.EndsWith(".wim", StringComparison.OrdinalIgnoreCase) || f.EndsWith(".esd", StringComparison.OrdinalIgnoreCase))
                     .OrderBy(f => f))
        {
            Imagens.Add(new ImageFileItem { Caminho = f, TamanhoBytes = new FileInfo(f).Length });
        }
        if (Imagens.Count > 0 && ImagemSelecionada is null) ImagemSelecionada = Imagens[0];
    }

    private async Task CarregarEdicoesAsync()
    {
        Edicoes.Clear();
        EdicaoSelecionada = null;
        var img = ImagemSelecionada;
        if (img is null) return;
        CarregandoEdicoes = true;
        StatusEdicoes = "Lendo edições com DISM…";
        try
        {
            var (lista, fonte) = await DismService.GetEditionsAsync(img.Caminho);
            if (img != ImagemSelecionada) return;
            foreach (var e in lista) Edicoes.Add(e);
            StatusEdicoes = $"{lista.Count} edição(ões) encontrada(s) • fonte: {fonte}";
            EdicaoSelecionada =
                Edicoes.FirstOrDefault(e => Regex.IsMatch(e.Nome, @"\bPro$", RegexOptions.IgnoreCase)) ??
                Edicoes.FirstOrDefault(e => e.Nome.Contains("Pro", StringComparison.OrdinalIgnoreCase)) ??
                Edicoes.FirstOrDefault();
        }
        catch (Exception ex)
        {
            StatusEdicoes = "Não foi possível ler as edições: " + ex.Message;
        }
        finally
        {
            CarregandoEdicoes = false;
        }
    }

    // ================================================================ etapa 3 – modo

    private DeployMode _modo = DeployMode.Intune;
    public DeployMode Modo
    {
        get => _modo;
        set
        {
            if (!Set(ref _modo, value)) return;
            OnPropertyChanged(nameof(ModoIntune));
            OnPropertyChanged(nameof(ModoBypass));
            OnPropertyChanged(nameof(ModoZeroTouch));
        }
    }
    public bool ModoIntune { get => Modo == DeployMode.Intune; set { if (value) Modo = DeployMode.Intune; } }
    public bool ModoBypass { get => Modo == DeployMode.Bypass; set { if (value) Modo = DeployMode.Bypass; } }
    public bool ModoZeroTouch { get => Modo == DeployMode.ZeroTouch; set { if (value) Modo = DeployMode.ZeroTouch; } }
    public string UsuarioZeroTouch => Config.UsuarioZeroTouch;

    // ================================================================ etapa 4 – drivers

    public ObservableCollection<DriverFolder> Drivers { get; } = new();
    public string PastaDriversTexto => RaizDados is null ? "—" : Path.Combine(RaizDados, EnvironmentService.PastaDrivers);

    private void CarregarDrivers()
    {
        var marcados = Drivers.Where(d => d.Selecionado).Select(d => d.Nome).ToHashSet(StringComparer.OrdinalIgnoreCase);
        var primeiraCarga = Drivers.Count == 0;
        Drivers.Clear();
        if (RaizDados is null) return;
        var pasta = Path.Combine(RaizDados, EnvironmentService.PastaDrivers);
        if (!Directory.Exists(pasta)) return;

        var assinatura = Hardware.Assinatura;
        var ehLenovo = assinatura.Contains("ThinkPad", StringComparison.OrdinalIgnoreCase) ||
                       assinatura.Contains("Lenovo", StringComparison.OrdinalIgnoreCase);

        foreach (var dir in Directory.EnumerateDirectories(pasta).OrderBy(d => d))
        {
            var nome = Path.GetFileName(dir);
            var arquivos = Directory.EnumerateFiles(dir, "*.*", SearchOption.AllDirectories).ToList();
            var item = new DriverFolder
            {
                Nome = nome,
                Caminho = dir,
                QtdInf = arquivos.Count(f => f.EndsWith(".inf", StringComparison.OrdinalIgnoreCase)),
                QtdScripts = arquivos.Count(f => f.EndsWith(".bat", StringComparison.OrdinalIgnoreCase) ||
                                                 f.EndsWith(".cmd", StringComparison.OrdinalIgnoreCase) ||
                                                 f.EndsWith(".reg", StringComparison.OrdinalIgnoreCase)),
            };

            // Lenovo/ThinkPad → pré-marca Lenovo_ThinkPad_Teclado; demais pastas casam por tokens do nome (ex.: Dell_*, HP_*).
            var tokens = nome.Split('_', '-', ' ').Where(t => t.Length >= 2);
            item.Recomendado =
                (ehLenovo && (nome.Contains("Lenovo", StringComparison.OrdinalIgnoreCase) || nome.Contains("ThinkPad", StringComparison.OrdinalIgnoreCase))) ||
                tokens.Take(1).Any(t => assinatura.Contains(t, StringComparison.OrdinalIgnoreCase));

            item.Selecionado = primeiraCarga ? item.Recomendado : marcados.Contains(nome);
            Drivers.Add(item);
        }
        OnPropertyChanged(nameof(DriversRecomendadosTexto));
    }

    public string DriversRecomendadosTexto
    {
        get
        {
            var rec = Drivers.Where(d => d.Recomendado).Select(d => d.Nome).ToList();
            return rec.Count == 0
                ? "Nenhum pacote específico detectado para este hardware."
                : $"Detectado {Hardware.FabricanteModelo}: {string.Join(", ", rec)} pré-selecionado(s).";
        }
    }

    // ================================================================ etapa 5 – pós-instalação

    private bool _ntp = true, _ativar = true, _usarChavePadrao = true, _mostrarChave;
    private string _chaveManual = "";

    public bool SincronizarNtp { get => _ntp; set => Set(ref _ntp, value); }
    public string ServidorNtp => Config.ServidorNtp;

    public bool AtivarWindows
    {
        get => _ativar;
        set { if (Set(ref _ativar, value)) OnPropertyChanged(nameof(ChaveValida)); }
    }

    public bool UsarChavePadrao
    {
        get => _usarChavePadrao;
        set
        {
            if (!Set(ref _usarChavePadrao, value)) return;
            OnPropertyChanged(nameof(UsarChaveManual));
            OnPropertyChanged(nameof(ChaveValida));
            OnPropertyChanged(nameof(StatusChave));
        }
    }

    public bool UsarChaveManual { get => !UsarChavePadrao; set => UsarChavePadrao = !value; }

    public bool MostrarChave
    {
        get => _mostrarChave;
        set { if (Set(ref _mostrarChave, value)) OnPropertyChanged(nameof(ChavePadraoExibida)); }
    }

    public bool ChavePadraoDisponivel => RxChave.IsMatch(NormalizarChave(Config.ChavePadraoWindows));

    public string ChavePadraoExibida
    {
        get
        {
            var k = NormalizarChave(Config.ChavePadraoWindows);
            if (string.IsNullOrEmpty(k)) return "(nenhuma chave em config.json)";
            return MostrarChave ? k : DeployEngine.MascararChave(k);
        }
    }

    public string ChaveManual
    {
        get => _chaveManual;
        set
        {
            if (!Set(ref _chaveManual, value)) return;
            OnPropertyChanged(nameof(ChaveValida));
            OnPropertyChanged(nameof(StatusChave));
        }
    }

    public string ChaveEfetiva => UsarChavePadrao ? NormalizarChave(Config.ChavePadraoWindows) : NormalizarChave(ChaveManual);
    public bool ChaveValida => RxChave.IsMatch(ChaveEfetiva);

    public string StatusChave => ChaveValida
        ? "✓ Chave em formato válido"
        : UsarChavePadrao ? "A chave do config.json está ausente ou inválida." : "Digite os 25 caracteres da chave.";

    public static string NormalizarChave(string? chave)
    {
        var limpo = new string((chave ?? "").ToUpperInvariant().Where(char.IsLetterOrDigit).Take(25).ToArray());
        var sb = new StringBuilder();
        for (var i = 0; i < limpo.Length; i++)
        {
            if (i > 0 && i % 5 == 0) sb.Append('-');
            sb.Append(limpo[i]);
        }
        return sb.ToString();
    }

    // ================================================================ etapa 6 – execução

    public ObservableCollection<SummaryLine> Resumo { get; } = new();
    public ObservableLog Log { get; } = new();
    private bool _executando, _concluido, _falhou, _confirmacao;
    private double _progresso;
    private string _fase = "Aguardando início";
    private string _tempoDecorrido = "";
    private readonly Stopwatch _cronometro = new();
    private DispatcherTimer? _timer;

    public bool Executando { get => _executando; private set { if (Set(ref _executando, value)) EstadoMudou(); } }
    public bool Concluido { get => _concluido; private set { if (Set(ref _concluido, value)) EstadoMudou(); } }
    public bool Falhou { get => _falhou; private set { if (Set(ref _falhou, value)) EstadoMudou(); } }
    public bool MostrarResumo => !Executando && !Concluido && !Falhou;
    public bool Finalizado => !Executando && (Concluido || Falhou);

    private void EstadoMudou()
    {
        OnPropertyChanged(nameof(MostrarResumo));
        OnPropertyChanged(nameof(Finalizado));
    }
    public bool ConfirmacaoVisivel { get => _confirmacao; set => Set(ref _confirmacao, value); }
    public double Progresso { get => _progresso; private set { if (Set(ref _progresso, value)) OnPropertyChanged(nameof(ProgressoTexto)); } }
    public string ProgressoTexto => $"{Progresso:0}%";
    public string Fase { get => _fase; private set => Set(ref _fase, value); }
    public string TempoDecorrido { get => _tempoDecorrido; private set => Set(ref _tempoDecorrido, value); }
    public bool ResumoValido => Enumerable.Range(0, 5).All(EtapaValida) && RaizDados is not null;
    public string DiscoConfirmacaoTexto => DiscoSelecionado is null ? "" :
        $"TODOS os dados do Disco {DiscoSelecionado.Numero} — {DiscoSelecionado.Modelo} ({DiscoSelecionado.TamanhoTexto}) serão apagados permanentemente.";

    private void MontarResumo()
    {
        Resumo.Clear();
        void Add(string r, string v) => Resumo.Add(new SummaryLine { Rotulo = r, Valor = v });
        Add("Equipamento", $"{Hardware.FabricanteModelo}  •  S/N {Hardware.NumeroSerie}");
        Add("Disco de destino", DiscoSelecionado is null ? "—" : $"Disco {DiscoSelecionado.Numero} — {DiscoSelecionado.Modelo} ({DiscoSelecionado.TamanhoTexto})");
        Add("Particionamento", IsUefi ? "GPT • EFI 100 MB + MSR 16 MB + Windows + WinRE" : "MBR • Reservado 100 MB (ativa) + Windows");
        Add("Imagem", ImagemSelecionada?.Nome ?? "—");
        Add("Edição", EdicaoSelecionada is null ? "—" : $"Índice {EdicaoSelecionada.Indice} — {EdicaoSelecionada.Nome}");
        Add("Modo", DeployEngine.ModoTexto(Modo) + (Modo == DeployMode.ZeroTouch ? $"  (usuário: {Config.UsuarioZeroTouch})" : ""));
        var drv = Drivers.Where(d => d.Selecionado).Select(d => d.Nome).ToList();
        Add("Drivers", drv.Count == 0 ? "Nenhum" : string.Join(", ", drv));
        Add("Horário (NTP)", SincronizarNtp ? $"Sim — {Config.ServidorNtp} / E. South America Standard Time" : "Não");
        Add("Ativação", AtivarWindows ? $"Sim — {(UsarChavePadrao ? "chave padrão" : "chave manual")} {DeployEngine.MascararChave(ChaveEfetiva)}" : "Não");
        OnPropertyChanged(nameof(DiscoConfirmacaoTexto));
        OnPropertyChanged(nameof(ResumoValido));
    }

    private void AddLog(LogLevel nivel, string texto)
    {
        var entry = new LogEntry { Nivel = nivel, Texto = texto };
        lock (_logLock)
        {
            try { _logFile?.WriteLine($"{entry.HoraTexto} [{nivel,-7}] {texto}"); } catch { }
        }
        _ui.BeginInvoke(() =>
        {
            Log.Add(entry);
            if (Log.Count > 6000) Log.RemoveAt(0);
        }, DispatcherPriority.Background);
    }

    private async Task IniciarAsync()
    {
        ConfirmacaoVisivel = false;
        if (DiscoSelecionado is null || ImagemSelecionada is null || EdicaoSelecionada is null || RaizDados is null) return;

        Executando = true;
        Falhou = false;
        Log.Clear();
        Progresso = 0;
        _cts = new CancellationTokenSource();

        var logPath = Path.Combine(Path.GetTempPath(), $"OmniDeploy_{DateTime.Now:yyyyMMdd_HHmmss}.log");
        try { _logFile = new StreamWriter(logPath, false, new UTF8Encoding(true)) { AutoFlush = true }; } catch { _logFile = null; }

        _cronometro.Restart();
        _timer = new DispatcherTimer { Interval = TimeSpan.FromSeconds(1) };
        _timer.Tick += (_, _) => TempoDecorrido = _cronometro.Elapsed.ToString(@"hh\:mm\:ss");
        _timer.Start();

        var plan = new DeployPlan
        {
            Disco = DiscoSelecionado,
            Uefi = IsUefi,
            ArquivoImagem = ImagemSelecionada.Caminho,
            Edicao = EdicaoSelecionada,
            Modo = Modo,
            Drivers = Drivers.Where(d => d.Selecionado).ToList(),
            SincronizarNtp = SincronizarNtp,
            AtivarWindows = AtivarWindows,
            ChaveWindows = AtivarWindows ? ChaveEfetiva : "",
            Config = Config,
            RaizDados = RaizDados,
            Hardware = Hardware
        };

        AddLog(LogLevel.Info, $"{Config.TituloMidia} v{Config.Versao} — {Subtitulo}");
        AddLog(LogLevel.Info, $"Ambiente: {AmbienteTexto}  |  Log: {logPath}");
        if (!IsWinPE && !EnvironmentService.IsAdmin)
            AddLog(LogLevel.Aviso, "O aplicativo não está elevado. DISKPART/DISM falharão fora do WinPE sem privilégios de administrador.");

        var engine = new DeployEngine(plan, AddLog,
            (pct, fase) => _ui.BeginInvoke(() => { Progresso = Math.Max(Progresso, pct); Fase = fase; }), _cts.Token);

        try
        {
            await Task.Run(engine.RunAsync);
            Concluido = true;
            Fase = "Implantação concluída";
        }
        catch (Exception ex)
        {
            Falhou = true;
            Fase = "Falha na implantação";
            AddLog(LogLevel.Erro, "ERRO: " + ex.Message);
            AddLog(LogLevel.Erro, "Corrija o problema e use \"Nova implantação\" para tentar novamente.");
        }
        finally
        {
            _cronometro.Stop();
            _timer?.Stop();
            TempoDecorrido = _cronometro.Elapsed.ToString(@"hh\:mm\:ss");
            lock (_logLock)
            {
                try { _logFile?.Dispose(); } catch { }
                _logFile = null;
            }
            SalvarLogs(logPath, plan);
            Executando = false;
            CommandManagerInvalidate();
        }
    }

    private void SalvarLogs(string logPath, DeployPlan plan)
    {
        try
        {
            if (!File.Exists(logPath)) return;
            var serial = Regex.Replace(Hardware.NumeroSerie, @"[^A-Za-z0-9_-]", "");
            if (string.IsNullOrEmpty(serial)) serial = "SemSerial";
            var nome = $"{DateTime.Now:yyyyMMdd_HHmmss}_{serial}.log";

            var pastaLogs = Path.Combine(plan.RaizDados, "Logs");
            Directory.CreateDirectory(pastaLogs);
            File.Copy(logPath, Path.Combine(pastaLogs, nome), true);
            AddLog(LogLevel.Info, $"Log salvo no pendrive: Logs\\{nome}");
        }
        catch (Exception ex)
        {
            AddLog(LogLevel.Aviso, "Não foi possível salvar o log no pendrive: " + ex.Message);
        }

        // Cópia do log para o Windows aplicado (se a partição existir)
        try
        {
            foreach (var d in DriveInfo.GetDrives())
            {
                var dest = Path.Combine(d.RootDirectory.FullName, @"Windows\Setup\Scripts\OmniDeploy\Logs");
                if (d.IsReady && Directory.Exists(dest) && File.Exists(Path.Combine(dest, "Omni_Implantacao.txt")))
                {
                    File.Copy(logPath, Path.Combine(dest, "OmniDeploy.log"), true);
                    break;
                }
            }
        }
        catch { }
    }

    private static void CommandManagerInvalidate() =>
        Application.Current.Dispatcher.BeginInvoke(System.Windows.Input.CommandManager.InvalidateRequerySuggested);

    private void NovaImplantacao()
    {
        Concluido = false;
        Falhou = false;
        Progresso = 0;
        Fase = "Aguardando início";
        TempoDecorrido = "";
        Log.Clear();
        EtapaAtual = 0;
        _ = CarregarDiscosAsync();
    }

    private void Energia(bool reiniciar)
    {
        try
        {
            if (IsWinPE)
                Process.Start(new ProcessStartInfo("wpeutil.exe", reiniciar ? "reboot" : "shutdown") { UseShellExecute = false, CreateNoWindow = true });
            else
            {
                var r = MessageBox.Show(reiniciar ? "Reiniciar o computador agora?" : "Desligar o computador agora?",
                    Config.TituloMidia, MessageBoxButton.YesNo, MessageBoxImage.Question);
                if (r == MessageBoxResult.Yes)
                    Process.Start(new ProcessStartInfo("shutdown.exe", reiniciar ? "/r /t 5" : "/s /t 5") { UseShellExecute = false, CreateNoWindow = true });
            }
        }
        catch (Exception ex)
        {
            Toast = "Falha: " + ex.Message;
        }
    }

    private void AbrirCmd()
    {
        try { Process.Start(new ProcessStartInfo("cmd.exe") { UseShellExecute = true, WorkingDirectory = RaizDados ?? "X:\\" }); }
        catch (Exception ex) { Toast = "Falha ao abrir CMD: " + ex.Message; }
    }

    private async void CopiarSerial()
    {
        var serial = Hardware.NumeroSerie;
        try
        {
            Clipboard.SetDataObject(serial, true);
            Toast = $"Número de série {serial} copiado";
        }
        catch
        {
            Toast = "Área de transferência indisponível";
        }

        // Também registra em arquivo no pendrive (útil no WinPE, onde não há onde colar)
        try
        {
            if (RaizDados is not null)
            {
                var pasta = Path.Combine(RaizDados, "Logs");
                Directory.CreateDirectory(pasta);
                await File.AppendAllTextAsync(Path.Combine(pasta, "NumerosDeSerie.txt"),
                    $"{DateTime.Now:dd/MM/yyyy HH:mm}\t{serial}\t{Hardware.FabricanteModelo}{Environment.NewLine}");
            }
        }
        catch { }

        await Task.Delay(2500);
        Toast = "";
    }

    // ================================================================ inicialização

    public async Task InicializarAsync()
    {
        CarregarImagens();
        var tDiscos = CarregarDiscosAsync();
        try
        {
            Hardware = await Task.Run(WmiService.GetHardware);
        }
        catch { }
        finally
        {
            CarregandoHardware = false;
        }
        CarregarDrivers();
        await tDiscos;
        if (!ChavePadraoDisponivel) UsarChavePadrao = false;
    }

    // ================================================================ comandos

    public RelayCommand ProximoCommand { get; }
    public RelayCommand VoltarCommand { get; }
    public RelayCommand IrParaEtapaCommand { get; }
    public RelayCommand AtualizarDiscosCommand { get; }
    public RelayCommand AtualizarImagensCommand { get; }
    public RelayCommand AtualizarDriversCommand { get; }
    public RelayCommand CopiarSerialCommand { get; }
    public RelayCommand AlternarChaveCommand { get; }
    public RelayCommand SolicitarInicioCommand { get; }
    public RelayCommand CancelarConfirmacaoCommand { get; }
    public RelayCommand IniciarCommand { get; }
    public RelayCommand ReiniciarCommand { get; }
    public RelayCommand DesligarCommand { get; }
    public RelayCommand AbrirCmdCommand { get; }
    public RelayCommand NovaImplantacaoCommand { get; }
    public RelayCommand FecharCommand { get; }
}

