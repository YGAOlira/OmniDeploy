# 🚀 OmniDeploy (v1.0)
**Desenvolvido por Ygor Paes**

[![Windows 11](https://img.shields.io/badge/Windows%2011-Compatible-0078D4?logo=windows)](https://www.microsoft.com/software-download/windows11)
[![WinPE](https://img.shields.io/badge/WinPE-x64-blue?logo=windows-terminal)](https://learn.microsoft.com/windows-hardware/manufacture/desktop/winpe-intro)
[![Dual Boot](https://img.shields.io/badge/Boot-UEFI%20(GPT)%20%7C%20Legacy%20(MBR)-success)]()
[![.NET 8 WPF](https://img.shields.io/badge/.NET-8.0%20WPF-purple?logo=dotnet)](https://dotnet.microsoft.com/)
[![PowerShell](https://img.shields.io/badge/PowerShell-5.1%2B-blue?logo=powershell)](https://learn.microsoft.com/powershell/)
[![Bypass](https://img.shields.io/badge/Bypass-TPM%202.0%20%7C%20SecureBoot%20%7C%20RAM-orange)]()

Solução completa e automatizada para particionamento, preparação e implantação de imagens do Windows 11 utilizando o **Windows Preinstallation Environment (WinPE x64)**. Possui arquitetura de particionamento híbrido em duas partições (compatível simultaneamente com **UEFI** e **Legacy BIOS**), remoção automática de bloqueios de hardware e um aplicativo desktop moderno desenvolvido em **C# / .NET 8 WPF** (`OmniDeploy.exe`) executado automaticamente logo após o boot.

---

## 📌 Principais Recursos

- **Suporte Híbrido Universal (UEFI + BIOS Legacy):** O pendrive utiliza tabela MBR com partição FAT32 ativa de boot e partição NTFS de dados, inicializando com sucesso tanto em computadores legados quanto em placas-mãe modernas com UEFI e Secure Boot.
- **Superação do Limite de 4 GB do FAT32:** A partição de boot (`OMNI_BOOT`) possui ~1.5 GB em FAT32 apenas para o WinPE, enquanto os arquivos pesados de instalação (`install.wim` ou `install.esd` de 7 GB ou mais) ficam na partição NTFS (`OMNI_DADOS`).
- **Bypass Automático de Requisitos do Windows 11:** Permite a instalação em qualquer máquina sem restrições de **TPM 2.0**, **Secure Boot** ou limite mínimo de **4 GB de RAM**.
- **Interface Gráfica Dedicada no WinPE (`OmniDeploy.exe`):** Sistema interativo desenvolvido em WPF .NET 8 com interface Dark Mode, identificação de hardware via WMI, particionamento de disco em tempo real e barra de progresso DISM com alta precisão.
- **Autocontido e Sem Runtimes Adicionais:** O executável é compilado em arquivo único (`PublishSingleFile`), com suporte a NLS (*National Language Support*) e bibliotecas nativas embutidas, dispensando qualquer instalação de runtimes no WinPE.
- **3 Modos de Implantação Automatizada:** Corporativo (Intune/Autopilot), Bypass (Conta Local Offline) e Zero-Touch (Bancada 100% autônoma).
- **Injeção de Drivers e Scripts Pós-Instalação:** Aplicação transparente de drivers específicos e execução automática de scripts pós-instalação (sincronização de horário NTP e ativação).
- **Atualização Sem Reformatar:** Para atualizar o aplicativo em versões futuras (v1.1, v2.0), basta substituir o executável na partição `OMNI_DADOS\05_App_Sistema\`. Não é necessário refazer o WinPE nem regravar o pendrive.

---

## 🏗️ Arquitetura da Mídia USB

O particionamento híbrido organiza o dispositivo USB em duas partições complementares:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            DISPOSITIVO USB / PENDRIVE                       │
├──────────────────────────────────┬──────────────────────────────────────────┤
│    PARTIÇÃO 1: OMNI_BOOT         │          PARTIÇÃO 2: OMNI_DADOS          │
│    ~1.5 GB | FAT32 | Ativa       │          Restante do espaço | NTFS       │
├──────────────────────────────────┼──────────────────────────────────────────┤
│  • Gerenciador BIOS (bootmgr)    │  • 01_ISOs_Imagens/ (install.wim / .esd) │
│  • Gerenciador UEFI (bootmgr.efi)│  • 02_Drivers/      (drivers .inf)       │
│  • BCD Store (boot/ e efi/)      │  • 03_Scripts/      (scripts pós-inst.)  │
│  • sources/boot.wim (WinPE x64)  │  • 04_Config/       (config.json + XMLs) │
│  • winpeshl.ini (auto-start)     │  • 05_App_Sistema/  (OmniDeploy.exe)     │
└──────────────────────────────────┴──────────────────────────────────────────┘
```

> [!NOTE]
> Essa estrutura resolve a limitação de partições FAT32 (que rejeitam arquivos maiores que 4 GB) sem perder a compatibilidade com placas-mãe UEFI que exigem inicializadores em FAT32.

---

## 📋 Pré-requisitos

Para preparar os arquivos de inicialização do WinPE e gravar o pendrive, você precisará de:

1. **Windows 10 ou Windows 11 (64-bit)** com privilégios de Administrador.
2. **Windows ADK (Assessment and Deployment Kit)** e **WinPE Add-on**:
   - [Baixar Windows ADK (Windows 11)](https://go.microsoft.com/fwlink/?linkid=2271337)
   - [Baixar Complemento do Windows PE (WinPE Add-on)](https://go.microsoft.com/fwlink/?linkid=2271338)
   *(Opcional: Caso o ADK não esteja instalado, o gerador possui modo de extração automática utilizando uma ISO oficial do Windows 11).*
3. **Pendrive USB de no mínimo 16 GB** (recomendado 32 GB ou superior, USB 3.0+).
4. **Imagem de Instalação do Windows:** Arquivo `install.wim` ou `install.esd` (extraído da ISO oficial do Windows 11).
5. **.NET 8 SDK (apenas para desenvolvedores):** Necessário exclusivamente caso deseje compilar ou alterar o código-fonte em `src/OmniDeploy`.

---

## 📁 Estrutura do Repositório

```text
OmniDeploy/
│
├── Gravar_Pendrive.bat               # Executável de 1 clique para gravar o pendrive (com elevação UAC)
├── 2_Gravar_Pendrive.ps1             # Script PowerShell de particionamento híbrido e cópia com verificação
├── 1_Gerar_Base_WinPE.bat            # Atalho com elevação UAC para preparar o ambiente WinPE
├── 1_Gerar_Base_WinPE.ps1            # Gerador e personalizador do WinPE (ADK ou via ISO oficial)
├── preview_omnideploy.html           # Demonstração interativa da interface web do boot
├── .gitignore                        # Regras de exclusão (bloqueia *.wim, *.iso, pasta Build/, etc.)
├── README.md                         # Documentação oficial do projeto
│
├── 01_ISOs_Imagens/                  # Pasta para armazenar o WIM/ESD de instalação (ex: install.wim)
│   └── .gitkeep
│
├── 02_Drivers/                       # Drivers complementares organizados por dispositivo/fabricante
│   └── Lenovo_ThinkPad_Teclado/
│
├── 03_Scripts/                       # Scripts de automação pós-instalação
│   ├── 01_Sincronizar_Horario_NTP.bat # Sincronização forçada com servidores NTP (a.ntp.br)
│   └── 02_Ativar_Windows.bat          # Ativação silenciosa via chave de produto
│
├── 04_Config/                        # Arquivos de configuração e templates unattend
│   ├── config.example.json           # Modelo de configuração (renomeie para config.json)
│   ├── unattend_bypass.xml           # Resposta autounattend para Bypass de conta Microsoft/NRO
│   └── unattend_zerotouch.xml        # Resposta autounattend para implantação Zero-Touch completa
│
├── Build/                            # [Pasta local / Ignorada pelo Git] Diretório de montagem e staging
│   ├── OMNI_BOOT/                    # Arquivos preparados da partição de boot (FAT32)
│   ├── OMNI_DADOS/                   # Arquivos preparados da partição de dados (NTFS)
│   └── Ferramentas/                  # Utilitários auxiliares (bootsect.exe)
│
└── src/
    └── OmniDeploy/                   # Código-fonte C# / .NET 8 WPF da interface de implantação
        ├── App.xaml / App.xaml.cs    # Inicialização da aplicação
        ├── MainWindow.xaml / .cs     # Interface principal com tema escuro e animações
        ├── OmniDeploy.csproj         # Definições de compilação autocontida (x64 single-file)
        ├── Models/                   # Modelos de dados e enumerações
        ├── Services/                 # Camada de serviços (DISM, WMI, ProcessRunner, Environment)
        ├── Themes/                   # Estilos visuais e paleta moderna
        └── ViewModels/               # Regras de apresentação MVVM
```

---

## 🚀 Como Preparar e Usar

### Passo 1: Configurar o Arquivo de Parâmetros
O arquivo `config.json` armazena as configurações do projeto. Crie a sua cópia a partir do modelo de exemplo:

1. Acesse a pasta `04_Config/`.
2. Copie `config.example.json` e salve como `config.json`:
   ```bash
   cp 04_Config/config.example.json 04_Config/config.json
   ```
3. Edite o arquivo com as suas preferências:
   ```json
   {
     "titulo_midia": "OmniDeploy - Mídia de Implantação Windows",
     "versao": "1.0",
     "autor": "Ygor Paes",
     "chave_padrao_windows": "XXXXX-XXXXX-XXXXX-XXXXX-XXXXX",
     "usuario_zerotouch": "SuporteLocal",
     "senha_zerotouch": "",
     "servidor_ntp": "a.ntp.br",
     "fuso_horario": "E. South America Standard Time",
     "tamanho_winre_mb": 1024
   }
   ```

| Propriedade | Descrição |
| :--- | :--- |
| `titulo_midia` | Título exibido no cabeçalho do aplicativo durante o boot. |
| `chave_padrao_windows` | Chave de produto padrão (GVLK ou da sua organização) pré-carregada na tela. |
| `usuario_zerotouch` | Nome do usuário local criado automaticamente no modo Zero-Touch. |
| `senha_zerotouch` | Senha da conta Zero-Touch (deixe vazio para sem senha). |
| `servidor_ntp` | Servidor NTP para sincronização de data e hora (padrão: `a.ntp.br`). |
| `fuso_horario` | Fuso horário do Windows (padrão: `E. South America Standard Time`). |
| `tamanho_winre_mb` | Tamanho da partição de Recuperação do Windows (WinRE) criada no disco alvo. |

> [!WARNING]
> O arquivo `04_Config/config.json` está explicitamente bloqueado no `.gitignore` para garantir que nenhuma chave de produto ou credencial real seja enviada ao GitHub.

---

### Passo 2: Inserir a Imagem do Windows
Coloque o arquivo de imagem do Windows (`install.wim` ou `install.esd`) na pasta:
```text
01_ISOs_Imagens/
```

---

### Passo 3: Preparar a Base WinPE
Execute o script gerador da base de boot:
```cmd
1_Gerar_Base_WinPE.bat
```

**O que este script realiza automaticamente:**
1. Valida a presença do **Windows ADK** e **WinPE Add-on** (ou aciona o modo de extração direta caso utilize uma ISO oficial).
2. Monta o `boot.wim` via DISM.
3. Injeta os pacotes opcionais do WinPE necessários:
   - `WinPE-WMI` (consulta de hardware e partições)
   - `WinPE-NetFX` e `WinPE-Scripting`
   - `WinPE-PowerShell`
   - `WinPE-StorageWMI` e `WinPE-DismCmdlets`
4. Configura o inicializador `winpeshl.ini` e o script `startnet_omnideploy.cmd` para localizar dinamicamente a partição `OMNI_DADOS` e abrir o `OmniDeploy.exe` logo no primeiro boot.
5. Salva e desmonta a imagem para a pasta `Build/OMNI_BOOT`.

---

### Passo 4: Gravar o Pendrive com 1 Clique
1. Conecte o pendrive USB ao computador (mínimo de 16 GB).
2. Dê um duplo clique no arquivo:
   ```cmd
   Gravar_Pendrive.bat
   ```
3. O script solicitará permissões de Administrador (UAC) automaticamente.
4. Identifique o número do disco USB correspondente ao seu pendrive na lista interativa.
5. Digite exatamente `SIM` para confirmar a formatação do dispositivo.
6. O script executará de forma sequencial:
   - Limpeza e criação da partição 1 (`OMNI_BOOT`, 1.5 GB FAT32, Ativa).
   - Criação da partição 2 (`OMNI_DADOS`, NTFS, restante do espaço).
   - Aplicação de código de boot MBR via `bootsect.exe /nt60 /mbr`.
   - Cópia segura dos arquivos com `Robocopy`.
   - Checagem automática de integridade dos arquivos gravados.

---

## 🛠️ Modos de Implantação Disponíveis no App

Ao dar boot pelo pendrive em qualquer equipamento, o sistema abre a interface gráfica do **OmniDeploy**. Estão disponíveis 3 modos de trabalho:

| Modo | Descrição | Comportamento no OOBE (1º Boot) |
| :--- | :--- | :--- |
| **Corporativo / Intune** | Implantação limpa sem arquivo de resposta | Apresenta a experiência OOBE original da Microsoft, pronta para registro em **Microsoft Entra ID** ou **Windows Autopilot / Intune**. |
| **Bypass / Conta Local** | Injeta `unattend_bypass.xml` e habilita `BypassNRO` | Suprime a exigência de conectividade de rede e conta Microsoft, permitindo a criação de um usuário local offline diretamente na instalação. |
| **Zero-Touch Bancada** | Injeta `unattend_zerotouch.xml` | Instalação 100% autônoma: cria o usuário local definido em `config.json`, pula todas as perguntas do OOBE e faz login direto no Desktop. |

---

## 💻 Compilando o Código-Fonte (`src/OmniDeploy`)

Caso deseje personalizar a interface ou implementar novos recursos no aplicativo:

1. Certifique-se de ter o [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0) instalado.
2. Navegue até a pasta do projeto:
   ```bash
   cd src/OmniDeploy
   ```
3. Compile e publique o executável autocontido otimizado para WinPE:
   ```bash
   dotnet publish -c Release -r win-x64 --self-contained
   ```
4. O arquivo gerado estará em:
   ```text
   src/OmniDeploy/bin/Release/net8.0-windows/win-x64/publish/OmniDeploy.exe
   ```
5. Copie o novo executável para a partição `OMNI_DADOS\05_App_Sistema\OmniDeploy.exe` do pendrive já gravado.

---

## 🛡️ Segurança e Publicação no GitHub

Este repositório foi estruturado com as melhores práticas de segurança para versionamento:

- **`.gitignore` Rigoroso:** Bloqueia imagens pesadas (`*.wim`, `*.esd`, `*.iso`), a pasta local `Build/`, diretórios de compilação (`bin/`, `obj/`, `.vs/`) e pacotes Node.js.
- **Proteção de Credenciais:** O arquivo `04_Config/config.json` nunca é versionado, sendo substituído publicamente pelo modelo limpo `04_Config/config.example.json`.
- **Integridade da Estrutura:** As pastas `01_ISOs_Imagens/` e `04_Config/` utilizam marcadores `.gitkeep` para manter a arquitetura pronta para novos clones sem expor arquivos pesados ou dados sensíveis.

---

## 👤 Autor

Desenvolvido por **Ygor Paes**.

---

## 📄 Licença

Este projeto é disponibilizado para uso livre, corporativo, técnico e educacional. Sinta-se à vontade para contribuir, sugerir melhorias ou adaptar a solução às suas necessidades.
