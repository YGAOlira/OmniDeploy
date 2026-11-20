using System.Management;
using OmniDeploy.Models;

namespace OmniDeploy.Services;

/// <summary>Consultas WMI de hardware e discos.</summary>
public static class WmiService
{
    private static string S(object? o) => (o?.ToString() ?? "").Trim();

    private static IEnumerable<ManagementObject> Query(string wql, string scope = @"root\cimv2")
    {
        using var searcher = new ManagementObjectSearcher(new ManagementScope(scope), new ObjectQuery(wql));
        searcher.Options.Timeout = TimeSpan.FromSeconds(20);
        foreach (ManagementObject mo in searcher.Get())
            yield return mo;
    }

    public static HardwareInfo GetHardware()
    {
        var hw = new HardwareInfo();

        try
        {
            foreach (var mo in Query("SELECT Manufacturer, Model, TotalPhysicalMemory FROM Win32_ComputerSystem"))
            {
                hw.Fabricante = S(mo["Manufacturer"]);
                hw.Modelo = S(mo["Model"]);
                if (ulong.TryParse(S(mo["TotalPhysicalMemory"]), out var tot))
                    hw.MemoriaRam = $"{Math.Round(tot / 1024d / 1024d / 1024d, 1):0.#} GB";
                break;
            }
        }
        catch { }

        // Lenovo grava o nome comercial (ex.: "ThinkPad T14 Gen 2") em Win32_ComputerSystemProduct.Version
        try
        {
            foreach (var mo in Query("SELECT Version, Name FROM Win32_ComputerSystemProduct"))
            {
                var ver = S(mo["Version"]);
                if (!string.IsNullOrWhiteSpace(ver) && !ver.Equals("None", StringComparison.OrdinalIgnoreCase) &&
                    ver.Any(char.IsLetter) && !ver.Contains("To be filled", StringComparison.OrdinalIgnoreCase))
                    hw.ModeloAmigavel = ver;
                break;
            }
        }
        catch { }

        try
        {
            ulong soma = 0;
            foreach (var mo in Query("SELECT Capacity FROM Win32_PhysicalMemory"))
                if (ulong.TryParse(S(mo["Capacity"]), out var c)) soma += c;
            if (soma > 0)
                hw.MemoriaRam = $"{soma / 1024d / 1024d / 1024d:0.#} GB";
        }
        catch { }

        try
        {
            var cpus = Query("SELECT Name, NumberOfCores, NumberOfLogicalProcessors FROM Win32_Processor").ToList();
            if (cpus.Count > 0)
            {
                var c = cpus[0];
                var nome = System.Text.RegularExpressions.Regex.Replace(S(c["Name"]), @"\s+", " ");
                var cores = S(c["NumberOfCores"]);
                var threads = S(c["NumberOfLogicalProcessors"]);
                hw.Processador = string.IsNullOrEmpty(cores) ? nome : $"{nome}  ({cores}C/{threads}T)";
                if (cpus.Count > 1) hw.Processador += $"  x{cpus.Count}";
            }
        }
        catch { }

        try
        {
            foreach (var mo in Query("SELECT SerialNumber, SMBIOSBIOSVersion FROM Win32_BIOS"))
            {
                hw.NumeroSerie = S(mo["SerialNumber"]);
                hw.VersaoBios = S(mo["SMBIOSBIOSVersion"]);
                break;
            }
        }
        catch { }

        if (string.IsNullOrWhiteSpace(hw.NumeroSerie)) hw.NumeroSerie = "—";
        if (string.IsNullOrWhiteSpace(hw.Fabricante)) hw.Fabricante = "—";
        return hw;
    }

    /// <summary>Número do disco físico que contém a letra informada (ex.: "D:").</summary>
    public static int? GetDiskNumberOfLetter(string letra)
    {
        if (string.IsNullOrWhiteSpace(letra) || letra.Length < 1) return null;
        var l = letra[0];

        try
        {
            foreach (var mo in Query($"SELECT DiskNumber FROM MSFT_Partition WHERE DriveLetter = '{l}'", @"root\Microsoft\Windows\Storage"))
                if (int.TryParse(S(mo["DiskNumber"]), out var n)) return n;
        }
        catch { }

        try
        {
            foreach (var part in Query($"ASSOCIATORS OF {{Win32_LogicalDisk.DeviceID='{l}:'}} WHERE AssocClass=Win32_LogicalDiskToPartition"))
                if (int.TryParse(S(part["DiskIndex"]), out var n)) return n;
        }
        catch { }

        return null;
    }

    private static string BusTypeName(int bus) => bus switch
    {
        1 => "SCSI", 2 => "ATAPI", 3 => "ATA", 4 => "IEEE 1394", 5 => "SSA", 6 => "Fibre Channel",
        7 => "USB", 8 => "RAID", 9 => "iSCSI", 10 => "SAS", 11 => "SATA", 12 => "SD", 13 => "MMC",
        15 => "File Backed Virtual", 16 => "Storage Spaces", 17 => "NVMe", _ => ""
    };

    /// <summary>
    /// Lista discos físicos. Usa MSFT_Disk (WinPE-StorageWMI) e cai para Win32_DiskDrive.
    /// </summary>
    public static List<DiskInfo> GetDisks()
    {
        var lista = new List<DiskInfo>();
        try
        {
            foreach (var mo in Query("SELECT Number, FriendlyName, Model, Size, BusType, PartitionStyle, IsSystem, IsBoot FROM MSFT_Disk",
                         @"root\Microsoft\Windows\Storage"))
            {
                var d = new DiskInfo
                {
                    Numero = Convert.ToInt32(mo["Number"]),
                    Modelo = S(mo["FriendlyName"]) is { Length: > 0 } fn ? fn : S(mo["Model"]),
                    TamanhoBytes = Convert.ToUInt64(mo["Size"] ?? 0UL),
                    Barramento = mo["BusType"] is null ? "" : BusTypeName(Convert.ToInt32(mo["BusType"])),
                    EstiloParticao = mo["PartitionStyle"] is null ? "" : Convert.ToInt32(mo["PartitionStyle"]) switch
                    {
                        1 => "MBR", 2 => "GPT", _ => "Não inicializado"
                    },
                    Sistema = mo["IsSystem"] is bool s && s,
                    Boot = mo["IsBoot"] is bool b && b
                };
                lista.Add(d);
            }

            try
            {
                foreach (var mo in Query("SELECT DeviceId, MediaType FROM MSFT_PhysicalDisk", @"root\Microsoft\Windows\Storage"))
                {
                    if (!int.TryParse(S(mo["DeviceId"]), out var id)) continue;
                    var disk = lista.FirstOrDefault(x => x.Numero == id);
                    if (disk is null) continue;
                    disk.Midia = Convert.ToInt32(mo["MediaType"] ?? 0) switch { 3 => "HDD", 4 => "SSD", 5 => "SCM", _ => "" };
                }
            }
            catch { }
        }
        catch
        {
            lista.Clear();
        }

        if (lista.Count == 0)
        {
            try
            {
                foreach (var mo in Query("SELECT Index, Model, Size, InterfaceType, MediaType FROM Win32_DiskDrive"))
                {
                    lista.Add(new DiskInfo
                    {
                        Numero = Convert.ToInt32(mo["Index"]),
                        Modelo = S(mo["Model"]),
                        TamanhoBytes = Convert.ToUInt64(mo["Size"] ?? 0UL),
                        Barramento = S(mo["InterfaceType"]) switch { "IDE" => "ATA/SATA", var x => x },
                        Midia = S(mo["MediaType"]).Contains("Removable", StringComparison.OrdinalIgnoreCase) ? "Removível" : ""
                    });
                }
            }
            catch { }
        }

        return lista.Where(d => d.TamanhoBytes > 0).OrderBy(d => d.Numero).ToList();
    }
}

