using System.Globalization;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Data;
using System.Windows.Media;
using OmniDeploy.Models;

namespace OmniDeploy.Ui;

public sealed class BoolToVisibilityConverter : IValueConverter
{
    public bool Invert { get; set; }

    public object Convert(object value, Type targetType, object parameter, CultureInfo culture)
    {
        var b = value is bool v && v;
        if (Invert) b = !b;
        return b ? Visibility.Visible : Visibility.Collapsed;
    }

    public object ConvertBack(object value, Type targetType, object parameter, CultureInfo culture)
        => throw new NotSupportedException();
}

public sealed class InverseBoolConverter : IValueConverter
{
    public object Convert(object value, Type targetType, object parameter, CultureInfo culture) => !(value is bool b && b);
    public object ConvertBack(object value, Type targetType, object parameter, CultureInfo culture) => !(value is bool b && b);
}

/// <summary>Visível quando o valor inteiro (etapa atual) é igual ao parâmetro.</summary>
public sealed class StepVisibilityConverter : IValueConverter
{
    public object Convert(object value, Type targetType, object parameter, CultureInfo culture)
        => value is int i && int.TryParse(parameter?.ToString(), out var p) && i == p ? Visibility.Visible : Visibility.Collapsed;

    public object ConvertBack(object value, Type targetType, object parameter, CultureInfo culture)
        => throw new NotSupportedException();
}

public sealed class NullToVisibilityConverter : IValueConverter
{
    public bool Invert { get; set; }

    public object Convert(object value, Type targetType, object parameter, CultureInfo culture)
    {
        var vazio = value is null || (value is string s && string.IsNullOrWhiteSpace(s)) || (value is int n && n == 0);
        if (Invert) vazio = !vazio;
        return vazio ? Visibility.Collapsed : Visibility.Visible;
    }

    public object ConvertBack(object value, Type targetType, object parameter, CultureInfo culture)
        => throw new NotSupportedException();
}

public sealed class LogLevelBrushConverter : IValueConverter
{
    private static readonly Dictionary<LogLevel, Brush> Cores = new()
    {
        [LogLevel.Info] = Freeze(new SolidColorBrush(Color.FromRgb(0xCB, 0xD5, 0xE1))),
        [LogLevel.Comando] = Freeze(new SolidColorBrush(Color.FromRgb(0x7D, 0xD3, 0xFC))),
        [LogLevel.Sucesso] = Freeze(new SolidColorBrush(Color.FromRgb(0x34, 0xD3, 0x99))),
        [LogLevel.Aviso] = Freeze(new SolidColorBrush(Color.FromRgb(0xFB, 0xBF, 0x24))),
        [LogLevel.Erro] = Freeze(new SolidColorBrush(Color.FromRgb(0xF8, 0x71, 0x71))),
        [LogLevel.Etapa] = Freeze(new SolidColorBrush(Color.FromRgb(0xA5, 0xB4, 0xFC))),
        [LogLevel.Saida] = Freeze(new SolidColorBrush(Color.FromRgb(0x8C, 0x9A, 0xB3))),
    };

    private static Brush Freeze(SolidColorBrush b) { b.Freeze(); return b; }

    public object Convert(object value, Type targetType, object parameter, CultureInfo culture)
        => value is LogLevel l && Cores.TryGetValue(l, out var b) ? b : Cores[LogLevel.Info];

    public object ConvertBack(object value, Type targetType, object parameter, CultureInfo culture)
        => throw new NotSupportedException();
}

public sealed class LogLevelWeightConverter : IValueConverter
{
    public object Convert(object value, Type targetType, object parameter, CultureInfo culture)
        => value is LogLevel.Etapa or LogLevel.Erro or LogLevel.Sucesso ? FontWeights.SemiBold : FontWeights.Normal;

    public object ConvertBack(object value, Type targetType, object parameter, CultureInfo culture)
        => throw new NotSupportedException();
}

public sealed class HexBrushConverter : IValueConverter
{
    public object Convert(object value, Type targetType, object parameter, CultureInfo culture)
    {
        try { return new BrushConverter().ConvertFromString(value?.ToString() ?? "#3B82F6") as Brush ?? Brushes.SteelBlue; }
        catch { return Brushes.SteelBlue; }
    }

    public object ConvertBack(object value, Type targetType, object parameter, CultureInfo culture)
        => throw new NotSupportedException();
}

/// <summary>Painel horizontal que distribui a largura proporcionalmente ao Peso de cada PartitionSegment.</summary>
public sealed class ProportionalPanel : Panel
{
    private static double Peso(UIElement e)
        => (e as FrameworkElement)?.DataContext is PartitionSegment s && s.Peso > 0 ? s.Peso : 1;

    protected override Size MeasureOverride(Size availableSize)
    {
        double h = 0;
        var total = InternalChildren.Cast<UIElement>().Sum(Peso);
        var w = double.IsInfinity(availableSize.Width) ? 600 : availableSize.Width;
        foreach (UIElement c in InternalChildren)
        {
            c.Measure(new Size(w * Peso(c) / Math.Max(total, 1), availableSize.Height));
            h = Math.Max(h, c.DesiredSize.Height);
        }
        return new Size(w, h);
    }

    protected override Size ArrangeOverride(Size finalSize)
    {
        var total = InternalChildren.Cast<UIElement>().Sum(Peso);
        double x = 0;
        foreach (UIElement c in InternalChildren)
        {
            var w = finalSize.Width * Peso(c) / Math.Max(total, 1);
            c.Arrange(new Rect(x, 0, w, finalSize.Height));
            x += w;
        }
        return finalSize;
    }
}

