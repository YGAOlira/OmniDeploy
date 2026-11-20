using System.IO;
using System.Text;
using System.Windows;
using System.Windows.Interop;
using System.Windows.Media;
using System.Windows.Threading;

namespace OmniDeploy;

public partial class App : Application
{
    protected override void OnStartup(StartupEventArgs e)
    {
        // WinPE não possui aceleração DirectX completa: renderização por software garante compatibilidade.
        RenderOptions.ProcessRenderMode = RenderMode.SoftwareOnly;
        Encoding.RegisterProvider(CodePagesEncodingProvider.Instance);

        DispatcherUnhandledException += OnUiException;
        AppDomain.CurrentDomain.UnhandledException += (_, a) => GravarErro(a.ExceptionObject as Exception);
        TaskScheduler.UnobservedTaskException += (_, a) => { GravarErro(a.Exception); a.SetObserved(); };

        base.OnStartup(e);
        var w = new MainWindow();
        MainWindow = w;
        w.Show();
    }

    private static void OnUiException(object sender, DispatcherUnhandledExceptionEventArgs e)
    {
        GravarErro(e.Exception);
        MessageBox.Show("Erro inesperado:\n\n" + e.Exception.Message + "\n\nDetalhes gravados em %TEMP%\\OmniDeploy_erro.log",
            "OmniDeploy - Mídia de Implantação", MessageBoxButton.OK, MessageBoxImage.Error);
        e.Handled = true;
    }

    internal static void GravarErro(Exception? ex)
    {
        if (ex is null) return;
        try
        {
            File.AppendAllText(Path.Combine(Path.GetTempPath(), "OmniDeploy_erro.log"),
                $"[{DateTime.Now:dd/MM/yyyy HH:mm:ss}] {ex}{Environment.NewLine}{Environment.NewLine}");
        }
        catch { }
    }
}

