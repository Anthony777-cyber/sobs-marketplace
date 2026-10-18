$ErrorActionPreference = 'Stop'

$sourcePath = $PSScriptRoot
$installPath = Join-Path $env:LOCALAPPDATA 'SOBS BSB'
$desktopPath = [Environment]::GetFolderPath('DesktopDirectory')
$shortcutPath = Join-Path $desktopPath 'SOBS.lnk'
$requiredFiles = @('SOBS BSB.html', 'SOBS-BSB.ico', 'SOBS-BSB-Blank-Template.xlsx')

foreach ($file in $requiredFiles) {
  if (-not (Test-Path -LiteralPath (Join-Path $sourcePath $file))) {
    throw "The installer package is missing $file. Extract the complete ZIP before running the installer."
  }
}

New-Item -ItemType Directory -Path $installPath -Force | Out-Null
foreach ($file in $requiredFiles) {
  Copy-Item -LiteralPath (Join-Path $sourcePath $file) -Destination (Join-Path $installPath $file) -Force
}

$shell = New-Object -ComObject WScript.Shell
$shortcut = $shell.CreateShortcut($shortcutPath)
$shortcut.TargetPath = Join-Path $installPath 'SOBS BSB.html'
$shortcut.WorkingDirectory = $installPath
$shortcut.IconLocation = (Join-Path $installPath 'SOBS-BSB.ico') + ',0'
$shortcut.Description = 'SOBS Bulk Spreadsheet Builder'
$shortcut.Save()

Start-Process -FilePath $shortcut.TargetPath
