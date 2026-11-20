using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;
using OmniDeploy.Models;

namespace OmniDeploy.Services;

/// <summary>
/// Motor de implantação: diskpart → DISM /Apply-Image → WinRE → bcdboot → drivers → registro offline →
/// unattend → SetupComplete.cmd.
/// </summary>
public sealed class DeployEngine
{
    private readonly DeployPlan _p;
    private readonly Action<LogLevel, string> _log;
    private readonly Action<double, string> _progress;
    private readonly CancellationToken _ct;

    private char _letraWin, _letraSys, _letraRec;
    private string Win => $"{_letraWin}:";
    private string WinDir => $@"{_letraWin}:\Windows";
    private string OmniDir => $@"{_letraWin}:\Windows\Setup\Scripts\OmniDeploy";

    private static readonly Regex RxPercent = new(@"(\d{1,3}(?:[.,]\d+)?)\s*%", RegexOptions.Compiled);
    private static readonly Regex RxRegAdd = new(@"^\s*@?\s*reg(\.exe)?\s+add\s+(.+)$", RegexOptions.IgnoreCase | RegexOptions.Compiled);

    public DeployEngine(DeployPlan plan, Action<LogLevel, string> log, Action<double, string> progress, CancellationToken ct)
    {
        _p = plan;
        _log = log;
        _progress = progress;
        _ct = ct;
    }

    // ---------------------------------------------------------------- execução principal

    public async Task RunAsync()
    {
        _progress(0, "Preparando");
        _log(LogLevel.Etapa, "═══ INÍCIO DA IMPLANTAÇÃO ═══");
        _log(LogLevel.Info, $"Disco de destino: {_p.Disco.Numero} — {_p.Disco.Modelo} ({_p.Disco.TamanhoTexto})");
        _log(LogLevel.Info, $"Modo de boot: {(_p.Uefi ? "UEFI (GPT)" : "Legacy (MBR)")}");
        _log(LogLevel.Info, $"Imagem: {_p.ArquivoImagem}  |  Índice {_p.Edicao.Indice} — {_p.Edicao.Nome}");
        _log(LogLevel.Info, $"Modo de implantação: {ModoTexto(_p.Modo)}");

        if (!File.Exists(_p.ArquivoImagem))
            throw new FileNotFoundException("Arquivo de imagem não encontrado.", _p.ArquivoImagem);

        _letraWin = EnvironmentService.GetFreeLetter('W');
        _letraSys = EnvironmentService.GetFreeLetter('S', _letraWin);
        _letraRec = EnvironmentService.GetFreeLetter('R', _letraWin, _letraSys);
        _log(LogLevel.Info, $"Letras temporárias: Windows={_letraWin}:  Sistema={_letraSys}:  Recuperação={_letraRec}:");

        await EtapaDiskpart();       // 2 → 8
        await EtapaAplicarImagem();  // 8 → 80
        if (_p.Uefi) await EtapaWinRe(); // 80 → 84
        await EtapaBcdboot();        // 84 → 88
        await EtapaDrivers();        // 88 → 93
        await EtapaRegistroOffline();// 93 → 95
        EtapaUnattend();             // 95 → 97
        EtapaSetupComplete();        // 97 → 99

        _progress(100, "Concluído");
        _log(LogLevel.Sucesso, "═══ IMPLANTAÇÃO CONCLUÍDA COM SUCESSO ═══");
        _log(LogLevel.Info, "Remova o pendrive (opcional) e reinicie o computador para iniciar o Windows.");
    }

    public static string ModoTexto(DeployMode m) => m switch
    {
        DeployMode.Intune => "Corporativo / Intune (OOBE limpo)",
        DeployMode.Bypass => "Bypass / Conta Local",
        DeployMode.ZeroTouch => "Zero-Touch Bancada",
        _ => m.ToString()
    };

    // ---------------------------------------------------------------- etapas

    public static string BuildDiskpartScript(int disco, bool uefi, char win, char sys, char rec, int winReMb)
    {
        var sb = new StringBuilder();
        sb.AppendLine($"select disk {disco}");
        sb.AppendLine("online disk noerr");
        sb.AppendLine("attributes disk clear readonly noerr");
        sb.AppendLine("clean");
        if (uefi)
        {
            sb.AppendLine("convert gpt");
            sb.AppendLine("create partition efi size=100");
            sb.AppendLine("format quick fs=fat32 label=\"System\"");
            sb.AppendLine($"assign letter={sys}");
            sb.AppendLine("create partition msr size=16");
            sb.AppendLine("create partition primary");
            sb.AppendLine($"shrink minimum={winReMb}");
            sb.AppendLine("format quick fs=ntfs label=\"Windows\"");
            sb.AppendLine($"assign letter={win}");
            sb.AppendLine("create partition primary");
            sb.AppendLine("format quick fs=ntfs label=\"Recovery\"");
            sb.AppendLine($"assign letter={rec}");
            sb.AppendLine("set id=\"de94bba4-06d1-4d40-a16a-bfd50179d6ac\"");
            sb.AppendLine("gpt attributes=0x8000000000000001");
        }
        else
        {
            sb.AppendLine("convert mbr");
            sb.AppendLine("create partition primary size=100");
            sb.AppendLine("format quick fs=ntfs label=\"Reservado pelo Sistema\"");
            sb.AppendLine($"assign letter={sys}");
            sb.AppendLine("active");
            sb.AppendLine("create partition primary");
            sb.AppendLine("format quick fs=ntfs label=\"Windows\"");
            sb.AppendLine($"assign letter={win}");
        }
        sb.AppendLine("list volume");
        sb.AppendLine("exit");
        return sb.ToString();
    }

    private async Task EtapaDiskpart()
    {
        _progress(2, "Particionando disco");
        _log(LogLevel.Etapa, $"[1/8] DISKPART — criando layout {(_p.Uefi ? "GPT (EFI + MSR + Windows + WinRE)" : "MBR (Reservado + Windows)")}");

        var winRe = Math.Clamp(_p.Config.TamanhoWinReMb, 500, 4096);
        var script = BuildDiskpartScript(_p.Disco.Numero, _p.Uefi, _letraWin, _letraSys, _letraRec, winRe);
        var arq = Path.Combine(Path.GetTempPath(), "omni_diskpart.txt");
        await File.WriteAllTextAsync(arq, script, Encoding.ASCII, _ct);
        foreach (var l in script.Split('\n', StringSplitOptions.RemoveEmptyEntries))
            _log(LogLevel.Comando, "diskpart> " + l.Trim());

        var code = await ProcessRunner.RunAsync("diskpart.exe", $"/s \"{arq}\"", l => _log(LogLevel.Saida, l), _ct);
        if (code != 0)
            throw new InvalidOperationException($"DISKPART falhou (código {code}). Verifique se o disco não está protegido ou em uso.");

        for (var i = 0; i < 20 && !Directory.Exists(Win + "\\"); i++)
            await Task.Delay(500, _ct);
        if (!Directory.Exists(Win + "\\"))
            throw new InvalidOperationException($"A partição Windows ({Win}) não ficou disponível após o DISKPART.");

        _log(LogLevel.Sucesso, "Disco particionado e formatado.");
        _progress(8, "Disco preparado");
    }

    private async Task EtapaAplicarImagem()
    {
        _log(LogLevel.Etapa, "[2/8] DISM — aplicando imagem do Windows (pode levar vários minutos)");
        _progress(8, "Aplicando imagem");

        var args = $"/English /Apply-Image /ImageFile:\"{_p.ArquivoImagem}\" /Index:{_p.Edicao.Indice} /ApplyDir:{Win}\\";
        _log(LogLevel.Comando, "dism " + args);

        var ultimoLog = -10.0;
        var code = await ProcessRunner.RunAsync("dism.exe", args, l =>
        {
            var m = RxPercent.Match(l);
            if (l.Contains('[') && m.Success &&
                double.TryParse(m.Groups[1].Value.Replace(',', '.'), NumberStyles.Float, CultureInfo.InvariantCulture, out var pct))
            {
                _progress(8 + pct * 0.72, $"Aplicando imagem — {pct:0.0}%");
                if (pct - ultimoLog >= 10 || pct >= 100)
                {
                    ultimoLog = pct;
                    _log(LogLevel.Saida, $"Progresso DISM: {pct:0.0}%");
                }
            }
            else if (!string.IsNullOrWhiteSpace(l))
            {
                _log(LogLevel.Saida, l);
            }
        }, _ct);

        if (code != 0)
            throw new InvalidOperationException($"DISM /Apply-Image falhou (código {code}).");
        if (!Directory.Exists(WinDir))
            throw new InvalidOperationException("A pasta Windows não foi encontrada após aplicar a imagem.");

        _log(LogLevel.Sucesso, "Imagem aplicada com sucesso.");
        _progress(80, "Imagem aplicada");
    }

    private async Task EtapaWinRe()
    {
        _log(LogLevel.Etapa, "[3/8] WinRE — configurando ambiente de recuperação");
        try
        {
            var origem = Path.Combine(WinDir, @"System32\Recovery\Winre.wim");
            if (!File.Exists(origem))
            {
                _log(LogLevel.Aviso, "Winre.wim não encontrado na imagem. Etapa ignorada.");
                return;
            }

            var destDir = $@"{_letraRec}:\Recovery\WindowsRE";
            Directory.CreateDirectory(destDir);
            var destino = Path.Combine(destDir, "Winre.wim");
            File.SetAttributes(origem, FileAttributes.Normal);
            File.Copy(origem, destino, true);
            _log(LogLevel.Info, $"Winre.wim copiado para {destDir}");

            var reagent = Path.Combine(WinDir, @"System32\Reagentc.exe");
            var exe = File.Exists(reagent) ? reagent : "reagentc.exe";
            var a = $"/Setreimage /Path {destDir} /Target {WinDir}";
            _log(LogLevel.Comando, "reagentc " + a);
            var code = await ProcessRunner.RunAsync(exe, a, l => _log(LogLevel.Saida, l), _ct);
            if (code == 0) _log(LogLevel.Sucesso, "WinRE registrado.");
            else _log(LogLevel.Aviso, $"reagentc retornou {code}. O Windows tentará configurar o WinRE no primeiro boot.");
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            _log(LogLevel.Aviso, "Falha não crítica ao configurar WinRE: " + ex.Message);
        }
        finally
        {
            _progress(84, "WinRE");
        }
    }

    private async Task EtapaBcdboot()
    {
        _log(LogLevel.Etapa, $"[4/8] BCDBOOT — gravando arquivos de inicialização ({(_p.Uefi ? "UEFI" : "BIOS")})");
        var bcd = Path.Combine(WinDir, @"System32\bcdboot.exe");
        var exe = File.Exists(bcd) ? bcd : "bcdboot.exe";
        var args = $"{WinDir} /s {_letraSys}: /f {(_p.Uefi ? "UEFI" : "BIOS")} /l pt-BR";
        _log(LogLevel.Comando, "bcdboot " + args);
        var code = await ProcessRunner.RunAsync(exe, args, l => _log(LogLevel.Saida, l), _ct);
        if (code != 0)
        {
            _log(LogLevel.Aviso, $"bcdboot retornou {code}. Tentando novamente sem /l…");
            code = await ProcessRunner.RunAsync(exe, $"{WinDir} /s {_letraSys}: /f {(_p.Uefi ? "UEFI" : "BIOS")}", l => _log(LogLevel.Saida, l), _ct);
            if (code != 0) throw new InvalidOperationException($"BCDBOOT falhou (código {code}).");
        }
        _log(LogLevel.Sucesso, "Inicialização configurada.");
        _progress(88, "Boot configurado");
    }

    private readonly List<(string Pasta, string Arquivo)> _scriptsDrivers = new();

    private async Task EtapaDrivers()
    {
        _log(LogLevel.Etapa, "[5/8] DRIVERS — injeção sob demanda");
        if (_p.Drivers.Count == 0)
        {
            _log(LogLevel.Info, "Nenhum pacote de driver selecionado.");
            _progress(93, "Drivers");
            return;
        }

        var scratch = Path.Combine(Win + "\\", "OmniDeploy_Scratch");
        Directory.CreateDirectory(scratch);
        var passo = 5.0 / _p.Drivers.Count;
        var atual = 88.0;

        foreach (var d in _p.Drivers)
        {
            _ct.ThrowIfCancellationRequested();
            _log(LogLevel.Info, $"Pacote: {d.Nome}");
            _progress(atual, $"Drivers — {d.Nome}");

            var infs = Directory.EnumerateFiles(d.Caminho, "*.inf", SearchOption.AllDirectories).Any();
            if (infs)
            {
                var args = $"/English /Image:{Win}\\ /ScratchDir:\"{scratch}\" /Add-Driver /Driver:\"{d.Caminho}\" /Recurse";
                _log(LogLevel.Comando, "dism " + args);
                var code = await ProcessRunner.RunAsync("dism.exe", args, l =>
                {
                    if (!(l.Contains('[') && RxPercent.IsMatch(l))) _log(LogLevel.Saida, l);
                }, _ct);
                if (code == 0) _log(LogLevel.Sucesso, $"Drivers de '{d.Nome}' injetados.");
                else _log(LogLevel.Aviso, $"DISM /Add-Driver retornou {code} para '{d.Nome}'.");
            }

            // Scripts e .reg dentro da pasta de driver: aplicados offline e reexecutados no SetupComplete.
            var extras = Directory.EnumerateFiles(d.Caminho, "*.*", SearchOption.AllDirectories)
                .Where(f => f.EndsWith(".bat", StringComparison.OrdinalIgnoreCase) ||
                            f.EndsWith(".cmd", StringComparison.OrdinalIgnoreCase) ||
                            f.EndsWith(".reg", StringComparison.OrdinalIgnoreCase))
                .ToList();
            if (extras.Count > 0)
            {
                var destBase = Path.Combine(OmniDir, "Drivers", d.Nome);
                foreach (var f in extras)
                {
                    var rel = Path.GetRelativePath(d.Caminho, f);
                    var dest = Path.Combine(destBase, rel);
                    Directory.CreateDirectory(Path.GetDirectoryName(dest)!);
                    File.Copy(f, dest, true);
                    _scriptsDrivers.Add((d.Nome, Path.Combine("Drivers", d.Nome, rel)));
                    _log(LogLevel.Info, $"Script/registro '{rel}' agendado para o SetupComplete.");
                }
            }
            atual += passo;
        }

        try { Directory.Delete(scratch, true); } catch { }
        _progress(93, "Drivers concluídos");
    }

    private async Task EtapaRegistroOffline()
    {
        _log(LogLevel.Etapa, "[6/8] REGISTRO OFFLINE — ajustes aplicados direto na imagem");
        const string sysKey = @"HKLM\OMNI_OFF_SYSTEM";
        const string swKey = @"HKLM\OmniDeploy_OFF_SOFTWARE";
        var sysHive = Path.Combine(WinDir, @"System32\config\SYSTEM");
        var swHive = Path.Combine(WinDir, @"System32\config\SOFTWARE");

        var okSys = await Reg($"load {sysKey} \"{sysHive}\"") == 0;
        var okSw = await Reg($"load {swKey} \"{swHive}\"") == 0;
        try
        {
            if (okSys)
            {
                // Sem bloqueios de TPM/CPU em futuras atualizações in-place
                await Reg($@"add ""{sysKey}\Setup\MoSetup"" /v AllowUpgradesWithUnsupportedTPMOrCPU /t REG_DWORD /d 1 /f");
                await Reg($@"add ""{sysKey}\Setup\LabConfig"" /v BypassTPMCheck /t REG_DWORD /d 1 /f");
                await Reg($@"add ""{sysKey}\Setup\LabConfig"" /v BypassSecureBootCheck /t REG_DWORD /d 1 /f");
                await Reg($@"add ""{sysKey}\Setup\LabConfig"" /v BypassRAMCheck /t REG_DWORD /d 1 /f");
            }
            if (okSw && _p.Modo is DeployMode.Bypass or DeployMode.ZeroTouch)
                await Reg($@"add ""{swKey}\Microsoft\Windows\CurrentVersion\OOBE"" /v BypassNRO /t REG_DWORD /d 1 /f");

            // Linhas "reg add" (HKLM\SYSTEM / HKLM\SOFTWARE) dos scripts de driver → aplicadas offline
            foreach (var (_, rel) in _scriptsDrivers)
            {
                var caminho = Path.Combine(OmniDir, rel);
                if (caminho.EndsWith(".reg", StringComparison.OrdinalIgnoreCase))
                {
                    var conteudo = TraduzirChaves(await File.ReadAllTextAsync(caminho, _ct), sysKey, swKey, longo: true);
                    var tmp = Path.Combine(Path.GetTempPath(), "omnideploy_offline_" + Guid.NewGuid().ToString("N") + ".reg");
                    await File.WriteAllTextAsync(tmp, conteudo, Encoding.Unicode, _ct);
                    var c = await Reg($"import \"{tmp}\"");
                    _log(c == 0 ? LogLevel.Sucesso : LogLevel.Aviso, $"Importação offline de {Path.GetFileName(caminho)}: código {c}");
                    try { File.Delete(tmp); } catch { }
                }
                else
                {
                    foreach (var linha in await File.ReadAllLinesAsync(caminho, _ct))
                    {
                        var m = RxRegAdd.Match(linha);
                        if (!m.Success) continue;
                        var argsOrig = m.Groups[2].Value.Trim();
                        var traduzido = TraduzirChaves(argsOrig, sysKey, swKey, longo: false);
                        if (traduzido == argsOrig) continue; // não é HKLM\SYSTEM nem HKLM\SOFTWARE
                        if (!traduzido.Contains("/f", StringComparison.OrdinalIgnoreCase)) traduzido += " /f";
                        var c = await Reg("add " + traduzido);
                        _log(c == 0 ? LogLevel.Sucesso : LogLevel.Aviso,
                            $"Ajuste offline de {Path.GetFileName(caminho)} aplicado (código {c}) — ativo já no primeiro boot.");
                    }
                }
            }
        }
        finally
        {
            GC.Collect();
            if (okSys) await Reg($"unload {sysKey}");
            if (okSw) await Reg($"unload {swKey}");
        }
        if (!okSys || !okSw) _log(LogLevel.Aviso, "Não foi possível carregar todas as hives offline. Os ajustes serão feitos pelo SetupComplete.");
        _progress(95, "Registro offline");
    }

    private static string TraduzirChaves(string texto, string sysKey, string swKey, bool longo)
    {
        var sysLong = sysKey.Replace("HKLM", "HKEY_LOCAL_MACHINE");
        var swLong = swKey.Replace("HKLM", "HKEY_LOCAL_MACHINE");
        string R(string s, string pattern, string rep) => Regex.Replace(s, pattern, rep.Replace("$", "$$"), RegexOptions.IgnoreCase);

        foreach (var prefixo in new[] { "HKEY_LOCAL_MACHINE", "HKLM" })
        {
            var sysDest = prefixo == "HKLM" && !longo ? sysKey : sysLong;
            var swDest = prefixo == "HKLM" && !longo ? swKey : swLong;
            texto = R(texto, $@"{prefixo}\\SYSTEM\\CurrentControlSet", sysDest + @"\ControlSet001");
            texto = R(texto, $@"{prefixo}\\SYSTEM(?=\\|""|\]|\s|$)", sysDest);
            texto = R(texto, $@"{prefixo}\\SOFTWARE(?=\\|""|\]|\s|$)", swDest);
        }
        return texto;
    }

    private async Task<int> Reg(string args)
    {
        _log(LogLevel.Comando, "reg " + args);
        return await ProcessRunner.RunAsync("reg.exe", args, l =>
        {
            if (!string.IsNullOrWhiteSpace(l)) _log(LogLevel.Saida, l);
        }, _ct);
    }

    private void EtapaUnattend()
    {
        _log(LogLevel.Etapa, "[7/8] UNATTEND — modo " + ModoTexto(_p.Modo));
        var panther = Path.Combine(WinDir, "Panther");

        if (_p.Modo == DeployMode.Intune)
        {
            _log(LogLevel.Info, "Modo Corporativo/Intune: nenhum unattend injetado. OOBE limpo, pronto para Entra ID / Autopilot.");
            _progress(97, "Unattend");
            return;
        }

        var nome = _p.Modo == DeployMode.Bypass ? "unattend_bypass.xml" : "unattend_zerotouch.xml";
        var origem = Path.Combine(_p.RaizDados, EnvironmentService.PastaConfig, nome);
        if (!File.Exists(origem))
            throw new FileNotFoundException($"Template {nome} não encontrado em 04_Config.", origem);

        var xml = File.ReadAllText(origem, Encoding.UTF8)
            .Replace("{{USUARIO}}", System.Security.SecurityElement.Escape(_p.Config.UsuarioZeroTouch))
            .Replace("{{SENHA}}", System.Security.SecurityElement.Escape(_p.Config.SenhaZeroTouch))
            .Replace("{{FUSO_HORARIO}}", System.Security.SecurityElement.Escape(_p.Config.FusoHorario));

        Directory.CreateDirectory(panther);
        var destino = Path.Combine(panther, "unattend.xml");
        File.WriteAllText(destino, xml, new UTF8Encoding(false));
        _log(LogLevel.Sucesso, $"{nome} injetado em {destino}");
        if (_p.Modo == DeployMode.ZeroTouch)
            _log(LogLevel.Info, $"Usuário local que será criado: {_p.Config.UsuarioZeroTouch}");
        _progress(97, "Unattend");
    }

    private void EtapaSetupComplete()
    {
        _log(LogLevel.Etapa, "[8/8] PÓS-INSTALAÇÃO — gerando SetupComplete.cmd");
        Directory.CreateDirectory(OmniDir);
        Directory.CreateDirectory(Path.Combine(OmniDir, "Logs"));

        var scriptsSrc = Path.Combine(_p.RaizDados, EnvironmentService.PastaScripts);
        if (Directory.Exists(scriptsSrc))
        {
            foreach (var f in Directory.EnumerateFiles(scriptsSrc))
                File.Copy(f, Path.Combine(OmniDir, Path.GetFileName(f)), true);
        }

        var conteudo = BuildSetupComplete(_p, _scriptsDrivers.Select(s => s.Arquivo).ToList());
        var dest = Path.Combine(WinDir, @"Setup\Scripts\SetupComplete.cmd");
        File.WriteAllText(dest, conteudo, Encoding.ASCII);
        _log(LogLevel.Sucesso, $"SetupComplete.cmd gerado em {dest}");
        foreach (var l in conteudo.Split('\n'))
        {
            var t = l.TrimEnd('\r');
            if (t.Contains("Ativar_Windows", StringComparison.OrdinalIgnoreCase) && _p.ChaveWindows.Length > 5)
                t = t.Replace(_p.ChaveWindows, MascararChave(_p.ChaveWindows));
            if (!string.IsNullOrWhiteSpace(t)) _log(LogLevel.Saida, "  " + t);
        }

        // Registro da implantação
        try
        {
            var resumo = new StringBuilder()
                .AppendLine($"OmniDeploy - Mídia de Implantação v{_p.Config.Versao} — {DateTime.Now:dd/MM/yyyy HH:mm:ss}")
                .AppendLine($"Equipamento: {_p.Hardware.FabricanteModelo}")
                .AppendLine($"Número de série: {_p.Hardware.NumeroSerie}")
                .AppendLine($"Imagem: {Path.GetFileName(_p.ArquivoImagem)} [{_p.Edicao.Indice}] {_p.Edicao.Nome}")
                .AppendLine($"Modo: {ModoTexto(_p.Modo)} | Boot: {(_p.Uefi ? "UEFI/GPT" : "Legacy/MBR")}")
                .AppendLine($"Drivers: {string.Join(", ", _p.Drivers.Select(d => d.Nome))}")
                .ToString();
            File.WriteAllText(Path.Combine(OmniDir, "Logs", "Omni_Implantacao.txt"), resumo, Encoding.UTF8);
        }
        catch { }

        _progress(99, "Pós-instalação");
    }

    public static string MascararChave(string chave)
    {
        var partes = chave.Split('-');
        if (partes.Length != 5) return new string('•', Math.Max(0, chave.Length));
        return $"{partes[0]}-•••••-•••••-•••••-{partes[4]}";
    }

    public static string BuildSetupComplete(DeployPlan p, IReadOnlyList<string> scriptsDrivers)
    {
        var sb = new StringBuilder();
        sb.AppendLine("@echo off");
        sb.AppendLine($"REM ==================================================================");
        sb.AppendLine($"REM  SetupComplete.cmd - Midia de Formatacao OmniDeploy v{p.Config.Versao}");
        sb.AppendLine($"REM  Gerado automaticamente pelo OmniDeploy em {DateTime.Now:dd/MM/yyyy HH:mm}");
        sb.AppendLine($"REM  Desenvolvido por {p.Config.Autor}");
        sb.AppendLine($"REM ==================================================================");
        sb.AppendLine("setlocal");
        sb.AppendLine("set \"OmniDeploy=%WINDIR%\\Setup\\Scripts\\OmniDeploy\"");
        sb.AppendLine("if not exist \"%OmniDeploy%\\Logs\" mkdir \"%OmniDeploy%\\Logs\"");
        sb.AppendLine("set \"LOG=%OmniDeploy%\\Logs\\SetupComplete.log\"");
        sb.AppendLine("echo [%DATE% %TIME%] Inicio do SetupComplete OmniDeploy >> \"%LOG%\"");
        sb.AppendLine();

        if (scriptsDrivers.Count > 0)
        {
            sb.AppendLine("REM ---- Ajustes dos pacotes de drivers ----");
            foreach (var s in scriptsDrivers)
            {
                if (s.EndsWith(".reg", StringComparison.OrdinalIgnoreCase))
                    sb.AppendLine($"reg import \"%OmniDeploy%\\{s}\" >> \"%LOG%\" 2>&1");
                else
                    sb.AppendLine($"call \"%OmniDeploy%\\{s}\" < nul >> \"%LOG%\" 2>&1");
            }
            sb.AppendLine();
        }

        if (p.SincronizarNtp)
        {
            sb.AppendLine("REM ---- Sincronizacao de horario (NTP) ----");
            sb.AppendLine($"call \"%OmniDeploy%\\01_Sincronizar_Horario_NTP.bat\" \"{p.Config.ServidorNtp}\" >> \"%LOG%\" 2>&1");
            sb.AppendLine();
        }

        if (p.AtivarWindows && !string.IsNullOrWhiteSpace(p.ChaveWindows))
        {
            sb.AppendLine("REM ---- Ativacao do Windows ----");
            sb.AppendLine($"call \"%OmniDeploy%\\02_Ativar_Windows.bat\" \"{p.ChaveWindows}\" >> \"%LOG%\" 2>&1");
            sb.AppendLine();
        }

        sb.AppendLine("echo [%DATE% %TIME%] Fim do SetupComplete OmniDeploy >> \"%LOG%\"");
        sb.AppendLine("REM Remove este arquivo (contem a chave de ativacao)");
        sb.AppendLine("del /f /q \"%~f0\" >nul 2>&1");
        sb.AppendLine("exit /b 0");
        return sb.ToString();
    }
}

