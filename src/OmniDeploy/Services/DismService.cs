using System.Text;
using System.Text.RegularExpressions;
using System.Xml.Linq;
using OmniDeploy.Models;

namespace OmniDeploy.Services;

/// <summary>Leitura das edições de um WIM/ESD via DISM (com leitura direta do XML do WIM como contingência).</summary>
public static class DismService
{
    private static readonly Regex RxIndex = new(@"^\s*(Index|[IÍ]ndice|\S*ndice)\s*:\s*(\d+)", RegexOptions.IgnoreCase);
    private static readonly Regex RxName = new(@"^\s*(Name|Nome)\s*:\s*(.*)$", RegexOptions.IgnoreCase);
    private static readonly Regex RxDesc = new(@"^\s*(Description|Descri\S*o)\s*:\s*(.*)$", RegexOptions.IgnoreCase);
    private static readonly Regex RxSize = new(@"^\s*(Size|Tamanho)\s*:\s*(.*)$", RegexOptions.IgnoreCase);

    public static async Task<(List<ImageEdition> Edicoes, string Fonte)> GetEditionsAsync(string imageFile, Action<string>? log = null)
    {
        try
        {
            var (code, saida) = await ProcessRunner.CaptureAsync("dism.exe", $"/English /Get-WimInfo /WimFile:\"{imageFile}\"");
            if (code == 0)
            {
                var lista = ParseDism(saida);
                if (lista.Count > 0) return (lista, "DISM");
            }
            log?.Invoke($"DISM /Get-WimInfo retornou código {code}. Usando leitura direta do cabeçalho WIM.");
        }
        catch (Exception ex)
        {
            log?.Invoke($"Falha ao executar DISM ({ex.Message}). Usando leitura direta do cabeçalho WIM.");
        }

        var viaXml = await Task.Run(() => ReadWimXml(imageFile));
        return (viaXml, "Metadados WIM");
    }

    public static List<ImageEdition> ParseDism(string saida)
    {
        var lista = new List<ImageEdition>();
        ImageEdition? atual = null;
        foreach (var raw in saida.Split('\n'))
        {
            var l = raw.TrimEnd('\r');
            Match m;
            if ((m = RxIndex.Match(l)).Success)
            {
                atual = new ImageEdition { Indice = int.Parse(m.Groups[2].Value) };
                lista.Add(atual);
            }
            else if (atual is not null && (m = RxName.Match(l)).Success) atual.Nome = m.Groups[2].Value.Trim();
            else if (atual is not null && (m = RxDesc.Match(l)).Success) atual.Descricao = m.Groups[2].Value.Trim();
            else if (atual is not null && (m = RxSize.Match(l)).Success) atual.Tamanho = FormatSize(m.Groups[2].Value);
        }
        return lista;
    }

    private static string FormatSize(string bruto)
    {
        var digitos = new string(bruto.Where(char.IsDigit).ToArray());
        return ulong.TryParse(digitos, out var b) && b > 0 ? $"{b / 1024d / 1024d / 1024d:0.0} GB" : bruto.Trim();
    }

    /// <summary>Lê o recurso XML embutido no arquivo WIM/ESD (não exige privilégios nem DISM).</summary>
    public static List<ImageEdition> ReadWimXml(string file)
    {
        var lista = new List<ImageEdition>();
        using var fs = new FileStream(file, FileMode.Open, FileAccess.Read, FileShare.ReadWrite);
        using var br = new BinaryReader(fs);
        var magic = Encoding.ASCII.GetString(br.ReadBytes(8));
        if (!magic.StartsWith("MSWIM", StringComparison.Ordinal))
            throw new InvalidDataException("O arquivo não é um WIM/ESD válido.");

        fs.Position = 72; // rhXmlData
        var sizeAndFlags = br.ReadUInt64();
        var offset = br.ReadInt64();
        var size = (long)(sizeAndFlags & 0x00FFFFFFFFFFFFFFUL);
        if (size <= 0 || offset <= 0 || offset + size > fs.Length)
            throw new InvalidDataException("Metadados XML do WIM não encontrados.");

        fs.Position = offset;
        var bytes = br.ReadBytes((int)size);
        var xml = Encoding.Unicode.GetString(bytes).TrimStart('\uFEFF').TrimEnd('\0');
        var doc = XDocument.Parse(xml);

        foreach (var img in doc.Root!.Elements("IMAGE"))
        {
            var ed = new ImageEdition
            {
                Indice = int.TryParse((string?)img.Attribute("INDEX"), out var i) ? i : lista.Count + 1,
                Nome = (string?)img.Element("DISPLAYNAME") ?? (string?)img.Element("NAME") ?? "",
                Descricao = (string?)img.Element("DISPLAYDESCRIPTION") ?? (string?)img.Element("DESCRIPTION") ?? "",
            };
            var nome = (string?)img.Element("NAME");
            if (!string.IsNullOrWhiteSpace(nome)) ed.Nome = nome;
            if (ulong.TryParse((string?)img.Element("TOTALBYTES"), out var tb))
                ed.Tamanho = $"{tb / 1024d / 1024d / 1024d:0.0} GB";
            var edId = (string?)img.Element("WINDOWS")?.Element("EDITIONID");
            if (!string.IsNullOrWhiteSpace(edId) && !ed.Descricao.Contains(edId, StringComparison.OrdinalIgnoreCase))
                ed.Descricao = string.IsNullOrWhiteSpace(ed.Descricao) ? edId : $"{ed.Descricao}  ({edId})";
            lista.Add(ed);
        }
        return lista.OrderBy(e => e.Indice).ToList();
    }
}

