using System.Text.RegularExpressions;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Input;
using OmniDeploy.ViewModels;

namespace OmniDeploy;

public partial class MainWindow : Window
{
    private readonly MainViewModel _vm;
    private bool _formatandoChave;

    public MainWindow()
    {
        InitializeComponent();
        _vm = new MainViewModel();
        DataContext = _vm;

        Loaded += MainWindow_Loaded;
        Closing += MainWindow_Closing;

        if (Header is not null)
        {
            Header.MouseLeftButtonDown += (s, e) =>
            {
                if (e.LeftButton == MouseButtonState.Pressed)
                    DragMove();
            };
        }

        _vm.Log.CollectionChanged += (s, e) =>
        {
            if (LogList is not null && _vm.Log.Count > 0)
            {
                Dispatcher.BeginInvoke(() =>
                {
                    LogList.ScrollIntoView(_vm.Log[^1]);
                }, System.Windows.Threading.DispatcherPriority.Background);
            }
        };
    }

    private async void MainWindow_Loaded(object sender, RoutedEventArgs e)
    {
        await _vm.InicializarAsync();
    }

    private void MainWindow_Closing(object? sender, System.ComponentModel.CancelEventArgs e)
    {
        if (_vm.Executando)
        {
            var r = MessageBox.Show(
                "A implantação do Windows está em andamento!\n\nFechar agora deixará o disco em estado inconsistente.\nTem certeza que deseja sair?",
                _vm.Titulo,
                MessageBoxButton.YesNo,
                MessageBoxImage.Warning);

            if (r != MessageBoxResult.Yes)
            {
                e.Cancel = true;
            }
        }
    }

    private void TxtChave_TextChanged(object sender, TextChangedEventArgs e)
    {
        if (_formatandoChave || sender is not TextBox tb) return;
        _formatandoChave = true;

        var caret = tb.CaretIndex;
        var textoAntes = tb.Text;
        var raw = new string((tb.Text ?? "").ToUpperInvariant().Where(char.IsLetterOrDigit).Take(25).ToArray());

        var formatted = "";
        for (var i = 0; i < raw.Length; i++)
        {
            if (i > 0 && i % 5 == 0) formatted += "-";
            formatted += raw[i];
        }

        if (textoAntes != formatted)
        {
            tb.Text = formatted;
            tb.CaretIndex = Math.Min(formatted.Length, caret + (formatted.Length - textoAntes.Length));
        }

        _formatandoChave = false;
    }
}

