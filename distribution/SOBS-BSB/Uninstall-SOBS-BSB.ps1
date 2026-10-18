$ErrorActionPreference = 'Stop'
$installPath = Join-Path $env:LOCALAPPDATA 'SOBS BSB'
$desktopPath = [Environment]::GetFolderPath('DesktopDirectory')
$shortcutPath = Join-Path $desktopPath 'SOBS.lnk'
$uninstallKey = 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall\SOBS-BSB'

if (Test-Path -LiteralPath $shortcutPath) {
  Remove-Item -LiteralPath $shortcutPath -Force
}
if (Test-Path -LiteralPath $uninstallKey) {
  Remove-Item -LiteralPath $uninstallKey -Recurse -Force
}
if (Test-Path -LiteralPath $installPath) {
  $cleanupCommand = 'timeout /t 2 /nobreak >nul & rmdir /s /q "' + $installPath + '"'
  Start-Process -FilePath $env:ComSpec -ArgumentList @('/d', '/c', $cleanupCommand) -WindowStyle Hidden
}
