RequestExecutionLevel admin
!macro customInit
  ; Initialize the plugins directory (this sets $PLUGINSDIR to a temporary directory)
  InitPluginsDir
  ; Create a custom directory for extraction in the user's AppData folder
  CreateDirectory "$APPDATA\POS1Temp"
  ; Check if the directory was created successfully
  IfFileExists "$APPDATA\POS1Temp" +2 0
  MessageBox MB_OK|MB_ICONEXCLAMATION "Failed to create temporary directory. Please ensure you have write permissions in $APPDATA."
!macroend
!macro customInstall
  ; Ensure the installation directory is set
  SetOutPath "$INSTDIR"
  ; Since electron-builder handles file extraction, we can add custom installation steps here if needed
  ; For example, create additional directories or set permissions
  CreateDirectory "$INSTDIR\logs"
  CreateDirectory "$INSTDIR\backups"
  ; ENHANCED: Version-based data reset in installer (complements runtime logic)
  ; Runs as admin, so handles perms issues. Targets per-user AppData for current installer user.
  ; Check for existing version.txt in user's AppData and reset if version changed.
  ; This ensures fresh start even if runtime reset fails (e.g., due to locks).
  Push $0
  Push $1
  Push $2
  ReadRegStr $0 HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\POS1" "DisplayVersion"
  StrCmp $0 "" freshInstall ; No old version in registry
  StrCmp $0 "${VERSION}" noReset ; Versions match
  ; Version changed: Reset userData (delete all except version.txt)
  StrCpy $1 "$APPDATA\POS1" ; userData path
  IfFileExists "$1\version.txt" 0 freshInstall
  FileOpen $2 "$1\version.txt" r
  FileRead $2 $0
  FileClose $2
  StrCpy $0 $0 -2 ; Trim newline
  StrCmp $0 "${VERSION}" noReset
  ; Delete contents
  RMDir /r "$1\*.*" ; Recursive delete (NSIS wildcard)
  RMDir "$1" ; Try to remove dir (will fail if locked, but contents gone)
  CreateDirectory "$1" ; Recreate empty
  FileOpen $2 "$1\version.txt" w
  FileWrite $2 "${VERSION}"
  FileClose $2
  ; LogSet on ; REMOVED: Causes NSIS_CONFIG_LOG error
  ; LogText "Installer reset userData for version ${VERSION}" ; REMOVED: Non-essential
  Goto done
  freshInstall:
  CreateDirectory "$1"
  FileOpen $2 "$1\version.txt" w
  FileWrite $2 "${VERSION}"
  FileClose $2
  ; LogText "Fresh install: Created userData with version ${VERSION}" ; REMOVED
  Goto done
  noReset:
  ; LogText "No reset needed: Version ${VERSION} unchanged" ; REMOVED
  done:
  Pop $2
  Pop $1
  Pop $0
!macroend
!macro customUnInit
  ; Clean up the custom temp directory after installation
  RMDir /r "$APPDATA\POS1Temp"
!macroend